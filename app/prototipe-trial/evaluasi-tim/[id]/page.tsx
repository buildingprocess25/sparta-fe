// =============================================================================
// app/prototipe-trial/evaluasi-tim/[id]/page.tsx
// Halaman Detail Penilaian Mandiri 3 Tim Evaluasi (PP, BMES, S&B) Sparta
// Fitur: Form Penilaian Suara, Catatan Lapangan, Upload Bukti, Kuorum 2/3
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialEvaluasiFormsCard } from '@/components/prototipe-trial/TrialEvaluasiFormsCard';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { FormEvaluasiTim, calculateEvaluationQuorum } from '@/components/prototipe-trial/types';
import {
  Vote,
  Layers,
  History,
} from 'lucide-react';

export default function DetailEvaluasiTimTrialPage() {
  const params = useParams();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, submitEvaluation } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'evaluasi' | 'spek' | 'history'>('evaluasi');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data evaluasi tim...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item pengajuan trial tidak ditemukan dalam antrean evaluasi.
          </p>
          <Link
            href="/prototipe-trial/evaluasi-tim"
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition-colors"
          >
            Kembali ke Antrean Evaluasi
          </Link>
        </div>
      </div>
    );
  }

  const isVoting = item.status === 'TRIAL_EVALUASI_VOTING';
  const quorum = calculateEvaluationQuorum(item);

  const handleSaveEvaluation = (
    _tim: 'TIM_PP' | 'TIM_BMES' | 'TIM_SB',
    form: FormEvaluasiTim
  ) => {
    submitEvaluation(item.id, form);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Evaluasi Mandiri: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran Tim Evaluasi */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/evaluasi-tim"
          backLabel="Kembali ke Antrean Evaluasi"
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Tab Navigasi Konten Evaluasi */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 pb-1">
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'evaluasi'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>3 Form Penilaian Mandiri & Kuorum</span>
          </button>

          <button
            onClick={() => setActiveTab('spek')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'spek'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Spesifikasi & Berkas Maker</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Jejak Rekam</span>
          </button>
        </div>

        {/* Tab 1: Form Penilaian 3 Tim */}
        {activeTab === 'evaluasi' && (
          <TrialEvaluasiFormsCard
            item={item}
            onSaveEvaluation={handleSaveEvaluation}
            isReadOnly={!isVoting}
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

      {/* Sticky Bottom Action Bar Khusus Tim Evaluasi */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 font-semibold text-orange-800 border border-orange-200">
              Peran: Tim Evaluasi (PP, BMES, S&B)
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isVoting
                ? `Status kuorum saat ini: ${quorum.agreeCount}/3 tim menyetujui.`
                : quorum.isQuorumMet
                ? 'Kuorum terpenuhi. Item telah beralih ke persetujuan final Regional Manager.'
                : 'Kuorum tidak terpenuhi.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/evaluasi-tim"
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
