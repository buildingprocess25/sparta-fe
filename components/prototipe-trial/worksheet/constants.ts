// =============================================================================
// components/prototipe-trial/worksheet/constants.ts
// Konstanta & Helper Perhitungan Lembar Kerja Koefisien Trial Sparta B&M
// Standar Desain: Anti-Slop (Industrial Clean, High Density, WCAG AA Compliant)
// =============================================================================

import type { StylesConfig } from "react-select";

export interface UnitSelectOption {
  label: string;
  value: string;
}

export interface ComboBoxOption {
  label: string;
  unit: string;
  defaultPrice?: number;
}

// Opsi Satuan Standar Alfamart
export const UPAH_UNIT_OPTIONS: UnitSelectOption[] = [
  { label: "Oh", value: "Oh" },
  { label: "Hari", value: "Hari" },
  { label: "Bulan", value: "Bulan" },
  { label: "Ls", value: "Ls" },
  { label: "Jam", value: "Jam" },
  { label: "Titik", value: "Titik" },
];

export const MATERIAL_UNIT_OPTIONS: UnitSelectOption[] = [
  { label: "m2", value: "m2" },
  { label: "m3", value: "m3" },
  { label: "Kg", value: "Kg" },
  { label: "sak", value: "sak" },
  { label: "tube", value: "tube" },
  { label: "liter", value: "liter" },
  { label: "ls", value: "ls" },
  { label: "Pcs", value: "Pcs" },
  { label: "Btg", value: "Btg" },
  { label: "Unit", value: "Unit" },
];

// Opsi Standar Tenaga Kerja S&B Alfamart
export const STANDAR_UPAH_OPTIONS: ComboBoxOption[] = [
  { label: "Pekerja Standar", unit: "Oh", defaultPrice: 175000 },
  { label: "Tukang Terampil / Pasang", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Batu", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Kayu", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Besi", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Cat", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Las", unit: "Oh", defaultPrice: 220000 },
  { label: "Kepala Tukang", unit: "Oh", defaultPrice: 225000 },
  { label: "Mandor Lapangan", unit: "Oh", defaultPrice: 245000 },
];

// Opsi Standar Material Pekerjaan S&B Alfamart
export const STANDAR_MATERIAL_OPTIONS: ComboBoxOption[] = [
  { label: "Material Utama (Sesuai Spek)", unit: "m2" },
  { label: "Semen Portland (PC)", unit: "Kg", defaultPrice: 1600 },
  { label: "Semen Instan / Mortar (Tile Adhesive)", unit: "sak", defaultPrice: 95000 },
  { label: "Semen Pengisi Nat (Tile Grouting)", unit: "Kg", defaultPrice: 18000 },
  { label: "Pasir Pasang", unit: "m3", defaultPrice: 320000 },
  { label: "Pasir Beton", unit: "m3", defaultPrice: 350000 },
  { label: "Sealant Silikon / Hybrid", unit: "tube", defaultPrice: 45000 },
  { label: "Cat Dasar Alkali", unit: "Kg", defaultPrice: 38000 },
  { label: "Alat Bantu & Perlengkapan Kerja", unit: "ls", defaultPrice: 5000 },
];

// Opsi Standar Pekerjaan Bongkaran Eksisting S&B Alfamart
export const STANDAR_BONGKARAN_OPTIONS: ComboBoxOption[] = [
  { label: "Pekerja Bongkaran Eksisting", unit: "Oh", defaultPrice: 165000 },
  { label: "Pembuangan Puing / Sisa Lapangan", unit: "ls", defaultPrice: 25000 },
  { label: "Mandor Pengawas Bongkaran", unit: "Oh", defaultPrice: 245000 },
];

// =============================================================================
// Helper Format & Parse Angka Ribuan
// =============================================================================
export const formatCurrencyInput = (val?: string | number): string => {
  if (val === "" || val === null || val === undefined) return "";
  const numericValue = val.toString().replace(/[^0-9]/g, "");
  if (!numericValue) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10));
};

export const parseCurrencyInput = (val: string): number => {
  if (!val) return 0;
  return parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
};

export const formatRupiah = (val?: number): string => {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

// =============================================================================
// Factory Styling React-Select (Creatable) Ringkas & Padat
// =============================================================================
export const createUnitSelectStyles = (
  focusColor: string = "#0284c7"
): StylesConfig<UnitSelectOption, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: "30px",
    height: "30px",
    borderRadius: "0.375rem",
    borderColor: state.isFocused ? focusColor : "#cbd5e1",
    fontSize: "12px",
    backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
    boxShadow: state.isFocused ? `0 0 0 1px ${focusColor}` : "none",
    "&:hover": {
      borderColor: "#94a3b8",
    },
  }),
  menu: (base) => ({
    ...base,
    fontSize: "12px",
    zIndex: 9999,
    minWidth: "110px",
    borderRadius: "0.375rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "2px",
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "2px",
  }),
  input: (base) => ({
    ...base,
    margin: "0",
    padding: "0",
  }),
});
