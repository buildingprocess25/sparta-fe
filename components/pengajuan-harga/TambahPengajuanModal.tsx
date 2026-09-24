"use client";

import React, { useState, useEffect } from "react";
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
import { Sparkles, Copy, Check } from "lucide-react";

export interface TambahPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PengajuanHargaItem) => void;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
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
}: TambahPengajuanModalProps) {
  // Kelompok 1: Data Pokok Material
  const [kategori, setKategori] = useState("Pekerjaan Keramik");
  const [item, setItem] = useState("Keramik");
  const [ukuran, setUkuran] = useState("60x60 cm");
  const [merk, setMerk] = useState("Sandimas");

  // Kelompok 2: Fisik & Karakteristik (Permukaan sekarang input teks bebas)
  const [warna, setWarna] = useState("Grey");
  const [tipe, setTipe] = useState("Sicily Grey Matte");
  const [permukaan, setPermukaan] = useState("Matte");
  const [tebal, setTebal] = useState("9mm");
  const [toleransi, setToleransi] = useState("±0.2mm");

  // Kelompok 3: Penempatan & Catatan
  const [implementasi, setImplementasi] = useState("Dinding Gerai");
  const [lokasi, setLokasi] = useState("Area Teras Depan");
  const [informasiTambahan, setInformasiTambahan] = useState(
    "Nat menggunakan pengisi semen SIKA Tile Grout",
  );
  const [estimasiHarga] = useState<string>("200000");

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

  // Auto-generate Kode Item dan Kode Master Item berdasarkan aturan area
  useEffect(() => {
    const data = getKodeData({
      item,
      ukuran,
      merk,
      lokasi,
      nextIndex,
      existingItems,
    });

    setKodeItem(data.kodeItem);
    setKodeArea(data.kodeArea);

    if (!isKodeMasterManual) {
      setKodeMaster(data.kodeMaster);
    }
  }, [
    item,
    ukuran,
    merk,
    lokasi,
    nextIndex,
    existingItems,
    isKodeMasterManual,
  ]);

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
      informasiTambahan,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const data = getKodeData({
      item,
      ukuran,
      merk,
      lokasi,
      nextIndex,
      existingItems,
    });

    const finalKodeItem = kodeItem.trim() || data.kodeItem;
    const finalKodeMaster = kodeMaster.trim() || data.kodeMaster;

    const newItem: PengajuanHargaItem = {
      id: `item-${Date.now()}`,
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
      status: "DIAJUKAN",
      tanggalPengajuan: new Date().toISOString().slice(0, 10),
    };

    onSubmit(newItem);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setMerk("");
    setWarna("");
    setTipe("");
    setLokasi("Area Teras Depan");
    setInformasiTambahan("");
    setIsKodeMasterManual(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        {/* Header Modal */}
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-5 bg-red-600 rounded-full inline-block" />
              Formulir Pengajuan Spesifikasi Material
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Isi data material di bawah ini. Kode master dan deskripsi lengkap
              dibuat otomatis.
            </DialogDescription>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Draft Baru</span>
          </div>
        </DialogHeader>

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
                  options={INITIAL_MATERIAL_OPTIONS}
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
                  options={INITIAL_UKURAN_OPTIONS}
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
                  options={INITIAL_MERK_OPTIONS}
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
                  options={INITIAL_POSISI_OPTIONS}
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
                  options={INITIAL_AREA_OPTIONS}
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

          {/* Footer Aksi */}
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs border-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
            >
              Simpan Pengajuan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
