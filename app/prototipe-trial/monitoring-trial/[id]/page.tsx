// =============================================================================
// app/prototipe-trial/monitoring-trial/[id]/page.tsx
// Halaman Detail Dokumen Resmi Pelaksanaan Trial (Katalog SPK) Sparta
// Fitur: Pratinjau Dokumen Cetak PDF Resmi, Tab Spesifikasi, Riwayat,
// & Aksi Resmi Pengakhiran Masa Pengujian Trial Lapangan
// Desain: Anti-Slop Industrial Clean, Tombol Solid Pastel
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialDetailHeader } from '@/components/prototipe-trial/TrialDetailHeader';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { TrialDokumenViewer } from '@/components/prototipe-trial/TrialDokumenViewer';
import { TrialSpesifikasiCard } from '@/components/prototipe-trial/TrialSpesifikasiCard';
import { TrialAuditLogCard } from '@/components/prototipe-trial/TrialAuditLogCard';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { getRemainingDays } from '@/components/prototipe-trial/types';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Printer,
  ClockAlert,
  Layers,
  History,
} from 'lucide-react';

export default function DetailMonitoringTrialPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params?.id === 'string' ? params.id : '';

  const { items, mounted, updateItem } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'dokumen' | 'spek' | 'history'>('dokumen');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

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
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Kembali ke Katalog Monitoring
          </Link>
        </div>
      </div>
    );
  }

  const isAktif = item.status === 'TRIAL_AKTIF';

  // Helper: Akhiri Masa Pengujian Trial Resmi
  const handleEndTrial = () => {
    const sisa = getRemainingDays(item.trialStartDate, item.durasiHari);
    const confirmMsg = sisa > 0
      ? `Apakah Anda yakin ingin mengakhiri masa pengujian item ini lebih awal (sisa ${sisa} hari)? Item akan langsung dialihkan ke tahap Evaluasi Kuorum 3 Tim.`
      : 'Akhiri masa pengujian trial ini dan lanjutkan ke tahap Evaluasi Kuorum 3 Tim?';

    if (confirm(confirmMsg)) {
      updateItem(item.id, (prev) => ({
        ...prev,
        status: 'TRIAL_EVALUASI_VOTING',
        historyLog: [
          ...prev.historyLog,
          {
            role: 'Pengawas B&M',
            action: 'EVALUATE',
            tanggal: new Date().toISOString().split('T')[0],
            catatan: `Masa pengujian trial lapangan diakhiri${sisa > 0 ? ` lebih awal (sisa ${sisa} hari)` : ''}. Item resmi dialihkan ke tahap Evaluasi Kuorum 3 Tim (PP, BMES, S&B).`,
          },
        ],
      }));
      router.push('/prototipe-trial/evaluasi-tim');
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

        {/* Tab Navigasi Konten Monitoring */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 pb-1 print:hidden">
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'dokumen'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dokumen Pelaksanaan Trial</span>
          </button>

          <button
            onClick={() => setActiveTab('spek')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'spek'
                ? 'border-emerald-600 text-emerald-700'
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

        {/* Tab 2: Spesifikasi Fisik & Lampiran */}
        {activeTab === 'spek' && (
          <TrialSpesifikasiCard item={item} />
        )}

        {/* Tab 3: Riwayat Audit Log */}
        {activeTab === 'history' && (
          <TrialAuditLogCard logs={item.historyLog} />
        )}
      </main>

      {/* Sticky Bottom Action Bar Khusus Monitoring */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 font-semibold text-emerald-800 border border-emerald-200">
              Katalog: Trial Aktif Cabang
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500">
              {isAktif
                ? 'Item sah digunakan untuk transaksi dan penerbitan SPK perbaikan cabang.'
                : 'Masa aktif trial telah selesai dan sedang menjalani proses evaluasi.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/prototipe-trial/monitoring-trial"
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors border-0"
            >
              Kembali ke Katalog
            </Link>

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
