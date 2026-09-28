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
  Building2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Eye,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function RegionalManagerPage() {
  const { showAlert } = useGlobalAlert();

  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'riwayat'>('pending');
  const [search, setSearch] = useState('');

  // Modal Review Approval Layer 3 State
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

  // Filter Items Pending Approval Layer 3
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

  // Filter Items Riwayat (Telah disetujui / diteruskan / dirilis)
  const historyItems = useMemo(() => {
    return items.filter((item) => {
      const isHistory =
        item.status === 'PENDING_KONTRAKTOR' ||
        item.status === 'RELEASED' ||
        item.status === 'APPROVED_ACTIVE' ||
        (item.historyLog && item.historyLog.some((l) => l.role === 'Regional Manager'));

      if (!isHistory) return false;

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

  // Open Review Modal
  const handleOpenReview = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatan('');
    setIsReviewModalOpen(true);
  };

  // Execute Approval: Setujui -> PENDING_KONTRAKTOR (Layer 4)
  const handleApprove = () => {
    if (!selectedItem) return;

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'PENDING_KONTRAKTOR' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatan.trim() || 'Disetujui Regional Manager (Layer 3). Diteruskan ke Kontraktor.',
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
      message: 'Pengajuan harga disetujui.',
      type: 'success',
    });
  };

  // Execute Kembalikan / Tolak -> RETURNED_TO_BC
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
              role: 'Regional Manager' as const,
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

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING_REGIONAL_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Persetujuan
          </span>
        );
      case 'PENDING_KONTRAKTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Menunggu Kontraktor
          </span>
        );
      case 'RELEASED':
      case 'APPROVED_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui
          </span>
        );
      case 'RETURNED_TO_BC':
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <RotateCcw className="w-3 h-3 text-rose-600" />
            Dikembalikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Draft'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="B&M Regional Manager" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-300 text-purple-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Regional Manager
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan harga satuan material (Layer 3)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-500 font-medium block">Menunggu</span>
              <span className="text-lg font-bold text-amber-700">{pendingItems.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-500 font-medium block">Riwayat</span>
              <span className="text-lg font-bold text-purple-700">{historyItems.length}</span>
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
              <span>Menunggu Persetujuan</span>
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
              onClick={() => setActiveTab('riwayat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Riwayat</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.2 ${
                  activeTab === 'riwayat'
                    ? 'bg-purple-100 text-purple-900 font-bold'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {historyItems.length}
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

        {/* Tabel Data */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {activeTab === 'pending' ? 'Daftar Menunggu Persetujuan Layer 3' : 'Riwayat Persetujuan'}
            </h2>
            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">
              {(activeTab === 'pending' ? pendingItems : historyItems).length} Material
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
                    Kode Item
                  </th>
                  <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Material
                  </th>
                  <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Merk &amp; Ukuran
                  </th>
                  <th className="text-right px-4 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                    Rata-Rata Harga
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
                {(activeTab === 'pending' ? pendingItems : historyItems).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-xs text-slate-500">
                        {activeTab === 'pending'
                          ? 'Tidak ada pengajuan yang menunggu persetujuan Regional Manager'
                          : 'Belum ada riwayat persetujuan'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'pending' ? pendingItems : historyItems).map((item, idx) => {
                    const avgPrice = item.hargaRataRata || item.estimasiHarga || 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="text-center px-3 py-3.5 font-semibold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                            {item.kode}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100">
                          <div>{item.item}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {item.kategori} &bull; {item.lokasi}
                          </div>
                        </td>
                        <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          {item.merk} ({item.ukuran})
                        </td>
                        <td className="text-right px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-mono text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            {formatRupiah(avgPrice)}
                          </span>
                        </td>
                        <td className="text-center px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="text-center px-3 py-3.5 whitespace-nowrap">
                          {activeTab === 'pending' ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReview(item)}
                              className="h-7 text-[11px] px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                            >
                              <span>Review &amp; Setujui</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCatatanModalItem(item);
                                setIsCatatanModalOpen(true);
                              }}
                              className="h-7 text-[11px] px-2.5 rounded-lg gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Catatan</span>
                            </Button>
                          )}
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

      {/* Modal Review Approval Layer 3 (Menggunakan Reusable RincianSurvei3TokoCard) */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => !open && setIsReviewModalOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 bg-purple-100 text-purple-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>Persetujuan Harga Satuan (Layer 3 - Regional Manager)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedItem?.kode} - {selectedItem?.item} ({selectedItem?.merk} - {selectedItem?.ukuran})</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Rincian Survei 3 Toko (Mode Readonly) */}
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

          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Catatan Regional Manager
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau alasan jika dikembalikan..."
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
              className="rounded-xl h-8 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke BC</span>
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Setujui</span>
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
