// =============================================================================
// components/prototipe-trial/ModalTambahTrial.tsx
// Modal Formulir Pengajuan Item Trial Baru (Maker) - Standar SPARTA
// Fitur:
// 1. React-Select (CreatableSelect) dengan Auto-Suggestion Cerdas
// 2. Auto-Formatting Title Case (Kapitalisasi Otomatis Setiap Kata)
// 3. Kode Item & Kode Master Item Otomatis Terintegrasi (Logika getKodeData)
// 4. Durasi & Alasan Pengajuan Trial Terpadu dalam 1 Bagian
// 5. Bagian Terpisah Khusus Foto / Lampiran Spesifikasi Material
// 6. Panel Konteks Simulator Prototype (Maker & Cabang Uji Coba)
// 7. Estimasi Harga Awal, Toggle Bongkaran, dan Deskripsi Otomatis
// =============================================================================

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  FlaskConical,
  Upload,
  Clock,
  Sparkles,
  X,
  Layers,
  Coins,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { StylesConfig } from "react-select";
import { TrialItem, TrialStatus, LampiranFileItem } from "./types";
import { addTrialItem, updateTrialItem, useTrialStore } from "./store";
import {
  getKodeData,
  generateDeskripsiOtomatis,
  PengajuanHargaItem,
} from "@/components/pengajuan-harga/types";

interface ModalTambahTrialProps {
  isOpen: boolean;
  onClose: () => void;
  nextIndex?: number;
  onSuccess?: (item: TrialItem) => void;
  itemToEdit?: TrialItem | null;
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
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
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

// Styling Khusus Satuan Compact (Ukuran, Tebal, Toleransi)
const unitComboboxStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#dc2626" : "#cbd5e1",
    fontSize: "12px",
    backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
    boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
  }),
  menu: (base) => ({
    ...base,
    fontSize: "12px",
    zIndex: 70,
    minWidth: "85px",
    borderRadius: "0.5rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
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
  }),
  input: (base) => ({
    ...base,
    margin: "0",
    padding: "0",
    fontSize: "12px",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "2px",
    color: "#64748b",
  }),
};

// Opsi Pilihan Aktor Maker
const MAKER_OPTIONS = [
  {
    label: "Pak Wiwit (Regional Manager - Senior)",
    value: "Pak Wiwit",
    role: "MAKER_SENIOR",
  },
  {
    label: "Pak Jhon (Regional Manager - Senior)",
    value: "Pak Jhon",
    role: "MAKER_SENIOR",
  },
  {
    label: "Pak Andy (BMES Manager - Senior)",
    value: "Pak Andy",
    role: "MAKER_SENIOR",
  },
  {
    label: "Pak Eko Indra (PP Manager - Senior [Bypass PP])",
    value: "Pak Eko Indra",
    role: "PP_MANAGER",
  },
  {
    label: "Bima (BMES Specialist - Junior)",
    value: "Bima",
    role: "MAKER_JUNIOR",
  },
  {
    label: "Syahid Jaya (BMES Specialist - Junior)",
    value: "Syahid Jaya",
    role: "MAKER_JUNIOR",
  },
  {
    label: "Pak Iqbal (BMES Specialist - Junior)",
    value: "Pak Iqbal",
    role: "MAKER_JUNIOR",
  },
  {
    label: "Annisa Purnamasari / Mbak Caca (PP Specialist - Junior)",
    value: "Annisa Purnamasari",
    role: "MAKER_JUNIOR",
  },
  {
    label: "Pak Dyan (S&B Specialist - Junior)",
    value: "Pak Dyan",
    role: "MAKER_JUNIOR",
  },
  {
    label: "Pak Permadi (S&B Specialist - Junior)",
    value: "Pak Permadi",
    role: "MAKER_JUNIOR",
  },
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
  {
    label: "Keramik Lantai Matte Heavy Duty",
    value: "Keramik Lantai Matte Heavy Duty",
    kategori: "Pekerjaan Keramik",
    ukuran: "60x60",
    merk: "Sandimas",
    satuan: "m2",
  },
  {
    label: "Cat Epoxy Floor Self-Leveling",
    value: "Cat Epoxy Floor Self-Leveling",
    kategori: "Pekerjaan Finishing",
    ukuran: "20",
    merk: "Propan",
    satuan: "m2",
  },
  {
    label: "Plafon PVC Waterproof Anti-Rayap",
    value: "Plafon PVC Waterproof Anti-Rayap",
    kategori: "Pekerjaan Plafon",
    ukuran: "20x400",
    merk: "Shunda Plafon",
    satuan: "m2",
  },
  {
    label: "Lampu LED Batten High Lumen Eco",
    value: "Lampu LED Batten High Lumen Eco",
    kategori: "Pekerjaan Elektrikal",
    ukuran: "120",
    merk: "Philips",
    satuan: "unit",
  },
  {
    label: "Kloset Duduk Eco-Flush Dual Button",
    value: "Kloset Duduk Eco-Flush Dual Button",
    kategori: "Pekerjaan Sanitair",
    ukuran: "36x70x74",
    merk: "Toto",
    satuan: "unit",
  },
  {
    label: "Vinyl Plank Rigid Core Click 5mm",
    value: "Vinyl Plank Rigid Core Click 5mm",
    kategori: "Pekerjaan Lantai",
    ukuran: "18x122",
    merk: "Duma",
    satuan: "m2",
  },
  {
    label: "Granit Tile Nano Polished",
    value: "Granit Tile Nano Polished",
    kategori: "Pekerjaan Keramik",
    ukuran: "80x80",
    merk: "Roman",
    satuan: "m2",
  },
  {
    label: "Bata Ringan AAC Presisi",
    value: "Bata Ringan AAC Presisi",
    kategori: "Pekerjaan Pasangan",
    ukuran: "60x20x10",
    merk: "Batu Alam",
    satuan: "m3",
  },
  {
    label: "WPC Wallpanel Wood Texture Fluted",
    value: "WPC Wallpanel Wood Texture Fluted",
    kategori: "Pekerjaan Dinding",
    ukuran: "20x290",
    merk: "Duma",
    satuan: "m2",
  },
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

const DEFAULT_UKURAN_OPTIONS = [
  { label: "60x60", value: "60x60" },
  { label: "40x40", value: "40x40" },
  { label: "30x30", value: "30x30" },
  { label: "30x60", value: "30x60" },
  { label: "80x80", value: "80x80" },
  { label: "50x50", value: "50x50" },
  { label: "20x20", value: "20x20" },
  { label: "15x90", value: "15x90" },
  { label: "20x290", value: "20x290" },
  { label: "20x400", value: "20x400" },
  { label: "120", value: "120" },
  { label: "120x240", value: "120x240" },
  { label: "100x210", value: "100x210" },
  { label: "300x300", value: "300x300" },
  { label: "4", value: "4" },
  { label: "6", value: "6" },
  { label: "20", value: "20" },
];

const SATUAN_UKURAN_OPTIONS = [
  { label: "cm", value: "cm" },
  { label: "mm", value: "mm" },
  { label: "m", value: "m" },
  { label: "inch", value: "inch" },
];

const DEFAULT_TEBAL_OPTIONS = [
  { label: "9", value: "9" },
  { label: "10", value: "10" },
  { label: "12", value: "12" },
  { label: "8", value: "8" },
  { label: "5", value: "5" },
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "0.5", value: "0.5" },
];

const SATUAN_TEBAL_OPTIONS = [
  { label: "mm", value: "mm" },
  { label: "cm", value: "cm" },
  { label: "m", value: "m" },
];

const DEFAULT_TOLERANSI_OPTIONS = [
  { label: "0.5", value: "0.5" },
  { label: "0.2", value: "0.2" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "5", value: "5" },
];

const SATUAN_TOLERANSI_OPTIONS = [
  { label: "mm", value: "mm" },
  { label: "%", value: "%" },
  { label: "cm", value: "cm" },
];

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ModalTambahTrial({
  isOpen,
  onClose,
  nextIndex = 110,
  onSuccess,
  itemToEdit = null,
}: ModalTambahTrialProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { items: existingTrialItems } = useTrialStore();

  // Konteks Prototype (Aktor Maker & Cabang Uji Coba)
  const [makerOption] = useState(MAKER_OPTIONS[0]);
  const [cabang] = useState("Cikokol");

  // Durasi Masa Uji Coba
  const [durasiBulan, setDurasiBulan] = useState<2 | 3 | 4>(3);
  const [alasanTrial, setAlasanTrial] = useState("");

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
  const [satuan, setSatuan] = useState("m2");
  const [informasiTambahan, setInformasiTambahan] = useState("");

  // Parameter Finansial & Pekerjaan Bongkaran
  const [estimasiHarga, setEstimasiHarga] = useState<number>(125000);
  const [isTermasukBongkaran, setIsTermasukBongkaran] = useState(false);

  // Lampiran Berkas (Mendukung Multi-Upload / Bulking)
  const [lampiranList, setLampiranList] = useState<UploadedFileItem[]>([]);

  // Prefill data saat mode edit draf
  useEffect(() => {
    if (isOpen && itemToEdit) {
      setNamaItem(itemToEdit.item || "");
      setKategori(itemToEdit.kategori || "Pekerjaan Keramik");
      setMerk(itemToEdit.merk || "");
      setWarna(itemToEdit.warna || "");
      setTipe(itemToEdit.tipe || "");
      setPermukaan(itemToEdit.permukaan || "Matte Anti-Slip");
      setImplementasi(itemToEdit.implementasi || "Lantai Gerai");
      setLokasi(itemToEdit.lokasi || "Area Sales & Kasir");
      setSatuan(itemToEdit.satuan || "m2");
      setInformasiTambahan(itemToEdit.informasiTambahan || "");
      setEstimasiHarga(itemToEdit.estimasiHargaMaker || 125000);
      setIsTermasukBongkaran(Boolean(itemToEdit.isTermasukBongkaran));
      setAlasanTrial(itemToEdit.alasanTrial || "");
      setDurasiBulan(itemToEdit.durasiBulan || 3);
      if (itemToEdit.lampiranMakerList) {
        setLampiranList(
          itemToEdit.lampiranMakerList.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size || 1024,
            type: f.type || "application/pdf",
            url: f.url,
            isImage: Boolean(f.name.match(/\.(jpg|jpeg|png|webp)$/i)),
          }))
        );
      }
    }
  }, [isOpen, itemToEdit]);

  // Nilai Gabungan Ukuran, Tebal, dan Toleransi
  const combinedUkuran = useMemo(() => {
    if (!ukuranNilai.trim()) return "";
    return [ukuranNilai.trim(), ukuranSatuan.trim()].filter(Boolean).join(" ");
  }, [ukuranNilai, ukuranSatuan]);

  const combinedTebal = useMemo(() => {
    if (!tebalNilai.trim()) return "";
    return [tebalNilai.trim(), tebalSatuan.trim()].filter(Boolean).join(" ");
  }, [tebalNilai, tebalSatuan]);

  const combinedToleransi = useMemo(() => {
    if (!toleransiNilai.trim()) return "";
    return [toleransiNilai.trim(), toleransiSatuan.trim()]
      .filter(Boolean)
      .join(" ");
  }, [toleransiNilai, toleransiSatuan]);

  const durasiHari = useMemo(() => durasiBulan * 30, [durasiBulan]);

  // Kalkulasi Kode Item & Kode Master Item Standar SPARTA (getKodeData)
  const kodeData = useMemo(() => {
    return getKodeData({
      kategori,
      item: namaItem,
      implementasi,
      lokasi,
      ukuran: combinedUkuran,
      merk,
      warna,
      tipe,
      permukaan,
      tebal: combinedTebal,
      toleransi: combinedToleransi,
      nextIndex,
      existingItems: existingTrialItems as unknown as PengajuanHargaItem[],
    });
  }, [
    kategori,
    namaItem,
    implementasi,
    lokasi,
    combinedUkuran,
    merk,
    warna,
    tipe,
    permukaan,
    combinedTebal,
    combinedToleransi,
    nextIndex,
    existingTrialItems,
  ]);

  const [kodeItem, setKodeItem] = useState(
    `SIP-${String(nextIndex).padStart(3, "0")}`,
  );
  const [kodeMaster, setKodeMaster] = useState("");
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setKodeItem(kodeData.kodeItem);
    setKodeMaster(kodeData.kodeMaster);
  }, [kodeData]);

  useEffect(() => {
    const desc = generateDeskripsiOtomatis({
      item: namaItem,
      ukuran: combinedUkuran,
      merk,
      warna,
      tipe,
      permukaan,
      tebal: combinedTebal,
      toleransi: combinedToleransi,
      informasiTambahan,
      lokasi,
      implementasi,
    });
    setDeskripsiOtomatis(desc);
  }, [
    namaItem,
    combinedUkuran,
    merk,
    warna,
    tipe,
    permukaan,
    combinedTebal,
    combinedToleransi,
    informasiTambahan,
    lokasi,
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
      (m) => m.value.toLowerCase() === option.value.toLowerCase(),
    );
    if (found) {
      if (found.kategori) setKategori(found.kategori);
      if (found.ukuran) setUkuranNilai(found.ukuran);
      if (found.merk) setMerk(found.merk);
      if (found.satuan) setSatuan(found.satuan);
    }
  };

  // Handler Upload Dokumen & Gambar (Mendukung Multi-Upload / Bulking)
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newItems: UploadedFileItem[] = [];

    fileArray.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Berkas "${file.name}" melebihi batas maksimal 10MB.`);
        return;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const isImg = file.type.startsWith("image/");
      const url = URL.createObjectURL(file);

      newItems.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        isImage: isImg,
      });
    });

    if (newItems.length > 0) {
      setLampiranList((prev) => [...prev, ...newItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setLampiranList((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAllFiles = () => {
    setLampiranList([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (isDraft: boolean) => {
    if (!isDraft && (!namaItem.trim() || !merk.trim() || !alasanTrial.trim())) {
      alert("Mohon lengkapi Nama Item, Merk, dan Alasan Pengajuan Trial.");
      return;
    }

    if (!isDraft && kodeData.isDuplicate) {
      alert(
        "Peringatan: Material ini terdeteksi duplikat dengan item yang sudah ada.",
      );
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
    const finalKodeItem = kodeItem.trim() || kodeData.kodeItem;
    const finalKodeMaster = kodeMaster.trim() || kodeData.kodeMaster;

    const firstFile = lampiranList[0];
    const lampiranMakerName =
      lampiranList.length === 1
        ? lampiranList[0].name
        : lampiranList.length > 1
          ? `${lampiranList[0].name} (+${lampiranList.length - 1} berkas)`
          : undefined;
    const lampiranMakerUrl = firstFile?.url;
    const lampiranMakerList: LampiranFileItem[] = lampiranList.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      size: f.size,
      type: f.type,
    }));

    const newItem: TrialItem = {
      id: `trial-${Date.now()}`,
      kode: finalKodeItem,
      kodeMaster: finalKodeMaster,
      item: namaItem || "Item Uji Coba Trial",
      kategori,
      ukuran: combinedUkuran || `${ukuranNilai} ${ukuranSatuan}`,
      merk,
      warna,
      tipe,
      permukaan,
      tebal: combinedTebal || `${tebalNilai} ${tebalSatuan}`,
      toleransi: combinedToleransi || `${toleransiNilai} ${toleransiSatuan}`,
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
      lampiranMakerName,
      lampiranMakerUrl,
      lampiranMakerList: lampiranMakerList.length > 0 ? lampiranMakerList : undefined,
      makerRole: (makerOption.role as TrialItem['makerRole']) || 'MAKER_SENIOR',
      makerNama: makerOption.value,
      tanggalPengajuan: itemToEdit?.tanggalPengajuan || today,
      status: statusTarget,
      historyLog: itemToEdit
        ? [
            ...itemToEdit.historyLog,
            {
              role: `Maker (${makerOption.role})`,
              namaUser: makerOption.value,
              action: isDraft ? 'SUBMIT' : 'RE_ENTRY',
              tanggal: today,
              catatan: isDraft ? 'Draf diperbarui oleh Maker.' : 'Item diajukan resmi kembali oleh Maker.',
            },
          ]
        : [
            {
              role: `Maker (${makerOption.role})`,
              namaUser: makerOption.value,
              action: 'SUBMIT',
              tanggal: today,
              catatan: isDraft
                ? 'Pengajuan disimpan sebagai draf.'
                : makerOption.role === 'PP_MANAGER'
                  ? 'Diajukan oleh PP Manager (Alur PP Manager otomatis dilewati ke B&M General Manager).'
                  : 'Pengajuan trial dikirimkan ke PP Manager untuk verifikasi awal.',
            },
          ],
    };

    if (itemToEdit) {
      updateTrialItem(itemToEdit.id, () => ({
        ...newItem,
        id: itemToEdit.id,
        kode: itemToEdit.kode,
        kodeMaster: itemToEdit.kodeMaster || newItem.kodeMaster,
      }));
    } else {
      addTrialItem(newItem);
    }
    if (onSuccess) onSuccess(newItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white border border-slate-200 shadow-xl">
        {/* Header Modal */}
        <DialogHeader className="p-5 sm:p-6 border-b border-slate-200 bg-white sticky top-0 z-30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Pengajuan Item Trial Baru</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Masa Uji Lapangan
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode Item:{" "}
                <span className="font-mono font-bold text-red-600">
                  {kodeItem}
                </span>{" "}
                &bull; Kode Master:{" "}
                <span className="font-mono font-bold text-slate-700">
                  {kodeMaster || "Menyesuaikan"}
                </span>
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
          {/* PANEL: KONTEKS PENGAJUAN (SIMULATOR PROTOTYPE)
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Konteks Pengajuan (Simulator Prototype)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Aktor Pengaju (Maker)
                </Label>
                <Select
                  value={makerOption.value}
                  onValueChange={(val) => {
                    const opt = MAKER_OPTIONS.find((o) => o.value === val);
                    if (opt) setMakerOption(opt);
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 bg-white border-slate-200 text-xs">
                    <SelectValue placeholder="Pilih Maker" />
                  </SelectTrigger>
                  <SelectContent className="z-70">
                    {MAKER_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Cabang Uji Coba
                </Label>
                <Select value={cabang} onValueChange={setCabang}>
                  <SelectTrigger className="mt-1 h-9 bg-white border-slate-200 text-xs">
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
                <p className="text-[10px] text-slate-500 mt-1">
                  *Cabang penempatan pengujian operasional material di lapangan.
                </p>
              </div>
            </div>
          </div> */}

          {/* SEKSI 1: SPESIFIKASI MATERIAL (DIBAGI MENJADI 3 SUB-BAGIAN TERSTRUKTUR) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Spesifikasi Material
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Ketik atau pilih dari opsi yang tersedia
              </span>
            </div>

            {/* Sub-bagian: Identitas & Klasifikasi Pokok */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Klasifikasi Material
                </h5>
                <span className="text-[10px] text-slate-400 font-medium">*Wajib diisi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Kategori Pekerjaan *
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Pilih/ketik kategori..."
                      options={DEFAULT_KATEGORI_OPTIONS}
                      value={
                        kategori ? { label: kategori, value: kategori } : null
                      }
                      onChange={(opt) =>
                        setKategori(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setKategori(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Nama Material / Item *
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Contoh: Keramik Lantai..."
                      options={DEFAULT_MATERIAL_OPTIONS}
                      value={
                        namaItem ? { label: namaItem, value: namaItem } : null
                      }
                      onChange={handleMaterialSelect}
                      onCreateOption={(val) => setNamaItem(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Merk / Brand *
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Contoh: Sandimas / Roman..."
                      options={DEFAULT_MERK_OPTIONS}
                      value={merk ? { label: merk, value: merk } : null}
                      onChange={(opt) =>
                        setMerk(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setMerk(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Tipe / Motif
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Contoh: Sicily Grey..."
                      options={DEFAULT_TIPE_OPTIONS}
                      value={tipe ? { label: tipe, value: tipe } : null}
                      onChange={(opt) =>
                        setTipe(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setTipe(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-bagian: Dimensi & Karakteristik Fisik */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Dimensi &amp; Karakteristik Fisik
                </h5>
                <span className="text-[10px] text-slate-400 font-medium">
                  Ukuran, ketebalan, toleransi &amp; tampilan
                </span>
              </div>

              {/* Baris 1: Ukuran, Ketebalan, Toleransi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Ukuran / Dimensi
                  </Label>
                  <div className="flex gap-1.5 mt-1.5">
                    <div className="flex-1 min-w-0">
                      <CreatableSelect
                        isClearable
                        placeholder="60x60..."
                        options={DEFAULT_UKURAN_OPTIONS}
                        value={
                          ukuranNilai
                            ? { label: ukuranNilai, value: ukuranNilai }
                            : null
                        }
                        onChange={(opt) => setUkuranNilai(opt ? opt.value : "")}
                        onCreateOption={(val) => setUkuranNilai(val)}
                        styles={comboboxStyles}
                      />
                    </div>
                    <div className="w-22 shrink-0">
                      <CreatableSelect
                        placeholder="cm"
                        options={SATUAN_UKURAN_OPTIONS}
                        value={
                          ukuranSatuan
                            ? { label: ukuranSatuan, value: ukuranSatuan }
                            : null
                        }
                        onChange={(opt) => setUkuranSatuan(opt ? opt.value : "cm")}
                        onCreateOption={(val) => setUkuranSatuan(val)}
                        styles={unitComboboxStyles}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Ketebalan
                  </Label>
                  <div className="flex gap-1.5 mt-1.5">
                    <div className="flex-1 min-w-0">
                      <CreatableSelect
                        isClearable
                        placeholder="9..."
                        options={DEFAULT_TEBAL_OPTIONS}
                        value={
                          tebalNilai
                            ? { label: tebalNilai, value: tebalNilai }
                            : null
                        }
                        onChange={(opt) => setTebalNilai(opt ? opt.value : "")}
                        onCreateOption={(val) => setTebalNilai(val)}
                        styles={comboboxStyles}
                      />
                    </div>
                    <div className="w-22 shrink-0">
                      <CreatableSelect
                        placeholder="mm"
                        options={SATUAN_TEBAL_OPTIONS}
                        value={
                          tebalSatuan
                            ? { label: tebalSatuan, value: tebalSatuan }
                            : null
                        }
                        onChange={(opt) => setTebalSatuan(opt ? opt.value : "mm")}
                        onCreateOption={(val) => setTebalSatuan(val)}
                        styles={unitComboboxStyles}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Toleransi
                  </Label>
                  <div className="flex gap-1.5 mt-1.5">
                    <div className="flex-1 min-w-0">
                      <CreatableSelect
                        isClearable
                        placeholder="0.5..."
                        options={DEFAULT_TOLERANSI_OPTIONS}
                        value={
                          toleransiNilai
                            ? { label: toleransiNilai, value: toleransiNilai }
                            : null
                        }
                        onChange={(opt) =>
                          setToleransiNilai(opt ? opt.value : "")
                        }
                        onCreateOption={(val) => setToleransiNilai(val)}
                        styles={comboboxStyles}
                      />
                    </div>
                    <div className="w-22 shrink-0">
                      <CreatableSelect
                        placeholder="mm"
                        options={SATUAN_TOLERANSI_OPTIONS}
                        value={
                          toleransiSatuan
                            ? { label: toleransiSatuan, value: toleransiSatuan }
                            : null
                        }
                        onChange={(opt) =>
                          setToleransiSatuan(opt ? opt.value : "mm")
                        }
                        onCreateOption={(val) => setToleransiSatuan(val)}
                        styles={unitComboboxStyles}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Baris 2: Warna & Finishing Permukaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-slate-200/60">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Warna
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Contoh: Grey Rock..."
                      options={DEFAULT_WARNA_OPTIONS}
                      value={warna ? { label: warna, value: warna } : null}
                      onChange={(opt) =>
                        setWarna(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setWarna(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Finishing Permukaan
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Contoh: Matte Anti-Slip..."
                      options={DEFAULT_PERMUKAAN_OPTIONS}
                      value={
                        permukaan ? { label: permukaan, value: permukaan } : null
                      }
                      onChange={(opt) =>
                        setPermukaan(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setPermukaan(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-bagian: Penempatan Lokasi & Implementasi */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Penempatan Lokasi &amp; Implementasi
                </h5>
                <span className="text-[10px] text-slate-400 font-medium">
                  Implementasi penempatan di gerai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Posisi Implementasi
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Pilih posisi..."
                      options={DEFAULT_POSISI_OPTIONS}
                      value={
                        implementasi
                          ? { label: implementasi, value: implementasi }
                          : null
                      }
                      onChange={(opt) =>
                        setImplementasi(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) =>
                        setImplementasi(formatTitleCase(val))
                      }
                      styles={comboboxStyles}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Lokasi / Area Toko
                  </Label>
                  <div className="mt-1.5">
                    <CreatableSelect
                      isClearable
                      placeholder="Pilih area..."
                      options={DEFAULT_AREA_OPTIONS}
                      value={lokasi ? { label: lokasi, value: lokasi } : null}
                      onChange={(opt) =>
                        setLokasi(opt ? formatTitleCase(opt.value) : "")
                      }
                      onCreateOption={(val) => setLokasi(formatTitleCase(val))}
                      styles={comboboxStyles}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Catatan (Opsional)
                </Label>
                <Textarea
                  className="mt-1.5 h-20 text-xs bg-white border-slate-200 leading-relaxed"
                  placeholder="Ketik catatan teknis, standar SNI, atau informasi spesifikasi tambahan..."
                  value={informasiTambahan}
                  onChange={(e) => setInformasiTambahan(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SEKSI 2: PARAMETER BIAYA AWAL & LINGKUP PEKERJAAN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Coins className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Biaya & Lingkup Pekerjaan
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Harga (Rp)
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="pl-9 h-10 text-xs font-semibold bg-slate-50 border-slate-200"
                    value={
                      estimasiHarga ? estimasiHarga.toLocaleString("id-ID") : ""
                    }
                    onChange={(e) => {
                      const cleanNumbers = e.target.value.replace(/\D/g, "");
                      setEstimasiHarga(
                        cleanNumbers ? parseInt(cleanNumbers, 10) : 0,
                      );
                    }}
                    placeholder="125.000"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Checkbox
                    id="bongkaran-checkbox"
                    checked={isTermasukBongkaran}
                    onCheckedChange={(checked) =>
                      setIsTermasukBongkaran(Boolean(checked))
                    }
                  />
                  <label
                    htmlFor="bongkaran-checkbox"
                    className="text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    Termasuk Pekerjaan Bongkaran?
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI 3: DURASI MASA UJI & ALASAN PENGAJUAN TRIAL (1 BAGIAN TERPADU) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Durasi Masa Uji &amp; Alasan Pengajuan Trial
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Selector Durasi 2-4 Bulan */}
              <div>
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Pilihan Durasi Masa Uji Coba *</span>
                  <span className="text-[11px] text-red-600 font-semibold">
                    {durasiHari} Hari Kalender
                  </span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {([2, 3, 4] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setDurasiBulan(m)}
                      className={`h-11 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        durasiBulan === m
                          ? "bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{m} Bulan</span>
                      <span
                        className={`text-[10px] ${durasiBulan === m ? "text-red-100" : "text-slate-400"}`}
                      >
                        ({m * 30} Hari)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alasan / Urgensi Trial Lapangan */}
              <div>
                <Label className="text-xs font-bold text-slate-700">
                  Alasan*
                </Label>
                <Textarea
                  className="mt-2 h-24 text-xs bg-slate-50 border-slate-200 leading-relaxed"
                  placeholder="Jelaskan tujuan pengujian lapangan"
                  value={alasanTrial}
                  onChange={(e) => setAlasanTrial(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SEKSI 4: LAMPIRAN DOKUMEN & FOTO SPESIFIKASI MATERIAL (BULK UPLOAD) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  4. Lampiran Dokumen &amp; Foto Spesifikasi Material
                </h4>
              </div>
              {lampiranList.length > 0 && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {lampiranList.length} Berkas Terpilih
                </span>
              )}
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={handleFilesChange}
                className="hidden"
              />

              {/* Area Unggah (Dropzone / Tombol Upload Bulking) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <Upload className="w-7 h-7 text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-800">
                  Pilih atau Tarik Berkas Dokumen &amp; Foto ke Sini
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung unggah banyak berkas sekaligus: PDF, Word, Excel, JPG, PNG, WebP (Maks. 10MB per berkas)
                </span>
              </div>

              {/* Daftar Berkas Terunggah */}
              {lampiranList.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                    <span>Daftar Berkas Terlampir ({lampiranList.length})</span>
                    <button
                      type="button"
                      onClick={handleClearAllFiles}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {lampiranList.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 relative group hover:border-slate-300 transition-colors"
                      >
                        {file.isImage ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-red-200 bg-red-50 text-red-600 flex flex-col items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                            <span className="text-[8px] font-bold uppercase mt-0.5">
                              {file.name.split(".").pop() || "DOC"}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-xs">
                          <span
                            className="font-bold text-slate-900 block truncate"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {formatFileSize(file.size)} &bull;{" "}
                            {file.isImage ? "Foto/Gambar" : "Dokumen"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Hapus berkas ini"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {lampiranList.length} berkas siap disimpan
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-purple-600 hover:underline font-medium cursor-pointer"
                    >
                      + Tambah Berkas Lain
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEKSI 5: KODE MASTER & DESKRIPSI OTOMATIS (STANDAR SPARTA) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-red-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                5. Kode Master &amp; Deskripsi Otomatis
              </h4>
            </div>

            {/* Warning Duplikat jika ada */}
            {kodeData.isDuplicate && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    Peringatan: Item Serupa Terdeteksi!
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Spesifikasi fisik dan lokasi material ini identik dengan
                    item <strong>{kodeData.duplicateItem?.kode}</strong> (
                    {kodeData.duplicateItem?.kodeMaster}).
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kode Item
                </Label>
                <Input
                  value={kodeItem}
                  disabled
                  readOnly
                  className="h-9 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200"
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
                  <span>Deskripsi Standar Otomatis</span>
                </Label>
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">
                        Tersalin
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono min-h-[44px]">
                {deskripsiOtomatis || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Aksi Modal */}
        <DialogFooter className="p-4 sm:p-5 border-t border-slate-200 bg-white sticky bottom-0 z-30 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
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
              disabled={Boolean(kodeData.isDuplicate)}
              onClick={() => handleSubmit(false)}
              title={
                kodeData.isDuplicate
                  ? "Item serupa terdeteksi, ubah spesifikasi untuk melanjutkan"
                  : undefined
              }
              className={`text-white text-xs font-bold px-5 shadow-xs transition-colors ${
                kodeData.isDuplicate
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300 opacity-60"
                  : "bg-red-600 hover:bg-red-700 cursor-pointer"
              }`}
            >
              Kirim Pengajuan Trial
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
