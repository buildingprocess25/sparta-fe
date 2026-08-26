import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPerformanceSummary,
  type PerformanceCardType,
  type PerformanceFiltersData,
  type PerformanceJobType,
  type PerformancePeriod,
  type PerformanceSummaryData,
  type PerformanceTableMetric,
  type PerformanceTableRow,
  type PerformancePersonSearchResult,
  type PerformancePersonRole
} from "@/lib/api/performance-v3";
import { KPIFilters } from "./KPIFilters";
import { KpiDrilldownModal } from "./KpiDrilldownModal";
import { KpiSupportTable } from "./KpiSupportTable";
import { KpiSupportMetricModal } from "./KpiSupportMetricModal";
import { formatNumberKpi, formatRupiahKpi, formatSignedDays } from "./kpi-formatters";
import { AlertTriangle, Banknote, CheckCircle2, Clock3, FileText, Gauge, Loader2, TrendingDown, TrendingUp, UserCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;

type MetricCardConfig = {
  id: PerformanceCardType;
  title: string;
  kicker: string;
  value: string;
  sumValue?: string;
  unit?: string;
  helper: string;
  count: number;
  icon: React.ElementType;
  tone: string;
  span?: 1 | 2;
  rowSpan?: 1 | 2;
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
  const [personSearch, setPersonSearch] = useState("");
  const [selectedSupportRow, setSelectedSupportRow] = useState<PerformanceTableRow | null>(null);
  const [modalState, setModalState] = useState<{
    type: PerformanceCardType;
    title: string;
    support?: string;
    supportMetric?: PerformanceTableMetric;
    globalSearchQuery?: string;
    globalSearchResults?: PerformancePersonSearchResult[];
  } | null>(null);
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
        period: selectedPeriod      });
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Performance Internal SAT.");
    } finally {
      setLoading(false);
    }
  }, [role, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, userInfo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCard = (type: PerformanceCardType, title: string) => setModalState({ type, title });

  const handleSearchSubmit = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    const results: PerformancePersonSearchResult[] = [];
    const seen = new Set<string>();
    const q = cleanQuery.toLowerCase();

    const addResult = (name: string, roleId: PerformancePersonRole, roleLabel: string) => {
      const normalizedName = name.trim();
      if (!normalizedName || !normalizedName.toLowerCase().includes(q)) return;
      const key = `${roleId}:${normalizedName.toUpperCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({ name: normalizedName, role: roleLabel, roleId });
    };

    filterOptions.approvalActors?.branch_manager?.forEach((name) => addResult(name, "branch_manager", "Branch Manager"));
    filterOptions.approvalActors?.bm_manager?.forEach((name) => addResult(name, "bm_manager", "Branch Building & Maintenance Manager"));
    filterOptions.coordinators?.forEach((name) => addResult(name, "coordinator", "Branch Building Coordinator"));
    filterOptions.supports?.forEach((name) => addResult(name, "support", "Branch Building Support"));

    setPersonSearch("");
    setModalState({
      type: "all",
      title: "Hasil Pencarian Personil",
      globalSearchQuery: cleanQuery,
      globalSearchResults: results.sort((a, b) => a.name.localeCompare(b.name))
    });
  };

  const cards = useMemo<MetricCardConfig[]>(() => {
    const summary = data?.cards;
    return [
      {
        id: "cost_m2",
        title: "Rata-rata Cost / m2",
        kicker: "Analitik Biaya Pembangunan",
        value: formatRupiahKpi(summary?.cost_m2.terbangun),
        helper: "SPK final dibagi luas RAB approved terakhir. Indikator efisiensi anggaran per proyek.",
        count: summary?.cost_m2.count ?? 0,
        icon: Banknote,
        tone: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20",
        span: 2,
        rowSpan: 2,
        subvalues: [
          { label: "Terbangun", value: formatRupiahKpi(summary?.cost_m2.terbangun), accent: "bg-emerald-500" },
          { label: "Bangunan", value: formatRupiahKpi(summary?.cost_m2.bangunan), accent: "bg-sky-500" },
          { label: "Area Terbuka", value: formatRupiahKpi(summary?.cost_m2.area_terbuka), accent: "bg-fuchsia-500" }
        ]
      },
      {
        id: "sla_approval",
        title: "SLA Approval SAT",
        kicker: "Approval Bertingkat",
        value: formatNumberKpi(summary?.sla_approval.value, " hari"),
        helper: "Rata-rata kecepatan approval internal SAT per role dan dokumen.",
        count: summary?.sla_approval.count ?? 0,
        icon: UserCheck,
        tone: "text-indigo-600 bg-indigo-500/10 ring-indigo-500/20"
      },
      {
        id: "jhk",
        title: "Avg JHK",
        kicker: "Durasi Pekerjaan",
        value: formatNumberKpi(summary?.jhk.value, " hari"),
        helper: "Actual memakai ST aktual; Target memakai ST ideal saat belum ST.",
        count: summary?.jhk.count ?? 0,
        icon: Clock3,
        tone: "text-sky-600 bg-sky-500/10 ring-sky-500/20",
        subvalues: [
          { label: `Actual (${summary?.jhk.count ?? 0})`, value: formatNumberKpi(summary?.jhk.value, " hari"), accent: "bg-sky-500" },
          { label: `Target (${summary?.jhk.target_count ?? 0})`, value: formatNumberKpi(summary?.jhk.target_value, " hari"), accent: "bg-amber-500" }
        ]
      },
      {
        id: "ketepatan_st",
        title: "Ketepatan Serah Terima",
        kicker: "Minus cepat, plus terlambat",
        value: formatSignedDays(summary?.ketepatan_st.value).split(" / ")[0],
        helper: "Selisih hari antara serah terima aktual dengan target akhir SPK.",
        count: summary?.ketepatan_st.count ?? 0,
        icon: CheckCircle2,
        tone: "text-cyan-600 bg-cyan-500/10 ring-cyan-500/20"
      },
      {
        id: "denda",
        title: "Avg Denda",
        kicker: "",
        value: formatRupiahKpi(summary?.denda.value),
        sumValue: formatRupiahKpi(summary?.denda.sum_value),
        helper: "Nilai representatif denda terkecil positif antar lingkup pekerjaan.",
        count: summary?.denda.count ?? 0,
        icon: AlertTriangle,
        tone: "text-amber-600 bg-amber-500/10 ring-amber-500/20"
      },
      {
        id: "kerja_tambah",
        title: "Avg Kerja Tambah",
        kicker: "",
        value: formatRupiahKpi(summary?.kerja_tambah.value),
        sumValue: formatRupiahKpi(summary?.kerja_tambah.sum_value),
        helper: "Selisih final opname di atas nilai awal SPK.",
        count: summary?.kerja_tambah.count ?? 0,
        icon: TrendingUp,
        tone: "text-teal-600 bg-teal-500/10 ring-teal-500/20"
      },
      {
        id: "kerja_kurang",
        title: "Avg Kerja Kurang",
        kicker: "",
        value: formatRupiahKpi(summary?.kerja_kurang.value),
        sumValue: formatRupiahKpi(summary?.kerja_kurang.sum_value),
        helper: "Selisih final opname di bawah nilai awal SPK.",
        count: summary?.kerja_kurang.count ?? 0,
        icon: TrendingDown,
        tone: "text-orange-600 bg-orange-500/10 ring-orange-500/20"
      },
      {
        id: "sla_ktk",
        title: "SLA Kerja Tambah Kurang",
        kicker: "Finalisasi KTK",
        value: formatNumberKpi(summary?.sla_ktk.value, " hari"),
        helper: "Waktu proses finalisasi KTK hingga direktur kontraktor approve.",
        count: summary?.sla_ktk.count ?? 0,
        icon: FileText,
        tone: "text-violet-600 bg-violet-500/10 ring-violet-500/20",
        span: 2
      }
    ];
  }, [data]);

  const renderCard = (card?: MetricCardConfig) => {
    if (!card) return null;
    const Icon = card.icon;


    // Inner content rendering based on card ID to break uniformity
    const renderContent = () => {
      switch (card.id) {
        case "cost_m2":
          return (
            <div className="flex h-full w-full flex-col justify-between">
               <div className="flex items-start justify-between">
                 <div>
                   <h3 className="text-lg font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-red-600">{card.title}</h3>
                   <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-500">{card.helper}</p>
                 </div>
                 <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur-md transition-transform duration-300 group-hover:scale-110", card.tone)}>
                   <Icon className="h-5 w-5" aria-hidden="true" />
                 </div>
               </div>

               <div className="mt-6 flex-1 w-full rounded-2xl bg-white/50 p-4 ring-1 ring-slate-100/60">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                   {card.subvalues?.map((item) => (
                     <div key={item.label} className="flex flex-col">
                       <div className="mb-1.5 flex items-center gap-1.5">
                         <span className={cn("h-1.5 w-1.5 rounded-full", item.accent)} />
                         <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</span>
                       </div>
                       {loading ? <Skeleton className="h-6 w-24" /> : <span className="text-lg font-semibold tracking-tight text-slate-800">{item.value}</span>}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          );

        case "sla_approval":
        case "jhk":
          return (
            <div className="flex h-full w-full flex-col justify-between">
              <div className="flex items-start justify-between">
                 <div>
                   <h3 className="text-base font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-red-600">{card.title}</h3>
                 </div>
                 <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-md transition-transform duration-300 group-hover:scale-110", card.tone)}>
                   <Icon className="h-4 w-4" aria-hidden="true" />
                 </div>
               </div>
               <div className="mt-6 flex-1">
                 {loading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-bold tracking-tighter text-slate-800 drop-shadow-sm">{card.value}</p>}
                 {card.id === "jhk" && card.subvalues && !loading && (
                   <div className="mt-3 grid grid-cols-2 gap-2">
                     {card.subvalues.map((item) => (
                       <div key={item.label} className="rounded-xl bg-white/60 px-2.5 py-2 ring-1 ring-slate-100">
                         <div className="mb-1 flex items-center gap-1.5">
                           <span className={cn("h-1.5 w-1.5 rounded-full", item.accent)} />
                           <span className="truncate text-[9px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</span>
                         </div>
                         <span className="text-xs font-bold text-slate-700">{item.value}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          );

        case "ketepatan_st":
          return (
            <div className="flex h-full w-full flex-col justify-between">
              <div className="flex items-center gap-3">
                 <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-md", card.tone)}>
                   <Icon className="h-4 w-4" aria-hidden="true" />
                 </div>
                 <div>
                   <h3 className="text-sm font-semibold tracking-tight text-slate-800 transition-colors group-hover:text-red-600">{card.title}</h3>
                 </div>
              </div>
              <div className="mt-5 flex-1">
                 {loading ? <Skeleton className="h-8 w-24" /> : (
                   <span className={cn("inline-flex items-center rounded-xl px-3 py-1.5 text-lg font-semibold tracking-tight ring-1",
                     card.value.includes("+") || card.value.includes("lambat") ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                   )}>
                     {card.value}
                   </span>
                 )}
              </div>
            </div>
          );

        default:
          return (
            <div className="flex h-full w-full flex-col justify-between">
              <div>
                 <h3 className="text-base font-semibold tracking-tight text-slate-800">{card.title}</h3>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold tracking-tight text-slate-800">{card.value}</p>}
                  {card.sumValue && card.sumValue !== "-" && !loading && (
                    <p className="text-xs font-semibold text-slate-500">Sum {card.sumValue}</p>
                  )}
                </div>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-md transition-transform duration-300 group-hover:-rotate-6", card.tone)}>
                   <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <button
        key={card.id}
        type="button"
        onClick={() => openCard(card.id, card.title)}
        className={cn(
          "group relative flex w-full flex-col justify-between overflow-hidden rounded-[24px] bg-white/40 p-5 lg:p-6 text-left shadow-[0_4px_20px_rgb(0,0,0,0.02)] ring-1 ring-slate-200/50 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/60 hover:shadow-[0_8px_30px_rgb(220,38,38,0.06)] hover:ring-red-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
        )}
      >
        {renderContent()}

        <div className="mt-5 flex w-full items-center justify-between border-t border-slate-200/40 pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {card.count} Data Valid
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
            Lihat Detail <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </button>
    );
  };

  return (
    <main className="relative flex h-full flex-col gap-8 overflow-y-auto bg-[#f8fafc] p-6 custom-scrollbar lg:p-10">
      {/* Abstract Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-red-400/10 blur-[100px]" />
        <div className="absolute right-[5%] top-[20%] h-[400px] w-[400px] rounded-full bg-indigo-400/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-600 shadow-sm ring-1 ring-slate-200/60">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" /> Live Dashboard
          </div>
          <h1 className="mt-4 text-4xl lg:text-5xl font-semibold tracking-tighter text-slate-900 drop-shadow-sm">Performance Internal SAT</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            Monitor dan evaluasi performance dari internal SAT. Menampilkan analitik biaya, durasi pekerjaan, denda, dan efisiensi serah terima proyek.
          </p>
        </div>

        <div className="hidden">
        </div>

      </header>

      {/* Filters */}
      <KPIFilters
        userInfo={userInfo}
        selectedCabang={selectedCabang}
        selectedCoordinator={selectedCoordinator}
        selectedSupport={selectedSupport}
        selectedPeriod={selectedPeriod}
        selectedJobType={selectedJobType}
        search={personSearch}
        onCabangChange={setSelectedCabang}
        onCoordinatorChange={setSelectedCoordinator}
        onSupportChange={setSelectedSupport}
        onPeriodChange={setSelectedPeriod}
        onJobTypeChange={setSelectedJobType}
        onSearchChange={setPersonSearch}
        onSearchSubmit={handleSearchSubmit}
        onFiltersLoaded={setFilterOptions}
      />

      {error && (
        <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-700 shadow-sm backdrop-blur-sm" aria-live="polite">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {/* Bento Grid Metrics */}
      <div className="relative z-10 w-full">
        {loading && !data ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" />
          </div>
        ) : (
          <section className="flex flex-col gap-5 xl:flex-row xl:items-start" aria-label="Kartu KPI Performance SAT">
            {/* Column 1 (50% on xl) */}
            <div className="flex w-full flex-col gap-5 xl:w-1/2">
              {renderCard(cards.find(c => c.id === "cost_m2"))}
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="w-full md:w-1/2">{renderCard(cards.find(c => c.id === "ketepatan_st"))}</div>
                <div className="w-full md:w-1/2">{renderCard(cards.find(c => c.id === "denda"))}</div>
              </div>
            </div>

            {/* Column 2 (25% on xl) */}
            <div className="flex w-full flex-col gap-5 xl:w-1/4">
              {renderCard(cards.find(c => c.id === "sla_approval"))}
              {renderCard(cards.find(c => c.id === "kerja_tambah"))}
              {renderCard(cards.find(c => c.id === "sla_ktk"))}
            </div>

            {/* Column 3 (25% on xl) */}
            <div className="flex w-full flex-col gap-5 xl:w-1/4">
              {renderCard(cards.find(c => c.id === "jhk"))}
              {renderCard(cards.find(c => c.id === "kerja_kurang"))}
            </div>
          </section>
        )}
      </div>

      {/* Support Table Section */}
      <div className="relative z-10 mt-2">
        <KpiSupportTable
          userInfo={userInfo}
          selectedCabang={selectedCabang}
          selectedCoordinator={selectedCoordinator}
          selectedSupport={selectedSupport}
          selectedPeriod={selectedPeriod}
          selectedJobType={selectedJobType}
          search=""
          onSupportClick={(row) => setSelectedSupportRow(row)}
        />
      </div>

      <KpiSupportMetricModal
        isOpen={Boolean(selectedSupportRow)}
        onClose={() => setSelectedSupportRow(null)}
        supportRow={selectedSupportRow}
        onMetricClick={(support, metric, label) => {
          setSelectedSupportRow(null);

          let cardType: PerformanceCardType = "sla_ktk";
          if (metric === "ketepatan_st") cardType = "ketepatan_st";

          setModalState({ type: cardType, title: label, support, supportMetric: metric });
        }}
      />

      <KpiDrilldownModal
        isOpen={Boolean(modalState)}
        onClose={() => setModalState(null)}
        kpiType={modalState?.type ?? null}
        kpiTitle={modalState?.title ?? ""}
        actorRole={role}
        actorName={userInfo.name || ""}
        actorCabang={userInfo.cabang || ""}
        cabangFilter={selectedCabang}
        coordinatorFilter={selectedCoordinator}
        supportFilter={modalState?.support ?? selectedSupport}
        period={selectedPeriod}
        jobType={selectedJobType}
        search=""
        supportMetric={modalState?.supportMetric}
        availableCoordinators={filterOptions.coordinators}
        availableSupports={filterOptions.supports}
        approvalActors={filterOptions.approvalActors}
        globalSearchResults={modalState?.globalSearchResults}
      />
    </main>
  );
}
