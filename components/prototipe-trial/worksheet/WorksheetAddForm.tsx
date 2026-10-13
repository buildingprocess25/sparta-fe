// =============================================================================
// components/prototipe-trial/worksheet/WorksheetAddForm.tsx
// Formulir Inline Penambahan Item Komponen Baru
// Menggunakan CreatableSelect dari react-select
// =============================================================================

"use client";

import React, { useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import type { StylesConfig } from "react-select";
import { Button } from "@/components/ui/button";
import {
  ComboBoxOption,
  UnitSelectOption,
  formatCurrencyInput,
  parseCurrencyInput,
  createUnitSelectStyles,
} from "./constants";

export interface CatalogSelectOption {
  label: string;
  value: string;
  unit: string;
  defaultPrice?: number;
}

interface WorksheetAddFormProps {
  title: string;
  catalogOptions: ComboBoxOption[];
  unitOptions: UnitSelectOption[];
  defaultUnit: string;
  focusColor?: string;
  onSave: (newItem: {
    label: string;
    unit: string;
    hargaAcuan: number;
    value: number;
  }) => void;
  onCancel: () => void;
}

export function WorksheetAddForm({
  title,
  catalogOptions,
  unitOptions,
  defaultUnit,
  focusColor = "#0284c7",
  onSave,
  onCancel,
}: WorksheetAddFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(defaultUnit);
  const [harga, setHarga] = useState<number | "">("");
  const [koef, setKoef] = useState("");

  const selectStyles = useMemo(
    () => createUnitSelectStyles(focusColor),
    [focusColor]
  );

  const nameSelectStyles = useMemo<StylesConfig<CatalogSelectOption, false>>(() => ({
    control: (base, state) => ({
      ...base,
      minHeight: "30px",
      height: "30px",
      borderRadius: "0.25rem",
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
      borderRadius: "0.375rem",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
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
  }), [focusColor]);

  const selectCatalogOptions = useMemo<CatalogSelectOption[]>(() => {
    return catalogOptions.map((opt) => ({
      label: opt.label,
      value: opt.label,
      unit: opt.unit,
      defaultPrice: opt.defaultPrice,
    }));
  }, [catalogOptions]);

  const currentOptionValue = useMemo<CatalogSelectOption | null>(() => {
    if (!name) return null;
    const found = selectCatalogOptions.find((opt) => opt.value === name);
    return found || { label: name, value: name, unit };
  }, [name, selectCatalogOptions, unit]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const finalHarga = typeof harga === "number" ? harga : 0;
    const finalKoef = parseFloat(koef) || 0;
    onSave({
      label: name.trim(),
      unit: unit.trim() || defaultUnit,
      hargaAcuan: finalHarga,
      value: finalKoef,
    });
  };

  return (
    <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/70 mb-3 space-y-3">
      <div className="text-xs font-semibold text-slate-800">{title}</div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        {/* Nama Item */}
        <div className="sm:col-span-5">
          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
            Nama Item <span className="text-red-500">*</span>
          </label>
          <CreatableSelect
            instanceId="add-form-name-select"
            styles={nameSelectStyles}
            options={selectCatalogOptions}
            value={currentOptionValue}
            onChange={(selected) => {
              if (selected) {
                setName(selected.value);
                if (selected.unit) setUnit(selected.unit);
                if (selected.defaultPrice) setHarga(selected.defaultPrice);
              } else {
                setName("");
              }
            }}
            formatOptionLabel={(opt) => (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-slate-800">{opt.label}</span>
                {opt.unit && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {opt.unit}
                    {opt.defaultPrice
                      ? ` • Rp ${opt.defaultPrice.toLocaleString("id-ID")}`
                      : ""}
                  </span>
                )}
              </div>
            )}
            formatCreateLabel={(val) => `Kustom: "${val}"`}
            placeholder="Pilih dari katalog atau ketik nama..."
            menuPosition="fixed"
          />
        </div>

        {/* Satuan (CreatableSelect) */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
            Satuan <span className="text-red-500">*</span>
          </label>
          <CreatableSelect
            instanceId="add-form-unit-select"
            styles={selectStyles}
            options={unitOptions}
            value={
              unit
                ? { label: unit, value: unit }
                : { label: defaultUnit, value: defaultUnit }
            }
            onChange={(selected) =>
              setUnit(selected ? selected.value : defaultUnit)
            }
            formatCreateLabel={(val) => `Gunakan "${val}"`}
            placeholder={defaultUnit}
            menuPosition="fixed"
          />
        </div>

        {/* Harga Acuan (Rp) */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
            Harga Acuan (Rp) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="0"
            value={formatCurrencyInput(harga)}
            onChange={(e) => setHarga(parseCurrencyInput(e.target.value))}
            className="border border-slate-300 rounded px-2.5 py-1.5 w-full text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          />
        </div>

        {/* Koefisien */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
            Koefisien <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.0001"
            placeholder="0.0000"
            value={koef}
            onChange={(e) => setKoef(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 w-full text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer h-8 px-3"
        >
          Simpan Komponen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs cursor-pointer h-8 px-3"
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
