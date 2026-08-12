import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  availableSupports = []
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
    if (isSupportUser) {
      setSelectedRole("support");
      setSelectedName(actorRole);
      setStep(kpiType === "sla_approval" ? "select_doc" : "list_ulok");
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
    if (kpiType === "sla_approval") return roleOptions;
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
    if (step === "select_doc" || step === "select_name") setStep("select_role");
  };

  const renderRole = () => (
    <div className="p-6">
      <h3 className="text-lg font-black text-slate-900">Pilih role KPI</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {allowedRoles.map((role) => {
          const Icon = role.icon;
          return (
            <button key={role.id} type="button" onClick={() => { setSelectedRole(role.id); setStep(kpiType === "sla_approval" ? "select_doc" : "select_name"); }} className={cn("rounded-lg border p-4 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500", role.tone)}>
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="mt-3 block text-sm font-black">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDoc = () => {
    const docs = docOptions.filter((doc) => selectedRole && doc.roles.includes(selectedRole as PerformanceSlaRole));
    return (
      <div className="p-6">
        <h3 className="text-lg font-black text-slate-900">Pilih dokumen untuk {roleLabel(selectedRole)}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <button key={doc.id} type="button" onClick={() => { setSelectedDoc(doc.id); setStep("list_ulok"); }} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left font-black text-slate-800 transition-[border-color,box-shadow] hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <Icon className="h-5 w-5 text-red-600" aria-hidden="true" /> {doc.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderName = () => {
    const names = Array.from(new Set((selectedRole === "coordinator" ? availableCoordinators : availableSupports).filter(Boolean)));
    return (
      <div className="p-6">
        <h3 className="text-lg font-black text-slate-900">Pilih personil {roleLabel(selectedRole)}</h3>
        <div className="mt-4 grid max-h-[56vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" onClick={() => { setSelectedName(null); setStep("list_ulok"); }} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            Semua Personil <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {names.map((name) => (
            <button key={name} type="button" onClick={() => { setSelectedName(name); setStep("list_ulok"); }} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
              <span className="truncate">{name}</span><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-normal text-slate-500"><tr><th className="px-4 py-3">ULOK</th><th className="px-4 py-3">Cabang</th><th className="px-4 py-3">Nilai</th><th className="px-4 py-3">Status</th></tr></thead>
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
                          <span className="block font-black text-slate-950 underline-offset-4 group-hover:text-red-700 group-hover:underline">{row.nomor_ulok}</span>
                          <span className="block truncate text-xs font-semibold text-slate-500">{row.nama_toko ?? "-"}</span>
                        </span>
                        <span className="font-bold text-slate-700">{row.cabang ?? "-"}</span>
                        <span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-800">{row.value_label}</span></span>
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
      {meta && meta.totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600"><span>Page {meta.page} dari {meta.totalPages}</span><div className="flex gap-2"><button type="button" disabled={meta.page <= 1} onClick={() => loadRows(meta.page - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Prev</button><button type="button" disabled={meta.page >= meta.totalPages} onClick={() => loadRows(meta.page + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Next</button></div></div>}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex h-[86vh] max-h-[86vh] max-w-6xl flex-col overflow-hidden border-slate-200 bg-slate-50 p-0 shadow-2xl">
          <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              {step !== "select_role" && <button type="button" aria-label="Kembali" onClick={goBack} className="rounded-md bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>}
              <div><DialogTitle className="text-xl font-black text-slate-950">{kpiTitle}</DialogTitle><p className="mt-1 text-xs font-bold text-slate-500">{roleLabel(selectedRole)} {selectedDoc ? `- ${selectedDoc.toUpperCase()}` : ""}</p></div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {step === "select_role" && renderRole()}
            {step === "select_doc" && renderDoc()}
            {step === "select_name" && renderName()}
            {step === "list_ulok" && renderList()}
          </div>
        </DialogContent>
      </Dialog>

      {selectedUlok && (
        <div className="fixed inset-0 z-[100] isolate overflow-hidden">
          <button type="button" aria-label="Tutup detail KPI" className="absolute inset-0 z-0 bg-slate-950/30" onClick={() => setSelectedUlok(null)} />
          <aside className="absolute inset-y-0 right-0 z-10 flex h-dvh min-h-0 w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
            <header className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-normal text-red-600">Detail KPI {selectedUlok.nomor_ulok}</p><h3 className="mt-1 text-xl font-black text-slate-950">{selectedUlok.nama_toko ?? selectedUlok.nomor_ulok}</h3></div>
                <button type="button" aria-label="Tutup panel detail" onClick={() => setSelectedUlok(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><X className="h-5 w-5" aria-hidden="true" /></button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 custom-scrollbar">
              {detailLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div> : detail ? <><KpiDetailSections detail={detail} /><div className="mt-4"><KpiDocuments documents={detail.documents} /></div></> : <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Detail tidak bisa dimuat.</div>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
