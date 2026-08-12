import { safeFetchJSON, type ApiRequestOptions } from "../api";
import { API_URL } from "../constants";

export type PerformanceCardType = 
    | "sla" 
    | "cost_m2" 
    | "jhk" 
    | "denda" 
    | "kerja_tambah" 
    | "kerja_kurang" 
    | "ketepatan_st" 
    | "sla_ktk";

export type PerformanceSummaryData = {
    avg_cost_m2: number;
    avg_jhk: number;
    avg_denda: number;
    avg_kerja_tambah: number;
    avg_kerja_kurang: number;
    avg_ketepatan_st: number;
    avg_sla_ktk: number;
    avg_sla_coord: number;
    avg_sla_manager: number;
    avg_sla_bm: number;
    total_ulok: number;
};

export type PerformanceDrilldownItem = {
    nomor_ulok: string;
    toko_id: number;
    nama_toko: string;
    cabang: string;
    value_label: string;
    secondary_label?: string;
    detail: any;
};

export const fetchPerformanceSummary = async (params: Record<string, string>, options?: ApiRequestOptions) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v && v !== "ALL") query.append(k, v);
    });
    
    const base = API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${base}/api/dashboard/performance/summary?${query.toString()}`, options);
};

export const fetchPerformanceDrilldown = async (params: Record<string, string | number>, options?: ApiRequestOptions) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== "ALL") query.append(k, String(v));
    });

    const base = API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${base}/api/dashboard/performance/drilldown?${query.toString()}`, options);
};

export const fetchPerformanceTable = async (params: Record<string, string>, options?: ApiRequestOptions) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v && v !== "ALL") query.append(k, v);
    });

    const base = API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${base}/api/dashboard/performance/table?${query.toString()}`, options);
};
