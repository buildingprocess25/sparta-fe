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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import CreatableSelect from "react-select/creatable";
import SelectMulti from "react-select";
import {
  PengajuanHargaItem,
  generateDeskripsiOtomatis,
  getKodeData,
} from "./types";
import { Sparkles, Copy, Check, RotateCcw } from "lucide-react";

export interface TambahPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PengajuanHargaItem) => void;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
  itemToEdit?: PengajuanHargaItem | null;
}

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
}: TambahPengajuanModalProps) {
  // Form State
  const [kategori, setKategori] = useState("Pekerjaan Keramik");
  const [item, setItem] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [merk, setMerk] = useState("");
  const [warna, setWarna] = useState("");
  const [tipe, setTipe] = useState("");
  const [permukaan, setPermukaan] = useState("");
  const [tebal, setTebal] = useState("");
  const [toleransi, setToleransi] = useState("");
  const [implementasi, setImplementasi] = useState<string[]>(["Dinding Gerai"]);
  const [lokasi, setLokasi] = useState<string[]>([]);
  const [jenisPengajuan, setJenisPengajuan] = useState<"Hanya Jasa" | "Material">("Material");
  const [estimasiHarga, setEstimasiHarga] = useState<number | "">("");
  const [informasiTambahan, setInformasiTambahan] = useState("");

  const [kodeItem, setKodeItem] = useState(
    `SIP-${String(nextIndex).padStart(3, "0")}`
  );
  const [kodeMaster, setKodeMaster] = useState("");
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState("");
  const [copied, setCopied] = useState(false);

  // Filter items excluding itemToEdit
  const otherItems = useMemo(() => {
    if (!itemToEdit) return existingItems;
    return existingItems.filter((i) => i.id !== itemToEdit.id);
  }, [existingItems, itemToEdit]);

  // Catatan revisi jika mode edit revisi
  const latestCatatanRevisi = useMemo(() => {
    if (!itemToEdit?.historyLog) return null;
    const revLog = [...itemToEdit.historyLog]
      .reverse()
      .find((l) => l.action === "REVISE" || (l.role === "S&B Specialist" && l.catatan));
    return revLog?.catatan || null;
  }, [itemToEdit]);

  const materialReactSelectOptions = useMemo(() => {
    const existingOptions = existingItems.map(i => {
      const parts = [i.ukuran, i.merk].filter(Boolean).join(" ");
      return {
        label: parts ? `${i.item} - ${parts}` : i.item,
        value: i.item,
        data: i
      };
    });
    
    const usedNames = new Set(existingItems.map(i => i.item));
    const initialOpts = INITIAL_MATERIAL_OPTIONS.filter(name => !usedNames.has(name)).map(name => ({
      label: name,
      value: name,
      data: null
    }));

    return [...existingOptions, ...initialOpts];
  }, [existingItems]);

  const handleItemSelect = (selectedOption: any) => {
    if (!selectedOption) {
      setItem("");
      return;
    }
    
    setItem(selectedOption.value);
    
    if (selectedOption.data) {
       const target = selectedOption.data;
       setKategori(target.kategori || "Pekerjaan Keramik");
       setUkuran(target.ukuran || "");
       setMerk(target.merk || "");
       setWarna(target.warna || "");
       setTipe(target.tipe || "");
       setPermukaan(target.permukaan || "");
       setTebal(target.tebal || "");
       setToleransi(target.toleransi || "");
       setImplementasi(target.implementasi ? (Array.isArray(target.implementasi) ? target.implementasi : [target.implementasi]) : []);
       setLokasi(target.lokasi ? (Array.isArray(target.lokasi) ? target.lokasi : [target.lokasi]) : []);
    }
  };

  const ukuranOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.ukuran).filter(Boolean);
    return Array.from(new Set([...INITIAL_UKURAN_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const merkOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.merk).filter(Boolean);
    return Array.from(new Set([...INITIAL_MERK_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const posisiOptions = useMemo(() => {
    const fromExisting = existingItems.flatMap((i) => Array.isArray(i.implementasi) ? i.implementasi : [i.implementasi]).filter(Boolean) as string[];
    return Array.from(new Set([...INITIAL_POSISI_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const areaOptions = useMemo(() => {
    const fromExisting = existingItems.flatMap((i) => Array.isArray(i.lokasi) ? i.lokasi : [i.lokasi]).filter(Boolean) as string[];
    return Array.from(new Set([...INITIAL_AREA_OPTIONS, ...fromExisting]));
  }, [existingItems]);

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
      existingItems: otherItems,
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
    otherItems,
  ]);

  const isDuplicate = kodeData.isDuplicate;

  useEffect(() => {
    if (!itemToEdit) {
      setKodeItem(kodeData.kodeItem);
    }
    setKodeMaster(kodeData.kodeMaster);
  }, [kodeData, itemToEdit]);

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
  }, [item, ukuran, merk, warna, tipe, permukaan, lokasi, implementasi]);

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
    setImplementasi(target.implementasi ? (Array.isArray(target.implementasi) ? target.implementasi : [target.implementasi]) : ["Dinding Gerai"]);
    setLokasi(target.lokasi ? (Array.isArray(target.lokasi) ? target.lokasi : [target.lokasi]) : []);
    setJenisPengajuan(target.jenisPengajuan || "Material");
    setEstimasiHarga(target.estimasiHarga || "");
    setInformasiTambahan(target.informasiTambahan || "");
    setKodeItem(target.kode || "");
    setKodeMaster(target.kodeMaster || "");
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
    setImplementasi(["Dinding Gerai"]);
    setLokasi([]);
    setJenisPengajuan("Material");
    setEstimasiHarga("");
    setInformasiTambahan("");
  };

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        populateForm(itemToEdit);
      } else {
        handleReset();
      }
    }
  }, [isOpen, itemToEdit]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDuplicate) {
      return;
    }

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
      implementasi.length === 0 ||
      lokasi.length === 0 ||
      estimasiHarga === "" ||
      Number(estimasiHarga) <= 0 ||
      !kodeMaster.trim()
    ) {
      return;
    }

    const finalKodeItem = kodeItem.trim() || kodeData.kodeItem;
    const finalKodeMaster = kodeMaster.trim() || kodeData.kodeMaster;

    const updatedHistory = itemToEdit
      ? [
          ...(itemToEdit.historyLog || []),
          {
            role: "B&M Manager" as const,
            action: "SUBMIT" as const,
            tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
            catatan: "Spesifikasi diperbaiki dan diajukan ulang ke S&B Specialist.",
          },
        ]
      : undefined;

    const newItem: PengajuanHargaItem = {
      ...(itemToEdit || {}),
      id: itemToEdit?.id || `item-${Date.now()}`,
      kode: finalKodeItem,
      kodeMaster: finalKodeMaster,
      item: item.trim(),
      ukuran: ukuran.trim(),
      merk: merk.trim(),
      warna: warna.trim(),
      tipe: tipe.trim(),
      tebal: tebal.trim(),
      permukaan: permukaan.trim(),
      kategori: kategori.trim(),
      implementasi: Array.isArray(implementasi) ? implementasi.join(", ") : implementasi,
      lokasi: Array.isArray(lokasi) ? lokasi.join(", ") : lokasi,
      toleransi: toleransi.trim() || undefined,
      informasiTambahan: informasiTambahan.trim(),
      deskripsiOtomatis,
      estimasiHarga: Number(estimasiHarga) || 0,
      jenisPengajuan,
      satuan: "m2",
      status: "DIAJUKAN",
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
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-2.5 h-5 rounded-full inline-block ${itemToEdit ? "bg-amber-600" : "bg-red-600"}`} />
              <span>{itemToEdit ? "Edit Revisi Spesifikasi" : "Pengajuan Spesifikasi Material Baru"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {itemToEdit
                ? "Perbaiki data material sesuai catatan instruksi dari S&B Specialist."
                : "Isi data spesifikasi material untuk diajukan ke S&B Specialist."}
            </DialogDescription>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 self-start sm:self-auto ${
            itemToEdit
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${itemToEdit ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span>{itemToEdit ? "Mode Revisi" : "Material Baru"}</span>
          </div>
        </DialogHeader>

        {/* Catatan Revisi jika ada */}
        {itemToEdit && latestCatatanRevisi && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 mt-2 shadow-2xs">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900">Catatan Revisi S&amp;B Specialist:</p>
              <p className="text-amber-800 text-[11px] leading-relaxed italic">
                "{latestCatatanRevisi}"
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Section 1: Alur & Item Utama */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Jenis & Item Utama</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Jenis Pengajuan <span className="text-red-500">*</span></span>
                </Label>
                <Select value={jenisPengajuan} onValueChange={(val) => setJenisPengajuan(val as "Hanya Jasa" | "Material")}>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Hanya Jasa">Hanya Jasa</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-400">Material fisik atau jasa</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Nama Material / Item <span className="text-red-500">*</span></span>
                </Label>
                <CreatableSelect
                  value={item ? { label: item, value: item } : null}
                  onChange={handleItemSelect}
                  options={materialReactSelectOptions}
                  placeholder="Cari item eksisting atau ketik baru..."
                  formatCreateLabel={(val: string) => `Buat item baru: "${val}"`}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base: any) => ({
                      ...base,
                      width: "100%",
                      minWidth: "200px",
                      zIndex: 50,
                    }),
                    option: (base: any) => ({
                      ...base,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      fontSize: "12px",
                    }),
                  }}
                  maxMenuHeight={250}
                />
                <span className="text-[10px] text-slate-400">Cari item atau ketik baru</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Harga Estimasi / Satuan <span className="text-red-500">*</span></span>
                </Label>
                <CurrencyInput
                  value={estimasiHarga}
                  onChange={setEstimasiHarga}
                  placeholder="Rp 0"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
                <span className="text-[10px] text-slate-400">Format pemisah ribuan otomatis</span>
              </div>
            </div>

            
            {jenisPengajuan === "Hanya Jasa" && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>Pengajuan <strong>Hanya Jasa</strong>. Pilih item yang sudah ada.</p>
              </div>
            )}
            {jenisPengajuan === "Material" && item && existingItems.some(i => i.item === item) && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>Item <strong>sudah terdaftar</strong> di sistem. Pengajuan ini akan diteruskan sebagai form <strong>Review/Update Master</strong>.</p>
              </div>
            )}
            {jenisPengajuan === "Material" && item && !existingItems.some(i => i.item === item) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>Item <strong>baru</strong>. Pengajuan ini akan dilanjutkan sebagai <strong>Pengajuan Master Harga Baru</strong>.</p>
              </div>
            )}
          </div>
          
          {/* Section 2: Data Pokok Material */}
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
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <Select value={kategori} onValueChange={setKategori} required disabled={jenisPengajuan === "Hanya Jasa"}>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pekerjaan Keramik">Pekerjaan Keramik</SelectItem>
                    <SelectItem value="Area Terbuka">Area Terbuka</SelectItem>
                    <SelectItem value="Pekerjaan Finishing">Pekerjaan Finishing</SelectItem>
                    <SelectItem value="Pekerjaan Pasangan">Pekerjaan Pasangan</SelectItem>
                    <SelectItem value="Pekerjaan Sanitair">Pekerjaan Sanitair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ukuran <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={ukuran}
                  onChange={setUkuran}
                  options={ukuranOptions}
                  required
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik ukuran"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Merk / Brand <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={merk}
                  onChange={setMerk}
                  options={merkOptions}
                  required
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik merk"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fisik & Karakteristik */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Fisik &amp; Karakteristik
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Warna <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Contoh: Cream, Putih"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tipe / Motif <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Contoh: Polos, Wood"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Permukaan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={permukaan}
                  onChange={(e) => setPermukaan(e.target.value)}
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Contoh: Glossy, Matte"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ketebalan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={tebal}
                  onChange={(e) => setTebal(e.target.value)}
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Contoh: 9 mm"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Toleransi Presisi <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={toleransi}
                  onChange={(e) => setToleransi(e.target.value)}
                  disabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Contoh: ± 0.5 mm"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Penempatan & Catatan */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Penempatan &amp; Catatan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Implementasi <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Multi-select</span>
                </Label>
                <CreatableSelect
                  isMulti
                  value={implementasi.map((val) => ({ label: val, value: val }))}
                  onChange={(selected: any) =>
                    setImplementasi(selected ? selected.map((s: any) => s.value) : [])
                  }
                  options={posisiOptions.map((opt) => ({ label: opt, value: opt }))}
                  placeholder="Pilih implementasi..."
                  formatCreateLabel={(val: string) => `Tambah "${val}"`}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base: any) => ({
                      ...base,
                      fontSize: "12px",
                      zIndex: 50,
                    }),
                    multiValue: (base: any) => ({
                      ...base,
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0.375rem",
                    }),
                    multiValueLabel: (base: any) => ({
                      ...base,
                      fontSize: "11px",
                      color: "#1e293b",
                      fontWeight: 500,
                    }),
                  }}
                />
                <span className="text-[10px] text-slate-400">Pilih satu atau lebih implementasi</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Lokasi / Area Gerai <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Multi-select</span>
                </Label>
                <CreatableSelect
                  isMulti
                  value={lokasi.map((val) => ({ label: val, value: val }))}
                  onChange={(selected: any) =>
                    setLokasi(selected ? selected.map((s: any) => s.value) : [])
                  }
                  options={areaOptions.map((opt) => ({ label: opt, value: opt }))}
                  placeholder="Pilih area lokasi..."
                  formatCreateLabel={(val: string) => `Tambah "${val}"`}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base: any) => ({
                      ...base,
                      fontSize: "12px",
                      zIndex: 50,
                    }),
                    multiValue: (base: any) => ({
                      ...base,
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0.375rem",
                    }),
                    multiValueLabel: (base: any) => ({
                      ...base,
                      fontSize: "11px",
                      color: "#1e293b",
                      fontWeight: 500,
                    }),
                  }}
                />
                <span className="text-[10px] text-slate-400">Pilih satu atau lebih lokasi</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Informasi Tambahan
                </Label>
                <Input
                  value={informasiTambahan}
                  onChange={(e) => setInformasiTambahan(e.target.value)}
                  placeholder="Catatan penyesuaian..."
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
                <span className="text-[10px] text-slate-400">Otomatis dimasukkan dalam tanda kurung</span>
              </div>
            </div>
          </div>

          {/* Section 5: Kode & Deskripsi */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Kode Master &amp; Deskripsi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kode Item
                </Label>
                <Input
                  value={kodeItem}
                  disabled
                  readOnly
                  className="h-9 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Kode Master Item
                </Label>
                <Input
                  value={kodeMaster}
                  disabled
                  readOnly
                  className="h-9 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deskripsi Otomatis</span>
                </Label>
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
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
                </button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans min-h-[48px]">
                {deskripsiOtomatis || "-"}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-9 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 cursor-pointer shadow-xs"
            >
              {itemToEdit ? "Ajukan Ulang Revisi" : "Ajukan Spesifikasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
