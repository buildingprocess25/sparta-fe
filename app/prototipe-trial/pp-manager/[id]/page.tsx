// =============================================================================
// app/prototipe-trial/pp-manager/[id]/page.tsx
// Halaman Detail Review Kelayakan Teknis Khusus PP Manager Sparta
// Fitur: Spesifikasi Fisik, Estimasi Harga, Opsi Bongkaran, Lampiran,
// Modal Keputusan Persetujuan / Revisi Teknis ke Maker
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
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function DetailPPManagerTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, approvePP, revisePP } = useTrialStore();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('Kelayakan fisik material telah diverifikasi dan memenuhi standar');
  const [reviseNote, setReviseNote] = useState('');
  const [reviseError, setReviseError] = useState('');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data review PP Manager...
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
            href="/prototipe-trial/pp-manager"
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Kembali ke Antrean PP Manager
          </Link>
        </div>
      </div>
    );
  }

  const isPending = item.status === 'TRIAL_PENDING_PP_MGR';

  const handleConfirmApprove = () => {
    approvePP(item.id, approveNote.trim() || 'Disetujui oleh PP Manager.');
    setIsApproveModalOpen(false);
    router.push('/prototipe-trial/pp-manager');
  };

  const handleConfirmRevise = () => {
    if (!reviseNote.trim()) {
      setReviseError('Mohon tuliskan catatan alasan revisi untuk Maker.');
      return;
    }
    revisePP(item.id, reviseNote.trim());
    setIsReviseModalOpen(false);
    router.push('/prototipe-trial/pp-manager');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Review PP Manager: ${item.kode}`} />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran PP Manager */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/pp-manager"
          backLabel="Kembali ke Antrean PP Manager"
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
                  className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </Button>

                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
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


        {/* Kartu Spesifikasi Fisik & Inisiasi Trial */}
        <TrialSpesifikasiCard item={item} />

        {/* Kartu Riwayat Jejak Rekam (Audit Log) */}
        <TrialAuditLogCard logs={item.historyLog} />
      </main>

      {/* Sticky Bottom Action Bar Khusus PP Manager */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 font-semibold text-amber-800 border border-amber-200">
              Peran: PP Manager (Approver 1)
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isPending
                ? 'Item menunggu keputusan persetujuan kelayakan Anda.'
                : 'Item telah selesai ditinjau oleh PP Manager.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/pp-manager"
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
                  className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Minta Revisi</span>
                </Button>

                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui Pengajuan</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modal Dialog Persetujuan PP Manager */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Setujui Kelayakan Teknis
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pengajuan item <strong>{item.kode}</strong> akan disetujui dan diteruskan ke <strong>B&M General Manager</strong> untuk persetujuan manajerial puncak.
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
                placeholder="Tuliskan catatan kelayakan material..."
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Minta Revisi PP Manager */}
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
              Tuliskan alasan penolakan/revisi agar Maker dapat memperbaiki spesifikasi material, harga, atau lampiran dokumen.
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
                placeholder="Contoh: Mohon lampirkan uji laboratorium ketahanan keramik dan perbaiki toleransi ukuran..."
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
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
            >
              Kembalikan ke Maker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
