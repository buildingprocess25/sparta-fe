// =============================================================================
// app/prototipe-trial/monitoring-trial/[id]/page.tsx
// Halaman Detail Dokumen Resmi Pelaksanaan Trial (Katalog SPK) Sparta
// Fitur:
// 1. Pratinjau Dokumen Cetak PDF Resmi & Spesifikasi Lengkap
// 2. Alur Evaluasi Lapangan Inline (1 Role Representatif, Tanpa Modal Pop-up)
// 3. Aksi Akhiri Masa Pengujian Trial Lapangan & Penetapan Master Harga
// Desain: Anti-Slop Industrial Clean, Tombol Solid Pastel, Font Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialDokumenViewer } from '@/components/prototipe-trial/TrialDokumenViewer';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { TrialEvaluasiKuorumCard } from '@/components/prototipe-trial/TrialEvaluasiKuorumCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { getRemainingDays } from '@/components/prototipe-trial/types';
import { confirmAlert, successAlert } from '@/components/ui/sweetalert';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Printer,
  ClockAlert,
  Layers,
  History,
  ClipboardCheck,
} from 'lucide-react';

function DetailMonitoringTrialContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, updateItem } = useTrialStore();

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  // Tab State: 'dokumen' | 'evaluasi' | 'spek' | 'history'
  const [userTab, setUserTab] = useState<'dokumen' | 'evaluasi' | 'spek' | 'history' | null>(null);

  // Tab yang aktif berdasarkan interaksi user atau fallback status item
  const activeTab = useMemo<'dokumen' | 'evaluasi' | 'spek' | 'history'>(() => {
    if (userTab) return userTab;
    const tabParam = searchParams.get('tab');
    if (tabParam === 'evaluasi') return 'evaluasi';
    if (item && item.status !== 'TRIAL_AKTIF' && item.status !== 'TRIAL_DRAFT') {
      return 'evaluasi';
    }
    return 'dokumen';
  }, [userTab, searchParams, item]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat dokumen pelaksanaan trial...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">
            Item trial aktif tidak ditemukan dalam katalog monitoring.
          </p>
          <Link
            href="/prototipe-trial/monitoring-trial"
            className="mt-4 px-4 py-2 bg-emerald-200 text-emerald-950 rounded-lg text-xs font-semibold hover:bg-emerald-300 transition-colors"
          >
            Kembali ke Katalog Monitoring
          </Link>
        </div>
      </div>
    );
  }

  const isAktif = item.status === 'TRIAL_AKTIF';

  // Helper: Akhiri Masa Pengujian Trial Resmi (Tetap di halaman ini & beralih ke Evaluasi Inline)
  const handleEndTrial = async () => {
    const sisa = getRemainingDays(item.trialStartDate, item.durasiHari);
    const title = sisa > 0 ? 'Akhiri Pengujian Lebih Awal?' : 'Akhiri Masa Pengujian?';
    const text = sisa > 0
      ? `Apakah Anda yakin ingin mengakhiri masa pengujian item ini lebih awal (sisa durasi: ${sisa} hari)?`
      : `Akhiri masa pengujian trial untuk item ${item.kode} dan lanjutkan ke tahap Evaluasi Lapangan?`;

    const isConfirmed = await confirmAlert({
      title,
      text,
      icon: 'warning',
      confirmTone: 'amber',
      confirmButtonText: 'Ya, Akhiri Pengujian',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      updateItem(item.id, (prev) => ({
        ...prev,
        status: 'TRIAL_EVALUASI_VOTING',
        historyLog: [
          ...prev.historyLog,
          {
            role: 'Pengawas B&M',
            action: 'EVALUATE',
            tanggal: new Date().toISOString().split('T')[0],
            catatan: `Masa pengujian trial lapangan diakhiri${sisa > 0 ? ` lebih awal (sisa ${sisa} hari)` : ''}. Item resmi dialihkan ke tahap Evaluasi Lapangan.`,
          },
        ],
      }));

      // Beralih ke tab evaluasi langsung di halaman ini
      setUserTab('evaluasi');

      await successAlert(
        'Masa Pengujian Berakhir',
        'Item resmi dialihkan ke tahap Evaluasi Lapangan. Silakan isi formulir evaluasi langsung di tab Evaluasi.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Dokumen Pelaksanaan: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Header Standar Peran Monitoring */}
        <TrialDetailHeader
          item={item}
          backHref="/prototipe-trial/monitoring-trial"
          backLabel="Kembali ke Katalog Monitoring"
          actionButtons={
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-950 text-xs font-semibold gap-1.5 shadow-2xs border-0 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen PDF</span>
            </Button>
          }
        />

        {/* Timeline Visual Alur Sparta */}
        <TrialTimelineBar item={item} />

        {/* Tab Navigasi Konten Monitoring & Evaluasi Inline */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 pb-1 print:hidden">
          {/* Tab 1: Dokumen Pelaksanaan */}
          <button
            onClick={() => setUserTab('dokumen')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'dokumen'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dokumen Pelaksanaan Trial</span>
          </button>

          {/* Tab 2: Evaluasi Lapangan Inline (1 Role Representatif) */}
          <button
            onClick={() => setUserTab('evaluasi')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'evaluasi'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Evaluasi Lapangan</span>
            {item.status === 'TRIAL_PENDING_FINAL_BM_REG' ? (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950">
                Siap Master
              </span>
            ) : item.status === 'TRIAL_PROMOTED_MASTER' ? (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950">
                Masuk Master
              </span>
            ) : item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' || item.status === 'TRIAL_DITOLAK_REG_MGR' ? (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-950">
                Tidak Lanjut
              </span>
            ) : item.status === 'TRIAL_EVALUASI_VOTING' ? (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950">
                Perlu Evaluasi
              </span>
            ) : (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                Masa Uji
              </span>
            )}
          </button>

          {/* Tab 3: Spesifikasi Teknis & Berkas */}
          <button
            onClick={() => setUserTab('spek')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'spek'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Spesifikasi &amp; Berkas</span>
          </button>

          {/* Tab 4: Riwayat Audit */}
          <button
            onClick={() => setUserTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat</span>
          </button>
        </div>

        {/* Tab 1: Dokumen PDF Pelaksanaan */}
        {activeTab === 'dokumen' && (
          <TrialDokumenViewer item={item} showPrintButton={false} />
        )}

        {/* Tab 2: Evaluasi Lapangan Inline (1 Role Representatif, Tanpa Modal) */}
        {activeTab === 'evaluasi' && (
          <TrialEvaluasiKuorumCard item={item} onEndTrial={handleEndTrial} />
        )}

        {/* Tab 3: Spesifikasi Fisik & Lampiran */}
        {activeTab === 'spek' && (
          <TrialSpesifikasiCard item={item} />
        )}

        {/* Tab 4: Riwayat Audit Log */}
        {activeTab === 'history' && (
          <TrialAuditLogCard logs={item.historyLog} />
        )}
      </main>

      {/* Sticky Bottom Action Bar Khusus Monitoring & Evaluasi */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 font-semibold text-emerald-800 border border-emerald-200">
              {isAktif ? 'Katalog: Trial Aktif Cabang' : 'Katalog: Evaluasi Pasca-Trial'}
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isAktif
                ? 'Item sah digunakan untuk transaksi dan penerbitan SPK perbaikan cabang.'
                : item.status === 'TRIAL_PENDING_FINAL_BM_REG'
                ? 'Evaluasi lapangan selesai (Lanjut). Menunggu penetapan akhir B&M Regional Manager.'
                : item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT'
                ? 'Evaluasi lapangan selesai (Tidak Lanjut). Tersedia opsi re-trial tanpa deadlock.'
                : item.status === 'TRIAL_PROMOTED_MASTER'
                ? 'Item resmi masuk ke dalam Master Harga SPARTA permanen.'
                : 'Masa aktif trial selesai. Sedang berlangsung pengisian evaluasi lapangan.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/monitoring-trial"
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors border-0"
            >
              Kembali ke Katalog
            </Link>

            {/* Aksi Jika Masih Aktif: Akhiri Masa Pengujian */}
            {isAktif && (
              <Button
                type="button"
                onClick={handleEndTrial}
                className="bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs border-0 cursor-pointer transition-colors"
              >
                <ClockAlert className="w-3.5 h-3.5 text-amber-900" />
                <span>Akhiri Masa Pengujian</span>
              </Button>
            )}

            {/* Tombol Cepat Buka Form Evaluasi jika status sedang voting dan tab bukan evaluasi */}
            {!isAktif && item.status === 'TRIAL_EVALUASI_VOTING' && activeTab !== 'evaluasi' && (
              <Button
                type="button"
                onClick={() => setUserTab('evaluasi')}
                className="bg-orange-200 hover:bg-orange-300 active:bg-orange-400 text-orange-950 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs border-0 cursor-pointer transition-colors"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-orange-900" />
                <span>Isi Evaluasi Lapangan</span>
              </Button>
            )}

            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-950 text-xs font-semibold px-4 py-2 rounded-lg gap-1.5 shadow-2xs border-0 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DetailMonitoringTrialPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-sans">
        Memuat dokumen pelaksanaan trial...
      </div>
    }>
      <DetailMonitoringTrialContent />
    </Suspense>
  );
}
