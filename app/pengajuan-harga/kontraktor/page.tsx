"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Hammer,
  Search,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import {
  PengajuanHargaItem,
  DAFTAR_CABANG_ALFAMART,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';

export default function KontraktorPage() {
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'disepakati'>('pending');
  const [selectedCabang, setSelectedCabang] = useState<string>('Cikokol');
  const [search, setSearch] = useState('');

  // Load Initial Data
  const loadData = () => {
    setItems(getStoredPengajuan());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Filter Items Pending Konfirmasi Kontraktor (hanya cabang aktif kontraktor)
  const pendingItems = useMemo(() => {
    return items.filter((item) => {
      const isPending = item.status === 'PENDING_KONTRAKTOR';
      if (!isPending) return false;

      // Scoping Cabang: Kontraktor hanya menangani pengajuan cabang terkait
      if (selectedCabang !== 'all' && item.cabang && item.cabang !== selectedCabang) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          (item.cabang && item.cabang.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, search, selectedCabang]);

  // Filter Items Harga Telah Disepakati (Released)
  const disepakatiItems = useMemo(() => {
    return items.filter((item) => {
      const isReleased =
        item.status === 'RELEASED' ||
        item.status === 'APPROVED_ACTIVE' ||
        (item.historyLog && item.historyLog.some((l) => l.role === 'Kontraktor'));

      if (!isReleased) return false;

      // Scoping Cabang: Kontraktor hanya menangani pengajuan cabang terkait
      if (selectedCabang !== 'all' && item.cabang && item.cabang !== selectedCabang) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          (item.cabang && item.cabang.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, search, selectedCabang]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Portal Kontraktor" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Portal Kontraktor
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfirmasi &amp; kesepakatan harga satuan material (Layer 4)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector Kontraktor */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 px-3 flex items-center gap-2.5">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cabang Kontraktor</span>
                <span className="text-xs font-semibold text-slate-800">Wilayah Kerja</span>
              </div>
              <Select value={selectedCabang} onValueChange={setSelectedCabang}>
                <SelectTrigger className="h-8.5 w-36 bg-white text-slate-900 font-bold text-xs border border-slate-200 rounded-lg shadow-xs">
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {DAFTAR_CABANG_ALFAMART.map(c => (
                    <SelectItem key={c} value={c}>Cabang {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-500 font-medium block">Perlu Konfirmasi</span>
              <span className="text-lg font-bold text-amber-700">{pendingItems.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-500 font-medium block">Riwayat Keputusan</span>
              <span className="text-lg font-bold text-slate-800">{disepakatiItems.length}</span>
            </div>
          </div>
        </div>

        {/* Tab & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Perlu Konfirmasi</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'pending'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {pendingItems.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('disepakati')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'disepakati'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Riwayat Keputusan</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'disepakati'
                    ? 'bg-blue-100 text-blue-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {disepakatiItems.length}
              </Badge>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-white rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Tab 1: Perlu Konfirmasi */}
        {activeTab === 'pending' && (
          <PengajuanHargaTable
            items={pendingItems}
            showStatus={true}
            showHarga={true}
            title={selectedCabang === 'all' ? "Daftar Pengajuan Menunggu Konfirmasi Kontraktor (Semua Cabang)" : `Daftar Pengajuan Menunggu Konfirmasi Kontraktor - Cabang ${selectedCabang}`}
            onResetFilter={() => setSearch('')}
            getDetailHref={(item) => `/pengajuan-harga/kontraktor/${item.id}`}
          />
        )}

        {/* Tab 2: Riwayat Keputusan */}
        {activeTab === 'disepakati' && (
          <PengajuanHargaTable
            items={disepakatiItems}
            showStatus={true}
            showHarga={true}
            title={selectedCabang === 'all' ? "Daftar Riwayat Keputusan Kontraktor (Semua Cabang)" : `Daftar Riwayat Keputusan Kontraktor - Cabang ${selectedCabang}`}
            onResetFilter={() => setSearch('')}
            getDetailHref={(item) => `/pengajuan-harga/kontraktor/${item.id}`}
          />
        )}
      </main>
    </div>
  );
}
