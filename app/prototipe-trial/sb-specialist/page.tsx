// =============================================================================
// app/prototipe-trial/sb-specialist/page.tsx
// Halaman Antrean Konfigurasi Harga & Koefisien S&B Specialist Sparta
// Fitur: Tab Konfigurasi Baru, Revisi Harga Reg Mgr, Riwayat, dan Akses Worksheet
// Bahasa: Lugas, Ringkas, Clean Architecture, Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { TRIAL_STATUS_MAP } from '@/components/prototipe-trial/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function SBSpecialistAntreanPage() {
  const { items, mounted } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'revisi' | 'history' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Scoping data untuk peran S&B Specialist
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter Tab
      if (activeTab === 'pending') {
        if (item.status !== 'TRIAL_PENDING_SB_CONFIG') return false;
      } else if (activeTab === 'revisi') {
        if (item.status !== 'TRIAL_REVISI_SB') return false;
      } else if (activeTab === 'history') {
        const pastStatuses = [
          'TRIAL_PENDING_BM_REG_CONFIG',
          'TRIAL_AKTIF',
          'TRIAL_EVALUASI_VOTING',
          'TRIAL_PENDING_FINAL_BM_REG',
          'TRIAL_PROMOTED_MASTER',
        ];
        if (!pastStatuses.includes(item.status)) return false;
      }

      // Filter Pencarian
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.cabang.toLowerCase().includes(q) ||
        item.makerNama.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, search]);

  const pendingCount = items.filter((i) => i.status === 'TRIAL_PENDING_SB_CONFIG').length;
  const revisiCount = items.filter((i) => i.status === 'TRIAL_REVISI_SB').length;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Konfigurasi Koefisien & Harga Trial (S&B Specialist)" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Antrean Konfigurasi Harga S&B Specialist
                </h1>
                {pendingCount > 0 && (
                  <Badge className="bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs">
                    {pendingCount}
                  </Badge>
                )}
                {revisiCount > 0 && (
                  <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs">
                    {revisiCount} Revisi Harga
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Rinci koefisien upah, material, dan upah bongkaran serta sesuaikan persentase margin
              </p>
            </div>
          </div>

        </div>

        {/* Tab & Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perlu Konfigurasi ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('revisi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'revisi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revisi Harga ({revisiCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Selesai
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

        {/* Tabel Antrean S&B */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode Item</th>
                  <th className="py-3.5 px-4">Material & Spesifikasi</th>
                  <th className="py-3.5 px-4">Cabang</th>
                  <th className="py-3.5 px-4">Durasi Uji</th>
                  <th className="py-3.5 px-4">Estimasi Maker</th>
                  <th className="py-3.5 px-4">Bongkaran</th>
                  <th className="py-3.5 px-4">Harga Final S&B</th>
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

                    const isNeedAction =
                      item.status === 'TRIAL_PENDING_SB_CONFIG' || item.status === 'TRIAL_REVISI_SB';

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
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.durasiBulan} Bulan
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {formatRupiah(item.estimasiHargaMaker)}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.isTermasukBongkaran ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ya
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Tidak</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-900">
                          {item.hargaTrialFinal ? formatRupiah(item.hargaTrialFinal) : '-'}
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
                            href={`/prototipe-trial/sb-specialist/${item.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              isNeedAction
                                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs'
                                : 'text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200'
                            }`}
                          >
                            <span>{isNeedAction ? 'Hitung Koefisien' : 'Detail'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada pengajuan item trial yang cocok dalam antrean S&B Specialist.
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
