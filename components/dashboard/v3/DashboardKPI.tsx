import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPerformanceSummary,
  type PerformanceCardType,
  type PerformanceFiltersData,
  type PerformanceJobType,
  type PerformancePeriod,
  type PerformanceSummaryData,
  type PerformanceTableMetric
} from "@/lib/api/performance-v3";
import { KPIFilters } from "./KPIFilters";
import { KpiDrilldownModal } from "./KpiDrilldownModal";
import { KpiSupportTable } from "./KpiSupportTable";
import { formatNumberKpi, formatRupiahKpi, formatSignedDays } from "./kpi-formatters";
import { AlertTriangle, Banknote, CheckCircle2, Clock3, FileText, Gauge, Loader2, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;

type ModalState = {
  type: PerformanceCardType;
  title: string;
  support?: string;
  supportMetric?: PerformanceTableMetric;
} | null;

type MetricCardConfig = {
  id: PerformanceCardType;
  title: string;
  kicker: string;
  value: string;
  unit?: string;
  helper: string;
  count: number;
  icon: React.ElementType;
  tone: string;
  subvalues?: Array<{ label: string; value: string; accent: string }>;
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
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>("all");
  const [selectedJobType, setSelectedJobType] = useState<PerformanceJobType>("ALL");
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [filterOptions, setFilterOptions] = useState<PerformanceFiltersData>({ cabangs: [], coordinators: [], supports: [] });

  const role = userInfo.roles[0] || "USER";

  const fetchData = useCallback(async () => {
    if (!userInfo) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPerformanceSummary({
        actor_role: role,
        actor_cabang: userInfo.cabang || "",
        cabang: selectedCabang,
        coordinator: selectedCoordinator,
        support: selectedSupport,
        job_type: selectedJobType,
        period: selectedPeriod,
        search
      });
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Performance KPI SAT.");
    } finally {
      setLoading(false);
    }
  }, [role, search, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, userInfo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCard = (type: PerformanceCardType, title: string) => setModalState({ type, title });

  const cards = useMemo<MetricCardConfig[]>(() => {
    const summary = data?.cards;
    return [
      {
        id: "sla_approval",
        title: "SLA Approval SAT",
        kicker: "Approval bertingkat",
        value: formatNumberKpi(summary?.sla_approval.value, " hari"),
        helper: "Rata-rata approval internal SAT per role dan dokumen",
        count: summary?.sla_approval.count ?? 0,
        icon: UserCheck,
        tone: "text-indigo-700 bg-indigo-50 border-indigo-200"
      },
      {
        id: "cost_m2",
        title: "Rata-rata Cost / m2",
        kicker: "Analitik biaya",
        value: formatRupiahKpi(summary?.cost_m2.terbangun),
        helper: "SPK final dibagi luas RAB approved terakhir",
        count: summary?.cost_m2.count ?? 0,
        icon: Banknote,
        tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
        subvalues: [
          { label: "Terbangun", value: formatRupiahKpi(summary?.cost_m2.terbangun), accent: "bg-emerald-500" },
          { label: "Bangunan", value: formatRupiahKpi(summary?.cost_m2.bangunan), accent: "bg-blue-500" },
          { label: "Area Terbuka", value: formatRupiahKpi(summary?.cost_m2.area_terbuka), accent: "bg-fuchsia-500" }
        ]
      },
      {
        id: "jhk",
        title: "Avg JHK",
        kicker: "Durasi pekerjaan",
        value: formatNumberKpi(summary?.jhk.value, " hari"),
        helper: "Durasi dari mulai SPK sampai serah terima, termasuk tambah SPK",
        count: summary?.jhk.count ?? 0,
        icon: Clock3,
        tone: "text-sky-700 bg-sky-50 border-sky-200"
      },
      {
        id: "denda",
        title: "Avg Denda",
        kicker: "Hanya yang terkena denda",
        value: formatRupiahKpi(summary?.denda.value),
        helper: "Nilai representatif terkecil positif antar lingkup",
        count: summary?.denda.count ?? 0,
        icon: AlertTriangle,
        tone: "text-amber-700 bg-amber-50 border-amber-200"
      },
      {
        id: "kerja_tambah",
        title: "Avg Kerja Tambah",
        kicker: "Final KTK vs SPK",
        value: formatRupiahKpi(summary?.kerja_tambah.value),
        helper: "Selisih final opname di atas nilai SPK",
        count: summary?.kerja_tambah.count ?? 0,
        icon: TrendingUp,
        tone: "text-teal-700 bg-teal-50 border-teal-200"
      },
      {
        id: "kerja_kurang",
        title: "Avg Kerja Kurang",
        kicker: "Final KTK vs SPK",
        value: formatRupiahKpi(summary?.kerja_kurang.value),
        helper: "Selisih final opname di bawah nilai SPK",
        count: summary?.kerja_kurang.count ?? 0,
        icon: TrendingDown,
        tone: "text-orange-700 bg-orange-50 border-orange-200"
      },
      {
        id: "ketepatan_st",
        title: "Ketepatan Serah Terima",
        kicker: "Minus cepat, plus terlambat",
        value: formatSignedDays(summary?.ketepatan_st.value).split(" / ")[0],
        helper: "Serah terima minus akhir SPK setelah tambah + 1 hari",
        count: summary?.ketepatan_st.count ?? 0,
        icon: CheckCircle2,
        tone: "text-cyan-700 bg-cyan-50 border-cyan-200"
      },
      {
        id: "sla_ktk",
        title: "SLA Kerja Tambah Kurang",
        kicker: "Finalisasi KTK",
        value: formatNumberKpi(summary?.sla_ktk.value, " hari"),
        helper: "Direktur kontraktor approve final KTK dikurang tanggal ST",
        count: summary?.sla_ktk.count ?? 0,
        icon: FileText,
        tone: "text-violet-700 bg-violet-50 border-violet-200"
      }
    ];
  }, [data]);

  const renderCard = (card: MetricCardConfig) => {
    const Icon = card.icon;
    return (
      <button
        key={card.id}
        type="button"
        onClick={() => openCard(card.id, card.title)}
        className="group min-h-[172px] rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-normal text-slate-400">{card.kicker}</p>
            <h3 className="mt-1 text-base font-black text-slate-950">{card.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{card.helper}</p>
          </div>
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.tone)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        {card.subvalues ? (
          <div className="mt-5 space-y-3">
            {card.subvalues.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-normal text-slate-400">
                  <span>{item.label}</span>
                  {loading ? <Skeleton className="h-4 w-24" /> : <span className="text-sm normal-case text-slate-900">{item.value}</span>}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full w-1/3 rounded-full", item.accent)} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            {loading ? <Skeleton className="h-9 w-36" /> : <p className="truncate text-3xl font-black text-slate-950">{card.value}</p>}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{card.count} data valid</span>
          <span className="text-red-600 opacity-0 transition-opacity group-hover:opacity-100">Drilldown</span>
        </div>
      </button>
    );
  };

  return (
    <main className="flex h-full flex-col gap-5 overflow-y-auto bg-slate-50 p-5 custom-scrollbar lg:p-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-red-600">
              <Gauge className="h-4 w-4" aria-hidden="true" /> Dashboard Performance
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950">Performance KPI SAT</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">
              Ringkasan KPI ULOK gabungan berbasis data produksi: approval SAT, biaya per meter, JHK, denda, KTK, dan serah terima.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">ULOK</p><p className="text-lg font-black text-slate-950">{data?.meta.total_ulok ?? 0}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">Catatan</p><p className="text-lg font-black text-amber-700">{data?.meta.incomplete_ulok ?? 0}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">Periode</p><p className="text-lg font-black text-slate-950">{selectedPeriod.toUpperCase()}</p></div>
          </div>
        </div>
      </header>

      <KPIFilters
        userInfo={userInfo}
        selectedCabang={selectedCabang}
        selectedCoordinator={selectedCoordinator}
        selectedSupport={selectedSupport}
        selectedPeriod={selectedPeriod}
        selectedJobType={selectedJobType}
        search={search}
        onCabangChange={setSelectedCabang}
        onCoordinatorChange={setSelectedCoordinator}
        onSupportChange={setSelectedSupport}
        onPeriodChange={setSelectedPeriod}
        onJobTypeChange={setSelectedJobType}
        onSearchChange={setSearch}
        onFiltersLoaded={setFilterOptions}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" aria-live="polite">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" /> {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" />
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Kartu KPI Performance SAT">
          {cards.map(renderCard)}
        </section>
      )}

      <KpiSupportTable
        userInfo={userInfo}
        selectedCabang={selectedCabang}
        selectedCoordinator={selectedCoordinator}
        selectedSupport={selectedSupport}
        selectedPeriod={selectedPeriod}
        selectedJobType={selectedJobType}
        search={search}
        onMetricClick={(support, metric, label) => setModalState({ type: "sla_ktk", title: label, support, supportMetric: metric })}
      />

      <KpiDrilldownModal
        isOpen={Boolean(modalState)}
        onClose={() => setModalState(null)}
        kpiType={modalState?.type ?? null}
        kpiTitle={modalState?.title ?? ""}
        actorRole={role}
        actorCabang={userInfo.cabang || ""}
        cabangFilter={selectedCabang}
        coordinatorFilter={selectedCoordinator}
        supportFilter={modalState?.support ?? selectedSupport}
        period={selectedPeriod}
        jobType={selectedJobType}
        search={search}
        supportMetric={modalState?.supportMetric}
        availableCoordinators={filterOptions.coordinators}
        availableSupports={filterOptions.supports}
      />
    </main>
  );
}
