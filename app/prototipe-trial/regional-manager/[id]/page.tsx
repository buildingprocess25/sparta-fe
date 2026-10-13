// =============================================================================
// app/prototipe-trial/regional-manager/[id]/page.tsx
// Halaman Detail Otorisasi Khusus B&M Regional Manager Sparta
// Fitur: Fase 1 (Approval Harga Trial & Terbit PDF) vs Fase 2 (Penetapan Master),
// Rekap Kuorum Evaluasi 3 Tim, dan Modal Putusan Eksekutif
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
import { calculateEvaluationQuorum } from '@/components/prototipe-trial/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  RotateCcw,
  Sparkles,
  XCircle,
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

  // Modal State Fase 1
  const [isApproveHargaOpen, setIsApproveHargaOpen] = useState(false);
  const [isReviseHargaOpen, setIsReviseHargaOpen] = useState(false);
  const [hargaApproveNote, setHargaApproveNote] = useState('Harga dan margin disetujui resmi. Terbitkan Dokumen Pelaksanaan Trial untuk operasional gerai.');
  const [hargaReviseNote, setHargaReviseNote] = useState('');
  const [hargaReviseError, setHargaReviseError] = useState('');

  // Modal State Fase 2
  const [isPromoteMasterOpen, setIsPromoteMasterOpen] = useState(false);
  const [isRejectMasterOpen, setIsRejectMasterOpen] = useState(false);
  const [masterApproveNote, setMasterApproveNote] = useState('Berdasarkan kuorum evaluasi 3 tim dan uji coba lapangan, item ini resmi disahkan menjadi Master Harga.');
  const [masterRejectNote, setMasterRejectNote] = useState('');
  const [masterRejectError, setMasterRejectError] = useState('');

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
    setIsApproveHargaOpen(false);
    router.push('/prototipe-trial/regional-manager');
  };

  const handleConfirmReviseHarga = () => {
    if (!hargaReviseNote.trim()) {
      setHargaReviseError('Mohon tuliskan catatan revisi harga untuk tim S&B.');
      return;
    }
    reviseRegMgrConfig(item.id, hargaReviseNote.trim());
    setIsReviseHargaOpen(false);
    router.push('/prototipe-trial/regional-manager');
  };

  // Handlers Fase 2 (Master)
  const handleConfirmPromoteMaster = () => {
    approveFinalMaster(item.id, masterApproveNote.trim());
    setIsPromoteMasterOpen(false);
    router.push('/prototipe-trial/regional-manager');
  };

  const handleConfirmRejectMaster = () => {
    if (!masterRejectNote.trim()) {
      setMasterRejectError('Mohon tuliskan alasan penolakan penetapan master harga.');
      return;
    }
    rejectFinalMaster(item.id, masterRejectNote.trim());
    setIsRejectMasterOpen(false);
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
          actionButtons={
            isPendingHarga ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setHargaReviseNote('');
                    setHargaReviseError('');
                    setIsReviseHargaOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revisi ke S&B</span>
                </Button>
                <Button
                  onClick={() => setIsApproveHargaOpen(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Setujui & Terbitkan PDF</span>
                </Button>
              </div>
            ) : isPendingMaster ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setMasterRejectNote('');
                    setMasterRejectError('');
                    setIsRejectMasterOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak Penetapan</span>
                </Button>
                <Button
                  onClick={() => setIsPromoteMasterOpen(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tetapkan ke Master</span>
                </Button>
              </div>
            ) : null
          }
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* 1. Banner Konteks Fase 1 (Harga) */}
        {isPendingHarga && (
          <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-indigo-950">
                Fase 1: Otorisasi Harga Trial & Penerbitan Dokumen Resmi Pelaksanaan
              </h2>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                Tim S&B telah menghitung rincian koefisien dan margin. Menyetujui usulan ini akan menerbitkan Dokumen Pelaksanaan Trial (PDF) resmi dan mengaktifkan masa uji coba {item.durasiBulan} bulan ({item.durasiHari} hari) di cabang target.
              </p>
            </div>
          </div>
        )}

        {/* 2. Banner Konteks Fase 2 (Penetapan Master) */}
        {isPendingMaster && (
          <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-emerald-950">
                Fase 2: Penetapan Akhir Master Harga Pasca-Evaluasi Kuorum
              </h2>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Masa uji coba trial telah selesai dan kuorum evaluasi 3 tim (PP, BMES, S&B) telah terpenuhi ({quorum.agreeCount}/3 tim menyetujui). Anda memiliki wewenang final untuk mengesahkan item ini secara permanen ke dalam katalog Master Harga resmi perusahaan.
              </p>
            </div>
          </div>
        )}

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
            <span>{isPendingMaster ? 'Rekap Kuorum 3 Tim Evaluasi' : 'Kajian Koefisien S&B'}</span>
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
            <span>Spesifikasi & Berkas Maker</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Riwayat Jejak Rekam</span>
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
      </main>

      {/* Sticky Bottom Action Bar Khusus Regional Manager */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 font-semibold text-indigo-800 border border-indigo-200">
              Peran: B&M Regional Manager
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isPendingHarga
                ? 'Item menunggu persetujuan harga trial dan penerbitan dokumen resmi.'
                : isPendingMaster
                ? 'Item menunggu keputusan akhir pengesahan menjadi Master Harga.'
                : 'Item telah selesai diproses oleh Regional Manager.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/regional-manager"
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kembali ke Antrean
            </Link>

            {/* Aksi Fase 1 (Harga) */}
            {isPendingHarga && (
              <>
                <Button
                  onClick={() => {
                    setHargaReviseNote('');
                    setHargaReviseError('');
                    setIsReviseHargaOpen(true);
                  }}
                  variant="outline"
                  className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revisi Harga ke S&B</span>
                </Button>

                <Button
                  onClick={() => setIsApproveHargaOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Setujui & Terbitkan Dokumen</span>
                </Button>
              </>
            )}

            {/* Aksi Fase 2 (Master) */}
            {isPendingMaster && (
              <>
                <Button
                  onClick={() => {
                    setMasterRejectNote('');
                    setMasterRejectError('');
                    setIsRejectMasterOpen(true);
                  }}
                  variant="outline"
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak Penetapan</span>
                </Button>

                <Button
                  onClick={() => setIsPromoteMasterOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tetapkan ke Master Harga</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modal Dialog Setujui Harga Trial (Fase 1) */}
      <Dialog open={isApproveHargaOpen} onOpenChange={setIsApproveHargaOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 border border-indigo-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Setujui Harga & Terbitkan Dokumen Trial
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sistem akan otomatis menerbitkan <strong>Dokumen Pelaksanaan Trial (PDF)</strong> resmi dengan nomor SK dan mengaktifkan item <strong>{item.kode}</strong> untuk transaksi SPK cabang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan Otorisasi Regional Manager
              </label>
              <Textarea
                value={hargaApproveNote}
                onChange={(e) => setHargaApproveNote(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApproveHargaOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmApproveHarga}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Setujui & Terbitkan PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Minta Revisi Harga ke S&B (Fase 1) */}
      <Dialog open={isReviseHargaOpen} onOpenChange={setIsReviseHargaOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 border border-amber-200">
              <RotateCcw className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Kembalikan ke S&B untuk Penyesuaian Harga
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tuliskan arahan perbaikan koefisien atau margin untuk ditindaklanjuti oleh spesialis S&B.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan Revisi Harga <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={hargaReviseNote}
                onChange={(e) => {
                  setHargaReviseNote(e.target.value);
                  if (hargaReviseError) setHargaReviseError('');
                }}
                placeholder="Contoh: Koefisien material perekat terlalu tinggi, mohon turunkan margin rekanan ke 7%..."
                className="text-xs min-h-[90px]"
              />
              {hargaReviseError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">
                  {hargaReviseError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReviseHargaOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReviseHarga}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
            >
              Kembalikan ke S&B
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Tetapkan ke Master Harga (Fase 2) */}
      <Dialog open={isPromoteMasterOpen} onOpenChange={setIsPromoteMasterOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Tetapkan Menjadi Master Harga Resmi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Item <strong>{item.kode}</strong> akan disahkan permanen ke katalog Master Harga resmi perusahaan dengan harga satuan <strong>Rp {item.hargaTrialFinal?.toLocaleString('id-ID')}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan SK Penetapan Master
              </label>
              <Textarea
                value={masterApproveNote}
                onChange={(e) => setMasterApproveNote(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPromoteMasterOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmPromoteMaster}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Sahkan ke Master Harga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Tolak Penetapan Master (Fase 2) */}
      <Dialog open={isRejectMasterOpen} onOpenChange={setIsRejectMasterOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2 border border-red-200">
              <XCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Tolak Penetapan Master Harga
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Item tidak disahkan ke Master Harga. Namun sesuai kebijakan non-deadlock, Maker tetap memiliki hak untuk mengajukan kembali di kemudian hari.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={masterRejectNote}
                onChange={(e) => {
                  setMasterRejectNote(e.target.value);
                  if (masterRejectError) setMasterRejectError('');
                }}
                placeholder="Tuliskan evaluasi manajerial penolakan..."
                className="text-xs min-h-[90px]"
              />
              {masterRejectError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">
                  {masterRejectError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRejectMasterOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRejectMaster}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Tolak Penetapan Master
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
