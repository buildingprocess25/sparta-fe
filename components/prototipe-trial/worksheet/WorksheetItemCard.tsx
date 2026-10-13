// =============================================================================
// components/prototipe-trial/worksheet/WorksheetItemCard.tsx
// Kartu Satuan Item Komponen (Upah, Material, Bongkaran)
// Format 3-Kolom: Harga Acuan, Satuan (CreatableSelect), Koefisien, Subtotal
// =============================================================================

"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import CreatableSelect from "react-select/creatable";
import { KoefisienItem } from "../types";
import {
  UnitSelectOption,
  formatCurrencyInput,
  parseCurrencyInput,
  formatRupiah,
  createUnitSelectStyles,
} from "./constants";

interface WorksheetItemCardProps {
  item: KoefisienItem;
  isEditable?: boolean;
  unitOptions: UnitSelectOption[];
  focusColor?: string;
  onHargaChange: (id: string, harga: number) => void;
  onUnitChange: (id: string, unit: string) => void;
  onKoefChange: (id: string, koef: string) => void;
  onDelete: (id: string) => void;
}

export function WorksheetItemCard({
  item,
  isEditable = false,
  unitOptions,
  focusColor = "#0284c7",
  onHargaChange,
  onUnitChange,
  onKoefChange,
  onDelete,
}: WorksheetItemCardProps) {
  const subtotal = Math.round(item.value * item.hargaAcuan);
  const selectStyles = React.useMemo(
    () => createUnitSelectStyles(focusColor),
    [focusColor]
  );

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
          <span
            className="text-xs font-semibold text-slate-800 truncate"
            title={item.label}
          >
            {item.label}
          </span>
          {isEditable && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded hover:bg-red-50"
              title="Hapus baris ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-12 gap-2 items-end">
          {/* Kolom 1: Harga Acuan (Rp) */}
          <div className="col-span-5">
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Harga Acuan (Rp)
            </label>
            {isEditable ? (
              <input
                type="text"
                value={formatCurrencyInput(item.hargaAcuan)}
                onChange={(e) =>
                  onHargaChange(item.id, parseCurrencyInput(e.target.value))
                }
                className="border border-slate-200 rounded px-2 py-1 w-full text-xs text-slate-800 font-mono focus:border-slate-400 focus:outline-none"
              />
            ) : (
              <div className="text-xs font-mono font-medium text-slate-800 py-1">
                {formatCurrencyInput(item.hargaAcuan)}
              </div>
            )}
          </div>

          {/* Kolom 2: Satuan (CreatableSelect) */}
          <div className="col-span-3">
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Satuan
            </label>
            {isEditable ? (
              <CreatableSelect
                instanceId={`unit-select-${item.id}`}
                styles={selectStyles}
                options={unitOptions}
                value={
                  item.unit
                    ? { label: item.unit, value: item.unit }
                    : { label: "Oh", value: "Oh" }
                }
                onChange={(selected) =>
                  onUnitChange(item.id, selected ? selected.value : "Oh")
                }
                formatCreateLabel={(val) => `Gunakan "${val}"`}
                placeholder="Oh"
                menuPosition="fixed"
              />
            ) : (
              <div className="text-xs font-mono font-medium text-slate-700 py-1">
                {item.unit || "-"}
              </div>
            )}
          </div>

          {/* Kolom 3: Koefisien */}
          <div className="col-span-4">
            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
              Koefisien
            </label>
            {isEditable ? (
              <input
                type="number"
                step="0.0001"
                value={item.value}
                onChange={(e) => onKoefChange(item.id, e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 w-full text-xs text-slate-800 font-mono focus:border-slate-400 focus:outline-none"
              />
            ) : (
              <div className="text-xs font-mono font-medium text-slate-800 py-1">
                {item.value}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtotal Baris */}
      <div className="pt-2 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-500 font-medium">
          Subtotal Dasar
        </span>
        <span className="font-mono font-semibold text-slate-900 text-xs">
          {formatRupiah(subtotal)}
        </span>
      </div>
    </div>
  );
}
