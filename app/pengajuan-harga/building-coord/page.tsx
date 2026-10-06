"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppNavbar from '@/components/AppNavbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Store,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import { getStoredPengajuan } from '@/components/pengajuan-harga/store';
import { BuildingCoordHero } from '@/components/pengajuan-harga/building-coord/BuildingCoordHero';
import { ReusableSpecTable } from '@/components/pengajuan-harga/table/organisms/ReusableSpecTable';
import { ModalRincianToko } from '@/components/pengajuan-harga/building-coord/ModalRincianToko';
import { ModalCatatanApprover } from '@/components/pengajuan-harga/building-coord/ModalCatatanApprover';

export default function BuildingCoordPage() {
  const router = useRouter();

  // Data State
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'siap_survei' | 'diproses' | 'selesai'>('siap_survei');
  const [search, setSearch] = useState('');

  // Modal View Detail Survei State (Quick Preview 3 Toko)
  const [selectedItemDetail, setSelectedItemDetail] = useState<PengajuanHargaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal Catatan Review State (jika dikembalikan/revisi)
  const [selectedItemCatatan, setSelectedItemCatatan] = useState<PengajuanHargaItem | null>(null);
  const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);

  // Load Data Item dari LocalStorage (Sync on focus)
  const loadData = () => {
    setItems(getStoredPengajuan());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Filter Items Siap Survei
  const itemsSiapSurvei = useMemo(() => {
    return items.filter((item) => {
      const isSiap =
        item.status === 'SIAP_SURVEI' ||
        ((item.status === 'DISETUJUI' ||
          item.status === 'DISETUJUI_MASTERING') &&
          (!item.surveyToko || item.surveyToko.length < 3));

      if (!isSiap) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search]);

  // Filter Items Diproses (Sedang proses approval 4-layer atau dikembalikan untuk revisi survei)
  const itemsDiproses = useMemo(() => {
    return items.filter((item) => {
      const isDiproses =
        item.status === 'PENDING_BM_MGR' ||
        item.status === 'PENDING_SB_SPECIALIST' ||
        item.status === 'PENDING_REGIONAL_MGR' ||
        item.status === 'PENDING_KONTRAKTOR' ||
        item.status === 'RETURNED_TO_BC';

      if (!isDiproses) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search]);

  // Filter Items Selesai (Sudah disepakati final dan rilis)
  const itemsSelesai = useMemo(() => {
    return items.filter((item) => {
      const isSelesai =
        item.status === 'RELEASED' ||
        item.status === 'APPROVED_ACTIVE';

      if (!isSelesai) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search]);

  // Handlers untuk Modal Preview
  const handleOpenDetailModal = (item: PengajuanHargaItem) => {
    setSelectedItemDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleOpenCatatanModal = (item: PengajuanHargaItem) => {
    setSelectedItemCatatan(item);
    setIsCatatanModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AppNavbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-400 w-full mx-auto space-y-6">
        {/* Hero Section */}
        <BuildingCoordHero
          countSiapSurvei={itemsSiapSurvei.length}
          countDiproses={itemsDiproses.length}
          countSelesai={itemsSelesai.length}
        />

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab('siap_survei')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'siap_survei'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Siap Survei</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'siap_survei'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {itemsSiapSurvei.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('diproses')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'diproses'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Diproses</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'diproses'
                    ? 'bg-blue-100 text-blue-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {itemsDiproses.length}
              </Badge>
            </button>

            <button
              onClick={() => setActiveTab('selesai')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'selesai'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selesai</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'selesai'
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {itemsSelesai.length}
              </Badge>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari kode, material, merk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-white rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Content Section: Render ReusableSpecTable */}
        {activeTab === 'siap_survei' && (
          <ReusableSpecTable
            items={itemsSiapSurvei}
            title="Daftar Material Siap Survei"
            showStatus={true}
            showHarga={false}
            showCatatanReview={false}
            emptyTitle="Tidak Ada Material Menunggu Survei"
            emptyDescription="Semua material yang diajukan sudah disurvei atau belum diverifikasi oleh S&B Specialist."
            onResetFilter={() => setSearch('')}
            onIsiSurvei={(item) => router.push(`/pengajuan-harga/building-coord/${item.id}`)}
          />
        )}

        {activeTab === 'diproses' && (
          <ReusableSpecTable
            items={itemsDiproses}
            title="Daftar Pengajuan Harga Sedang Diproses (4-Layer Approval)"
            showStatus={true}
            showHarga={true}
            showCatatanReview={true}
            onViewCatatan={(item) => handleOpenCatatanModal(item)}
            emptyTitle="Belum Ada Pengajuan Diproses"
            emptyDescription="Tidak ada data survei harga yang sedang dalam proses verifikasi approver."
            onResetFilter={() => setSearch('')}
            onIsiSurvei={(item) => router.push(`/pengajuan-harga/building-coord/${item.id}`)}
          />
        )}

        {activeTab === 'selesai' && (
          <ReusableSpecTable
            items={itemsSelesai}
            title="Daftar Pengajuan Harga Selesai & Disetujui (Rilis Master Harga)"
            showStatus={true}
            showHarga={true}
            showCatatanReview={false}
            emptyTitle="Belum Ada Pengajuan Selesai"
            emptyDescription="Belum ada material yang telah menyelesaikan seluruh tahapan approval dan rilis."
            onResetFilter={() => setSearch('')}
          />
        )}
      </main>

      {/* Modal Quick View 3 Toko */}
      <ModalRincianToko
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemDetail}
      />

      {/* Modal Catatan Approver (jika returned) */}
      <ModalCatatanApprover
        isOpen={isCatatanModalOpen}
        onClose={() => setIsCatatanModalOpen(false)}
        item={selectedItemCatatan}
      />
    </div>
  );
}
