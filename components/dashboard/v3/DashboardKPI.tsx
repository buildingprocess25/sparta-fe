import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDashboardKpiPerformance, type KpiCardType, type KpiPerformanceData } from "@/lib/api/kpi-performance";
import { KPIFilters } from "./KPIFilters";
import { KpiDrilldownModal } from "./KpiDrilldownModal";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  TimerReset,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />
);

const emptyMeta = { valid_count: 0, incomplete_count: 0 };

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
};

const formatDays = (val: number) => Number(val || 0).toFixed(1);

type MetricCardConfig = {
  id: KpiCardType;
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  tone: string;
  helper: string;
};

export function DashboardKPI({
  userInfo
}: {
  userInfo: { name: string; roles: string[]; cabang: string; namaPt: string }
}) {
  const [data, setData] = useState<KpiPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCabang, setSelectedCabang] = useState("ALL");
  const [selectedCoordinator, setSelectedCoordinator] = useState("ALL");
  const [selectedSupport, setSelectedSupport] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<KpiCardType | "">("");
  const [modalTitle, setModalTitle] = useState("");

  const fetchData = useCallback(async () => {
    if (!userInfo) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardKpiPerformance({
        actor_role: userInfo.roles[0] || "",
        actor_cabang: userInfo.cabang || "",
        cabang: selectedCabang,
        coordinator: selectedCoordinator,
        support: selectedSupport
      });
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data KPI ULOK gabungan.");
    } finally {
      setLoading(false);
    }
  }, [selectedCabang, selectedCoordinator, selectedSupport, userInfo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDrilldown = (type: KpiCardType, title: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  const metricMeta = useCallback((type: KpiCardType) => data?.metrics?.[type] ?? emptyMeta, [data]);

  const cards = useMemo<MetricCardConfig[]>(() => [
    {
      id: "cost_m2",
      title: "Avg Cost/m2",
      value: formatRupiah(data?.avg_cost_m2 || 0),
      unit: "/ m2",
      icon: <Banknote className="h-5 w-5 text-emerald-700" aria-hidden="true" />,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      helper: "RAB approved dibagi luas bangunan per ULOK"
    },
    {
      id: "jhk",
      title: "Avg JHK",
      value: formatDays(data?.avg_jhk || 0),
      unit: "hari",
      icon: <Clock className="h-5 w-5 text-blue-700" aria-hidden="true" />,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      helper: "Durasi SPK valid per ULOK"
    },
    {
      id: "denda",
      title: "Avg Denda",
      value: formatRupiah(data?.avg_denda || 0),
      unit: "",
      icon: <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />,
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      helper: "Rata-rata nominal denda final"
    },
    {
      id: "keterlambatan",
      title: "Avg Keterlambatan",
      value: formatDays(data?.avg_keterlambatan_all || 0),
      unit: "hari",
      icon: <TimerReset className="h-5 w-5 text-rose-700" aria-hidden="true" />,
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      helper: "Hari terlambat semua kontraktor"
    },
    {
      id: "sla_coord",
      title: "SLA Coord",
      value: formatDays(data?.avg_sla_coord || 0),
      unit: "hari",
      icon: <UserCheck className="h-5 w-5 text-sky-700" aria-hidden="true" />,
      tone: "border-sky-200 bg-sky-50 text-sky-700",
      helper: "Approval tertahan di koordinator"
    },
    {
      id: "sla_bm",
      title: "SLA B&M Manager",
      value: formatDays(data?.avg_sla_bm || 0),
      unit: "hari",
      icon: <Users className="h-5 w-5 text-indigo-700" aria-hidden="true" />,
      tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
      helper: "Approval tertahan di B&M Manager"
    },
    {
      id: "sla_branch_manager",
      title: "SLA Branch Manager",
      value: formatDays(data?.avg_sla_branch_manager || 0),
      unit: "hari",
      icon: <Building2 className="h-5 w-5 text-cyan-700" aria-hidden="true" />,
      tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
      helper: "Approval tertahan di Branch Manager"
    },
    {
      id: "ketepatan_st",
      title: "Ketepatan Serah Terima",
      value: formatDays(data?.avg_ketepatan_st || 0),
      unit: "hari",
      icon: <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />,
      tone: "border-teal-200 bg-teal-50 text-teal-700",
      helper: "Tanggal ST minus akhir SPK+tambah+1"
    },
    {
      id: "sla_ktk",
      title: "SLA KTK",
      value: formatDays(data?.avg_sla_ktk || 0),
      unit: "hari",
      icon: <FileText className="h-5 w-5 text-violet-700" aria-hidden="true" />,
      tone: "border-violet-200 bg-violet-50 text-violet-700",
      helper: "Tanggal final KTK dikurang tanggal ST"
    },
    {
      id: "kerja_tambah",
      title: "Avg Kerja Tambah",
      value: formatRupiah(data?.avg_kerja_tambah || 0),
      unit: "",
      icon: <TrendingUp className="h-5 w-5 text-emerald-700" aria-hidden="true" />,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      helper: "Selisih final opname di atas RAB"
    },
    {
      id: "kerja_kurang",
      title: "Avg Kerja Kurang",
      value: formatRupiah(data?.avg_kerja_kurang || 0),
      unit: "",
      icon: <TrendingDown className="h-5 w-5 text-orange-700" aria-hidden="true" />,
      tone: "border-orange-200 bg-orange-50 text-orange-700",
      helper: "Selisih final opname di bawah RAB"
    }
  ], [data]);

  const renderMeta = (type: KpiCardType) => {
    const meta = metricMeta(type);
    return (
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">ULOK Gabungan</span>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{meta.valid_count} valid</span>
        {meta.incomplete_count > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{meta.incomplete_count} kurang data</span>
        )}
      </div>
    );
  };

  const renderMetricCard = (card: MetricCardConfig) => (
    <button
      key={card.id}
      type="button"
      onClick={() => openDrilldown(card.id, card.title)}
      className="group relative min-h-[174px] overflow-hidden rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-700">{card.title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{card.helper}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.tone)}>
          {card.icon}
        </div>
      </div>
      <div className="relative z-10 mt-4 flex min-w-0 items-baseline gap-2">
        {loading ? <Skeleton className="h-9 w-32" /> : (
          <>
            <h3 className="truncate text-2xl font-extrabold tracking-tight text-slate-950 xl:text-3xl">{card.value}</h3>
            {card.unit && <span className="shrink-0 text-sm font-semibold text-slate-500">{card.unit}</span>}
          </>
        )}
      </div>
      {renderMeta(card.id)}
      <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex h-full flex-col space-y-6 overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Performance KPI SAT</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Rapor performa proyek toko berbasis ULOK gabungan, dengan drilldown sampai sumber SIPIL/ME.
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
          {data?.total_ulok ?? 0} ULOK dalam scope
        </div>
      </div>

      <KPIFilters
        userInfo={userInfo}
        selectedCabang={selectedCabang}
        selectedCoordinator={selectedCoordinator}
        selectedSupport={selectedSupport}
        onCabangChange={setSelectedCabang}
        onCoordinatorChange={setSelectedCoordinator}
        onSupportChange={setSelectedSupport}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm" aria-live="polite">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map(renderMetricCard)}
      </div>

      <KpiDrilldownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        kpiType={modalType}
        kpiTitle={modalTitle}
        actorRole={userInfo.roles[0] || ""}
        actorCabang={userInfo.cabang || ""}
        cabangFilter={selectedCabang}
        coordinatorFilter={selectedCoordinator}
        supportFilter={selectedSupport}
      />
    </div>
  );
}
