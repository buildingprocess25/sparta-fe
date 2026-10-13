// =============================================================================
// app/prototipe-trial/bm-general-manager/[id]/page.tsx
// Halaman Detail Review Manajerial Khusus B&M General Manager Sparta
// Fitur: Spesifikasi Fisik, Estimasi Biaya, Opsi Bongkaran, Lampiran,
// Modal Keputusan Persetujuan / Revisi Manajerial ke Maker
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  RotateCcw,
  Building2,
  AlertTriangle,
} from 'lucide-react';

export default function DetailBMGeneralManagerTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, approveBMGM, reviseBMGM } = useTrialStore();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('Disetujui oleh B&M General Manager. Dilanjutkan ke penyusunan koefisien harga oleh S&B Specialist.');
  const [reviseNote, setReviseNote] = useState('');
  const [reviseError, setReviseError] = useState('');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data review B&M General Manager...
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
    setIsApproveModalOpen(false);
    router.push('/prototipe-trial/bm-general-manager');
  };

  const handleConfirmRevise = () => {
    if (!reviseNote.trim()) {
      setReviseError('Mohon tuliskan catatan alasan revisi manajerial untuk Maker.');
      return;
    }
    reviseBMGM(item.id, reviseNote.trim());
    setIsReviseModalOpen(false);
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
          actionButtons={
            isPending ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setReviseNote('');
                    setReviseError('');
                    setIsReviseModalOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </Button>

                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui</span>
                </Button>
              </div>
            ) : null
          }
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Alert Callout jika item sedang dalam status pending B&M GM */}
        {isPending && (
          <div className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-purple-950">
                Persetujuan Manajerial Puncak (Approver 2)
              </h2>
              <p className="text-xs text-purple-900/80 leading-relaxed">
                Item ini telah divalidasi oleh PP Manager (atau diajukan langsung oleh PP Mgr). Menyetujui pengajuan ini akan melimpahkan berkas ke tim S&B Specialist untuk menyusun rincian koefisien (upah, material, bongkaran) dan simulasi harga trial.
              </p>
            </div>
          </div>
        )}

        {/* Kartu Spesifikasi Fisik & Inisiasi Trial */}
        <TrialSpesifikasiCard item={item} />

        {/* Kartu Riwayat Jejak Rekam (Audit Log) */}
        <TrialAuditLogCard logs={item.historyLog} />
      </main>

      {/* Sticky Bottom Action Bar Khusus B&M GM */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 font-semibold text-purple-800 border border-purple-200">
              Peran: B&M General Manager (Approver 2)
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isPending
                ? 'Item menunggu persetujuan manajerial puncak Anda.'
                : 'Item telah selesai ditinjau oleh B&M General Manager.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/bm-general-manager"
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kembali ke Antrean
            </Link>

            {isPending && (
              <>
                <Button
                  onClick={() => {
                    setReviseNote('');
                    setReviseError('');
                    setIsReviseModalOpen(true);
                  }}
                  variant="outline"
                  className="bg-white border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi Maker</span>
                </Button>

                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui Pengajuan</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modal Dialog Persetujuan B&M GM */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 border border-purple-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Setujui Pengajuan Manajerial
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pengajuan item <strong>{item.kode}</strong> akan disetujui dan dilimpahkan ke <strong>S&B Specialist</strong> untuk penyusunan koefisien harga dan kalkulasi margin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan Persetujuan (Opsional)
              </label>
              <Textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Tuliskan catatan arahan manajerial..."
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmApprove}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
            >
              Setujui & Teruskan ke S&B
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Minta Revisi B&M GM */}
      <Dialog open={isReviseModalOpen} onOpenChange={setIsReviseModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Kembalikan ke Maker untuk Revisi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tuliskan alasan penolakan/arahan revisi agar Maker dapat memperbarui pengajuan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan Revisi <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reviseNote}
                onChange={(e) => {
                  setReviseNote(e.target.value);
                  if (reviseError) setReviseError('');
                }}
                placeholder="Contoh: Estimasi harga awal terlalu tinggi dari pagu cabang, mohon klarifikasi vendor..."
                className="text-xs min-h-[90px]"
              />
              {reviseError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">
                  {reviseError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReviseModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRevise}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
            >
              Kembalikan ke Maker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
