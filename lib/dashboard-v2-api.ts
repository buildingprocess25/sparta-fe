import { safeFetchJSON } from "./api";
import { API_URL } from "./constants";

export type DashboardV2JobType = "ALL" | "REGULER" | "RENOVASI";
export type DashboardV2Period = "1m" | "3m" | "6m" | "1y" | "all";

export type DashboardV2CardType =
    | "TOTAL_TOKO"
    | "SLA"
    | "SPK_AKTIF"
    | "TOTAL_DENDA"
    | "NILAI_PENAWARAN"
    | "TAMBAH_HARI_SPK"
    | "ITEM_PENGAWASAN"
    | "INSTRUKSI_LAPANGAN"
    | "KERJA_TAMBAH_KURANG"
    | "SERAH_TERIMA"
    | "COST_M2_BANGUNAN"
    | "COST_M2_TERBUKA";

export type DashboardV2DocumentType =
    | "RAB"
    | "GANTT"
    | "SPK"
    | "TAMBAH_HARI_SPK"
    | "PENGAWASAN"
    | "INSTRUKSI_LAPANGAN"
    | "OPNAME_PARSIAL"
    | "OPNAME_FINAL"
    | "SERAH_TERIMA";

export type DashboardV2Tone = "neutral" | "blue" | "green" | "yellow" | "red" | "purple" | "orange";

export type DashboardV2Metric = {
    label: string;
    value: string | number;
    tone: DashboardV2Tone;
};

export type DashboardV2SummaryCard = {
    type: DashboardV2CardType;
    title: string;
    value: string | number;
    subtitle: string;
    tone: DashboardV2Tone;
    metrics: DashboardV2Metric[];
};

export type DashboardV2Summary = {
    generated_at: string;
    total_projects: number;
    cards: DashboardV2SummaryCard[];
};

export type DashboardV2Row = {
    key: string;
    toko_id: number;
    nomor_ulok: string;
    nama_toko: string;
    cabang: string;
    lingkup_pekerjaan: string;
    proyek: string;
    stage: string;
    status_label: string;
    value_label: string;
    metrics: DashboardV2Metric[];
};

export type DashboardV2Pagination = {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
};

export type DashboardV2TimelineNode = {
    id: string;
    type: DashboardV2DocumentType;
    title: string;
    subtitle: string;
    status_label: string;
    date_label: string;
    value_label: string;
    pdf_url: string | null;
    raw_id: number | null;
};

export type DashboardV2Timeline = {
    toko_id: number;
    nomor_ulok: string;
    nama_toko: string;
    cabang: string;
    lingkup_pekerjaan: string;
    nodes: DashboardV2TimelineNode[];
};

export type DashboardV2Detail = {
    title: string;
    subtitle: string;
    type: DashboardV2DocumentType;
    status_label: string;
    pdf_url: string | null;
    fields: Array<{ label: string; value: string }>;
    items: Array<Record<string, string | number | null>>;
};

export type DashboardV2Charts = {
    period: DashboardV2Period;
    charts: Array<{
        id: "rab" | "spk" | "release_st" | "spk_vs_opname";
        title: string;
        labels: string[];
        datasets: Array<{ label: string; data: number[]; kind: "count" | "currency" }>;
    }>;
};

export type DashboardV2ScopeParams = {
    actorRole: string;
    actorCabang: string;
    actorCompany?: string;
    cabang?: string;
    search?: string;
    jobType: DashboardV2JobType;
};

const baseUrl = API_URL.replace(/\/$/, "");

const appendScopeParams = (query: URLSearchParams, params: DashboardV2ScopeParams) => {
    query.set("actor_role", params.actorRole);
    query.set("actor_cabang", params.actorCabang);
    query.set("job_type", params.jobType);
    if (params.actorCompany?.trim()) query.set("actor_company", params.actorCompany.trim());
    if (params.cabang?.trim() && params.cabang !== "ALL") query.set("cabang", params.cabang.trim());
    if (params.search?.trim()) query.set("search", params.search.trim());
};

export const fetchDashboardV2Summary = async (params: DashboardV2ScopeParams): Promise<DashboardV2Summary> => {
    const query = new URLSearchParams();
    appendScopeParams(query, params);
    const response = await safeFetchJSON(`${baseUrl}/api/dashboard/v2/summary?${query.toString()}`);
    return response.data;
};

export const fetchDashboardV2CardRows = async (
    cardType: DashboardV2CardType,
    params: DashboardV2ScopeParams & { page?: number; limit?: number }
): Promise<{ data: DashboardV2Row[]; pagination: DashboardV2Pagination }> => {
    const query = new URLSearchParams();
    appendScopeParams(query, params);
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    const response = await safeFetchJSON(`${baseUrl}/api/dashboard/v2/cards/${cardType}?${query.toString()}`);
    return { data: response.data, pagination: response.pagination };
};

export const fetchDashboardV2Timeline = async (tokoId: number): Promise<DashboardV2Timeline> => {
    const response = await safeFetchJSON(`${baseUrl}/api/dashboard/v2/timeline/${tokoId}`);
    return response.data;
};

export const fetchDashboardV2Detail = async (
    tokoId: number,
    documentType: DashboardV2DocumentType,
    rawId: number
): Promise<DashboardV2Detail> => {
    const response = await safeFetchJSON(`${baseUrl}/api/dashboard/v2/detail/${tokoId}/${documentType}/${rawId}`);
    return response.data;
};

export const fetchDashboardV2Charts = async (
    params: DashboardV2ScopeParams & { period: DashboardV2Period }
): Promise<DashboardV2Charts> => {
    const query = new URLSearchParams();
    appendScopeParams(query, params);
    query.set("period", params.period);
    const response = await safeFetchJSON(`${baseUrl}/api/dashboard/v2/charts?${query.toString()}`);
    return response.data;
};
