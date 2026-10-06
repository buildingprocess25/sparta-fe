"use client";

import React, { useState } from "react";
import {
  Layers,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PengajuanHargaItem } from "@/components/pengajuan-harga/types";

export interface DetailSpesifikasiProps {
  item: PengajuanHargaItem;
  className?: string;
  showHeader?: boolean;
  showCodes?: boolean;
  showDeskripsi?: boolean;
}

export function DetailSpesifikasi({
  item,
  className = "",
  showHeader = true,
  showCodes = false,
  showDeskripsi = true,
}: DetailSpesifikasiProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!item.deskripsiOtomatis) return;
    navigator.clipboard.writeText(item.deskripsiOtomatis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Field Spesifikasi Standar Sesuai TambahPengajuanModal & AHSP
  const specFields: { label: string; value?: string | number }[] = [
    { label: "Cabang Pengaju", value: item.cabang },
    { label: "Tanggal Pengajuan", value: item.tanggalPengajuan },
    { label: "Kategori Pekerjaan", value: item.kategori },
    { label: "Nama Material", value: item.item },
    { label: "Ukuran / Dimensi", value: item.ukuran },
    { label: "Merk / Brand", value: item.merk },
    { label: "Warna", value: item.warna },
    { label: "Tipe / Motif", value: item.tipe },
    { label: "Ketebalan", value: item.tebal },
    { label: "Finishing Permukaan", value: item.permukaan },
    { label: "Toleransi Presisi", value: item.toleransi },
    { label: "Implementasi / Posisi", value: item.implementasi },
    { label: "Lokasi / Area Gerai", value: item.lokasi },
    { label: "Informasi Tambahan", value: item.informasiTambahan },
  ];

  return (
    <div
      className={`border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* Header Kartu (Opsional, untuk tampilan halaman penuh) */}
      {showHeader && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 text-xs">
                  {item.kodeMaster || item.kode}
                </span>
                <span className="font-bold text-slate-900 text-base">
                  {item.item} {item.merk ? `- ${item.merk}` : ""}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.kategori} &bull; {item.implementasi} &bull; {item.lokasi}
                {item.ukuran ? ` \u2022 ${item.ukuran}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Konten Rincian Spesifikasi (Grid 12 Field & Deskripsi) */}
      <div className="p-4 sm:p-5 space-y-4 bg-white">
        {/* Header Internal jika showHeader false */}
          {!showHeader && (
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Spesifikasi Material
              </h3>
            </div>
          )}

          {/* Grid 12 Field Spesifikasi */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            {showCodes && (
              <>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Kode Item</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">
                    {item.kode || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Kode Master</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {item.kodeMaster || "-"}
                  </span>
                </div>
              </>
            )}

            {specFields.map((field, idx) => (
              <div key={idx}>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {field.label}
                </span>
                <span className="font-semibold text-slate-800 text-xs break-words">
                  {field.value || "-"}
                </span>
              </div>
            ))}
          </div>

          {/* Deskripsi Otomatis / Spesifikasi Lengkap */}
          {showDeskripsi && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Deskripsi</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 text-[11px] text-slate-500 hover:text-slate-800 px-2 gap-1 rounded-md"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed font-sans select-all">
                {item.deskripsiOtomatis || "-"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
