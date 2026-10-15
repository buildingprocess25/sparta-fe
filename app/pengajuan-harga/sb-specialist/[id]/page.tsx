"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Tag,
  Store,
  RotateCcw,
  XCircle,
  FileText,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import Select from "react-select";
import {
  PengajuanHargaItem,
  KoefisienDetailItem,
  ApprovalLog,
} from "@/components/pengajuan-harga/types";
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from "@/components/pengajuan-harga/store";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { RincianKalkulasiKoefisien } from "@/components/pengajuan-harga/RincianKalkulasiKoefisien";
import { ReviewNegosiasiKontraktorCard } from "@/components/pengajuan-harga/ReviewNegosiasiKontraktorCard";
import { DetailSpesifikasi } from "@/components/pengajuan-harga/DetailSpesifikasi";
import { PengajuanTimelineBar } from "@/components/pengajuan-harga/PengajuanTimelineBar";
import { RincianSurvei3TokoCard } from "@/components/pengajuan-harga/RincianSurvei3TokoCard";
import { RingkasanBiayaMaterial } from "@/components/pengajuan-harga/RingkasanBiayaMaterial";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SBSpecialistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const itemId = params?.id as string;

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [catatan, setCatatan] = useState("");
  const [liveMarginUpah, setLiveMarginUpah] = useState<number>(8);
  const [liveMarginMaterial, setLiveMarginMaterial] = useState<number>(8);
  const [liveMarginBongkaran, setLiveMarginBongkaran] = useState<number>(8);

  const handleMarginChange = React.useCallback(
    (upah: number, mat: number, bongkaran: number) => {
      setLiveMarginUpah(upah);
      setLiveMarginMaterial(mat);
      setLiveMarginBongkaran(bongkaran);
    },
    []
  );

  const handleApplyRecommendedMargin = React.useCallback((recMargin: number) => {
    setLiveMarginUpah(recMargin);
    setLiveMarginMaterial(recMargin);
    setLiveMarginBongkaran(recMargin);
  }, []);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };
  const [revisiList, setRevisiList] = useState<{ field: string; note: string }[]>([{ field: "", note: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type ActionType = "none" | "approve_spec" | "reject_spec" | "revise_spec" | "approve_harga" | "reject_harga";
  const [activeAction, setActiveAction] = useState<ActionType>("none");

  const OPTIONS_REVISI = [
    "Kategori Pekerjaan",
    "Nama Material",
    "Ukuran",
    "Merk",
    "Warna",
    "Tipe / Motif",
    "Ketebalan",
    "Finishing Permukaan",
    "Toleransi",
    "Implementasi / Posisi",
    "Lokasi / Area Gerai",
    "Informasi Tambahan",
  ];

  // Load Item from Store
  useEffect(() => {
    if (!itemId) return;
    const allItems = getStoredPengajuan();
    const found = allItems.find((i) => i.id === itemId);
    if (found) {
      setItem(found);
      setLiveMarginUpah(found.marginUpah ?? 8);
      setLiveMarginMaterial(found.marginMaterial ?? 8);
      setLiveMarginBongkaran(found.marginBongkaran ?? found.marginUpah ?? 8);
    }
  }, [itemId]);

  // =================== HANDLER PERSETUJUAN SPESIFIKASI ===================
  const handleApproveSpec = () => {
    if (!item) return;
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
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
              catatan: catatan.trim() || "Permohonan penetapan spesifikasi disetujui oleh S&B Specialist.",
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem(updated.find((i) => i.id === item.id) || null);
    showAlert({ title: "Berhasil", message: "Spesifikasi disetujui.", type: "success" });
    setIsSubmitting(false);
  };

  const handleReviseSpec = () => {
    if (!item) return;
    
    // Filter out incomplete entries
    const validRevisi = revisiList.filter((r) => r.field.trim() && r.note.trim());
    if (validRevisi.length === 0) {
      showAlert({ title: "Perhatian", message: "Pilih minimal satu bagian yang direvisi beserta catatannya.", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    
    // Compile global catatan and revisiFields
    const compiledCatatan = validRevisi.map((r) => `- ${r.field}: ${r.note}`).join("\n");
    const compiledRevisiFields = validRevisi.map((r) => r.field);

    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "REVISI" as const,
          catatanReview: compiledCatatan,
          revisiFields: compiledRevisiFields,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REVISE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: compiledCatatan,
              revisiFields: compiledRevisiFields,
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem(updated.find((i) => i.id === item.id) || null);
    showAlert({ title: "Direvisi", message: "Catatan revisi dikirim ke B&M Manager.", type: "info" });
    setIsSubmitting(false);
    router.push("/pengajuan-harga/sb-specialist");
  };

  const handleRejectSpec = () => {
    if (!item) return;
    if (!catatan.trim()) {
      showAlert({ title: "Perhatian", message: "Alasan penolakan wajib diisi.", type: "warning" });
      return;
    }
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "DITOLAK" as const,
          catatanReview: catatan.trim(),
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: catatan.trim(),
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem(updated.find((i) => i.id === item.id) || null);
    showAlert({ title: "Ditolak", message: "Pengajuan spesifikasi ditolak.", type: "warning" });
    setIsSubmitting(false);
    router.push("/pengajuan-harga/sb-specialist");
  };

  // =================== HANDLER PERSETUJUAN HARGA SURVEI (LAYER 2) ===================
  const handleApproveHarga = () => {
    if (!item) return;
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "PENDING_REGIONAL_MGR" as const,
          usulanHargaKontraktor: undefined,
          usulanMarginKontraktor: undefined,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: catatan.trim() || "Disetujui S&B Specialist (Layer 2) dan diteruskan ke Regional Manager.",
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem(updated.find((i) => i.id === item.id) || null);
    showAlert({ title: "Berhasil", message: "Pengajuan harga disetujui (Layer 2).", type: "success" });
    setIsSubmitting(false);
    router.push("/pengajuan-harga/sb-specialist");
  };

  const handleRejectHarga = () => {
    if (!item) return;
    if (!catatan.trim()) {
      showAlert({ title: "Perhatian", message: "Alasan penolakan / revisi wajib diisi.", type: "warning" });
      return;
    }
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "RETURNED_TO_BC" as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: catatan.trim(),
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem(updated.find((i) => i.id === item.id) || null);
    showAlert({ title: "Ditolak", message: "Harga dikembalikan ke BC.", type: "warning" });
    setIsSubmitting(false);
    router.push("/pengajuan-harga/sb-specialist");
  };

  // Save Koefisien Callback dari Komponen Independen
  const handleSaveKoefisien = (data: {
    upahItems: KoefisienDetailItem[];
    koefisienUpahBongkaranItems?: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah: number;
    marginMaterial: number;
    marginBongkaran?: number;
  }) => {
    if (!item) return;

    const allItems = getStoredPengajuan();
    const updated = allItems.map((i) => {
      if (i.id === item.id) {
        const summaryUpah =
          data.upahItems.length > 0
            ? data.upahItems
                .map(
                  (u) =>
                    `${u.label}: ${u.value} ${u.unit} (@Rp ${u.hargaAcuan || 0})`,
                )
                .join(", ")
            : "Tidak ada";
        const summaryMat =
          data.materialItems.length > 0
            ? data.materialItems
                .map((m) => `${m.label}: ${m.value} ${m.unit}`)
                .join(", ")
            : "Tidak ada";

        let nextStatus = i.status;
        let actionCatatan = `Koefisien teknis AHSP disimpan (Margin Upah: ${data.marginUpah}%, Margin Material: ${data.marginMaterial}%). Status berubah menjadi Siap Survei untuk Building Coordinator. [Upah: ${summaryUpah}] | [Material: ${summaryMat}]`;

        if (i.status === "PENDING_SB_SPECIALIST" || i.status === "USULAN_KONTRAKTOR") {
          // Alur A: status langsung kembali ke Kontraktor
          nextStatus = "PENDING_KONTRAKTOR";
          actionCatatan = `Penyesuaian margin negosiasi harga selesai (Margin Upah: ${data.marginUpah}%, Margin Material: ${data.marginMaterial}%, Margin Bongkaran: ${data.marginBongkaran ?? data.marginUpah}%). Harga penawaran baru dikirimkan kembali ke Kontraktor.`;
        } else if (i.isTrial) {
          if (i.status === "TRIAL_REVISI") nextStatus = "TRIAL_PENDING_REGIONAL_MGR";
        } else {
          // Hanya ubah ke SIAP_SURVEI jika statusnya baru disetujui spesifikasinya
          if (i.status === "DISETUJUI") nextStatus = "SIAP_SURVEI";
        }

        return {
          ...i,
          status: nextStatus,
          koefisienUpahItems: data.upahItems,
          koefisienMaterialItems: data.materialItems,
          koefisienUpahBongkaranItems: data.koefisienUpahBongkaranItems,
          marginUpah: data.marginUpah,
          marginMaterial: data.marginMaterial,
          marginBongkaran: data.marginBongkaran,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "MASTERING" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: actionCatatan,
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    const updatedItem = updated.find((i) => i.id === item.id) || null;
    setItem(updatedItem);

    if (item.status === "PENDING_SB_SPECIALIST" || item.status === "USULAN_KONTRAKTOR") {
      showAlert({
        title: "Berhasil",
        message: "Margin berhasil disesuaikan dan harga penawaran baru telah dikirimkan kembali ke Kontraktor.",
        type: "success",
      });
      router.push("/pengajuan-harga/sb-specialist");
    } else {
      showAlert({
        title: "Koefisien Berhasil Disimpan",
        message: `Koefisien berhasil disimpan. Item siap untuk survei harga oleh Building Coordinator.`,
        type: "success",
      });
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <AppNavbar
          title="Detail Item"
          showBackButton
          backHref="/pengajuan-harga/sb-specialist"
        />
        <main className="flex-1 max-w-4xl mx-auto p-8 text-center flex flex-col items-center justify-center">
          <p className="text-slate-500 mb-4">e
            Item tidak ditemukan atau sedang dimuat...
          </p>
          <Link href="/pengajuan-harga/sb-specialist">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AppNavbar
        title="Detail Item & Input Koefisien"
        showBackButton
        backHref="/pengajuan-harga/sb-specialist"
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/pengajuan-harga/sb-specialist"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Antrean S&amp;B Specialist</span>
          </Link>
          {(() => {
            switch (item.status) {
              case "DIAJUKAN":
              case "PENDING_VALIDASI_SB":
                return (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs px-2.5 py-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Status: Validasi Spesifikasi
                  </Badge>
                );
              case "PENDING_SB_SPECIALIST":
                return (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs px-2.5 py-0.5">
                    <Store className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Status: Validasi Harga Survei
                  </Badge>
                );
              case "USULAN_KONTRAKTOR":
                return (
                  <Badge className="bg-orange-50 text-orange-800 border-orange-200 text-xs px-2.5 py-0.5">
                    <RotateCcw className="w-3.5 h-3.5 mr-1 text-orange-600" />
                    Status: Usulan Kontraktor
                  </Badge>
                );
              case "DISETUJUI":
              case "SIAP_SURVEI":
                return (
                  <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs px-2.5 py-0.5">
                    <Store className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Status: {item.status === "DISETUJUI" ? "Spesifikasi Disetujui" : "Siap Survei"}
                  </Badge>
                );
              case "REVISI":
              case "PERLU_REVISI":
              case "RETURNED_TO_BC":
                return (
                  <Badge className="bg-orange-50 text-orange-800 border-orange-200 text-xs px-2.5 py-0.5">
                    <RotateCcw className="w-3.5 h-3.5 mr-1 text-orange-600" />
                    Status: Perlu Revisi
                  </Badge>
                );
              case "DITOLAK":
                return (
                  <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs px-2.5 py-0.5">
                    <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Status: Ditolak
                  </Badge>
                );
              default:
                return (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Status: {item.status.replace(/_/g, " ")}
                  </Badge>
                );
            }
          })()}
        </div>

        {/* Timeline Bar Pengajuan */}
        <PengajuanTimelineBar item={item} />


        {/* Card Ringkasan Spesifikasi Item */}
        <DetailSpesifikasi
          item={item}
          showDeskripsi={true}
        />

        {/* FORM PERSETUJUAN SPESIFIKASI */}
        {(item.status === "DIAJUKAN" || item.status === "PENDING_VALIDASI_SB") && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Tinjauan & Validasi Spesifikasi</span>
              </h3>
            </div>

            {activeAction === "none" || activeAction === "approve_harga" || activeAction === "reject_harga" ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/pengajuan-harga/sb-specialist")}
                  className="w-full sm:w-auto rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
                  disabled={isSubmitting}
                >
                  Kembali
                </Button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveAction("reject_spec");
                      setCatatan("");
                    }}
                    disabled={isSubmitting}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveAction("revise_spec");
                      setCatatan("");
                      setRevisiList([{ field: "", note: "" }]);
                    }}
                    disabled={isSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisi</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveAction("approve_spec");
                      setCatatan("");
                    }}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Setujui Spesifikasi</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {activeAction === "revise_spec" ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <Label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Detail Bagian yang Perlu Direvisi
                    </Label>
                    <div className="space-y-3">
                      {revisiList.map((rev, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-lg border border-amber-100 relative">
                          <div className="flex-1 space-y-2">
                            <Label className="text-[11px] text-slate-500 font-semibold">Pilih Bagian</Label>
                            <Select
                              value={rev.field ? { label: rev.field, value: rev.field } : null}
                              onChange={(option) => {
                                const newList = [...revisiList];
                                newList[index].field = option ? option.value : "";
                                setRevisiList(newList);
                              }}
                              options={OPTIONS_REVISI.map((opt) => ({
                                label: opt,
                                value: opt,
                                isDisabled: revisiList.some((r, rIndex) => rIndex !== index && r.field === opt)
                              }))}
                              placeholder="Pilih bagian..."
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  fontSize: '12px',
                                  minHeight: '36px',
                                  borderRadius: '0.5rem',
                                  borderColor: '#e2e8f0',
                                  boxShadow: 'none',
                                  '&:hover': {
                                    borderColor: '#cbd5e1'
                                  }
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  fontSize: '12px',
                                  cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                })
                              }}
                              isClearable
                              isSearchable
                            />
                          </div>
                          <div className="flex-[2] space-y-2">
                            <Label className="text-[11px] text-slate-500 font-semibold">Catatan Revisi</Label>
                            <div className="flex gap-2 items-start">
                              <Textarea
                                value={rev.note}
                                onChange={(e) => {
                                  const newList = [...revisiList];
                                  newList[index].note = e.target.value;
                                  setRevisiList(newList);
                                }}
                                rows={1}
                                className="min-h-[36px] text-xs resize-none"
                                placeholder="Jelaskan detail revisinya..."
                              />
                              {revisiList.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                                  onClick={() => {
                                    const newList = [...revisiList];
                                    newList.splice(index, 1);
                                    setRevisiList(newList);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {revisiList.length < OPTIONS_REVISI.length && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-8 text-xs text-amber-700 border-amber-200 bg-amber-100/50 hover:bg-amber-100 mt-2 cursor-pointer"
                        onClick={() => setRevisiList([...revisiList, { field: "", note: "" }])}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah Bagian Lain
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {activeAction === "approve_spec" ? "Catatan Persetujuan (Opsional)" : 
                         activeAction === "reject_spec" ? "Alasan Penolakan (Wajib)" : ""}
                      </span>
                    </label>
                    <Textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder={
                        activeAction === "approve_spec" ? "Tuliskan catatan persetujuan jika ada..." : 
                        "Tuliskan alasan spesifikasi ini ditolak..."
                      }
                      rows={3}
                      className={`text-xs rounded-xl focus-visible:ring-blue-500/20 ${
                        activeAction === "reject_spec" && !catatan.trim() 
                          ? "border-rose-300 focus-visible:border-rose-500" 
                          : "border-slate-200"
                      }`}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveAction("none")}
                    className="text-xs h-9 px-4 text-slate-500 hover:text-slate-800 rounded-xl"
                  >
                    Batal
                  </Button>

                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={
                      activeAction === "approve_spec" ? handleApproveSpec : 
                      activeAction === "reject_spec" ? handleRejectSpec : 
                      handleReviseSpec
                    }
                    className={`rounded-xl text-xs h-9 px-5 font-bold text-white shadow-2xs gap-1.5 cursor-pointer ${
                      activeAction === "approve_spec" ? "bg-emerald-600 hover:bg-emerald-700" :
                      activeAction === "reject_spec" ? "bg-rose-600 hover:bg-rose-700" :
                      "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {activeAction === "approve_spec" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {activeAction === "reject_spec" && <XCircle className="w-3.5 h-3.5" />}
                    {activeAction === "revise_spec" && <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Konfirmasi {
                      activeAction === "approve_spec" ? "Persetujuan" : 
                      activeAction === "reject_spec" ? "Tolak" : "Revisi"
                    }</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM PERSETUJUAN HARGA SURVEI (LAYER 2) */}
        {item.status === "PENDING_SB_SPECIALIST" && (
          <div className="space-y-6">
            {/* Tampilkan Hasil Survei */}
            {item.surveyToko && item.surveyToko.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-500" />
                  <span>Review Hasil Survei Harga Lapangan</span>
                </h3>
                <RingkasanBiayaMaterial
                  materialItems={item.koefisienMaterialItems || []}
                  totalBiayaMaterial={item.hargaRataRata || item.estimasiHarga || 0}
                  marginMaterial={item.marginMaterial}
                  formatRupiah={(val) => `Rp ${val?.toLocaleString('id-ID')}`}
                />
                <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
                  {item.koefisienMaterialItems?.map((mat) => (
                    <RincianSurvei3TokoCard
                      key={mat.id}
                      mode="readonly"
                      surveyToko={mat.surveyToko || []}
                      satuan={mat.unit || "m2"}
                      materialCode={mat.id}
                      materialName={mat.label}
                    />
                  ))}
                  {(!item.koefisienMaterialItems || item.koefisienMaterialItems.length === 0) && item.surveyToko && (
                    <RincianSurvei3TokoCard
                      mode="readonly"
                      surveyToko={item.surveyToko}
                      satuan={item.satuan || "m2"}
                      materialCode={item.kodeMaster || item.kode}
                      materialName={`${item.item} ${item.ukuran} ${item.merk}`}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Tinjauan & Persetujuan Harga Survei (Layer 2)</span>
                </h3>
              </div>

              {activeAction === "none" || activeAction === "approve_spec" || activeAction === "reject_spec" || activeAction === "revise_spec" ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/pengajuan-harga/sb-specialist")}
                    className="w-full sm:w-auto rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Kembali
                  </Button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                    <Button
                      type="button"
                      onClick={() => {
                        setActiveAction("reject_harga");
                        setCatatan("");
                      }}
                      disabled={isSubmitting}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revisi</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setActiveAction("approve_harga");
                        setCatatan("");
                      }}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui Harga (Layer 2)</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {activeAction === "approve_harga" ? "Catatan Persetujuan Harga (Opsional)" : "Alasan Pengembalian Harga ke BC (Wajib)"}
                      </span>
                    </label>
                    <Textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder={
                        activeAction === "approve_harga" ? "Tuliskan catatan persetujuan harga survei jika ada..." : "Tuliskan alasan spesifik kenapa harga survei ini dikembalikan..."
                      }
                      rows={3}
                      className={`text-xs rounded-xl focus-visible:ring-blue-500/20 ${
                        activeAction === "reject_harga" && !catatan.trim() 
                          ? "border-rose-300 focus-visible:border-rose-500" 
                          : "border-slate-200"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveAction("none")}
                      className="text-xs h-9 px-4 text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                    >
                      Batal
                    </Button>

                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={
                        activeAction === "approve_harga" ? handleApproveHarga : handleRejectHarga
                      }
                      className={`rounded-xl text-xs h-9 px-5 font-bold text-white shadow-2xs gap-1.5 cursor-pointer ${
                        activeAction === "approve_harga" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {activeAction === "approve_harga" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Konfirmasi {activeAction === "approve_harga" ? "Setujui Harga" : "Kembalikan ke BC"}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JIKA STATUS USULAN_KONTRAKTOR ATAU ADA USULAN KONTRAKTOR: TAMPILKAN KARTU REVIEW NEGOSIASI KONTRAKTOR */}
        {(item.status === "USULAN_KONTRAKTOR" || item.usulanHargaKontraktor !== undefined) && (
          <ReviewNegosiasiKontraktorCard
            item={item}
            currentMarginUpah={liveMarginUpah}
            currentMarginMaterial={liveMarginMaterial}
            currentMarginBongkaran={liveMarginBongkaran}
            onApplyRecommendedMargin={handleApplyRecommendedMargin}
          />
        )}

        {/* RINCIAN KALKULASI KOEFISIEN (KOMPONEN INDEPENDEN) */}
        {(item.status === "DISETUJUI" ||
          item.status === "SIAP_SURVEI" ||
          item.status === "USULAN_KONTRAKTOR" ||
          item.status === "APPROVED_ACTIVE" ||
          item.status === "RELEASED") && (
          <RincianKalkulasiKoefisien
            item={item}
            initialMarginUpah={liveMarginUpah}
            initialMarginMaterial={liveMarginMaterial}
            initialMarginBongkaran={liveMarginBongkaran}
            onMarginChange={handleMarginChange}
            onSave={handleSaveKoefisien}
            onBack={() => router.push("/pengajuan-harga/sb-specialist")}
            isReadOnly={item.status === "USULAN_KONTRAKTOR"}
          />
        )}
      </main>
    </div>
  );
}
