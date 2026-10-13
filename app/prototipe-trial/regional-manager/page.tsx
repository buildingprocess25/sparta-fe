// =============================================================================
// app/prototipe-trial/regional-manager/page.tsx
// Halaman Antrean Persetujuan Harga & Penetapan Master B&M Regional Manager
// Fitur: Tab Fase 1 Approval Harga vs Tab Fase 2 Penetapan Master, Pencarian,
// dan Akses ke Halaman Review Detail Regional Manager
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
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  FileCheck2,
} from 'lucide-react';

export default function RegionalManagerAntreanPage() {
  const { items, mounted } = useTrialStore();
  const [activeTab, setActiveTab] = useState<'harga' | 'master' | 'history' | 'all'>('harga');
  const [search, setSearch] = useState('');

  // Scoping data untuk peran Regional Manager
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter Tab
      if (activeTab === 'harga') {
        if (item.status !== 'TRIAL_PENDING_BM_REG_CONFIG') return false;
      } else if (activeTab === 'master') {
        if (item.status !== 'TRIAL_PENDING_FINAL_BM_REG') return false;
      } else if (activeTab === 'history') {
        if (item.status !== 'TRIAL_PROMOTED_MASTER' && item.status !== 'TRIAL_DITOLAK_REG_MGR') {
          return false;
        }
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

  const hargaCount = items.filter((i) => i.status === 'TRIAL_PENDING_BM_REG_CONFIG').length;
  const masterCount = items.filter((i) => i.status === 'TRIAL_PENDING_FINAL_BM_REG').length;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Otorisasi Harga & Penetapan Master (B&M Regional Manager)" />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Antrean B&M Regional Manager
                </h1>
                {hargaCount > 0 && (
                  <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs">
                    {hargaCount} Usulan Harga
                  </Badge>
                )}
                {masterCount > 0 && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs">
                    {masterCount} Kuorum Siap Master
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Otorisasi penerbitan Dokumen Pelaksanaan Trial resmi (Fase 1) dan penetapan akhir kelulusan item trial menjadi Master Harga resmi (Fase 2).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80">
            <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Penerbitan dokumen legalitas uji coba & SK Master Harga.</span>
          </div>
        </div>

        {/* Tab & Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('harga')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'harga'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Approval Harga Trial ({hargaCount})
            </button>
            <button
              onClick={() => setActiveTab('master')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'master'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Penetapan Akhir Master ({masterCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Putusan
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

        {/* Tabel Antrean Regional Manager */}
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
                  <th className="py-3.5 px-4">Usulan Harga S&B</th>
                  <th className="py-3.5 px-4">Margin S&B</th>
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

                    const isPendingHarga = item.status === 'TRIAL_PENDING_BM_REG_CONFIG';
                    const isPendingMaster = item.status === 'TRIAL_PENDING_FINAL_BM_REG';

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
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {formatRupiah(item.estimasiHargaMaker)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-950">
                          {item.hargaTrialFinal ? formatRupiah(item.hargaTrialFinal) : '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {item.marginUpah ? `${item.marginUpah}%` : '-'}
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
                            href={`/prototipe-trial/regional-manager/${item.id}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              isPendingHarga
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                : isPendingMaster
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                : 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200'
                            }`}
                          >
                            <span>
                              {isPendingHarga
                                ? 'Review Harga'
                                : isPendingMaster
                                ? 'Review Master'
                                : 'Detail'}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada pengajuan item trial yang cocok dalam antrean Regional Manager.
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
