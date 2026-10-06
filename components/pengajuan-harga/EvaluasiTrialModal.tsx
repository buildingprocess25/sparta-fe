"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  FileCheck,
  Ban,
  ShieldCheck,
  Hammer,
  Package,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { PengajuanHargaItem, KoefisienDetailItem } from './types';
import { PengajuanTimelineBar } from './PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

interface EvaluasiTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
  onSubmitPromosi: (item: PengajuanHargaItem, catatanEvaluasi: string) => void;
  onSubmitNonaktifkan: (item: PengajuanHargaItem, alasanHenti: string) => void;
}

export function EvaluasiTrialModal({
  isOpen,
  onClose,
  item,
  onSubmitPromosi,
  onSubmitNonaktifkan,
}: EvaluasiTrialModalProps) {
  const { showAlert } = useGlobalAlert();
  const [keputusan, setKeputusan] = useState<'PERMANEN' | 'STOP'>('PERMANEN');
  const [catatan, setCatatan] = useState('');

  if (!item) return null;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const upahList: KoefisienDetailItem[] = item.koefisienUpahItems || [];
  const materialList: KoefisienDetailItem[] = item.koefisienMaterialItems || [];

  // Kalkulasi Upah
  const totalUpahDasar = upahList.reduce((acc: number, curr: KoefisienDetailItem) => {
    const val = Number(curr.value) || 0;
    const price = curr.hargaAcuan || 0;
    return acc + (curr.subtotal !== undefined ? curr.subtotal : Math.round(val * price));
  }, 0);
  const marginUpahPercent = item.marginUpah ?? 8;
  const nominalMarginUpah = Math.round((totalUpahDasar * marginUpahPercent) / 100);
  const totalUpahAkhir = totalUpahDasar + nominalMarginUpah;

  // Kalkulasi Material
  const totalMaterialDasar = materialList.reduce((acc: number, curr: KoefisienDetailItem) => {
    const val = Number(curr.value) || 0;
    const price = curr.hargaAcuan || 0;
    return acc + (curr.subtotal !== undefined ? curr.subtotal : Math.round(val * price));
  }, 0);
  const marginMaterialPercent = item.marginMaterial ?? 8;
  const nominalMarginMaterial = Math.round((totalMaterialDasar * marginMaterialPercent) / 100);
  const totalMaterialAkhir = totalMaterialDasar + nominalMarginMaterial;

  const totalHargaAcuan =
    item.estimasiHarga ||
    item.hargaRataRata ||
    (totalUpahAkhir + totalMaterialAkhir > 0 ? totalUpahAkhir + totalMaterialAkhir : 0);

  const durationDays = item.trialDurationDays || 90;
  const durationText =
    durationDays % 30 === 0
      ? `${durationDays / 30} Bulan`
      : `${durationDays} Hari`;

  const handleSubmit = () => {
    if (!catatan.trim()) {
      showAlert({
        title: 'Catatan Wajib Diisi',
        message:
          keputusan === 'PERMANEN'
            ? 'Tuliskan hasil uji coba material selama 3 bulan di toko.'
            : 'Tuliskan alasan mengapa item trial ini dihentikan.',
        type: 'warning',
      });
      return;
    }

    if (keputusan === 'PERMANEN') {
      onSubmitPromosi(item, catatan.trim());
    } else {
      onSubmitNonaktifkan(item, catatan.trim());
    }

    setCatatan('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 md:p-7 bg-slate-50 border border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <FileCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Evaluasi Item Trial</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Tinjau hasil uji coba material dan tentukan keputusan akhir.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Uji Coba: {durationText}
              </span>
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
                {item.kodeMaster || item.kode}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Alur Satu Kolom Vertikal */}
        <div className="space-y-5 py-3">
          {/* Bar Timeline Pengajuan Trial */}
          <PengajuanTimelineBar item={item} />

          {/* =========================================================================
              1. SPESIFIKASI MATERIAL
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
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

              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Posisi Pasang:</span>
                <span className="font-semibold text-slate-800">{item.implementasi || '-'}</span>
              </div>
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Lokasi Gerai:</span>
                <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
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
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span>Alasan</span>
              </h3>
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Alasan Pengajuan Awal
              </span>
            </div>

            <div className="bg-purple-50/60 rounded-xl border border-purple-200 p-4 space-y-2">
              <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium italic">
                &ldquo;{item.alasanTrial || 'Uji coba material baru di toko untuk melihat ketahanan dan efisiensi biaya.'}&rdquo;
              </p>
              <div className="text-[11px] text-purple-900/80 pt-1 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-1">
                <span>Status: <strong>Selesai Uji Coba (3 Bulan)</strong></span>
                <span>Toko Uji Coba: <strong>{item.lokasi || 'Gerai Trial'}</strong></span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. RINCIAN KOEFISIEN
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span>Rincian Koefisien</span>
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-medium">
                Volume: 1 {item.satuan || 'm2'}
              </Badge>
            </div>

            {/* A. Tenaga Kerja / Upah */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-blue-800">
                  <Hammer className="w-4 h-4 text-blue-600" />
                  <span>A. Upah Tenaga Kerja</span>
                </div>
                <span className="text-xs md:text-sm font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  Total Upah: {formatRupiah(totalUpahAkhir)}
                </span>
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
                    {upahList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                          Belum ada komponen upah
                        </td>
                      </tr>
                    ) : (
                      upahList.map((u: KoefisienDetailItem, i: number) => {
                        const val = Number(u.value) || 0;
                        const price = u.hargaAcuan || 0;
                        const sub = u.subtotal !== undefined ? u.subtotal : Math.round(val * price);

                        return (
                          <tr key={u.id || i} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900">{u.label}</td>
                            <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-xs">{u.unit}</td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-slate-700">
                              {formatRupiah(price)}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">
                              {u.value}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(sub)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {upahList.length > 0 && (
                <div className="flex justify-end text-xs text-slate-600 gap-4 pt-1 pr-1 font-mono">
                  <span>Subtotal Dasar: <strong>{formatRupiah(totalUpahDasar)}</strong></span>
                  <span>Margin ({marginUpahPercent}%): <strong>+{formatRupiah(nominalMarginUpah)}</strong></span>
                </div>
              )}
            </div>

            {/* B. Bahan / Material */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-purple-800">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>B. Bahan / Material</span>
                </div>
                <span className="text-xs md:text-sm font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                  Total Material: {formatRupiah(totalMaterialAkhir)}
                </span>
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
                    {materialList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                          Belum ada komponen material
                        </td>
                      </tr>
                    ) : (
                      materialList.map((m: KoefisienDetailItem, i: number) => {
                        const val = Number(m.value) || 0;
                        const price = m.hargaAcuan || 0;
                        const sub = m.subtotal !== undefined ? m.subtotal : Math.round(val * price);

                        return (
                          <tr key={m.id || i} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900">{m.label}</td>
                            <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-xs">{m.unit}</td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-slate-700">
                              {formatRupiah(price)}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-700">
                              {m.value}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(sub)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {materialList.length > 0 && (
                <div className="flex justify-end text-xs text-slate-600 gap-4 pt-1 pr-1 font-mono">
                  <span>Subtotal Dasar: <strong>{formatRupiah(totalMaterialDasar)}</strong></span>
                  <span>Margin ({marginMaterialPercent}%): <strong>+{formatRupiah(nominalMarginMaterial)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              4. RINGKASAN BIAYA
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span>Ringkasan Biaya</span>
              </h3>
            </div>

            {/* Banner Angka Besar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Total Harga Acuan
                </span>
                <span className="text-xs text-slate-400">
                  Total Upah ({formatRupiah(totalUpahAkhir)}) + Material ({formatRupiah(totalMaterialAkhir)})
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl md:text-3xl font-black font-mono text-purple-300 block tracking-tight">
                  {formatRupiah(totalHargaAcuan)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  per {item.satuan || 'm2'}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              5. CATATAN
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <span>Catatan</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Pilih Keputusan
              </span>
            </div>

            {/* Pilihan Tindakan Evaluasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Opsi 1: Ajukan Jadi Master Resmi */}
              <div
                onClick={() => setKeputusan('PERMANEN')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  keputusan === 'PERMANEN'
                    ? 'border-purple-600 bg-purple-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      keputusan === 'PERMANEN'
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {keputusan === 'PERMANEN' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Ajukan Jadi Master Resmi</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  Material terbukti bagus selama uji coba di toko. Ajukan ke <strong>Regional Manager</strong> agar disahkan menjadi master resmi.
                </p>
              </div>

              {/* Opsi 2: Hentikan Item Trial */}
              <div
                onClick={() => setKeputusan('STOP')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  keputusan === 'STOP'
                    ? 'border-rose-600 bg-rose-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      keputusan === 'STOP'
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {keputusan === 'STOP' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Hentikan Item Trial</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  Material kurang sesuai dengan kebutuhan toko. Uji coba dihentikan dan tidak dijadikan master resmi.
                </p>
              </div>
            </div>

            {/* Input Catatan */}
            <div className="pt-2 space-y-2">
              <label className="text-xs md:text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>
                  {keputusan === 'PERMANEN'
                    ? 'Catatan Hasil Uji Coba (Wajib)'
                    : 'Alasan Penghentian (Wajib)'}
                </span>
                <span className="text-xs font-normal text-slate-500">
                  {keputusan === 'PERMANEN' ? 'Akan dibaca Regional Manager' : 'Tercatat di riwayat'}
                </span>
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={
                  keputusan === 'PERMANEN'
                    ? 'Contoh: Material kuat, tidak retak selama 3 bulan di toko, dan pemasangan rapi.'
                    : 'Contoh: Material mudah retak dan warna cepat kusam saat dipakai di toko.'
                }
                className="text-xs md:text-sm rounded-xl border-slate-200 min-h-[90px] bg-slate-50 focus:bg-white leading-relaxed"
                required
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-10 px-4 text-xs font-semibold cursor-pointer order-last sm:order-first"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className={`rounded-xl h-10 px-5 text-xs font-bold text-white cursor-pointer gap-2 shadow-xs transition-colors ${
              keputusan === 'PERMANEN'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {keputusan === 'PERMANEN' ? (
              <>
                <span>Ajukan</span>
              </>
            ) : (
              <>
                <span>Hentikan</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
