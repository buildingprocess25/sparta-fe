// app/lib/maintenance-store-api.ts -- wait I can just put it in a separate file or add it to api.ts.
// It's safer to add it to a new file so I don't mess up api.ts since it's 6000 lines long, but wait I can just put it in `lib/api.ts` by appending it or using multi_replace_file_content.
// Actually creating a new file like `lib/maintenance-api.ts` is safer.

import { safeFetchJSON } from "./api";
import { API_URL } from "./constants";

export interface MaintenanceStore {
    name: string;
    code: string;
    branchName: string;
    brand: string;
}

export const fetchMaintenanceStores = async (branchName?: string): Promise<MaintenanceStore[]> => {
    let url = `${API_URL}/api/maintenance-stores`;
    if (branchName) {
        url += `?branchName=${encodeURIComponent(branchName)}`;
    }
    const res = (await safeFetchJSON(url)) as { success: boolean; data: MaintenanceStore[]; message?: string };
    if (!res.success) throw new Error(res.message || "Gagal mengambil data toko maintenance");
    return res.data;
};
