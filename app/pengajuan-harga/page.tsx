"use client";

import React, { useState, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { PengajuanHargaItem, PengajuanHargaFilterState } from '@/components/pengajuan-harga/types';
import { INITIAL_PENGAJUAN_HARGA_ITEMS } from '@/components/pengajuan-harga/mock-data';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { TambahPengajuanModal } from '@/components/pengajuan-harga/TambahPengajuanModal';
import { exportToCSV, exportToExcel, exportToPDF } from '@/components/pengajuan-harga/export-utils';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function PengajuanHargaPage() {
  const { showAlert } = useGlobalAlert();
  const [items, setItems] = useState<PengajuanHargaItem[]>(INITIAL_PENGAJUAN_HARGA_ITEMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter & Search State
  const [filters, setFilters] = useState<PengajuanHargaFilterState>({
    search: '',
    kategori: 'all',
    merk: 'all',
    implementasi: 'all',
  });

  // Unique Filter Options
  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.kategori).filter(Boolean)));
  }, [items]);

  const brands = useMemo(() => {
    return Array.from(new Set(items.map(i => i.merk).filter(Boolean)));
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search Match
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const match =
          item.kode.toLowerCase().includes(q) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.tipe.toLowerCase().includes(q) ||
          item.warna.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.deskripsiOtomatis.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Kategori Filter
      if (filters.kategori !== 'all' && item.kategori !== filters.kategori) {
        return false;
      }

      // Merk Filter
      if (filters.merk !== 'all' && item.merk !== filters.merk) {
        return false;
      }

      // Implementasi Filter
      if (filters.implementasi !== 'all' && item.implementasi !== filters.implementasi) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  // Handlers
  const handleAddItem = (newItem: PengajuanHargaItem) => {
    setItems(prev => [newItem, ...prev]);
    showAlert({
      title: 'Berhasil Ditambahkan',
      message: `${newItem.item} (${newItem.kode}) berhasil ditambahkan ke daftar pengajuan.`,
      type: 'success',
    });
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(i => i.id === id);
    showAlert({
      title: 'Hapus Material',
      message: `Apakah Anda yakin ingin menghapus ${target?.item || 'item ini'} (${target?.kode}) dari daftar?`,
      type: 'warning',
      confirmMode: true,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        setItems(prev => prev.filter(i => i.id !== id));
        showAlert({
          title: 'Berhasil Dihapus',
          message: 'Material berhasil dihapus dari daftar.',
          type: 'info',
        });
      },
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
    if (filteredItems.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    exportToCSV(filteredItems);
    showAlert({ title: 'Berhasil Diunduh', message: 'File CSV berhasil diunduh.', type: 'success' });
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    exportToExcel(filteredItems);
    showAlert({ title: 'Berhasil Diunduh', message: 'File Excel (.xls) berhasil diunduh.', type: 'success' });
  };

  const handleExportPDF = async () => {
    if (filteredItems.length === 0) {
      showAlert({ title: 'Data Kosong', message: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    setIsExporting(true);
    try {
      await exportToPDF(filteredItems);
      showAlert({ title: 'Berhasil Diunduh', message: 'Dokumen PDF spesifikasi material berhasil diunduh.', type: 'success' });
    } catch (e: any) {
      showAlert({ title: 'Gagal Mengunduh', message: e?.message || 'Terjadi kesalahan saat membuat file PDF.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Pengajuan Harga" showBackButton backHref="/dashboard" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Page Title Header */}
        <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
            <Tag className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Pengajuan Harga Material
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Daftar spesifikasi material dan pengajuan harga standar toko
            </p>
          </div>
        </div>

        {/* Search, Filter & Action Toolbar (Tanpa KPI Cards, Tombol Export & Tambah Dipindahkan ke Sini) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center justify-between">
          {/* Left: Search & Dropdown Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Cari kode, material, merk, warna, area..."
                className="pl-9 h-9 rounded-4xl text-xs border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-red-500"
              />
            </div>

            {/* Kategori Filter */}
            <div className="w-full sm:w-40">
              <Select
                value={filters.kategori}
                onValueChange={val => setFilters(prev => ({ ...prev, kategori: val }))}
              >
                <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
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
                <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
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

            {/* Posisi Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={filters.implementasi}
                onValueChange={val => setFilters(prev => ({ ...prev, implementasi: val }))}
              >
                <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
                  <SelectValue placeholder="Semua Posisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Posisi</SelectItem>
                  <SelectItem value="Lantai">Lantai</SelectItem>
                  <SelectItem value="Dinding">Dinding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {(filters.search || filters.kategori !== 'all' || filters.merk !== 'all' || filters.implementasi !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 rounded-4xl text-xs text-slate-500 hover:text-slate-800 gap-1 px-3 shrink-0"
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
                  className="rounded-4xl h-9 text-xs gap-1.5 border-slate-200 hover:bg-slate-100 flex-1 sm:flex-initial"
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

            {/* Tambah Pengajuan Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-4xl h-9 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengajuan</span>
            </Button>
          </div>
        </div>

        {/* Master Spesifikasi Table Component */}
        <PengajuanHargaTable
          items={filteredItems}
          onDeleteItem={handleDeleteItem}
          title="Daftar Spesifikasi Material"
        />
      </main>

      {/* Modal Tambah Pengajuan */}
      <TambahPengajuanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddItem}
        nextIndex={items.length + 1}
        existingItems={items}
      />
    </div>
  );
}
