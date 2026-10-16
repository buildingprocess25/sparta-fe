// =============================================================================
// components/prototipe-trial/TrialSpesifikasiCard.tsx
// Kartu Rincian Spesifikasi Material & Parameter Inisiasi Trial Sparta
// Fitur: Spesifikasi Fisik Lengkap, Estimasi Harga, Opsi Bongkaran,
// Alasan Pengajuan, dan Berkas Lampiran Dokumen/Foto Bulking
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  HelpCircle,
  ExternalLink,
  FileCode,
  ImageIcon,
} from 'lucide-react';
import { TrialItem } from './types';

interface TrialSpesifikasiCardProps {
  item: TrialItem;
}

export function TrialSpesifikasiCard({ item }: TrialSpesifikasiCardProps) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
      return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-4 h-4 text-red-600" />;
    }
    return <FileCode className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* 1. Parameter Utama Inisiasi Trial (Estimasi Harga, Bongkaran, Durasi) */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-red-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Parameter Inisiasi Trial
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Estimasi Harga Maker */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Harga
              </span>
              <div className="text-lg font-bold font-mono text-slate-900">
                {formatRupiah(item.estimasiHargaMaker)}
                <span className="text-xs font-normal text-slate-500 ml-1">/ {item.satuan}</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Usulan awal sebelum konfigurasi S&B
              </span>
            </div>

            {/* Opsi Bongkaran */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Pekerjaan Bongkaran
              </span>
              <div className="mt-1">
                {item.isTermasukBongkaran ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Termasuk Bongkaran
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <XCircle className="w-3.5 h-3.5" />
                    Tanpa Bongkaran
                  </span>
                )}
              </div>
            </div>

            {/* Durasi Uji Coba */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Durasi Uji Coba Lapangan
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-base font-bold text-slate-900">
                  {item.durasiBulan} Bulan
                </span>
                <Badge variant="outline" className="text-[11px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                  {item.durasiHari} Hari Kalender
                </Badge>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Evaluasi dilakukan setelah hari ke-{item.durasiHari}
              </span>
            </div>
          </div>

          {/* Alasan Pengajuan Trial */}
          <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/70">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-900 block">
                  Alasan
                </span>
                <p className="text-xs text-amber-950/80 leading-relaxed">
                  {item.alasanTrial || 'Tidak ada alasan khusus yang dicantumkan.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Spesifikasi Fisik Material */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Spesifikasi Fisik Material
              </CardTitle>
            </div>
            {item.kodeMaster && (
              <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Kode Master: <strong>{item.kodeMaster}</strong>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-3.5 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Item / Pekerjaan</span>
              <span className="font-semibold text-slate-900">{item.item}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Kategori</span>
              <span className="font-semibold text-slate-900">{item.kategori}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ukuran</span>
              <span className="font-semibold text-slate-900">{item.ukuran || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Merk</span>
              <span className="font-semibold text-slate-900">{item.merk || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Warna</span>
              <span className="font-semibold text-slate-900">{item.warna || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Tipe</span>
              <span className="font-semibold text-slate-900">{item.tipe || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Permukaan</span>
              <span className="font-semibold text-slate-900">{item.permukaan || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Tebal</span>
              <span className="font-semibold text-slate-900">{item.tebal || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Toleransi</span>
              <span className="font-semibold text-slate-900">{item.toleransi || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Satuan</span>
              <span className="font-semibold text-slate-900">{item.satuan}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Implementasi</span>
              <span className="font-semibold text-slate-900">{item.implementasi || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Lokasi Gerai</span>
              <span className="font-semibold text-slate-900">{item.lokasi || '-'}</span>
            </div>
          </div>

          {/* Deskripsi Otomatis */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block mb-1">Deskripsi Standar Sistem</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
              {item.deskripsiOtomatis}
            </p>
          </div>

          {/* Informasi Tambahan jika ada */}
          {item.informasiTambahan && (
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1">Informasi Tambahan</span>
              <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                {item.informasiTambahan}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Berkas Lampiran Pendukung */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-red-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Berkas Lampiran Pengajuan
              </CardTitle>
            </div>
            <span className="text-xs text-slate-500">
              {item.lampiranMakerList && item.lampiranMakerList.length > 0
                ? `${item.lampiranMakerList.length} Berkas`
                : item.lampiranMakerName
                ? '1 Berkas'
                : '0 Berkas'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {item.lampiranMakerList && item.lampiranMakerList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.lampiranMakerList.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {file.labelJenis && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            {file.labelJenis}
                          </span>
                        )}
                        {file.size && (
                          <span className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded-md transition-colors shrink-0 ml-2"
                  >
                    <span>Lihat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : item.lampiranMakerName ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                  {getFileIcon(item.lampiranMakerName)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.lampiranMakerName}>
                    {item.lampiranMakerName}
                  </p>
                  <span className="text-[10px] text-slate-400">Dokumen Pendukung Maker</span>
                </div>
              </div>
              <a
                href={item.lampiranMakerUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 hover:bg-blue-50 rounded-md transition-colors shrink-0 ml-2"
              >
                <span>Lihat</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada berkas lampiran yang diunggah untuk item ini.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
