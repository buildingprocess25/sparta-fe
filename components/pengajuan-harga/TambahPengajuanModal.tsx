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
  const [implementasi, setImplementasi] = useState("Dinding Gerai");
  const [lokasi, setLokasi] = useState("");
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
    setImplementasi(target.implementasi || "Dinding Gerai");
    setLokasi(target.lokasi || "");
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
    setImplementasi("Dinding Gerai");
    setLokasi("");
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
      !implementasi.trim() ||
      !lokasi.trim() ||
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
      implementasi,
      lokasi: lokasi.trim(),
      toleransi: toleransi.trim() || undefined,
      informasiTambahan: informasiTambahan.trim(),
      deskripsiOtomatis,
      estimasiHarga: itemToEdit?.estimasiHarga || 0,
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
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <Select value={kategori} onValueChange={setKategori} required>
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
                  Nama Material <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={item}
                  onChange={setItem}
                  options={materialOptions}
                  required
                  placeholder="Pilih / ketik nama material"
                />
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
                  placeholder="Pilih / ketik merk"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fisik & Karakteristik */}
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
                  placeholder="Contoh: ± 0.5 mm"
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Penempatan & Catatan */}
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
                <Label className="text-xs font-semibold text-slate-700">
                  Implementasi <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={implementasi}
                  onChange={setImplementasi}
                  options={posisiOptions}
                  required
                  placeholder="Pilih / ketik implementasi"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Lokasi / Posisi <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={lokasi}
                  onChange={setLokasi}
                  options={areaOptions}
                  required
                  placeholder="Pilih / ketik lokasi"
                />
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
              </div>
            </div>
          </div>

          {/* Section 4: Kode & Deskripsi */}
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
