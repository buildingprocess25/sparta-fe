"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Plus,
  Layers,
  Pencil,
  Calendar,
  AlertCircle,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { PengajuanHargaItem } from "@/components/pengajuan-harga/types";
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from "@/components/pengajuan-harga/store";
import { PengajuanHargaTable } from "@/components/pengajuan-harga/PengajuanHargaTable";
import { RincianSurvei3TokoCard } from "@/components/pengajuan-harga/RincianSurvei3TokoCard";
import { RingkasanBiayaMaterial } from "@/components/pengajuan-harga/RingkasanBiayaMaterial";
import { TambahItemTrialModal } from "@/components/pengajuan-harga/TambahItemTrialModal";
import { EvaluasiTrialModal } from "@/components/pengajuan-harga/EvaluasiTrialModal";
import { PengajuanTimelineBar } from "@/components/pengajuan-harga/PengajuanTimelineBar";
import { useGlobalAlert } from "@/context/GlobalAlertContext";

export default function SBSpecialistPage() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  // Tab State: 'validasi_spek' (Alur 1 / dari B&M) vs 'approval_harga' (Alur 2 / Layer 2 dari BC) vs 'item_trial' (Alur B)
  const [activeTab, setActiveTab] = useState<
    "validasi_spek" | "approval_harga" | "item_trial"
  >("validasi_spek");

  // Data Store
  const [items, setItems] = useState<PengajuanHargaItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "DIAJUKAN" | "REVISI" | "DISETUJUI" | "DITOLAK"
  >("all");

  // Modal State untuk Validasi, Revisi, dan Approval
  const [selectedItem, setSelectedItem] = useState<PengajuanHargaItem | null>(
    null,
  );
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Modal State untuk Jalur Trial
  const [isTambahTrialModalOpen, setIsTambahTrialModalOpen] = useState(false);
  const [trialItemToEdit, setTrialItemToEdit] =
    useState<PengajuanHargaItem | null>(null);

  // Modal State untuk Evaluasi Akhir Trial
  const [isEvaluasiModalOpen, setIsEvaluasiModalOpen] = useState(false);
  const [evaluasiItem, setEvaluasiItem] = useState<PengajuanHargaItem | null>(
    null,
  );

  const [catatanReject, setCatatanReject] = useState("");

  // Load Data from LocalStorage (Sync on Focus)
  const loadData = () => {
    setItems(getStoredPengajuan());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  // Format Rupiah
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ================= TAB 1: SPESIFIKASI MATERIAL (ALUR 1 DARI B&M) =================
  const specItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.status === "DIAJUKAN" ||
        item.status === "PENDING_VALIDASI_SB" ||
        item.status === "SIAP_SURVEI" ||
        item.status === "REVISI" ||
        item.status === "PERLU_REVISI" ||
        item.status === "DISETUJUI" ||
        item.status === "DISETUJUI_MASTERING" ||
        item.status === "APPROVED_ACTIVE" ||
        item.status === "RELEASED" ||
        item.status === "DITOLAK" ||
        item.status === "DITOLAK_SB",
    );
  }, [items]);

  const countDiajukan = useMemo(() => {
    return specItems.filter(
      (i) => i.status === "DIAJUKAN" || i.status === "PENDING_VALIDASI_SB",
    ).length;
  }, [specItems]);

  const countRevisi = useMemo(() => {
    return specItems.filter(
      (i) => i.status === "REVISI" || i.status === "PERLU_REVISI",
    ).length;
  }, [specItems]);

  const countDisetujui = useMemo(() => {
    return specItems.filter(
      (i) =>
        i.status === "SIAP_SURVEI" ||
        i.status === "DISETUJUI" ||
        i.status === "DISETUJUI_MASTERING" ||
        i.status === "APPROVED_ACTIVE" ||
        i.status === "RELEASED",
    ).length;
  }, [specItems]);

  const countDitolak = useMemo(() => {
    return specItems.filter(
      (i) => i.status === "DITOLAK" || i.status === "DITOLAK_SB",
    ).length;
  }, [specItems]);

  const getStatusWeight = (status?: string): number => {
    switch (status) {
      case "DIAJUKAN":
      case "PENDING_VALIDASI_SB":
        return 1;
      case "REVISI":
      case "PERLU_REVISI":
        return 2;
      case "DITOLAK":
      case "DITOLAK_SB":
        return 3;
      case "SIAP_SURVEI":
      case "DISETUJUI":
      case "DISETUJUI_MASTERING":
      case "APPROVED_ACTIVE":
      case "RELEASED":
        return 4;
      default:
        return 2;
    }
  };

  const displayedSpecItems = useMemo(() => {
    return specItems
      .filter((item) => {
        if (statusFilter !== "all") {
          if (statusFilter === "DIAJUKAN") {
            if (
              item.status !== "DIAJUKAN" &&
              item.status !== "PENDING_VALIDASI_SB"
            )
              return false;
          } else if (statusFilter === "REVISI") {
            if (item.status !== "REVISI" && item.status !== "PERLU_REVISI")
              return false;
          } else if (statusFilter === "DISETUJUI") {
            if (
              item.status !== "SIAP_SURVEI" &&
              item.status !== "DISETUJUI" &&
              item.status !== "DISETUJUI_MASTERING" &&
              item.status !== "APPROVED_ACTIVE" &&
              item.status !== "RELEASED"
            )
              return false;
          } else if (statusFilter === "DITOLAK") {
            if (item.status !== "DITOLAK" && item.status !== "DITOLAK_SB")
              return false;
          }
        }

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
        if (weightA !== weightB) return weightA - weightB;
        return 0;
      });
  }, [specItems, search, statusFilter]);

  // ================= TAB 2: APPROVAL HARGA SURVEI (ALUR 2 LAYER 2) =================
  const pendingLayer2Items = useMemo(() => {
    return items.filter((item) => {
      const isPending = item.status === "PENDING_SB_SPECIALIST";
      if (!isPending) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.kode.toLowerCase().includes(q) ||
          (item.kodeMaster && item.kodeMaster.toLowerCase().includes(q)) ||
          item.item.toLowerCase().includes(q) ||
          item.merk.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search]);

  // ================= TAB 3: JALUR TRIAL (ALUR B) =================
  const trialItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.isTrial ||
        item.status === "TRIAL_PENDING_REGIONAL_MGR" ||
        item.status === "TRIAL_REVISI" ||
        item.status === "TRIAL_DITOLAK" ||
        item.status === "TRIAL_RELEASED" ||
        item.status === "TRIAL_PROMOSI_BM_MGR" ||
        item.status === "TRIAL_PROMOSI_REGIONAL_MGR" ||
        item.status === "TRIAL_PROMOSI_KONTRAKTOR",
    );
  }, [items]);

  const displayedTrialItems = useMemo(() => {
    if (!search.trim()) return trialItems;
    const q = search.toLowerCase();
    return trialItems.filter(
      (i) =>
        i.kode.toLowerCase().includes(q) ||
        (i.kodeMaster && i.kodeMaster.toLowerCase().includes(q)) ||
        i.item.toLowerCase().includes(q) ||
        i.merk.toLowerCase().includes(q) ||
        i.lokasi.toLowerCase().includes(q) ||
        i.kategori.toLowerCase().includes(q),
    );
  }, [trialItems, search]);

  const handleOpenTambahTrial = () => {
    setTrialItemToEdit(null);
    setIsTambahTrialModalOpen(true);
  };

  const handleOpenEditTrial = (item: PengajuanHargaItem) => {
    setTrialItemToEdit(item);
    setIsTambahTrialModalOpen(true);
  };

  const handleSubmitTrialItem = (newItem: PengajuanHargaItem) => {
    let updated: PengajuanHargaItem[];
    if (trialItemToEdit || items.some((i) => i.id === newItem.id)) {
      updated = items.map((i) => (i.id === newItem.id ? newItem : i));
      showAlert({
        title: "Berhasil",
        message: "Pengajuan item trial berhasil diperbarui dan diajukan ulang.",
        type: "success",
      });
    } else {
      updated = [newItem, ...items];
      showAlert({
        title: "Berhasil",
        message: "Item trial baru berhasil diajukan ke B&M Regional Manager.",
        type: "success",
      });
    }
    setItems(updated);
    saveStoredPengajuan(updated);
    setIsTambahTrialModalOpen(false);
    setTrialItemToEdit(null);
  };

  // Handlers Evaluasi Akhir Trial (Phase 5)
  const handleOpenEvaluasiTrial = (item: PengajuanHargaItem) => {
    setEvaluasiItem(item);
    setIsEvaluasiModalOpen(true);
  };

  const handleSubmitPromosiTrial = (
    item: PengajuanHargaItem,
    catatanEvaluasi: string,
  ) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "TRIAL_PROMOSI_REGIONAL_MGR" as const,
          trialCatatanEvaluasi: catatanEvaluasi,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "EVALUATE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: `Evaluasi Lapangan (3 Bulan): Rekomendasi promosi menjadi Master Resmi Permanen diajukan ke B&M Regional Manager. Hasil evaluasi: ${catatanEvaluasi}`,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsEvaluasiModalOpen(false);
    showAlert({
      title: "Permohonan Promosi Dikirim",
      message: `Permohonan penetapan Master Resmi permanen untuk ${item.kodeMaster || item.kode} telah diteruskan ke B&M Regional Manager.`,
      type: "success",
    });
  };

  const handleSubmitNonaktifkanTrial = (
    item: PengajuanHargaItem,
    alasanHenti: string,
  ) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "TRIAL_DITOLAK" as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: `Evaluasi Lapangan (3 Bulan): Uji coba trial dihentikan dan tidak dilanjutkan. Alasan: ${alasanHenti}`,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsEvaluasiModalOpen(false);
    showAlert({
      title: "Trial Dihentikan",
      message: `Item trial ${item.kodeMaster || item.kode} telah dihentikan/dinonaktifkan.`,
      type: "info",
    });
  };

  // Modal Open Handlers
  const handleOpenApprove = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setIsApproveModalOpen(true);
  };

  const handleOpenReject = (item: PengajuanHargaItem) => {
    setSelectedItem(item);
    setCatatanReject("");
    setIsRejectModalOpen(true);
  };

  // Submit Approval
  const handleConfirmApprove = () => {
    if (!selectedItem) return;

    const isPriceApproval = selectedItem.status === "PENDING_SB_SPECIALIST";
    const nextStatus = isPriceApproval ? "PENDING_REGIONAL_MGR" : "DISETUJUI";

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: nextStatus as any,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: isPriceApproval
                ? "Disetujui S&B Specialist (Layer 2) dan diteruskan ke Regional Manager."
                : "Permohonan penetapan spesifikasi disetujui oleh S&B Specialist.",
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);
    setIsApproveModalOpen(false);

    if (isPriceApproval) {
      showAlert({
        title: "Berhasil",
        message: "Pengajuan harga disetujui.",
        type: "success",
      });
    } else {
      showAlert({
        title: "Berhasil",
        message: "Spesifikasi disetujui.",
        type: "success",
      });
      router.push(`/pengajuan-harga/sb-specialist/${selectedItem.id}`);
    }
  };

  // Submit Revisi Spesifikasi langsung dari Detail Spesifikasi (ke B&M)
  const handleConfirmRevisi = (
    item: PengajuanHargaItem,
    catatan: string,
    revisiFields: string[],
  ) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "REVISI" as const,
          catatanReview: catatan.trim(),
          revisiFields: revisiFields,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REVISE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: catatan.trim(),
              revisiFields: revisiFields,
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);

    showAlert({
      title: "Berhasil",
      message: "Catatan revisi telah dikirim ke B&M Manager.",
      type: "info",
    });
  };

  // Submit Approval Spesifikasi langsung dari Detail Spesifikasi
  const handleConfirmApproveSpec = (
    item: PengajuanHargaItem,
    catatan?: string,
  ) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "DISETUJUI" as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan:
                catatan?.trim() ||
                "Permohonan penetapan spesifikasi disetujui oleh S&B Specialist.",
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);

    showAlert({
      title: "Berhasil",
      message: "Spesifikasi disetujui.",
      type: "success",
    });
    router.push(`/pengajuan-harga/sb-specialist/${item.id}`);
  };

  // Submit Tolak Spesifikasi langsung dari Detail Spesifikasi
  const handleConfirmRejectSpec = (
    item: PengajuanHargaItem,
    alasan: string,
  ) => {
    const updated = items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "DITOLAK" as const,
          catatanReview: alasan.trim(),
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: alasan.trim(),
            },
          ],
        };
      }
      return i;
    });

    setItems(updated);
    saveStoredPengajuan(updated);

    showAlert({
      title: "Berhasil",
      message: "Pengajuan spesifikasi ditolak.",
      type: "warning",
    });
  };

  // Submit Tolak / Kembalikan ke BC (Harga Survei) atau Tolak Spek Permanen
  const handleSubmitReject = () => {
    if (!selectedItem) return;
    if (!catatanReject.trim()) {
      showAlert({
        title: "Perhatian",
        message: "Catatan wajib diisi.",
        type: "warning",
      });
      return;
    }

    const isPriceApproval = selectedItem.status === "PENDING_SB_SPECIALIST";
    const nextStatus = isPriceApproval ? "RETURNED_TO_BC" : "DITOLAK";

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        return {
          ...i,
          status: nextStatus as any,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
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

    if (isPriceApproval) {
      showAlert({
        title: "Berhasil",
        message: "Pengajuan dikembalikan ke BC.",
        type: "warning",
      });
    } else {
      showAlert({
        title: "Berhasil",
        message: "Pengajuan ditolak.",
        type: "warning",
      });
    }
  };

  const handleResetFilter = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar
        title="Ruang Kerja S&B Controlling Specialist"
        showBackButton
        backHref="/pengajuan-harga"
      />

      <main className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 space-y-5">
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
              </div>
              <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Validasi spesifikasi usulan B&amp;M Manager dan tinjau
                persetujuan harga satuan hasil survei lapangan
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Navigation (Pemisahan 3 Alur) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("validasi_spek")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "validasi_spek"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Pengajuan Spesifikasi</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "validasi_spek"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {displayedSpecItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approval_harga")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "approval_harga"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approval Survei Harga</span>
              {pendingLayer2Items.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                  {pendingLayer2Items.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("item_trial")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "item_trial"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pengajuan Trial</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "item_trial"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {trialItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: VALIDASI SPESIFIKASI DARI B&M ================= */}
        {activeTab === "validasi_spek" && (
          <div className="space-y-4">
            {/* Toolbar: Search, Filter Status, and Reset */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kode item, material, merk..."
                    className="pl-9 h-9 rounded-4xl text-xs border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                  />
                </div>

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
                        Semua Status ({specItems.length})
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

                {(search || statusFilter !== "all") && (
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

            {/* Tabel Spesifikasi Material */}
            <PengajuanHargaTable
              items={displayedSpecItems}
              showStatus={true}
              showHarga={false}
              title="Daftar Permohonan Spesifikasi Material dari B&amp;M Manager"
              onApprove={handleConfirmApproveSpec}
              onRevisi={handleConfirmRevisi}
              onReject={handleConfirmRejectSpec}
              onManageKoefisien={(item) =>
                router.push(`/pengajuan-harga/sb-specialist/${item.id}`)
              }
              onResetFilter={handleResetFilter}
            />
          </div>
        )}

        {/* ================= TAB 2: APPROVAL HARGA SURVEI (LAYER 2) ================= */}
        {activeTab === "approval_harga" && (
          <PengajuanHargaTable
            items={pendingLayer2Items}
            showStatus={true}
            showHarga={true}
            title="Daftar Pengajuan Harga Survei Menunggu Persetujuan Layer 2"
            onResetFilter={handleResetFilter}
            onReviewSurvei={handleOpenApprove}
          />
        )}

        {/* ================= TAB 3: JALUR TRIAL (3 BULAN) ================= */}
        {activeTab === "item_trial" && (
          <div className="space-y-4">
            {/* Toolbar: Search, Reset, dan Info Banner */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode trial, material, merk..."
                  className="pl-9 h-9 rounded-4xl text-xs border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {search && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearch("")}
                    className="h-9 px-3 rounded-xl text-xs text-slate-500 hover:text-slate-800"
                  >
                    Reset Pencarian
                  </Button>
                )}
                <div className="pb-1.5 self-end sm:self-auto shrink-0">
                  <Button
                    size="sm"
                    onClick={handleOpenTambahTrial}
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1.5 font-semibold cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item Baru (Trial)</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabel Daftar Pengajuan Item Trial via PengajuanHargaTable */}
            <PengajuanHargaTable
              items={displayedTrialItems}
              title="Daftar Pengajuan Item Trial"
              showStatus={true}
              showHarga={true}
              onViewDetail={handleOpenEditTrial}
              renderAction={(item) => (
                <div className="flex items-center gap-1.5">
                  {item.status === "TRIAL_REVISI" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenEditTrial(item)}
                      className="h-7 text-[11px] px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                      title="Perbaiki usulan yang diminta revisi"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Perbaiki</span>
                    </Button>
                  )}
                  {item.status === "TRIAL_RELEASED" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenEvaluasiTrial(item)}
                      className="h-7 text-[11px] px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                      title="Evaluasi hasil uji coba lapangan 3 bulan"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>Evaluasi</span>
                    </Button>
                  )}
                </div>
              )}
              onResetFilter={() => setSearch("")}
            />
          </div>
        )}
      </main>

      {/* Modal Dialog: Konfirmasi Setujui Permohonan / Approval Layer 2 */}
      <Dialog
        open={isApproveModalOpen}
        onOpenChange={(open) => !open && setIsApproveModalOpen(false)}
      >
        <DialogContent
          className={`${(selectedItem?.surveyToko && selectedItem.surveyToko.length > 0) || (selectedItem?.koefisienMaterialItems && selectedItem.koefisienMaterialItems.length > 0) ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-md"} rounded-2xl p-6`}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>
                {selectedItem?.status === "PENDING_SB_SPECIALIST"
                  ? "Review & Persetujuan Harga Survei (Layer 2)"
                  : "Setujui Permohonan Penetapan Spesifikasi"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item:{" "}
              <strong>
                {selectedItem?.kode} - {selectedItem?.item} (
                {selectedItem?.merk})
              </strong>
            </DialogDescription>
          </DialogHeader>

          {/* Bar Timeline Pengajuan */}
          {selectedItem && (
            <div className="my-2">
              <PengajuanTimelineBar item={selectedItem} />
            </div>
          )}

          {/* Rincian Komponen & Survei 3 Toko jika ada */}
          {selectedItem?.koefisienMaterialItems &&
          selectedItem.koefisienMaterialItems.length > 0 ? (
            <div className="py-2 border-y border-slate-100 my-2 space-y-4">
              <RingkasanBiayaMaterial
                materialItems={selectedItem.koefisienMaterialItems}
                totalBiayaMaterial={
                  selectedItem.hargaRataRata || selectedItem.estimasiHarga || 0
                }
                marginMaterial={selectedItem?.marginMaterial}
                formatRupiah={formatRupiah}
              />
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800">
                  Detail Survei Toko per Komponen:
                </h4>
                {selectedItem.koefisienMaterialItems.map((mat) => (
                  <RincianSurvei3TokoCard
                    key={mat.id}
                    mode="readonly"
                    surveyToko={mat.surveyToko || []}
                    satuan={mat.unit || "m2"}
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
                satuan={selectedItem.satuan || "m2"}
                materialCode={selectedItem.kodeMaster || selectedItem.kode}
                materialName={`${selectedItem.item} ${selectedItem.ukuran} ${selectedItem.merk}`}
              />
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
              className="rounded-xl h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            {selectedItem?.status === "PENDING_SB_SPECIALIST" && (
              <Button
                type="button"
                onClick={() => {
                  setIsApproveModalOpen(false);
                  handleOpenReject(selectedItem);
                }}
                className="rounded-xl h-8 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer gap-1.5"
                title="Kembalikan ke Building Coordinator untuk revisi survei"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revisi</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={handleConfirmApprove}
              className="rounded-xl h-8 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer gap-1.5"
              title="Setujui dan teruskan ke Regional Manager"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {selectedItem?.status === "PENDING_SB_SPECIALIST"
                  ? "Setujui"
                  : "Konfirmasi & Input Koefisien"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Tolak Spesifikasi / Kembalikan Harga Survei ke BC */}
      <Dialog
        open={isRejectModalOpen}
        onOpenChange={(open) => !open && setIsRejectModalOpen(false)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <XCircle className="w-4 h-4" />
              </span>
              <span>
                {selectedItem?.status === "PENDING_SB_SPECIALIST"
                  ? "Kembalikan Harga Survei ke BC"
                  : "Tolak Permohonan Spesifikasi"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Item:{" "}
              <strong>
                {selectedItem?.kode} - {selectedItem?.item} (
                {selectedItem?.merk})
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">
                Alasan Pengembalian / Penolakan{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={catatanReject}
                onChange={(e) => setCatatanReject(e.target.value)}
                placeholder="Tuliskan alasan..."
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
              className="rounded-xl h-8 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>
                {selectedItem?.status === "PENDING_SB_SPECIALIST"
                  ? "Konfirmasi Kembalikan ke BC"
                  : "Konfirmasi Tolak"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah / Edit Item Trial */}
      <TambahItemTrialModal
        isOpen={isTambahTrialModalOpen}
        onClose={() => {
          setIsTambahTrialModalOpen(false);
          setTrialItemToEdit(null);
        }}
        onSubmit={handleSubmitTrialItem}
        existingItems={items}
        itemToEdit={trialItemToEdit}
        nextIndex={items.length + 1}
      />

      {/* Modal Evaluasi Akhir Trial (Phase 5) */}
      <EvaluasiTrialModal
        isOpen={isEvaluasiModalOpen}
        onClose={() => {
          setIsEvaluasiModalOpen(false);
          setEvaluasiItem(null);
        }}
        item={evaluasiItem}
        onSubmitPromosi={handleSubmitPromosiTrial}
        onSubmitNonaktifkan={handleSubmitNonaktifkanTrial}
      />
    </div>
  );
}
