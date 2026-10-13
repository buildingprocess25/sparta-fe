// =============================================================================
// components/prototipe-trial/TrialDokumenViewer.tsx
// Komponen Pratinjau Dokumen Resmi Pelaksanaan Trial Sparta (Format Cetak PDF)
// Fitur: Format Surat Resmi, Nomor SK, QR/Tanda Tangan Digital, & Tombol Cetak
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Printer,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { TrialItem, getRemainingDays } from './types';

interface TrialDokumenViewerProps {
  item: TrialItem;
  showPrintButton?: boolean;
}

export function TrialDokumenViewer({
  item,
  showPrintButton = true,
}: TrialDokumenViewerProps) {
  const remainingDays = getRemainingDays(item.trialStartDate, item.durasiHari);
  const docNumber = item.nomorDokumenTrial || `SPARTA/TRIAL/${new Date().getFullYear()}/${item.kode}`;
  const startDate = item.trialStartDate || item.tanggalPengajuan;
  const endDate = item.trialEndDate || '3 Bulan ke Depan';

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Kartu Dokumen Resmi (Format A4 Paper Style) */}
      <Card className="bg-white border-2 border-slate-300 shadow-sm rounded-2xl overflow-hidden print:border-none print:shadow-none">
        {/* Top Action Toolbar */}
        {showPrintButton && (
          <div className="bg-slate-100/80 border-b border-slate-200 py-2.5 px-5 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Format Resmi Dokumen Pelaksanaan Uji Coba (Trial)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-8 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </Button>
            </div>
          </div>
        )}

        {/* Isi Dokumen Surat Resmi */}
        <CardContent className="p-6 sm:p-10 space-y-6">
          {/* Header Surat Kop Perusahaan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-xs tracking-wider">
                  ALFAMART
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  PT SUMBER ALFARIA TRIJAYA TBK
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                SURAT KEPUTUSAN PELAKSANAAN UJI COBA (TRIAL) MATERIAL / JASA
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Nomor Registrasi: <strong>{docNumber}</strong>
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end shrink-0">
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold mb-1">
                STATUS: TRIAL AKTIF
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono">
                Sistem SPARTA v2.0
              </span>
            </div>
          </div>

          {/* Rincian Otorisasi & Masa Berlaku */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Cabang Lokasi Uji Coba</span>
              <span className="font-bold text-slate-900 text-sm">{item.cabang}</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Area Toko: {item.lokasi || 'Gerai Standar'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Masa Berlaku Uji Coba</span>
              <span className="font-bold text-slate-900 text-sm">
                {item.durasiBulan} Bulan ({item.durasiHari} Hari)
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5">
                {startDate} s/d {endDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Sisa Masa Aktif Lapangan</span>
              <span className="font-bold text-emerald-700 text-sm">
                {remainingDays > 0 ? `${remainingDays} Hari Tersisa` : 'Durasi Uji Telah Berakhir'}
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Dapat digunakan untuk SPK cabang</span>
            </div>
          </div>

          {/* Tabel Spesifikasi Resmi & Penetapan Harga */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Spesifikasi Resmi yang Ditetapkan untuk Uji Coba:
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-600 w-1/3">Kode Item SPARTA</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{item.kode}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Nama Item Material / Pekerjaan</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{item.item}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Kategori & Standarisasi</td>
                    <td className="py-2.5 px-4 text-slate-800">{item.kategori}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Merk / Dimensi / Tebal</td>
                    <td className="py-2.5 px-4 text-slate-800">
                      Merk: {item.merk || '-'} • Ukuran: {item.ukuran || '-'} • Tebal: {item.tebal || '-'} (Toleransi: {item.toleransi || '-'})
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Harga Satuan Pelaksanaan Trial (HPS)</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-900 text-sm">
                      {formatRupiah(item.hargaTrialFinal || item.estimasiHargaMaker)} / {item.satuan}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Ketentuan Pekerjaan Bongkaran</td>
                    <td className="py-2.5 px-4 text-slate-800">
                      {item.isTermasukBongkaran
                        ? 'Termasuk upah pembongkaran eksisting dan pembersihan puing'
                        : 'Tidak termasuk pekerjaan bongkaran'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ketentuan Hukum & Operasional */}
          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800">Ketentuan Operasional Uji Coba:</h3>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed text-slate-600">
              <li>Item ini sah digunakan untuk transaksi penunjukan kontraktor dan penerbitan SPK perbaikan cabang selama periode trial berlaku.</li>
              <li>Tim Building & Maintenance cabang wajib memantau dan mencatat ketahanan fisik, durabilitas, dan kualitas instalasi secara berkala.</li>
              <li>Setelah masa berlaku ({item.durasiHari} hari) berakhir, item wajib menjalani evaluasi kuorum 3 tim (Tim PP, Tim BMES, Tim S&B) untuk menentukan kelayakan penetapan permanen ke Master Harga resmi perusahaan.</li>
            </ol>
          </div>

          {/* Kolom Tanda Tangan Otorisasi */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center p-2">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700">Digital Verification</p>
                <p>Dokumen terdaftar di database SPARTA</p>
                <p className="font-mono text-[10px]">ID: {item.id}</p>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <p className="text-[11px] text-slate-500">Tangerang, {startDate}</p>
              <p className="font-bold text-slate-800">B&M Regional Manager</p>
              <div className="h-12 flex items-center justify-center sm:justify-end">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Telah Diotorisasi Digital
                </span>
              </div>
              <p className="font-bold text-slate-900 underline">B&M Regional Manager PT SAT</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
