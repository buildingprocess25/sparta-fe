// =============================================================================
// components/prototipe-trial/worksheet/WorksheetHpsSummary.tsx
// Ringkasan Akhir Kalkulasi HPS Trial (Rekomendasi Harga Satuan)
// Tema Light: Enterprise Clean, High-Contrast, WCAG AA Compliant
// =============================================================================

"use client";

import React from "react";
import { Calculator, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "./constants";

interface WorksheetHpsSummaryProps {
  satuan: string;
  totalUpahAkhir: number;
  marginUpah: number;
  totalMaterialAkhir: number;
  marginMaterial: number;
  totalBongkaranAkhir: number;
  marginBongkaran: number;
  isTermasukBongkaran?: boolean;
  grandTotalRounded: number;
  catatan: string;
  onCatatanChange: (val: string) => void;
  isEditable?: boolean;
  onSaveAll: () => void;
}

export function WorksheetHpsSummary({
  satuan,
  totalUpahAkhir,
  marginUpah,
  totalMaterialAkhir,
  marginMaterial,
  totalBongkaranAkhir,
  marginBongkaran,
  isTermasukBongkaran = false,
  grandTotalRounded,
  catatan,
  onCatatanChange,
  isEditable = false,
  onSaveAll,
}: WorksheetHpsSummaryProps) {
  return (
    <Card className="bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Ringkasan */}
      <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-200/80 text-slate-800 rounded-md">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                Rincian Harga Satuan Trial
              </h3>
              <p className="text-[11px] text-slate-500">
                Akumulasi upah tenaga kerja, material, serta pekerjaan bongkaran
              </p>
            </div>
          </div>

          <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-xs font-medium self-start sm:self-auto">
            Satuan: {satuan || "Unit"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* 4 Kartu Metrik Ringkasan (Tema Light) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Upah */}
          <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-100 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-sky-800 block font-semibold">
              Total Upah
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 block">
              {formatRupiah(totalUpahAkhir)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Termasuk margin {marginUpah}%
            </span>
          </div>

          {/* 2. Material */}
          <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-100 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-semibold">
              Total Material
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 block">
              {formatRupiah(totalMaterialAkhir)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Termasuk margin {marginMaterial}%
            </span>
          </div>

          {/* 3. Bongkaran */}
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-100 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-800 block font-semibold">
              Total Bongkaran
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 block">
              {isTermasukBongkaran
                ? formatRupiah(totalBongkaranAkhir)
                : "Rp 0 (Tidak Ada)"}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {isTermasukBongkaran
                ? `Termasuk margin ${marginBongkaran}%`
                : "Opsi tidak dipilih"}
            </span>
          </div>

          {/* 4. Grand Total Rekomendasi (Focal Point Light) */}
          <div className="p-3.5 rounded-lg bg-emerald-50 border-2 border-emerald-300 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-900 block font-bold">
              Total Akhir
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-950">
              {formatRupiah(grandTotalRounded)}
            </div>
          </div>
        </div>

        {/* Input Catatan & Aksi Simpan */}
        {isEditable && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Catatan
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => onCatatanChange(e.target.value)}
                placeholder="Tuliskan justifikasi penetapan koefisien atau dasar perhitungan harga acuan..."
                className="text-xs bg-white border-slate-300 text-slate-900 min-h-[60px] placeholder:text-slate-400 focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                onClick={onSaveAll}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2 shadow-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
