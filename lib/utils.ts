// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRupiah = (num: number) => {
    return "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

export const formatScore = (num: number) => {
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
};

export const parseCurrency = (value: any) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        if (value.includes('#REF!') || value.includes('Error')) return 0;
        const cleanStr = value.replace(/\./g, '').replace(/,/g, '.');
        const floatVal = parseFloat(cleanStr);
        return isNaN(floatVal) ? 0 : floatVal;
    }
    return 0;
};

export const parseScore = (value: any) => {
    if (!value) return 0;
    let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '.'));
    if (isNaN(num)) return 0;
    return num > 100 ? num / 100 : num;
};

export const getYearFromDate = (dateStr: string) => {
    if (!dateStr) return null;
    const match = dateStr.match(/\d{4}/);
    return match ? match[0] : null;
};