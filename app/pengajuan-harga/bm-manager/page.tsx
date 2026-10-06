"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Layers,
  Pencil,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  PengajuanHargaItem,
  PengajuanHargaFilterState,
  getKodeData,
  DAFTAR_CABANG_ALFAMART,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { TambahPengajuanModal } from '@/components/pengajuan-harga/TambahPengajuanModal';
import { ReviewUlangSpesifikasiModal } from '@/components/pengajuan-harga/ReviewUlangSpesifikasiModal';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from '@/components/pengajuan-harga/export-utils';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function BMManagerPage() {
  const { showAlert } = useGlobalAlert();

  // Tab State: 'materials' (Alur 1 / Daftar Spesifikasi) vs 'approvals' (Alur 2A / Approval Layer 1)
  const [activeTab, setActiveTab] = useState<'materials' | 'approvals'>('materials');

  // Master Data State
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [isReviewUlangModalOpen, setIsReviewUlangModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PengajuanHargaItem | null>(null);
  const [viewingCatatanItem, setViewingCatatanItem] = useState<PengajuanHargaItem | null>(null);
  const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Approval Modal State (Alur 2A)
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanHargaItem | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [catatanAction, setCatatanAction] = useState('');

  // Filter & Search State
  const [selectedCabang, setSelectedCabang] = useState<string>('Cikokol');
  const [filters, setFilters] = useState<PengajuanHargaFilterState>({
    search: '',
    kategori: 'all',
    merk: 'all',
    implementasi: 'all',
  });

  // Load Initial Data from Store
  useEffect(() => {
    const stored = getStoredPengajuan();
    setItems(stored);
  }, []);

  // Dropdown Categories & Brands
  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.kategori).filter(Boolean)));
  }, [items]);

  const brands = useMemo(() => {
    return Array.from(new Set(items.map(i => i.merk).filter(Boolean)));
  }, [items]);

  // Filtered Items untuk Tab "Daftar Spesifikasi Material"
  const filteredMaterials = useMemo(() => {
    return items.filter(item => {
      // Filter Cabang Pengaju: B&M Manager beroperasi per cabang
      if (selectedCabang !== 'all' && item.cabang && item.cabang !== selectedCabang) {
        return false;
      }

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const match =
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.tipe.toLowerCase().includes(q) ||
          item.warna.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          (item.cabang && item.cabang.toLowerCase().includes(q)) ||
          item.deskripsiOtomatis.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.kategori !== 'all' && item.kategori !== filters.kategori) return false;
      if (filters.merk !== 'all' && item.merk !== filters.merk) return false;
      if (filters.implementasi !== 'all' && item.implementasi !== filters.implementasi) return false;
      return true;
    });
  }, [items, filters, selectedCabang]);

  // Items Pending Approval Layer 1 (Survei Harga dari Building Coordinator)
  const pendingApprovals = useMemo(() => {
    return items.filter(i => {
      if (i.status !== 'PENDING_BM_MGR') return false;
      if (selectedCabang !== 'all' && i.cabang && i.cabang !== selectedCabang) return false;
      return true;
    });
  }, [items, selectedCabang]);

  const filteredPendingApprovals = useMemo(() => {
    if (!filters.search.trim()) return pendingApprovals;
    const q = filters.search.toLowerCase();
    return pendingApprovals.filter(i =>
      i.kode.toLowerCase().includes(q) ||
      (i.kodeMaster && i.kodeMaster.toLowerCase().includes(q)) ||
      i.item.toLowerCase().includes(q) ||
      i.merk.toLowerCase().includes(q) ||
      i.lokasi.toLowerCase().includes(q) ||
      (i.cabang && i.cabang.toLowerCase().includes(q))
    );
  }, [pendingApprovals, filters.search]);

  // Handlers
  const handleOpenEditModal = (item: PengajuanHargaItem) => {
    setEditingItem(item);
    setIsTambahModalOpen(true);
  };

  const handleCloseTambahModal = () => {
    setIsTambahModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenCatatanModal = (item: PengajuanHargaItem) => {
    setViewingCatatanItem(item);
    setIsCatatanModalOpen(true);
  };

  const handleAddItem = (newItem: PengajuanHargaItem) => {
    // Validasi 2-tier: Scope Pekerjaan (SIP) & Varian (A, B, C...)
    const itemsToCheck = editingItem
      ? items.filter(i => i.id !== editingItem.id)
      : items;

    const check = getKodeData({
      kategori: newItem.kategori,
      item: newItem.item,
      implementasi: newItem.implementasi,
      lokasi: newItem.lokasi,
      ukuran: newItem.ukuran,
      merk: newItem.merk,
      warna: newItem.warna,
      tipe: newItem.tipe,
      permukaan: newItem.permukaan,
      tebal: newItem.tebal,
      toleransi: newItem.toleransi,
      existingItems: itemsToCheck,
    });

    if (check.isDuplicate) {
      showAlert({
        title: 'Perhatian',
        message: 'Data material sudah terdaftar.',
        type: 'warning',
      });
      return;
    }

    if (editingItem || items.some(i => i.id === newItem.id)) {
      // Mode Edit / Resubmit Revisi
      const updated = items.map(i => (i.id === newItem.id ? newItem : i));
      setItems(updated);
      saveStoredPengajuan(updated);
      setEditingItem(null);
      showAlert({
        title: 'Berhasil',
        message: 'Pengajuan berhasil diajukan ulang.',
        type: 'success',
      });
      return;
    }

    // Tetapkan status awal untuk alur kerja dan pastikan kode tersinkron
    const itemWithStatus: PengajuanHargaItem = {
      ...newItem,
      cabang: newItem.cabang || (selectedCabang !== 'all' ? selectedCabang : 'Cikokol'),
      kode: newItem.kode || check.kodeItem,
      kodeMaster: newItem.kodeMaster || check.kodeMaster,
      status: 'DIAJUKAN',
      tanggalPengajuan: newItem.tanggalPengajuan || new Date().toISOString().slice(0, 10),
    };
    const updated = [itemWithStatus, ...items];
    setItems(updated);
    saveStoredPengajuan(updated);

    showAlert({
      title: 'Berhasil',
      message: 'Material berhasil diajukan.',
      type: 'success',
    });
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      kategori: 'all',
      merk: 'all',
      implementasi: 'all',
    });
  };

  // Export Handlers
  const handleExportCSV = () => {
    const targetData = activeTab === 'materials' ? filteredMaterials : filteredPendingApprovals;
    if (targetData.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    exportToCSV(targetData);
    showAlert({ title: 'Berhasil Diunduh', message: 'File CSV berhasil diunduh.', type: 'success' });
  };

  const handleExportExcel = () => {
    const targetData = activeTab === 'materials' ? filteredMaterials : filteredPendingApprovals;
    if (targetData.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    exportToExcel(targetData);
    showAlert({ title: 'Berhasil Diunduh', message: 'File Excel (.xls) berhasil diunduh.', type: 'success' });
  };

  const handleExportPDF = async () => {
    const targetData = activeTab === 'materials' ? filteredMaterials : filteredPendingApprovals;
    if (targetData.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    setIsExporting(true);
    try {
      await exportToPDF(targetData);
      showAlert({ title: 'Berhasil Diunduh', message: 'Dokumen PDF spesifikasi material berhasil diunduh.', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Gagal Mengunduh', message: e?.message || 'Terjadi kesalahan saat membuat file PDF.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // Approval Handlers (Alur 2A Layer 1)
  const handleOpenApprovalModal = (item: PengajuanHargaItem, action: 'APPROVE' | 'REJECT') => {
    setSelectedPengajuan(item);
    setApprovalAction(action);
    setCatatanAction(action === 'APPROVE' ? 'Disetujui oleh B&M Manager.' : '');
    setIsApprovalModalOpen(true);
  };

  const handleExecuteApproval = () => {
    if (!selectedPengajuan) return;

    const isApprove = approvalAction === 'APPROVE';
    const isSurveyApproval = selectedPengajuan.status === 'PENDING_BM_MGR';
    const nextStatus = isApprove
      ? (isSurveyApproval ? 'PENDING_SB_SPECIALIST' : 'DISETUJUI')
      : (isSurveyApproval ? 'RETURNED_TO_BC' : 'DITOLAK');

    const updated = items.map(i => {
      if (i.id === selectedPengajuan.id) {
        const newLog = [
          ...(i.historyLog || []),
          {
            role: 'B&M Manager' as const,
            action: isApprove ? ('APPROVE' as const) : ('REJECT' as const),
            tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
            catatan: catatanAction.trim() || (isApprove ? 'Disetujui B&M Manager' : 'Ditolak dan dikembalikan ke BC'),
          },
        ];
        return {
          ...i,
          status: nextStatus as any,
          historyLog: newLog,
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsApprovalModalOpen(false);

    if (isApprove) {
      showAlert({
        title: 'Berhasil',
        message: 'Pengajuan harga disetujui.',
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Berhasil',
        message: 'Pengajuan dikembalikan.',
        type: 'warning',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Ruang Kerja B&M Manager" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 space-y-5">
        {/* Banner Header Role B&M Manager */}
        <div className="bg-red-600 p-5 md:p-6 rounded-xl text-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-700/20">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/10 rounded-xl shrink-0 border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Building &amp; Maintenance (B&amp;M) Manager
              </h1>
              <p className="text-xs md:text-sm text-red-100 mt-0.5 max-w-2xl font-normal">
                Kelola pengajuan spesifikasi material dan persetujuan harga gerai per unit cabang operasional.
              </p>
            </div>
          </div>

          {/* Selector Cabang Operasional B&M */}
          <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-xl p-2 px-3.5 flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider">Filter Cabang</span>
            </div>
            <Select value={selectedCabang} onValueChange={setSelectedCabang}>
              <SelectTrigger className="h-8.5 w-40 bg-white text-slate-900 font-bold text-xs border-0 rounded-lg shadow-xs">
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
        </div>

        {/* Tab Switcher Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'materials'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pengajuan Spesifikasi</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              activeTab === 'materials' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {filteredMaterials.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Persetujuan Harga</span>
            {pendingApprovals.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-600 text-white">
                {pendingApprovals.length} Menunggu
              </span>
            )}
          </button>
        </div>

        {/* Search, Filter & Action Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center justify-between">
          {/* Left: Search & Filter Selects */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Cari kode, material, merk, kategori..."
                className="pl-9 h-9 rounded-lg text-xs border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-red-500"
              />
            </div>

            {activeTab === 'materials' && (
              <>
                {/* Kategori Filter */}
                <div className="w-full sm:w-40">
                  <Select
                    value={filters.kategori}
                    onValueChange={val => setFilters(prev => ({ ...prev, kategori: val }))}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Merk Filter */}
                <div className="w-full sm:w-36">
                  <Select
                    value={filters.merk}
                    onValueChange={val => setFilters(prev => ({ ...prev, merk: val }))}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200">
                      <SelectValue placeholder="Semua Merk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Merk</SelectItem>
                      {brands.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Implementasi / Posisi Filter */}
                <div className="w-full sm:w-36">
                  <Select
                    value={filters.implementasi}
                    onValueChange={val => setFilters(prev => ({ ...prev, implementasi: val }))}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-xs border-slate-200">
                      <SelectValue placeholder="Semua Posisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Posisi</SelectItem>
                      <SelectItem value="Lantai">Lantai</SelectItem>
                      <SelectItem value="Dinding">Dinding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Reset Filters */}
            {(filters.search || filters.kategori !== 'all' || filters.merk !== 'all' || filters.implementasi !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 rounded-lg text-xs text-slate-500 hover:text-slate-800 gap-1 px-3 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          {/* Right: Export & Tambah Pengajuan Actions */}
          <div className="flex items-center gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
            {/* Export Dropdown Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-lg h-9 text-xs gap-1.5 border-slate-200 hover:bg-slate-100 flex-1 sm:flex-initial"
                  disabled={isExporting}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Mengunduh...' : 'Unduh Data'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
                <DropdownMenuItem onClick={handleExportCSV} className="text-xs cursor-pointer gap-2 py-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Unduh CSV (.csv)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="text-xs cursor-pointer gap-2 py-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Unduh Excel (.xls)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="text-xs cursor-pointer gap-2 py-2">
                  <Download className="w-4 h-4 text-rose-600" />
                  <span>Unduh PDF (.pdf)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown Tambah Pengajuan (Pengajuan Baru vs Pembaruan Item) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-lg h-9 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs flex-1 sm:flex-initial cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengajuan</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-slate-200 p-1.5">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(null);
                    setIsTambahModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2 px-2.5 gap-2.5 rounded-lg hover:bg-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Pengajuan Baru</div>
                    <div className="text-[11px] text-slate-500">Input spesifikasi material baru</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setIsReviewUlangModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2 px-2.5 gap-2.5 rounded-lg hover:bg-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Review Ulang Spesifikasi</div>
                    <div className="text-[11px] text-slate-500">Dari katalog master harga resmi</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TAB 1: Daftar Spesifikasi Material menggunakan PengajuanHargaTable */}
        {activeTab === 'materials' && (
          <PengajuanHargaTable
            items={filteredMaterials}
            showStatus={true}
            showHarga={false}
            title={selectedCabang === 'all' ? "Daftar Spesifikasi Material (Semua Cabang)" : `Daftar Spesifikasi Material - Cabang ${selectedCabang}`}
            onEditItem={handleOpenEditModal}
            onResetFilter={handleResetFilters}
          />
        )}

        {/* TAB 2: Review Approval Layer 1 menggunakan PengajuanHargaTable */}
        {activeTab === 'approvals' && (
          <PengajuanHargaTable
            items={filteredPendingApprovals}
            showStatus={true}
            showHarga={true}
            title={selectedCabang === 'all' ? "Daftar Pengajuan Harga (Semua Cabang)" : `Daftar Pengajuan Harga - Cabang ${selectedCabang}`}
            onResetFilter={handleResetFilters}
          />
        )}
      </main>

      {/* Modal Tambah Spesifikasi Baru / Edit Revisi */}
      <TambahPengajuanModal
        isOpen={isTambahModalOpen}
        onClose={handleCloseTambahModal}
        onSubmit={handleAddItem}
        nextIndex={items.length + 1}
        existingItems={items}
        itemToEdit={editingItem}
      />

      {/* Modal Review Ulang Spesifikasi (Khusus Item dari Master Katalog) */}
      <ReviewUlangSpesifikasiModal
        isOpen={isReviewUlangModalOpen}
        onClose={() => setIsReviewUlangModalOpen(false)}
        onSubmit={handleAddItem}
        existingItems={items}
      />

      {/* Modal Konfirmasi Approval Layer 1 */}
      <Dialog open={isApprovalModalOpen} onOpenChange={open => !open && setIsApprovalModalOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              {approvalAction === 'APPROVE' ? (
                <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="p-1 bg-rose-100 text-rose-700 rounded-lg">
                  <XCircle className="w-4 h-4" />
                </span>
              )}
              {approvalAction === 'APPROVE' ? 'Setujui Pengajuan (Layer 1)' : 'Tolak & Kembalikan ke BC'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedPengajuan?.kode} - {selectedPengajuan?.item} ({selectedPengajuan?.merk})</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Bar Timeline Pengajuan */}
          {selectedPengajuan && (
            <div className="my-2">
              <PengajuanTimelineBar item={selectedPengajuan} />
            </div>
          )}

          {/* Rincian Survei 3 Toko (Reusable Component) */}
          {selectedPengajuan?.surveyToko && selectedPengajuan.surveyToko.length > 0 && (
            <div className="py-2 border-y border-slate-100 my-2">
              <RincianSurvei3TokoCard
                mode="readonly"
                surveyToko={selectedPengajuan.surveyToko}
                satuan={selectedPengajuan.satuan || 'm2'}
                materialCode={selectedPengajuan.kodeMaster || selectedPengajuan.kode}
                materialName={`${selectedPengajuan.item} ${selectedPengajuan.ukuran} ${selectedPengajuan.merk}`}
              />
            </div>
          )}

          <div className="space-y-3 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Catatan B&amp;M Manager</label>
              <Textarea
                value={catatanAction}
                onChange={e => setCatatanAction(e.target.value)}
                placeholder="Tuliskan catatan alasan persetujuan atau poin revisi penolakan..."
                className="text-xs rounded-xl border-slate-200 min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExecuteApproval}
              className={`rounded-xl h-8 text-xs font-semibold text-white cursor-pointer ${
                approvalAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {approvalAction === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Kembalikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Catatan S&B (Ringkas) */}
      <Dialog
        open={isCatatanModalOpen}
        onOpenChange={(open) => !open && setIsCatatanModalOpen(false)}
      >
        <DialogContent className="max-w-md rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Catatan {viewingCatatanItem?.status === 'REVISI' || viewingCatatanItem?.status === 'PERLU_REVISI' ? 'Revisi' : 'Penolakan'} S&amp;B
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {viewingCatatanItem?.kode} - {viewingCatatanItem?.item} ({viewingCatatanItem?.merk})
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
              {(() => {
                const sbLog = viewingCatatanItem?.historyLog
                  ?.slice()
                  .reverse()
                  .find(
                    (l) =>
                      l.role === 'S&B Specialist' ||
                      l.action === 'REVISE' ||
                      l.action === 'REJECT'
                  );
                return sbLog?.catatan || viewingCatatanItem?.catatanReview || '-';
              })()}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCatatanModalOpen(false)}
              className="rounded-lg h-8 text-xs cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
