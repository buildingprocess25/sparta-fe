import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Loader2,
  ReceiptText,
  UserCheck,
  Users,
  Wrench,
  X
} from "lucide-react";
import {
  fetchPerformanceDetail,
  fetchPerformanceDrilldown,
  type PerformanceCardType,
  type PerformanceDetailData,
  type PerformanceDocument,
  type PerformanceDrilldownItem,
  type PerformanceJobType,
  type PerformancePeriod,
  type PerformancePersonRole,
  type PerformanceSlaRole,
  type PerformanceTableMetric
} from "@/lib/api/performance-v3";
import { KpiDetailSections } from "./kpi-detail-sections";
import { KpiDocuments } from "./kpi-documents";
import { cn } from "@/lib/utils";

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: PerformanceCardType | null;
  kpiTitle: string;
  actorRole: string;
  actorCabang: string;
  cabangFilter: string;
  coordinatorFilter: string;
  supportFilter: string;
  period: PerformancePeriod;
  jobType: PerformanceJobType;
  search: string;
  supportMetric?: PerformanceTableMetric;
  availableCoordinators?: string[];
  availableSupports?: string[];
  approvalActors?: Record<PerformanceSlaRole, string[]>;
}

type DrilldownStep = "select_role" | "select_doc" | "select_name" | "list_ulok";

const roleOptions: Array<{ id: PerformanceSlaRole | PerformancePersonRole; label: string; icon: React.ElementType; tone: string }> = [
  { id: "support", label: "Branch Building Support", icon: Wrench, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { id: "coordinator", label: "Branch Building Coordinator", icon: UserCheck, tone: "text-sky-700 bg-sky-50 border-sky-200" },
  { id: "bm_manager", label: "Branch Building & Maintenance Manager", icon: Users, tone: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { id: "branch_manager", label: "Branch Manager", icon: Building2, tone: "text-cyan-700 bg-cyan-50 border-cyan-200" }
];

const docOptions: Array<{ id: PerformanceDocument; label: string; roles: PerformanceSlaRole[]; icon: React.ElementType }> = [
  { id: "rab", label: "RAB", roles: ["coordinator", "bm_manager"], icon: ReceiptText },
  { id: "spk", label: "SPK", roles: ["branch_manager"], icon: FileText },
  { id: "tambah_spk", label: "Tambah SPK", roles: ["branch_manager"], icon: FileText },
  { id: "il", label: "Instruksi Lapangan", roles: ["coordinator", "bm_manager"], icon: FileText },
  { id: "ktk", label: "KTK / Opname Final", roles: ["support", "coordinator", "bm_manager"], icon: CircleDollarSign }
];

const roleLabel = (role?: string | null) => roleOptions.find((item) => item.id === role)?.label ?? "-";

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiType,
  kpiTitle,
  actorRole,
  actorCabang,
  cabangFilter,
  coordinatorFilter,
  supportFilter,
  period,
  jobType,
  search,
  supportMetric,
  availableCoordinators = [],
  availableSupports = [],
  approvalActors
}: KpiDrilldownModalProps) {
  const [step, setStep] = useState<DrilldownStep>("select_role");
  const [selectedRole, setSelectedRole] = useState<PerformanceSlaRole | PerformancePersonRole | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<PerformanceDocument | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [rows, setRows] = useState<PerformanceDrilldownItem[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUlok, setSelectedUlok] = useState<PerformanceDrilldownItem | null>(null);
  const [detail, setDetail] = useState<PerformanceDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const normalizedActor = actorRole.toUpperCase();
  const isSupportUser = normalizedActor.includes("SUPPORT") || normalizedActor.includes("PENGAWAS");
  const isCoordinatorUser = normalizedActor.includes("KOORDINATOR") || normalizedActor.includes("COORD");

  useEffect(() => {
    if (!isOpen || !kpiType) return;
    setRows([]);
    setMeta(null);
    setError(null);
    setSelectedUlok(null);
    setDetail(null);
    setSelectedDoc(null);
    setSelectedName(null);

    if (supportMetric) {
      setSelectedRole("support");
      setSelectedName(supportFilter === "ALL" ? null : supportFilter);
      setStep("list_ulok");
      return;
    }
    
    // Auto-select support for support users ONLY IF the support role is actually allowed for this KPI
    const isSupportAllowed = kpiType !== "sla_approval" && (kpiType === "ketepatan_st" || kpiType === "sla_ktk" || true);
    if (isSupportUser && kpiType !== "sla_approval") {
      setSelectedRole("support");
      setSelectedName(actorRole);
      setStep("list_ulok");
      return;
    }
    if (isCoordinatorUser && kpiType !== "sla_approval") {
      setSelectedRole("support");
      setStep("select_name");
      return;
    }
    if (kpiType === "ketepatan_st" || kpiType === "sla_ktk") {
      setSelectedRole("support");
      setStep("select_name");
      return;
    }
    setStep("select_role");
  }, [actorRole, isCoordinatorUser, isOpen, isSupportUser, kpiType, supportFilter, supportMetric]);

  const allowedRoles = useMemo(() => {
    if (!kpiType) return [];
    if (kpiType === "sla_approval") return roleOptions.filter((role) => role.id !== "support");
    if (kpiType === "ketepatan_st" || kpiType === "sla_ktk") return roleOptions.filter((role) => role.id === "support");
    return roleOptions.filter((role) => role.id === "coordinator" || role.id === "support");
  }, [kpiType]);

  const loadRows = useCallback(async (page = 1) => {
    if (!kpiType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPerformanceDrilldown({
        actor_role: actorRole || "USER",
        actor_cabang: actorCabang,
        cabang: cabangFilter,
        coordinator: coordinatorFilter,
        support: supportFilter,
        job_type: jobType,
        period,
        search,
        card_type: kpiType,
        sla_role: kpiType === "sla_approval" ? selectedRole as PerformanceSlaRole : undefined,
        sla_doc: selectedDoc ?? undefined,
        person_role: kpiType !== "sla_approval" ? selectedRole as PerformancePersonRole : undefined,
        person_name: selectedName ?? undefined,
        support_metric: supportMetric,
        page,
        limit: 25
      });
      setRows(res.data || []);
      setMeta(res.meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat list ULOK.");
    } finally {
      setLoading(false);
    }
  }, [actorCabang, actorRole, cabangFilter, coordinatorFilter, jobType, kpiType, period, search, selectedDoc, selectedName, selectedRole, supportFilter, supportMetric]);

  useEffect(() => { if (isOpen && step === "list_ulok") loadRows(1); }, [isOpen, step, loadRows]);

  const openDetail = async (row: PerformanceDrilldownItem) => {
    if (!kpiType) return;
    setSelectedUlok(row);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetchPerformanceDetail({
        actor_role: actorRole || "USER",
        actor_cabang: actorCabang,
        cabang: cabangFilter,
        coordinator: coordinatorFilter,
        support: supportFilter,
        job_type: jobType,
        period,
        search,
        nomor_ulok: row.nomor_ulok,
        card_type: kpiType,
        sla_role: kpiType === "sla_approval" ? selectedRole as PerformanceSlaRole : undefined,
        sla_doc: selectedDoc ?? undefined,
        person_role: kpiType !== "sla_approval" ? selectedRole as PerformancePersonRole : undefined,
        person_name: selectedName ?? undefined,
        support_metric: supportMetric
      });
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const goBack = () => {
    if (step === "list_ulok") {
      if (supportMetric) return onClose();
      setStep(kpiType === "sla_approval" ? "select_doc" : "select_name");
      return;
    }
    if (step === "select_doc") {
      setStep(kpiType === "sla_approval" ? "select_name" : "select_role");
      return;
    }
    if (step === "select_name") {
      setStep("select_role");
      return;
    }
  };

  const renderRole = () => (
    <div className="flex flex-col items-center justify-center p-8 lg:p-12">
      <div className="mb-10 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">Pilih Role KPI</h3>
        <p className="mt-2 text-sm font-bold text-slate-500">Tentukan perspektif evaluasi performa</p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
        {allowedRoles.map((role) => {
          const Icon = role.icon;
          return (
            <button key={role.id} type="button" onClick={() => { setSelectedRole(role.id); setStep("select_name"); }} className="group relative flex flex-col items-center gap-4 rounded-[24px] border border-slate-200/60 bg-white/50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(220,38,38,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110", role.tone)}>
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-800">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDoc = () => {
    const docs = docOptions.filter((doc) => selectedRole && doc.roles.includes(selectedRole as PerformanceSlaRole));
    return (
      <div className="flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="mb-10 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Pilih Dokumen</h3>
          <p className="mt-2 text-sm font-bold text-slate-500">Evaluasi SLA untuk {roleLabel(selectedRole)}</p>
        </div>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <button key={doc.id} type="button" onClick={() => { setSelectedDoc(doc.id); setStep("list_ulok"); }} className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/50 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(220,38,38,0.06)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100 transition-transform duration-300 group-hover:scale-110 group-hover:bg-red-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-bold tracking-tight text-slate-800">{doc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderName = () => {
    let names: string[] = [];
    if (kpiType === "sla_approval") {
      names = approvalActors?.[selectedRole as PerformanceSlaRole] || [];
    } else {
      names = Array.from(new Set((selectedRole === "coordinator" ? availableCoordinators : availableSupports).filter(Boolean)));
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Pilih Personil</h3>
          <p className="mt-2 text-sm font-bold text-slate-500">Pilih spesifik personil {roleLabel(selectedRole)}</p>
        </div>
        <div className="grid max-h-[50vh] w-full max-w-4xl grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3 custom-scrollbar">
          <button type="button" onClick={() => { setSelectedName(null); setStep(kpiType === "sla_approval" ? "select_doc" : "list_ulok"); }} className="group flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-5 py-4 text-sm font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
            Semua Personil <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
          </button>
          {names.map((name) => (
            <button key={name} type="button" onClick={() => { setSelectedName(name); setStep(kpiType === "sla_approval" ? "select_doc" : "list_ulok"); }} className="group flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-5 py-4 text-sm font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
              <span className="truncate">{name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-normal text-slate-500"><tr><th className="px-4 py-3">ULOK</th><th className="px-4 py-3">Cabang</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.nomor_ulok} className="group hover:bg-red-50/50">
                    <td className="p-0" colSpan={4}>
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        className="grid w-full grid-cols-[minmax(260px,2fr)_minmax(140px,1fr)_minmax(120px,160px)_minmax(160px,1fr)] items-center gap-4 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
                        aria-label={`Buka detail KPI ${row.nomor_ulok} ${row.nama_toko ?? ""}`}
                      >
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-950 underline-offset-4 group-hover:text-red-700 group-hover:underline">{row.nomor_ulok}</span>
                          <span className="block truncate text-xs font-semibold text-slate-500">{row.nama_toko ?? "-"}</span>
                        </span>
                        <span className="font-bold text-slate-700">{row.cabang ?? "-"}</span>
                        <span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">{row.value_label}</span></span>
                        <span className="text-xs font-bold text-slate-500">{row.secondary_label}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada ULOK untuk pilihan ini.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] relative z-10">
          <span>Page {meta.page} dari {meta.totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={meta.page <= 1} onClick={() => loadRows(meta.page - 1)} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40 disabled:hover:bg-white">Prev</button>
            <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => loadRows(meta.page + 1)} className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40 disabled:hover:bg-white">Next</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn(
          "!flex flex-col gap-0 overflow-hidden border border-white/60 bg-[#f8fafc]/95 p-0 shadow-2xl backdrop-blur-3xl transition-all duration-500 sm:rounded-[32px] max-h-[90dvh]",
          step === "list_ulok" ? "w-[95vw] sm:max-w-5xl" : "w-[95vw] sm:max-w-4xl"
        )}>
          <DialogHeader className="relative z-10 flex shrink-0 flex-col justify-center border-b border-slate-200/50 bg-white/40 px-6 py-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              {step !== "select_role" && (
                <button 
                  type="button" 
                  aria-label="Kembali" 
                  onClick={goBack} 
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-2xl font-bold tracking-tight text-slate-900">{kpiTitle}</DialogTitle>
                <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span className="truncate">{roleLabel(selectedRole)} {selectedDoc ? `\u2022 ${selectedDoc.toUpperCase()}` : ""}</span>
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-transparent">
            {step === "select_role" && renderRole()}
            {step === "select_doc" && renderDoc()}
            {step === "select_name" && renderName()}
            {step === "list_ulok" && renderList()}
          </div>
        </DialogContent>
      </Dialog>

      {selectedUlok && (
        <DialogPrimitive.Root open={!!selectedUlok} onOpenChange={(open) => !open && setSelectedUlok(null)}>
          <DialogPrimitive.Portal>
            <div className="fixed inset-0 z-[100] isolate overflow-hidden">
              <DialogPrimitive.Overlay className="absolute inset-0 z-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 data-[state=closed]:opacity-0" />
              <DialogPrimitive.Content 
                aria-describedby={undefined} 
                className="fixed !right-0 !top-0 !left-auto !bottom-auto !translate-x-0 !translate-y-0 z-[110] flex h-dvh w-full max-w-2xl flex-col border-l border-white/60 bg-[#f8fafc] shadow-2xl duration-500 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right focus-visible:outline-none"
              >
                <header className="sticky top-0 z-10 shrink-0 border-b border-slate-200/50 bg-white/70 px-6 py-5 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                        Detail ULOK {selectedUlok.nomor_ulok}
                      </p>
                      <DialogPrimitive.Title asChild>
                        <h3 className="mt-1.5 truncate text-2xl font-bold tracking-tight text-slate-900">
                          {selectedUlok.nama_toko ?? selectedUlok.nomor_ulok}
                        </h3>
                      </DialogPrimitive.Title>
                    </div>
                    <DialogPrimitive.Close className="group rounded-full bg-slate-100 p-2.5 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      <X className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
                    </DialogPrimitive.Close>
                  </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 custom-scrollbar bg-transparent">
                  {detailLoading ? (
                    <div className="flex h-64 items-center justify-center rounded-3xl border border-white bg-white/40 shadow-sm backdrop-blur-md">
                      <Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" />
                    </div>
                  ) : detail ? (
                    <div className="flex flex-col gap-6">
                      <KpiDetailSections detail={detail} />
                      <KpiDocuments documents={detail.documents} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-bold text-red-700 shadow-sm backdrop-blur-sm">
                      Detail tidak bisa dimuat.
                    </div>
                  )}
                </div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </>
  );
}
