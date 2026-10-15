"use client";

import React, { useMemo } from "react";
import { PengajuanHargaItem } from "./types";
import {
  Calculator,
  MessageSquare,
  TrendingUp,
  Store,
  Sparkles,
  CheckCircle2,
  Info,
} from "lucide-react";

interface ReviewNegosiasiKontraktorCardProps {
  item: PengajuanHargaItem;
  currentMarginUpah: number;
  currentMarginMaterial: number;
  currentMarginBongkaran: number;
  onApplyRecommendedMargin?: (margin: number) => void;
}

export function ReviewNegosiasiKontraktorCard({
  item,
  currentMarginUpah,
  currentMarginMaterial,
  currentMarginBongkaran,
  onApplyRecommendedMargin,
}: ReviewNegosiasiKontraktorCardProps) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Ekstraksi Log Penolakan Kontraktor Terakhir
  const lastRejectLog = useMemo(() => {
    const logs = item.historyLog || [];
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].role === "Kontraktor" && logs[i].action === "REJECT") {
        return logs[i];
      }
    }
    return null;
  }, [item.historyLog]);

  const alasanKontraktor =
    lastRejectLog?.catatan || "Tidak ada catatan alasan yang dilampirkan.";

  // 2. Data Survei 3 Toko BC
  const surveyTokoList = item.surveyToko || [];
  const toko1 = surveyTokoList[0] || null;
  const toko2 = surveyTokoList[1] || null;
  const toko3 = surveyTokoList[2] || null;

  const validSurveyPrices = [
    toko1?.hargaSatuan,
    toko2?.hargaSatuan,
    toko3?.hargaSatuan,
  ].filter((p): p is number => typeof p === "number" && p > 0);

  const hargaRataRataSurvei =
    item.hargaRataRata ||
    (validSurveyPrices.length > 0
      ? Math.round(
          validSurveyPrices.reduce((a, b) => a + b, 0) / validSurveyPrices.length
        )
      : 0);

  // 3. Hitung Angka Dasar per Komponen
  const upahDasar = useMemo(() => {
    if (!item.koefisienUpahItems?.length) return 0;
    return item.koefisienUpahItems.reduce((acc, curr) => {
      const val = Number(curr.value) || 0;
      const harga = Number(curr.hargaAcuan) || 0;
      return acc + Math.round(val * harga);
    }, 0);
  }, [item.koefisienUpahItems]);

  const materialDasar = useMemo(() => {
    if (!item.koefisienMaterialItems?.length) {
      if (!item.koefisienUpahItems?.length) {
        return item.estimasiHarga || item.hargaRataRata || 0;
      }
      return 0;
    }
    return item.koefisienMaterialItems.reduce((acc, curr) => {
      const val = Number(curr.value) || 0;
      const avg = curr.hargaSurveiRataRata || curr.hargaAcuan || 0;
      return acc + Math.round(val * Number(avg));
    }, 0);
  }, [
    item.koefisienMaterialItems,
    item.koefisienUpahItems,
    item.estimasiHarga,
    item.hargaRataRata,
  ]);

  const hasBongkaran = Boolean(
    item.isTermasukBongkaran && item.koefisienUpahBongkaranItems?.length
  );

  const bongkaranDasar = useMemo(() => {
    if (!hasBongkaran || !item.koefisienUpahBongkaranItems?.length) return 0;
    return item.koefisienUpahBongkaranItems.reduce((acc, curr) => {
      const val = Number(curr.value) || 0;
      const harga = Number(curr.hargaAcuan) || 0;
      return acc + Math.round(val * harga);
    }, 0);
  }, [hasBongkaran, item.koefisienUpahBongkaranItems]);

  const totalAngkaDasar = upahDasar + materialDasar + bongkaranDasar;

  // 4. Margin Sparta Eksisting (Lama)
  const marginUpahLama = item.marginUpah ?? 8;
  const marginMaterialLama = item.marginMaterial ?? 8;
  const marginBongkaranLama = item.marginBongkaran ?? item.marginUpah ?? 8;

  const nomMarginUpahLama = Math.round((upahDasar * marginUpahLama) / 100);
  const nomMarginMaterialLama = Math.round((materialDasar * marginMaterialLama) / 100);
  const nomMarginBongkaranLama = Math.round((bongkaranDasar * marginBongkaranLama) / 100);
  const totalNomMarginLama = nomMarginUpahLama + nomMarginMaterialLama + nomMarginBongkaranLama;

  const subtotalUpahLama = upahDasar + nomMarginUpahLama;
  const subtotalMaterialLama = hargaRataRataSurvei + nomMarginMaterialLama;
  const subtotalBongkaranLama = bongkaranDasar + nomMarginBongkaranLama;
  const totalHargaSpartaLama = subtotalUpahLama + subtotalMaterialLama + subtotalBongkaranLama;

  // 5. Usulan Kontraktor & Rekomendasi Margin
  const usulanKontraktor = item.usulanHargaKontraktor || totalHargaSpartaLama;
  const selisihNominalVsSparta = usulanKontraktor - totalHargaSpartaLama;
  const persentaseKenaikanVsSparta = totalHargaSpartaLama > 0
    ? Number(((selisihNominalVsSparta / totalHargaSpartaLama) * 100).toFixed(2))
    : 0;

  // Margin Rekomendasi Total terhadap Angka Dasar
  const totalSelisihVsDasar = usulanKontraktor - totalAngkaDasar;
  const rekomendasiMarginPersen = totalAngkaDasar > 0
    ? Number(((totalSelisihVsDasar / totalAngkaDasar) * 100).toFixed(2))
    : 0;

  // 6. KALKULASI REAL-TIME (Live Calculation berdasarkan margin yang sedang diatur S&B)
  const liveNomMarginUpah = Math.round((upahDasar * (currentMarginUpah || 0)) / 100);
  const liveNomMarginMaterial = Math.round((materialDasar * (currentMarginMaterial || 0)) / 100);
  const liveNomMarginBongkaran = Math.round((bongkaranDasar * (currentMarginBongkaran || 0)) / 100);

  const liveSubtotalUpah = upahDasar + liveNomMarginUpah;
  const liveSubtotalMaterial = materialDasar + liveNomMarginMaterial;
  const liveSubtotalBongkaran = bongkaranDasar + liveNomMarginBongkaran;

  const liveGrandTotalRaw = liveSubtotalUpah + liveSubtotalMaterial + liveSubtotalBongkaran;
  const liveGrandTotal = Math.ceil(liveGrandTotalRaw / 100) * 100;

  const liveSelisihVsKontraktor = liveGrandTotal - usulanKontraktor;
  const liveTotalMarginNominal = liveNomMarginUpah + liveNomMarginMaterial + liveNomMarginBongkaran;
  const liveMarginEfektif = totalAngkaDasar > 0
    ? Number(((liveTotalMarginNominal / totalAngkaDasar) * 100).toFixed(2))
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                Review Harga dari Kontraktor
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white">
                Usulan Kontraktor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kontraktor mengajukan usulan harga. Sesuaikan persentase margin.
            </p>
          </div>
        </div>

        {onApplyRecommendedMargin && (
          <button
            type="button"
            onClick={() => onApplyRecommendedMargin(rekomendasiMarginPersen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Terapkan Rekomendasi ({rekomendasiMarginPersen}%)</span>
          </button>
        )}
      </div>

      {/* Ringkasan Komparasi Harga */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">
            Harga Penawaran Sebelumnya
          </span>
          <div className="text-base font-bold font-mono text-slate-800">
            {formatRupiah(totalHargaSpartaLama)}
            <span className="text-[11px] font-normal text-slate-400 font-sans ml-1">
              / {item.satuan || "satuan"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Angka Dasar: {formatRupiah(totalAngkaDasar)} + Margin
          </span>
        </div>

        <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-orange-800 block">
            Usulan Harga Kontraktor
          </span>
          <div className="text-base font-black font-mono text-orange-950">
            {formatRupiah(usulanKontraktor)}
            <span className="text-[11px] font-normal text-orange-700 font-sans ml-1">
              / {item.satuan || "satuan"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-800">
            <TrendingUp className="w-3 h-3" />
            <span>
              {selisihNominalVsSparta >= 0 ? "+" : ""}
              {formatRupiah(selisihNominalVsSparta)} ({selisihNominalVsSparta >= 0 ? "+" : ""}
              {persentaseKenaikanVsSparta}%) dari penawaran lama
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              Alasan Penolakan Kontraktor
            </span>
            <p className="text-xs text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 line-clamp-3">
              &ldquo;{alasanKontraktor}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Rincian Survei 3 Toko (Survei BC) */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">
              Hasil Survei Harga
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Rata-Rata Survei:{" "}
            <strong className="text-blue-700 font-mono">
              {formatRupiah(hargaRataRataSurvei)}
            </strong>{" "}
            / {item.satuan || "satuan"}
          </div>
        </div>

        {validSurveyPrices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-500 font-medium block">Toko 1</span>
              <span className="font-semibold text-slate-800 block truncate" title={toko1?.namaToko || "Toko 1"}>
                {toko1?.namaToko || "Toko 1"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko1?.hargaSatuan)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-500 font-medium block">Toko 2</span>
              <span className="font-semibold text-slate-800 block truncate" title={toko2?.namaToko || "Toko 2"}>
                {toko2?.namaToko || "Toko 2"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko2?.hargaSatuan)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-500 font-medium block">Toko 3</span>
              <span className="font-semibold text-slate-800 block truncate" title={toko3?.namaToko || "Toko 3"}>
                {toko3?.namaToko || "Toko 3"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko3?.hargaSatuan)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
            Data 3 toko belum tercatat lengkap, menggunakan estimasi dasar acuan: {formatRupiah(materialDasar)} / {item.satuan || "satuan"}.
          </p>
        )}
      </div>

      {/* LIVE TRACKER PERHITUNGAN REAL-TIME */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-blue-900">
                {formatRupiah(liveGrandTotal)}
              </span>
              <span className="text-xs font-semibold text-blue-700">
                / {item.satuan || "satuan"}
              </span>
              <span className="text-xs text-slate-500">
                (Margin: <strong>{liveMarginEfektif}%</strong>)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-blue-200 text-xs">
            <div className="text-slate-600">
              <span className="text-[10px] text-slate-400 block font-medium">Selisih Harga Kontraktor</span>
              <strong className={`font-mono text-xs ${liveSelisihVsKontraktor === 0 ? "text-emerald-700" : liveSelisihVsKontraktor < 0 ? "text-amber-700" : "text-blue-700"}`}>
                {liveSelisihVsKontraktor > 0 ? "+" : ""}
                {formatRupiah(liveSelisihVsKontraktor)}
              </strong>
            </div>
            <span className="text-slate-300">|</span>
            <div className="text-[11px] text-slate-600 font-medium">
              {liveSelisihVsKontraktor === 0 ? (
                <span className="text-emerald-700 font-semibold">Tepat sesuai target usulan</span>
              ) : liveSelisihVsKontraktor < 0 ? (
                <span className="text-amber-800">Di bawah usulan ({formatRupiah(Math.abs(liveSelisihVsKontraktor))})</span>
              ) : (
                <span className="text-blue-800">Di atas usulan (+{formatRupiah(liveSelisihVsKontraktor)})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Rincian 3 Komponen: Angka Dasar, Margin Lama, Rekomendasi, & Hasil Real-Time */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Perbandingan Angka Dasar dan Margin Lama
          </span>
          <span className="text-[11px] text-slate-500">
            Satuan: {item.satuan || "unit"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Komponen Biaya</th>
                <th className="py-2.5 px-3 text-right">Angka Dasar (HPP)</th>
                <th className="py-2.5 px-3 text-right">Margin Lama</th>
                <th className="py-2.5 px-3 text-right">Subtotal Lama</th>
                <th className="py-2.5 px-3 text-right text-slate-600">
                  Rekomendasi
                </th>
                <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900">
                  Margin Baru
                </th>
                <th className="py-2.5 px-3.5 text-right bg-blue-50/50 text-blue-900">
                  Subtotal 
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Baris 1: Upah Tenaga Kerja */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3.5 font-medium text-slate-800">
                  A. Tenaga Kerja (Upah)
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatRupiah(upahDasar)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="font-semibold text-slate-700">{marginUpahLama}%</span>{" "}
                  <span className="text-slate-400 text-[10px]">({formatRupiah(nomMarginUpahLama)})</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                  {formatRupiah(subtotalUpahLama)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                  {rekomendasiMarginPersen}%
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-50/30 font-bold font-mono text-blue-700">
                  {currentMarginUpah}%
                </td>
                <td className="py-2.5 px-3.5 text-right bg-blue-50/30 font-mono text-slate-900 font-bold">
                  {formatRupiah(liveSubtotalUpah)}
                </td>
              </tr>

              {/* Baris 2: Bahan & Material */}
              <tr className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3.5 font-medium text-slate-800">
                  <div>
                    <span>B. Bahan &amp; Material</span>
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Mengacu pada Rata-Rata Survei: {formatRupiah(hargaRataRataSurvei)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatRupiah(hargaRataRataSurvei)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="font-semibold text-slate-700">{marginMaterialLama}%</span>{" "}
                  <span className="text-slate-400 text-[10px]">({formatRupiah(nomMarginMaterialLama)})</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                  {formatRupiah(subtotalMaterialLama)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                  {rekomendasiMarginPersen}%
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-50/30 font-bold font-mono text-blue-700">
                  {currentMarginMaterial}%
                </td>
                <td className="py-2.5 px-3.5 text-right bg-blue-50/30 font-mono text-slate-900 font-bold">
                  {formatRupiah(liveSubtotalMaterial)}
                </td>
              </tr>

              {/* Baris 3: Bongkaran (Kondisional) */}
              {hasBongkaran && (
                <tr className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">
                    C. Pekerjaan Bongkaran
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatRupiah(bongkaranDasar)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-semibold text-slate-700">{marginBongkaranLama}%</span>{" "}
                    <span className="text-slate-400 text-[10px]">({formatRupiah(nomMarginBongkaranLama)})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                    {formatRupiah(subtotalBongkaranLama)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {rekomendasiMarginPersen}%
                  </td>
                  <td className="py-2.5 px-3 text-right bg-blue-50/30 font-bold font-mono text-blue-700">
                    {currentMarginBongkaran}%
                  </td>
                  <td className="py-2.5 px-3.5 text-right bg-blue-50/30 font-mono text-slate-900 font-bold">
                    {formatRupiah(liveSubtotalBongkaran)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-200">
              <tr>
                <td className="py-3 px-3.5">TOTAL</td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatRupiah(totalAngkaDasar)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600">
                  {formatRupiah(totalNomMarginLama)}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatRupiah(totalHargaSpartaLama)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {rekomendasiMarginPersen}%
                </td>
                <td className="py-3 px-3 text-right bg-blue-100/60 font-mono text-blue-900 text-xs">
                  {liveMarginEfektif}%
                </td>
                <td className="py-3 px-3.5 text-right bg-blue-100/60 font-mono text-blue-900 text-sm">
                  {formatRupiah(liveGrandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
