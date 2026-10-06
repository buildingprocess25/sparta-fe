"use client";

import React, { useMemo } from "react";
import { KoefisienDetailItem } from "@/components/pengajuan-harga/types";
import { Plus } from "lucide-react";

export interface RingkasanBiayaMaterialProps {
  materialItems: KoefisienDetailItem[];
  totalBiayaMaterial?: number;
  margin?: number;
  marginMaterial?: number;
  className?: string;
  title?: string;
  formatRupiah?: (val?: number) => string;
}

export function RingkasanBiayaMaterial({
  materialItems,
  totalBiayaMaterial,
  margin,
  marginMaterial,
  className = "",
  title = "Ringkasan Biaya Material",
  formatRupiah: customFormatRupiah,
}: RingkasanBiayaMaterialProps) {
  const defaultFormatRupiah = (val?: number) => {
    if (!val || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatRupiah = customFormatRupiah || defaultFormatRupiah;

  const defaultMargin =
    margin !== undefined
      ? margin
      : marginMaterial !== undefined
        ? marginMaterial
        : 8;

  const getItemSubtotal = (m: KoefisienDetailItem) => {
    if (m.subtotal !== undefined && m.subtotal > 0) return m.subtotal;
    const avg = m.hargaSurveiRataRata || (m.hargaAcuan || 0);
    return Math.round((Number(m.value) || 0) * avg);
  };

  const getItemTotalWithMargin = (m: KoefisienDetailItem) => {
    const sub = getItemSubtotal(m);
    const itemMargin = m.margin !== undefined ? m.margin : defaultMargin;
    const nominalMargin = Math.round((sub * itemMargin) / 100);
    return sub + nominalMargin;
  };

  const calculatedTotal =
    totalBiayaMaterial !== undefined
      ? totalBiayaMaterial
      : materialItems.reduce((acc, curr) => acc + getItemSubtotal(curr), 0);

  const calculatedTotalWithMargin = useMemo(() => {
    if (materialItems.length > 0) {
      return materialItems.reduce(
        (acc, curr) => acc + getItemTotalWithMargin(curr),
        0
      );
    }
    const nominalMargin = Math.round((calculatedTotal * defaultMargin) / 100);
    return calculatedTotal + nominalMargin;
  }, [materialItems, calculatedTotal, defaultMargin]);

  return (
    <div
      className={`border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-2xs ${className}`}
    >
      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-[11px] text-slate-500 font-medium">
          {materialItems.length} Komponen
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2 px-3 text-center w-10">No</th>
              <th className="py-2 px-3">Nama Komponen</th>
              <th className="py-2 px-3 text-center">Koefisien</th>
              <th className="py-2 px-3 text-right">Rata-Rata</th>
              <th className="py-2 px-3 text-right whitespace-nowrap">
                Total Biaya Material
              </th>
              <th className="py-2 px-3 text-center w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {materialItems.map((m, idx) => {
              const stores = m.surveyToko || [];
              const validCount = stores.filter(
                (s) =>
                  s.namaToko?.trim() &&
                  s.alamatToko?.trim() &&
                  Number(s.hargaSatuan) > 0 &&
                  s.buktiSurveiUrl
              ).length;
              const isComplete = validCount === 3;
              const itemKey = m.id || `mat-${idx}`;
              const subtotal = getItemSubtotal(m);
              const totalWithMargin = getItemTotalWithMargin(m);

              return (
                <tr
                  key={itemKey}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {m.label}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {m.value} {m.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                    {formatRupiah(m.hargaSurveiRataRata || 0)} / {m.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                    {formatRupiah(subtotal)}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {isComplete ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                        3/3 Toko
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                        {validCount}/3 Toko
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-bold">
              <td colSpan={4} className="py-3 px-3 text-right text-slate-800 text-xs">
                Total Biaya:
              </td>
              <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                {formatRupiah(calculatedTotal)}
              </td>
              
              <td></td>
              <td></td>
            </tr>
            <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-bold">
              <td colSpan={4} className="py-3 px-3 text-right text-slate-800 text-xs">
               +Margin:
              </td>
              <td className="py-3 px-3 text-right font-mono text-sm text-red-600 whitespace-nowrap">
                {formatRupiah(calculatedTotalWithMargin)}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
