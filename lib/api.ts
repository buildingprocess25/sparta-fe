// --- GABUNGKAN IMPORT DI SINI (PALING ATAS) ---
import { API_URL, OPNAME_API_URL } from './constants';

// 1. Cek Status Revisi
export const checkRevisionStatus = async (email: string, cabang: string) => {
    try {
        const cleanBaseUrl = API_URL.replace(/\/$/, "");
        const endpoint = cleanBaseUrl.endsWith('/api') 
            ? `${cleanBaseUrl}/check_status` 
            : `${cleanBaseUrl}/api/check_status`;

        const res = await fetch(`${endpoint}?email=${encodeURIComponent(email)}&cabang=${encodeURIComponent(cabang)}`);
        
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gagal merespon dari server (Status ${res.status}): ${errText.substring(0, 100)}`);
        }
        
        return await res.json();
    } catch (error) {
        console.error("Error fetching revision status:", error);
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
export const fetchGanttData = async (ulok: string, lingkup: string) => {
    const cleanBaseUrl = API_URL.replace(/\/$/, "");
    const url = `${cleanBaseUrl}/api/get_gantt_data?ulok=${encodeURIComponent(ulok)}&lingkup=${encodeURIComponent(lingkup)}`;
    
    console.log("🔗 Fetching Gantt Data:", url);
    
    const res = await fetch(url);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gagal (Status ${res.status}): ${errText.substring(0, 100)}`);
    }
    
    return res.json();
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


// --- FUNGSI KEAMANAN FETCH GLOBAL ---
export const safeFetchJSON = async (url: string, options?: any) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || `Error Server (${res.status})`);
        }
        return res.json();
    } else {
        const text = await res.text();
        console.error("Server mengembalikan HTML/Teks:", text);
        throw new Error(`Endpoint salah atau tidak ditemukan (Status ${res.status}).`);
    }
};

// =========================================================
// 1. ENDPOINT SERVER OPNAME (Sesuai API_BASE_URL Anda)
// =========================================================

export const fetchOpnameStoreList = async (email: string, roleMode: 'pic' | 'kontraktor') => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    const endpoint = roleMode === 'pic' ? '/api/toko' : '/api/toko_kontraktor';
    return safeFetchJSON(`${cleanUrl}${endpoint}?username=${encodeURIComponent(email)}`);
};

export const fetchOpnameItems = async (kodeToko: string, ulok: string, lingkup: string) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/opname?kode_toko=${encodeURIComponent(kodeToko)}&no_ulok=${encodeURIComponent(ulok)}&lingkup=${encodeURIComponent(lingkup)}`);
};

export const fetchOpnamePending = async (kodeToko: string, ulok: string, lingkup: string) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/opname/pending?kode_toko=${encodeURIComponent(kodeToko)}&no_ulok=${encodeURIComponent(ulok)}&lingkup=${encodeURIComponent(lingkup)}`);
};

export const fetchOpnameHistory = async (kodeToko: string, ulok: string, lingkup: string) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/opname/final?kode_toko=${encodeURIComponent(kodeToko)}&no_ulok=${encodeURIComponent(ulok)}&lingkup=${encodeURIComponent(lingkup)}`);
};

// Pengaman 404: Mencegah layar putih jika data denda tidak ditemukan
export const fetchOpnamePenalty = async (ulok: string, lingkup: string) => {
    try {
        const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
        return await safeFetchJSON(`${cleanUrl}/api/cek_keterlambatan?no_ulok=${encodeURIComponent(ulok)}&lingkup_pekerjaan=${encodeURIComponent(lingkup)}`);
    } catch (err) {
        console.warn("Data denda kosong atau 404. Mengabaikan denda...", err);
        return { terlambat: false, hari_terlambat: 0 }; 
    }
};

export const uploadOpnameImage = async (formData: FormData) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error("Gagal mengunggah foto.");
    return res.json();
};

export const submitOpnameItem = async (payload: any) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/opname/item/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
};

export const actionOpnameItem = async (action: 'approve' | 'reject', payload: any) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/opname/${action}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
};

// =========================================================
// 2. ENDPOINT SPARTA UTAMA (Sesuai sparta-backend-5hdj...)
// =========================================================

export const checkStatusItemOpname = async (ulok: string, lingkup: string) => {
    try {
        const cleanUrl = API_URL.replace(/\/$/, "");
        return await safeFetchJSON(`${cleanUrl}/api/check_status_item_opname?no_ulok=${encodeURIComponent(ulok)}&lingkup_pekerjaan=${encodeURIComponent(lingkup)}`);
    } catch (err) {
        return { tanggal_opname_final: null };
    }
};

export const processSummaryOpname = async (payload: any) => {
    const cleanUrl = API_URL.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/process_summary_opname`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal memproses kalkulasi approval");
    }
    return res.json();
};

export const lockOpnameFinal = async (payload: any) => {
    const cleanUrl = API_URL.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/opname_locked`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal memfinalisasi jadwal.");
    return data;
};

// =========================================================
// 3. ENDPOINT PELENGKAP UNTUK CETAK PDF OPNAME
// =========================================================

export const fetchOpnameRabData = async (kodeToko: string, noUlok: string, lingkup: string) => {
    const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
    return safeFetchJSON(`${cleanUrl}/api/rab?kode_toko=${encodeURIComponent(kodeToko)}&no_ulok=${encodeURIComponent(noUlok)}&lingkup=${encodeURIComponent(lingkup)}`);
};

export const fetchPicList = async (noUlok: string, lingkup: string, kodeToko: string) => {
    try {
        const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
        const res = await fetch(`${cleanUrl}/api/pic-list?no_ulok=${encodeURIComponent(noUlok)}&lingkup=${encodeURIComponent(lingkup)}&kode_toko=${encodeURIComponent(kodeToko)}`);
        if(!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json.pic_list) ? json.pic_list : [];
    } catch(e) { return []; }
};

export const fetchPicKontraktorData = async (noUlok: string) => {
    try {
        const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
        const res = await fetch(`${cleanUrl}/api/pic-kontraktor?no_ulok=${encodeURIComponent(noUlok)}`);
        if(!res.ok) return { pic_username: "N/A", kontraktor_username: "N/A" };
        return await res.json();
    } catch(e) { return { pic_username: "N/A", kontraktor_username: "N/A" }; }
};

export const fetchPicKontraktorOpnameData = async (noUlok: string) => {
    try {
        const cleanUrl = OPNAME_API_URL.replace(/\/$/, "");
        const res = await fetch(`${cleanUrl}/api/pic-kontraktor-opname?no_ulok=${encodeURIComponent(noUlok)}`);
        if(!res.ok) return { pic_username: "N/A", kontraktor_username: "N/A", name: "" };
        return await res.json();
    } catch(e) { return { pic_username: "N/A", kontraktor_username: "N/A", name: "" }; }
};

// =========================================================
// 4. ENDPOINT INSTRUKSI LAPANGAN (IL) / RAB 2
// =========================================================

export const submitILData = async (formData: FormData) => {
    // IL mengarah ke sparta-backend (API_URL) bukan server opname
    const cleanUrl = API_URL.replace(/\/$/, ""); 
    const res = await fetch(`${cleanUrl}/api/submit_rab_kedua`, {
        method: "POST",
        body: formData,
    });
    const result = await res.json();
    if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Gagal mengirim data Instruksi Lapangan.");
    }
    return result;
};