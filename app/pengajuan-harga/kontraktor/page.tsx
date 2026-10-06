"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Hammer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Clock,
  ArrowRight,
  FileText,
  BadgeCheck,
  Building2,
} from 'lucide-react';
import {
  PengajuanHargaItem,
  DAFTAR_CABANG_ALFAMART,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function KontraktorPage() {
  const { showAlert } = useGlobalAlert();

  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'disepakati'>('pending');
  const [selectedCabang, setSelectedCabang] = useState<string>('Cikokol');
  const [search, setSearch] = useState('');

  // Modal Kesepakatan Harga Layer 4 State
  const [selectedItem, setSelectedItem] = useState<PengajuanHargaItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [catatan, setCatatan] = useState('');

  // Modal Catatan Riwayat State
  const [catatanModalItem, setCatatanModalItem] = useState<PengajuanHargaItem | null>(null);
  const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);

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

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Open Modal Kesepakatan
  const handleOpenReview = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatan('');
    setIsReviewModalOpen(true);
  };

  // Execute Kesepakatan Harga (Final Approval: status -> RELEASED)
  const handleSepakati = () => {
    if (!selectedItem) return;

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'RELEASED' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Kontraktor' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatan.trim() || 'Harga disepakati oleh Kontraktor (Layer 4). Harga resmi dirilis.',
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsReviewModalOpen(false);

    showAlert({
      title: 'Berhasil',
      message: 'Harga satuan berhasil disepakati.',
      type: 'success',
    });
  };

  // Execute Tolak / Negosiasi Ulang -> RETURNED_TO_BC
  const handleReject = () => {
    if (!selectedItem) return;
    if (!catatan.trim()) {
      showAlert({
        title: 'Perhatian',
        message: 'Catatan wajib diisi.',
        type: 'warning',
      });
      return;
    }

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'RETURNED_TO_BC' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Kontraktor' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatan.trim(),
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsReviewModalOpen(false);

    showAlert({
      title: 'Berhasil',
      message: 'Pengajuan dikembalikan ke BC.',
      type: 'warning',
    });
  };

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
              <span className="text-[11px] text-slate-500 font-medium block">Disepakati</span>
              <span className="text-lg font-bold text-emerald-700">{disepakatiItems.length}</span>
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
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Harga Disepakati</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'disepakati'
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
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
            onReviewSurvei={handleOpenReview}
          />
        )}

        {/* Tab 2: Harga Disepakati */}
        {activeTab === 'disepakati' && (
          <PengajuanHargaTable
            items={disepakatiItems}
            showStatus={true}
            showHarga={true}
            title={selectedCabang === 'all' ? "Daftar Harga Satuan Telah Disepakati (Semua Cabang)" : `Daftar Harga Satuan Telah Disepakati - Cabang ${selectedCabang}`}
            onResetFilter={() => setSearch('')}
          />
        )}
      </main>

      {/* Modal Review Kesepakatan Harga (Menggunakan Reusable RincianSurvei3TokoCard) */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => !open && setIsReviewModalOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                <Hammer className="w-4 h-4" />
              </span>
              <span>Konfirmasi &amp; Kesepakatan Harga Satuan (Kontraktor)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedItem?.kode} - {selectedItem?.item} ({selectedItem?.merk} - {selectedItem?.ukuran})</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Bar Timeline Pengajuan */}
          {selectedItem && (
            <div className="my-2">
              <PengajuanTimelineBar item={selectedItem} />
            </div>
          )}

          {/* Rincian Komponen & Survei 3 Toko (Mode Readonly) */}
          {selectedItem?.koefisienMaterialItems && selectedItem.koefisienMaterialItems.length > 0 ? (
            <div className="py-2 border-y border-slate-100 my-2 space-y-4">
              <RingkasanBiayaMaterial
                materialItems={selectedItem.koefisienMaterialItems}
                totalBiayaMaterial={selectedItem.hargaRataRata || selectedItem.estimasiHarga || 0}
                marginMaterial={selectedItem?.marginMaterial}
                formatRupiah={formatRupiah}
              />
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Detail Survei Toko per Komponen:</h4>
                {selectedItem.koefisienMaterialItems.map((mat) => (
                  <RincianSurvei3TokoCard
                    key={mat.id}
                    mode="readonly"
                    surveyToko={mat.surveyToko || []}
                    satuan={mat.unit || 'm2'}
                    materialCode={mat.id}
                    materialName={mat.label}
                  />
                ))}
              </div>
            </div>
          ) : selectedItem?.surveyToko && selectedItem.surveyToko.length > 0 ? (
            <div className="py-2 border-y border-slate-100 my-2">
              <RincianSurvei3TokoCard
                mode="readonly"
                surveyToko={selectedItem.surveyToko}
                satuan={selectedItem.satuan || 'm2'}
                materialCode={selectedItem.kodeMaster || selectedItem.kode}
                materialName={`${selectedItem.item} ${selectedItem.ukuran} ${selectedItem.merk}`}
              />
            </div>
          ) : null}

          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Catatan Kontraktor
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan konfirmasi kesepakatan atau poin revisi jika negosiasi ulang..."
                className="text-xs rounded-xl border-slate-200 min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer gap-1.5"
              title="Kembalikan ke Building Coordinator untuk revisi survei"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revisi</span>
            </Button>
            <Button
              type="button"
              onClick={handleSepakati}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer gap-1.5"
              title="Sepakati harga satuan material dan rilis resmi"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sepakati Harga</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Catatan Log Riwayat */}
      <Dialog open={isCatatanModalOpen} onOpenChange={(open) => !open && setIsCatatanModalOpen(false)}>
        <DialogContent className="max-w-md rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Riwayat Catatan Persetujuan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {catatanModalItem?.kode} - {catatanModalItem?.item}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            {(catatanModalItem?.historyLog || []).map((log, i) => (
              <div key={i} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{log.role}</span>
                  <span>{log.tanggal}</span>
                </div>
                <p className="text-slate-800">{log.catatan || '-'}</p>
              </div>
            ))}
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
