"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Save, ChevronDown, Check, Percent } from "lucide-react";
import {
  PengajuanHargaItem,
  KoefisienDetailItem,
} from "@/components/pengajuan-harga/types";
import CreatableSelect from "react-select/creatable";
// Standar Pilihan Combo Box
// =============================================================================
export const UPAH_UNIT_OPTIONS = [
  { label: "Oh", value: "Oh" },
  { label: "Hari", value: "Hari" },
  { label: "Bulan", value: "Bulan" },
  { label: "Ls", value: "Ls" },
];

export const MATERIAL_UNIT_OPTIONS = [
  { label: "Kg", value: "Kg" },
  { label: "M2", value: "M2" },
  { label: "M3", value: "M3" },
  { label: "M1", value: "M1" },
  { label: "Pcs", value: "Pcs" },
  { label: "Btg", value: "Btg" },
  { label: "Zak", value: "Zak" },
  { label: "Ltr", value: "Ltr" },
  { label: "Unit", value: "Unit" },
  { label: "Ls", value: "Ls" },
];

export const unitSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "28px",
    height: "28px",
    borderRadius: "0.25rem",
    borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
    fontSize: "12px",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": {
      borderColor: "#94a3b8",
    },
  }),
  menu: (base: any) => ({
    ...base,
    fontSize: "12px",
    zIndex: 50,
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 6px",
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "2px",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: "2px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0",
    padding: "0",
  }),
};
interface ComboBoxOption {
  label: string;
  unit: string;
  defaultPrice?: number;
}

const STANDAR_UPAH_OPTIONS: ComboBoxOption[] = [
  { label: "Pekerja", unit: "Oh", defaultPrice: 175000 },
  { label: "Tukang Batu", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Kayu", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Besi", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Cat", unit: "Oh", defaultPrice: 200000 },
  { label: "Tukang Las", unit: "Oh", defaultPrice: 220000 },
  { label: "Kepala Tukang", unit: "Oh", defaultPrice: 225000 },
  { label: "Mandor", unit: "Oh", defaultPrice: 245000 },
];

const STANDAR_MATERIAL_OPTIONS: ComboBoxOption[] = [
  { label: "Semen Portland (PC)", unit: "Kg" },
  { label: "Semen Instan / Mortar", unit: "sak" },
  { label: "Semen Pengisi Nat (Grouting)", unit: "Kg" },
  { label: "Pasir Pasang", unit: "m3" },
  { label: "Pasir Beton", unit: "m3" },
  { label: "Keramik / Granit Tile", unit: "m2" },
  { label: "Sealant Silikon / Hybrid", unit: "tube" },
  { label: "Cat Dasar Alkali", unit: "Kg" },
  { label: "Cat Tembok Penutup", unit: "Kg" },
  { label: "Thinner Super", unit: "liter" },
  { label: "Kawat Ikat Beton", unit: "Kg" },
  { label: "Paku Usuk", unit: "Kg" },
];

// =============================================================================
// Komponen Combo Box (Bisa Pilih Dropdown atau Ketik Custom)
// =============================================================================
function ComboBoxInput({
  value,
  onChange,
  onSelectOption,
  options,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectOption: (opt: ComboBoxOption) => void;
  options: ComboBoxOption[];
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter pilihan berdasarkan ketikan user
  const filtered = useMemo(() => {
    if (!value.trim()) return options;
    const q = value.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [value, options]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="border border-slate-300 rounded px-2.5 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 pr-7"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg py-1 text-xs">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  onSelectOption(opt);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <span className="font-medium text-slate-800">{opt.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {opt.unit}
                  {opt.defaultPrice
                    ? ` • Rp ${opt.defaultPrice.toLocaleString("id-ID")}`
                    : ""}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-slate-400 italic text-[11px]">
              Gunakan nama kustom: &quot;{value}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Props RincianKalkulasiKoefisien
// =============================================================================
export interface RincianKalkulasiKoefisienProps {
  item: PengajuanHargaItem;
  initialUpahItems?: KoefisienDetailItem[];
  initialUpahBongkaranItems?: KoefisienDetailItem[];
  initialMaterialItems?: KoefisienDetailItem[];
  initialMarginUpah?: number;
  initialMarginMaterial?: number;
  initialMarginBongkaran?: number;
  onMarginChange?: (marginUpah: number, marginMaterial: number, marginBongkaran: number) => void;
  onSave: (data: {
    upahItems: KoefisienDetailItem[];
    koefisienUpahBongkaranItems?: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah: number;
    marginMaterial: number;
    marginBongkaran?: number;
  }) => void;
  onBack?: () => void;
  userRole?: string;
  isReadOnly?: boolean;
}

export function RincianKalkulasiKoefisien({
  item,
  initialUpahItems,
  initialUpahBongkaranItems,
  initialMaterialItems,
  initialMarginUpah,
  initialMarginMaterial,
  initialMarginBongkaran,
  onMarginChange,
  onSave,
  onBack,
  userRole = "S&B Specialist",
  isReadOnly = false,
}: RincianKalkulasiKoefisienProps) {
  const formatCurrencyInput = (val?: string | number) => {
    if (val === "" || val === null || val === undefined) return "";
    const numericValue = val.toString().replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10));
  };

  const parseCurrencyInput = (val: string) => {
    if (!val) return "";
    return parseInt(val.replace(/[^0-9]/g, ""), 10) || "";
  };
  // Tab state untuk item bongkaran
  const [activeTab, setActiveTab] = useState<"pasangan" | "bongkaran">("pasangan");

  // State Komponen Upah & Material
  const [upahItems, setUpahItems] = useState<KoefisienDetailItem[]>(
    initialUpahItems || item.koefisienUpahItems || [],
  );
  const [upahBongkaranItems, setUpahBongkaranItems] = useState<KoefisienDetailItem[]>(
    initialUpahBongkaranItems || item.koefisienUpahBongkaranItems || [],
  );
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>(
    initialMaterialItems || item.koefisienMaterialItems || [],
  );

  // State 1 Margin Terpusat per Komponen (Default 8%)
  const [marginUpah, setMarginUpah] = useState<number | string>(
    initialMarginUpah ?? item.marginUpah ?? 8,
  );
  const [marginMaterial, setMarginMaterial] = useState<number | string>(
    initialMarginMaterial ?? item.marginMaterial ?? 8,
  );
  const [marginBongkaran, setMarginBongkaran] = useState<number | string>(
    initialMarginBongkaran ?? item.marginBongkaran ?? item.marginUpah ?? 8,
  );

  useEffect(() => {
    if (initialMarginUpah !== undefined) {
      setMarginUpah(initialMarginUpah);
    }
  }, [initialMarginUpah]);

  useEffect(() => {
    if (initialMarginMaterial !== undefined) {
      setMarginMaterial(initialMarginMaterial);
    }
  }, [initialMarginMaterial]);

  useEffect(() => {
    if (initialMarginBongkaran !== undefined) {
      setMarginBongkaran(initialMarginBongkaran);
    }
  }, [initialMarginBongkaran]);

  const parseMarginNumber = (val: number | string): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    const normalized = val.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleUpdateMarginUpah = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, "");
    setMarginUpah(cleaned);
    const num = parseMarginNumber(cleaned);
    const numMat = parseMarginNumber(marginMaterial);
    const numBong = parseMarginNumber(marginBongkaran);
    onMarginChange?.(num, numMat, numBong);
  };

  const handleBlurMarginUpah = () => {
    if (typeof marginUpah === "string") {
      const num = parseMarginNumber(marginUpah);
      setMarginUpah(num);
    }
  };

  const handleUpdateMarginMaterial = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, "");
    setMarginMaterial(cleaned);
    const num = parseMarginNumber(cleaned);
    const numUpah = parseMarginNumber(marginUpah);
    const numBong = parseMarginNumber(marginBongkaran);
    onMarginChange?.(numUpah, num, numBong);
  };

  const handleBlurMarginMaterial = () => {
    if (typeof marginMaterial === "string") {
      const num = parseMarginNumber(marginMaterial);
      setMarginMaterial(num);
    }
  };

  const handleUpdateMarginBongkaran = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, "");
    setMarginBongkaran(cleaned);
    const num = parseMarginNumber(cleaned);
    const numUpah = parseMarginNumber(marginUpah);
    const numMat = parseMarginNumber(marginMaterial);
    onMarginChange?.(numUpah, numMat, num);
  };

  const handleBlurMarginBongkaran = () => {
    if (typeof marginBongkaran === "string") {
      const num = parseMarginNumber(marginBongkaran);
      setMarginBongkaran(num);
    }
  };

  // State Form Tambah Upah Inline
  const [isAddingUpah, setIsAddingUpah] = useState(false);
  const [newUpahName, setNewUpahName] = useState("");
  const [newUpahUnit, setNewUpahUnit] = useState("Oh");
  const [newUpahHargaAcuan, setNewUpahHargaAcuan] = useState<number | "">("");
  const [newUpahVal, setNewUpahVal] = useState("");

  const [isAddingUpahBongkaran, setIsAddingUpahBongkaran] = useState(false);
  const [newUpahBongkaranName, setNewUpahBongkaranName] = useState("");
  const [newUpahBongkaranUnit, setNewUpahBongkaranUnit] = useState("Oh");
  const [newUpahBongkaranHargaAcuan, setNewUpahBongkaranHargaAcuan] = useState<number | "">("");
  const [newUpahBongkaranVal, setNewUpahBongkaranVal] = useState("");

  // State Form Tambah Material Inline
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState(item.satuan || "Kg");
  const [newMaterialVal, setNewMaterialVal] = useState("");

  // Format Rupiah Helper
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Kalkulasi Dasar Upah (Per Worker)
  const calculateWorkerSubtotal = (
    coef: string | number,
    harga: number | undefined,
  ) => {
    const c = typeof coef === "string" ? parseFloat(coef) || 0 : coef;
    const h = harga || 0;
    return Math.round(c * h);
  };

  // Total Dasar Upah
  const totalUpahDasar = useMemo(() => {
    return upahItems.reduce((acc, curr) => {
      return acc + calculateWorkerSubtotal(curr.value, curr.hargaAcuan);
    }, 0);
  }, [upahItems]);

  // Nilai Margin Upah (Rp)
  const nominalMarginUpah = useMemo(() => {
    const num = parseMarginNumber(marginUpah);
    return Math.round((totalUpahDasar * num) / 100);
  }, [totalUpahDasar, marginUpah]);

  // Total Upah Akhir (Dasar + Margin)
  const totalUpahAkhir = useMemo(() => {
    return totalUpahDasar + nominalMarginUpah;
  }, [totalUpahDasar, nominalMarginUpah]);

  // Kalkulasi Bongkaran
  const totalUpahBongkaranDasar = useMemo(() => {
    return upahBongkaranItems.reduce((acc, curr) => {
      return acc + calculateWorkerSubtotal(curr.value, curr.hargaAcuan);
    }, 0);
  }, [upahBongkaranItems]);

  const nominalMarginUpahBongkaran = useMemo(() => {
    const num = parseMarginNumber(marginBongkaran);
    return Math.round((totalUpahBongkaranDasar * num) / 100);
  }, [totalUpahBongkaranDasar, marginBongkaran]);

  const totalUpahBongkaranAkhir = useMemo(() => {
    return totalUpahBongkaranDasar + nominalMarginUpahBongkaran;
  }, [totalUpahBongkaranDasar, nominalMarginUpahBongkaran]);

  // Handlers Upah
  const handleUpahChange = (id: string, value: string) => {
    setUpahItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value } : it)),
    );
  };

  const handleUpahHargaChange = (id: string, hargaAcuan: number) => {
    setUpahItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hargaAcuan } : it)),
    );
  };

  const handleUpahBongkaranChange = (id: string, value: string) => {
    setUpahBongkaranItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value } : it)),
    );
  };

  const handleUpahBongkaranHargaChange = (id: string, hargaAcuan: number) => {
    setUpahBongkaranItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hargaAcuan } : it)),
    );
  };

  const handleConfirmAddUpahBongkaran = () => {
    if (!newUpahBongkaranName.trim()) return;
    const newId = `u-b-${Date.now()}`;
    const harga = typeof newUpahBongkaranHargaAcuan === "number" ? newUpahBongkaranHargaAcuan : 0;
    setUpahBongkaranItems((prev) => [
      ...prev,
      {
        id: newId,
        label: newUpahBongkaranName.trim(),
        value: newUpahBongkaranVal || "0.0000",
        unit: newUpahBongkaranUnit.trim() || "Oh",
        hargaAcuan: harga,
        isCustom: true,
      },
    ]);
    setNewUpahBongkaranName("");
    setNewUpahBongkaranUnit("Oh");
    setNewUpahBongkaranHargaAcuan("");
    setNewUpahBongkaranVal("");
    setIsAddingUpahBongkaran(false);
  };

  const handleDeleteUpahBongkaran = (id: string) => {
    setUpahBongkaranItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleConfirmAddUpah = () => {
    if (!newUpahName.trim()) return;
    const newId = `u-${Date.now()}`;
    const harga = typeof newUpahHargaAcuan === "number" ? newUpahHargaAcuan : 0;
    setUpahItems((prev) => [
      ...prev,
      {
        id: newId,
        label: newUpahName.trim(),
        value: newUpahVal || "0.0000",
        unit: newUpahUnit.trim() || "Oh",
        hargaAcuan: harga,
        isCustom: true,
      },
    ]);
    setNewUpahName("");
    setNewUpahUnit("Oh");
    setNewUpahHargaAcuan("");
    setNewUpahVal("");
    setIsAddingUpah(false);
  };

  const handleDeleteUpah = (id: string) => {
    setUpahItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Handlers Material
  const handleMaterialChange = (id: string, value: string) => {
    setMaterialItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value } : it)),
    );
  };

  const handleConfirmAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    const newId = `m-${Date.now()}`;
    setMaterialItems((prev) => [
      ...prev,
      {
        id: newId,
        label: newMaterialName.trim(),
        value: newMaterialVal || "0.0000",
        unit: newMaterialUnit.trim() || item.satuan || "Kg",
        isCustom: true,
      },
    ]);
    setNewMaterialName("");
    setNewMaterialUnit(item.satuan || "Kg");
    setNewMaterialVal("");
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterialItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSaveClick = () => {
    onSave({
      upahItems,
      koefisienUpahBongkaranItems: upahBongkaranItems,
      materialItems,
      marginUpah: parseMarginNumber(marginUpah),
      marginMaterial: parseMarginNumber(marginMaterial),
      marginBongkaran: parseMarginNumber(marginBongkaran),
    });
  };

  return (
    <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
      {/* Header Rincian */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
          <h2 className="text-gray-700 font-bold text-[13px] tracking-wide">
            RINCIAN KOEFISIEN
          </h2>
        </div>
        
        {/* Banner Khusus Mode Negosiasi Usulan Kontraktor */}
        {item.status === "USULAN_KONTRAKTOR" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 flex items-start gap-2.5 text-xs text-amber-900">
            <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Percent className="w-3 h-3 text-amber-700" />
            </div>
            <div>
              <span className="font-bold">Anda hanya dapat menyesuaikan persentase margin</span>{" "}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TABS (If Bongkaran)
          ========================================================================= */}
      {item?.isTermasukBongkaran && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mt-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "pasangan"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pasangan")}
          >
            Koefisien Pasangan
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "bongkaran"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("bongkaran")}
          >
            Koefisien Bongkaran
          </button>
        </div>
      )}

      <div className={activeTab === "pasangan" ? "block space-y-5" : "hidden"}>
        {/* =========================================================================
            A. KOMPONEN UPAH / TENAGA KERJA
            ========================================================================= */}
      <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-xs">
        {/* Header Upah & Margin Terpusat */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-blue-700 rounded-xs"></div>
            <h3 className="text-gray-800 font-bold text-xs tracking-wider">
              A. KOMPONEN UPAH
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Input 1 Margin Terpusat Upah (Hanya S&B Specialist) */}
            {userRole === "S&B Specialist" && (
              <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded">
                <span className="text-[11px] font-semibold text-amber-900">
                  Margin Upah:
                </span>
                <div className="relative w-20">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={marginUpah}
                    onChange={(e) => handleUpdateMarginUpah(e.target.value)}
                    onBlur={handleBlurMarginUpah}
                    placeholder="0"
                    className="w-full bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-bold text-amber-900 text-center pr-4.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <span className="absolute right-1 top-0.5 text-[10px] text-amber-600 font-bold">
                    %
                  </span>
                </div>
              </div>
            )}

            {/* Total Upah Akhir */}
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Total Upah: {formatRupiah(totalUpahAkhir)}
            </span>

            {/* Tombol Tambah */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsAddingUpah(true)}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            )}
          </div>
        </div>

        {/* Form Tambah Upah Inline dengan Combo Box */}
        {isAddingUpah && (
          <div className="mb-4 p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="flex-1 min-w-[170px]">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Nama Tenaga Kerja (Pilih / Ketik Kustom){" "}
                  <span className="text-red-500">*</span>
                </label>
                <ComboBoxInput
                  value={newUpahName}
                  onChange={setNewUpahName}
                  onSelectOption={(opt) => {
                    setNewUpahName(opt.label);
                    setNewUpahUnit(opt.unit);
                    if (opt.defaultPrice) {
                      setNewUpahHargaAcuan(opt.defaultPrice);
                    }
                  }}
                  options={STANDAR_UPAH_OPTIONS}
                  placeholder="Pilih atau ketik tenaga kerja..."
                  autoFocus
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Satuan
                </label>
                <CreatableSelect
                  styles={unitSelectStyles}
                  options={UPAH_UNIT_OPTIONS}
                  value={
                    newUpahUnit
                      ? { label: newUpahUnit, value: newUpahUnit }
                      : null
                  }
                  onChange={(selected: any) =>
                    setNewUpahUnit(selected ? selected.value : "Oh")
                  }
                  placeholder="Oh"
                />
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Harga Acuan (Rp)
                </label>
                <input
                  type="text"
                  placeholder="245.000"
                  value={formatCurrencyInput(newUpahHargaAcuan)}
                  onChange={(e) =>
                    setNewUpahHargaAcuan(
                      e.target.value === "" ? "" : parseCurrencyInput(e.target.value),
                    )
                  }
                  className="border border-slate-300 rounded px-2.5 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="w-28">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Koefisien <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={newUpahVal}
                  onChange={(e) => setNewUpahVal(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleConfirmAddUpah}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingUpah(false);
                    setNewUpahName("");
                    setNewUpahHargaAcuan("");
                    setNewUpahVal("");
                  }}
                  className="border border-slate-300 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid Upah / Empty State */}
        {upahItems.length === 0 && !isAddingUpah ? (
          <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-2">
              Belum ada komponen upah / tenaga kerja yang ditambahkan.
            </p>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsAddingUpah(true)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Komponen Upah
              </button>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${isReadOnly ? "pointer-events-none opacity-90" : ""}`}>
            {upahItems.map((u) => {
              const subtotalWorker = calculateWorkerSubtotal(
                u.value,
                u.hargaAcuan,
              );
              return (
                <div
                  key={u.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white shadow-2xs hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                      <span
                        className="text-xs font-bold text-gray-800 truncate"
                        title={u.label}
                      >
                        {u.label}
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUpah(u.id)}
                          className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1 rounded hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                          Harga Acuan (Rp)
                        </label>
                        <input
                          type="text"
                          value={formatCurrencyInput(u.hargaAcuan)}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleUpahHargaChange(
                              u.id,
                              parseCurrencyInput(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className={`border rounded px-2 py-1 w-full text-xs font-mono outline-none ${
                            isReadOnly
                              ? "bg-slate-50 border-gray-200 text-slate-600 cursor-not-allowed"
                              : "border-gray-200 text-slate-800 bg-white focus:border-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                          Koefisien ({u.unit})
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={u.value}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleUpahChange(u.id, e.target.value)
                          }
                          placeholder="0.0000"
                          className={`border rounded px-2 py-1 w-full text-xs font-mono outline-none ${
                            isReadOnly
                              ? "bg-slate-50 border-gray-200 text-slate-600 cursor-not-allowed"
                              : "border-gray-200 text-slate-800 bg-white focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Subtotal Dasar
                    </span>
                    <span className="font-mono font-semibold text-slate-700 text-xs">
                      {formatRupiah(subtotalWorker)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ringkasan Subtotal Upah + Margin */}
        {upahItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
            <div className="flex items-center gap-3 text-slate-600">
              <span>
                Dasar: <strong>{formatRupiah(totalUpahDasar)}</strong>
              </span>
              {userRole === "S&B Specialist" && (
                <>
                  <span>+</span>
                  <span>
                    Margin Upah ({typeof marginUpah === "number" ? Number(marginUpah.toFixed(2)) : marginUpah}%):{" "}
                    <strong className="text-amber-700">
                      {formatRupiah(nominalMarginUpah)}
                    </strong>
                  </span>
                </>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] mr-1.5">
                Total Upah (dengan Margin):
              </span>
              <strong className="text-blue-700 font-mono font-bold text-sm">
                {formatRupiah(totalUpahAkhir)}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          B. KOMPONEN BAHAN / MATERIAL & ALAT (Tanpa Harga, Survei BC)
          ========================================================================= */}
      <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-xs">
        {/* Header Material & Margin Terpusat */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-600 rounded-xs"></div>
            <h3 className="text-gray-800 font-bold text-xs tracking-wider">
              B. KOMPONEN MATERIAL &amp; ALAT
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Input 1 Margin Terpusat Material (Hanya S&B Specialist) */}
            {userRole === "S&B Specialist" && (
              <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded">
                <span className="text-[11px] font-semibold text-amber-900">
                  Margin Material:
                </span>
                <div className="relative w-20">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={marginMaterial}
                    onChange={(e) => handleUpdateMarginMaterial(e.target.value)}
                    onBlur={handleBlurMarginMaterial}
                    placeholder="0"
                    className="w-full bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-bold text-amber-900 text-center pr-4.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <span className="absolute right-1 top-0.5 text-[10px] text-amber-600 font-bold">
                    %
                  </span>
                </div>
              </div>
            )}

            {/* Badge Jumlah Komponen */}
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {materialItems.length} Komponen
            </span>

            {/* Tombol Tambah */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsAddingMaterial(true)}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            )}
          </div>
        </div>

        {/* Form Tambah Material Inline dengan Combo Box */}
        {isAddingMaterial && (
          <div className="mb-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <div className="flex-1 min-w-[170px]">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Nama Bahan / Alat (Pilih / Ketik Kustom){" "}
                  <span className="text-red-500">*</span>
                </label>
                <ComboBoxInput
                  value={newMaterialName}
                  onChange={setNewMaterialName}
                  onSelectOption={(opt) => {
                    setNewMaterialName(opt.label);
                    setNewMaterialUnit(opt.unit);
                  }}
                  options={STANDAR_MATERIAL_OPTIONS}
                  placeholder="Pilih atau ketik bahan/alat..."
                  autoFocus
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Satuan
                </label>
                <CreatableSelect
                  styles={unitSelectStyles}
                  options={MATERIAL_UNIT_OPTIONS}
                  value={
                    newMaterialUnit
                      ? { label: newMaterialUnit, value: newMaterialUnit }
                      : null
                  }
                  onChange={(selected: any) =>
                    setNewMaterialUnit(selected ? selected.value : "Kg")
                  }
                  placeholder="Kg"
                />
              </div>
              <div className="w-28">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Koefisien <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={newMaterialVal}
                  onChange={(e) => setNewMaterialVal(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleConfirmAddMaterial}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMaterial(false);
                    setNewMaterialName("");
                    setNewMaterialVal("");
                  }}
                  className="border border-slate-300 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid Material / Empty State */}
        {materialItems.length === 0 && !isAddingMaterial ? (
          <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-2">
              Belum ada komponen bahan / material &amp; alat yang ditambahkan.
            </p>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsAddingMaterial(true)}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Komponen Material
              </button>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${isReadOnly ? "pointer-events-none opacity-90" : ""}`}>
            {materialItems.map((m) => (
              <div
                key={m.id}
                className="border border-gray-200 rounded-lg p-3 bg-white shadow-2xs hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                    <span
                      className="text-xs font-bold text-gray-800 truncate"
                      title={m.label}
                    >
                      {m.label}
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                      Koefisien ({m.unit})
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={m.value}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        handleMaterialChange(m.id, e.target.value)
                      }
                      placeholder="0.0000"
                      className={`border rounded px-2 py-1 w-full text-xs font-mono outline-none ${
                        isReadOnly
                          ? "bg-slate-50 border-gray-200 text-slate-600 cursor-not-allowed"
                          : "border-gray-200 text-slate-800 bg-white focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[10px] text-slate-400">Harga Satuan:</span>
                  <span className="text-[10px] text-slate-600 italic">
                    Survei BC (3 Toko)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      </div>

      <div className={activeTab === "bongkaran" ? "block space-y-5" : "hidden"}>
        <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-amber-500 rounded-xs"></div>
              <h3 className="text-gray-800 font-bold text-xs tracking-wider">
                C. KOMPONEN UPAH BONGKARAN
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Input Margin Bongkaran (Hanya S&B Specialist) */}
              {userRole === "S&B Specialist" && (
                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded">
                  <span className="text-[11px] font-semibold text-amber-900">
                    Margin Bongkaran:
                  </span>
                  <div className="relative w-20">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={marginBongkaran}
                      onChange={(e) => handleUpdateMarginBongkaran(e.target.value)}
                      onBlur={handleBlurMarginBongkaran}
                      placeholder="0"
                      className="w-full bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-bold text-amber-900 text-center pr-4.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <span className="absolute right-1 top-0.5 text-[10px] text-amber-600 font-bold">
                      %
                    </span>
                  </div>
                </div>
              )}

              {/* Total Upah Bongkaran Akhir */}
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                Total Bongkaran: {formatRupiah(totalUpahBongkaranAkhir)}
              </span>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsAddingUpahBongkaran(true)}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              )}
            </div>
          </div>

          {isAddingUpahBongkaran && (
            <div className="mb-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg space-y-3">
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="flex-1 min-w-[170px]">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Nama Komponen Bongkaran <span className="text-red-500">*</span>
                  </label>
                  <ComboBoxInput
                    value={newUpahBongkaranName}
                    onChange={setNewUpahBongkaranName}
                    onSelectOption={(opt) => {
                      setNewUpahBongkaranName(opt.label);
                      setNewUpahBongkaranUnit(opt.unit);
                      setNewUpahBongkaranHargaAcuan(opt.defaultPrice || "");
                    }}
                    options={STANDAR_UPAH_OPTIONS}
                    placeholder="Pilih atau ketik komponen..."
                    autoFocus
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <CreatableSelect
                    styles={unitSelectStyles}
                    options={UPAH_UNIT_OPTIONS}
                    value={
                      newUpahBongkaranUnit
                        ? { label: newUpahBongkaranUnit, value: newUpahBongkaranUnit }
                        : null
                    }
                    onChange={(selected: any) =>
                      setNewUpahBongkaranUnit(selected ? selected.value : "Oh")
                    }
                    placeholder="Oh"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Harga Acuan (Rp)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatCurrencyInput(newUpahBongkaranHargaAcuan)}
                    onChange={(e) =>
                      setNewUpahBongkaranHargaAcuan(
                        e.target.value === "" ? "" : parseCurrencyInput(e.target.value),
                      )
                    }
                    className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Koefisien <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={newUpahBongkaranVal}
                    onChange={(e) => setNewUpahBongkaranVal(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleConfirmAddUpahBongkaran}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUpahBongkaran(false);
                      setNewUpahBongkaranName("");
                      setNewUpahBongkaranHargaAcuan("");
                      setNewUpahBongkaranVal("");
                    }}
                    className="border border-slate-300 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {upahBongkaranItems.length === 0 && !isAddingUpahBongkaran ? (
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
              <p className="text-xs text-gray-500 mb-2">
                Belum ada komponen upah bongkaran yang ditambahkan.
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsAddingUpahBongkaran(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Komponen Upah Bongkaran
                </button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${isReadOnly ? "pointer-events-none opacity-90" : ""}`}>
              {upahBongkaranItems.map((u) => {
                const workerSubtotal = calculateWorkerSubtotal(
                  u.value,
                  u.hargaAcuan,
                );
                return (
                  <div
                    key={u.id}
                    className="border border-gray-200 rounded-lg p-3 bg-white shadow-2xs hover:border-amber-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                        <span
                          className="text-xs font-bold text-gray-800 truncate"
                          title={u.label}
                        >
                          {u.label}
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUpahBongkaran(u.id)}
                            className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1 rounded hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                            Koefisien ({u.unit})
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={u.value}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              handleUpahBongkaranChange(u.id, e.target.value)
                            }
                            className={`border rounded px-2 py-1 w-full text-xs font-mono outline-none ${
                              isReadOnly
                                ? "bg-slate-50 border-gray-200 text-slate-600 cursor-not-allowed"
                                : "border-gray-200 text-slate-800 bg-white focus:border-amber-500"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                            Harga Acuan
                          </label>
                          <input
                            type="text"
                            value={formatCurrencyInput(u.hargaAcuan)}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              handleUpahBongkaranHargaChange(
                                u.id,
                                parseCurrencyInput(e.target.value) || 0,
                              )
                            }
                            placeholder="0"
                            className={`border rounded px-2 py-1 w-full text-xs font-mono outline-none ${
                              isReadOnly
                                ? "bg-slate-50 border-gray-200 text-slate-600 cursor-not-allowed"
                                : "border-gray-200 text-slate-800 bg-white focus:border-amber-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 mt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <strong className="text-gray-700 font-mono">
                        {formatRupiah(workerSubtotal)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {upahBongkaranItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs bg-gray-50/80 px-4 py-2.5 rounded-md border border-gray-100 flex-1 w-full md:w-auto overflow-x-auto">
                <div className="flex flex-col min-w-max">
                  <span className="text-slate-500 mb-1">Total Upah Bongkaran Dasar</span>
                  <strong className="text-gray-700 font-mono">
                    {formatRupiah(totalUpahBongkaranDasar)}
                  </strong>
                </div>
                {userRole === "S&B Specialist" && (
                  <>
                    <div className="text-gray-300 font-light text-lg px-2">+</div>
                    <div className="flex flex-col min-w-max">
                      <span className="text-slate-500 mb-1">
                        Nilai Margin Bongkaran ({typeof marginBongkaran === "number" ? Number(marginBongkaran.toFixed(2)) : marginBongkaran}%) (Rp)
                      </span>
                      <strong className="text-amber-700">
                        {formatRupiah(nominalMarginUpahBongkaran)}
                      </strong>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px] mr-1.5">
                  Total Upah Bongkaran (dengan Margin):
                </span>
                <strong className="text-amber-700 font-mono font-bold text-sm">
                  {formatRupiah(totalUpahBongkaranAkhir)}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          D. FOOTER / TOMBOL SIMPAN PERUBAHAN
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-500 italic">
          {item.status === "PENDING_SB_SPECIALIST" || item.status === "USULAN_KONTRAKTOR"
            ? "Margin yang disimpan akan otomatis memperbarui harga penawaran dan dikirimkan langsung ke Kontraktor."
            : item.isTrial
            ? "Koefisien & margin akan disimpan sebagai acuan perhitungan item trial."
            : "Koefisien akan menjadi acuan survei harga 3 toko oleh Building Coordinator."}
        </span>
        <div className="flex gap-3 self-end sm:self-auto">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Kembali
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {item.status === "PENDING_SB_SPECIALIST" || item.status === "USULAN_KONTRAKTOR"
                ? "Simpan & Kirim Ulang ke Kontraktor"
                : item.isTrial
                ? "Simpan"
                : "Simpan"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
