import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPerformanceSummary, type PerformanceSummaryData, type PerformanceCardType } from "@/lib/api/performance-v3";
import { KPIFilters } from "./KPIFilters";
import { KpiDrilldownModal } from "./KpiDrilldownModal";
import { KpiSupportTable } from "./KpiSupportTable";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />
);

const formatDays = (val: number) => Number(val || 0).toFixed(1);

type MetricCardConfig = {
  id: PerformanceCardType;
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
  const [data, setData] = useState<PerformanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCabang, setSelectedCabang] = useState("ALL");
  const [selectedCoordinator, setSelectedCoordinator] = useState("ALL");
  const [selectedSupport, setSelectedSupport] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PerformanceCardType | "">("");
  const [modalTitle, setModalTitle] = useState("");
  const [filterOptions, setFilterOptions] = useState<{coordinators: string[], supports: string[]}>({ coordinators: [], supports: [] });

  const fetchData = useCallback(async () => {
    if (!userInfo) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPerformanceSummary({
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

  const openDrilldown = (type: PerformanceCardType, title: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  const cards = useMemo<MetricCardConfig[]>(() => [
    {
      id: "sla",
      title: "SLA Approval SAT",
      value: formatDays((data?.avg_sla_coord || 0) + (data?.avg_sla_manager || 0) + (data?.avg_sla_bm || 0)),
      unit: "hari (total)",
      icon: <UserCheck className="h-5 w-5 text-indigo-700" aria-hidden="true" />,
      tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
      helper: "Total rata-rata SLA semua role"
    },
    {
      id: "cost_m2",
      title: "Avg Cost/m2",
      value: formatRupiah(data?.avg_cost_m2 || 0),
      unit: "/ m2",
      icon: <Banknote className="h-5 w-5 text-emerald-700" aria-hidden="true" />,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      helper: "RAB approved dibagi luas bangunan"
    },
    {
      id: "jhk",
      title: "Avg JHK",
      value: formatDays(data?.avg_jhk || 0),
      unit: "hari",
      icon: <Clock className="h-5 w-5 text-blue-700" aria-hidden="true" />,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      helper: "Durasi valid SPK"
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
      id: "kerja_tambah",
      title: "Avg Kerja Tambah",
      value: formatRupiah(data?.avg_kerja_tambah || 0),
      unit: "",
      icon: <TrendingUp className="h-5 w-5 text-teal-700" aria-hidden="true" />,
      tone: "border-teal-200 bg-teal-50 text-teal-700",
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
    },
    {
      id: "ketepatan_st",
      title: "Ketepatan Serah Terima",
      value: formatDays(data?.avg_ketepatan_st || 0),
      unit: "hari keterlambatan",
      icon: <CheckCircle2 className="h-5 w-5 text-cyan-700" aria-hidden="true" />,
      tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
      helper: "Tanggal ST minus (akhir SPK + 1)"
    },
    {
      id: "sla_ktk",
      title: "SLA Kerja Tambah Kurang",
      value: formatDays(data?.avg_sla_ktk || 0),
      unit: "hari",
      icon: <FileText className="h-5 w-5 text-violet-700" aria-hidden="true" />,
      tone: "border-violet-200 bg-violet-50 text-violet-700",
      helper: "Tanggal final KTK dikurang tanggal ST"
    }
  ], [data]);

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
      <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex h-full flex-col space-y-6 overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Performance KPI SAT</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Rapor performa proyek, click pada card untuk melihat detail drilldown.
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
        onFiltersLoaded={setFilterOptions}
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

      <KpiSupportTable
        userInfo={userInfo}
        selectedCabang={selectedCabang}
        selectedCoordinator={selectedCoordinator}
        selectedSupport={selectedSupport}
      />

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
        availableCoordinators={filterOptions.coordinators}
        availableSupports={filterOptions.supports}
      />
    </div>
  );
}
