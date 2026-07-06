import { apiFetch, safeFetchJSON } from "./api";
import { API_URL } from "./constants";

export type DendaActionType = "SP" | "TAKEOVER";

export type DendaActionCandidate = {
    opname_final_id: number;
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
    latest_action_type: DendaActionType | null;
    latest_action_status: string | null;
    latest_action_created_at: string | null;
};

export type DendaAction = {
    id: number;
    id_toko: number;
    id_opname_final: number;
    nomor_ulok: string | null;
    lingkup_pekerjaan: string | null;
    cabang: string | null;
    action_type: DendaActionType;
    status: string;
    hari_denda: number;
    nilai_denda: string;
    catatan: string | null;
    link_pdf: string | null;
    actor_email: string | null;
    actor_role: string | null;
    created_at: string;
    updated_at: string;
};

export const fetchDendaActionCandidates = async (): Promise<{ status: string; data: DendaActionCandidate[] }> =>
    safeFetchJSON(`${API_URL.replace(/\/$/, "")}/api/denda/actions/candidates`);

export const fetchDendaActions = async (params: {
    id_toko?: number;
    id_opname_final?: number;
    nomor_ulok?: string;
} = {}): Promise<{ status: string; data: DendaAction[] }> => {
    const query = new URLSearchParams();
    if (params.id_toko) query.set("id_toko", String(params.id_toko));
    if (params.id_opname_final) query.set("id_opname_final", String(params.id_opname_final));
    if (params.nomor_ulok?.trim()) query.set("nomor_ulok", params.nomor_ulok.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return safeFetchJSON(`${API_URL.replace(/\/$/, "")}/api/denda/actions${suffix}`);
};

export const createDendaAction = async (payload: {
    id_opname_final: number;
    action_type: DendaActionType;
    catatan?: string | null;
}): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menyimpan keputusan SP/Takeover.");
    return result;
};
