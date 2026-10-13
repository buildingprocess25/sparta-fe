// =============================================================================
// app/prototipe-trial/maker/[id]/page.tsx
// Halaman Detail Item Trial Khusus Peran Maker (Inisiator)
// Fitur: Spesifikasi Fisik, Estimasi Harga, Opsi Bongkaran, Lampiran,
// Banner Catatan Revisi, Tombol Edit Draf, dan Siklus Re-Entry Non-Deadlock
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { ModalTambahTrial } from '@/components/prototipe-trial/ModalTambahTrial';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { Button } from '@/components/ui/button';
import {
  Edit3,
  RotateCcw,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';

export default function DetailMakerTrialPage() {
  const params = useParams();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, reEntry } = useTrialStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReEntrySubmitting, setIsReEntrySubmitting] = useState(false);

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat data trial Maker...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item pengajuan trial tidak ditemukan atau telah dihapus.
          </p>
          <Link
            href="/prototipe-trial/maker"
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Kembali ke Antrean Maker
          </Link>
        </div>
      </div>
    );
  }

  // Handler Aksi Re-Entry Non-Deadlock
  const handleReEntryAction = (actionType: 'RE_TRIAL' | 'DIRECT_MASTER' | 'RESUBMIT') => {
    setIsReEntrySubmitting(true);
    let note = '';
    if (actionType === 'RE_TRIAL') {
      note = 'Diajukan kembali untuk masa uji coba trial baru oleh Maker.';
    } else if (actionType === 'DIRECT_MASTER') {
      note = 'Diajukan langsung oleh Maker ke peninjauan akhir B&M Regional Manager.';
    } else {
      note = 'Pengajuan diperbaiki dan dikirimkan ulang oleh Maker.';
    }

    reEntry(item.id, actionType, note);
    setIsReEntrySubmitting(false);
  };

  const isEditable = item.status === 'TRIAL_DRAFT' || item.status === 'TRIAL_REVISI_MAKER';
  const isNonDeadlock =
    item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' || item.status === 'TRIAL_DITOLAK_REG_MGR';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Detail Pengajuan Maker: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran Maker */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/maker"
          backLabel="Kembali ke Antrean Maker"
          actionButtons={
            isEditable ? (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Draf</span>
              </Button>
            ) : null
          }
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* 1. Banner Khusus Catatan Revisi Maker */}
        {item.status === 'TRIAL_REVISI_MAKER' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-amber-900">
                    Pengajuan Dikembalikan untuk Direvisi
                  </h3>
                  {item.revisiOleh && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Oleh: {item.revisiOleh}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed bg-white p-3.5 rounded-xl border border-amber-200">
                  {item.revisiCatatan ? (
                    <span>&ldquo;{item.revisiCatatan}&rdquo;</span>
                  ) : (
                    <span>
                      Mohon sesuaikan spesifikasi material, nominal estimasi harga awal, atau kelengkapan berkas dokumen pendukung.
                    </span>
                  )}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Buka Formulir untuk Memperbaiki Pengajuan</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Banner Siklus Re-Entry Non-Deadlock (Tidak Dikunci Mati) */}
        {isNonDeadlock && (
          <div className="bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-indigo-950">
                    Siklus Pengajuan Kembali (Non-Deadlock)
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Fleksibel
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  {item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT'
                    ? 'Uji coba trial telah selesai dan kuorum evaluasi menyatakan tidak lanjut. Item ini tidak dikunci permanen. Anda dapat mengajukan periode trial kembali atau mengajukan langsung ke telaah B&M Regional Manager.'
                    : 'Pengajuan ditolak oleh B&M Regional Manager. Anda dapat memperbaiki data dan mengirimkannya ulang ke alur persetujuan.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' && (
                    <>
                      <Button
                        onClick={() => handleReEntryAction('RE_TRIAL')}
                        disabled={isReEntrySubmitting}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Ajukan Trial Kembali</span>
                      </Button>
                      <Button
                        onClick={() => handleReEntryAction('DIRECT_MASTER')}
                        disabled={isReEntrySubmitting}
                        size="sm"
                        variant="outline"
                        className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ajukan Langsung ke Master</span>
                      </Button>
                    </>
                  )}

                  {item.status === 'TRIAL_DITOLAK_REG_MGR' && (
                    <Button
                      onClick={() => handleReEntryAction('RESUBMIT')}
                      disabled={isReEntrySubmitting}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Ulang / Resubmit</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Kartu Spesifikasi Fisik & Inisiasi Trial */}
        <TrialSpesifikasiCard item={item} />

        {/* 4. Kartu Riwayat Jejak Rekam (Audit Log) */}
        <TrialAuditLogCard logs={item.historyLog} />
      </main>

      {/* Sticky Bottom Action Bar Khusus Maker */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700">
              Peran: Maker (Inisiator)
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isEditable
                ? 'Item masih dalam wewenang Anda untuk diedit atau diperbaiki.'
                : isNonDeadlock
                ? 'Item menunggu keputusan tindakan lanjutan Anda.'
                : 'Item sedang berjalan dalam alur evaluasi/persetujuan manajemen.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/maker"
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Kembali ke Daftar
            </Link>

            {isEditable && (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{item.status === 'TRIAL_DRAFT' ? 'Edit Draf' : 'Perbaiki & Kirim Revisi'}</span>
              </Button>
            )}

            {isNonDeadlock && item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' && (
              <Button
                onClick={() => handleReEntryAction('RE_TRIAL')}
                disabled={isReEntrySubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ajukan Trial Kembali</span>
              </Button>
            )}

            {isNonDeadlock && item.status === 'TRIAL_DITOLAK_REG_MGR' && (
              <Button
                onClick={() => handleReEntryAction('RESUBMIT')}
                disabled={isReEntrySubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Ulang / Resubmit</span>
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* Modal Edit / Perbaikan Maker */}
      <ModalTambahTrial
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        itemToEdit={item}
      />
    </div>
  );
}
