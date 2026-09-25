"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import {
  PengajuanHargaItem,
  generateDeskripsiOtomatis,
  getKodeData,
} from "./types";
import { Sparkles, Copy, Check, AlertTriangle, RotateCcw } from "lucide-react";

export interface TambahPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PengajuanHargaItem) => void;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
  itemToEdit?: PengajuanHargaItem | null;
  initialMode?: 'BARU' | 'UPDATE';
}

// Opsi Awal untuk Creatable Combobox
const INITIAL_MATERIAL_OPTIONS = [
  "Keramik",
  "Granit",
  "Homogeneous Tile",
  "Keramik Dinding",
  "Vinyl",
  "Batu Alam",
  "Marmer",
  "Porselen",
];

const INITIAL_UKURAN_OPTIONS = [
  "60x60 cm",
  "30x30 cm",
  "40x40 cm",
  "60x120 cm",
  "80x80 cm",
  "20x20 cm",
  "30x60 cm",
  "15x60 cm",
  "100x100 cm",
];

const INITIAL_MERK_OPTIONS = [
  "Sandimas",
  "Roman",
  "Mosaic",
  "Toto",
  "KIA",
  "Inax",
];

const INITIAL_POSISI_OPTIONS = [
  "Dinding Gerai",
  "Lantai Gerai",
  "Dinding",
  "Lantai",
  "Area Teras Depan",
  "Plafon",
  "Tangga",
];

const INITIAL_AREA_OPTIONS = [
  "Area Teras Depan",
  "Sales Area",
  "Gudang",
  "Toilet",
  "Fascia Depan",
  "Area Parkir",
  "Back Office",
  "Dinding Area Depan",
  "Dinding Area Belakang",
];

export function TambahPengajuanModal({
  isOpen,
  onClose,
  onSubmit,
  nextIndex = 7,
  existingItems = [],
  itemToEdit = null,
  initialMode = "BARU",
}: TambahPengajuanModalProps) {
  // Mode Pengajuan: 'BARU' (input material baru) vs 'UPDATE' (pembaruan item yang ada untuk review ulang)
  const [pengajuanMode, setPengajuanMode] = useState<"BARU" | "UPDATE">("BARU");
  const [selectedExistingId, setSelectedExistingId] = useState<string>("");

  // Kelompok 1: Data Pokok Material
  const [kategori, setKategori] = useState("Pekerjaan Keramik");
  const [item, setItem] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [merk, setMerk] = useState("");

  // Kelompok 2: Fisik & Karakteristik (Permukaan sekarang input teks bebas)
  const [warna, setWarna] = useState("");
  const [tipe, setTipe] = useState("");
  const [permukaan, setPermukaan] = useState("");
  const [tebal, setTebal] = useState("");
  const [toleransi, setToleransi] = useState("");

  // Kelompok 3: Penempatan & Catatan
  const [implementasi, setImplementasi] = useState("Dinding Gerai");
  const [lokasi, setLokasi] = useState("");
  const [informasiTambahan, setInformasiTambahan] = useState("");
  const [estimasiHarga] = useState<string>("0");

  // Item aktif yang sedang diedit (bisa dari itemToEdit atau pilihan dropdown update)
  const activeItemBeingEdited = useMemo(() => {
    if (itemToEdit) return itemToEdit;
    if (pengajuanMode === "UPDATE" && selectedExistingId) {
      return existingItems.find((i) => i.id === selectedExistingId) || null;
    }
    return null;
  }, [itemToEdit, pengajuanMode, selectedExistingId, existingItems]);

  // Filter existing items agar item yang sedang diedit tidak bentrok dengan dirinya sendiri
  const filteredExistingItems = useMemo(() => {
    if (!activeItemBeingEdited) return existingItems;
    return existingItems.filter((i) => i.id !== activeItemBeingEdited.id);
  }, [existingItems, activeItemBeingEdited]);

  // Ambil catatan revisi terakhir dari S&B Specialist jika ada
  const latestCatatanRevisi = useMemo(() => {
    if (!activeItemBeingEdited?.historyLog) return null;
    const revLog = [...activeItemBeingEdited.historyLog]
      .reverse()
      .find((l) => l.action === "REVISE" || (l.role === "S&B Specialist" && l.catatan));
    return revLog?.catatan || null;
  }, [activeItemBeingEdited]);

  // Opsi Dinamis: Gabungan Opsi Awal + Data Yang Sudah Ada di Tabel
  const materialOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.item).filter(Boolean);
    return Array.from(new Set([...INITIAL_MATERIAL_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const ukuranOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.ukuran).filter(Boolean);
    return Array.from(new Set([...INITIAL_UKURAN_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const merkOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.merk).filter(Boolean);
    return Array.from(new Set([...INITIAL_MERK_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const posisiOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.implementasi).filter(Boolean);
    return Array.from(new Set([...INITIAL_POSISI_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const areaOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.lokasi).filter(Boolean);
    return Array.from(new Set([...INITIAL_AREA_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  // Pembedaan Jelas: Kode Item (SIP-001) vs Kode Master Item (SIP-001-A-Keramik-60x60)
  const [kodeItem, setKodeItem] = useState(
    `SIP-${String(nextIndex).padStart(3, "0")}`,
  );
  const [kodeArea, setKodeArea] = useState("A");
  const [kodeMaster, setKodeMaster] = useState("");
  const [isKodeMasterManual, setIsKodeMasterManual] = useState(false);

  // Pratinjau Deskripsi Otomatis & Status Salin
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState("");
  const [copied, setCopied] = useState(false);

  // Perhitungan 2-Tier: Kode SIP (Parent Scope) & Varian Huruf (A, B, C...) + Deteksi Duplikasi
  const kodeData = useMemo(() => {
    return getKodeData({
      kategori,
      item,
      implementasi,
      lokasi,
      ukuran,
      merk,
      warna,
      tipe,
      permukaan,
      tebal,
      toleransi,
      nextIndex,
      existingItems: filteredExistingItems,
    });
  }, [
    kategori,
    item,
    implementasi,
    lokasi,
    ukuran,
    merk,
    warna,
    tipe,
    permukaan,
    tebal,
    toleransi,
    nextIndex,
    filteredExistingItems,
  ]);

  // Status Duplikat: Hanya true jika seluruh kombinasi spesifikasi persis sama dengan varian yang sudah ada
  const isDuplicate = kodeData.isDuplicate;

  // Sinkronisasi otomatis Kode Item dan Kode Master Item
  useEffect(() => {
    setKodeItem(kodeData.kodeItem);
    setKodeArea(kodeData.kodeArea);

    if (!isKodeMasterManual) {
      setKodeMaster(kodeData.kodeMaster);
    }
  }, [kodeData, isKodeMasterManual]);

  // Auto-generate deskripsi lengkap
  useEffect(() => {
    const desc = generateDeskripsiOtomatis({
      item,
      ukuran,
      merk,
      warna,
      tipe,
      permukaan,
      lokasi,
      implementasi,
    });
    setDeskripsiOtomatis(desc);
  }, [
    item,
    ukuran,
    merk,
    warna,
    tipe,
    permukaan,
    lokasi,
    informasiTambahan,
    implementasi,
  ]);

  const handleCopyDescription = async () => {
    if (!deskripsiOtomatis) return;
    try {
      await navigator.clipboard.writeText(deskripsiOtomatis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleReset = () => {
    setItem("");
    setUkuran("");
    setMerk("");
    setWarna("");
    setTipe("");
    setPermukaan("");
    setTebal("");
    setToleransi("");
    setImplementasi("Dinding Gerai");
    setLokasi("");
    setInformasiTambahan("");
    setIsKodeMasterManual(false);
  };

  const populateForm = (target: PengajuanHargaItem) => {
    setKategori(target.kategori || "Pekerjaan Keramik");
    setItem(target.item || "");
    setUkuran(target.ukuran || "");
    setMerk(target.merk || "");
    setWarna(target.warna || "");
    setTipe(target.tipe || "");
    setPermukaan(target.permukaan || "");
    setTebal(target.tebal || "");
    setToleransi(target.toleransi || "");
    setImplementasi(target.implementasi || "Dinding Gerai");
    setLokasi(target.lokasi || "");
    setInformasiTambahan(target.informasiTambahan || "");
    setKodeItem(target.kode || "");
    setKodeMaster(target.kodeMaster || "");
    setIsKodeMasterManual(false);
  };

  // Reset form atau isi dengan item jika mode revisi/update
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setPengajuanMode("UPDATE");
        setSelectedExistingId(itemToEdit.id);
        populateForm(itemToEdit);
      } else {
        const mode = initialMode || "BARU";
        setPengajuanMode(mode);
        setSelectedExistingId("");
        handleReset();
      }
    }
  }, [isOpen, itemToEdit, initialMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Blokir jika duplikat data sudah ada
    if (isDuplicate) {
      return;
    }

    // Validasi semua field wajib diisi (required)
    if (
      !kategori.trim() ||
      !item.trim() ||
      !ukuran.trim() ||
      !merk.trim() ||
      !tipe.trim() ||
      !warna.trim() ||
      !permukaan.trim() ||
      !tebal.trim() ||
      !toleransi.trim() ||
      !implementasi.trim() ||
      !lokasi.trim() ||
      !kodeMaster.trim()
    ) {
      return;
    }

    const finalKodeItem = kodeItem.trim() || kodeData.kodeItem;
    const finalKodeMaster = kodeMaster.trim() || kodeData.kodeMaster;

    const isUpdateMode = Boolean(activeItemBeingEdited);

    const updatedHistory = isUpdateMode
      ? [
          ...(activeItemBeingEdited?.historyLog || []),
          {
            role: "B&M Manager" as const,
            action: "SUBMIT" as const,
            tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
            catatan: itemToEdit
              ? "Spesifikasi material telah diperbaiki sesuai catatan dan diajukan kembali ke S&B Specialist."
              : "Pengajuan pembaruan spesifikasi/perubahan untuk review ulang oleh S&B Specialist.",
          },
        ]
      : undefined;

    const newItem: PengajuanHargaItem = {
      ...(activeItemBeingEdited || {}),
      id: activeItemBeingEdited?.id || `item-${Date.now()}`,
      kode: finalKodeItem, // Kode Item murni (misal: "SIP-001")
      kodeMaster: finalKodeMaster, // Kode Master Item (misal: "SIP-001-A-Keramik-60x60")
      item: item.trim(),
      ukuran: ukuran.trim(),
      merk: merk.trim(),
      warna: warna.trim(),
      tipe: tipe.trim(),
      tebal: tebal.trim(),
      permukaan: permukaan.trim(),
      kategori: kategori.trim(),
      implementasi,
      lokasi: lokasi.trim(),
      toleransi: toleransi.trim() || undefined,
      informasiTambahan: informasiTambahan.trim(),
      deskripsiOtomatis,
      estimasiHarga: Number(estimasiHarga) || 0,
      satuan: "m2",
      status: "DIAJUKAN", // Kembali masuk ke antrean validasi S&B
      tanggalPengajuan: new Date().toISOString().slice(0, 10),
      historyLog: updatedHistory,
    };

    onSubmit(newItem);
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        {/* Header Modal */}
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-2.5 h-5 rounded-full inline-block ${itemToEdit ? "bg-amber-600" : pengajuanMode === "UPDATE" ? "bg-blue-600" : "bg-red-600"}`} />
              {itemToEdit
                ? "Formulir Revisi Spesifikasi Material"
                : pengajuanMode === "UPDATE"
                ? "Pembaruan Spesifikasi Material (Review Ulang)"
                : "Formulir Pengajuan Spesifikasi Material"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {itemToEdit
                ? "Perbaiki data material sesuai catatan instruksi dari S&B Specialist, lalu ajukan kembali."
                : pengajuanMode === "UPDATE"
                ? "Pilih material yang sudah ada, sesuaikan spesifikasi yang berubah, lalu ajukan ke S&B Specialist."
                : "Isi data material di bawah ini. Kode master dan deskripsi lengkap dibuat otomatis."}
            </DialogDescription>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 self-start sm:self-auto ${
            itemToEdit
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : pengajuanMode === "UPDATE"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${itemToEdit ? "bg-amber-500" : pengajuanMode === "UPDATE" ? "bg-blue-500" : "bg-emerald-500"}`} />
            <span>
              {itemToEdit
                ? "Mode Revisi"
                : pengajuanMode === "UPDATE"
                ? "Pembaruan Item"
                : "Material Baru"}
            </span>
          </div>
        </DialogHeader>

        {/* Banner Catatan Revisi dari S&B Specialist (Jika mode revisi spesifik) */}
        {itemToEdit && latestCatatanRevisi && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 mt-2 shadow-2xs animate-in fade-in duration-200">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900">Catatan Revisi dari S&amp;B Controlling Specialist:</p>
              <p className="text-amber-800 text-[11px] leading-relaxed italic">
                "{latestCatatanRevisi}"
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Switcher Tipe Pengajuan: Pengajuan Baru vs Pembaruan Item yang Sudah Ada */}
          {!itemToEdit && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPengajuanMode("BARU");
                    setSelectedExistingId("");
                    handleReset();
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    pengajuanMode === "BARU"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  + Pengajuan Baru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPengajuanMode("UPDATE");
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                    pengajuanMode === "UPDATE"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pembaruan Item yang Ada (Review Ulang)
                </button>
              </div>

              {/* Selector Material untuk Mode Pembaruan */}
              {pengajuanMode === "UPDATE" && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5 animate-in fade-in duration-200">
                  <Label className="text-xs font-bold text-blue-950">
                    Pilih Material yang Ingin Diperbarui
                  </Label>
                  <Select
                    value={selectedExistingId}
                    onValueChange={(val) => {
                      setSelectedExistingId(val);
                      const found = existingItems.find((i) => i.id === val);
                      if (found) {
                        populateForm(found);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-blue-200 h-9 text-xs">
                      <SelectValue placeholder="Pilih dari daftar material yang sudah ada..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingItems.map((itm) => (
                        <SelectItem key={itm.id} value={itm.id}>
                          {itm.kodeMaster || itm.kode} - {itm.item} ({itm.merk} - {itm.ukuran})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Pilih material di atas, lalu ubah spesifikasi yang berubah. Item akan diajukan ulang ke S&amp;B untuk direview.
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Section 1: Data Pokok Material */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Data Pokok Material
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Kategori Pekerjaan */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <Select value={kategori} onValueChange={setKategori} required>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pekerjaan Keramik">
                      Pekerjaan Keramik
                    </SelectItem>
                    <SelectItem value="Area Terbuka">Area Terbuka</SelectItem>
                    <SelectItem value="Pekerjaan Finishing">
                      Pekerjaan Finishing
                    </SelectItem>
                    <SelectItem value="Pekerjaan Pasangan">
                      Pekerjaan Pasangan
                    </SelectItem>
                    <SelectItem value="Pekerjaan Sanitair">
                      Pekerjaan Sanitair
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nama Material (Creatable Combobox) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Nama Material <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={item}
                  onChange={setItem}
                  options={materialOptions}
                  required
                  placeholder="Pilih / ketik nama material"
                  searchPlaceholder="Cari atau ketik baru..."
                />
              </div>

              {/* Ukuran Material (Creatable Combobox) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ukuran <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={ukuran}
                  onChange={setUkuran}
                  options={ukuranOptions}
                  required
                  placeholder="Pilih / ketik ukuran"
                  searchPlaceholder="Cari atau ketik ukuran baru..."
                />
              </div>

              {/* Merk */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Merk / Brand <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={merk}
                  onChange={setMerk}
                  options={merkOptions}
                  required
                  placeholder="Pilih / ketik merk"
                  searchPlaceholder="Cari atau ketik merk baru..."
                />
              </div>
            </div>
          </div>
          {/* Section 2: Fisik & Karakteristik */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Fisik &amp; Karakteristik
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Tipe / Corak */}
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Tipe / Corak <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={tipe}
                  required
                  onChange={(e) => setTipe(e.target.value)}
                  placeholder="Contoh: Sicily Grey Matte"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
              </div>

              {/* Warna Material */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Warna <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={warna}
                  required
                  onChange={(e) => setWarna(e.target.value)}
                  placeholder="Contoh: Grey"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
              </div>

              {/* Finishing Permukaan (Input Teks Bebas Sesuai Permintaan) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Permukaan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={permukaan}
                  required
                  onChange={(e) => setPermukaan(e.target.value)}
                  placeholder="Contoh: Matte, Polish, Rustic"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
              </div>

              {/* Tebal & Toleransi dalam 1 kolom split */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tebal &amp; Toleransi <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={tebal}
                    required
                    onChange={(e) => setTebal(e.target.value)}
                    placeholder="9mm"
                    title="Ketebalan"
                    className="h-9 rounded-lg text-xs bg-white border-slate-200 px-2"
                  />
                  <Input
                    value={toleransi}
                    required
                    onChange={(e) => setToleransi(e.target.value)}
                    placeholder="±0.2mm"
                    title="Toleransi Presisi"
                    className="h-9 rounded-lg text-xs bg-white border-slate-200 px-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Penempatan, Kode Item & Kode Master Item */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Pemasangan &amp; Kode Master Item
              </h3>
            </div>

            {/* Baris 1: Posisi Bidang & Area / Ruangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Posisi Bidang / Dinding (Creatable Combobox) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Posisi Bidang <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={implementasi}
                  onChange={setImplementasi}
                  options={posisiOptions}
                  required
                  placeholder="Pilih / ketik posisi"
                  searchPlaceholder="Cari atau ketik posisi baru..."
                />
              </div>

              {/* Area / Ruangan (Creatable Combobox) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Area / Ruangan <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={lokasi}
                  onChange={setLokasi}
                  options={areaOptions}
                  required
                  placeholder="Pilih / ketik area"
                  searchPlaceholder="Cari atau ketik area baru..."
                />
              </div>
            </div>

            {/* Baris 2: Pemisahan Jelas antara Kode Item vs Kode Master Item */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Kode Item (Hanya format SIP-001) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Kode Item
                  </Label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Varian {kodeArea}
                  </span>
                </div>
                <Input
                  value={kodeItem}
                  readOnly
                  placeholder="SIP-001"
                  className="h-9 rounded-lg text-xs font-mono font-bold bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Kode Master Item (Format: Kode-Area-Material-Ukuran) */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Kode Master Item <span className="text-red-500">*</span>
                  </Label>
                </div>
                <Input
                  value={kodeMaster}
                  disabled
                  onChange={(e) => {
                    setIsKodeMasterManual(true);
                    setKodeMaster(e.target.value);
                  }}
                  placeholder={`Contoh: ${kodeItem}-A-Keramik-60x60`}
                  required
                  className="h-9 rounded-lg text-xs font-mono font-bold bg-blue-50/70 border-blue-200 text-blue-800 focus-visible:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Baris 3: Catatan & Metode Kerja */}
            <div className="pt-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Informasi Tambahan &amp; Metode Kerja
                </Label>
                <Input
                  value={informasiTambahan}
                  onChange={(e) => setInformasiTambahan(e.target.value)}
                  placeholder="Contoh: Nat semen SIKA Tile Grout"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Pratinjau Deskripsi Otomatis (Live Sync Card) */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-blue-900 tracking-wide">
                  Deskripsi Lengkap
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white text-blue-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-blue-200">
                    Kode Master: {kodeMaster}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tersinkronisasi
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyDescription}
                  className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-100 rounded-md gap-1"
                  title="Salin deskripsi ke clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Tersalin
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Salin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-800 bg-white p-3 rounded-lg border border-blue-100 shadow-2xs leading-relaxed">
              {deskripsiOtomatis || (
                <span className="text-slate-400 italic font-normal">
                  Deskripsi lengkap akan tersusun otomatis saat spesifikasi
                  material diisi...
                </span>
              )}
            </p>
          </div>

          {/* Notifikasi Peringatan Duplikasi Data */}
          {isDuplicate && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-amber-800 text-xs font-semibold animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Data sudah ada</span>
            </div>
          )}

          {/* Footer Aksi */}
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs border-slate-200 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isDuplicate}
              className={`rounded-xl h-9 text-xs font-semibold shadow-xs transition-colors ${
                isDuplicate
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300"
                  : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              }`}
            >
              {isDuplicate
                ? "Data sudah ada"
                : itemToEdit
                ? "Simpan & Ajukan Kembali"
                : pengajuanMode === "UPDATE"
                ? "Simpan & Ajukan Ulang"
                : "Simpan Pengajuan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
