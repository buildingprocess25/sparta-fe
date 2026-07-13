/**
 * GANTT CHART DATE CALCULATOR - Frontend Version
 * 
 * Utility untuk menghitung tanggal efektif Gantt Chart dengan libur nasional 2026
 */

export type NationalHoliday = {
    date: string;
    dayOfWeek: string;
    description: string;
    affectsWorkday: boolean;
};

export const NATIONAL_HOLIDAYS_2026: NationalHoliday[] = [
    { date: "2026-01-01", dayOfWeek: "Kamis", description: "Tahun Baru 2026 Masehi", affectsWorkday: true },
    { date: "2026-01-16", dayOfWeek: "Jumat", description: "Isra Mikraj Nabi Muhammad SAW", affectsWorkday: true },
    { date: "2026-02-17", dayOfWeek: "Selasa", description: "Tahun Baru Imlek 2577 Kongzili", affectsWorkday: true },
    { date: "2026-03-19", dayOfWeek: "Kamis", description: "Hari Suci Nyepi", affectsWorkday: true },
    { date: "2026-03-21", dayOfWeek: "Sabtu", description: "Idulfitri 1447 H (Hari 1)", affectsWorkday: false },
    { date: "2026-03-22", dayOfWeek: "Minggu", description: "Idulfitri 1447 H (Hari 2)", affectsWorkday: false },
    { date: "2026-04-03", dayOfWeek: "Jumat", description: "Wafat Yesus Kristus", affectsWorkday: true },
    { date: "2026-04-05", dayOfWeek: "Minggu", description: "Kebangkitan Yesus Kristus", affectsWorkday: false },
    { date: "2026-05-01", dayOfWeek: "Jumat", description: "Hari Buruh Internasional", affectsWorkday: true },
    { date: "2026-05-14", dayOfWeek: "Kamis", description: "Kenaikan Yesus Kristus", affectsWorkday: true },
    { date: "2026-05-27", dayOfWeek: "Rabu", description: "Iduladha 1447 H", affectsWorkday: true },
    { date: "2026-05-31", dayOfWeek: "Minggu", description: "Hari Raya Waisak 2570 BE", affectsWorkday: false },
    { date: "2026-06-01", dayOfWeek: "Senin", description: "Hari Lahir Pancasila", affectsWorkday: true },
    { date: "2026-06-16", dayOfWeek: "Selasa", description: "1 Muharam Tahun Baru Islam 1448 H", affectsWorkday: true },
    { date: "2026-08-17", dayOfWeek: "Senin", description: "Proklamasi Kemerdekaan RI", affectsWorkday: true },
    { date: "2026-08-25", dayOfWeek: "Selasa", description: "Maulid Nabi Muhammad SAW", affectsWorkday: true },
    { date: "2026-12-25", dayOfWeek: "Jumat", description: "Hari Raya Natal", affectsWorkday: true }
];

export const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

export const isNationalHoliday = (date: Date): boolean => {
    const dateStr = toIsoDate(date);
    const holiday = NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStr);
    return holiday?.affectsWorkday ?? false;
};

export const isNonWorkingDay = (date: Date): boolean => {
    return isWeekend(date) || isNationalHoliday(date);
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const nextBusinessDayAfter = (date: Date): Date => {
    let current = addDays(date, 1);
    while (isNonWorkingDay(current)) {
        current = addDays(current, 1);
    }
    return current;
};

export const calculateEffectiveStDate = (spkEndDate: Date): {
    effectiveStDate: Date;
    skippedDays: number;
    skippedWeekends: number;
    skippedHolidays: number;
    explanation: string;
} => {
    let current = addDays(spkEndDate, 1);
    let skippedWeekends = 0;
    let skippedHolidays = 0;
    
    while (isNonWorkingDay(current)) {
        if (isWeekend(current)) {
            skippedWeekends++;
        } else if (isNationalHoliday(current)) {
            skippedHolidays++;
        }
        current = addDays(current, 1);
    }
    
    const totalSkipped = skippedWeekends + skippedHolidays;
    const parts: string[] = [];
    
    if (skippedWeekends > 0) {
        parts.push(`${skippedWeekends} weekend`);
    }
    if (skippedHolidays > 0) {
        parts.push(`${skippedHolidays} libur nasional`);
    }
    
    const explanation = parts.length > 0 
        ? `SPK+${totalSkipped} (${parts.join(", ")})`
        : "SPK (tidak ada skip)";
    
    return {
        effectiveStDate: current,
        skippedDays: totalSkipped,
        skippedWeekends,
        skippedHolidays,
        explanation
    };
};

export type GanttScheduleResult = {
    waktuMulai: string;
    waktuSelesai: string;
    durasiKalender: number;
    effectiveStDate: string;
    skippedDays: number;
    skippedWeekends: number;
    skippedHolidays: number;
    stLabel: string;
    holidaysInRange: NationalHoliday[];
};

export const calculateGanttSchedule = (
    waktuMulai: string | Date,
    durasi: number
): GanttScheduleResult => {
    const startDate = typeof waktuMulai === "string" ? new Date(waktuMulai) : waktuMulai;
    const spkEndDate = addDays(startDate, durasi - 1);
    const stInfo = calculateEffectiveStDate(spkEndDate);
    
    // Find holidays in range
    const holidaysInRange = NATIONAL_HOLIDAYS_2026.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startDate && holidayDate <= stInfo.effectiveStDate;
    });
    
    return {
        waktuMulai: toIsoDate(startDate),
        waktuSelesai: toIsoDate(spkEndDate),
        durasiKalender: durasi,
        effectiveStDate: toIsoDate(stInfo.effectiveStDate),
        skippedDays: stInfo.skippedDays,
        skippedWeekends: stInfo.skippedWeekends,
        skippedHolidays: stInfo.skippedHolidays,
        stLabel: stInfo.explanation,
        holidaysInRange
    };
};

export const formatDurasiWithSkip = (
    durasi: number,
    skippedDays: number,
    skippedWeekends: number,
    skippedHolidays: number
): string => {
    const parts: string[] = [`${durasi} hari SPK`];
    
    if (skippedDays > 0) {
        const skipParts: string[] = [];
        if (skippedWeekends > 0) {
            skipParts.push(`${skippedWeekends} weekend`);
        }
        if (skippedHolidays > 0) {
            skipParts.push(`${skippedHolidays} libur nasional`);
        }
        parts.push(`+ ${skippedDays} hari skip (${skipParts.join(", ")})`);
    }
    
    return parts.join(" ");
};

export const getHolidayInfo = (dateStr: string): NationalHoliday | undefined => {
    return NATIONAL_HOLIDAYS_2026.find(h => h.date === dateStr);
};
