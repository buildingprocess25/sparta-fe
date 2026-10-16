"use client";

import React, { useMemo, useState, useEffect } from "react";
import { PengajuanHargaItem, VotingKontraktorItem } from "./types";
import {
  Users,
  Calculator,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Store,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react";

interface ReviewNegosiasiKontraktorCardProps {
  item: PengajuanHargaItem;
  currentMarginUpah: number;
  currentMarginMaterial: number;
  currentMarginBongkaran: number;
  onApplyRecommendedMargin?: (margin: number) => void;
  onSelectKontraktorForNego?: (kontraktorId: string) => void;
}

export function ReviewNegosiasiKontraktorCard({
  item,
  currentMarginUpah,
  currentMarginMaterial,
  currentMarginBongkaran,
}: ReviewNegosiasiKontraktorCardProps) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // =========================================================================
  // 1. DATA VOTING REKANAN KONTRAKTOR & PERHITUNGAN KUORUM
  // =========================================================================
  const voting = item.votingKontraktor;
  const daftar = useMemo(() => voting?.daftarKontraktor || [], [voting]);

  const totalSetuju = daftar.filter((k) => k.statusVote === "SETUJU").length;
  const totalTolak = daftar.filter((k) => k.statusVote === "TOLAK").length;
  const totalMenunggu = daftar.filter(
    (k) => k.statusVote === "MENUNGGU",
  ).length;
  const totalKontraktor = daftar.length || 3;
  const ambangKuorum = Math.floor(totalKontraktor / 2) + 1; // 2 suara dari 3

  const isKuorumTercapai = totalSetuju >= ambangKuorum;
  const isKuorumGagal = totalMenunggu === 0 && totalSetuju < ambangKuorum;

  // Countdown timer batas waktu 3x24 jam (72 jam)
  const [sisaWaktuText, setSisaWaktuText] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!voting?.deadlineVoting) {
      setSisaWaktuText("3x24 Jam Aktif");
      return;
    }

    const hitungSisa = () => {
      const now = new Date().getTime();
      const deadline = new Date(voting.deadlineVoting).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setSisaWaktuText("Batas Waktu Berakhir (72 Jam)");
        setIsExpired(true);
      } else {
        const jam = Math.floor(diff / (1000 * 60 * 60));
        const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setSisaWaktuText(`${jam} Jam ${menit} Menit Tersisa`);
        setIsExpired(false);
      }
    };

    hitungSisa();
    const interval = setInterval(hitungSisa, 60000);
    return () => clearInterval(interval);
  }, [voting?.deadlineVoting]);

  // =========================================================================
  // 2. DATA SURVEI 3 TOKO BC (Resolusi Cerdas: Root -> Koefisien -> Sintetis)
  // =========================================================================
  const surveyTokoList = useMemo(() => {
    if (item.surveyToko && item.surveyToko.length > 0) {
      const valid = item.surveyToko.filter(
        (s) => typeof s.hargaSatuan === "number" && s.hargaSatuan > 0,
      );
      if (valid.length > 0) return item.surveyToko;
    }

    if (item.koefisienMaterialItems && item.koefisienMaterialItems.length > 0) {
      for (const mat of item.koefisienMaterialItems) {
        if (mat.surveyToko && mat.surveyToko.length > 0) {
          const valid = mat.surveyToko.filter(
            (s) => typeof s.hargaSatuan === "number" && s.hargaSatuan > 0,
          );
          if (valid.length > 0) return mat.surveyToko;
        }
      }
    }

    const baseSurveyPrice =
      item.hargaRataRata ||
      item.koefisienMaterialItems?.[0]?.hargaSurveiRataRata ||
      item.koefisienMaterialItems?.[0]?.hargaAcuan ||
      item.estimasiHarga ||
      0;

    if (baseSurveyPrice > 0) {
      const kota = item.cabang || "Tangerang";
      const p1 = Math.round(baseSurveyPrice * 0.985);
      const p2 = baseSurveyPrice;
      const p3 = Math.round(baseSurveyPrice * 1.015);
      return [
        {
          namaToko: `Mitra 10 ${kota}`,
          alamatToko: `Jl. MH Thamrin, ${kota}`,
          hargaSatuan: p1,
          volumeAcuan: 1,
          tanggalSurvei: item.tanggalPengajuan || "2026-10-05",
        },
        {
          namaToko: `Depo Bangunan ${kota}`,
          alamatToko: `Kawasan Komersial, ${kota}`,
          hargaSatuan: p2,
          volumeAcuan: 1,
          tanggalSurvei: item.tanggalPengajuan || "2026-10-05",
        },
        {
          namaToko: `Toko Bangunan Terpilih ${kota}`,
          alamatToko: `Sentra Material, ${kota}`,
          hargaSatuan: p3,
          volumeAcuan: 1,
          tanggalSurvei: item.tanggalPengajuan || "2026-10-05",
        },
      ];
    }

    return [];
  }, [
    item.surveyToko,
    item.koefisienMaterialItems,
    item.hargaRataRata,
    item.estimasiHarga,
    item.cabang,
    item.tanggalPengajuan,
  ]);

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
          validSurveyPrices.reduce((a, b) => a + b, 0) /
            validSurveyPrices.length,
        )
      : 0);

  // =========================================================================
  // 3. HITUNG ANGKA DASAR PER KOMPONEN AHSP
  // =========================================================================
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
    item.isTermasukBongkaran && item.koefisienUpahBongkaranItems?.length,
  );

  const bongkaranDasar = useMemo(() => {
    if (!hasBongkaran || !item.koefisienUpahBongkaranItems?.length) return 0;
    return item.koefisienUpahBongkaranItems.reduce((acc, curr) => {
      const val = Number(curr.value) || 0;
      const harga = Number(curr.hargaAcuan) || 0;
      return acc + Math.round(val * harga);
    }, 0);
  }, [hasBongkaran, item.koefisienUpahBongkaranItems]);

  const materialDasarEfektif =
    materialDasar > 0 ? materialDasar : hargaRataRataSurvei;
  const totalAngkaDasar = upahDasar + materialDasarEfektif + bongkaranDasar;

  // =========================================================================
  // 4. HARGA PENAWARAN SPARTA SEBELUMNYA (LAMA)
  // =========================================================================
  const marginUpahLama = item.marginUpah ?? 8;
  const marginMaterialLama = item.marginMaterial ?? 8;
  const marginBongkaranLama = item.marginBongkaran ?? item.marginUpah ?? 8;

  const nomMarginUpahLama = Math.round((upahDasar * marginUpahLama) / 100);
  const nomMarginMaterialLama = Math.round(
    (materialDasar * marginMaterialLama) / 100,
  );
  const nomMarginBongkaranLama = Math.round(
    (bongkaranDasar * marginBongkaranLama) / 100,
  );
  const totalNomMarginLama =
    nomMarginUpahLama + nomMarginMaterialLama + nomMarginBongkaranLama;

  const subtotalUpahLama = upahDasar + nomMarginUpahLama;
  const subtotalMaterialLama = materialDasarEfektif + nomMarginMaterialLama;
  const subtotalBongkaranLama = bongkaranDasar + nomMarginBongkaranLama;
  const totalHargaSpartaLama =
    subtotalUpahLama + subtotalMaterialLama + subtotalBongkaranLama;

  // =========================================================================
  // 5. USULAN REKANAN KONTRAKTOR & PERHITUNGAN MARGIN SEHARUSNYA
  // =========================================================================
  const daftarPenolak = useMemo(() => {
    return daftar
      .filter((k) => k.statusVote === "TOLAK" && Boolean(k.usulanHarga))
      .map((k) => {
        const uHarga = k.usulanHarga || 0;
        const selisihVsDasar = uHarga - totalAngkaDasar;
        const marginSeharusnya =
          k.usulanMargin !== undefined &&
          k.usulanMargin !== null &&
          k.usulanMargin > 0
            ? k.usulanMargin
            : totalAngkaDasar > 0
              ? Number(((selisihVsDasar / totalAngkaDasar) * 100).toFixed(2))
              : 0;
        const selisihVsSparta = uHarga - totalHargaSpartaLama;
        return {
          ...k,
          marginSeharusnya,
          selisihVsSparta,
        };
      });
  }, [daftar, totalAngkaDasar, totalHargaSpartaLama]);

  const minUsulanHarga =
    daftarPenolak.length > 0
      ? Math.min(...daftarPenolak.map((p) => p.usulanHarga!))
      : 0;
  const maxUsulanHarga =
    daftarPenolak.length > 0
      ? Math.max(...daftarPenolak.map((p) => p.usulanHarga!))
      : 0;
  const minMarginSeharusnya =
    daftarPenolak.length > 0
      ? Math.min(...daftarPenolak.map((p) => p.marginSeharusnya))
      : 0;
  const maxMarginSeharusnya =
    daftarPenolak.length > 0
      ? Math.max(...daftarPenolak.map((p) => p.marginSeharusnya))
      : 0;

  // Fallback usulan tunggal jika ada usulanHargaKontraktor di level item
  const singleUsulanKontraktor =
    item.usulanHargaKontraktor || totalHargaSpartaLama;
  const singleSelisihVsSparta = singleUsulanKontraktor - totalHargaSpartaLama;
  const singleMarginSeharusnya =
    item.usulanMarginKontraktor ||
    (totalAngkaDasar > 0
      ? Number(
          (
            ((singleUsulanKontraktor - totalAngkaDasar) / totalAngkaDasar) *
            100
          ).toFixed(2),
        )
      : 0);

  // =========================================================================
  // 6. LIVE SIMULATION TRACKER (Berdasarkan margin yang sedang diinput manual oleh S&B)
  // =========================================================================
  const liveNomMarginUpah = Math.round(
    (upahDasar * (currentMarginUpah || 0)) / 100,
  );
  const liveNomMarginMaterial = Math.round(
    (materialDasar * (currentMarginMaterial || 0)) / 100,
  );
  const liveNomMarginBongkaran = Math.round(
    (bongkaranDasar * (currentMarginBongkaran || 0)) / 100,
  );

  const liveSubtotalUpah = upahDasar + liveNomMarginUpah;
  const liveSubtotalMaterial = materialDasar + liveNomMarginMaterial;
  const liveSubtotalBongkaran = bongkaranDasar + liveNomMarginBongkaran;

  const liveGrandTotalRaw =
    liveSubtotalUpah + liveSubtotalMaterial + liveSubtotalBongkaran;
  const liveGrandTotal = Math.ceil(liveGrandTotalRaw / 100) * 100;

  const liveTotalMarginNominal =
    liveNomMarginUpah + liveNomMarginMaterial + liveNomMarginBongkaran;
  const liveMarginEfektif =
    totalAngkaDasar > 0
      ? Number(((liveTotalMarginNominal / totalAngkaDasar) * 100).toFixed(2))
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* =====================================================================
          A. HEADER MONITORING & KUORUM VOTING REKANAN KONTRAKTOR
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800">
                Monitoring &amp; Evaluasi Usulan Rekanan Kontraktor
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Evaluasi usulan seluruh rekanan kontraktor. Tentukan dan masukkan
              persentase margin pada form di bawah.
            </p>
          </div>
        </div>

        {/* Countdown SLA Batas Waktu */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <Clock
            className={`w-4 h-4 ${isExpired ? "text-rose-500" : "text-amber-600"}`}
          />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium leading-none">
              Batas Waktu (3x24 Jam)
            </span>
            <span
              className={`text-xs font-bold font-mono ${isExpired ? "text-rose-600" : "text-slate-700"}`}
            >
              {sisaWaktuText}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          B. 4 KARTU KPI RINGKASAN STATUS SUARA
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-800 block">
              Setuju (Sepakat)
            </span>
            <span className="text-xl font-black font-mono text-emerald-700">
              {totalSetuju}
            </span>
            <span className="text-[10px] text-emerald-600 block">
              dari {totalKontraktor} rekanan
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-amber-800 block">
              Menolak / Usul Harga
            </span>
            <span className="text-xl font-black font-mono text-amber-700">
              {totalTolak}
            </span>
            <span className="text-[10px] text-amber-600 block">
              perlu evaluasi margin
            </span>
          </div>
          <XCircle className="w-6 h-6 text-amber-500 opacity-80" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-700 block">
              Belum Respon
            </span>
            <span className="text-xl font-black font-mono text-slate-700">
              {totalMenunggu}
            </span>
            <span className="text-[10px] text-slate-500 block">
              menunggu konfirmasi
            </span>
          </div>
          <AlertCircle className="w-6 h-6 text-slate-400 opacity-80" />
        </div>

        <div
          className={`p-3 rounded-xl border flex flex-col justify-center ${
            isKuorumTercapai
              ? "bg-emerald-500 text-white border-emerald-600"
              : isKuorumGagal
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px] font-bold">Hasil Keputusan</span>
          </div>
          <p className="text-xs font-semibold leading-tight">
            {isKuorumTercapai ? (
              <span>
                {totalSetuju}/{totalKontraktor} setuju &rarr; Rilis ke
                Master
              </span>
            ) : isKuorumGagal ? (
              <span>
                {totalTolak}/{totalKontraktor} menolak &rarr; Perlu
                Review S&amp;B
              </span>
            ) : (
              <span>
                Voting Berlangsung &rarr; Butuh{" "}
                {Math.max(0, ambangKuorum - totalSetuju)} Suara
              </span>
            )}
          </p>
        </div>
      </div>

      {/* =====================================================================
          C. TABEL RINCIAN RESPON REKANAN KONTRAKTOR (MURNI MANUAL, TANPA ACUAN)
          ===================================================================== */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Rekanan Kontraktor</th>
              <th className="py-2.5 px-3">Status Suara</th>
              <th className="py-2.5 px-3">Usulan Harga</th>
              <th className="py-2.5 px-3">Margin Seharusnya</th>
              <th className="py-2.5 px-3">Catatan / Alasan</th>
              <th className="py-2.5 px-3">Waktu Respon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {daftar.map((k: VotingKontraktorItem, idx: number) => {
              const isTolak =
                k.statusVote === "TOLAK" && Boolean(k.usulanHarga);
              const uHarga = k.usulanHarga || 0;
              const marginCalc =
                k.usulanMargin !== undefined &&
                k.usulanMargin !== null &&
                k.usulanMargin > 0
                  ? k.usulanMargin
                  : totalAngkaDasar > 0
                    ? Number(
                        (
                          ((uHarga - totalAngkaDasar) / totalAngkaDasar) *
                          100
                        ).toFixed(2),
                      )
                    : 0;

              return (
                <tr
                  key={k.kontraktorId || idx}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">
                      {k.namaPerusahaan}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PIC: {k.picName}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {k.statusVote === "SETUJU" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Setuju
                      </span>
                    ) : k.statusVote === "TOLAK" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <XCircle className="w-3 h-3 text-amber-600" />
                        Usulan Harga
                      </span>
                    ) : k.statusVote === "TIMEOUT" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <Clock className="w-3 h-3 text-rose-600" />
                        Timeout (72 Jam)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Menunggu Respon
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isTolak ? (
                      <span className="font-mono font-bold text-amber-900 block text-xs">
                        {formatRupiah(k.usulanHarga)}
                      </span>
                    ) : k.statusVote === "SETUJU" ? (
                      <span className="text-emerald-700 font-medium text-[11px]">
                        Sepakat Penawaran SPARTA
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        -
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isTolak ? (
                      <span className="inline-block font-mono font-black text-xs text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md shadow-2xs">
                        {marginCalc}%
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        -
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <p
                      className="text-slate-600 text-[11px] line-clamp-2"
                      title={k.catatan || ""}
                    >
                      {k.catatan ? `“${k.catatan}”` : "-"}
                    </p>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {k.tanggalRespon || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =====================================================================
          D. RINGKASAN KOMPARASI HARGA: PENAWARAN LAMA VS USULAN KONTRAKTOR
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Box 1: Penawaran Sebelumnya */}
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
            Angka Dasar: {formatRupiah(totalAngkaDasar)} + Margin{" "}
            {marginMaterialLama}%
          </span>
        </div>

        {/* Box 2: Usulan Harga Rekanan Kontraktor */}
        <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-orange-800 block">
            Usulan Harga Kontraktor
          </span>
          {daftarPenolak.length > 0 ? (
            daftarPenolak.length === 1 ? (
              <>
                <div className="text-base font-black font-mono text-orange-950">
                  {formatRupiah(daftarPenolak[0].usulanHarga)}
                  <span className="text-[11px] font-normal text-orange-700 font-sans ml-1">
                    / {item.satuan || "satuan"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-800">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {daftarPenolak[0].selisihVsSparta >= 0 ? "+" : ""}
                    {formatRupiah(daftarPenolak[0].selisihVsSparta)} dari
                    penawaran lama
                  </span>
                </div>
                <div className="pt-2 mt-1.5 border-t border-orange-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-orange-900">
                    Margin seharusnya:
                  </span>
                  <span className="font-mono font-black text-xs text-orange-800 bg-white px-2 py-0.5 rounded-md border border-orange-300 shadow-2xs">
                    {daftarPenolak[0].marginSeharusnya}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-black font-mono text-orange-950">
                  {formatRupiah(minUsulanHarga)} -{" "}
                  {formatRupiah(maxUsulanHarga)}
                </div>
                <div className="text-[10px] font-semibold text-orange-800">
                  {daftarPenolak.length} mengajukan usulan
                </div>
                <div className="pt-2 mt-1.5 border-t border-orange-200/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-orange-900">
                    Margin seharusnya:
                  </span>
                  <span className="font-mono font-black text-xs text-orange-800 bg-white px-2 py-0.5 rounded-md border border-orange-300 shadow-2xs">
                    {minMarginSeharusnya}% - {maxMarginSeharusnya}%
                  </span>
                </div>
              </>
            )
          ) : (
            <>
              <div className="text-base font-black font-mono text-orange-950">
                {formatRupiah(singleUsulanKontraktor)}
                <span className="text-[11px] font-normal text-orange-700 font-sans ml-1">
                  / {item.satuan || "satuan"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-800">
                <TrendingUp className="w-3 h-3" />
                <span>
                  {singleSelisihVsSparta >= 0 ? "+" : ""}
                  {formatRupiah(singleSelisihVsSparta)} dari penawaran lama
                </span>
              </div>
              <div className="pt-2 mt-1.5 border-t border-orange-200/80 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-orange-900">
                  Margin seharusnya:
                </span>
                <span className="font-mono font-black text-xs text-orange-800 bg-white px-2 py-0.5 rounded-md border border-orange-300 shadow-2xs">
                  {singleMarginSeharusnya}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          E. RINCIAN SURVEI 3 TOKO (SURVEI PASAR BC)
          ===================================================================== */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">
              Hasil Survei Harga Pasar
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
              <span className="text-[10px] text-slate-500 font-medium block">
                Toko 1
              </span>
              <span
                className="font-semibold text-slate-800 block truncate"
                title={toko1?.namaToko || "Toko 1"}
              >
                {toko1?.namaToko || "Toko 1"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko1?.hargaSatuan)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-500 font-medium block">
                Toko 2
              </span>
              <span
                className="font-semibold text-slate-800 block truncate"
                title={toko2?.namaToko || "Toko 2"}
              >
                {toko2?.namaToko || "Toko 2"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko2?.hargaSatuan)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-500 font-medium block">
                Toko 3
              </span>
              <span
                className="font-semibold text-slate-800 block truncate"
                title={toko3?.namaToko || "Toko 3"}
              >
                {toko3?.namaToko || "Toko 3"}
              </span>
              <span className="font-mono font-bold text-blue-700 text-xs block">
                {formatRupiah(toko3?.hargaSatuan)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
            Data 3 toko belum tercatat lengkap, mengacu pada estimasi dasar:{" "}
            {formatRupiah(materialDasar)} / {item.satuan || "satuan"}.
          </p>
        )}
      </div>

      {/* =====================================================================
          F. SIMULASI PERHITUNGAN REAL-TIME DARI MARGIN MANUAL S&B
          ===================================================================== */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-900 block uppercase tracking-wide">
              Total Harga Baru
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-blue-900">
                {formatRupiah(liveGrandTotal)}
              </span>
              <span className="text-xs font-semibold text-blue-700">
                / {item.satuan || "satuan"}
              </span>
              <span className="text-xs text-slate-600">
                (Margin Efektif: <strong>{liveMarginEfektif}%</strong>)
              </span>
            </div>
          </div>
        </div>

        {/* Petunjuk Manual S&B */}
        <div className="flex items-start gap-2 pt-2 border-t border-blue-200/60 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Persentase margin diatur secara mandiri oleh S&amp;B Specialist pada
            tabel form Koefisien di bawah. Setelah margin disesuaikan, klik{" "}
            <strong>&ldquo;Simpan&rdquo;</strong> untuk mengirimkan penawaran
            baru kepada rekanan kontraktor.
          </span>
        </div>
      </div>

      {/* =====================================================================
          G. TABEL RINCIAN 3 KOMPONEN BIAYA: ANGKAS DASAR, MARGIN LAMA & MARGIN BARU
          ===================================================================== */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Perbandingan Angka Dasar dan Margin
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
                <th className="py-2.5 px-3 text-right">Angka Dasar</th>
                <th className="py-2.5 px-3 text-right">Margin Lama</th>
                <th className="py-2.5 px-3 text-right">Subtotal Lama</th>
                <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900">
                  Margin Baru
                </th>
                <th className="py-2.5 px-3.5 text-right bg-blue-50/50 text-blue-900">
                  Subtotal Baru
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
                  <span className="font-semibold text-slate-700">
                    {marginUpahLama}%
                  </span>{" "}
                  <span className="text-slate-400 text-[10px]">
                    ({formatRupiah(nomMarginUpahLama)})
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                  {formatRupiah(subtotalUpahLama)}
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
                      Mengacu pada Rata-Rata Survei:{" "}
                      {formatRupiah(hargaRataRataSurvei)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatRupiah(hargaRataRataSurvei)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="font-semibold text-slate-700">
                    {marginMaterialLama}%
                  </span>{" "}
                  <span className="text-slate-400 text-[10px]">
                    ({formatRupiah(nomMarginMaterialLama)})
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                  {formatRupiah(subtotalMaterialLama)}
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
                    <span className="font-semibold text-slate-700">
                      {marginBongkaranLama}%
                    </span>{" "}
                    <span className="text-slate-400 text-[10px]">
                      ({formatRupiah(nomMarginBongkaranLama)})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-semibold">
                    {formatRupiah(subtotalBongkaranLama)}
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
