import { safeFetchJSON, type ApiRequestOptions } from "../api";
import { API_URL } from "../constants";

export type KpiCardType =
    | "total_ulok"
    | "cost_m2"
    | "jhk"
    | "denda"
    | "keterlambatan"
    | "sla_coord"
    | "sla_bm"
    | "sla_branch_manager"
    | "kerja_tambah"
    | "kerja_kurang"
    | "ketepatan_st"
    | "sla_ktk";

export type KpiMetricMeta = {
    valid_count: number;
    incomplete_count: number;
};

export type KpiScopeBreakdown = {
    lingkup_pekerjaan: string;
    toko_id: number;
    rab_approved_total: number;
    opname_total: number;
    spk_start_date: string | null;
    spk_end_date: string | null;
    spk_end_date_after_extension: string | null;
    official_late_days: number;
    official_penalty_amount: number;
};

export type KpiPerformanceData = {
    basis: "ULOK_GABUNGAN";
    total_ulok: number;
    avg_cost_m2: number;
    avg_jhk: number;
    avg_denda: number;
    total_denda: number;
    avg_keterlambatan_all: number;
    terlambat_count: number;
    avg_kerja_tambah: number;
    avg_kerja_kurang: number;
    avg_sla_coord: number;
    avg_sla_bm: number;
    avg_sla_branch_manager: number;
    avg_ketepatan_st: number;
    avg_sla_ktk: number;
    metrics: Record<KpiCardType, KpiMetricMeta>;
};

export type KpiFiltersData = {
    cabangs: string[];
    coordinators: string[];
    supports: string[];
};

export type KpiDrilldownRow = {
    nomor_ulok: string;
    proyek: string;
    kode_toko: string | null;
    cabang: string;
    job_types: string[];
    value: number | null;
    value_label: string;
    secondary_label: string;
    coordinators: string[];
    building_supports: string[];
    data_quality_flags: string[];
    scope_breakdown: KpiScopeBreakdown[];
    detail: {
        rab_approved_total: number;
        luas_bangunan: number;
        spk_start_date: string | null;
        spk_end_date_after_extension: string | null;
        st_date: string | null;
        opname_final_date: string | null;
        rab_created_date: string | null;
        rab_coord_approved_date: string | null;
        rab_bm_approved_date: string | null;
        rab_branch_manager_approved_date: string | null;
        official_late_days: number;
        official_penalty_amount: number;
        opname_total: number;
        kerja_tambah_amount: number;
        kerja_kurang_amount: number;
        avg_sla_coord: number | null;
        avg_sla_bm: number | null;
        avg_sla_branch_manager: number | null;
        avg_sla_approval_total: number | null;
    };
};

type KpiBaseFilters = {
    actor_role: string;
    actor_cabang: string;
    cabang?: string;
    job_type?: string;
    coordinator?: string;
    support?: string;
};

const appendBaseFilters = (params: URLSearchParams, filters: KpiBaseFilters) => {
    params.append("actor_role", filters.actor_role);
    params.append("actor_cabang", filters.actor_cabang);
    if (filters.cabang && filters.cabang !== "ALL") params.append("cabang", filters.cabang);
    if (filters.job_type && filters.job_type !== "ALL") params.append("job_type", filters.job_type);
    if (filters.coordinator && filters.coordinator !== "ALL") params.append("coordinator", filters.coordinator);
    if (filters.support && filters.support !== "ALL") params.append("support", filters.support);
};

export const fetchDashboardKpiPerformance = async (
    filters: KpiBaseFilters,
    options?: ApiRequestOptions
): Promise<{ status: string; data: KpiPerformanceData }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    appendBaseFilters(params, filters);
    return safeFetchJSON(`${base}/api/dashboard/kpi-performance?${params.toString()}`, options);
};

export const fetchDashboardKpiFilters = async (
    filters: Pick<KpiBaseFilters, "actor_role" | "actor_cabang" | "cabang" | "coordinator" | "support">,
    options?: ApiRequestOptions
): Promise<{ status: string; data: KpiFiltersData }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    params.append("actor_role", filters.actor_role);
    params.append("actor_cabang", filters.actor_cabang);
    if (filters.cabang && filters.cabang !== "ALL") params.append("cabang", filters.cabang);
    if (filters.coordinator && filters.coordinator !== "ALL") params.append("coordinator", filters.coordinator);
    if (filters.support && filters.support !== "ALL") params.append("support", filters.support);
    return safeFetchJSON(`${base}/api/dashboard/kpi-filters?${params.toString()}`, options);
};

export const fetchDashboardKpiDrilldown = async (
    filters: KpiBaseFilters & {
        kpi_type: KpiCardType;
        page?: number;
        limit?: number;
    },
    options?: ApiRequestOptions
): Promise<{ status: string; data: KpiDrilldownRow[]; meta: { total: number; page: number; limit: number; totalPages: number; basis: "ULOK_GABUNGAN" } }> => {
    const base = API_URL.replace(/\/$/, "");
    const params = new URLSearchParams();
    appendBaseFilters(params, filters);
    params.append("kpi_type", filters.kpi_type);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    return safeFetchJSON(`${base}/api/dashboard/kpi-drilldown?${params.toString()}`, options);
};
