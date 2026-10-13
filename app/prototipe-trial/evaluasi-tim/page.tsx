// =============================================================================
// app/prototipe-trial/evaluasi-tim/page.tsx
// Halaman Antrean Evaluasi Pasca-Trial 3 Tim Mandiri (PP, BMES, S&B) Sparta
// Fitur: Status Form PP/BMES/S&B, Live Kuorum Meter (2/3 Setuju), dan Akses Form
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { TRIAL_STATUS_MAP, calculateEvaluationQuorum } from '@/components/prototipe-trial/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  Search,
  ArrowRight,
} from 'lucide-react';

export default function EvaluasiTimAntreanPage() {
  const { items, mounted } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'voting' | 'lolos' | 'gagal' | 'all'>('voting');
  const [search, setSearch] = useState('');

  // Scoping data untuk peran Tim Evaluasi
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter Tab
      if (activeTab === 'voting') {
        if (item.status !== 'TRIAL_EVALUASI_VOTING') return false;
      } else if (activeTab === 'lolos') {
        if (
          item.status !== 'TRIAL_PENDING_FINAL_BM_REG' &&
          item.status !== 'TRIAL_PROMOTED_MASTER'
        ) {
          return false;
        }
      } else if (activeTab === 'gagal') {
        if (item.status !== 'TRIAL_EVALUASI_TIDAK_LANJUT') return false;
      }

      // Filter Pencarian
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.cabang.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, search]);

  const votingCount = items.filter((i) => i.status === 'TRIAL_EVALUASI_VOTING').length;
  const lolosCount = items.filter(
    (i) => i.status === 'TRIAL_PENDING_FINAL_BM_REG' || i.status === 'TRIAL_PROMOTED_MASTER'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Evaluasi Pasca-Trial Mandiri (PP, BMES, S&B)" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
              <Vote className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Antrean Evaluasi Bersama (3 Tim)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Pengisian formulir penilaian mandiri pasca-uji coba gerai oleh Tim PP, BMES, dan S&B. Item lolos ke B&M Regional Manager jika minimal 2 dari 3 tim menyatakan setuju.
              </p>
            </div>
          </div>

        </div>

        {/* Tab & Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('voting')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'voting'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Penilaian ({votingCount})
            </button>
            <button
              onClick={() => setActiveTab('lolos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'lolos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kuorum Lolos ({lolosCount})
            </button>
            <button
              onClick={() => setActiveTab('gagal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'gagal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tidak Lanjut
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, material, cabang..."
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Tabel Antrean Evaluasi 3 Tim */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode Item</th>
                  <th className="py-3.5 px-4">Material & Spesifikasi</th>
                  <th className="py-3.5 px-4">Cabang</th>
                  <th className="py-3.5 px-4 text-center">Form PP</th>
                  <th className="py-3.5 px-4 text-center">Form BMES</th>
                  <th className="py-3.5 px-4 text-center">Form S&B</th>
                  <th className="py-3.5 px-4">Progress Kuorum</th>
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

                    const quorum = calculateEvaluationQuorum(item);
                    const isVoting = item.status === 'TRIAL_EVALUASI_VOTING';

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
                        <td className="py-3.5 px-4 text-center">
                          {item.evaluasiPP ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.evaluasiPP.keputusan === 'LANJUT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {item.evaluasiPP.keputusan === 'LANJUT' ? 'Setuju' : 'Tolak'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.evaluasiBMES ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.evaluasiBMES.keputusan === 'LANJUT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {item.evaluasiBMES.keputusan === 'LANJUT' ? 'Setuju' : 'Tolak'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.evaluasiSB ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.evaluasiSB.keputusan === 'LANJUT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {item.evaluasiSB.keputusan === 'LANJUT' ? 'Setuju' : 'Tolak'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">
                              {quorum.agreeCount}/3 Setuju
                            </span>
                            {quorum.isQuorumMet ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Lolos
                              </Badge>
                            ) : quorum.isComplete ? (
                              <Badge className="bg-red-100 text-red-800 text-[10px] font-bold">
                                Gagal
                              </Badge>
                            ) : null}
                          </div>
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
                          <Link
                            href={`/prototipe-trial/evaluasi-tim/${item.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              isVoting
                                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                                : 'text-slate-700 hover:text-orange-700 hover:bg-orange-50 border border-slate-200'
                            }`}
                          >
                            <span>{isVoting ? 'Nilai Sekarang' : 'Detail'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada pengajuan item trial yang cocok dalam antrean evaluasi tim.
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
