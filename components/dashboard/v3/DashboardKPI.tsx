import React, { useEffect, useState, useCallback } from "react";
import { fetchDashboardKpiPerformance, type KpiPerformanceData } from "@/lib/api/kpi-performance";
import { KPIFilters } from "./KPIFilters";
import { KpiDrilldownModal } from "./KpiDrilldownModal";

import { 
  Building2, 
  Banknote, 
  Clock, 
  AlertTriangle, 
  TimerReset, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Activity,
  FileText,
  UserCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />
);

export function DashboardKPI({ 
  userInfo 
}: { 
  userInfo: { name: string; roles: string[]; cabang: string; namaPt: string } 
}) {
  const [data, setData] = useState<KpiPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedCabang, setSelectedCabang] = useState("ALL");
  const [selectedCoordinator, setSelectedCoordinator] = useState("ALL");
  const [selectedSupport, setSelectedSupport] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
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
    } catch (err: any) {
      setError(err.message || "Gagal memuat data KPI");
    } finally {
      setLoading(false);
    }
  }, [userInfo, selectedCabang, selectedCoordinator, selectedSupport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDrilldown = (type: string, title: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  const renderMetricCard = (
    id: string,
    title: string, 
    value: string | number, 
    unit: string, 
    icon: React.ReactNode, 
    colorClass: string,
    loadingState: boolean,
    hoverClass: string
  ) => {
    return (
      <div 
        onClick={() => openDrilldown(id, title)}
        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] cursor-pointer"
      >
        <div className="flex items-center justify-between relative z-10">
          <p className="text-sm font-semibold text-slate-500 transition-colors group-hover:text-slate-700">{title}</p>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110", colorClass)}>
            {icon}
          </div>
        </div>
        <div className="mt-5 flex items-baseline gap-2 relative z-10">
          {loadingState ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">{value}</h3>
              {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
            </>
          )}
        </div>
        
        {/* Click indicator */}
        <div className="absolute right-4 bottom-4 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <div className="p-1.5 rounded-full bg-slate-100/80 text-slate-400 group-hover:text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic ambient background glow */}
        <div className={cn("pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60", hoverClass)}></div>
      </div>
    );
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex h-full flex-col space-y-6 overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
      
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance KPI</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Monitoring rata-rata performa proyek SAT secara keseluruhan berdasarkan *Real Data*.
          </p>
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
        <div className="rounded-xl bg-red-50/80 backdrop-blur-md p-4 text-sm text-red-600 border border-red-200/50 flex items-center gap-2 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Financial & General */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {renderMetricCard(
            "cost_m2",
            "Avg Cost/m2", 
            formatRupiah(data?.avg_cost_m2 || 0), 
            "/ m2", 
            <Banknote className="h-5 w-5 text-emerald-600" />, 
            "bg-emerald-100/50 border border-emerald-200/50",
            loading,
            "bg-emerald-400"
          )}
          {renderMetricCard(
            "jhk",
            "Avg JHK", 
            Number(data?.avg_jhk || 0).toFixed(1), 
            "Hari", 
            <Clock className="h-5 w-5 text-blue-600" />, 
            "bg-blue-100/50 border border-blue-200/50",
            loading,
            "bg-blue-400"
          )}
          {renderMetricCard(
            "denda",
            "Avg Denda", 
            formatRupiah(data?.avg_denda || 0), 
            "", 
            <AlertTriangle className="h-5 w-5 text-amber-600" />, 
            "bg-amber-100/50 border border-amber-200/50",
            loading,
            "bg-amber-400"
          )}
          {renderMetricCard(
            "keterlambatan",
            "Avg Keterlambatan", 
            Number(data?.avg_keterlambatan_all || data?.avg_keterlambatan || 0).toFixed(1), 
            "Hari", 
            <TimerReset className="h-5 w-5 text-rose-600" />, 
            "bg-rose-100/50 border border-rose-200/50",
            loading,
            "bg-rose-400"
          )}
        </div>

        {/* KTK (Kerja Tambah Kurang) */}
        <div 
          onClick={() => openDrilldown("ktk_nominal", "Rincian Kerja Tambah & Kurang")}
          className="group cursor-pointer col-span-1 md:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden"
        >
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100/50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform"><Activity className="h-4 w-4" /></div>
              Kerja Tambah & Kurang
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-slate-500" />
          </h2>
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 group-hover:bg-emerald-50/30 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Avg Tambah</p>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <p className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  {formatRupiah(data?.avg_kerja_tambah || 0)}
                </p>
              )}
            </div>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 group-hover:bg-rose-50/30 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Avg Kurang</p>
              {loading ? <Skeleton className="h-8 w-28" /> : (
                <p className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                  {formatRupiah(data?.avg_kerja_kurang || 0)}
                </p>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-400 opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"></div>
        </div>

        {/* SLA Approvals */}
        <div 
          onClick={() => openDrilldown("sla_approval", "Rata-rata Waktu Persetujuan")}
          className="group cursor-pointer col-span-1 md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden"
        >
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-100/50 rounded-lg text-sky-600 group-hover:scale-110 transition-transform"><UserCheck className="h-4 w-4" /></div>
              SLA Approval <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">Rata-rata Hari</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-slate-500" />
          </h2>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="text-xs font-semibold text-slate-500 mb-1">Koordinator</p>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <p className="text-2xl font-extrabold text-slate-800">{Number(data?.avg_sla_coord || 0).toFixed(1)}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors border-x border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">Manager</p>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <p className="text-2xl font-extrabold text-slate-800">{Number(data?.avg_sla_bm || 0).toFixed(1)}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="text-xs font-semibold text-slate-500 mb-1">Branch Mgr</p>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <p className="text-2xl font-extrabold text-slate-800">{Number(data?.avg_sla_branch_manager || 0).toFixed(1)}</p>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-12 left-12 h-32 w-32 rounded-full bg-sky-400 opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"></div>
        </div>

        {/* Serah Terima & KTK SLA */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
           {renderMetricCard(
            "ketepatan_st",
            "Ketepatan BAST", 
            Number(data?.avg_ketepatan_st || 0).toFixed(1), 
            "Hari (Selisih dari Target)", 
            <CheckCircle2 className="h-5 w-5 text-teal-600" />, 
            "bg-teal-100/50 border border-teal-200/50",
            loading,
            "bg-teal-400"
          )}
          {renderMetricCard(
            "sla_ktk",
            "SLA KTK", 
            Number(data?.avg_sla_ktk || 0).toFixed(1), 
            "Hari (Setelah BAST)", 
            <FileText className="h-5 w-5 text-violet-600" />, 
            "bg-violet-100/50 border border-violet-200/50",
            loading,
            "bg-violet-400"
          )}
        </div>

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
