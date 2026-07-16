import { apiFetch, safeFetchJSON } from "./api";
import { API_URL } from "./constants";

export type DendaActionType = "SP" | "TAKEOVER";
export type SpReason = "KETERLAMBATAN" | "MENOLAK_SPK" | "MANIPULASI" | "LAINNYA";
export type DendaActionStatus =
    | "WAITING_MANAGER"
    | "REJECTED_BY_MANAGER"
    | "APPROVED"
    | "SENT_TO_CONTRACTOR"
    | "VIEWED_BY_CONTRACTOR"
    | "ACKNOWLEDGED_BY_CONTRACTOR"
    | "EXPIRED";

export type DendaActionCandidate = {
    opname_final_id: number | null;
    id_toko: number;
    nomor_ulok: string | null;
    lingkup_pekerjaan: string | null;
    nama_toko: string | null;
    kode_toko: string | null;
    cabang: string | null;
    nama_kontraktor: string | null;
    nomor_spk: string | null;
    hari_denda: number;
    nilai_denda: string;
    tanggal_akhir_spk_denda: string | null;
    tanggal_serah_terima_denda: string | null;
    active_sp_count: number;
    next_sp_level: number | null;
    has_pending_approval: boolean;
    latest_action_type: DendaActionType | null;
    latest_action_status: DendaActionStatus | null;
    latest_action_created_at: string | null;
    latest_action_expires_at: string | null;
    latest_action_is_expired: boolean;
};

export type DendaAction = {
    id: number;
    id_toko: number;
    id_opname_final: number | null;
    nomor_ulok: string | null;
    lingkup_pekerjaan: string | null;
    cabang: string | null;
    nama_kontraktor: string | null;
    nomor_spk: string | null;
    action_type: DendaActionType;
    status: DendaActionStatus;
    sp_level: number | null;
    hari_denda: number;
    nilai_denda: string;
    alasan_sp: SpReason | null;
    alasan_lainnya: string | null;
    catatan: string | null;
    instruksi_tindak_lanjut: string | null;
    deadline_tindak_lanjut: string | null;
    lampiran_1_url: string | null;
    lampiran_2_url: string | null;
    nomor_surat: string | null;
    link_pdf: string | null;
    submitted_by_email: string | null;
    submitted_by_role: string | null;
    submitted_at: string | null;
    manager_approved_by: string | null;
    manager_approved_role: string | null;
    manager_approved_at: string | null;
    manager_rejected_by: string | null;
    manager_rejected_role: string | null;
    manager_rejected_at: string | null;
    manager_rejected_reason: string | null;
    sent_to_contractor_at: string | null;
    viewed_by_contractor_at: string | null;
    acknowledged_by_contractor_at: string | null;
    expires_at: string | null;
    actor_email: string | null;
    actor_role: string | null;
    created_at: string;
    updated_at: string;
    is_expired: boolean;
    is_active: boolean;
};

export type CreateSpActionPayload = {
    id_toko?: number | null;
    nama_kontraktor?: string;
    id_opname_final?: number | null;
    sp_level: number;
    alasan_sp: SpReason;
    alasan_lainnya?: string;
    catatan: string;
    lampiran?: File | null;
    lampiran_1_url?: string | null;
};

export type CreateTakeoverActionPayload = {
    id_opname_final: number;
    action_type: "TAKEOVER";
    catatan: string;
    lampiran_1_url?: string | null;
    lampiran_2_url?: string | null;
};

export const fetchDendaActionCandidates = async (): Promise<{ status: string; data: DendaActionCandidate[] }> =>
    safeFetchJSON(`${API_URL.replace(/\/$/, "")}/api/denda/actions/candidates`);

export const fetchDendaActionKontraktor = async (): Promise<{ status: string; data: string[] }> =>
    safeFetchJSON(`${API_URL.replace(/\/$/, "")}/api/denda/actions/kontraktor`);

export const fetchDendaActions = async (params: {
    id_toko?: number;
    id_opname_final?: number;
    nomor_ulok?: string;
    action_type?: DendaActionType;
} = {}): Promise<{ status: string; data: DendaAction[] }> => {
    const query = new URLSearchParams();
    if (params.id_toko) query.set("id_toko", String(params.id_toko));
    if (params.id_opname_final) query.set("id_opname_final", String(params.id_opname_final));
    if (params.nomor_ulok?.trim()) query.set("nomor_ulok", params.nomor_ulok.trim());
    if (params.action_type) query.set("action_type", params.action_type);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return safeFetchJSON(`${API_URL.replace(/\/$/, "")}/api/denda/actions${suffix}`);
};

export const createSpAction = async (
    payload: CreateSpActionPayload
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const form = new FormData();
    if (payload.id_toko) form.append("id_toko", String(payload.id_toko));
    if (payload.nama_kontraktor) form.append("nama_kontraktor", payload.nama_kontraktor);
    if (payload.id_opname_final) form.append("id_opname_final", String(payload.id_opname_final));
    form.append("action_type", "SP");
    form.append("sp_level", String(payload.sp_level));
    form.append("alasan_sp", payload.alasan_sp);
    if (payload.alasan_lainnya) form.append("alasan_lainnya", payload.alasan_lainnya);
    form.append("catatan", payload.catatan);
    if (payload.lampiran) form.append("lampiran", payload.lampiran);
    if (payload.lampiran_1_url?.trim()) form.append("lampiran_1_url", payload.lampiran_1_url.trim());

    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions`, {
        method: "POST",
        body: form,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal mengajukan Surat Peringatan.");
    return result;
};

export const createTakeoverAction = async (
    payload: CreateTakeoverActionPayload
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal mengajukan Takeover.");
    return result;
};

export const approveDendaAction = async (
    id: number
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions/${id}/approve`, {
        method: "POST",
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal approve SP/Takeover.");
    return result;
};

export const rejectDendaAction = async (
    id: number,
    alasan_penolakan: string
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan_penolakan }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal reject SP/Takeover.");
    return result;
};
