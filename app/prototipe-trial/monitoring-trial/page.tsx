// =============================================================================
// app/prototipe-trial/monitoring-trial/page.tsx
// Halaman Katalog Monitoring Trial Aktif di Cabang (Siap SPK) Sparta
// Fitur: Countdown Sisa Hari, Cetak Dokumen PDF, & Aksi Akhiri Masa Pengujian
// Desain: Anti-Slop Industrial Clean, Tombol Solid Pastel
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { TRIAL_STATUS_MAP, getRemainingDays } from '@/components/prototipe-trial/types';
import { Input } from '@/components/ui/input';
import {
  ClockAlert,
  Search,
  ArrowRight,
  Clock,
  Calendar,
} from 'lucide-react';

export default function MonitoringTrialAntreanPage() {
  const { items, mounted, updateItem } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'aktif' | 'habis' | 'all'>('aktif');
  const [search, setSearch] = useState('');

  // Scoping data untuk peran Monitoring Trial Aktif
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter Tab
      if (activeTab === 'aktif') {
        if (item.status !== 'TRIAL_AKTIF') return false;
      } else if (activeTab === 'habis') {
        const postTrialStatuses = [
          'TRIAL_EVALUASI_VOTING',
          'TRIAL_PENDING_FINAL_BM_REG',
          'TRIAL_PROMOTED_MASTER',
          'TRIAL_EVALUASI_TIDAK_LANJUT',
        ];
        if (!postTrialStatuses.includes(item.status)) return false;
      }

      // Filter Pencarian
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.cabang.toLowerCase().includes(q) ||
        (item.nomorDokumenTrial && item.nomorDokumenTrial.toLowerCase().includes(q))
      );
    });
  }, [items, activeTab, search]);

  const aktifCount = items.filter((i) => i.status === 'TRIAL_AKTIF').length;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Helper: Akhiri Masa Pengujian Trial Resmi
  const handleEndTrial = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetItem = items.find((i) => i.id === id);
    const sisa = targetItem ? getRemainingDays(targetItem.trialStartDate, targetItem.durasiHari) : 0;
    const confirmMsg = sisa > 0
      ? `Apakah Anda yakin ingin mengakhiri masa pengujian item ini lebih awal (sisa ${sisa} hari)? Item akan langsung dialihkan ke tahap Evaluasi Kuorum 3 Tim.`
      : 'Akhiri masa pengujian trial ini dan lanjutkan ke tahap Evaluasi Kuorum 3 Tim?';

    if (confirm(confirmMsg)) {
      updateItem(id, (item) => ({
        ...item,
        status: 'TRIAL_EVALUASI_VOTING',
        historyLog: [
          ...item.historyLog,
          {
            role: 'Pengawas B&M',
            action: 'EVALUATE',
            tanggal: new Date().toISOString().split('T')[0],
            catatan: `Masa pengujian trial lapangan diakhiri${sisa > 0 ? ` lebih awal (sisa ${sisa} hari)` : ''}. Item resmi dialihkan ke tahap Evaluasi Kuorum 3 Tim (PP, BMES, S&B).`,
          },
        ],
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Monitoring Pelaksanaan Trial Aktif (Katalog SPK)" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ClockAlert className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Katalog Trial Aktif di Cabang
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab & Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('aktif')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'aktif'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trial Aktif ({aktifCount})
            </button>
            <button
              onClick={() => setActiveTab('habis')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'habis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evaluasi Pasca-Trial
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Item
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari kode, item, SK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Tabel Katalog Monitoring Trial */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Kode Item</th>
                  <th className="py-3.5 px-4">Material & Spesifikasi</th>
                  <th className="py-3.5 px-4">Cabang</th>
                  <th className="py-3.5 px-4">Durasi Uji</th>
                  <th className="py-3.5 px-4">Sisa Hari</th>
                  <th className="py-3.5 px-4">Harga Final</th>
                  <th className="py-3.5 px-4">No. Dokumen SK</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mounted && filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const statusMeta = TRIAL_STATUS_MAP[item.status] || {
                      label: item.status,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      dotColor: 'bg-slate-400',
                    };

                    const isAktif = item.status === 'TRIAL_AKTIF';
                    const remainingDays = getRemainingDays(item.trialStartDate, item.durasiHari);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {item.kode}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate" title={item.item}>
                            {item.item}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.kategori} • {item.ukuran || 'Ukuran Standar'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {item.cabang}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {item.durasiBulan} Bulan ({item.durasiHari}h)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isAktif ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                                remainingDays > 14
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : remainingDays > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-red-50 text-red-800 border border-red-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {remainingDays > 0 ? `${remainingDays} hari` : 'Habis'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Selesai</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                          {formatRupiah(item.hargaTrialFinal || item.estimasiHargaMaker)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 max-w-[140px] truncate" title={item.nomorDokumenTrial}>
                          {item.nomorDokumenTrial || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAktif && (
                              <button
                                onClick={(e) => handleEndTrial(item.id, e)}
                                title="Akhiri masa pengujian trial dan bawa item ke tahap evaluasi 3 tim"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-md transition-colors cursor-pointer border-0 shadow-2xs"
                              >
                                <ClockAlert className="w-3 h-3 text-amber-900" />
                                <span>Akhiri Trial</span>
                              </button>
                            )}
                            <Link
                              href={`/prototipe-trial/monitoring-trial/${item.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-emerald-200 hover:bg-emerald-300 text-emerald-950 shadow-2xs transition-colors border-0"
                            >
                              <span>Dokumen</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada item trial aktif yang cocok dalam katalog monitoring.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
