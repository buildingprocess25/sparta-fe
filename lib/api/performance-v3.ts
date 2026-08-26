import { safeFetchJSON, type ApiRequestOptions } from "../api";
import { API_URL } from "../constants";

export type PerformanceCardType =
  | "sla_approval"
  | "cost_m2"
  | "jhk"
  | "denda"
  | "kerja_tambah"
  | "kerja_kurang"
  | "ketepatan_st"
  | "sla_ktk"
  | "all";

export type PerformancePeriod = "1m" | "3m" | "6m" | "12m" | "ytd" | "all";
export type PerformanceJobType = "ALL" | "REGULER" | "RENOVASI";
export type PerformanceSlaRole = "support" | "coordinator" | "bm_manager" | "branch_manager";
export type PerformancePersonRole = "coordinator" | "support";
export type PerformanceDocument = "rab" | "spk" | "tambah_spk" | "il" | "ktk";
export type PerformanceTableMetric =
  | "jhk_notaris_to_end_spk"
  | "jhk_notaris_to_start_spk"
  | "persentase_temuan"
  | "ketepatan_st"
  | "deviasi_pe"
  | "finalisasi_ktk";

export type PerformanceQueryParams = {
  actor_role: string;
  actor_cabang: string;
  cabang?: string;
  coordinator?: string;
  support?: string;
  job_type?: PerformanceJobType;
  period?: PerformancePeriod;
  search?: string;
};

export type PerformanceSummaryData = {
  cards: {
    sla_approval: { value: number | null; count: number; roles: Record<PerformanceSlaRole, number | null> };
    cost_m2: { terbangun: number | null; bangunan: number | null; area_terbuka: number | null; count: number };
    jhk: { value: number | null; count: number; target_value: number | null; target_count: number };
    denda: { value: number | null; count: number; sum_value?: number | null };
    kerja_tambah: { value: number | null; count: number; sum_value?: number | null };
    kerja_kurang: { value: number | null; count: number; sum_value?: number | null };
    ketepatan_st: { value: number | null; count: number };
    sla_ktk: { value: number | null; count: number };
  };
  meta: { total_ulok: number; incomplete_ulok: number; period: PerformancePeriod; basis: "ULOK_GABUNGAN" };
};

export type PerformanceFiltersData = {
  cabangs: string[];
  coordinators: string[];
  supports: string[];
  approvalActors?: Record<PerformanceSlaRole, string[]>;
};

export type PerformanceDrilldownScope = {
  lingkup_pekerjaan: string;
  toko_id: number;
  project_type?: string | null;
  has_rab?: boolean;
  has_spk?: boolean;
  has_st?: boolean;
  has_opname?: boolean;
};

export type PerformanceDrilldownItem = {
  nomor_ulok: string;
  nama_toko: string | null;
  kode_toko: string | null;
  cabang: string | null;
  scopes: PerformanceDrilldownScope[];
  supports: string[];
  coordinators: string[];
  value: number | null;
  value_label: string;
  secondary_label: string;
  data_quality: string[];
  bangunan?: number | null;
  area_terbuka?: number | null;
};

export type PerformanceDocumentLink = {
  type: PerformanceDocument | "serah_terima" | "sph" | "lampiran";
  label: string;
  url: string;
  source: string;
  lingkup?: string | null;
};

export type PerformanceApprovalEvent = {
  role: PerformanceSlaRole;
  document: PerformanceDocument;
  label: string;
  lingkup?: string | null;
  actorName: string | null;
  startAt: string | null;
  approvedAt: string | null;
  durationDays: number | null;
  source: string;
};

export type PerformanceDetailData = {
  nomor_ulok: string;
  nama_toko: string | null;
  kode_toko: string | null;
  cabang: string | null;
  alamat: string | null;
  kontraktor: string | null;
  supports: string[];
  coordinators: string[];
  selected_card: PerformanceCardType;
  selected_scope?: string | null;
  selected_value: number | null;
  sections: {
    cost_m2: { terbangun: number | null; bangunan: number | null; area_terbuka: number | null; formula: string };
    jhk: { avg_days: number | null; avg_target_days: number | null; scopes: Array<Record<string, unknown>> };
    denda: { value: number | null; policy: string; scopes: Array<Record<string, unknown>> };
    kerja_tambah_kurang: { kerja_tambah: number | null; kerja_kurang: number | null; formula: string; scopes: Array<Record<string, unknown>> };
    ketepatan_st: { days: number | null; formula: string; scopes: Array<Record<string, unknown>> };
    sla_ktk: { days: number | null; formula: string; director_approval: Array<Record<string, unknown>> };
    sla_approval: { events: PerformanceApprovalEvent[]; avg_days: number | null };
    support_metrics: Record<PerformanceTableMetric, number | null>;
  };
  documents: PerformanceDocumentLink[];
  data_quality: string[];
};


export type PerformanceOptionStat = {
  id: string;
  label: string;
  value: number | null;
  count: number;
  incomplete_count?: number;
  bangunan?: number | null;
  area_terbuka?: number | null;
};

export type PerformanceOptionStatsData = {
  roles: PerformanceOptionStat[];
  people: PerformanceOptionStat[];
  documents: PerformanceOptionStat[];
};
export type PerformanceTableRow = Record<PerformanceTableMetric, number | null> & {
  nama_support: string;
  total_ulok: number;
  incomplete_ulok: number;
};

const base = API_URL.replace(/\/$/, "");

const appendParams = (params: Record<string, string | number | undefined | null>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "ALL") return;
    query.append(key, String(value));
  });
  return query.toString();
};

export const fetchPerformanceSummary = async (params: PerformanceQueryParams, options?: ApiRequestOptions): Promise<{ status: string; data: PerformanceSummaryData }> => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/summary?${query}`, options) as Promise<{ status: string; data: PerformanceSummaryData }>;
};

export const fetchPerformanceFilters = async (params: PerformanceQueryParams, options?: ApiRequestOptions): Promise<{ status: string; data: PerformanceFiltersData }> => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/filters?${query}`, options) as Promise<{ status: string; data: PerformanceFiltersData }>;
};


export const fetchPerformanceOptionStats = async (
  params: PerformanceQueryParams & {
    card_type: PerformanceCardType;
    selected_role?: PerformanceSlaRole | PerformancePersonRole;
    selected_name?: string;
  },
  options?: ApiRequestOptions
): Promise<{ status: string; data: PerformanceOptionStatsData }> => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/options-stats?${query}`, options) as Promise<{ status: string; data: PerformanceOptionStatsData }>;
};
export const fetchPerformanceDrilldown = async (
  params: PerformanceQueryParams & {
    card_type: PerformanceCardType;
    sla_role?: PerformanceSlaRole;
    sla_doc?: PerformanceDocument;
    person_role?: PerformancePersonRole;
    person_name?: string;
    support_metric?: PerformanceTableMetric;
    page?: number;
    limit?: number;
  },
  options?: ApiRequestOptions
) => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/drilldown?${query}`, options);
};

export const fetchPerformanceDetail = async (
  params: PerformanceQueryParams & {
    nomor_ulok: string;
    lingkup_pekerjaan?: string;
    card_type: PerformanceCardType;
    sla_role?: PerformanceSlaRole;
    sla_doc?: PerformanceDocument;
    person_role?: PerformancePersonRole;
    person_name?: string;
    support_metric?: PerformanceTableMetric;
  },
  options?: ApiRequestOptions
) => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/detail?${query}`, options);
};

export const fetchPerformanceTable = async (params: PerformanceQueryParams, options?: ApiRequestOptions): Promise<{ status: string; data: PerformanceTableRow[] }> => {
  const query = appendParams(params);
  return safeFetchJSON(`${base}/api/dashboard/performance/table?${query}`, options) as Promise<{ status: string; data: PerformanceTableRow[] }>;
};
