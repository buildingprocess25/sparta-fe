import React, { useEffect, useMemo, useState } from "react";
import { fetchDashboardKpiFilters, KpiFiltersData } from "@/lib/api/kpi-performance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Filter, Users, Wrench } from "lucide-react";

interface KPIFiltersProps {
  userInfo: { roles: string[]; cabang: string; name: string };
  selectedCabang: string;
  selectedCoordinator: string;
  selectedSupport: string;
  onCabangChange: (val: string) => void;
  onCoordinatorChange: (val: string) => void;
  onSupportChange: (val: string) => void;
  onFiltersLoaded?: (filters: {coordinators: string[], supports: string[]}) => void;
}

const emptyFilters: KpiFiltersData = { cabangs: [], coordinators: [], supports: [] };
const hasOption = (items: string[], value: string) => items.some((item) => item.toUpperCase() === value.toUpperCase());

export function KPIFilters({
  userInfo,
  selectedCabang,
  selectedCoordinator,
  selectedSupport,
  onCabangChange,
  onCoordinatorChange,
  onSupportChange,
  onFiltersLoaded
}: KPIFiltersProps) {
  const [filtersData, setFiltersData] = useState<KpiFiltersData>(emptyFilters);
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
        const res = await fetchDashboardKpiFilters({
          actor_role: role,
          actor_cabang: userInfo.cabang,
          cabang: selectedCabang,
          coordinator: coordinatorValue,
          support: supportValue
        });
        if (ignore) return;

        const next = {
          cabangs: res.data.cabangs || [],
          coordinators: res.data.coordinators || [],
          supports: res.data.supports || []
        };
        setFiltersData(next);
        if (onFiltersLoaded) onFiltersLoaded(next);

        if (selectedCabang !== "ALL" && !hasOption(next.cabangs, selectedCabang)) onCabangChange("ALL");
        if (!isCoordinator && selectedCoordinator !== "ALL" && !hasOption(next.coordinators, selectedCoordinator)) onCoordinatorChange("ALL");
        if (!isSupport && selectedSupport !== "ALL" && !hasOption(next.supports, selectedSupport)) onSupportChange("ALL");
      } catch (err) {
        console.error("Failed to load KPI filters", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadFilters();
    return () => {
      ignore = true;
    };
  }, [coordinatorValue, isCoordinator, isSupport, onCabangChange, onCoordinatorChange, onSupportChange, role, selectedCabang, selectedCoordinator, selectedSupport, supportValue, userInfo.cabang]);

  const coordinatorOptions = useMemo(() => {
    if (isCoordinator && userName && !hasOption(filtersData.coordinators, userName)) return [userName, ...filtersData.coordinators];
    return filtersData.coordinators;
  }, [filtersData.coordinators, isCoordinator, userName]);

  const supportOptions = useMemo(() => {
    if (isSupport && userName && !hasOption(filtersData.supports, userName)) return [userName, ...filtersData.supports];
    return filtersData.supports;
  }, [filtersData.supports, isSupport, userName]);

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 border-slate-100 text-sm font-semibold text-slate-800 sm:border-r sm:pr-4">
        <Filter className="h-4 w-4 text-red-600" aria-hidden="true" />
        Filter ULOK Gabungan
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-52">
          <label className="text-xs font-semibold text-slate-500">Cabang</label>
          <Select value={selectedCabang} onValueChange={onCabangChange} disabled={loading}>
            <SelectTrigger className="h-9 border-slate-200 bg-slate-50">
              <SelectValue placeholder={loading ? "Memuat�" : "Semua Cabang"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Cabang</SelectItem>
              {filtersData.cabangs.map((cabang) => (
                <SelectItem key={cabang} value={cabang}>{cabang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-56">
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Users className="h-3 w-3" aria-hidden="true" /> Koordinator
          </label>
          <Select
            value={coordinatorValue || "ALL"}
            onValueChange={onCoordinatorChange}
            disabled={!isManager || loading}
          >
            <SelectTrigger className="h-9 border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:opacity-70">
              <SelectValue placeholder={loading ? "Memuat�" : "Semua Koordinator"} />
            </SelectTrigger>
            <SelectContent>
              {isManager && <SelectItem value="ALL">Semua Koordinator</SelectItem>}
              {coordinatorOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-56">
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Wrench className="h-3 w-3" aria-hidden="true" /> Building Support
          </label>
          <Select
            value={supportValue || "ALL"}
            onValueChange={onSupportChange}
            disabled={isSupport || loading}
          >
            <SelectTrigger className="h-9 border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:opacity-70">
              <SelectValue placeholder={loading ? "Memuat�" : "Semua Support"} />
            </SelectTrigger>
            <SelectContent>
              {!isSupport && <SelectItem value="ALL">Semua Support</SelectItem>}
              {supportOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
