// =============================================================================
// app/prototipe-trial/master-harga/[id]/page.tsx
// Halaman Detail Item Master Harga Resmi Sparta (Hasil Kelulusan Trial)
// Fitur: Sertifikat Penetapan Master, Spesifikasi Baku, Riwayat Promosi,
// dan Jejak Rekam End-to-End dari Inisiasi hingga Master
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function DetailMasterHargaTrialPage() {
  const params = useParams();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted } = useTrialStore();

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data item master harga...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item master harga tidak ditemukan dalam database.
          </p>
          <Link
            href="/prototipe-trial/master-harga"
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Master Harga Resmi: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Master Harga */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/master-harga"
          backLabel="Kembali ke Master Harga"
        />

        {/* Timeline Visual Alur Sparta (Status Master Aktif) */}
        <TrialTimelineBar item={item} />

        {/* 1. Banner Sertifikat Kelulusan Master Harga Resmi */}
        <Card className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-300 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-teal-200/80 bg-white/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 rounded-xl text-teal-800 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-teal-950 uppercase tracking-wide">
                    Sertifikat Penetapan Master Harga Resmi Perusahaan
                  </CardTitle>
                  <p className="text-xs text-teal-800/80">
                    Item ini telah lulus verifikasi manajerial, uji coba lapangan 90 hari, dan kuorum evaluasi 3 tim.
                  </p>
                </div>
              </div>

              <Badge className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0">
                MASTER HARGA BAKU (NASIONAL)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-teal-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Nomor Surat Keputusan (SK)
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 block">
                  {item.nomorDokumenTrial || `SPARTA/SK-MASTER/${item.kode}`}
                </span>
                <span className="text-[11px] text-teal-700 font-semibold block">
                  Disahkan oleh B&M Regional Manager
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-teal-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Harga Satuan Resmi Master
                </span>
                <div className="text-lg font-bold font-mono text-teal-950">
                  {formatRupiah(item.hargaTrialFinal || item.estimasiHargaMaker)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/{item.satuan}</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Berlaku untuk seluruh gerai & penunjukan SPK
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-teal-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                  Kode Master Resmi
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 block truncate" title={item.kodeMaster}>
                  {item.kodeMaster || `${item.kategori.substring(0, 3).toUpperCase()}-${item.kode}`}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Katalog Terstandarisasi
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Kartu Rincian Spesifikasi Baku */}
        <TrialSpesifikasiCard item={item} />

        {/* 3. Kartu Riwayat Lengkap */}
        <TrialAuditLogCard logs={item.historyLog} />
      </main>

      {/* Sticky Bottom Action Bar Master Harga */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 font-semibold text-teal-800 border border-teal-200">
              Katalog: Master Harga Resmi
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              Item telah resmi masuk ke Master Harga dan berlaku baku untuk seluruh cabang nasional.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/master-harga"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kembali
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
