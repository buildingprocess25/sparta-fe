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
  Sparkles,
  Layers,
  Calendar,
  ShieldCheck,
  FileCheck,
  FlaskConical,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { PengajuanHargaTable } from '@/components/pengajuan-harga/PengajuanHargaTable';
import { ApprovalTrialModal } from '@/components/pengajuan-harga/ApprovalTrialModal';
import { ApprovalPromosiTrialModal } from '@/components/pengajuan-harga/ApprovalPromosiTrialModal';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function RegionalManagerPage() {
  const { showAlert } = useGlobalAlert();

  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'trial'>('pending');
  const [search, setSearch] = useState('');

  // Modal Review Approval Layer 3 (Reguler Survei 3 Toko)
  const [selectedItem, setSelectedItem] = useState<PengajuanHargaItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [catatan, setCatatan] = useState('');

  // Modal Approval Usulan Trial Baru (Jalur B)
  const [selectedTrialItem, setSelectedTrialItem] = useState<PengajuanHargaItem | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  // Modal Persetujuan Promosi Permanen (Phase 5)
  const [selectedPromosiItem, setSelectedPromosiItem] = useState<PengajuanHargaItem | null>(null);
  const [isPromosiModalOpen, setIsPromosiModalOpen] = useState(false);

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

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Open Review Reguler Modal
  const handleOpenReview = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatan('');
    setIsReviewModalOpen(true);
  };

  // Open Review Trial Modal
  const handleOpenTrialReview = (item: PengajuanHargaItem) => {
    setSelectedTrialItem(item);
    setIsTrialModalOpen(true);
  };

  // Execute Approval Reguler: Setujui -> PENDING_KONTRAKTOR (Layer 4)
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
      message: 'Pengajuan harga reguler disetujui dan diteruskan ke Kontraktor.',
      type: 'success',
    });
  };

  // Execute Kembalikan Reguler -> RETURNED_TO_BC
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
      title: 'Pengajuan Dikembalikan',
      message: 'Pengajuan telah dikembalikan ke Building Coordinator dengan catatan.',
      type: 'warning',
    });
  };

  // =========================================================================
  // ACTIONS APPROVAL PENGAJUAN SPESIFIKASI SEMENTARA
  // =========================================================================

  // 1. Setujui Spesifikasi Sementara -> TRIAL_RELEASED (Masa aktif dimulai hari ini)
  const handleApproveTrial = (item: PengajuanHargaItem, note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const durationDays = item.trialDurationDays || 90;
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'TRIAL_RELEASED' as const,
          isTrial: true,
          trialStartDate: today,
          trialDurationDays: durationDays,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: note || 'Disetujui Regional Manager. Spesifikasi sementara resmi dirilis ke Katalog Master Harga.',
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsTrialModalOpen(false);

    showAlert({
      title: 'Spesifikasi Sementara Disetujui & Dirilis',
      message: `Item ${item.kodeMaster || item.kode} berhasil dirilis ke Katalog Master Harga dengan status spesifikasi sementara.`,
      type: 'success',
    });
  };

  // 2. Minta Revisi Spesifikasi Sementara -> TRIAL_REVISI (Kembali ke S&B Specialist)
  const handleReviseTrial = (item: PengajuanHargaItem, note: string) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'TRIAL_REVISI' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: note,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsTrialModalOpen(false);

    showAlert({
      title: 'Revisi Dikirimkan ke S&B',
      message: `Pengajuan spesifikasi sementara ${item.kodeMaster || item.kode} dikembalikan ke S&B Specialist untuk direvisi.`,
      type: 'warning',
    });
  };

  // 3. Tolak Spesifikasi Sementara -> TRIAL_DITOLAK
  const handleRejectTrial = (item: PengajuanHargaItem, note: string) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'TRIAL_DITOLAK' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: note,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsTrialModalOpen(false);

    showAlert({
      title: 'Pengajuan Ditolak',
      message: `Pengajuan spesifikasi sementara ${item.kodeMaster || item.kode} telah ditolak.`,
      type: 'error',
    });
  };

  // =========================================================================
  // ACTIONS APPROVAL EVALUASI PROMOSI PERMANEN (PHASE 5)
  // =========================================================================

  const handleOpenPromosiReview = (item: PengajuanHargaItem) => {
    setSelectedPromosiItem(item);
    setIsPromosiModalOpen(true);
  };

  // 1. Sahkan Jadi Master Resmi Permanen -> APPROVED_ACTIVE (isTrial: false)
  const handleApprovePromosiPermanen = (item: PengajuanHargaItem, note: string) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'APPROVED_ACTIVE' as const,
          isTrial: false,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: note || 'Disahkan menjadi Master Resmi Permanen setelah menyelesaikan masa uji coba 3 bulan.',
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsPromosiModalOpen(false);

    showAlert({
      title: 'Ditetapkan Jadi Master Resmi Permanen',
      message: `Item ${item.kodeMaster || item.kode} resmi ditetapkan sebagai Master Resmi Nasional di Katalog!`,
      type: 'success',
    });
  };

  // 2. Kembalikan ke S&B untuk Uji Coba Lanjutan -> TRIAL_RELEASED
  const handleKembalikanPromosiKeSB = (item: PengajuanHargaItem, note: string) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'TRIAL_RELEASED' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: `Permohonan promosi dikembalikan ke S&B Specialist: ${note}`,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsPromosiModalOpen(false);

    showAlert({
      title: 'Permohonan Dikembalikan',
      message: `Permohonan promosi ${item.kodeMaster || item.kode} dikembalikan ke S&B Specialist.`,
      type: 'warning',
    });
  };

  // 3. Tolak & Hentikan Permanen -> TRIAL_DITOLAK
  const handleTolakPromosiPermanen = (item: PengajuanHargaItem, note: string) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'TRIAL_DITOLAK' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Regional Manager' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: `Penetapan permanen ditolak dan uji coba dihentikan: ${note}`,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsPromosiModalOpen(false);

    showAlert({
      title: 'Promosi Ditolak',
      message: `Penetapan permanen untuk ${item.kodeMaster || item.kode} telah ditolak dan uji coba dihentikan.`,
      type: 'error',
    });
  };

  const renderStatusBadge = (item: PengajuanHargaItem) => {
    switch (item.status) {
      case 'PENDING_REGIONAL_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Persetujuan
          </span>
        );
      case 'TRIAL_PENDING_REGIONAL_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Usulan Trial Baru
          </span>
        );
      case 'TRIAL_PROMOSI_REGIONAL_MGR':
      case 'TRIAL_PROMOSI_BM_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Permohonan Promosi Permanen
          </span>
        );
      case 'TRIAL_RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Trial Aktif (Dirilis)
          </span>
        );
      case 'TRIAL_REVISI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Revisi S&amp;B
          </span>
        );
      case 'TRIAL_DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Trial Ditolak
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
            {item.status || 'Draft'}
          </span>
        );
    }
  };

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
            onReviewSurvei={handleOpenReview}
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
                renderAction={(item) => (
                  <Button
                    size="sm"
                    onClick={() => handleOpenPromosiReview(item)}
                    className="h-7 text-[11px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5 font-semibold cursor-pointer shadow-2xs"
                    title="Review Permohonan Penetapan Master Resmi"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </Button>
                )}
                onResetFilter={() => setSearch('')}
              />
            )}

            {/* TABEL PENGAJUAN SPESIFIKASI SEMENTARA (Ringkas 5-6 kolom standar via PengajuanHargaTable) */}
            <PengajuanHargaTable
              items={trialPendingItems}
              title="Daftar Pengajuan Spesifikasi Sementara Menunggu Persetujuan"
              showStatus={true}
              showHarga={true}
              renderAction={(item) => (
                <Button
                  size="sm"
                  onClick={() => handleOpenTrialReview(item)}
                  className="h-7 text-[11px] px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 font-semibold cursor-pointer shadow-2xs"
                  title="Review Pengajuan Spesifikasi Sementara"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review</span>
                </Button>
              )}
              onResetFilter={() => setSearch('')}
            />
          </div>
        )}
    </main>

      {/* Modal Review Approval Layer 3 (Reguler Survei 3 Toko) */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => !open && setIsReviewModalOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 bg-purple-100 text-purple-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>Review &amp; Persetujuan Harga Survei (Layer 3)</span>
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
                Catatan Regional Manager
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan persetujuan atau alasan revisi jika dikembalikan..."
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
              onClick={handleApprove}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer gap-1.5"
              title="Setujui dan teruskan ke Kontraktor"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Setujui</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Review & Persetujuan 3 Opsi Usulan Trial Baru (Jalur B) */}
      <ApprovalTrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        item={selectedTrialItem}
        onApprove={handleApproveTrial}
        onRevise={handleReviseTrial}
        onReject={handleRejectTrial}
      />

      {/* Modal Persetujuan Promosi Master Resmi Permanen (Phase 5) */}
      <ApprovalPromosiTrialModal
        isOpen={isPromosiModalOpen}
        onClose={() => setIsPromosiModalOpen(false)}
        item={selectedPromosiItem}
        onApprovePermanen={handleApprovePromosiPermanen}
        onKembalikanKeSB={handleKembalikanPromosiKeSB}
        onTolakPermanen={handleTolakPromosiPermanen}
      />
    </div>
  );
}
