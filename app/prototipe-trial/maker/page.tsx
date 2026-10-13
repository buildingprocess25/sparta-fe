// =============================================================================
// app/prototipe-trial/maker/page.tsx
// Halaman Antrean Pengajuan Item Trial untuk Maker (Senior & Junior Manager)
// Fitur: List Item, Filter Status, Tombol Tambah Trial, Link ke Detail [id]
// Bahasa: Lugas, Ringkas, Clean Code
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import { TRIAL_STATUS_MAP, TrialItem } from '@/components/prototipe-trial/types';
import { ModalTambahTrial } from '@/components/prototipe-trial/ModalTambahTrial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Clock,
  ArrowRight,
  Paperclip,
  Edit3,
} from 'lucide-react';

export default function MakerTrialPage() {
  const { items, mounted } = useTrialStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<TrialItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'REVISI'>('ALL');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const q = search.toLowerCase();
      const matchSearch =
        item.item.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.cabang.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status tab filter
      if (statusFilter === 'DRAFT') return item.status === 'TRIAL_DRAFT';
      if (statusFilter === 'REVISI') return item.status === 'TRIAL_REVISI_MAKER';
      if (statusFilter === 'PENDING') {
        return ['TRIAL_PENDING_PP_MGR', 'TRIAL_PENDING_BM_GM', 'TRIAL_PENDING_SB_CONFIG'].includes(item.status);
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const nextIndex = useMemo(() => items.length + 101, [items]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Maker (Inisiasi)" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header Bersih */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                Peran: Maker
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500">Senior & Junior Manager</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Pengajuan Item Trial
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola dan inisiasi item material uji coba lapangan sebelum penetapan Master Harga.
            </p>
          </div>

          <Button
            onClick={() => {
              setItemToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 h-9 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Trial</span>
          </Button>
        </div>

        {/* Filter & Pencarian Ringkas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL' as const, label: 'Semua Item' },
              { id: 'PENDING' as const, label: 'Menunggu Persetujuan' },
              { id: 'REVISI' as const, label: 'Perlu Revisi' },
              { id: 'DRAFT' as const, label: 'Draf' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

        {/* Tabel Antrean Maker */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kode Item</th>
                  <th className="py-3.5 px-4">Material & Spesifikasi</th>
                  <th className="py-3.5 px-4">Cabang</th>
                  <th className="py-3.5 px-4">Durasi Uji</th>
                  <th className="py-3.5 px-4">Estimasi Harga</th>
                  <th className="py-3.5 px-4">Bongkaran</th>
                  <th className="py-3.5 px-4">Lampiran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mounted && filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const statusMeta = TRIAL_STATUS_MAP[item.status] || {
                      label: item.status,
                      badgeClass: 'bg-slate-100 text-slate-700',
                      dotColor: 'bg-slate-400',
                    };

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {item.kode}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">
                            {item.item}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.kategori} &bull; {item.merk} &bull; {item.ukuran}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {item.cabang}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.durasiBulan} Bulan
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          Rp {item.estimasiHargaMaker.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.isTermasukBongkaran ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              Termasuk
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.lampiranMakerName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600" title={item.lampiranMakerName}>
                              <Paperclip className="w-3 h-3" />
                              Ada
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
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
                            {(item.status === 'TRIAL_DRAFT' || item.status === 'TRIAL_REVISI_MAKER') && (
                              <button
                                onClick={() => {
                                  setItemToEdit(item);
                                  setIsModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                title="Edit Draf / Perbaiki Pengajuan"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit Draf</span>
                              </button>
                            )}
                            <Link
                              href={`/prototipe-trial/maker/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
                            >
                              <span>Detail</span>
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
                      Tidak ada pengajuan item trial yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Input / Edit Pengajuan Trial */}
      <ModalTambahTrial
        key={itemToEdit ? `edit-${itemToEdit.id}` : 'tambah-item-trial'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        nextIndex={nextIndex}
      />
    </div>
  );
}
