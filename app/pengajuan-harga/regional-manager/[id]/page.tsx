"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  XCircle,
  FileText,
  Plus,
  Trash2,
  FileCheck,
} from "lucide-react";
import Select from "react-select";
import {
  PengajuanHargaItem,
  ApprovalLog,
} from "@/components/pengajuan-harga/types";
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from "@/components/pengajuan-harga/store";
import { DetailSpesifikasi } from "@/components/pengajuan-harga/DetailSpesifikasi";
import { RincianSurvei3TokoCard } from "@/components/pengajuan-harga/RincianSurvei3TokoCard";
import { RingkasanBiayaMaterial } from "@/components/pengajuan-harga/RingkasanBiayaMaterial";
import { RincianKalkulasiKoefisienTrial } from "@/components/pengajuan-harga/RincianKalkulasiKoefisienTrial";
import { PengajuanTimelineBar } from "@/components/pengajuan-harga/PengajuanTimelineBar";
import { useGlobalAlert } from "@/context/GlobalAlertContext";
import { Label } from "@/components/ui/label";

export default function RegionalManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const itemId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [loading, setLoading] = useState(true);

  // State Review / Keputusan
  const [catatan, setCatatan] = useState("");
  const [catatanError, setCatatanError] = useState("");
  const [activeAction, setActiveAction] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [revisiList, setRevisiList] = useState<{ field: string; note: string }[]>([{ field: "", note: "" }]);
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

  const formatRupiah = (val?: number) => {
    if (!val || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  useEffect(() => {
    if (!itemId) return;
    const all = getStoredPengajuan();
    const found = all.find((i) => i.id === itemId);
    if (found) {
      setItem(found);
    }
    setLoading(false);
  }, [itemId]);

  // ==========================================
  // REGULER FLOW (Layer 3)
  // ==========================================
  const handleApproveReguler = () => {
    if (!item) return;
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "PENDING_KONTRAKTOR" as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan:
                catatan.trim() ||
                "Disetujui Regional Manager (Layer 3). Diteruskan ke Kontraktor.",
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    showAlert({
      title: "Berhasil",
      message: "Pengajuan harga reguler disetujui.",
      type: "success",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  const handleRejectReguler = () => {
    if (!item) return;
    
    // Filter out incomplete entries
    const validRevisi = revisiList.filter((r) => r.field.trim() && r.note.trim());
    if (validRevisi.length === 0) {
      setCatatanError("Pilih minimal satu bagian yang direvisi beserta catatannya.");
      return;
    }

    setIsSubmitting(true);
    
    const compiledCatatan = validRevisi.map((r) => `- ${r.field}: ${r.note}`).join("\n");
    const compiledRevisiFields = validRevisi.map((r) => r.field);

    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "RETURNED_TO_BC" as const,
          catatanReview: compiledCatatan,
          revisiFields: compiledRevisiFields,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: compiledCatatan,
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    showAlert({
      title: "Dikembalikan",
      message: "Pengajuan dikembalikan ke BC.",
      type: "warning",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  // ==========================================
  // USULAN TRIAL BARU FLOW (Jalur B)
  // ==========================================
  const handleApproveTrial = () => {
    if (!item) return;
    setIsSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const durationDays = item.trialDurationDays || 90;
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "TRIAL_RELEASED" as const,
          isTrial: true,
          trialStartDate: today,
          trialDurationDays: durationDays,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan:
                catatan.trim() ||
                "Disetujui Regional Manager. Spesifikasi sementara resmi dirilis.",
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    showAlert({
      title: "Trial Disetujui",
      message: "Spesifikasi sementara dirilis.",
      type: "success",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  const handleReviseTrial = () => {
    if (!item) return;
    
    // Filter out incomplete entries
    const validRevisi = revisiList.filter((r) => r.field.trim() && r.note.trim());
    if (validRevisi.length === 0) {
      setCatatanError("Pilih minimal satu bagian yang direvisi beserta catatannya.");
      return;
    }

    setIsSubmitting(true);
    
    const compiledCatatan = validRevisi.map((r) => `- ${r.field}: ${r.note}`).join("\n");
    const compiledRevisiFields = validRevisi.map((r) => r.field);

    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "TRIAL_REVISI" as const,
          catatanReview: compiledCatatan,
          revisiFields: compiledRevisiFields,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
              action: "REJECT" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: compiledCatatan,
            },
          ],
        };
      }
      return i;
    });
    saveStoredPengajuan(updated);
    showAlert({
      title: "Trial Direvisi",
      message: "Dikembalikan ke S&B Specialist.",
      type: "warning",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  const handleRejectTrial = () => {
    if (!item) return;
    if (!catatan.trim()) {
      setCatatanError("Catatan wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "TRIAL_DITOLAK" as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
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
    showAlert({
      title: "Trial Ditolak",
      message: "Pengajuan trial ditolak.",
      type: "error",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  // ==========================================
  // PROMOSI PERMANEN FLOW (Phase 5)
  // ==========================================
  const handleApprovePromosi = () => {
    if (!item) return;
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "APPROVED_ACTIVE" as const,
          isTrial: false,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "Regional Manager" as const,
              action: "APPROVE" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan:
                catatan.trim() || "Disahkan menjadi Master Resmi Permanen.",
            },
          ],
        };
      }
      return i;
    });
    saveStoredPengajuan(updated);
    showAlert({
      title: "Master Disahkan",
      message: "Item ditetapkan jadi Master Resmi.",
      type: "success",
    });
    router.push("/pengajuan-harga/regional-manager");
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Memuat...
      </div>
    );
  if (!item)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Data tidak ditemukan
      </div>
    );

  const isPendingReguler = item.status === "PENDING_REGIONAL_MGR";
  const isPendingTrial = item.status === "TRIAL_PENDING_REGIONAL_MGR";
  const isPendingPromosi =
    item.status === "TRIAL_PROMOSI_REGIONAL_MGR" ||
    item.status === "TRIAL_PROMOSI_BM_MGR";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar
        title="Detail & Review Regional Manager"
        showBackButton
        backHref="/pengajuan-harga/regional-manager"
      />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <PengajuanTimelineBar item={item} />
        <DetailSpesifikasi item={item} showDeskripsi={true} />

        {item.isTrial && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800">Informasi Rencana Trial</h4>
              {isPendingPromosi && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">SELESAI DIEVALUASI</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Durasi Trial</label>
                <div className="mt-1 text-sm font-medium text-slate-800">
                  {item.trialDurationDays} Hari
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Alasan Trial</label>
                <div className="mt-1 text-sm font-medium text-slate-800">
                  {item.alasanTrial || "-"}
                </div>
              </div>
            </div>

            {isPendingPromosi && item.trialCatatanEvaluasi && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <label className="text-[11px] text-purple-600 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  Catatan Evaluasi Lapangan (S&B Specialist)
                </label>
                <div className="text-sm font-medium text-slate-800 bg-purple-50 p-3 rounded-xl border border-purple-100">
                  {item.trialCatatanEvaluasi}
                </div>
              </div>
            )}
          </div>
        )}
        {isPendingReguler && (
          <>
            {item.koefisienMaterialItems &&
            item.koefisienMaterialItems.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    Detail Survei Toko per Komponen:
                  </h4>
                  {item.koefisienMaterialItems.map((mat) => (
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
                <RingkasanBiayaMaterial
                  materialItems={item.koefisienMaterialItems}
                  totalBiayaMaterial={
                    item.hargaRataRata || item.estimasiHarga || 0
                  }
                  marginMaterial={item.marginMaterial}
                  formatRupiah={formatRupiah}
                />
              </div>
            ) : item.surveyToko && item.surveyToko.length > 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                <RincianSurvei3TokoCard
                  mode="readonly"
                  surveyToko={item.surveyToko}
                  satuan={item.satuan || "m2"}
                  materialCode={item.kodeMaster || item.kode}
                  materialName={`${item.item} ${item.ukuran} ${item.merk}`}
                />
              </div>
            ) : null}
          </>
        )}

        {(isPendingTrial || isPendingPromosi) && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <RincianKalkulasiKoefisienTrial
                item={item}
                initialUpahItems={item.koefisienUpahItems}
                initialUpahBongkaranItems={item.koefisienUpahBongkaranItems}
                initialMaterialItems={item.koefisienMaterialItems}
                initialMarginUpah={item.marginUpah}
                initialMarginMaterial={item.marginMaterial}
                isReadOnly={true}
                userRole="Regional Manager"
                onSave={() => {}}
              />
            </div>
            {item.koefisienMaterialItems &&
              item.koefisienMaterialItems.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <RingkasanBiayaMaterial
                    materialItems={item.koefisienMaterialItems}
                    totalBiayaMaterial={item.koefisienMaterialItems.reduce(
                      (acc, mat) =>
                        acc +
                        (parseFloat(String(mat.value)) || 0) *
                          (mat.hargaAcuan || 0),
                      0,
                    )}
                    marginMaterial={item.marginMaterial}
                    formatRupiah={formatRupiah}
                  />
                </div>
              )}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Tinjauan & Keputusan Regional Manager</span>
            </h3>
          </div>

          {activeAction === "none" ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/pengajuan-harga/regional-manager"
                className="w-full sm:w-auto"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl text-xs h-9"
                  disabled={isSubmitting}
                >
                  Kembali
                </Button>
              </Link>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                {isPendingReguler && (
                  <>
                    <Button
                      onClick={() => setActiveAction("reject_reguler")}
                      disabled={isSubmitting}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Revisi
                    </Button>
                    <Button
                      onClick={() => setActiveAction("approve_reguler")}
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui ke Kontraktor
                    </Button>
                  </>
                )}

                {isPendingTrial && (
                  <>
                    <Button
                      onClick={() => setActiveAction("reject_trial")}
                      disabled={isSubmitting}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </Button>
                    <Button
                      onClick={() => setActiveAction("revise_trial")}
                      disabled={isSubmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Revisi
                    </Button>
                    <Button
                      onClick={() => setActiveAction("approve_trial")}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Trial
                    </Button>
                  </>
                )}

                {isPendingPromosi && (
                  <>
                    <Button
                      onClick={() => setActiveAction("approve_promosi")}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sahkan Master
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {activeAction === "reject_reguler" || activeAction === "revise_trial" ? (
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
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRevisiList([...revisiList, { field: "", note: "" }])}
                      className="text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 rounded-lg w-full sm:w-auto h-9 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Tambah Bagian Revisi
                    </Button>
                  </div>
                  {catatanError && (
                    <p className="text-xs text-red-600 mt-2 font-medium">{catatanError}</p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    Catatan Regional Manager
                  </label>
                  <Textarea
                    value={catatan}
                    onChange={(e) => {
                      setCatatan(e.target.value);
                      setCatatanError("");
                    }}
                    placeholder="Tuliskan catatan persetujuan atau alasan tolak..."
                    className="text-xs rounded-lg border-slate-300 min-h-[80px]"
                  />
                  {catatanError && (
                    <p className="text-xs text-red-600 mt-1">{catatanError}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-slate-500 hover:text-slate-700 h-9"
                  onClick={() => {
                    setActiveAction("none");
                    setCatatan("");
                    setCatatanError("");
                    setRevisiList([{ field: "", note: "" }]);
                  }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (activeAction === "approve_reguler") handleApproveReguler();
                    if (activeAction === "reject_reguler") handleRejectReguler();
                    if (activeAction === "approve_trial") handleApproveTrial();
                    if (activeAction === "reject_trial") handleRejectTrial();
                    if (activeAction === "revise_trial") handleReviseTrial();
                    if (activeAction === "approve_promosi") handleApprovePromosi();
                  }}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-9 px-6 font-semibold shadow-sm"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
