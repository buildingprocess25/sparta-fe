// =============================================================================
// app/prototipe-trial/regional-manager/[id]/page.tsx
// Halaman Detail Otorisasi Khusus B&M Regional Manager Sparta
// Fitur: Fase 1 (Approval Harga Trial & Terbit PDF) vs Fase 2 (Penetapan Master),
// Rekap Kuorum Evaluasi 3 Tim, & Formulir Keputusan Inline Bebas Scroll
// Desain: Anti-Slop Industrial Clean, Single Source of Action di Decision Card
// =============================================================================

"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialKoefisienWorksheet } from '@/components/prototipe-trial/TrialKoefisienWorksheet';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { TrialDecisionCard } from '@/components/prototipe-trial/TrialDecisionCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { calculateEvaluationQuorum } from '@/components/prototipe-trial/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  FileText,
  FileCheck2,
  Paperclip,
  Vote,
} from 'lucide-react';

export default function DetailRegionalManagerTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const {
    items,
    mounted,
    approveRegMgrConfig,
    reviseRegMgrConfig,
    approveFinalMaster,
    rejectFinalMaster,
  } = useTrialStore();

  const [activeTab, setActiveTab] = useState<'analisis' | 'spek' | 'history'>('analisis');

  // State Formulir Keputusan Inline
  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REVISE'>('APPROVE');
  const [hargaApproveNote, setHargaApproveNote] = useState('Harga dan margin disetujui resmi. Terbitkan Dokumen Pelaksanaan Trial untuk operasional gerai.');
  const [hargaReviseNote, setHargaReviseNote] = useState('');
  const [hargaReviseError, setHargaReviseError] = useState('');

  const [masterApproveNote, setMasterApproveNote] = useState('Berdasarkan evaluasi, item ini layak menjadi Master Harga.');
  const [masterRejectNote, setMasterRejectNote] = useState('');
  const [masterRejectError, setMasterRejectError] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data review Regional Manager...
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
            href="/prototipe-trial/regional-manager"
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Antrean Regional Manager
          </Link>
        </div>
      </div>
    );
  }

  const isPendingHarga = item.status === 'TRIAL_PENDING_BM_REG_CONFIG';
  const isPendingMaster = item.status === 'TRIAL_PENDING_FINAL_BM_REG';
  const quorum = calculateEvaluationQuorum(item);

  // Handlers Fase 1 (Harga)
  const handleConfirmApproveHarga = () => {
    approveRegMgrConfig(item.id, hargaApproveNote.trim());
    router.push('/prototipe-trial/regional-manager');
  };

  const handleConfirmReviseHarga = () => {
    if (!hargaReviseNote.trim()) {
      setHargaReviseError('Mohon tuliskan catatan revisi harga untuk tim S&B.');
      noteTextareaRef.current?.focus();
      return;
    }
    reviseRegMgrConfig(item.id, hargaReviseNote.trim());
    router.push('/prototipe-trial/regional-manager');
  };

  // Handlers Fase 2 (Master)
  const handleConfirmPromoteMaster = () => {
    approveFinalMaster(item.id, masterApproveNote.trim());
    router.push('/prototipe-trial/regional-manager');
  };

  const handleConfirmRejectMaster = () => {
    if (!masterRejectNote.trim()) {
      setMasterRejectError('Mohon tuliskan alasan penolakan penetapan master harga.');
      noteTextareaRef.current?.focus();
      return;
    }
    rejectFinalMaster(item.id, masterRejectNote.trim());
    router.push('/prototipe-trial/regional-manager');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Otorisasi Regional Manager: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran Regional Manager */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/regional-manager"
          backLabel="Kembali ke Antrean Regional Manager"
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Tab Navigasi Konten */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 pb-1">
          <button
            onClick={() => setActiveTab('analisis')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'analisis'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isPendingMaster ? <Vote className="w-4 h-4" /> : <FileCheck2 className="w-4 h-4" />}
            <span>{isPendingMaster ? 'Rekap Tim Evaluasi' : 'Koefisien'}</span>
          </button>

          <button
            onClick={() => setActiveTab('spek')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'spek'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Spesifikasi & Berkas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Riwayat</span>
          </button>
        </div>

        {/* Konten Tab 1: Analisis / Rekap */}
        {activeTab === 'analisis' && (
          <div className="space-y-5">
            {isPendingMaster ? (
              /* Kartu Rekap Kuorum Evaluasi 3 Tim */
              <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vote className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Rekapitulasi Formulir Penilaian Mandiri 3 Tim
                    </CardTitle>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold">
                    Kuorum {quorum.agreeCount} / 3 Tim Setuju
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tim PP */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">1. Tim PP</span>
                        {item.evaluasiPP?.keputusan === 'LANJUT' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Setuju Lanjut
                          </span>
                        ) : item.evaluasiPP ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                            Tidak Lanjut
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Belum Mengisi</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 min-h-[60px]">
                        {item.evaluasiPP?.catatan || 'Tidak ada catatan evaluasi.'}
                      </p>
                      {item.evaluasiPP?.lampiranName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold truncate pt-1">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.evaluasiPP.lampiranName}</span>
                        </div>
                      )}
                    </div>

                    {/* Tim BMES */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">2. Tim BMES</span>
                        {item.evaluasiBMES?.keputusan === 'LANJUT' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Setuju Lanjut
                          </span>
                        ) : item.evaluasiBMES ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                            Tidak Lanjut
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Belum Mengisi</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 min-h-[60px]">
                        {item.evaluasiBMES?.catatan || 'Tidak ada catatan evaluasi.'}
                      </p>
                      {item.evaluasiBMES?.lampiranName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold truncate pt-1">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.evaluasiBMES.lampiranName}</span>
                        </div>
                      )}
                    </div>

                    {/* Tim S&B */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">3. Tim S&B</span>
                        {item.evaluasiSB?.keputusan === 'LANJUT' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Setuju Lanjut
                          </span>
                        ) : item.evaluasiSB ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                            Tidak Lanjut
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Belum Mengisi</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 min-h-[60px]">
                        {item.evaluasiSB?.catatan || 'Tidak ada catatan evaluasi.'}
                      </p>
                      {item.evaluasiSB?.lampiranName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold truncate pt-1">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.evaluasiSB.lampiranName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Worksheet Koefisien S&B (Mode Read-Only untuk Regional Mgr) */
              <TrialKoefisienWorksheet item={item} isEditable={false} />
            )}
          </div>
        )}

        {/* Konten Tab 2: Spesifikasi */}
        {activeTab === 'spek' && <TrialSpesifikasiCard item={item} />}

        {/* Konten Tab 3: History */}
        {activeTab === 'history' && <TrialAuditLogCard logs={item.historyLog} />}

        {/* Formulir Keputusan & Catatan Inline (Khusus Status Menunggu Otorisasi) */}
        {(isPendingHarga || isPendingMaster) && (
          <TrialDecisionCard
            id="keputusan-section"
            roleBadge="B&M Regional Manager"
            itemKode={item.kode}
            activeMode={decisionMode}
            onModeChange={(mode) => {
              setDecisionMode(mode);
              if (mode === 'REVISE') {
                if (isPendingHarga) setHargaReviseError('');
                if (isPendingMaster) setMasterRejectError('');
              }
            }}
            approveTitle={isPendingHarga ? 'Setujui' : 'Tetapkan ke Master'}
            approveDescription={
              isPendingHarga
                ? `Sistem akan otomatis menerbitkan Dokumen Pelaksanaan Trial untuk pelaksanaan trial operasional di cabang.`
                : `Item akan disahkan ke katalog Master Harga.`
            }
            approveNote={isPendingHarga ? hargaApproveNote : masterApproveNote}
            onApproveNoteChange={isPendingHarga ? setHargaApproveNote : setMasterApproveNote}
            approveButtonText={isPendingHarga ? 'Setujui' : 'Sahkan ke Master Harga'}
            onApproveSubmit={isPendingHarga ? handleConfirmApproveHarga : handleConfirmPromoteMaster}
            reviseTitle={isPendingHarga ? 'Revisi' : 'Tolak Penetapan'}
            reviseTone={isPendingHarga ? 'amber' : 'rose'}
            reviseDescription={
              isPendingHarga
                ? 'Kembalikan ke S&B Specialist untuk penyesuaian koefisien bahan/upah atau margin rekanan.'
                : 'Item tidak disahkan ke Master Harga.'
            }
            reviseNote={isPendingHarga ? hargaReviseNote : masterRejectNote}
            onReviseNoteChange={(val) => {
              if (isPendingHarga) {
                setHargaReviseNote(val);
                if (hargaReviseError) setHargaReviseError('');
              } else {
                setMasterRejectNote(val);
                if (masterRejectError) setMasterRejectError('');
              }
            }}
            reviseError={isPendingHarga ? hargaReviseError : masterRejectError}
            reviseButtonText={isPendingHarga ? 'Kembalikan ke S&B' : 'Tolak Penetapan Master'}
            onReviseSubmit={isPendingHarga ? handleConfirmReviseHarga : handleConfirmRejectMaster}
            textareaRef={noteTextareaRef}
          />
        )}
      </main>

      {/* Sticky Bottom Bar Khusus Regional Manager */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 font-semibold text-indigo-800 border border-indigo-200">
              Peran: B&M Regional Manager
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isPendingHarga
                ? 'Item menunggu otorisasi harga trial Anda pada formulir keputusan di atas.'
                : isPendingMaster
                ? 'Item menunggu keputusan akhir penetapan master pada formulir keputusan di atas.'
                : 'Item telah selesai diproses.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/regional-manager"
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
