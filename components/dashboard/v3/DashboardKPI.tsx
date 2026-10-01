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
import { AlertTriangle, Banknote, CheckCircle2, Clock3, FileText, Gauge, Loader2, TrendingDown, TrendingUp, UserCheck, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
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
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [selectedCabang, setSelectedCabang] = useState("ALL");
  const [selectedCoordinator, setSelectedCoordinator] = useState("ALL");
  const [selectedSupport, setSelectedSupport] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>("all");
  const [selectedJobType, setSelectedJobType] = useState<PerformanceJobType>("ALL");
  const [selectedTipeBangunan, setSelectedTipeBangunan] = useState<"ALL" | "RUKO" | "NON_RUKO">("ALL");
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
        tipe_bangunan: selectedTipeBangunan,
        period: selectedPeriod      });
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data Performance Internal SAT.");
    } finally {
      setLoading(false);
    }
  }, [role, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, selectedTipeBangunan, userInfo]);

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

  const getCardColors = (id: string) => {
    switch(id) {
      case 'jhk': return { bg: 'bg-white', border: 'border-indigo-200', shadow: 'shadow-[0_4px_20px_rgba(99,102,241,0.05)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]', text: 'text-indigo-900', iconBg: 'bg-indigo-50 text-indigo-600 ring-indigo-200', value: 'text-indigo-700', hoverBg: 'hover:bg-indigo-50/50' };
      case 'ketepatan_st': return { bg: 'bg-white', border: 'border-emerald-200', shadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.05)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.25)]', text: 'text-emerald-900', iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200', value: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50/50' };
      case 'sla_approval': return { bg: 'bg-white', border: 'border-amber-200', shadow: 'shadow-[0_4px_20px_rgba(245,158,11,0.05)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]', text: 'text-amber-900', iconBg: 'bg-amber-50 text-amber-600 ring-amber-200', value: 'text-amber-700', hoverBg: 'hover:bg-amber-50/50' };
      case 'sla_ktk': return { bg: 'bg-white', border: 'border-violet-200', shadow: 'shadow-[0_4px_20px_rgba(139,92,246,0.05)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)]', text: 'text-violet-900', iconBg: 'bg-violet-50 text-violet-600 ring-violet-200', value: 'text-violet-700', hoverBg: 'hover:bg-violet-50/50' };
      case 'kerja_tambah': return { bg: 'bg-white', border: 'border-blue-200', shadow: 'shadow-[0_4px_20px_rgba(59,130,246,0.05)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.25)]', text: 'text-blue-900', iconBg: 'bg-blue-50 text-blue-600 ring-blue-200', value: 'text-blue-700', hoverBg: 'hover:bg-blue-50/50' };
      case 'kerja_kurang': return { bg: 'bg-white', border: 'border-rose-200', shadow: 'shadow-[0_4px_20px_rgba(244,63,94,0.05)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.25)]', text: 'text-rose-900', iconBg: 'bg-rose-50 text-rose-600 ring-rose-200', value: 'text-rose-700', hoverBg: 'hover:bg-rose-50/50' };
      case 'denda': return { bg: 'bg-white', border: 'border-orange-200', shadow: 'shadow-[0_4px_20px_rgba(249,115,22,0.05)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.25)]', text: 'text-orange-900', iconBg: 'bg-orange-50 text-orange-600 ring-orange-200', value: 'text-orange-700', hoverBg: 'hover:bg-orange-50/50' };
      default: return { bg: 'bg-white', border: 'border-slate-200', shadow: 'shadow-sm hover:shadow-slate-500/20', text: 'text-slate-900', iconBg: 'bg-slate-50 text-slate-600 ring-slate-200', value: 'text-slate-700', hoverBg: 'hover:bg-slate-50/50' };
    }
  };

  const renderFloatingCard = (card?: MetricCardConfig, headerLabel?: string) => {
    if (!card) return null;
    const Icon = card.icon;
    const colors = getCardColors(card.id);

    return (
      <button
        key={card.id}
        onClick={() => openCard(card.id, card.title)}
        className={cn("group relative flex w-full flex-col border rounded-[24px] p-6 text-left transition-all duration-300 focus:outline-none overflow-hidden hover:-translate-y-1", colors.bg, colors.border, colors.shadow)}
      >
        <div className={cn("absolute -bottom-6 -right-6 opacity-[0.07] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500", colors.text)}>
           <Icon className="h-40 w-40" strokeWidth={1} />
        </div>

        <div className="relative z-10 w-full">
          {headerLabel && (
             <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
               {headerLabel}
             </div>
          )}
          
          <div className="flex items-start gap-3 mb-4">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1", colors.iconBg)}>
               <Icon className="h-4 w-4" />
            </div>
            <div>
               <h3 className={cn("text-xs font-bold", colors.text)}>{card.title}</h3>
               {card.kicker && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{card.kicker}</p>}
            </div>
          </div>

          <div className="mt-2 w-full">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-black tracking-tighter transition-colors", colors.value)}>{card.value}</span>
              {card.sumValue && <span className="text-[10px] font-bold text-slate-400">/ {card.sumValue}</span>}
            </div>
            
            {card.subvalues && !loading ? (
               <div className="mt-4 flex flex-wrap gap-4 pt-2">
                 {card.subvalues.map(v => (
                   <div key={v.label}>
                     <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{v.label}</div>
                     <div className={cn("text-xs font-semibold", colors.text)}>{v.value}</div>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="mt-4 text-[10px] font-medium text-slate-400 max-w-[200px] leading-relaxed line-clamp-2">{card.helper}</p>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderStackedList = () => {
     const metricIds = ["kerja_tambah", "kerja_kurang", "denda"];
     const stackedCards = metricIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as MetricCardConfig[];
     
     return (
       <div className="flex h-full w-full flex-col bg-white border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
             Project Cost Variations
          </div>
          <div className="flex flex-col gap-3 p-4 h-full">
             {stackedCards.map((card) => {
                const Icon = card.icon;
                const colors = getCardColors(card.id);
                
                return (
                  <button
                    key={card.id}
                    onClick={() => openCard(card.id, card.title)}
                    className={cn(
                      "group relative flex flex-1 items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left focus:outline-none hover:-translate-y-0.5",
                      colors.border,
                      colors.hoverBg
                    )}
                  >
                     <div className="flex flex-col">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors", colors.text)}>{card.title}</span>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={cn("text-xl font-bold tracking-tight", colors.value)}>{card.value}</span>
                          {card.sumValue && <span className="text-[10px] font-medium text-slate-400">/ {card.sumValue}</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 max-w-[220px] line-clamp-1">{card.helper}</span>
                     </div>
                     <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110 ring-1", colors.iconBg)}>
                        <Icon className="h-4 w-4" />
                     </div>
                  </button>
                )
             })}
          </div>
       </div>
     );
  };



  const renderHeroCard = () => {
    const card = cards.find(c => c.id === "cost_m2");
    if (!card) return null;
    return (
       <div className="relative overflow-hidden bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          {/* Subtle blueprint pattern simulation */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          {/* Left: Main Metric */}
          <div className="relative z-10 flex-1 w-full lg:w-auto">
             <div className="inline-flex items-center gap-2 rounded-full bg-[#E5484D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white mb-4 shadow-sm">
                Primary Metric
             </div>
             <h3 className="text-sm font-semibold text-slate-700 mb-1">{card.title}</h3>
             <div className="text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-3">{card.value}</div>
             <p className="text-xs font-medium text-slate-500 max-w-sm leading-relaxed mb-6">{card.helper}</p>
             <button 
               onClick={() => openCard(card.id, card.title)}
               className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
             >
                View Breakdown <ArrowRight className="h-3.5 w-3.5" />
             </button>
          </div>
          
          {/* Right: Fake Donut Chart & Distribution */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 lg:border-l border-slate-100 lg:pl-12 w-full lg:w-auto">
             
             {/* CSS Conic Gradient Donut */}
             <div className="relative h-32 w-32 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: 'conic-gradient(#10b981 0% 30%, #3b82f6 30% 80%, #cbd5e1 80% 100%)' }}>
                <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-white shadow-inner" />
             </div>

             <div className="flex flex-col gap-4 w-full">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">Cost Distribution</h4>
                {card.subvalues?.map((item, idx) => (
                   <div key={item.label} className="flex items-start gap-3">
                      <div className={cn("h-3 w-3 rounded-sm shadow-sm mt-0.5 shrink-0", idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-slate-300")} />
                      <div>
                         <span className="block text-[10px] font-medium text-slate-500">{item.label}</span>
                         <span className="block text-sm font-bold text-slate-800">{item.value}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Fixed Header & Filters Container */}
      <div className="flex-none bg-slate-50 border-b border-slate-200/60 shadow-sm z-50 px-6 pt-6 pb-4 lg:px-10 lg:pt-8 transition-all duration-500">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl w-full">
            
            <div className="flex items-center justify-between lg:justify-start lg:gap-4 w-full">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Dashboard
               </div>
               
               {/* Toggle Button */}
               <button 
                 onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm text-[10px] font-bold uppercase tracking-widest focus:outline-none"
               >
                 {isFiltersVisible ? (
                   <>Sembunyikan Filter <ChevronUp className="h-3.5 w-3.5" /></>
                 ) : (
                   <>Tampilkan Filter <ChevronDown className="h-3.5 w-3.5" /></>
                 )}
               </button>
            </div>
            
            <div className={cn("transition-all duration-500 origin-top", isFiltersVisible ? "max-h-[150px] opacity-100 mt-5 overflow-visible" : "max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none")}>
               <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Performance Internal SAT</h1>
               <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                 Monitor dan evaluasi performance dari internal SAT. Menampilkan analitik biaya, durasi pekerjaan, denda, dan efisiensi serah terima proyek.
               </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className={cn("transition-all duration-500 origin-top", isFiltersVisible ? "max-h-[800px] opacity-100 mt-6 overflow-visible" : "max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none")}>
          <KPIFilters
            userInfo={userInfo}
            selectedCabang={selectedCabang}
            selectedCoordinator={selectedCoordinator}
            selectedSupport={selectedSupport}
            selectedPeriod={selectedPeriod}
            selectedJobType={selectedJobType}
            selectedTipeBangunan={selectedTipeBangunan}
            search={personSearch}
            onCabangChange={setSelectedCabang}
            onCoordinatorChange={setSelectedCoordinator}
            onSupportChange={setSelectedSupport}
            onPeriodChange={setSelectedPeriod}
            onJobTypeChange={setSelectedJobType}
            onTipeBangunanChange={setSelectedTipeBangunan}
            onSearchChange={setPersonSearch}
            onSearchSubmit={handleSearchSubmit}
            onFiltersLoaded={setFilterOptions}
          />
        </div>
      </div>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar flex flex-col gap-8">
        
        {error && (
          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-700 shadow-sm backdrop-blur-sm" aria-live="polite">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Floating Cards Canvas matching Reference Image */}
      <div className="relative z-10 w-full mt-4">
        {loading && !data ? (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex flex-col gap-6" aria-label="Kartu KPI Performance SAT">
            
            {/* ROW 1: Hero */}
            {renderHeroCard()}

            {/* ROW 2: 3 Columns Grid (with Colored Tints) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* Col 1: Time Performance */}
               <div className="flex flex-col gap-6">
                  {renderFloatingCard(cards.find(c => c.id === "jhk"), "Time Performance")}
                  {renderFloatingCard(cards.find(c => c.id === "ketepatan_st"))}
               </div>

               {/* Col 2: SLA & Approvals */}
               <div className="flex flex-col gap-6">
                  {renderFloatingCard(cards.find(c => c.id === "sla_approval"), "SLA & Approvals")}
                  {renderFloatingCard(cards.find(c => c.id === "sla_ktk"))}
               </div>

               {/* Col 3: Cost Variations (Stacked) */}
               <div className="flex flex-col">
                  {renderStackedList()}
               </div>
               
            </div>
          </div>
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
    </div>
  );
}
