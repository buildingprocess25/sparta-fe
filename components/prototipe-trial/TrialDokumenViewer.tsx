// =============================================================================
// components/prototipe-trial/TrialDokumenViewer.tsx
// Komponen Pratinjau Dokumen Penerbitan Material Trial SPARTA (Format Cetak A4)
// Mengacu pada template resmi: dokumen-terbit.html
// =============================================================================

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import {
  TrialItem,
  KATEGORI_LAMPIRAN_TRIAL,
  JenisLampiranTrial,
  LampiranFileItem,
  generateNomorDokumenTrial,
} from "./types";
import { useTrialStore } from "./store";

interface TrialDokumenViewerProps {
  item: TrialItem;
  showPrintButton?: boolean;
}

const BULAN_INDO = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BULAN_PENDEK = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatTanggalPendek(dateStr?: string): string {
  if (!dateStr) return "12 Okt 2026";
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${BULAN_PENDEK[monthIdx]} ${year}`;
    }
  }
  return dateStr;
}

function formatTanggalPanjangDenganJam(dateStr?: string, defaultTime = "09.12"): string {
  if (!dateStr) return `12 Oktober 2026 pukul ${defaultTime}`;
  const [datePart, timePart] = dateStr.split(" ");
  const parts = datePart.split("-");
  const jam = timePart ? timePart.replace(":", ".") : defaultTime;
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${BULAN_INDO[monthIdx]} ${year} pukul ${jam}`;
    }
  }
  return `${dateStr} pukul ${jam}`;
}

function cleanPersonName(rawName?: string): string {
  if (!rawName) return "Bima Angkasa";
  return rawName.replace(/\s*\(.*?\)\s*/g, "").trim();
}

export function TrialDokumenViewer({
  item,
  showPrintButton = true,
}: TrialDokumenViewerProps) {
  const { items } = useTrialStore();
  const docNumber = generateNomorDokumenTrial(item, items);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return "Rp 0";
    return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Ekstraksi riwayat persetujuan untuk Lembar Persetujuan
  const submitLog = item.historyLog?.find((l) => l.action === "SUBMIT");
  const ppApproveLog = item.historyLog?.find(
    (l) => l.role.toLowerCase().includes("pp") && l.action === "APPROVE"
  );
  const regApproveLog = [...(item.historyLog || [])]
    .reverse()
    .find(
      (l) =>
        (l.role.toLowerCase().includes("regional") ||
          l.role.toLowerCase().includes("reg")) &&
        (l.action === "APPROVE" || l.action === "PROMOTE")
    );

  const hasCustomLampiranList = Boolean(
    item.lampiranMakerList && item.lampiranMakerList.length > 0
  );

  const getFilesByCategory = (key: JenisLampiranTrial): LampiranFileItem[] => {
    if (!item.lampiranMakerList) return [];
    return item.lampiranMakerList.filter((f) => f.jenisLampiran === key);
  };

  // Fallback jika item lama memiliki lampiranMakerList tanpa jenisLampiran
  const uncategorizedFiles = (item.lampiranMakerList || []).filter(
    (f) => !f.jenisLampiran
  );

  return (
    <div className="space-y-4 font-sans text-gray-800">
      {/* Top Action Toolbar (Disembunyikan saat print) */}
      {showPrintButton && (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl py-2.5 px-5 flex items-center justify-between shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D71920]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Dokumen Penerbitan Material Trial Resmi
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-[#D71920] hover:bg-red-700 text-white text-xs font-semibold gap-1.5 h-8 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF</span>
          </Button>
        </div>
      )}

      {/* Container Kertas A4 (Persis Template dokumen-terbit.html) */}
      <div className="print-container max-w-5xl mx-auto bg-white p-6 sm:p-8 shadow-md relative overflow-hidden border border-gray-200 print:shadow-none print:border-none print:max-w-full print:p-0">
        {/* Watermark Gedung di Tengah Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
          <svg
            className="w-96 h-96 text-gray-900"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z" />
            <path d="M7 10.19V18h2v-6h6v6h2v-7.81l-5-4.5z" opacity=".3" />
          </svg>
        </div>

        {/* Konten Utama (z-10 agar di atas watermark) */}
        <div className="relative z-10">
          {/* Header Banner Merah Alfamart */}
          <div
            className="bg-[#D71920] text-white rounded-md p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
          >
            <div className="flex items-center space-x-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://2bu0ndiveq.ufs.sh/f/PQUWrHtIDTYqYOQQZeRxTQaVnpKs7ZqdA5gtI96E8r20UbPm"
                alt="Logo Alfamart"
                width="150"
                height="55"
                style={{
                  display: "block",
                  borderRadius: "0.25rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,.1)",
                }}
              />
              <div className="h-10 border-l border-red-400"></div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider">SPARTA</h1>
                <p className="text-xs text-red-100">
                  Building &amp; Maintenance Development
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <h2 className="text-lg font-bold tracking-wide uppercase">
                Dokumen Penerbitan Material Trial
              </h2>
              <p className="text-sm text-red-100 mt-0.5">No. {docNumber}</p>
            </div>
          </div>

          {/* Section 1: Informasi Utama & Parameter Trial */}
          <div className="mb-6">
            <h3 className="text-[#D71920] font-bold text-base border-b-2 border-[#D71920] pb-1.5 mb-4">
              Informasi Utama Item
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
              {/* Baris 1 */}
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Kode / Item</span>
                <span className="col-span-2">
                  : <strong>{item.kode}</strong> - {item.item}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Tanggal Submit</span>
                <span className="col-span-2">
                  : {formatTanggalPendek(item.tanggalPengajuan)}
                </span>
              </div>

              {/* Baris 2 */}
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Kategori</span>
                <span className="col-span-2">: {item.kategori}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Diajukan Oleh</span>
                <span className="col-span-2">
                  : {cleanPersonName(item.makerNama)}
                </span>
              </div>

              {/* Baris 3 */}
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Cabang</span>
                <span className="col-span-2">: {item.cabang}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Durasi Uji Coba</span>
                <span className="col-span-2">
                  : {item.durasiBulan} Bulan ({item.durasiHari} Hari Kalender)
                </span>
              </div>

              {/* Baris 4 */}
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Bongkaran</span>
                <span className="col-span-2">
                  : {item.isTermasukBongkaran ? "Termasuk Bongkaran" : "Tanpa Bongkaran"}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Status Pengajuan</span>
                <span className="col-span-2 font-bold">: APPROVED</span>
              </div>

              {/* Baris 5 */}
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Harga Usulan</span>
                <span className="col-span-2 font-bold text-[#D71920] text-base">
                  : {formatRupiah(item.hargaTrialFinal || item.estimasiHargaMaker)} /{" "}
                  {item.satuan}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Alasan Trial</span>
                <span className="col-span-2">: {item.alasanTrial}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Spesifikasi Fisik Material */}
          <div className="mb-6">
            <div className="flex justify-between items-end border-b-2 border-[#D71920] pb-1.5 mb-4">
              <h3 className="text-[#D71920] font-bold text-base">
                Spesifikasi Material
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm mb-4">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Merk</span>
                <span className="col-span-2">: {item.merk || "-"}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Ukuran</span>
                <span className="col-span-2">: {item.ukuran || "-"}</span>
              </div>

              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Tipe</span>
                <span className="col-span-2">: {item.tipe || "-"}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Tebal</span>
                <span className="col-span-2">: {item.tebal || "-"}</span>
              </div>

              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Warna</span>
                <span className="col-span-2">: {item.warna || "-"}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Toleransi</span>
                <span className="col-span-2">: {item.toleransi || "-"}</span>
              </div>

              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Permukaan</span>
                <span className="col-span-2">: {item.permukaan || "-"}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Satuan</span>
                <span className="col-span-2">: {item.satuan || "-"}</span>
              </div>

              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Implementasi</span>
                <span className="col-span-2">: {item.implementasi || "-"}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Lokasi</span>
                <span className="col-span-2">: {item.lokasi || "-"}</span>
              </div>
            </div>

            {/* Box Deskripsi Standar Sistem */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Deskripsi:</p>
              <p className="text-xs font-mono text-gray-800 leading-relaxed">
                {item.deskripsiOtomatis}
              </p>
            </div>
          </div>

          {/* Section 3: Lampiran Berkas */}
          <div className="mb-6">
            <h3 className="text-[#D71920] font-bold text-base border-b-2 border-[#D71920] pb-1.5 mb-4">
              Lampiran Berkas
            </h3>
            <div className="space-y-2.5 text-sm">
              {KATEGORI_LAMPIRAN_TRIAL.map((kat, index) => {
                const catFiles = getFilesByCategory(kat.key);
                // Jika item lama belum punya kategori lampiran, petakan berkas pertama ke Katalog
                const fallbackFile =
                  !hasCustomLampiranList || catFiles.length === 0
                    ? index === 0 && uncategorizedFiles.length > 0
                      ? [uncategorizedFiles[0]]
                      : []
                    : [];
                const displayFiles = catFiles.length > 0 ? catFiles : fallbackFile;

                return (
                  <div key={kat.key} className="grid grid-cols-12 items-baseline">
                    <span className="col-span-4 sm:col-span-3 font-semibold text-gray-700">
                      {kat.docLabel}
                    </span>
                    <span className="col-span-8 sm:col-span-9">
                      :{" "}
                      {displayFiles.length > 0 ? (
                        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                          {displayFiles.map((file, idx) => (
                            <a
                              key={file.id || idx}
                              href={file.url || "#"}
                              target={
                                file.url && file.url !== "#" ? "_blank" : undefined
                              }
                              rel="noreferrer"
                              onClick={(e) => {
                                if (!file.url || file.url === "#") {
                                  e.preventDefault();
                                }
                              }}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {file.name || `Buka Berkas (${idx + 1})`}
                            </a>
                          ))}
                        </span>
                      ) : !hasCustomLampiranList ? (
                        // Default tampilan template untuk item simulasi bawaan
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {kat.key === "FOTO_ITEM"
                            ? "Buka PDF Foto Material & Lokasi"
                            : "Buka Berkas PDF"}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">
                          Tidak dilampirkan
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Lembar Persetujuan (Approval Chain) */}
          <div className="mb-8">
            <h3 className="text-[#D71920] font-bold text-base border-b-2 border-[#D71920] pb-1.5 mb-4">
              Lembar Persetujuan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
              {/* Card 1: Dibuat */}
              <div className="border border-gray-200 rounded-md overflow-hidden flex flex-col justify-between bg-white/90 shadow-xs">
                <div
                  className="bg-[#D71920] text-white font-bold text-xs py-2.5 uppercase tracking-wider"
                  style={{
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  Dibuat
                </div>
                <div className="p-4 my-2">
                  <p className="text-[11px] text-gray-500 italic mb-7">
                    {formatTanggalPanjangDenganJam(
                      submitLog?.tanggal || item.tanggalPengajuan,
                      "09.12"
                    )}
                  </p>
                  <p className="font-bold text-sm uppercase text-gray-900">
                    {cleanPersonName(item.makerNama).toUpperCase()}
                  </p>
                </div>
                <div className="border-t border-gray-200 py-2.5 px-2 bg-gray-50">
                  <p className="text-[11px] text-gray-600">
                    Inisiator Trial (Cabang {item.cabang})
                  </p>
                </div>
              </div>

              {/* Card 2: Mengetahui (PP Manager) */}
              <div className="border border-gray-200 rounded-md overflow-hidden flex flex-col justify-between bg-white/90 shadow-xs">
                <div
                  className="bg-[#D71920] text-white font-bold text-xs py-2.5 uppercase tracking-wider"
                  style={{
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  Mengetahui
                </div>
                <div className="p-4 my-2">
                  <p className="text-[11px] text-gray-500 italic mb-7">
                    {formatTanggalPanjangDenganJam(
                      ppApproveLog?.tanggal || item.tanggalPengajuan,
                      "10.00"
                    )}
                  </p>
                  <p className="font-bold text-sm uppercase text-gray-900">
                    {(ppApproveLog?.namaUser || "PP MANAGER").toUpperCase()}
                  </p>
                </div>
                <div className="border-t border-gray-200 py-2.5 px-2 bg-gray-50">
                  <p className="text-[11px] text-gray-600">PP Manager</p>
                </div>
              </div>

              {/* Card 3: Menyetujui (Regional Mgr) */}
              <div className="border border-gray-200 rounded-md overflow-hidden flex flex-col justify-between bg-white/90 shadow-xs">
                <div
                  className="bg-[#D71920] text-white font-bold text-xs py-2.5 uppercase tracking-wider"
                  style={{
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  Menyetujui
                </div>
                <div className="p-4 my-2">
                  <p className="text-[11px] text-gray-500 italic mb-7">
                    {formatTanggalPanjangDenganJam(
                      regApproveLog?.tanggal ||
                        item.trialStartDate ||
                        item.tanggalPengajuan,
                      "10.24"
                    )}
                  </p>
                  <p className="font-bold text-sm uppercase text-gray-900">
                    {(regApproveLog?.namaUser || "REGIONAL MGR").toUpperCase()}
                  </p>
                </div>
                <div className="border-t border-gray-200 py-2.5 px-2 bg-gray-50">
                  <p className="text-[11px] text-gray-600">B&amp;M Regional Manager</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
            Dokumen Resmi Sistem SPARTA &bull; PT Sumber Alfaria Trijaya Tbk
          </div>
        </div>
      </div>
    </div>
  );
}
