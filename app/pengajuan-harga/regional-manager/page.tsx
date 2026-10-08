"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Search,
  Clock,
  FlaskConical,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import { getStoredPengajuan } from '@/components/pengajuan-harga/store';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function RegionalManagerPage() {
  const { showAlert } = useGlobalAlert();

  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'trial'>('pending');
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

  // Filter 1: Items Pending Survei Reguler (Layer 3)
  const pendingItems = useMemo(() => {
    return items.filter((item) => {
      const isPending = item.status === 'PENDING_REGIONAL_MGR';
      if (!isPending) return false;

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

  // Filter 2: Items Pending Approval Usulan Trial (Jalur B)
  const trialPendingItems = useMemo(() => {
    return items.filter((item) => {
      const isPendingTrial = item.status === 'TRIAL_PENDING_REGIONAL_MGR';
      if (!isPendingTrial) return false;

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

  // Filter 2B: Permohonan Promosi Trial ke Master Resmi Permanen (Phase 5)
  const promosiPendingItems = useMemo(() => {
    return items.filter((item) => {
      const isPromosi =
        item.status === 'TRIAL_PROMOSI_REGIONAL_MGR' ||
        item.status === 'TRIAL_PROMOSI_BM_MGR';
      if (!isPromosi) return false;

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="B&M Regional Manager" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-300 text-purple-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                B&amp;M Regional Manager
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Portal Persetujuan Harga Satuan (Layer 3) &amp; Pengajuan Spesifikasi Sementara
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[90px]">
              <span className="text-[11px] text-slate-500 font-medium block">Survei Toko</span>
              <span className="text-lg font-bold text-amber-700">{pendingItems.length}</span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2 text-center min-w-[90px]">
              <span className="text-[11px] text-blue-700 font-medium block">Spek Sementara</span>
              <span className="text-lg font-bold text-blue-800">
                {trialPendingItems.length + promosiPendingItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl overflow-x-auto">
            {/* Tab 1: Survei Toko */}
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Survei Toko (Reguler)</span>
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

            {/* Tab 2: Pengajuan Spesifikasi Sementara */}
            <button
              onClick={() => setActiveTab('trial')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'trial'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              <span>Pengajuan Spesifikasi Sementara (Trial)</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'trial'
                    ? 'bg-blue-100 text-blue-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {trialPendingItems.length + promosiPendingItems.length}
              </Badge>
            </button>
          </div>

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

        {/* TAB 1: REGULER SURVEI TOKO (LAYER 3) */}
        {activeTab === 'pending' && (
          <PengajuanHargaTable
            items={pendingItems}
            showStatus={true}
            showHarga={true}
            title="Daftar Survei Toko Menunggu Persetujuan Layer 3"
            onResetFilter={() => setSearch('')}
            getDetailHref={(item) => `/pengajuan-harga/review/survei/${item.id}?from=regional-manager`}
          />
        )}

        {/* TAB 2: PENGAJUAN SPESIFIKASI SEMENTARA */}
        {activeTab === 'trial' && (
          <div className="space-y-6">
            {/* SECTION A: PERMOHONAN PROMOSI PERMANEN (JIKA ADA) */}
            {promosiPendingItems.length > 0 && (
              <PengajuanHargaTable
                items={promosiPendingItems}
                title="Permohonan Penetapan Master"
                showStatus={true}
                showHarga={true}
                onResetFilter={() => setSearch('')}
              />
            )}

            {/* TABEL PENGAJUAN SPESIFIKASI SEMENTARA (Ringkas 5-6 kolom standar via PengajuanHargaTable) */}
            <PengajuanHargaTable
              items={trialPendingItems}
              title="Daftar Pengajuan Spesifikasi Sementara Menunggu Persetujuan"
              showStatus={true}
              showHarga={true}
              onResetFilter={() => setSearch('')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
