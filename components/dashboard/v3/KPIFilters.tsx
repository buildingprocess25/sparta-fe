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
  search: string;
  onCabangChange: (val: string) => void;
  onCoordinatorChange: (val: string) => void;
  onSupportChange: (val: string) => void;
  onPeriodChange: (val: PerformancePeriod) => void;
  onJobTypeChange: (val: PerformanceJobType) => void;
  onSearchChange: (val: string) => void;
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
  search,
  onCabangChange,
  onCoordinatorChange,
  onSupportChange,
  onPeriodChange,
  onJobTypeChange,
  onSearchChange,
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
          period: selectedPeriod,
          search
        });
        if (ignore) return;
        const next = res.data || emptyFilters;
        setFiltersData(next);
        onFiltersLoaded?.(next);
        if (selectedCabang !== "ALL" && !hasOption(next.cabangs, selectedCabang)) onCabangChange("ALL");
        if (!isCoordinator && selectedCoordinator !== "ALL" && !hasOption(next.coordinators, selectedCoordinator)) onCoordinatorChange("ALL");
        if (!isSupport && selectedSupport !== "ALL" && !hasOption(next.supports, selectedSupport)) onSupportChange("ALL");
      } catch (error) {
        console.error("Failed to load Performance KPI SAT filters", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadFilters();
    return () => { ignore = true; };
  }, [coordinatorValue, isCoordinator, isSupport, onCabangChange, onCoordinatorChange, onFiltersLoaded, onSupportChange, role, search, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, supportValue, userInfo.cabang]);

  const coordinatorOptions = useMemo(() => {
    if (isCoordinator && userName && !hasOption(filtersData.coordinators, userName)) return [userName, ...filtersData.coordinators];
    return filtersData.coordinators;
  }, [filtersData.coordinators, isCoordinator, userName]);

  const supportOptions = useMemo(() => {
    if (isSupport && userName && !hasOption(filtersData.supports, userName)) return [userName, ...filtersData.supports];
    return filtersData.supports;
  }, [filtersData.supports, isSupport, userName]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filter Performance KPI SAT">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 xl:w-44">
          <Filter className="h-4 w-4 text-red-600" aria-hidden="true" />
          Filter KPI SAT
        </div>

        <div className="flex flex-1 flex-wrap items-end gap-3">
          <div className="flex min-w-52 flex-1 flex-col gap-1">
            <label htmlFor="performance-search" className="text-xs font-semibold text-slate-500">Search ULOK/nama toko</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="performance-search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-[border-color,box-shadow] focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-100"
                placeholder="Cari ULOK atau toko"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-44">
            <label className="text-xs font-semibold text-slate-500">Job Type</label>
            <Select value={selectedJobType} onValueChange={(value) => onJobTypeChange(value as PerformanceJobType)}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Job</SelectItem>
                <SelectItem value="REGULER">Reguler</SelectItem>
                <SelectItem value="RENOVASI">Renovasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-52">
            <label className="text-xs font-semibold text-slate-500">Cabang</label>
            <Select value={selectedCabang} onValueChange={onCabangChange} disabled={loading}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50"><SelectValue placeholder={loading ? "Memuat" : "Semua Cabang"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Cabang</SelectItem>
                {filtersData.cabangs.map((cabang) => <SelectItem key={cabang} value={cabang}>{cabang}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-56">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Users className="h-3 w-3" aria-hidden="true" /> Koordinator</label>
            <Select value={coordinatorValue || "ALL"} onValueChange={onCoordinatorChange} disabled={!isManager || loading}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:opacity-70"><SelectValue placeholder="Semua Koordinator" /></SelectTrigger>
              <SelectContent>
                {isManager && <SelectItem value="ALL">Semua Koordinator</SelectItem>}
                {coordinatorOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-56">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500"><Wrench className="h-3 w-3" aria-hidden="true" /> Building Support</label>
            <Select value={supportValue || "ALL"} onValueChange={onSupportChange} disabled={isSupport || loading}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:opacity-70"><SelectValue placeholder="Semua Support" /></SelectTrigger>
              <SelectContent>
                {!isSupport && <SelectItem value="ALL">Semua Support</SelectItem>}
                {supportOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter periode">
        {periods.map((period) => (
          <button
            key={period.value}
            type="button"
            aria-pressed={selectedPeriod === period.value}
            onClick={() => onPeriodChange(period.value)}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              selectedPeriod === period.value ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {period.label}
          </button>
        ))}
      </div>
    </section>
  );
}
