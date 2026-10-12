// =============================================================================
// components/prototipe-trial/ModalTambahTrial.tsx
// Modal Formulir Pengajuan Item Trial Baru (Maker) - Versi Sempurna
// Fitur:
// 1. React-Select (CreatableSelect) dengan Auto-Suggestion Cerdas
// 2. Auto-Formatting Title Case (Kapitalisasi Otomatis Setiap Kata)
// 3. Upload Gambar Nyata dengan Image Preview Thumbnail & Hapus Foto
// 4. Durasi 2-4 Bulan, Estimasi Harga Terformat, Toggle Bongkaran
// 5. Layout Card Sections Lega & Desain Enterprise Bersih
// =============================================================================

"use client";

import React, { useState, useMemo, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Upload,
  Clock,
  Sparkles,
  Image as ImageIcon,
  X,
  Building,
  Layers,
  Coins,
  CheckCircle2,
} from "lucide-react";
import type { StylesConfig } from "react-select";
import { TrialItem, TrialStatus, RoleTrial } from "./types";
import { addTrialItem } from "./store";

interface ModalTambahTrialProps {
  isOpen: boolean;
  onClose: () => void;
  nextIndex?: number;
  onSuccess?: (item: TrialItem) => void;
}

export interface SelectOption {
  label: string;
  value: string;
  kategori?: string;
  ukuran?: string;
  merk?: string;
  satuan?: string;
  role?: string;
}

// Helper: Format Huruf Kapital di Setiap Kata (Title Case)
function formatTitleCase(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Styling Terpadu untuk React-Select / CreatableSelect
const comboboxStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#dc2626" : "#e2e8f0",
    fontSize: "12px",
    backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
    "&:hover": {
      borderColor: "#cbd5e1",
    },
  }),
  menu: (base) => ({
    ...base,
    fontSize: "12px",
    zIndex: 60,
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "12px",
    backgroundColor: state.isSelected
      ? "#dc2626"
      : state.isFocused
      ? "#fee2e2"
      : undefined,
    color: state.isSelected ? "#ffffff" : "#1e293b",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#b91c1c",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 10px",
    overflow: "hidden",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1e293b",
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  input: (base) => ({
    ...base,
    margin: "0",
    padding: "0",
    fontSize: "12px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    padding: "0 2px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "2px 6px",
    color: "#64748b",
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "2px 4px",
    color: "#64748b",
  }),
};

// Opsi Pilihan Aktor Maker
const MAKER_OPTIONS = [
  { label: "Pak Wiwit (Regional Manager - Senior)", value: "Pak Wiwit", role: "MAKER_SENIOR" },
  { label: "Pak Jhon (Regional Manager - Senior)", value: "Pak Jhon", role: "MAKER_SENIOR" },
  { label: "Pak Andy (BMES Manager - Senior)", value: "Pak Andy", role: "MAKER_SENIOR" },
  { label: "Pak Eko Indra (PP Manager - Senior [Bypass PP])", value: "Pak Eko Indra", role: "PP_MANAGER" },
  { label: "Bima (BMES Specialist - Junior)", value: "Bima", role: "MAKER_JUNIOR" },
  { label: "Syahid Jaya (BMES Specialist - Junior)", value: "Syahid Jaya", role: "MAKER_JUNIOR" },
  { label: "Pak Iqbal (BMES Specialist - Junior)", value: "Pak Iqbal", role: "MAKER_JUNIOR" },
  { label: "Annisa Purnamasari / Mbak Caca (PP Specialist - Junior)", value: "Annisa Purnamasari", role: "MAKER_JUNIOR" },
  { label: "Pak Dyan (S&B Specialist - Junior)", value: "Pak Dyan", role: "MAKER_JUNIOR" },
  { label: "Pak Permadi (S&B Specialist - Junior)", value: "Pak Permadi", role: "MAKER_JUNIOR" },
];

// Opsi Saran Default (Suggestion Bank)
const DEFAULT_KATEGORI_OPTIONS = [
  { label: "Pekerjaan Keramik", value: "Pekerjaan Keramik" },
  { label: "Pekerjaan Finishing", value: "Pekerjaan Finishing" },
  { label: "Pekerjaan Pasangan", value: "Pekerjaan Pasangan" },
  { label: "Pekerjaan Plafon", value: "Pekerjaan Plafon" },
  { label: "Pekerjaan Lantai", value: "Pekerjaan Lantai" },
  { label: "Pekerjaan Dinding", value: "Pekerjaan Dinding" },
  { label: "Pekerjaan Sanitair", value: "Pekerjaan Sanitair" },
  { label: "Pekerjaan Elektrikal", value: "Pekerjaan Elektrikal" },
  { label: "Pekerjaan Pintu & Jendela", value: "Pekerjaan Pintu & Jendela" },
];

const DEFAULT_MATERIAL_OPTIONS = [
  { label: "Keramik Lantai Matte Heavy Duty", value: "Keramik Lantai Matte Heavy Duty", kategori: "Pekerjaan Keramik", ukuran: "60x60", merk: "Sandimas", satuan: "m2" },
  { label: "Cat Epoxy Floor Self-Leveling", value: "Cat Epoxy Floor Self-Leveling", kategori: "Pekerjaan Finishing", ukuran: "20", merk: "Propan", satuan: "m2" },
  { label: "Plafon PVC Waterproof Anti-Rayap", value: "Plafon PVC Waterproof Anti-Rayap", kategori: "Pekerjaan Plafon", ukuran: "20x400", merk: "Shunda Plafon", satuan: "m2" },
  { label: "Lampu LED Batten High Lumen Eco", value: "Lampu LED Batten High Lumen Eco", kategori: "Pekerjaan Elektrikal", ukuran: "120", merk: "Philips", satuan: "unit" },
  { label: "Kloset Duduk Eco-Flush Dual Button", value: "Kloset Duduk Eco-Flush Dual Button", kategori: "Pekerjaan Sanitair", ukuran: "36x70x74", merk: "Toto", satuan: "unit" },
  { label: "Vinyl Plank Rigid Core Click 5mm", value: "Vinyl Plank Rigid Core Click 5mm", kategori: "Pekerjaan Lantai", ukuran: "18x122", merk: "Duma", satuan: "m2" },
  { label: "Granit Tile Nano Polished", value: "Granit Tile Nano Polished", kategori: "Pekerjaan Keramik", ukuran: "80x80", merk: "Roman", satuan: "m2" },
  { label: "Bata Ringan AAC Presisi", value: "Bata Ringan AAC Presisi", kategori: "Pekerjaan Pasangan", ukuran: "60x20x10", merk: "Batu Alam", satuan: "m3" },
  { label: "WPC Wallpanel Wood Texture Fluted", value: "WPC Wallpanel Wood Texture Fluted", kategori: "Pekerjaan Dinding", ukuran: "20x290", merk: "Duma", satuan: "m2" },
];

const DEFAULT_MERK_OPTIONS = [
  { label: "Sandimas", value: "Sandimas" },
  { label: "Roman", value: "Roman" },
  { label: "Propan", value: "Propan" },
  { label: "Shunda Plafon", value: "Shunda Plafon" },
  { label: "Philips", value: "Philips" },
  { label: "Toto", value: "Toto" },
  { label: "Duma", value: "Duma" },
  { label: "Indogress", value: "Indogress" },
  { label: "KIA", value: "KIA" },
  { label: "Mulia", value: "Mulia" },
];

const DEFAULT_WARNA_OPTIONS = [
  { label: "Grey Rock", value: "Grey Rock" },
  { label: "Light Grey", value: "Light Grey" },
  { label: "White Lily", value: "White Lily" },
  { label: "Cool Daylight", value: "Cool Daylight" },
  { label: "Ivory Cream", value: "Ivory Cream" },
  { label: "Natural Oak", value: "Natural Oak" },
  { label: "Teak Wood", value: "Teak Wood" },
  { label: "Black Matt", value: "Black Matt" },
];

const DEFAULT_TIPE_OPTIONS = [
  { label: "Sicily Grey Matte", value: "Sicily Grey Matte" },
  { label: "Epogreen Multi-layer", value: "Epogreen Multi-layer" },
  { label: "Linear Fluted 4-Groove", value: "Linear Fluted 4-Groove" },
  { label: "Essential SmartBright 18W", value: "Essential SmartBright 18W" },
  { label: "EcoWash C436", value: "EcoWash C436" },
  { label: "Plank Click Series", value: "Plank Click Series" },
  { label: "Travertine Cream Polish", value: "Travertine Cream Polish" },
];

const DEFAULT_PERMUKAAN_OPTIONS = [
  { label: "Matte Anti-Slip", value: "Matte Anti-Slip" },
  { label: "Nano Polish Gloss", value: "Nano Polish Gloss" },
  { label: "Semi Gloss", value: "Semi Gloss" },
  { label: "Gloss Anti-Chemical", value: "Gloss Anti-Chemical" },
  { label: "Frosted Diffuser", value: "Frosted Diffuser" },
  { label: "Deep Embossed Anti-Slip", value: "Deep Embossed Anti-Slip" },
  { label: "Embossed Woodgrain", value: "Embossed Woodgrain" },
  { label: "Halus Porous", value: "Halus Porous" },
];

const DEFAULT_POSISI_OPTIONS = [
  { label: "Lantai Gerai", value: "Lantai Gerai" },
  { label: "Dinding Gerai", value: "Dinding Gerai" },
  { label: "Plafon Gerai", value: "Plafon Gerai" },
  { label: "Toilet Gerai", value: "Toilet Gerai" },
  { label: "Fascia Depan", value: "Fascia Depan" },
  { label: "Lantai Gudang", value: "Lantai Gudang" },
];

const DEFAULT_AREA_OPTIONS = [
  { label: "Area Sales & Kasir", value: "Area Sales & Kasir" },
  { label: "Area Teras & Teras Depan", value: "Area Teras & Teras Depan" },
  { label: "Area Gudang & Chiller", value: "Area Gudang & Chiller" },
  { label: "Toilet Konsumen & Karyawan", value: "Toilet Konsumen & Karyawan" },
  { label: "Area Bean Spot & Kafe", value: "Area Bean Spot & Kafe" },
  { label: "Area Parkir Depan", value: "Area Parkir Depan" },
];

const CABANG_OPTIONS = [
  "Cikokol",
  "Bandung",
  "Surabaya",
  "Semarang",
  "Medan",
  "Makassar",
  "Palembang",
  "Tangerang",
  "Jakarta Barat",
  "Bekasi",
];

export function ModalTambahTrial({
  isOpen,
  onClose,
  nextIndex = 110,
  onSuccess,
}: ModalTambahTrialProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Maker & Durasi
  const [makerOption, setMakerOption] = useState(MAKER_OPTIONS[0]);
  const [durasiBulan, setDurasiBulan] = useState<2 | 3 | 4>(3);

  // Spesifikasi Fisik (dengan Auto Title Case & React-Select)
  const [kategori, setKategori] = useState("Pekerjaan Keramik");
  const [namaItem, setNamaItem] = useState("");
  const [ukuranNilai, setUkuranNilai] = useState("60x60");
  const [ukuranSatuan, setUkuranSatuan] = useState("cm");
  const [merk, setMerk] = useState("");
  const [warna, setWarna] = useState("");
  const [tipe, setTipe] = useState("");
  const [permukaan, setPermukaan] = useState("Matte Anti-Slip");
  const [tebalNilai, setTebalNilai] = useState("9");
  const [tebalSatuan, setTebalSatuan] = useState("mm");
  const [toleransiNilai, setToleransiNilai] = useState("0.5");
  const [toleransiSatuan, setToleransiSatuan] = useState("mm");
  const [implementasi, setImplementasi] = useState("Lantai Gerai");
  const [lokasi, setLokasi] = useState("Area Sales & Kasir");
  const [cabang, setCabang] = useState("Cikokol");
  const [satuan, setSatuan] = useState("m2");
  const [informasiTambahan, setInformasiTambahan] = useState("");

  // Parameter Finansial & Lampiran Gambar
  const [estimasiHarga, setEstimasiHarga] = useState<number>(125000);
  const [isTermasukBongkaran, setIsTermasukBongkaran] = useState(false);
  const [lampiranName, setLampiranName] = useState("");
  const [lampiranPreview, setLampiranPreview] = useState<string | null>(null);
  const [alasanTrial, setAlasanTrial] = useState("");

  const durasiHari = useMemo(() => durasiBulan * 30, [durasiBulan]);
  const kodeItem = useMemo(() => `SIP-${String(nextIndex).padStart(3, "0")}`, [nextIndex]);

  // Handler Pemilihan Material dari Suggestion (Auto-Fill Pintar)
  const handleMaterialSelect = (option: SelectOption | null) => {
    if (!option) {
      setNamaItem("");
      return;
    }
    const valFormatted = formatTitleCase(option.value);
    setNamaItem(valFormatted);

    // Auto-fill jika item berasal dari default list
    const found = DEFAULT_MATERIAL_OPTIONS.find(
      (m) => m.value.toLowerCase() === option.value.toLowerCase()
    );
    if (found) {
      if (found.kategori) setKategori(found.kategori);
      if (found.ukuran) setUkuranNilai(found.ukuran);
      if (found.merk) setMerk(found.merk);
      if (found.satuan) setSatuan(found.satuan);
    }
  };

  // Handler Upload Gambar Nyata
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Mohon pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal adalah 5MB.");
      return;
    }

    setLampiranName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setLampiranPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setLampiranName("");
    setLampiranPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Live Deskripsi Otomatis (Format Standar)
  const deskripsiOtomatis = useMemo(() => {
    const parts = [
      namaItem || "Item Material",
      merk ? `Merk ${merk}` : "",
      ukuranNilai ? `${ukuranNilai} ${ukuranSatuan}` : "",
      warna,
      tipe,
      tebalNilai ? `Tebal ${tebalNilai} ${tebalSatuan}` : "",
      permukaan,
      implementasi,
      lokasi,
      cabang ? `Cabang ${cabang}` : "",
    ].filter(Boolean);
    return parts.join(" - ");
  }, [
    namaItem,
    merk,
    ukuranNilai,
    ukuranSatuan,
    warna,
    tipe,
    tebalNilai,
    tebalSatuan,
    permukaan,
    implementasi,
    lokasi,
    cabang,
  ]);

  const handleSubmit = (isDraft: boolean) => {
    if (!isDraft && (!namaItem.trim() || !merk.trim() || !alasanTrial.trim())) {
      alert("Mohon lengkapi Nama Item, Merk, dan Alasan Pengajuan Trial.");
      return;
    }

    // Aturan Bisnis BR-01: Auto-skip jika PP Manager
    let statusTarget: TrialStatus = "TRIAL_DRAFT";
    if (!isDraft) {
      statusTarget =
        makerOption.role === "PP_MANAGER"
          ? "TRIAL_PENDING_BM_GM"
          : "TRIAL_PENDING_PP_MGR";
    }

    const today = new Date().toISOString().split("T")[0];

    const newItem: TrialItem = {
      id: `trial-${Date.now()}`,
      kode: kodeItem,
      kodeMaster: `TRL-${kategori.substring(10, 13).toUpperCase() || "ITM"}-${ukuranNilai}`,
      item: namaItem || "Item Uji Coba Trial",
      kategori,
      ukuran: `${ukuranNilai} ${ukuranSatuan}`,
      merk,
      warna,
      tipe,
      permukaan,
      tebal: `${tebalNilai} ${tebalSatuan}`,
      toleransi: `${toleransiNilai} ${toleransiSatuan}`,
      implementasi,
      lokasi,
      cabang,
      satuan,
      deskripsiOtomatis,
      informasiTambahan,
      alasanTrial: alasanTrial || "Uji coba operasional lapangan.",
      durasiBulan,
      durasiHari,
      estimasiHargaMaker: Number(estimasiHarga) || 0,
      isTermasukBongkaran,
      lampiranMakerName: lampiranName || undefined,
      lampiranMakerUrl: lampiranPreview || undefined,
      makerRole: makerOption.role as RoleTrial,
      makerNama: makerOption.value,
      tanggalPengajuan: today,
      status: statusTarget,
      historyLog: [
        {
          role: `Maker (${makerOption.role})`,
          namaUser: makerOption.value,
          action: "SUBMIT",
          tanggal: today,
          catatan: isDraft
            ? "Pengajuan disimpan sebagai draf."
            : makerOption.role === "PP_MANAGER"
            ? "Diajukan oleh PP Manager (Alur PP Manager otomatis dilewati ke B&M General Manager)."
            : "Pengajuan trial dikirimkan ke PP Manager untuk verifikasi awal.",
        },
      ],
    };

    addTrialItem(newItem);
    if (onSuccess) onSuccess(newItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border-slate-200 shadow-2xl">
        {/* Header Modal Bersih & Mewah */}
        <DialogHeader className="p-5 sm:p-6 border-b border-slate-200 bg-white sticky top-0 z-30 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Formulir Pengajuan Item Trial
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode Item: <span className="font-mono font-bold text-red-600">{kodeItem}</span> &bull; Lengkapi spesifikasi terstandarisasi, estimasi harga, dan foto bukti.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
              Masa Uji: {durasiBulan} Bulan ({durasiHari} Hari)
            </span>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
          {/* SEKSI 1: INISIASI PENGANJU & DURASI UJI COBA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-red-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Data Pengaju & Durasi Masa Uji Coba
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-bold text-slate-700">Aktor Pengaju (Maker)</Label>
                <Select
                  value={makerOption.value}
                  onValueChange={(val) => {
                    const opt = MAKER_OPTIONS.find((o) => o.value === val);
                    if (opt) setMakerOption(opt);
                  }}
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-slate-50 border-slate-200 text-xs">
                    <SelectValue placeholder="Pilih Maker" />
                  </SelectTrigger>
                  <SelectContent className="z-70">
                    {MAKER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500 mt-1">
                  *Pilih pejabat penanggung jawab inisiasi pengajuan uji coba.
                </p>
              </div>

              {/* Selector Durasi 2-4 Bulan (Tombol Kartu Segmented) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Pilihan Durasi Masa Uji Coba</span>
                  <span className="text-[11px] text-red-600 font-semibold">{durasiHari} Hari Kalender</span>
                </Label>
                <div className="grid grid-cols-3 gap-2.5 mt-1.5">
                  {([2, 3, 4] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setDurasiBulan(m)}
                      className={`h-10 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        durasiBulan === m
                          ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{m} Bulan</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  *Standar durasi trial lapangan berkisar antara 2 hingga 4 bulan.
                </p>
              </div>
            </div>
          </div>

          {/* SEKSI 2: SPESIFIKASI FISIK MATERIAL (REACT-SELECT & TITLE CASE) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Spesifikasi Fisik Material (Auto-Suggestion & Title Case)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Ketik atau pilih dari daftar yang tersedia
              </span>
            </div>

            {/* Baris 1: Kategori, Material & Merk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Kategori Pekerjaan *</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Pilih atau ketik kategori..."
                    options={DEFAULT_KATEGORI_OPTIONS}
                    value={kategori ? { label: kategori, value: kategori } : null}
                    onChange={(opt) => setKategori(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setKategori(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Nama Material / Item * <span className="text-[10px] text-red-600">(Autosuggest)</span>
                </Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Contoh: Keramik Lantai..."
                    options={DEFAULT_MATERIAL_OPTIONS}
                    value={namaItem ? { label: namaItem, value: namaItem } : null}
                    onChange={handleMaterialSelect}
                    onCreateOption={(val) => setNamaItem(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Merk / Brand *</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Contoh: Sandimas / Roman..."
                    options={DEFAULT_MERK_OPTIONS}
                    value={merk ? { label: merk, value: merk } : null}
                    onChange={(opt) => setMerk(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setMerk(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>
            </div>

            {/* Baris 2: Ukuran, Warna, Tipe, Permukaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Ukuran / Dimensi</Label>
                <div className="flex gap-1.5 mt-1.5">
                  <Input
                    className="h-9 text-xs flex-1 bg-slate-50 border-slate-200"
                    value={ukuranNilai}
                    onChange={(e) => setUkuranNilai(e.target.value)}
                    placeholder="60x60"
                  />
                  <Select value={ukuranSatuan} onValueChange={setUkuranSatuan}>
                    <SelectTrigger className="h-9 w-18 text-xs bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-70">
                      <SelectItem value="cm" className="text-xs">cm</SelectItem>
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="m" className="text-xs">m</SelectItem>
                      <SelectItem value="inch" className="text-xs">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Warna</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Contoh: Grey Rock..."
                    options={DEFAULT_WARNA_OPTIONS}
                    value={warna ? { label: warna, value: warna } : null}
                    onChange={(opt) => setWarna(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setWarna(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Tipe / Motif</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Contoh: Sicily Grey..."
                    options={DEFAULT_TIPE_OPTIONS}
                    value={tipe ? { label: tipe, value: tipe } : null}
                    onChange={(opt) => setTipe(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setTipe(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Finishing Permukaan</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Contoh: Matte Anti-Slip..."
                    options={DEFAULT_PERMUKAAN_OPTIONS}
                    value={permukaan ? { label: permukaan, value: permukaan } : null}
                    onChange={(opt) => setPermukaan(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setPermukaan(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>
            </div>

            {/* Baris 3: Ketebalan, Toleransi, Posisi, Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Ketebalan</Label>
                <div className="flex gap-1.5 mt-1.5">
                  <Input
                    className="h-9 text-xs flex-1 bg-slate-50 border-slate-200"
                    value={tebalNilai}
                    onChange={(e) => setTebalNilai(e.target.value)}
                    placeholder="9"
                  />
                  <Select value={tebalSatuan} onValueChange={setTebalSatuan}>
                    <SelectTrigger className="h-9 w-18 text-xs bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-70">
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="cm" className="text-xs">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Toleransi</Label>
                <div className="flex gap-1.5 mt-1.5">
                  <Input
                    className="h-9 text-xs flex-1 bg-slate-50 border-slate-200"
                    value={toleransiNilai}
                    onChange={(e) => setToleransiNilai(e.target.value)}
                    placeholder="0.5"
                  />
                  <Select value={toleransiSatuan} onValueChange={setToleransiSatuan}>
                    <SelectTrigger className="h-9 w-18 text-xs bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-70">
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="%" className="text-xs">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Posisi Implementasi</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Pilih posisi..."
                    options={DEFAULT_POSISI_OPTIONS}
                    value={implementasi ? { label: implementasi, value: implementasi } : null}
                    onChange={(opt) => setImplementasi(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setImplementasi(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Lokasi / Area Toko</Label>
                <div className="mt-1.5">
                  <CreatableSelect
                    isClearable
                    placeholder="Pilih area..."
                    options={DEFAULT_AREA_OPTIONS}
                    value={lokasi ? { label: lokasi, value: lokasi } : null}
                    onChange={(opt) => setLokasi(opt ? formatTitleCase(opt.value) : "")}
                    onCreateOption={(val) => setLokasi(formatTitleCase(val))}
                    styles={comboboxStyles}
                  />
                </div>
              </div>
            </div>

            {/* Baris 4: Cabang Uji Coba, Satuan, dan Catatan Tambahan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Cabang Uji Coba</Label>
                <Select value={cabang} onValueChange={setCabang}>
                  <SelectTrigger className="mt-1.5 h-9 bg-slate-50 border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-70">
                    {CABANG_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        Cabang {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Satuan Pekerjaan</Label>
                <Input
                  className="mt-1.5 h-9 text-xs bg-slate-50 border-slate-200"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value.toLowerCase())}
                  placeholder="m2 / unit / m1 / m3"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Catatan Spesifikasi (Opsional)</Label>
                <Input
                  className="mt-1.5 h-9 text-xs bg-slate-50 border-slate-200"
                  value={informasiTambahan}
                  onChange={(e) => setInformasiTambahan(e.target.value)}
                  placeholder="Keterangan teknis / SNI..."
                />
              </div>
            </div>
          </div>

          {/* SEKSI 3: PARAMETER KOMERSIAL AWAL & BONGKARAN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Coins className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Parameter Biaya Awal & Lingkup Pekerjaan
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Estimasi Harga Awal Maker (Rp)
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <Input
                    type="number"
                    className="pl-9 h-10 text-xs font-semibold bg-slate-50 border-slate-200"
                    value={estimasiHarga}
                    onChange={(e) => setEstimasiHarga(Number(e.target.value))}
                    placeholder="125000"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  *Acuan komersial awal dari Maker. Tim S&B tetap memiliki wewenang untuk menyesuaikan harga final & koefisien.
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Checkbox
                    id="bongkaran-checkbox"
                    checked={isTermasukBongkaran}
                    onCheckedChange={(checked) => setIsTermasukBongkaran(Boolean(checked))}
                  />
                  <label
                    htmlFor="bongkaran-checkbox"
                    className="text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    Termasuk Pekerjaan Bongkaran?
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-1">
                  Centang bila instalasi material uji coba memerlukan pembongkaran struktur eksisting di toko.
                </p>
              </div>
            </div>
          </div>

          {/* SEKSI 4: UPLOAD GAMBAR LAMPIRAN NYATA & ALASAN TRIAL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                4. Foto Spesifikasi Material & Alasan Uji Coba
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Komponen Upload Gambar Nyata dengan Preview Thumbnail */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Foto / Brosur Spesifikasi</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {lampiranPreview ? (
                  <div className="mt-2 relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lampiranPreview}
                        alt="Preview Lampiran"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-bold text-slate-900 block truncate">{lampiranName}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Foto siap diunggah
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 p-4 border-2 border-dashed border-slate-200 hover:border-red-400 bg-slate-50 hover:bg-red-50/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Pilih atau Tarik Foto ke Sini</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Mendukung JPG, PNG, atau WebP (Maks. 5MB)</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Alasan / Urgensi Uji Coba Lapangan *</Label>
                <Textarea
                  className="mt-2 h-24 text-xs bg-slate-50 border-slate-200"
                  placeholder="Jelaskan tujuan pengujian, parameter evaluasi daya tahan, atau urgensi operasional di gerai..."
                  value={alasanTrial}
                  onChange={(e) => setAlasanTrial(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Live Preview Deskripsi Otomatis */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Deskripsi Standar Otomatis (Live Preview):</span>
            </div>
            <p className="font-mono text-slate-700 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {deskripsiOtomatis}
            </p>
          </div>
        </div>

        {/* Footer Aksi Modal */}
        <DialogFooter className="p-4 sm:p-5 border-t border-slate-200 bg-white sticky bottom-0 z-30 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(true)}
              className="text-xs cursor-pointer"
            >
              Simpan Draf
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(false)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 shadow-xs cursor-pointer"
            >
              Kirim Pengajuan Trial
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
