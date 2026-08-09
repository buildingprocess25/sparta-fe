import React, { useEffect, useState } from "react";
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
}

export function KPIFilters({
  userInfo,
  selectedCabang,
  selectedCoordinator,
  selectedSupport,
  onCabangChange,
  onCoordinatorChange,
  onSupportChange
}: KPIFiltersProps) {
  const [filtersData, setFiltersData] = useState<KpiFiltersData>({ coordinators: [], supports: [] });
  const [loading, setLoading] = useState(true);

  const role = userInfo.roles[0]?.toUpperCase() || "";
  const isManager = role.includes("MANAGER") || role.includes("DIREKTUR") || role.includes("SUPER");
  const isCoordinator = role.includes("KOORDINATOR") || role.includes("COORD");
  const isSupport = role.includes("SUPPORT") || role.includes("PENGAWAS");

  useEffect(() => {
    async function loadFilters() {
      try {
        setLoading(true);
        const res = await fetchDashboardKpiFilters({
          actor_role: role,
          actor_cabang: userInfo.cabang
        });
        setFiltersData(res.data);

        // Auto-select based on role hierarchy
        if (isSupport) {
          onSupportChange(userInfo.name);
          onCoordinatorChange(userInfo.name); // Usually support doesn't pick coord, but lock it.
        } else if (isCoordinator) {
          onCoordinatorChange(userInfo.name);
        }
      } catch (err) {
        console.error("Failed to load KPI filters", err);
      } finally {
        setLoading(false);
      }
    }
    loadFilters();
  }, [userInfo]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 border-r pr-4 border-slate-100">
        <Filter className="h-4 w-4 text-indigo-500" />
        Filter Performa
      </div>
      
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Cabang Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-xs font-semibold text-slate-500">Cabang</label>
          <Select value={selectedCabang} onValueChange={onCabangChange}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200">
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Cabang</SelectItem>
              <SelectItem value="HEAD OFFICE">Head Office</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Coordinator Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3" /> Koordinator
          </label>
          <Select 
            value={selectedCoordinator} 
            onValueChange={onCoordinatorChange}
            disabled={!isManager || loading}
          >
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 disabled:opacity-70 disabled:bg-slate-100">
              <SelectValue placeholder={loading ? "Loading..." : "Semua Koordinator"} />
            </SelectTrigger>
            <SelectContent>
              {isManager && <SelectItem value="ALL">Semua Koordinator</SelectItem>}
              {filtersData.coordinators.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
              {(!isManager && !filtersData.coordinators.includes(userInfo.name)) && (
                <SelectItem value={userInfo.name}>{userInfo.name}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Support Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Wrench className="h-3 w-3" /> Building Support
          </label>
          <Select 
            value={selectedSupport} 
            onValueChange={onSupportChange}
            disabled={isSupport || loading}
          >
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 disabled:opacity-70 disabled:bg-slate-100">
              <SelectValue placeholder={loading ? "Loading..." : "Semua Support"} />
            </SelectTrigger>
            <SelectContent>
              {!isSupport && <SelectItem value="ALL">Semua Support</SelectItem>}
              {filtersData.supports.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              {(isSupport && !filtersData.supports.includes(userInfo.name)) && (
                <SelectItem value={userInfo.name}>{userInfo.name}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
