// ============================================================================
// ADD THESE FUNCTIONS TO denda-actions-api.ts
// After the rejectDendaAction function
// ============================================================================

import { apiFetch } from "./api";
import { API_URL } from "./constants";
import type { DendaAction } from "./denda-actions-api";

/**
 * Mark SP as viewed by kontraktor (auto-called when opening detail page)
 */
export const markViewedDendaAction = async (
    id: number
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions/${id}/mark-viewed`, {
        method: "POST",
    });
    const result = await res.json();
    if (!res.ok) {
        // Don't throw error for mark-viewed (it's auto-tracked, failures are non-critical)
        console.warn("Failed to mark SP as viewed:", result.message);
        return result;
    }
    return result;
};

/**
 * Acknowledge SP by kontraktor (manual action with button click)
 */
export const acknowledgeDendaAction = async (
    id: number,
    catatan?: string
): Promise<{ status: string; message: string; data: DendaAction }> => {
    const res = await apiFetch(`${API_URL.replace(/\/$/, "")}/api/denda/actions/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan_acknowledge: catatan || undefined }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Gagal menerima Surat Peringatan.");
    return result;
};
