const MONTHS_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const parseDateSafe = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateTimeId = (dateStr: string | null | undefined): string => {
    const date = parseDateSafe(dateStr);
    if (!date) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = MONTHS_ID[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${day} ${month} ${year} pukul ${hours}:${minutes}`;
};

export const formatDateId = (dateStr: string | null | undefined): string => {
    const date = parseDateSafe(dateStr);
    if (!date) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = MONTHS_ID[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
};
