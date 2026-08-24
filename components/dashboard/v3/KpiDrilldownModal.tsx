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
  fetchPerformanceOptionStats,
  type PerformanceCardType,
  type PerformanceDetailData,
  type PerformanceDocument,
  type PerformanceDrilldownItem,
  type PerformanceJobType,
  type PerformanceOptionStat,
  type PerformanceOptionStatsData,
  type PerformancePeriod,
  type PerformancePersonRole,
  type PerformanceSlaRole,
  type PerformanceTableMetric
} from "@/lib/api/performance-v3";
import { KpiDetailSections } from "./kpi-detail-sections";
import { KpiTimeline } from "./kpi-timeline";
import { formatNumberKpi, formatRupiahKpi } from "./kpi-formatters";
import { cn } from "@/lib/utils";

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: PerformanceCardType | null;
  kpiTitle: string;
  actorRole: string;
  actorName: string;
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
const statLabel = (stat: PerformanceOptionStat | undefined, kpiType: PerformanceCardType | null) => {
  if (stat?.value === null || stat?.value === undefined) return "-";
  if (kpiType === "cost_m2" || kpiType === "kerja_tambah" || kpiType === "kerja_kurang" || kpiType === "denda") {
    return formatRupiahKpi(stat.value);
  }
  return formatNumberKpi(stat.value, " hari");
};
const mergeStats = (items: PerformanceOptionStat[]): PerformanceOptionStat | undefined => {
  const validItems = items.filter((item) => item.value !== null && item.value !== undefined && item.count > 0);
  const count = items.reduce((sum, item) => sum + item.count, 0);
  if (!items.length) return undefined;
  const weight = validItems.reduce((sum, item) => sum + item.count, 0);
  const value = weight > 0 ? validItems.reduce((sum, item) => sum + (item.value ?? 0) * item.count, 0) / weight : null;
  return { id: "all", label: "Semua", value, count, incomplete_count: items.reduce((sum, item) => sum + (item.incomplete_count ?? 0), 0) };
};
const isAllValue = (value?: string | null) => !value || value.toUpperCase() === "ALL" || value.toUpperCase() === "SEMUA" || value.toUpperCase() === "SEMUA CABANG";

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiType,
  kpiTitle,
  actorRole,
  actorName,
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
  const [optionStats, setOptionStats] = useState<PerformanceOptionStatsData>({ roles: [], people: [], documents: [] });
  const [optionStatsLoading, setOptionStatsLoading] = useState(false);

  const normalizedActor = actorRole.toUpperCase();
  const isSupportUser = normalizedActor.includes("SUPPORT") || normalizedActor.includes("PENGAWAS");
  const isCoordinatorUser = normalizedActor.includes("KOORDINATOR") || normalizedActor.includes("COORD");
  const supportPersonName = !isAllValue(supportFilter) ? supportFilter : actorName;
  const coordinatorPersonName = !isAllValue(coordinatorFilter) ? coordinatorFilter : actorName;

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
      setSelectedName(!isAllValue(supportFilter) ? supportFilter : null);
      setStep("list_ulok");
      return;
    }

    if (isSupportUser) {
      setSelectedRole("support");
      setSelectedName(supportPersonName || null);
      if (kpiType === "sla_approval") setSelectedDoc("ktk");
      setStep("list_ulok");
      return;
    }

    if (isCoordinatorUser) {
      if (kpiType === "sla_approval") {
        setSelectedRole("coordinator");
        setSelectedName(coordinatorPersonName || null);
        setStep("select_doc");
        return;
      }
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
  }, [actorName, actorCabang, actorRole, coordinatorPersonName, isCoordinatorUser, isOpen, isSupportUser, kpiType, supportFilter, supportMetric, supportPersonName]);

  const allowedRoles = useMemo(() => {
    if (!kpiType) return [];
    if (isSupportUser) return roleOptions.filter((role) => role.id === "support");
    if (isCoordinatorUser) return kpiType === "sla_approval"
      ? roleOptions.filter((role) => role.id === "coordinator")
      : roleOptions.filter((role) => role.id === "support");
    if (kpiType === "sla_approval") return roleOptions.filter((role) => role.id !== "support");
    if (kpiType === "ketepatan_st" || kpiType === "sla_ktk") return roleOptions.filter((role) => role.id === "support");
    return roleOptions.filter((role) => role.id === "coordinator" || role.id === "support");
  }, [isCoordinatorUser, isSupportUser, kpiType]);


  const statById = useCallback((items: PerformanceOptionStat[], id?: string | null) => items.find((item) => item.id === id || item.label === id), []);
  const allPeopleStat = useMemo(() => mergeStats(optionStats.people), [optionStats.people]);

  const renderOptionStat = (stat?: PerformanceOptionStat) => {
    if (kpiType === "cost_m2") {
      return (
        <div className="mt-4 flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between rounded-lg bg-red-50/50 px-3 py-2 ring-1 ring-red-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">Terbangun</span>
              <span className="text-xs font-bold text-slate-800">{optionStatsLoading ? "..." : formatRupiahKpi(stat?.value)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Bangunan</span>
              <span className="text-xs font-bold text-slate-700">{optionStatsLoading ? "..." : formatRupiahKpi(stat?.bangunan)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Area Terbuka</span>
              <span className="text-xs font-bold text-slate-700">{optionStatsLoading ? "..." : formatRupiahKpi(stat?.area_terbuka)}</span>
            </div>
          </div>
          <div className="flex justify-center mt-1">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
              {optionStatsLoading ? "..." : `${stat?.count ?? 0} data`}
            </span>
          </div>
        </div>
      );
    }
    return (
      <span className="mt-2 flex w-full flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-800">Avg {optionStatsLoading ? "..." : statLabel(stat, kpiType)}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-slate-500 ring-1 ring-slate-200">{optionStatsLoading ? "..." : `${stat?.count ?? 0} data`}</span>
      </span>
    );
  };

  useEffect(() => {
    if (!isOpen || !kpiType) return;
    let ignore = false;
    async function loadOptionStats() {
      setOptionStatsLoading(true);
      try {
        const res = await fetchPerformanceOptionStats({
          actor_role: actorRole || "USER",
          actor_cabang: actorCabang,
          cabang: cabangFilter,
          coordinator: coordinatorFilter,
          support: supportFilter,
          job_type: jobType,
          period,
          search,
          card_type: kpiType as PerformanceCardType,
          selected_role: selectedRole ?? undefined,
          selected_name: selectedName ?? undefined
        });
        if (!ignore) setOptionStats(res.data || { roles: [], people: [], documents: [] });
      } catch {
        if (!ignore) setOptionStats({ roles: [], people: [], documents: [] });
      } finally {
        if (!ignore) setOptionStatsLoading(false);
      }
    }
    loadOptionStats();
    return () => { ignore = true; };
  }, [actorCabang, actorRole, cabangFilter, coordinatorFilter, jobType, isOpen, kpiType, period, search, selectedName, selectedRole, supportFilter]);
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
        card_type: kpiType as PerformanceCardType,
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
        card_type: kpiType as PerformanceCardType,
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
              {renderOptionStat(statById(optionStats.roles, role.id))}
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
                <span className="min-w-0 flex-1">
                  <span className="block font-bold tracking-tight text-slate-800">{doc.label}</span>
                  {renderOptionStat(statById(optionStats.documents, doc.id))}
                </span>
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
            <span className="min-w-0 flex-1 text-left">
              <span className="block">Semua Personil</span>
              {renderOptionStat(allPeopleStat)}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
          </button>
          {names.map((name) => (
            <button key={name} type="button" onClick={() => { setSelectedName(name); setStep(kpiType === "sla_approval" ? "select_doc" : "list_ulok"); }} className="group flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-5 py-4 text-sm font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate">{name}</span>
                {renderOptionStat(statById(optionStats.people, name))}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderList = () => {
    const isCostM2 = kpiType === "cost_m2";
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50">
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ULOK</th>
                    <th className="px-4 py-3">Cabang</th>
                    {isCostM2 ? (
                      <>
                        <th className="px-4 py-3 text-right">Terbangun</th>
                        <th className="px-4 py-3 text-right">Bangunan</th>
                        <th className="px-4 py-3 text-right">Area Terbuka</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-right">Nilai</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr 
                      key={row.nomor_ulok} 
                      onClick={() => openDetail(row)}
                      className="group cursor-pointer hover:bg-red-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-950 underline-offset-4 group-hover:text-red-700 group-hover:underline">{row.nomor_ulok}</span>
                          <span className="block truncate text-xs font-semibold text-slate-500">{row.nama_toko ?? "-"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">{row.cabang ?? "-"}</td>
                      {isCostM2 ? (
                        <>
                          <td className="px-4 py-3 text-right font-bold text-slate-800"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{row.value !== null && row.value !== undefined ? formatRupiahKpi(row.value) : "-"}</span></td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">{row.bangunan !== null && row.bangunan !== undefined ? formatRupiahKpi(row.bangunan) : "-"}</td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">{row.area_terbuka !== null && row.area_terbuka !== undefined ? formatRupiahKpi(row.area_terbuka) : "-"}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-bold text-slate-800"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{row.value_label}</span></td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500">{row.secondary_label}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={isCostM2 ? 5 : 4} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada ULOK untuk pilihan ini.</td></tr>}
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
  };

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
                      <KpiTimeline nomor_ulok={detail.nomor_ulok} />
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
