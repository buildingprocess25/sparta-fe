"use client";

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  BadgeCheck,
  Sparkles,
  Clock,
  AlertTriangle,
  Layers,
  Calendar,
  Hammer,
  Package,
  CheckCircle2,
  FileText,
  DollarSign,
  Building2,
  MapPin,
  Settings2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import ReactSelect, { SingleValue } from 'react-select';
import { Input } from '@/components/ui/input';
import { PengajuanHargaItem, KoefisienDetailItem, DAFTAR_CABANG_ALFAMART, HargaCabangItem } from './types';
import { getTrialBadgeInfo } from './trial-utils';
import { RincianSurvei3TokoCard } from './RincianSurvei3TokoCard';
import { PengajuanTimelineBar } from './PengajuanTimelineBar';
import { updateHargaCabangPengajuan } from './store';

interface BranchOption {
  value: string;
  label: string;
}

interface DetailMasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
  onItemUpdated?: (updatedItem: PengajuanHargaItem) => void;
}

export function DetailMasterCatalogModal({
  isOpen,
  onClose,
  item,
  onItemUpdated,
}: DetailMasterCatalogModalProps) {
  const [branchPricing, setBranchPricing] = React.useState<HargaCabangItem[]>([]);
  const [isAddingBranch, setIsAddingBranch] = React.useState(false);
  const [newBranchName, setNewBranchName] = React.useState('');
  const [newBranchPrice, setNewBranchPrice] = React.useState<number>(0);
  const [editingBranchName, setEditingBranchName] = React.useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = React.useState<number>(0);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setIsAddingBranch(false);
      setEditingBranchName(null);
      setNewBranchName('');
      setSaveSuccess(false);
      const existing = item.hargaPerCabang || [];
      const basePrice = item.hargaRataRata || item.estimasiHarga || 100000;
      setNewBranchPrice(basePrice);
      const merged: HargaCabangItem[] = DAFTAR_CABANG_ALFAMART.map((c) => {
        const found = existing.find((e) => e.cabang.toLowerCase() === c.toLowerCase());
        if (found) return found;
        return {
          cabang: c,
          harga: basePrice,
          status: 'NONAKTIF',
        };
      });
      setBranchPricing(merged);
    }
  }, [item]);

  const activeBranches = React.useMemo(() => {
    return branchPricing.filter((b) => b.status === 'AKTIF');
  }, [branchPricing]);

  const availableBranchesToAdd = React.useMemo(() => {
    const activeNames = new Set(activeBranches.map((b) => b.cabang.toLowerCase()));
    return DAFTAR_CABANG_ALFAMART.filter((c) => !activeNames.has(c.toLowerCase()));
  }, [activeBranches]);

  const branchOptions: BranchOption[] = React.useMemo(() => {
    return availableBranchesToAdd.map((c) => ({
      value: c,
      label: `Cabang ${c}`,
    }));
  }, [availableBranchesToAdd]);

  const selectedBranchOption = React.useMemo(() => {
    return branchOptions.find((opt) => opt.value === newBranchName) || null;
  }, [branchOptions, newBranchName]);

  const handleAddBranchSubmit = () => {
    if (!item || !newBranchName) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated = branchPricing.map((b) => {
      if (b.cabang.toLowerCase() === newBranchName.toLowerCase()) {
        return {
          ...b,
          status: 'AKTIF' as const,
          harga: newBranchPrice > 0 ? newBranchPrice : (item.hargaRataRata || item.estimasiHarga || 0),
          tanggalUpdate: now,
        };
      }
      return b;
    });

    const res = updateHargaCabangPengajuan(item.id, updated);
    setBranchPricing(updated);
    setIsAddingBranch(false);
    setNewBranchName('');
    setSaveSuccess(true);
    if (res && onItemUpdated) {
      onItemUpdated(res);
    }
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRemoveBranch = (cabangName: string) => {
    if (!item) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated = branchPricing.map((b) =>
      b.cabang.toLowerCase() === cabangName.toLowerCase()
        ? { ...b, status: 'NONAKTIF' as const, tanggalUpdate: now }
        : b
    );
    const res = updateHargaCabangPengajuan(item.id, updated);
    setBranchPricing(updated);
    setSaveSuccess(true);
    if (res && onItemUpdated) {
      onItemUpdated(res);
    }
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleStartEditPrice = (branch: HargaCabangItem) => {
    setEditingBranchName(branch.cabang);
    setEditingPriceVal(branch.harga);
  };

  const handleSaveEditPrice = (cabangName: string) => {
    if (!item) return;
    const now = new Date().toISOString().slice(0, 10);
    const updated = branchPricing.map((b) =>
      b.cabang.toLowerCase() === cabangName.toLowerCase()
        ? { ...b, harga: editingPriceVal, tanggalUpdate: now }
        : b
    );
    const res = updateHargaCabangPengajuan(item.id, updated);
    setBranchPricing(updated);
    setEditingBranchName(null);
    setSaveSuccess(true);
    if (res && onItemUpdated) {
      onItemUpdated(res);
    }
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!item) return null;

  const isTrial =
    Boolean(item.isTrial) ||
    item.status === 'TRIAL_RELEASED' ||
    item.status.startsWith('TRIAL_PROMOSI_');

  const trialBadge = isTrial ? getTrialBadgeInfo(item) : null;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const finalPrice = item.hargaRataRata || item.estimasiHarga || 0;

  const upahList: KoefisienDetailItem[] = item.koefisienUpahItems || [];
  const materialList: KoefisienDetailItem[] = item.koefisienMaterialItems || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 md:p-7 bg-slate-50 border border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isTrial
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{isTrial ? 'Rincian Item Trial' : 'Rincian Master Resmi'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Kode Master: <strong>{item.kodeMaster || item.kode}</strong> &bull; {item.item}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              {isTrial && trialBadge ? (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold select-none ${trialBadge.badgeClass}`}
                >
                  {trialBadge.label}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white select-none">
                  Master Resmi
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Alur Satu Kolom Vertikal (Senior-Friendly) */}
        <div className="space-y-5 py-3">
          {/* Bar Timeline Pengajuan */}
          <PengajuanTimelineBar item={item} />

          {/* =========================================================================
              1. SPESIFIKASI MATERIAL (Fisik tanpa satuan unit)
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className={`w-5 h-5 rounded-md text-white text-xs font-bold flex items-center justify-center ${
                  isTrial ? 'bg-purple-600' : 'bg-emerald-600'
                }`}>
                  1
                </span>
                <span>Spesifikasi Material</span>
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-medium">
                {item.kategori || 'Material'}
              </Badge>
            </div>

            {/* Grid Parameter Spesifikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Nama Material:</span>
                <span className="font-bold text-slate-900 text-sm md:text-base">{item.item || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Merk:</span>
                <span className="font-bold text-slate-800">{item.merk || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Ukuran:</span>
                <span className="font-bold text-slate-800">{item.ukuran || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Warna &amp; Tipe:</span>
                <span className="font-semibold text-slate-800">
                  {item.warna || '-'} {item.tipe ? `(${item.tipe})` : ''}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Tebal:</span>
                <span className="font-semibold text-slate-800">{item.tebal || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Toleransi:</span>
                <span className="font-semibold text-slate-800">{item.toleransi || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Finishing:</span>
                <span className="font-semibold text-slate-800">{item.permukaan || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Kode Master:</span>
                <span className="font-mono font-bold text-blue-700">{item.kodeMaster || item.kode}</span>
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Posisi Pasang:</span>
                <span className="font-semibold text-slate-800">{item.implementasi || '-'}</span>
              </div>
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Lokasi Gerai:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                  {item.lokasi || '-'}
                </span>
              </div>
            </div>

            {/* Deskripsi Standar */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">
                Deskripsi Standar:
              </span>
              <p className="text-xs md:text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-mono">
                {item.deskripsiOtomatis || '-'}
              </p>
            </div>
          </div>

          {/* =========================================================================
              2. ALASAN
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className={`w-5 h-5 rounded-md text-white text-xs font-bold flex items-center justify-center ${
                  isTrial ? 'bg-purple-600' : 'bg-emerald-600'
                }`}>
                  2
                </span>
                <span>Alasan</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {isTrial ? 'Alasan Uji Coba Lapangan' : 'Dasar Penetapan Master'}
              </span>
            </div>

            <div className={`rounded-xl border p-4 space-y-2 ${
              isTrial ? 'bg-purple-50/60 border-purple-200' : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium italic">
                &ldquo;{item.alasanTrial || item.trialCatatanEvaluasi || 'Material telah disetujui sesuai standar spesifikasi Alfamart.'}&rdquo;
              </p>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
                <span>Status: <strong>{isTrial ? 'Masa Uji Coba 3 Bulan' : 'Master Resmi Permanen (Aktif)'}</strong></span>
                <span>Toko: <strong>{item.lokasi || 'Nasional'}</strong></span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. RINCIAN KOEFISIEN / SURVEI TOKO
              ========================================================================= */}
          {isTrial && (upahList.length > 0 || materialList.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Rincian Koefisien AHSP</span>
                </h3>
              </div>

              {/* Upah */}
              {upahList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-blue-800">
                    <Hammer className="w-4 h-4 text-blue-600" />
                    <span>A. Upah Tenaga Kerja</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                        <tr>
                          <th className="px-3.5 py-2.5 font-bold">Uraian Upah</th>
                          <th className="px-3 py-2.5 text-center font-bold">Satuan</th>
                          <th className="px-3.5 py-2.5 text-right font-bold">Harga Satuan</th>
                          <th className="px-3 py-2.5 text-center font-bold">Koefisien</th>
                          <th className="px-3.5 py-2.5 text-right font-bold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {upahList.map((u: KoefisienDetailItem, i: number) => {
                          const val = Number(u.value) || 0;
                          const price = u.hargaAcuan || 0;
                          const sub = u.subtotal !== undefined ? u.subtotal : Math.round(val * price);
                          return (
                            <tr key={u.id || i} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-2.5 font-semibold text-slate-900">{u.label}</td>
                              <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-xs">{u.unit}</td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-slate-700">{formatRupiah(price)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">{u.value}</td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(sub)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Material */}
              {materialList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-purple-800">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>B. Bahan / Material</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                        <tr>
                          <th className="px-3.5 py-2.5 font-bold">Uraian Material</th>
                          <th className="px-3 py-2.5 text-center font-bold">Satuan</th>
                          <th className="px-3.5 py-2.5 text-right font-bold">Harga Satuan</th>
                          <th className="px-3 py-2.5 text-center font-bold">Koefisien</th>
                          <th className="px-3.5 py-2.5 text-right font-bold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {materialList.map((m: KoefisienDetailItem, i: number) => {
                          const val = Number(m.value) || 0;
                          const price = m.hargaAcuan || 0;
                          const sub = m.subtotal !== undefined ? m.subtotal : Math.round(val * price);
                          return (
                            <tr key={m.id || i} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.label}</td>
                              <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-xs">{m.unit}</td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-slate-700">{formatRupiah(price)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-700">{m.value}</td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(sub)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jika Master Resmi Reguler dengan Survei 3 Toko */}
          {!isTrial && item.surveyToko && item.surveyToko.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Hasil Survei Pasar (3 Toko)</span>
                </h3>
              </div>
              <RincianSurvei3TokoCard
                mode="readonly"
                surveyToko={item.surveyToko}
                satuan={item.satuan}
                materialCode={item.kodeMaster || item.kode}
                materialName={`${item.item} ${item.ukuran} ${item.merk}`}
              />
            </div>
          )}

          {/* =========================================================================
              4. RINGKASAN BIAYA
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className={`w-5 h-5 rounded-md text-white text-xs font-bold flex items-center justify-center ${
                  isTrial ? 'bg-purple-600' : 'bg-emerald-600'
                }`}>
                  4
                </span>
                <span>Ringkasan Biaya</span>
              </h3>
            </div>

            {/* Banner Angka Besar & Kontras Tinggi */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Total Harga <span className="text-[10px] text-slate-400 lowercase">+ Margin</span>
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className={`text-2xl md:text-3xl font-black font-mono block tracking-tight ${
                  isTrial ? 'text-purple-300' : 'text-emerald-400'
                }`}>
                  {formatRupiah(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              5. AKTIVASI & PENETAPAN HARGA CABANG (HANYA CABANG AKTIF)
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md text-white text-xs font-bold flex items-center justify-center ${
                      isTrial ? 'bg-purple-600' : 'bg-emerald-600'
                    }`}
                  >
                    5
                  </span>
                  <span>Cabang Aktif</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar cabang yang aktif menggunakan master material ini beserta harga satuan lokalnya.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tersimpan!
                  </span>
                )}
                {!isAddingBranch && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsAddingBranch(true);
                      setNewBranchName(availableBranchesToAdd[0] || '');
                      setNewBranchPrice(item.hargaRataRata || item.estimasiHarga || 0);
                    }}
                    disabled={availableBranchesToAdd.length === 0}
                    className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 font-semibold cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Cabang Aktif</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Form Tambah Cabang Aktif Baru (Muncul saat tombol tambah diklik) */}
            {isAddingBranch && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Aktifkan Cabang Baru &amp; Input Harga</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingBranch(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Field Cabang (Combo Box) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Pilih Cabang <span className="text-red-500">*</span>
                    </label>
                    <ReactSelect<BranchOption>
                      value={selectedBranchOption}
                      onChange={(option: SingleValue<BranchOption>) => {
                        setNewBranchName(option ? option.value : '');
                      }}
                      options={branchOptions}
                      placeholder="Cari &amp; pilih cabang..."
                      isClearable
                      isSearchable
                      noOptionsMessage={() => "Semua cabang sudah aktif"}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: '36px',
                          height: '36px',
                          borderRadius: '0.5rem',
                          borderColor: state.isFocused ? '#2563eb' : '#bfdbfe',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          fontSize: '0.75rem',
                          backgroundColor: '#ffffff',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          zIndex: 9999,
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                          overflow: 'hidden',
                        }),
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                        option: (base, state) => ({
                          ...base,
                          fontSize: '0.75rem',
                          backgroundColor: state.isSelected
                            ? '#2563eb'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#ffffff',
                          color: state.isSelected ? '#ffffff' : '#1e293b',
                          cursor: 'pointer',
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: '0 8px',
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          height: '34px',
                        }),
                      }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    />
                  </div>

                  {/* Field Harga Satuan Cabang */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Harga Satuan Master Cabang (Rp) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={newBranchPrice || ''}
                        onChange={(e) => setNewBranchPrice(Number(e.target.value) || 0)}
                        placeholder="Contoh: 85000"
                        className="h-9 bg-white rounded-lg text-xs font-mono font-bold border-blue-200"
                      />
                      <span className="text-slate-500 text-xs shrink-0 font-medium">
                        / {item.satuan || 'm2'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingBranch(false)}
                    className="h-8 text-xs px-3 rounded-lg text-slate-600 bg-white cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddBranchSubmit}
                    disabled={!newBranchName}
                    className="h-8 text-xs px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Tabel Cabang yang Aktif */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {activeBranches.length === 0 ? (
                <div className="py-8 px-4 text-center bg-slate-50/50">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-slate-600">
                    Belum ada cabang yang diaktifkan untuk master material ini.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik tombol <strong>&ldquo;Tambah Cabang Aktif&rdquo;</strong> di atas untuk menetapkan cabang dan harga daerah.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold">
                    <tr>
                      <th className="px-3.5 py-2.5">Cabang Aktif</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Harga Satuan Cabang</th>
                      <th className="px-3.5 py-2.5 text-center">Terakhir Diperbarui</th>
                      <th className="px-3 py-2.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeBranches.map((b) => {
                      const isEditingThisPrice = editingBranchName === b.cabang;
                      return (
                        <tr key={b.cabang} className="bg-white hover:bg-slate-50 transition-colors">
                          {/* Cabang */}
                          <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Cabang {b.cabang}</span>
                            </div>
                          </td>

                          {/* Status (Solid Badge Tanpa Ikon) */}
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white select-none">
                              Aktif
                            </span>
                          </td>

                          {/* Harga Satuan Cabang */}
                          <td className="px-3.5 py-2.5 text-right font-mono">
                            {isEditingThisPrice ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-slate-400 text-xs">Rp</span>
                                <input
                                  type="number"
                                  value={editingPriceVal}
                                  onChange={(e) => setEditingPriceVal(Number(e.target.value) || 0)}
                                  className="w-28 text-right px-2 py-1 rounded border border-blue-300 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditPrice(b.cabang)}
                                  className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                                  title="Simpan Harga"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingBranchName(null)}
                                  className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300 text-xs">
                                  {formatRupiah(b.harga)}{' '}
                                  <span className="font-normal text-[10px] text-slate-500">
                                    / {item.satuan || 'm2'}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditPrice(b)}
                                  className="w-6 h-6 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Ubah Harga Cabang"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Tanggal Pembaruan */}
                          <td className="px-3.5 py-2.5 text-center text-slate-400 text-[11px] font-mono">
                            {b.tanggalUpdate || '-'}
                          </td>

                          {/* Aksi Hapus / Nonaktifkan */}
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBranch(b.cabang)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center cursor-pointer transition-colors"
                              title="Nonaktifkan Cabang Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* =========================================================================
              6. CATATAN & RIWAYAT PERSETUJUAN
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-md text-white text-xs font-bold flex items-center justify-center ${
                    isTrial ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}
                >
                  6
                </span>
                <span>Riwayat</span>
              </h3>
              <span className="text-xs text-slate-400">
                {(item.historyLog || []).length} Riwayat Tercatat
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(item.historyLog || []).length === 0 ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  Belum ada catatan riwayat log.
                </p>
              ) : (
                (item.historyLog || []).map((log, i) => (
                  <div
                    key={i}
                    className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.role}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white font-semibold">
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{log.catatan || '-'}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">{log.tanggal}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {isTrial && trialBadge?.isActionRequired && (
              <Link href="/pengajuan-harga/sb-specialist">
                <Button
                  size="sm"
                  className="h-9 text-xs px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 font-bold cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                  <span>Buka Tindak Lanjut di S&amp;B Specialist</span>
                </Button>
              </Link>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-9 px-4 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
