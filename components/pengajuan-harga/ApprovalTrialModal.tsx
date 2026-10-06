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
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Info,
  Hammer,
  Package,
  FileText,
  FlaskConical,
} from 'lucide-react';
import { PengajuanHargaItem, KoefisienDetailItem } from './types';
import { PengajuanTimelineBar } from './PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

interface ApprovalTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
  onApprove: (item: PengajuanHargaItem, catatan: string) => void;
  onRevise: (item: PengajuanHargaItem, catatan: string) => void;
  onReject: (item: PengajuanHargaItem, catatan: string) => void;
}

export function ApprovalTrialModal({
  isOpen,
  onClose,
  item,
  onApprove,
  onRevise,
  onReject,
}: ApprovalTrialModalProps) {
  const { showAlert } = useGlobalAlert();
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

  // Kalkulasi Dasar & Margin Upah
  const totalUpahDasar = upahList.reduce((acc: number, curr: KoefisienDetailItem) => {
    const val = Number(curr.value) || 0;
    const price = curr.hargaAcuan || 0;
    return acc + (curr.subtotal !== undefined ? curr.subtotal : Math.round(val * price));
  }, 0);
  const marginUpahPercent = item.marginUpah ?? 8;
  const nominalMarginUpah = Math.round((totalUpahDasar * marginUpahPercent) / 100);
  const totalUpahAkhir = totalUpahDasar + nominalMarginUpah;

  // Kalkulasi Dasar & Margin Material
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
      ? `${durationDays / 30} Bulan (~${durationDays} Hari)`
      : `${durationDays} Hari Kalender`;

  // Handle Setujui
  const handleApprove = () => {
    onApprove(item, catatan.trim());
    setCatatan('');
  };

  // Handle Revisi (Wajib Catatan)
  const handleRevise = () => {
    if (!catatan.trim()) {
      showAlert({
        title: 'Catatan Revisi Diperlukan',
        message: 'Mohon tuliskan instruksi atau hal yang perlu diperbaiki oleh S&B Specialist.',
        type: 'warning',
      });
      return;
    }
    onRevise(item, catatan.trim());
    setCatatan('');
  };

  // Handle Tolak (Wajib Catatan)
  const handleReject = () => {
    if (!catatan.trim()) {
      showAlert({
        title: 'Alasan Penolakan Diperlukan',
        message: 'Mohon tuliskan alasan penolakan usulan spesifikasi sementara ini.',
        type: 'warning',
      });
      return;
    }
    onReject(item, catatan.trim());
    setCatatan('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 md:p-7 bg-slate-50 border border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Persetujuan Spesifikasi Sementara</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Tinjau data material, justifikasi kebutuhan, dan kalkulasi koefisien AHSP sebelum rilis sementara.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Masa Berlaku: {durationText}
              </span>
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
                {item.kodeMaster || item.kode}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Alur Satu Kolom Vertikal (Senior-Friendly) */}
        <div className="space-y-5 py-3">
          {/* Bar Timeline Pengajuan Trial */}
          <PengajuanTimelineBar item={item} />

          {/* =========================================================================
              1. SPESIFIKASI MATERIAL
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span>Spesifikasi Material</span>
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-medium">
                {item.kategori || 'Pekerjaan Material'}
              </Badge>
            </div>

            {/* Grid Parameter Spesifikasi Lapang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Nama Material:</span>
                <span className="font-bold text-slate-900 text-sm md:text-base">{item.item || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Merk / Brand:</span>
                <span className="font-bold text-slate-800">{item.merk || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Ukuran / Dimensi:</span>
                <span className="font-bold text-slate-800">{item.ukuran || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Warna &amp; Tipe:</span>
                <span className="font-semibold text-slate-800">
                  {item.warna || '-'} {item.tipe ? `(${item.tipe})` : ''}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Ketebalan:</span>
                <span className="font-semibold text-slate-800">{item.tebal || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Toleransi Presisi:</span>
                <span className="font-semibold text-slate-800">{item.toleransi || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-slate-500 block">Permukaan Finishing:</span>
                <span className="font-semibold text-slate-800">{item.permukaan || '-'}</span>
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Implementasi / Posisi:</span>
                <span className="font-semibold text-slate-800">{item.implementasi || '-'}</span>
              </div>
              <div className="space-y-0.5 sm:col-span-2">
                <span className="text-xs text-slate-500 block">Lokasi / Area Gerai:</span>
                <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                  {item.lokasi || '-'}
                </span>
              </div>
            </div>

            {/* Deskripsi Standar Format Master */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">
                Deskripsi Spesifikasi Standar Master:
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
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span>Alasan</span>
              </h3>
              <span className="text-xs text-slate-500">
                Masa Berlaku: <strong className="text-slate-800">{durationText}</strong>
              </span>
            </div>

            <div className="bg-blue-50/60 rounded-xl border border-blue-200 p-4 space-y-2">
              <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium italic">
                &ldquo;{item.alasanTrial || 'Tidak ada catatan alasan khusus.'}&rdquo;
              </p>
              <div className="text-[11px] text-blue-900/80 pt-1 border-t border-blue-200/60 flex items-center justify-between">
                <span>Pengusul: <strong>S&amp;B Controlling Specialist</strong></span>
                <span>Status Usulan: <strong>Menunggu Persetujuan Regional Manager</strong></span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. RINCIAN KOEFISIEN
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span>Rincian Koefisien</span>
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-medium">
                Volume Acuan: 1 {item.satuan || 'm2'}
              </Badge>
            </div>

            {/* A. Tenaga Kerja / Upah */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-blue-800">
                  <Hammer className="w-4 h-4 text-blue-600" />
                  <span>A. Komponen Tenaga Kerja / Upah</span>
                </div>
                <span className="text-xs md:text-sm font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  Total Upah: {formatRupiah(totalUpahAkhir)}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="px-3.5 py-2.5 font-bold">Komponen Upah</th>
                      <th className="px-3 py-2.5 text-center font-bold">Satuan</th>
                      <th className="px-3.5 py-2.5 text-right font-bold">Harga Acuan Satuan</th>
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
            </div>

            {/* B. Bahan / Material */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-amber-900">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>B. Komponen Bahan / Material &amp; Alat</span>
                </div>
                <span className="text-xs md:text-sm font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  Total Material: {formatRupiah(totalMaterialAkhir)}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="px-3.5 py-2.5 font-bold">Komponen Material</th>
                      <th className="px-3 py-2.5 text-center font-bold">Satuan</th>
                      <th className="px-3.5 py-2.5 text-right font-bold">Harga Acuan Satuan</th>
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
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-700">
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
            </div>
          </div>

          {/* =========================================================================
              4. RINGKASAN BIAYA
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span>Ringkasan Biaya</span>
              </h3>
            </div>

            {/* Banner Angka Besar & Kontras Tinggi */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Total Harga
                </span>
                <span className="text-xs text-slate-400">
                  Akumulasi Upah ({formatRupiah(totalUpahAkhir)}) + Material ({formatRupiah(totalMaterialAkhir)})
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl md:text-3xl font-black font-mono text-emerald-400 block tracking-tight">
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <span>Catatan</span>
              </h3>
              <span className="text-xs text-slate-400">
                Wajib diisi jika memilih <strong>Minta Revisi</strong> atau <strong>Tolak</strong>
              </span>
            </div>

            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan catatan persetujuan, instruksi penyesuaian spesifikasi/harga jika minta revisi, atau alasan penolakan..."
              className="text-xs md:text-sm rounded-xl border-slate-200 min-h-[80px] bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer Actions: Tombol Besar & Nyaman */}
        <DialogFooter className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-10 px-4 text-xs font-semibold cursor-pointer order-last sm:order-first"
          >
            Batal
          </Button>

          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            {/* Opsi 3: Tolak */}
            <Button
              type="button"
              variant="outline"
              onClick={handleReject}
              className="rounded-xl h-10 px-4 text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer gap-1.5"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Tolak Usulan</span>
            </Button>

            {/* Opsi 2: Revisi */}
            <Button
              type="button"
              variant="outline"
              onClick={handleRevise}
              className="rounded-xl h-10 px-4 text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Minta Revisi S&amp;B</span>
            </Button>

            {/* Opsi 1: Setujui & Rilis Sementara */}
            <Button
              type="button"
              onClick={handleApprove}
              className="rounded-xl h-10 px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
