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
    <section className="relative z-20 rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur-xl" aria-label="Filter Performance Internal SAT">
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Search */}
        <div className="flex-grow min-w-[240px]">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-red-500" aria-hidden="true" />
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
              className="h-9 w-full rounded-full border border-slate-200/80 bg-white/50 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 hover:bg-white focus-visible:border-red-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-red-500/10"
              placeholder="Cari BM, B&M Manager, Koord, atau Support..."
            />
          </div>
        </div>

        {/* Dropdowns */}
        <Select value={selectedJobType} onValueChange={(value) => onJobTypeChange(value as PerformanceJobType)}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10">
            <SelectValue placeholder="Proyek" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="ALL" className="rounded-lg cursor-pointer text-xs">Semua Proyek</SelectItem>
            <SelectItem value="REGULER" className="rounded-lg cursor-pointer text-xs">Reguler</SelectItem>
            <SelectItem value="RENOVASI" className="rounded-lg cursor-pointer text-xs">Renovasi</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTipeBangunan} onValueChange={(value) => onTipeBangunanChange(value as "ALL" | "RUKO" | "NON_RUKO")}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10">
            <SelectValue placeholder="Bangunan" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="ALL" className="rounded-lg cursor-pointer text-xs">Semua Bangunan</SelectItem>
            <SelectItem value="RUKO" className="rounded-lg cursor-pointer text-xs">Ruko</SelectItem>
            <SelectItem value="NON_RUKO" className="rounded-lg cursor-pointer text-xs">Non Ruko</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCabang} onValueChange={onCabangChange} disabled={loading}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10 min-w-[120px]">
            <SelectValue placeholder={loading ? "Memuat..." : "Cabang"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
            <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900 text-xs">Semua Cabang</SelectItem>
            {filtersData.cabangs.map((cabang) => <SelectItem key={cabang} value={cabang} className="rounded-lg cursor-pointer text-xs">{cabang}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={coordinatorValue || "ALL"} onValueChange={onCoordinatorChange} disabled={!isManager || loading}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 min-w-[130px]">
            <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" /><SelectValue placeholder="Koordinator" /></div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
            {isManager && <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900 text-xs">Semua Koordinator</SelectItem>}
            {coordinatorOptions.map((name) => <SelectItem key={name} value={name} className="rounded-lg cursor-pointer text-xs">{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={supportValue || "ALL"} onValueChange={onSupportChange} disabled={isSupport || loading}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 min-w-[130px]">
            <div className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-slate-400" /><SelectValue placeholder="Support" /></div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
            {!isSupport && <SelectItem value="ALL" className="rounded-lg cursor-pointer font-bold text-slate-900 text-xs">Semua Support</SelectItem>}
            {supportOptions.map((name) => <SelectItem key={name} value={name} className="rounded-lg cursor-pointer text-xs">{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={(value) => onPeriodChange(value as any)}>
          <SelectTrigger className="h-9 w-auto rounded-full border-slate-200/80 bg-white/50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-white focus:ring-2 focus:ring-red-500/10 min-w-[120px]">
            <div className="flex items-center gap-1.5"><Filter className="h-3.5 w-3.5 text-slate-400" /><SelectValue placeholder="Periode" /></div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value} className="rounded-lg cursor-pointer text-xs">
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>
    </section>
  );
}
