import { safeFetchJSON, type ApiRequestOptions } from "../api";
import { API_URL } from "../constants";

export type KpiPerformanceData = {
    avg_cost_m2: number;
    avg_jhk: number;
    avg_denda: number;
    avg_keterlambatan_all: number;
    avg_kerja_tambah: number;
    avg_kerja_kurang: number;
    avg_sla_coord: number;
    avg_sla_bm: number;
    avg_sla_branch_manager: number;
    avg_ketepatan_st: number;
    avg_sla_ktk: number;
};

export type KpiFiltersData = {
    coordinators: string[];
    supports: string[];
};

export const fetchDashboardKpiPerformance = async (
    filters: {
        actor_role: string;
        actor_cabang: string;
        cabang?: string;
        job_type?: string;
        coordinator?: string;
        support?: string;
    },
    options?: ApiRequestOptions
): Promise<{ status: string; data: KpiPerformanceData }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    
    params.append("actor_role", filters.actor_role);
    params.append("actor_cabang", filters.actor_cabang);
    
    if (filters.cabang && filters.cabang !== "ALL") params.append("cabang", filters.cabang);
    if (filters.job_type && filters.job_type !== "ALL") params.append("job_type", filters.job_type);
    if (filters.coordinator && filters.coordinator !== "ALL") params.append("coordinator", filters.coordinator);
    if (filters.support && filters.support !== "ALL") params.append("support", filters.support);

    return safeFetchJSON(`${base}/api/dashboard/kpi-performance?${params.toString()}`, options);
};

export const fetchDashboardKpiFilters = async (
    filters: {
        actor_role: string;
        actor_cabang: string;
        cabang?: string;
    },
    options?: ApiRequestOptions
): Promise<{ status: string; data: KpiFiltersData }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    
    params.append("actor_role", filters.actor_role);
    params.append("actor_cabang", filters.actor_cabang);
    
    if (filters.cabang && filters.cabang !== "ALL") params.append("cabang", filters.cabang);

    return safeFetchJSON(`${base}/api/dashboard/kpi-filters?${params.toString()}`, options);
};

export const fetchDashboardKpiDrilldown = async (
    filters: {
        actor_role: string;
        actor_cabang: string;
        cabang?: string;
        coordinator?: string;
        support?: string;
        kpi_type: string;
        page?: number;
        limit?: number;
    },
    options?: ApiRequestOptions
): Promise<{ status: string; data: any[], meta: { total: number, page: number, limit: number, totalPages: number } }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    
    params.append("actor_role", filters.actor_role);
    params.append("actor_cabang", filters.actor_cabang);
    params.append("kpi_type", filters.kpi_type);
    
    if (filters.cabang && filters.cabang !== "ALL") params.append("cabang", filters.cabang);
    if (filters.coordinator && filters.coordinator !== "ALL") params.append("coordinator", filters.coordinator);
    if (filters.support && filters.support !== "ALL") params.append("support", filters.support);
    
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    return safeFetchJSON(`${base}/api/dashboard/kpi-drilldown?${params.toString()}`, options);
};
