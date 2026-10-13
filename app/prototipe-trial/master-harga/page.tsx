// =============================================================================
// app/prototipe-trial/master-harga/page.tsx
// Halaman Katalog Master Harga Resmi Hasil Kelulusan Trial Sparta
// Fitur: Katalog Item Sah, Kode Master, Harga Satuan Resmi, dan Detail Riwayat
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
  Database,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function MasterHargaTrialKatalogPage() {
  const { items, mounted } = useTrialStore();
  const [search, setSearch] = useState('');

  // Scoping data: Hanya item yang berhasil promosi ke Master Harga
  const masterItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status !== 'TRIAL_PROMOTED_MASTER') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
        item.item.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.cabang.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Katalog Master Harga Resmi (Lulus Uji Coba Trial)" />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Katalog Master Harga Resmi
                </h1>
                <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs">
                  {masterItems.length} Item Resmi Sah
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Daftar item spesifikasi material dan jasa yang telah sukses melewati tahapan uji coba lapangan, evaluasi kuorum 3 tim, dan disahkan permanen oleh B&M Regional Manager.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-teal-50/70 p-3 rounded-xl border border-teal-200/80">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Tersimpan permanen di database Master Harga nasional.</span>
          </div>
        </div>

        {/* Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-semibold">
            Menampilkan seluruh item hasil kelulusan alur uji coba trial
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode item, kode master, nama..."
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Tabel Master Harga */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode Item</th>
                  <th className="py-3.5 px-4">Kode Master</th>
                  <th className="py-3.5 px-4">Material & Spesifikasi</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Satuan</th>
                  <th className="py-3.5 px-4">Harga Master Resmi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mounted && masterItems.length > 0 ? (
                  masterItems.map((item) => {
                    const statusMeta = TRIAL_STATUS_MAP[item.status] || {
                      label: item.status,
                      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                      dotColor: 'bg-emerald-500',
                    };

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {item.kode}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {item.kodeMaster || '-'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate" title={item.item}>
                            {item.item}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Merk: {item.merk || '-'} • {item.ukuran || 'Standar'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {item.kategori}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {item.satuan}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-950 text-sm">
                          {formatRupiah(item.hargaTrialFinal || item.estimasiHargaMaker)}
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
                            href={`/prototipe-trial/master-harga/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
                          >
                            <span>Detail Master</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Belum ada item trial yang dipromosikan ke Master Harga.
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
