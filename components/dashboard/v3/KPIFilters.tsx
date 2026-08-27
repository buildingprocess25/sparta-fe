import React, { useEffect, useMemo, useState } from "react";
import { fetchPerformanceFilters, type PerformanceFiltersData, type PerformanceJobType, type PerformancePeriod } from "@/lib/api/performance-v3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIFiltersProps {
  userInfo: { roles: string[]; cabang: string; name: string };
  selectedCabang: string;
  selectedCoordinator: string;
  selectedSupport: string;
  selectedPeriod: PerformancePeriod;
  selectedJobType: PerformanceJobType;
  selectedTipeBangunan: "ALL" | "RUKO" | "NON_RUKO";
  search: string;
  onCabangChange: (val: string) => void;
  onCoordinatorChange: (val: string) => void;
  onSupportChange: (val: string) => void;
  onPeriodChange: (val: PerformancePeriod) => void;
  onJobTypeChange: (val: PerformanceJobType) => void;
  onTipeBangunanChange: (val: "ALL" | "RUKO" | "NON_RUKO") => void;
  onSearchChange: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
  onFiltersLoaded?: (filters: PerformanceFiltersData) => void;
}

const emptyFilters: PerformanceFiltersData = { cabangs: [], coordinators: [], supports: [] };
const periods: Array<{ value: PerformancePeriod; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "1m", label: "1 Bulan" },
  { value: "3m", label: "3 Bulan" },
  { value: "6m", label: "6 Bulan" },
  { value: "12m", label: "12 Bulan" },
  { value: "ytd", label: "YTD" }
];
const hasOption = (items: string[], value: string) => items.some((item) => item.toUpperCase() === value.toUpperCase());

export function KPIFilters({
  userInfo,
  selectedCabang,
  selectedCoordinator,
  selectedSupport,
  selectedPeriod,
  selectedJobType,
  selectedTipeBangunan,
  search,
  onCabangChange,
  onCoordinatorChange,
  onSupportChange,
  onPeriodChange,
  onJobTypeChange,
  onTipeBangunanChange,
  onSearchChange,
  onSearchSubmit,
  onFiltersLoaded
}: KPIFiltersProps) {
  const [filtersData, setFiltersData] = useState<PerformanceFiltersData>(emptyFilters);
  const [loading, setLoading] = useState(true);

  const role = userInfo.roles[0]?.toUpperCase() || "";
  const userName = userInfo.name || "";
  const isManager = role.includes("MANAGER") || role.includes("DIREKTUR") || role.includes("SUPER") || userInfo.cabang?.toUpperCase() === "HEAD OFFICE";
  const isSupport = role.includes("SUPPORT") || role.includes("PENGAWAS");
  const isCoordinator = !isManager && !isSupport && (role.includes("KOORDINATOR") || role.includes("COORD"));

  const coordinatorValue = isCoordinator ? userName : selectedCoordinator;
  const supportValue = isSupport ? userName : selectedSupport;

  useEffect(() => {
    if (isSupport && selectedSupport !== userName) onSupportChange(userName);
    if (isCoordinator && selectedCoordinator !== userName) onCoordinatorChange(userName);
  }, [isCoordinator, isSupport, onCoordinatorChange, onSupportChange, selectedCoordinator, selectedSupport, userName]);

  useEffect(() => {
    let ignore = false;
    async function loadFilters() {
      try {
        setLoading(true);
        const res = await fetchPerformanceFilters({
          actor_role: role || "USER",
          actor_cabang: userInfo.cabang || "",
          cabang: selectedCabang,
          coordinator: coordinatorValue,
          support: supportValue,
          job_type: selectedJobType,
          period: selectedPeriod
        });
        if (ignore) return;
        const next = res.data || emptyFilters;
        setFiltersData(next);
        onFiltersLoaded?.(next);
        if (selectedCabang !== "ALL" && !hasOption(next.cabangs, selectedCabang)) onCabangChange("ALL");
        if (!isCoordinator && selectedCoordinator !== "ALL" && !hasOption(next.coordinators, selectedCoordinator)) onCoordinatorChange("ALL");
        if (!isSupport && selectedSupport !== "ALL" && !hasOption(next.supports, selectedSupport)) onSupportChange("ALL");
      } catch (error) {
        console.error("Failed to load Performance Internal SAT filters", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadFilters();
    return () => { ignore = true; };
  }, [coordinatorValue, isCoordinator, isSupport, onCabangChange, onCoordinatorChange, onFiltersLoaded, onSupportChange, role, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, supportValue, userInfo.cabang]);

  const coordinatorOptions = useMemo(() => {
    if (isCoordinator && userName && !hasOption(filtersData.coordinators, userName)) return [userName, ...filtersData.coordinators];
    return filtersData.coordinators;
  }, [filtersData.coordinators, isCoordinator, userName]);

  const supportOptions = useMemo(() => {
    if (isSupport && userName && !hasOption(filtersData.supports, userName)) return [userName, ...filtersData.supports];
    return filtersData.supports;
  }, [filtersData.supports, isSupport, userName]);

  return (
    <section className="relative z-20 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl" aria-label="Filter Performance Internal SAT">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

        {/* Search */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-red-500" aria-hidden="true" />
            <input
              id="performance-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchSubmit?.(search);
                }
              }}
              className="h-11 w-full rounded-full border border-slate-200/80 bg-white/50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 hover:bg-white focus-visible:border-red-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-red-500/10"
              placeholder="Cari nama BM, B&M Manager, Koordinator, atau Support..."
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto">
            <Select value={selectedJobType} onValueChange={(value) => onJobTypeChange(value as PerformanceJobType)}>
              <SelectTrigger className="h-11 rounded-full border-slate-200/80 bg-white/50 px-4 font-semibold text-slate-700 hover:bg-white focus:ring-4 focus:ring-red-500/10">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="ALL" className="rounded-lg cursor-pointer">Semua Proyek</SelectItem>
                <SelectItem value="REGULER" className="rounded-lg cursor-pointer">Reguler</SelectItem>
                <SelectItem value="RENOVASI" className="rounded-lg cursor-pointer">Renovasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <Select value={selectedTipeBangunan} onValueChange={(value) => onTipeBangunanChange(value as "ALL" | "RUKO" | "NON_RUKO")}>
              <SelectTrigger className="h-11 rounded-full border-slate-200/80 bg-white/50 px-4 font-semibold text-slate-700 hover:bg-white focus:ring-4 focus:ring-red-500/10">
                <SelectValue placeholder="Tipe Bangunan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="ALL" className="rounded-lg cursor-pointer">Semua Tipe Bangunan</SelectItem>
                <SelectItem value="RUKO" className="rounded-lg cursor-pointer">Ruko</SelectItem>
                <SelectItem value="NON_RUKO" className="rounded-lg cursor-pointer">Non Ruko</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto min-w-[140px]">
            <Select value={selectedCabang} onValueChange={onCabangChange} disabled={loading}>
              <SelectTrigger className="h-11 rounded-full border-slate-200/80 bg-white/50 px-4 font-semibold text-slate-700 hover:bg-white focus:ring-4 focus:ring-red-500/10">
                <SelectValue placeholder={loading ? "Memuat..." : "Cabang"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
                <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900">Semua Cabang</SelectItem>
                {filtersData.cabangs.map((cabang) => <SelectItem key={cabang} value={cabang} className="rounded-lg cursor-pointer">{cabang}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto min-w-[160px]">
            <Select value={coordinatorValue || "ALL"} onValueChange={onCoordinatorChange} disabled={!isManager || loading}>
              <SelectTrigger className="h-11 rounded-full border-slate-200/80 bg-white/50 px-4 font-semibold text-slate-700 hover:bg-white focus:ring-4 focus:ring-red-500/10 disabled:opacity-60">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /><SelectValue placeholder="Koordinator" /></div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
                {isManager && <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900">Semua Koordinator</SelectItem>}
                {coordinatorOptions.map((name) => <SelectItem key={name} value={name} className="rounded-lg cursor-pointer">{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto min-w-[160px]">
            <Select value={supportValue || "ALL"} onValueChange={onSupportChange} disabled={isSupport || loading}>
              <SelectTrigger className="h-11 rounded-full border-slate-200/80 bg-white/50 px-4 font-semibold text-slate-700 hover:bg-white focus:ring-4 focus:ring-red-500/10 disabled:opacity-60">
                <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-slate-400" /><SelectValue placeholder="Support" /></div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
                {!isSupport && <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900">Semua Support</SelectItem>}
                {supportOptions.map((name) => <SelectItem key={name} value={name} className="rounded-lg cursor-pointer">{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Period Selection (Pill segmented control) */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 pt-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-red-500" /> Rentang Waktu
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-full bg-slate-100/50 p-1 ring-1 ring-slate-200/50 backdrop-blur-sm" aria-label="Filter periode">
          {periods.map((period) => (
            <button
              key={period.value}
              type="button"
              aria-pressed={selectedPeriod === period.value}
              onClick={() => onPeriodChange(period.value)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                selectedPeriod === period.value
                  ? "bg-white text-red-600 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
