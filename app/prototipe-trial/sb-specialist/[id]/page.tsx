// =============================================================================
// app/prototipe-trial/sb-specialist/[id]/page.tsx
// Halaman Detail Lembar Kerja Koefisien S&B Specialist Sparta
// Fitur: Worksheet Interaktif Upah, Material, Bongkaran, Margin,
// Tab Spesifikasi Maker, dan Pengajuan Usulan Harga ke Regional Manager
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialKoefisienWorksheet } from '@/components/prototipe-trial/TrialKoefisienWorksheet';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { KoefisienItem } from '@/components/prototipe-trial/types';
import {
  Calculator,
  Layers,
  History,
  RotateCcw,
} from 'lucide-react';

export default function DetailSBSpecialistTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, submitSBCoef } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'worksheet' | 'spek' | 'history'>('worksheet');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat lembar kerja S&B Specialist...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item pengajuan trial tidak ditemukan dalam antrean S&B.
          </p>
          <Link
            href="/prototipe-trial/sb-specialist"
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors"
          >
            Kembali ke Antrean S&B
          </Link>
        </div>
      </div>
    );
  }

  const isConfigurable =
    item.status === 'TRIAL_PENDING_SB_CONFIG' || item.status === 'TRIAL_REVISI_SB';

  const handleSaveWorksheet = (data: {
    koefisienUpah: KoefisienItem[];
    koefisienMaterial: KoefisienItem[];
    koefisienBongkaran?: KoefisienItem[];
    marginUpah: number;
    marginMaterial: number;
    hargaTrialFinal: number;
    catatan?: string;
  }) => {
    submitSBCoef(item.id, data);
    router.push('/prototipe-trial/sb-specialist');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Worksheet Koefisien S&B: ${item.kode}`} />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran S&B Specialist */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/sb-specialist"
          backLabel="Kembali ke Antrean S&B"
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Alert Callout jika ada catatan revisi dari Regional Manager */}
        {item.status === 'TRIAL_REVISI_SB' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-amber-950">
                Permintaan Revisi Harga dari B&M Regional Manager
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed bg-white p-3 rounded-xl border border-amber-200">
                {item.revisiCatatan ? (
                  <span>&ldquo;{item.revisiCatatan}&rdquo;</span>
                ) : (
                  <span>Mohon sesuaikan kembali komponen koefisien upah, material, atau persentase margin rekanan.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigasi Konten S&B */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 pb-1">
          <button
            onClick={() => setActiveTab('worksheet')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'worksheet'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Koefisien</span>
          </button>

          <button
            onClick={() => setActiveTab('spek')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'spek'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Spesifikasi & Berkas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat</span>
          </button>
        </div>

        {/* Tab 1: Worksheet Koefisien */}
        {activeTab === 'worksheet' && (
          <TrialKoefisienWorksheet
            item={item}
            isEditable={isConfigurable}
            onSave={handleSaveWorksheet}
          />
        )}

        {/* Tab 2: Spesifikasi Fisik & Lampiran */}
        {activeTab === 'spek' && (
          <TrialSpesifikasiCard item={item} />
        )}

        {/* Tab 3: Riwayat Audit Log */}
        {activeTab === 'history' && (
          <TrialAuditLogCard logs={item.historyLog} />
        )}
      </main>

      {/* Sticky Bottom Action Bar Khusus S&B */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 font-semibold text-sky-800 border border-sky-200">
              Peran: S&B Controlling Specialist
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isConfigurable
                ? 'Buat koefisien'
                : 'menunggu review Regional Manager.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/sb-specialist"
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kembali ke Antrean
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
