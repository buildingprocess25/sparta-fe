"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Calculator,
  Filter,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function SBSpecialistPage() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  // Data Store
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DIAJUKAN' | 'REVISI' | 'DISETUJUI' | 'DITOLAK'>('all');

  // Modal State untuk Validasi, Revisi, dan Approval
  const [selectedItem, setSelectedItem] = useState<PengajuanHargaItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRevisiModalOpen, setIsRevisiModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [catatanReject, setCatatanReject] = useState('');

  // Load Data from LocalStorage (Sync on Focus)
  const loadData = () => {
    setItems(getStoredPengajuan());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Urutan Status: Diajukan (Paling Atas) -> Revisi -> Ditolak -> Disetujui (Paling Bawah)
  const getStatusWeight = (status?: string): number => {
    switch (status) {
      case 'DIAJUKAN':
      case 'PENDING_VALIDASI_SB':
      case 'PENDING_BM_MGR':
        return 1; // Prioritas utama di paling atas
      case 'REVISI':
      case 'PERLU_REVISI':
        return 2; // Menunggu revisi B&M
      case 'DITOLAK':
      case 'DITOLAK_SB':
      case 'RETURNED_TO_BC':
        return 3; // Ditolak final
      case 'DISETUJUI':
      case 'DISETUJUI_MASTERING':
      case 'APPROVED_ACTIVE':
      case 'RELEASED':
        return 4; // Yang sudah approve ditaruh di paling bawah
      default:
        return 2;
    }
  };

  // Filtered & Sorted Items
  const displayedItems = useMemo(() => {
    return items
      .filter(item => {
        // Filter Status
        if (statusFilter !== 'all') {
          if (statusFilter === 'DIAJUKAN') {
            if (
              item.status !== 'DIAJUKAN' &&
              item.status !== 'PENDING_VALIDASI_SB' &&
              item.status !== 'PENDING_BM_MGR'
            ) {
              return false;
            }
          } else if (statusFilter === 'REVISI') {
            if (item.status !== 'REVISI' && item.status !== 'PERLU_REVISI') {
              return false;
            }
          } else if (statusFilter === 'DISETUJUI') {
            if (
              item.status !== 'DISETUJUI' &&
              item.status !== 'DISETUJUI_MASTERING' &&
              item.status !== 'APPROVED_ACTIVE' &&
              item.status !== 'RELEASED'
            ) {
              return false;
            }
          } else if (statusFilter === 'DITOLAK') {
            if (
              item.status !== 'DITOLAK' &&
              item.status !== 'DITOLAK_SB' &&
              item.status !== 'RETURNED_TO_BC'
            ) {
              return false;
            }
          }
        }

        // Filter Pencarian
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            item.kode.toLowerCase().includes(q) ||
            (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
            item.item.toLowerCase().includes(q) ||
            item.merk.toLowerCase().includes(q) ||
            item.lokasi.toLowerCase().includes(q) ||
            item.kategori.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const weightA = getStatusWeight(a.status);
        const weightB = getStatusWeight(b.status);
        // Urutkan berdasarkan status weight: Diajukan (1) -> Revisi (2) -> Ditolak (3) -> Disetujui (4 paling bawah)
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        return 0;
      });
  }, [items, search, statusFilter]);

  // Statistik Ringkas
  const countDiajukan = useMemo(() => {
    return items.filter(
      i => i.status === 'DIAJUKAN' || i.status === 'PENDING_VALIDASI_SB' || i.status === 'PENDING_BM_MGR'
    ).length;
  }, [items]);

  const countRevisi = useMemo(() => {
    return items.filter(i => i.status === 'REVISI' || i.status === 'PERLU_REVISI').length;
  }, [items]);

  const countDisetujui = useMemo(() => {
    return items.filter(
      i => i.status === 'DISETUJUI' || i.status === 'DISETUJUI_MASTERING' || i.status === 'APPROVED_ACTIVE' || i.status === 'RELEASED'
    ).length;
  }, [items]);

  const countDitolak = useMemo(() => {
    return items.filter(
      i => i.status === 'DITOLAK' || i.status === 'DITOLAK_SB' || i.status === 'RETURNED_TO_BC'
    ).length;
  }, [items]);

  // Modal Open Handlers
  const handleOpenApprove = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setIsApproveModalOpen(true);
  };

  const handleOpenRevisi = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatanRevisi('');
    setIsRevisiModalOpen(true);
  };

  const handleOpenReject = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatanReject('');
    setIsRejectModalOpen(true);
  };

  // Submit Approval: Ubah status ke DISETUJUI, lalu arahkan ke halaman detail untuk input koefisien
  const handleConfirmApprove = () => {
    if (!selectedItem) return;

    const updated = items.map(i => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'DISETUJUI' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'S&B Specialist' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: 'Permohonan penetapan harga disetujui oleh S&B Specialist.',
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsApproveModalOpen(false);

    showAlert({
      title: 'Permohonan Disetujui',
      message: `Item ${selectedItem.kode} (${selectedItem.item}) berhasil disetujui. Membuka halaman detail untuk mengisi rincian koefisien...`,
      type: 'success',
    });

    router.push(`/pengajuan-harga/sb-specialist/${selectedItem.id}`);
  };

  // Submit Kembalikan untuk Revisi (B&M BISA Edit)
  const handleSubmitRevisi = () => {
    if (!selectedItem) return;
    if (!catatanRevisi.trim()) {
      showAlert({
        title: 'Catatan Revisi Wajib Diisi',
        message: 'Mohon tuliskan instruksi poin yang perlu diperbaiki oleh B&M Manager.',
        type: 'warning',
      });
      return;
    }

    const updated = items.map(i => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'REVISI' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'S&B Specialist' as const,
              action: 'REVISE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatanRevisi.trim(),
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsRevisiModalOpen(false);

    showAlert({
      title: 'Dikembalikan untuk Revisi',
      message: `Item ${selectedItem.kode} berstatus 'Perlu Revisi'. B&M Manager dapat mengedit dan mengajukan ulang item ini.`,
      type: 'info',
    });
  };

  // Submit Tolak Permanen (B&M TIDAK BISA Edit)
  const handleSubmitReject = () => {
    if (!selectedItem) return;
    if (!catatanReject.trim()) {
      showAlert({
        title: 'Catatan Wajib Diisi',
        message: 'Mohon tuliskan alasan penolakan pengajuan ini.',
        type: 'warning',
      });
      return;
    }

    const updated = items.map(i => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: 'DITOLAK' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'S&B Specialist' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatanReject.trim(),
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsRejectModalOpen(false);

    showAlert({
      title: 'Pengajuan Ditolak Permanen',
      message: `Item ${selectedItem.kode} berstatus 'Ditolak' secara final dan terkunci (tidak dapat diedit lagi oleh B&M).`,
      type: 'warning',
    });
  };

  const handleResetFilter = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Ruang Kerja S&B Controlling Specialist" showBackButton backHref="/pengajuan-harga" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Banner Header Role */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 md:p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shrink-0 border border-white/20">
              <SlidersHorizontal className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  S&amp;B Controlling Specialist
                </h1>
                <Badge className="bg-white/20 text-white border-white/30 text-[11px]">
                  Role 2 / Validasi &amp; Mastering
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Daftar usulan penetapan harga baru dari B&amp;M Manager. Lakukan validasi spesifikasi serta buat <strong>Master Perhitungan Koefisien (AHSP)</strong> untuk item yang disetujui.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filter Status, and Reset */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Input Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari kode item, master, material, merk..."
                className="pl-9 h-9 rounded-4xl text-xs border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
              />
            </div>

            {/* Filter Status Dropdown */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(val: any) => setStatusFilter(val)}
              >
                <SelectTrigger className="h-9 rounded-4xl text-xs border-slate-200">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Semua Status ({items.length})
                  </SelectItem>
                  <SelectItem value="DIAJUKAN">
                    Diajukan ({countDiajukan})
                  </SelectItem>
                  <SelectItem value="REVISI">
                    Perlu Revisi ({countRevisi})
                  </SelectItem>
                  <SelectItem value="DISETUJUI">
                    Disetujui ({countDisetujui})
                  </SelectItem>
                  <SelectItem value="DITOLAK">
                    Ditolak ({countDitolak})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 rounded-4xl text-xs text-slate-500 hover:text-slate-800 gap-1 px-3 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          {/* Quick Counter Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-center flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
              <Clock className="w-3 h-3 text-amber-600" />
              {countDiajukan} Diajukan
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-semibold text-[11px]">
              <RotateCcw className="w-3 h-3 text-orange-600" />
              {countRevisi} Revisi
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {countDisetujui} Disetujui
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px]">
              <XCircle className="w-3 h-3 text-rose-600" />
              {countDitolak} Ditolak
            </span>
          </div>
        </div>

        {/* Tabel Tunggal: Urutan Diajukan (atas) -> Revisi -> Ditolak -> Disetujui (paling bawah) */}
        <PengajuanHargaTable
          items={displayedItems}
          showStatus={true}
          showHarga={true}
          title="Daftar Validasi Request Penetapan Harga"
          renderAction={(item) => {
            const isPending =
              item.status === 'DIAJUKAN' ||
              item.status === 'PENDING_VALIDASI_SB' ||
              item.status === 'PENDING_BM_MGR';

            if (isPending) {
              return (
                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleOpenApprove(item)}
                    className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                    title="Setujui dan lanjutkan input koefisien"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenRevisi(item)}
                    className="h-7 text-[11px] px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                    title="Kembalikan ke B&M Manager untuk diedit/direvisi"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Revisi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReject(item)}
                    className="h-7 text-[11px] px-2.5 text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg gap-1 font-semibold cursor-pointer"
                    title="Tolak permanen (item tidak dapat diedit lagi oleh B&M)"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tolak
                  </Button>
                </div>
              );
            }

            if (item.status === 'REVISI' || item.status === 'PERLU_REVISI') {
              return (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                  Menunggu Revisi B&amp;M
                </span>
              );
            }

            const isApproved =
              item.status === 'DISETUJUI' ||
              item.status === 'DISETUJUI_MASTERING' ||
              item.status === 'APPROVED_ACTIVE' ||
              item.status === 'RELEASED';

            if (isApproved) {
              return (
                <div className="flex items-center justify-center gap-1.5">
                  <Link href={`/pengajuan-harga/sb-specialist/${item.id}`}>
                    <Button
                      size="sm"
                      className="h-7 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Kelola Koefisien</span>
                    </Button>
                  </Link>
                </div>
              );
            }

            return (
              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                Ditolak
              </span>
            );
          }}
        />
      </main>

      {/* Modal Dialog: Konfirmasi Setujui Permohonan */}
      <Dialog open={isApproveModalOpen} onOpenChange={open => !open && setIsApproveModalOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>Setujui Permohonan Penetapan Harga</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedItem?.kode} - {selectedItem?.item} ({selectedItem?.merk})</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <p className="text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200 leading-relaxed">
              Dengan menyetujui, status item akan menjadi <strong>Disetujui</strong>. Selanjutnya Anda akan langsung diarahkan ke halaman detail item untuk menambahkan rincian koefisien pekerjaan (Upah, Material &amp; Alat).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmApprove}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Konfirmasi &amp; Input Koefisien</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Kembalikan untuk Revisi (B&M BISA EDIT) */}
      <Dialog open={isRevisiModalOpen} onOpenChange={open => !open && setIsRevisiModalOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <RotateCcw className="w-4 h-4" />
              </span>
              <span>Kembalikan untuk Revisi</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedItem?.kode} - {selectedItem?.item} ({selectedItem?.merk})</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
              Status item akan menjadi <strong>Perlu Revisi</strong>. Item ini <strong>dapat diedit kembali</strong> oleh B&amp;M Manager di ruang kerjanya sesuai poin perbaikan yang Anda berikan, lalu diajukan ulang.
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">
                Poin Catatan Revisi untuk B&amp;M Manager <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={catatanRevisi}
                onChange={e => setCatatanRevisi(e.target.value)}
                placeholder="Tuliskan spesifikasi yang perlu disesuaikan (misal: ganti merk alternatif, perbaiki ukuran/ketebalan)..."
                className="text-xs rounded-xl border-slate-200 min-h-[85px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRevisiModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRevisi}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Konfirmasi Minta Revisi</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Tolak Request Penetapan (PERMANEN - B&M TIDAK BISA EDIT) */}
      <Dialog open={isRejectModalOpen} onOpenChange={open => !open && setIsRejectModalOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <XCircle className="w-4 h-4" />
              </span>
              <span>Tolak Pengajuan (Permanen)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item: <strong>{selectedItem?.kode} - {selectedItem?.item} ({selectedItem?.merk})</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed">
              ⚠️ <strong>Perhatian:</strong> Penolakan ini bersifat <strong>final/permanen</strong>. Item akan berstatus <strong>Ditolak</strong> dan <strong>terkunci</strong> (tidak dapat diedit maupun diajukan kembali oleh B&amp;M Manager).
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">
                Alasan Penolakan Permanen <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={catatanReject}
                onChange={e => setCatatanReject(e.target.value)}
                placeholder="Tuliskan alasan spesifikasi ini tidak disetujui untuk standar gerai..."
                className="text-xs rounded-xl border-slate-200 min-h-[85px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReject}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
            >
              Konfirmasi Tolak Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
