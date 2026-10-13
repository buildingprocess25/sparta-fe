// =============================================================================
// components/prototipe-trial/worksheet/WorksheetSection.tsx
// Kontainer Seksi Kalkulasi (Upah, Material, Bongkaran)
// Terintegrasi: Header + Input Margin, Grid Kartu, Inline Form, Subtotal Footer
// =============================================================================

"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KoefisienItem } from "../types";
import { WorksheetItemCard } from "./WorksheetItemCard";
import { WorksheetAddForm } from "./WorksheetAddForm";
import {
  ComboBoxOption,
  UnitSelectOption,
  formatRupiah,
} from "./constants";

interface WorksheetSectionProps {
  sectionNumber: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBadge?: React.ReactNode;
  items: KoefisienItem[];
  margin: number;
  onMarginChange: (val: number) => void;
  isEditable?: boolean;
  catalogOptions: ComboBoxOption[];
  unitOptions: UnitSelectOption[];
  defaultUnit: string;
  focusColor?: string;
  addFormTitle: string;
  addBtnText: string;
  onItemHargaChange: (id: string, harga: number) => void;
  onItemUnitChange: (id: string, unit: string) => void;
  onItemKoefChange: (id: string, koef: string) => void;
  onItemDelete: (id: string) => void;
  onItemAdd: (newItem: {
    label: string;
    unit: string;
    hargaAcuan: number;
    value: number;
  }) => void;
}

export function WorksheetSection({
  sectionNumber,
  title,
  subtitle,
  icon,
  headerBadge,
  items,
  margin,
  onMarginChange,
  isEditable = false,
  catalogOptions,
  unitOptions,
  defaultUnit,
  focusColor = "#0284c7",
  addFormTitle,
  addBtnText,
  onItemHargaChange,
  onItemUnitChange,
  onItemKoefChange,
  onItemDelete,
  onItemAdd,
}: WorksheetSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Kalkulasi Subtotal Seksi
  const totalDasar = React.useMemo(() => {
    return items.reduce(
      (acc, curr) => acc + Math.round(curr.value * curr.hargaAcuan),
      0
    );
  }, [items]);

  const nominalMargin = React.useMemo(() => {
    return Math.round((totalDasar * (margin || 0)) / 100);
  }, [totalDasar, margin]);

  const totalAkhir = React.useMemo(() => {
    return totalDasar + nominalMargin;
  }, [totalDasar, nominalMargin]);

  return (
    <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-200/70 text-slate-800 rounded-md">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {sectionNumber}. {title}
                </CardTitle>
                {headerBadge}
              </div>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>

          {/* Input Margin Terintegrasi Langsung di Header Seksi */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto text-xs">
            <span className="text-[11px] font-medium text-slate-600">
              Margin:
            </span>
            {isEditable ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={margin}
                  onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
                  className="w-12 text-center font-semibold text-xs bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
                />
                <span className="text-xs font-semibold text-slate-600">%</span>
              </div>
            ) : (
              <Badge className="bg-slate-100 text-slate-800 text-[11px] font-mono font-semibold">
                {margin}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5">
        {/* Form Tambah Item Inline */}
        {isAdding && isEditable && (
          <WorksheetAddForm
            title={addFormTitle}
            catalogOptions={catalogOptions}
            unitOptions={unitOptions}
            defaultUnit={defaultUnit}
            focusColor={focusColor}
            onSave={(newItem) => {
              onItemAdd(newItem);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Grid Kartu Item */}
        {items.length === 0 && !isAdding ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-2">
              Belum ada komponen yang ditambahkan pada seksi ini.
            </p>
            {isEditable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {addBtnText}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {items.map((item) => (
              <WorksheetItemCard
                key={item.id}
                item={item}
                isEditable={isEditable}
                unitOptions={unitOptions}
                focusColor={focusColor}
                onHargaChange={onItemHargaChange}
                onUnitChange={onItemUnitChange}
                onKoefChange={onItemKoefChange}
                onDelete={onItemDelete}
              />
            ))}
          </div>
        )}

        {/* Tombol Tambah Item Inline */}
        {isEditable && !isAdding && items.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-dashed border-slate-300 w-full flex items-center justify-center gap-1.5 cursor-pointer py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addBtnText}</span>
          </Button>
        )}

        {/* Footer Subtotal Seksi & Margin */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-600 text-[11px]">
            <span>
              Dasar: <strong className="text-slate-800">{formatRupiah(totalDasar)}</strong>
            </span>
            <span>•</span>
            <span>
              Margin ({margin}%): <strong className="text-slate-800">{formatRupiah(nominalMargin)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 text-xs">
              Subtotal (+ Margin):
            </span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {formatRupiah(totalAkhir)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
