"use client";

import React from 'react';
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
  Store,
  Calendar,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { PengajuanHargaItem, SurveyTokoItem } from '../types';
import { PengajuanTimelineBar } from '../PengajuanTimelineBar';

interface DetailSurveiPasarModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
}

export function DetailSurveiPasarModal({
  isOpen,
  onClose,
  item,
}: DetailSurveiPasarModalProps) {
  if (!item) return null;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stores: SurveyTokoItem[] = item.surveyToko || [];

  // Hitung Harga Terendah, Tertinggi, Rata-rata
  const validPrices = stores.map((s) => s.hargaSatuan).filter((p) => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const avgPrice =
    item.hargaRataRata ||
    (validPrices.length > 0
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 md:p-7 bg-slate-50 border border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Rincian Hasil Survei Pasar 3 Toko</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Kode Item: <strong>{item.kodeMaster || item.kode}</strong> &bull; {item.item}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>{stores.length} Toko Disurvei</span>
              </span>
              <span className="font-mono text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
                {item.kodeMaster || item.kode}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Alur Satu Kolom Vertikal */}
        <div className="space-y-5 py-3">
          {/* Bar Timeline Pengajuan */}
          <PengajuanTimelineBar item={item} />

          {/* =========================================================================
              1. SPESIFIKASI MATERIAL
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
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
              2. HASIL SURVEI 3 TOKO
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span>Hasil Survei Toko / Supplier</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Survei Lapangan oleh Building Coordinator
              </span>
            </div>

            {stores.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-xs text-slate-600">Belum ada data survei toko untuk item ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Survei pasar dilakukan oleh Building Coordinator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stores.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>Toko {idx + 1}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.tanggalSurvei || '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Nama Toko</span>
                        <span className="text-xs font-bold text-slate-900">{s.namaToko || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Alamat</span>
                        <p className="text-xs text-slate-600 line-clamp-2" title={s.alamatToko}>
                          {s.alamatToko || '-'}
                        </p>
                      </div>

                      {s.catatan && (
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Catatan</span>
                          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                            &ldquo;{s.catatan}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium block">Harga Survei Toko</span>
                      <span className="text-base font-bold font-mono text-emerald-700 block">
                        {formatRupiah(s.hargaSatuan)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================================
              3. RINGKASAN PERHITUNGAN HARGA PASAR
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span>Ringkasan Perhitungan Harga Pasar</span>
              </h3>
            </div>

            {/* Banner Utama Harga Rata-rata */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Harga Rata-rata Survei Pasar
                </span>
                <span className="text-xs text-slate-400">
                  Dihitung dari {validPrices.length} toko hasil survei lapangan
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 block tracking-tight">
                  {formatRupiah(avgPrice)}
                </span>
              </div>
            </div>

            {/* Statistik Terendah & Tertinggi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-medium block flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    Harga Terendah
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-900 mt-0.5 block">
                    {formatRupiah(minPrice)}
                  </span>
                </div>
                <Badge variant="outline" className="bg-white text-emerald-700 text-[10px]">
                  Termurah
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-800 font-medium block flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                    Harga Tertinggi
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-900 mt-0.5 block">
                    {formatRupiah(maxPrice)}
                  </span>
                </div>
                <Badge variant="outline" className="bg-white text-rose-700 text-[10px]">
                  Termahal
                </Badge>
              </div>
            </div>
          </div>

          {/* =========================================================================
              4. STATUS APPROVAL & AUDIT TRAIL
              ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span>Status Verifikasi &amp; Audit Trail</span>
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 font-semibold">
                Status: {item.status || 'Draft'}
              </Badge>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(item.historyLog || []).length === 0 ? (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  Belum ada catatan riwayat verifikasi.
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
        <DialogFooter className="border-t border-slate-200 pt-4 flex items-center justify-end">
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
