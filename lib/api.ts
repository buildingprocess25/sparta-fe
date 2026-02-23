import { API_URL } from './constants';

// 1. Cek Status Revisi
export const checkRevisionStatus = async (email: string, cabang: string) => {
    try {
        const res = await fetch(`${API_URL}/api/check_status?email=${encodeURIComponent(email)}&cabang=${encodeURIComponent(cabang)}`);
        if (!res.ok) throw new Error("Gagal merespon dari server");
        return await res.json();
    } catch (error) {
        console.error("API Error (checkRevisionStatus):", error);
        throw error;
    }
};

// 2. Ambil Data Harga Material/Upah
export const fetchPricesData = async (cabang: string, lingkup: string) => {
    try {
        const res = await fetch(`${API_URL}/get-data?cabang=${encodeURIComponent(cabang)}&lingkup=${encodeURIComponent(lingkup)}`);
        if (!res.ok) throw new Error("Gagal mengambil data harga dari server.");
        return await res.json();
    } catch (error) {
        console.error("API Error (fetchPricesData):", error);
        throw error;
    }
};

// 3. Submit Data RAB
export const submitRABData = async (payloadData: any) => {
    try {
        const res = await fetch(`${API_URL}/api/submit_rab`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadData),
        });
        const result = await res.json();
        
        if (!res.ok || result.status !== "success") {
            throw new Error(result.message || "Server error saat menyimpan data.");
        }
        return result;
    } catch (error) {
        console.error("API Error (submitRABData):", error);
        throw error;
    }
};

// 4. Ambil Data Gantt Chart
export const fetchGanttData = async (ulok: string, lingkup: string, isViewOnly: boolean = false) => {
    try {
        const cleanBaseUrl = API_URL.replace(/\/$/, "");
        
        // PENTING: Sekarang URL mengirimkan parameter &lingkup=...
        const url = `${cleanBaseUrl}/api/get_gantt_data?ulok=${encodeURIComponent(ulok)}&lingkup=${encodeURIComponent(lingkup)}${isViewOnly ? '&view=1' : ''}`;
        
        console.log("🔗 Mencoba fetch Gantt Data dari:", url); // Cek URL ini di Console jika error
        
        const res = await fetch(url);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gagal (Status ${res.status}): ${errText.substring(0, 100)}`);
        }
        return await res.json();
    } catch (error) {
        console.error("API Error (fetchGanttData):", error);
        throw error;
    }
};

// 5. Endpoint Simpan Gantt (Kontraktor)
export const insertGanttData = async (payload: any) => {
    const res = await fetch(`${API_URL}/api/gantt/insert`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
};

export const insertGanttDay = async (payload: any) => {
    const res = await fetch(`${API_URL}/api/gantt/day/insert`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
};

export const insertGanttDependency = async (payload: any) => {
    const res = await fetch(`${API_URL}/api/gantt/dependency/insert`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
};

// 6. Endpoint Update Keterlambatan (PIC)
export const savePicDelay = async (payload: any) => {
    const res = await fetch(`${API_URL}/api/gantt/day/keterlambatan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
};