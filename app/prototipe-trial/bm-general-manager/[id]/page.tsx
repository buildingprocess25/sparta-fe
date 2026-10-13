// =============================================================================
// app/prototipe-trial/bm-general-manager/[id]/page.tsx
// Halaman Detail Review Manajerial Khusus B&M General Manager Sparta
// Fitur: Spesifikasi Fisik, Estimasi Harga, Opsi Bongkaran, Lampiran,
// Formulir Keputusan Inline & Catatan Peninjauan Bebas Scroll (Anti-Modal)
// Desain: Anti-Slop Industrial Clean, Single Source of Action di Decision Card
// =============================================================================

"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { TrialDecisionCard } from '@/components/prototipe-trial/TrialDecisionCard';
import { useTrialStore } from '@/components/prototipe-trial/store';

export default function DetailBMGeneralManagerTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, approveBMGM, reviseBMGM } = useTrialStore();

  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REVISE'>('APPROVE');
  const [approveNote, setApproveNote] = useState('Disetujui oleh B&M General Manager. Dilanjutkan ke penyusunan koefisien harga oleh S&B Specialist.');
  const [reviseNote, setReviseNote] = useState('');
  const [reviseError, setReviseError] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data review B&M GM...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item pengajuan trial tidak ditemukan dalam antrean.
          </p>
          <Link
            href="/prototipe-trial/bm-general-manager"
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
          >
            Kembali ke Antrean B&M GM
          </Link>
        </div>
      </div>
    );
  }

  const isPending = item.status === 'TRIAL_PENDING_BM_GM';

  const handleConfirmApprove = () => {
    approveBMGM(item.id, approveNote.trim() || 'Disetujui oleh B&M General Manager.');
    router.push('/prototipe-trial/bm-general-manager');
  };

  const handleConfirmRevise = () => {
    if (!reviseNote.trim()) {
      setReviseError('Mohon tuliskan catatan alasan revisi manajerial untuk Maker.');
      noteTextareaRef.current?.focus();
      return;
    }
    reviseBMGM(item.id, reviseNote.trim());
    router.push('/prototipe-trial/bm-general-manager');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Review B&M General Manager: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran B&M GM */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/bm-general-manager"
          backLabel="Kembali ke Antrean B&M GM"
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Kartu Spesifikasi Fisik & Inisiasi Trial */}
        <TrialSpesifikasiCard item={item} />

        {/* Formulir Keputusan & Catatan Inline (Khusus Status Menunggu Review) */}
        {isPending && (
          <TrialDecisionCard
            id="keputusan-section"
            roleBadge="B&M General Manager"
            itemKode={item.kode}
            activeMode={decisionMode}
            onModeChange={(mode) => {
              setDecisionMode(mode);
              if (mode === 'REVISE') setReviseError('');
            }}
            approveTitle="Setujui"
            approveDescription="Pengajuan item ini akan disetujui secara manajerial puncak dan dilimpahkan ke S&B Specialist untuk penyusunan koefisien harga dan kalkulasi margin."
            approveNote={approveNote}
            onApproveNoteChange={setApproveNote}
            approveButtonText="Setujui Pengajuan"
            onApproveSubmit={handleConfirmApprove}
            reviseTitle="Revisi"
            reviseDescription="Pengajuan item ini akan dikembalikan ke Maker dengan arahan manajerial agar pengajuan diperbarui."
            reviseNote={reviseNote}
            onReviseNoteChange={(val) => {
              setReviseNote(val);
              if (reviseError) setReviseError('');
            }}
            reviseError={reviseError}
            reviseButtonText="Kembalikan ke Maker"
            onReviseSubmit={handleConfirmRevise}
            textareaRef={noteTextareaRef}
          />
        )}

        {/* Kartu Riwayat (Audit Log) */}
        <TrialAuditLogCard logs={item.historyLog} />
      </main>

      {/* Sticky Bottom Bar Khusus B&M GM */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 font-semibold text-purple-800 border border-purple-200">
              Peran: B&M General Manager
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isPending
                ? 'Item menunggu persetujuan manajerial puncak Anda pada formulir keputusan di atas.'
                : 'Item telah selesai ditinjau oleh B&M General Manager.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/bm-general-manager"
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors border-0"
            >
              Kembali ke Antrean
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
