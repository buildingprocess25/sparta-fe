"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
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
  Store,
  Search,
  RotateCcw,
  Plus,
  Pencil,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  UserCheck,
  FileText,
  MapPin,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { PengajuanHargaItem, MasterTokoItem } from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  getStoredMasterToko,
  saveStoredMasterToko,
} from '@/components/pengajuan-harga/store';
import { ModalTambahToko } from '@/components/pengajuan-harga/master-survei/ModalTambahToko';
import { DetailSurveiPasarModal } from '@/components/pengajuan-harga/master-survei/DetailSurveiPasarModal';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function MasterSurveiPage() {
  const { showAlert } = useGlobalAlert();

  // Data Store State
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [tokoList, setTokoList] = useState<MasterTokoItem[]>([]);

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<'hasil_survei' | 'master_toko' | 'status_tracker'>('hasil_survei');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterKota, setFilterKota] = useState<string>('all');

  // Modal State
  const [selectedItemDetail, setSelectedItemDetail] = useState<PengajuanHargaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [tokoToEdit, setTokoToEdit] = useState<MasterTokoItem | null>(null);
  const [isTokoModalOpen, setIsTokoModalOpen] = useState(false);

  // Load Data
  const loadData = () => {
    setItems(getStoredPengajuan());
    setTokoList(getStoredMasterToko());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Format Rupiah
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Metrik Statistik
  const itemsDisurvei = useMemo(() => {
    return items.filter((i) => i.surveyToko && i.surveyToko.length >= 3);
  }, [items]);

  const itemsMenunggu = useMemo(() => {
    return items.filter(
      (i) =>
        i.status === 'SIAP_SURVEI' ||
        ((i.status === 'DISETUJUI' || i.status === 'DISETUJUI_MASTERING') &&
          (!i.surveyToko || i.surveyToko.length < 3))
    );
  }, [items]);

  const itemsReview = useMemo(() => {
    return items.filter(
      (i) =>
        i.status === 'PENDING_BM_MGR' ||
        i.status === 'PENDING_SB_SPECIALIST' ||
        i.status === 'PENDING_REGIONAL_MGR' ||
        i.status === 'PENDING_KONTRAKTOR'
    );
  }, [items]);

  // Kategori List
  const categories = useMemo(() => {
    const setCat = new Set<string>();
    items.forEach((i) => {
      if (i.kategori) setCat.add(i.kategori);
    });
    return Array.from(setCat).sort();
  }, [items]);

  // Filter Items Hasil Survei
  const filteredSurveiItems = useMemo(() => {
    return items
      .filter((i) => i.surveyToko && i.surveyToko.length > 0)
      .filter((item) => {
        if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            item.kode.toLowerCase().includes(q) ||
            (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
            item.item.toLowerCase().includes(q) ||
            item.merk.toLowerCase().includes(q) ||
            item.kategori.toLowerCase().includes(q) ||
            item.lokasi.toLowerCase().includes(q) ||
            (item.surveyToko &&
              item.surveyToko.some(
                (s) =>
                  s.namaToko.toLowerCase().includes(q) ||
                  (s.alamatToko && s.alamatToko.toLowerCase().includes(q))
              ));
          if (!match) return false;
        }
        return true;
      });
  }, [items, filterKategori, search]);

  // Filter Master Toko
  const filteredTokoList = useMemo(() => {
    return tokoList.filter((toko) => {
      if (filterKota !== 'all' && toko.kota !== filterKota) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          toko.namaToko.toLowerCase().includes(q) ||
          toko.alamat.toLowerCase().includes(q) ||
          toko.kota.toLowerCase().includes(q) ||
          (toko.kontakPic && toko.kontakPic.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tokoList, filterKota, search]);

  // Filter Status Tracker (Semua Material Siap / Berjalan)
  const filteredTrackerItems = useMemo(() => {
    return items.filter((item) => {
      if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filterKategori, search]);

  // Handlers Toko
  const handleOpenTambahToko = () => {
    setTokoToEdit(null);
    setIsTokoModalOpen(true);
  };

  const handleOpenEditToko = (toko: MasterTokoItem) => {
    setTokoToEdit(toko);
    setIsTokoModalOpen(true);
  };

  const handleSaveToko = (tokoData: MasterTokoItem) => {
    let updated: MasterTokoItem[];
    if (tokoToEdit) {
      updated = tokoList.map((t) => (t.id === tokoData.id ? tokoData : t));
      showAlert({
        title: 'Toko Berhasil Diperbarui',
        message: `Data toko ${tokoData.namaToko} telah diperbarui.`,
        type: 'success',
      });
    } else {
      updated = [tokoData, ...tokoList];
      showAlert({
        title: 'Toko Baru Ditambahkan',
        message: `Toko ${tokoData.namaToko} berhasil didaftarkan ke direktori rekanan.`,
        type: 'success',
      });
    }
    setTokoList(updated);
    saveStoredMasterToko(updated);
  };

  const handleOpenDetailModal = (item: PengajuanHargaItem) => {
    setSelectedItemDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterKategori('all');
    setFilterKota('all');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Master Data Survei Harga Pasar" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Hero Card Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Master Data Survei Harga Pasar
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Database hasil survei 3 toko material, direktori rekanan, dan pelacakan survei lapangan BC
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
              <span className="text-[11px] text-slate-500 font-medium block">Total Selesai</span>
              <span className="text-lg font-bold text-slate-800">{itemsDisurvei.length}</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
              <span className="text-[11px] text-amber-700 font-medium block">Toko Terdaftar</span>
              <span className="text-lg font-bold text-amber-800">{tokoList.length}</span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
              <span className="text-[11px] text-blue-700 font-medium block">Siap Survei</span>
              <span className="text-lg font-bold text-blue-800">{itemsMenunggu.length}</span>
            </div>
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
              <span className="text-[11px] text-purple-700 font-medium block">Sedang Review</span>
              <span className="text-lg font-bold text-purple-800">{itemsReview.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigasi 3 Bagian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Tab 1: Hasil Survei */}
            <button
              onClick={() => setActiveTab('hasil_survei')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'hasil_survei'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Hasil Survei Pasar (3 Toko)</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === 'hasil_survei'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filteredSurveiItems.length}
              </span>
            </button>

            {/* Tab 2: Master Toko */}
            <button
              onClick={() => setActiveTab('master_toko')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'master_toko'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Master Toko / Supplier</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === 'master_toko'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tokoList.length}
              </span>
            </button>

            {/* Tab 3: Status Tracker */}
            <button
              onClick={() => setActiveTab('status_tracker')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'status_tracker'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pelacakan Status Survei</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === 'status_tracker'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filteredTrackerItems.length}
              </span>
            </button>
          </div>

          {/* Tombol Aksi Tambah Toko jika di Tab 2 */}
          {activeTab === 'master_toko' && (
            <div className="pb-1.5 self-end sm:self-auto shrink-0">
              <Button
                size="sm"
                onClick={handleOpenTambahToko}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 font-bold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Toko Rekanan</span>
              </Button>
            </div>
          )}
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Input Pencarian */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'master_toko'
                    ? 'Cari nama toko, alamat, kota...'
                    : 'Cari kode material, nama, merk, toko...'
                }
                className="pl-9 h-9 rounded-4xl text-xs border-slate-200 focus-visible:ring-amber-500/20 focus-visible:border-amber-500"
              />
            </div>

            {/* Filter Kategori (untuk Tab 1 & 3) */}
            {activeTab !== 'master_toko' && (
              <div className="w-full sm:w-52">
                <Select value={filterKategori} onValueChange={(val) => setFilterKategori(val)}>
                  <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
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
            )}

            {/* Filter Kota (untuk Tab 2) */}
            {activeTab === 'master_toko' && (
              <div className="w-full sm:w-52">
                <Select value={filterKota} onValueChange={(val) => setFilterKota(val)}>
                  <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
                    <SelectValue placeholder="Semua Wilayah Kota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Wilayah Kota</SelectItem>
                    <SelectItem value="Tangerang">Tangerang</SelectItem>
                    <SelectItem value="Tangerang Selatan">Tangerang Selatan</SelectItem>
                    <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                    <SelectItem value="Bekasi">Bekasi</SelectItem>
                    <SelectItem value="Bogor">Bogor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reset Filter Button */}
            {(search || filterKategori !== 'all' || filterKota !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 rounded-4xl text-xs text-slate-500 hover:text-slate-800 gap-1 px-3 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: DATA HASIL SURVEI PASAR (3 TOKO)
            ========================================================================= */}
        {activeTab === 'hasil_survei' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs md:text-sm font-bold text-slate-900 tracking-wide">
                  Daftar Hasil Survei Pasar Material
                </span>
                <span className="text-[11px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200 font-semibold">
                  {filteredSurveiItems.length} Material Disurvei
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                    <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] w-12">
                      No
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Kode Item
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Material &amp; Spesifikasi
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Kategori &amp; Lokasi
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 text-[11px] min-w-[280px]">
                      Hasil Survei 3 Toko
                    </th>
                    <th className="text-right px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Rata-rata Harga
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold whitespace-nowrap text-[11px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSurveiItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs text-slate-500">Tidak ada data hasil survei ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter pencarian</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSurveiItems.map((item, idx) => {
                      const stores = item.surveyToko || [];
                      const avgPrice = item.hargaRataRata || item.estimasiHarga || 0;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="text-center px-3 py-3 font-semibold text-slate-500 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              {item.kodeMaster || item.kode}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-100 min-w-[180px]">
                            <div className="font-bold text-slate-900">{item.item}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.merk} &bull; {item.ukuran}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{item.kategori}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.lokasi}</div>
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-100">
                            <div className="space-y-1">
                              {stores.map((s, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-200"
                                >
                                  <span className="font-medium text-slate-700 truncate max-w-[140px]" title={s.namaToko}>
                                    {s.namaToko || `Toko ${sIdx + 1}`}
                                  </span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {formatRupiah(s.hargaSatuan)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="text-right px-3.5 py-3 border-r border-slate-100 whitespace-nowrap font-mono font-bold text-emerald-700">
                            {formatRupiah(avgPrice)}
                          </td>
                          <td className="text-center px-3.5 py-3 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetailModal(item)}
                              className="h-7 text-[11px] px-2.5 rounded-lg border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Rincian</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MASTER TOKO / SUPPLIER BANGUNAN
            ========================================================================= */}
        {activeTab === 'master_toko' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs md:text-sm font-bold text-slate-900 tracking-wide">
                  Direktori Toko &amp; Supplier Rekanan
                </span>
                <span className="text-[11px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200 font-semibold">
                  {filteredTokoList.length} Toko Terdaftar
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                    <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] w-12">
                      No
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Nama Toko &amp; Wilayah
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 text-[11px] min-w-[220px]">
                      Alamat Lengkap
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Kontak &amp; Telepon
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      PIC Toko
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Status Toko
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold whitespace-nowrap text-[11px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTokoList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs text-slate-500">Belum ada toko yang sesuai dengan pencarian</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Klik &quot;Tambah Toko Rekanan&quot; untuk mendaftarkan toko baru</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTokoList.map((toko, idx) => (
                      <tr key={toko.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="text-center px-3 py-3.5 font-semibold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{toko.namaToko}</div>
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {toko.kota}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 text-slate-600 leading-relaxed">
                          {toko.alamat}
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap font-mono text-slate-700">
                          {toko.telepon ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {toko.telepon}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap text-slate-700">
                          {toko.kontakPic || '-'}
                        </td>
                        <td className="text-center px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          {toko.status === 'AKTIF' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="text-center px-3.5 py-3.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditToko(toko)}
                            className="h-7 text-[11px] px-2.5 rounded-lg border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold gap-1 cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PELACAKAN STATUS SURVEI
            ========================================================================= */}
        {activeTab === 'status_tracker' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs md:text-sm font-bold text-slate-900 tracking-wide">
                  Pelacakan Alur Kerja Survei Material
                </span>
                <span className="text-[11px] bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200 font-semibold">
                  {filteredTrackerItems.length} Material Terdaftar
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                    <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] w-12">
                      No
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Kode Item
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Material &amp; Spesifikasi
                    </th>
                    <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Kategori &amp; Lokasi
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Progres Survei
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                      Status Approval
                    </th>
                    <th className="text-center px-3.5 py-3 font-bold whitespace-nowrap text-[11px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTrackerItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs text-slate-500">Tidak ada material yang sesuai filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTrackerItems.map((item, idx) => {
                      const tokoCount = item.surveyToko ? item.surveyToko.length : 0;
                      const isComplete = tokoCount >= 3;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="text-center px-3 py-3 font-semibold text-slate-500 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                              {item.kodeMaster || item.kode}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-100 min-w-[180px]">
                            <div className="font-bold text-slate-900">{item.item}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.merk} &bull; {item.ukuran}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{item.kategori}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{item.lokasi}</div>
                          </td>
                          <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isComplete
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : tokoCount > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <Store className="w-3 h-3" />
                              {tokoCount}/3 Toko
                            </span>
                          </td>
                          <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                            {item.status === 'RELEASED' || item.status === 'APPROVED_ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Rilis di Master
                              </span>
                            ) : item.status === 'PENDING_BM_MGR' ||
                              item.status === 'PENDING_SB_SPECIALIST' ||
                              item.status === 'PENDING_REGIONAL_MGR' ||
                              item.status === 'PENDING_KONTRAKTOR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                                <Clock className="w-3 h-3 text-purple-600" />
                                Proses Verifikasi
                              </span>
                            ) : item.status === 'RETURNED_TO_BC' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Perlu Survei Ulang
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Menunggu Survei BC
                              </span>
                            )}
                          </td>
                          <td className="text-center px-3.5 py-3 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetailModal(item)}
                              className="h-7 text-[11px] px-2.5 rounded-lg border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Rincian</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Detail Survei Pasar 3 Toko */}
      <DetailSurveiPasarModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemDetail}
      />

      {/* Modal Tambah / Edit Toko Rekanan */}
      <ModalTambahToko
        isOpen={isTokoModalOpen}
        onClose={() => {
          setIsTokoModalOpen(false);
          setTokoToEdit(null);
        }}
        onSave={handleSaveToko}
        tokoToEdit={tokoToEdit}
      />
    </div>
  );
}
