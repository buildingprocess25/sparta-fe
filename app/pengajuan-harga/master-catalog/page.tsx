"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RotateCcw,
  Search,
} from 'lucide-react';
import { PengajuanHargaItem, DAFTAR_CABANG_ALFAMART } from '@/components/pengajuan-harga/types';
import { getStoredPengajuan } from '@/components/pengajuan-harga/store';
import { KatalogMasterTable } from '@/components/pengajuan-harga/KatalogMasterTable';
import { DetailMasterCatalogModal } from '@/components/pengajuan-harga/DetailMasterCatalogModal';
import { getTrialBadgeInfo } from '@/components/pengajuan-harga/trial-utils';

export default function MasterCatalogPage() {
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'official' | 'trial'>('official');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCabang, setSelectedCabang] = useState<string>('all');
  const [onlyActionRequired, setOnlyActionRequired] = useState(false);

  // Modal Detail Rincian State
  const [selectedItem, setSelectedItem] = useState<PengajuanHargaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load Data
  const loadData = () => {
    setItems(getStoredPengajuan());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Filter Items Released / Active in Master Catalog
  const allMasterItems = useMemo(() => {
    return items.filter((item) => {
      const isOfficial =
        item.status === 'RELEASED' ||
        item.status === 'APPROVED_ACTIVE' ||
        item.status === 'DISETUJUI_MASTERING';

      const isTrial =
        item.status === 'TRIAL_RELEASED' ||
        item.status === 'TRIAL_PROMOSI_BM_MGR' ||
        item.status === 'TRIAL_PROMOSI_REGIONAL_MGR' ||
        item.status === 'TRIAL_PROMOSI_KONTRAKTOR';

      return isOfficial || isTrial;
    });
  }, [items]);

  // Unique Categories
  const categories = useMemo(() => {
    const setCat = new Set<string>();
    allMasterItems.forEach((i) => {
      if (i.kategori) setCat.add(i.kategori);
    });
    return Array.from(setCat).sort();
  }, [allMasterItems]);

  // Counts for Stats & Tabs
  const officialCount = useMemo(() => {
    return allMasterItems.filter(
      (i) =>
        !i.isTrial &&
        (i.status === 'RELEASED' ||
          i.status === 'APPROVED_ACTIVE' ||
          i.status === 'DISETUJUI_MASTERING')
    ).length;
  }, [allMasterItems]);

  const trialCount = useMemo(() => {
    return allMasterItems.filter(
      (i) =>
        i.isTrial ||
        i.status === 'TRIAL_RELEASED' ||
        i.status.startsWith('TRIAL_PROMOSI_')
    ).length;
  }, [allMasterItems]);

  const urgentTrialCount = useMemo(() => {
    return allMasterItems.filter((i) => {
      const isTrial =
        i.isTrial ||
        i.status === 'TRIAL_RELEASED' ||
        i.status.startsWith('TRIAL_PROMOSI_');
      if (!isTrial) return false;
      return getTrialBadgeInfo(i).isActionRequired;
    }).length;
  }, [allMasterItems]);

  // Filter Berdasarkan Tab, Kategori, Search, & Urgent Toggle
  const filteredItems = useMemo(() => {
    return allMasterItems.filter((item) => {
      const isTrial =
        Boolean(item.isTrial) ||
        item.status === 'TRIAL_RELEASED' ||
        item.status.startsWith('TRIAL_PROMOSI_');

      // 1. Filter Tab
      if (activeTab === 'official' && isTrial) return false;
      if (activeTab === 'trial' && !isTrial) return false;

      // 2. Filter Kategori
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) {
        return false;
      }

      // 3. Filter Cabang (Menampilkan material yang aktif di cabang tersebut)
      if (selectedCabang !== 'all') {
        const isBranchActive = (item.hargaPerCabang || []).some(
          (c) => c.cabang.toLowerCase() === selectedCabang.toLowerCase() && c.status === 'AKTIF'
        );
        if (!isBranchActive) return false;
      }

      // 4. Filter Hanya Perlu Tindakan
      if (onlyActionRequired) {
        if (!isTrial) return false;
        const badgeInfo = getTrialBadgeInfo(item);
        if (!badgeInfo.isActionRequired) return false;
      }

      // 5. Filter Search Keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          (item.deskripsiOtomatis && item.deskripsiOtomatis.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [allMasterItems, activeTab, selectedCategory, selectedCabang, onlyActionRequired, search]);

  const handleOpenDetail = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleResetFilter = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCabang('all');
    setOnlyActionRequired(false);
  };

  const tableTitle = useMemo(() => {
    if (activeTab === 'official') return 'Daftar Master Harga Resmi & Permanen';
    return 'Daftar Master Harga Uji Coba Lapangan (Trial 3 Bulan)';
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Katalog Master Harga" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 lg:p-8 space-y-5">
        {/* Header & Statistik Rilis */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Katalog Master Harga
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar spesifikasi material resmi nasional &amp; uji coba lapangan standar Alfamart
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-center min-w-[85px]">
              <span className="text-[11px] text-slate-500 font-medium block">Total Rilis</span>
              <span className="text-base font-bold text-slate-800">{allMasterItems.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-center min-w-[85px]">
              <span className="text-[11px] text-slate-500 font-medium block">Master Resmi</span>
              <span className="text-base font-bold text-emerald-600">{officialCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-center min-w-[85px]">
              <span className="text-[11px] text-slate-500 font-medium block">Master Trial</span>
              <span className="text-base font-bold text-purple-600">{trialCount}</span>
            </div>
            {urgentTrialCount > 0 && (
              <div
                onClick={() => {
                  setActiveTab('trial');
                  setOnlyActionRequired(true);
                }}
                className="bg-white border border-amber-300 rounded-lg px-3.5 py-1.5 text-center min-w-[85px] cursor-pointer hover:bg-amber-50 transition-colors"
                title="Klik untuk memfilter item trial yang perlu evaluasi"
              >
                <span className="text-[11px] text-amber-700 font-semibold block">
                  Perlu Evaluasi
                </span>
                <span className="text-base font-bold text-amber-600">{urgentTrialCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Filter Utama (Solid Badge Tanpa Ikon Status) */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">

          {/* Tab 2: Master Resmi */}
          <button
            onClick={() => {
              setActiveTab('official');
              setOnlyActionRequired(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'official'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Master Harga</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold select-none ${
                activeTab === 'official'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {officialCount}
            </span>
          </button>

          {/* Tab 3: Master Trial */}
          <button
            onClick={() => setActiveTab('trial')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trial'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Master Trial</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold select-none ${
                activeTab === 'trial'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {trialCount}
            </span>
          </button>
        </div>

        {/* Toolbar: Search, Filter Kategori, Filter Cabang & Reset (Standar Enterprise rounded-lg) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode item, nama material, merk..."
                className="pl-9 h-9 rounded-lg text-xs border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
              />
            </div>

            {/* Filter Kategori */}
            <div className="w-full sm:w-52">
              <Select
                value={selectedCategory}
                onValueChange={(val) => setSelectedCategory(val)}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200 bg-white">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Cabang */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedCabang}
                onValueChange={(val) => setSelectedCabang(val)}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200 bg-white">
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {DAFTAR_CABANG_ALFAMART.map((c) => (
                    <SelectItem key={c} value={c}>
                      Cabang {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {(search || selectedCategory !== 'all' || selectedCabang !== 'all' || onlyActionRequired) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 rounded-lg text-xs text-slate-500 hover:text-slate-800 gap-1 px-3 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabel Katalog Hierarki via KatalogMasterTable */}
        <KatalogMasterTable
          items={filteredItems}
          activeTab={activeTab}
          onOpenDetail={handleOpenDetail}
          selectedCabangFilter={selectedCabang}
        />
      </main>

      {/* Modal Detail Rincian Master Harga */}
      <DetailMasterCatalogModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItem}
        onItemUpdated={(updated) => {
          setSelectedItem(updated);
          loadData();
        }}
      />
    </div>
  );
}
