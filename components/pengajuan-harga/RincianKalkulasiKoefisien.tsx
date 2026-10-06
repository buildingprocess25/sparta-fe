"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Save, ChevronDown, Check, Percent } from "lucide-react";
import {
  PengajuanHargaItem,
  KoefisienDetailItem,
} from "@/components/pengajuan-harga/types";

// =============================================================================
// Standar Pilihan Combo Box
// =============================================================================
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
  initialMaterialItems?: KoefisienDetailItem[];
  initialMarginUpah?: number;
  initialMarginMaterial?: number;
  onSave: (data: {
    upahItems: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah: number;
    marginMaterial: number;
  }) => void;
  onBack?: () => void;
}

export function RincianKalkulasiKoefisien({
  item,
  initialUpahItems,
  initialMaterialItems,
  initialMarginUpah,
  initialMarginMaterial,
  onSave,
  onBack,
}: RincianKalkulasiKoefisienProps) {
  // State Komponen Upah & Material
  const [upahItems, setUpahItems] = useState<KoefisienDetailItem[]>(
    initialUpahItems || item.koefisienUpahItems || [],
  );
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>(
    initialMaterialItems || item.koefisienMaterialItems || [],
  );

  // State 1 Margin Terpusat per Komponen (Default 8%)
  const [marginUpah, setMarginUpah] = useState<number>(
    initialMarginUpah ?? item.marginUpah ?? 8,
  );
  const [marginMaterial, setMarginMaterial] = useState<number>(
    initialMarginMaterial ?? item.marginMaterial ?? 8,
  );

  // State Form Tambah Upah Inline
  const [isAddingUpah, setIsAddingUpah] = useState(false);
  const [newUpahName, setNewUpahName] = useState("");
  const [newUpahUnit, setNewUpahUnit] = useState("Oh");
  const [newUpahHargaAcuan, setNewUpahHargaAcuan] = useState<number | "">("");
  const [newUpahVal, setNewUpahVal] = useState("");

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
    return Math.round((totalUpahDasar * (marginUpah || 0)) / 100);
  }, [totalUpahDasar, marginUpah]);

  // Total Upah Akhir (Dasar + Margin)
  const totalUpahAkhir = useMemo(() => {
    return totalUpahDasar + nominalMarginUpah;
  }, [totalUpahDasar, nominalMarginUpah]);

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
      materialItems,
      marginUpah,
      marginMaterial,
    });
  };

  return (
    <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
      {/* Header Rincian */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
        <h2 className="text-gray-700 font-bold text-[13px] tracking-wide">
          RINCIAN KOEFISIEN
        </h2>
      </div>

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
            {/* Input 1 Margin Terpusat Upah */}
            <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded">
              <span className="text-[11px] font-semibold text-amber-900">
                Margin Upah:
              </span>
              <div className="relative w-14">
                <input
                  type="number"
                  value={marginUpah}
                  onChange={(e) =>
                    setMarginUpah(
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="w-full bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-bold text-amber-900 text-center pr-4 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute right-1 top-0.5 text-[10px] text-amber-600 font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Total Upah Akhir */}
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Total Upah: {formatRupiah(totalUpahAkhir)}
            </span>

            {/* Tombol Tambah */}
            <button
              type="button"
              onClick={() => setIsAddingUpah(true)}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
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
              <div className="w-20">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  placeholder="Oh"
                  value={newUpahUnit}
                  onChange={(e) => setNewUpahUnit(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Harga Acuan (Rp)
                </label>
                <input
                  type="number"
                  placeholder="245000"
                  value={newUpahHargaAcuan}
                  onChange={(e) =>
                    setNewUpahHargaAcuan(
                      e.target.value === "" ? "" : Number(e.target.value),
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
            <button
              type="button"
              onClick={() => setIsAddingUpah(true)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Komponen Upah
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      <button
                        type="button"
                        onClick={() => handleDeleteUpah(u.id)}
                        className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                          Harga Acuan (Rp)
                        </label>
                        <input
                          type="number"
                          value={u.hargaAcuan ?? ""}
                          onChange={(e) =>
                            handleUpahHargaChange(
                              u.id,
                              Number(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="border border-gray-200 rounded px-2 py-1 w-full text-xs text-slate-800 font-mono focus:border-blue-500 outline-none"
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
                          onChange={(e) =>
                            handleUpahChange(u.id, e.target.value)
                          }
                          placeholder="0.0000"
                          className="border border-gray-200 rounded px-2 py-1 w-full text-xs text-slate-800 font-mono focus:border-blue-500 outline-none"
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
              <span>+</span>
              <span>
                Margin Upah ({marginUpah}%):{" "}
                <strong className="text-amber-700">
                  {formatRupiah(nominalMarginUpah)}
                </strong>
              </span>
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
            {/* Input 1 Margin Terpusat Material */}
            <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1 rounded">
              <span className="text-[11px] font-semibold text-amber-900">
                Margin Material:
              </span>
              <div className="relative w-14">
                <input
                  type="number"
                  value={marginMaterial}
                  onChange={(e) =>
                    setMarginMaterial(
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="w-full bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-bold text-amber-900 text-center pr-4 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute right-1 top-0.5 text-[10px] text-amber-600 font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Badge Jumlah Komponen */}
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {materialItems.length} Komponen
            </span>

            {/* Tombol Tambah */}
            <button
              type="button"
              onClick={() => setIsAddingMaterial(true)}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
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
              <div className="w-20">
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  placeholder="Kg / m2"
                  value={newMaterialUnit}
                  onChange={(e) => setNewMaterialUnit(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            <button
              type="button"
              onClick={() => setIsAddingMaterial(true)}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Komponen Material
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1 rounded hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-slate-500 mb-0.5">
                      Koefisien ({m.unit})
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={m.value}
                      onChange={(e) =>
                        handleMaterialChange(m.id, e.target.value)
                      }
                      placeholder="0.0000"
                      className="border border-gray-200 rounded px-2 py-1 w-full text-xs text-slate-800 font-mono focus:border-emerald-500 outline-none"
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


      {/* =========================================================================
          D. FOOTER / TOMBOL SIMPAN PERUBAHAN
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-500 italic">
          {item.isTrial
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
              {item.isTrial
                ? "Simpan"
                : "Simpan"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
