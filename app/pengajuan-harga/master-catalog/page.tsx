"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Database,
  Search,
  BadgeCheck,
  Eye,
  FileText,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import { getStoredPengajuan } from '@/components/pengajuan-harga/store';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';

export default function MasterCatalogPage() {
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [search, setSearch] = useState('');

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
  const catalogItems = useMemo(() => {
    return items.filter((item) => {
      const isReleased =
        item.status === 'RELEASED' ||
        item.status === 'APPROVED_ACTIVE' ||
        item.status === 'DISETUJUI_MASTERING';

      if (!isReleased) return false;

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

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenDetail = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Katalog Master Harga" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Katalog Master Harga Aktif
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar harga satuan material yang telah melalui 4 layer approval dan resmi dirilis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[120px]">
              <span className="text-[11px] text-slate-500 font-medium block">Total Item Rilis</span>
              <span className="text-lg font-bold text-emerald-700">{catalogItems.length}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
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

        {/* Tabel Katalog */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Harga Satuan Material Resmi
            </h2>
            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">
              {catalogItems.length} Material
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                  <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    No
                  </th>
                  <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Kode Master
                  </th>
                  <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Material
                  </th>
                  <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Merk &amp; Ukuran
                  </th>
                  <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Kategori &amp; Lokasi
                  </th>
                  <th className="text-right px-4 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Harga Satuan Rilis
                  </th>
                  <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Status
                  </th>
                  <th className="text-center px-3 py-3 font-bold whitespace-nowrap text-[11px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {catalogItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-500">
                        Belum ada data material dalam katalog.
                      </p>
                    </td>
                  </tr>
                ) : (
                  catalogItems.map((item, idx) => {
                    const finalPrice = item.hargaRataRata || item.estimasiHarga || 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="text-center px-3 py-3.5 font-semibold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                            {item.kodeMaster || item.kode}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100">
                          {item.item}
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          {item.merk} ({item.ukuran})
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap text-slate-600">
                          {item.kategori} &bull; {item.lokasi}
                        </td>
                        <td className="text-right px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-mono text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            {formatRupiah(finalPrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            / {item.satuan || 'm2'}
                          </span>
                        </td>
                        <td className="text-center px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Aktif (Rilis)
                          </span>
                        </td>
                        <td className="text-center px-3 py-3.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(item)}
                            className="h-7 text-[11px] px-2.5 rounded-lg gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
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
      </main>

      {/* Modal Detail Rincian Master Harga (Termasuk Rincian 3 Toko) */}
      <Dialog open={isDetailModalOpen} onOpenChange={(open) => !open && setIsDetailModalOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Rincian Master Harga Material</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Kode Master: <strong>{selectedItem?.kodeMaster || selectedItem?.kode}</strong> &bull; {selectedItem?.item} ({selectedItem?.merk})
            </DialogDescription>
          </DialogHeader>

          {/* Rincian 3 Toko jika ada */}
          {selectedItem?.surveyToko && selectedItem.surveyToko.length > 0 && (
            <div className="py-2 border-y border-slate-100 my-2">
              <RincianSurvei3TokoCard
                mode="readonly"
                surveyToko={selectedItem.surveyToko}
                satuan={selectedItem.satuan || 'm2'}
                materialCode={selectedItem.kodeMaster || selectedItem.kode}
                materialName={`${selectedItem.item} ${selectedItem.ukuran} ${selectedItem.merk}`}
              />
            </div>
          )}

          {/* Log Persetujuan */}
          <div className="space-y-2 mt-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Riwayat Persetujuan 4 Layer</span>
            </h4>
            <div className="space-y-1.5">
              {(selectedItem?.historyLog || []).map((log, i) => (
                <div key={i} className="text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800">{log.role}</span>
                    <p className="text-slate-600 mt-0.5">{log.catatan || '-'}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{log.tanggal}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
