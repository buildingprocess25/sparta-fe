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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import CreatableSelect from "react-select/creatable";
import {
  PengajuanHargaItem,
  generateDeskripsiOtomatis,
  getKodeData,
} from "./types";
import { Sparkles, Copy, Check, RotateCcw } from "lucide-react";

export interface FormPengajuanSpesifikasiProps {
  isOpen?: boolean;
  renderSurvey?: () => React.ReactNode;
  onClose: () => void;
  onSubmit: (item: PengajuanHargaItem) => void;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
  itemToEdit?: PengajuanHargaItem | null;
}

export type TambahPengajuanModalProps = FormPengajuanSpesifikasiProps;

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

const SATUAN_UKURAN_OPTIONS = [
  { label: "cm", value: "cm" },
  { label: "mm", value: "mm" },
  { label: "m", value: "m" },
  { label: "inch", value: "inch" },
];

const SATUAN_TEBAL_OPTIONS = [
  { label: "mm", value: "mm" },
  { label: "cm", value: "cm" },
  { label: "m", value: "m" },
];

const SATUAN_TOLERANSI_OPTIONS = [
  { label: "mm", value: "mm" },
  { label: "%", value: "%" },
  { label: "cm", value: "cm" },
];

const unitSelectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
    fontSize: "12px",
    boxShadow: "none",
  }),
  menu: (base: any) => ({
    ...base,
    minWidth: "90px",
    fontSize: "12px",
    zIndex: 50,
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 6px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    padding: "0",
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "2px",
  }),
};

const INITIAL_KATEGORI_OPTIONS = [
  "Pekerjaan Keramik",
  "Area Terbuka",
  "Pekerjaan Finishing",
  "Pekerjaan Pasangan",
  "Pekerjaan Sanitair",
  "Pekerjaan Lantai",
  "Pekerjaan Dinding",
  "Pekerjaan Plafon",
  "Pekerjaan Elektrikal",
  "Pekerjaan Pengecatan",
  "Pekerjaan Pintu & Jendela",
];

const INITIAL_UKURAN_OPTIONS = [
  "60x60",
  "40x40",
  "30x30",
  "30x60",
  "80x80",
  "50x50",
  "20x20",
  "15x90",
  "20x290",
  "20x400",
  "120",
  "120x240",
  "100x210",
  "300x300",
  "4",
  "6",
  "20",
];

const INITIAL_WARNA_OPTIONS = [
  "Grey",
  "White",
  "Cream",
  "Black",
  "Green",
  "Ivory",
  "Dark Grey",
  "Clear",
  "Oak Wood",
  "Teak Wood",
  "Signal Red",
  "Cool Daylight (6500K)",
  "Light Grey",
  "White Lily",
  "Natural Oak",
  "Hitam Anodized",
];

const INITIAL_TIPE_OPTIONS = [
  "Sicily Grey Matte",
  "Antique White",
  "Cream Carolina",
  "Green Moss",
  "Polish White",
  "Nero Portoro",
  "Travertine Cream Polish",
  "Pentalite Ultra Matt",
  "Rustic Stone Unpolished",
  "Moisture Shield 9mm",
  "Weatherbond Extreme",
  "Tempered Glass Frameless",
  "Plank Click Series",
  "One Sheet Solid",
  "dPorto Ivory Polished",
  "dPorto Ivory Matte Unpolished",
  "Shopfront 4\" Anodized",
  "Meson 59464 17W/18W",
  "Linear Fluted",
  "Linear Fluted 4-Groove",
  "Epogreen Multi-layer",
  "Hollow Anti-Sagging",
  "Essential SmartBright",
  "Silver Ion Shield",
  "Commercial Wear Layer 0.5mm",
  "Polos",
  "Wood",
];

const INITIAL_PERMUKAAN_OPTIONS = [
  "Matte",
  "Polish",
  "Glossy",
  "Unpolished",
  "Double Loading",
  "Nano Polish",
  "Embossed Wood",
  "Embossed Woodgrain",
  "Gloss Anti-Slip",
  "Matte Flat",
  "Diffuser Polycarbonate",
  "Satin Eggshell",
  "Deep Embossed Anti-Slip",
  "Semi Gloss",
  "Matt",
  "Halus",
  "Polished Edge",
  "Zincalume Coating",
  "Anodized",
  "Frosted Diffuser",
];

const comboboxStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#94a3b8" : "#e2e8f0",
    fontSize: "12px",
    backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#cbd5e1",
    },
  }),
  menu: (base: any) => ({
    ...base,
    fontSize: "12px",
    zIndex: 50,
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: "12px",
    backgroundColor: state.isSelected
      ? "#ef4444"
      : state.isFocused
      ? "#fee2e2"
      : undefined,
    color: state.isSelected ? "#ffffff" : "#1e293b",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#dc2626",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 8px",
    overflow: "hidden",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#1e293b",
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0",
    padding: "0",
    fontSize: "12px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    padding: "0 2px",
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "2px 4px",
    color: "#64748b",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: "2px 4px",
    color: "#64748b",
  }),
};

function parseNilaiDanSatuan(
  val?: string,
  defaultSatuan = "cm"
): { nilai: string; satuan: string } {
  if (!val) return { nilai: "", satuan: defaultSatuan };
  const trimmed = val.trim();
  const match = trimmed.match(/^(.+?)\s*([a-zA-Z%]+)$/);
  if (match) {
    return { nilai: match[1].trim(), satuan: match[2].trim() };
  }
  return { nilai: trimmed, satuan: defaultSatuan };
}

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

export function FormPengajuanSpesifikasi({
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

  // Ukuran dipisah nilai & satuan
  const [ukuranNilai, setUkuranNilai] = useState("");
  const [ukuranSatuan, setUkuranSatuan] = useState("cm");

  const [merk, setMerk] = useState("");
  const [warna, setWarna] = useState("");
  const [tipe, setTipe] = useState("");
  const [permukaan, setPermukaan] = useState("");

  // Ketebalan dipisah nilai & satuan
  const [tebalNilai, setTebalNilai] = useState("");
  const [tebalSatuan, setTebalSatuan] = useState("mm");

  // Toleransi dipisah nilai & satuan
  const [toleransiNilai, setToleransiNilai] = useState("");
  const [toleransiSatuan, setToleransiSatuan] = useState("mm");

  const [implementasi, setImplementasi] = useState<string[]>(["Dinding Gerai"]);
  const [lokasi, setLokasi] = useState<string[]>([]);
  const [jenisPengajuan, setJenisPengajuan] = useState<"Hanya Jasa" | "Material">("Material");
  const [isTermasukBongkaran, setIsTermasukBongkaran] = useState(false);
  const [informasiTambahan, setInformasiTambahan] = useState("");

  const [kodeItem, setKodeItem] = useState(
    `SIP-${String(nextIndex).padStart(3, "0")}`
  );
  const [kodeMaster, setKodeMaster] = useState("");
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState("");
  const [copied, setCopied] = useState(false);

  // Nilai gabungan
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
    return [toleransiNilai.trim(), toleransiSatuan.trim()].filter(Boolean).join(" ");
  }, [toleransiNilai, toleransiSatuan]);

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
    const uniqueMap = new Map();

    // 1. Existing items from store
    existingItems.forEach((i) => {
      const formattedName = formatTitleCase(i.item);
      if (!uniqueMap.has(formattedName.toLowerCase())) {
        uniqueMap.set(formattedName.toLowerCase(), {
          label: formattedName,
          value: formattedName,
          data: i,
        });
      }
    });

    // 2. Initial static options
    INITIAL_MATERIAL_OPTIONS.forEach((name) => {
      const formattedName = formatTitleCase(name);
      if (!uniqueMap.has(formattedName.toLowerCase())) {
        uniqueMap.set(formattedName.toLowerCase(), {
          label: formattedName,
          value: formattedName,
          data: null,
        });
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [existingItems]);

  const handleItemSelect = (selectedOption: any) => {
    if (!selectedOption) {
      setItem("");
      return;
    }

    setItem(formatTitleCase(selectedOption.value));

    if (selectedOption.data) {
      const target = selectedOption.data;
      setKategori(target.kategori || "Pekerjaan Keramik");

      const parsedUkuran = parseNilaiDanSatuan(target.ukuran, "cm");
      setUkuranNilai(parsedUkuran.nilai);
      setUkuranSatuan(parsedUkuran.satuan || "cm");

      setMerk(target.merk || "");
      setWarna(target.warna || "");
      setTipe(target.tipe || "");
      setPermukaan(target.permukaan || "");

      const parsedTebal = parseNilaiDanSatuan(target.tebal, "mm");
      setTebalNilai(parsedTebal.nilai);
      setTebalSatuan(parsedTebal.satuan || "mm");

      const parsedTol = parseNilaiDanSatuan(target.toleransi, "mm");
      setToleransiNilai(parsedTol.nilai);
      setToleransiSatuan(parsedTol.satuan || "mm");

      if (target.implementasi) {
        setImplementasi(
          Array.isArray(target.implementasi)
            ? target.implementasi
            : target.implementasi.split(",").map((s: string) => s.trim()).filter(Boolean)
        );
      }
      if (target.lokasi) {
        setLokasi(
          Array.isArray(target.lokasi)
            ? target.lokasi
            : target.lokasi.split(",").map((s: string) => s.trim()).filter(Boolean)
        );
      }
    }
  };

  const merkOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.merk).filter(Boolean);
    return Array.from(new Set([...INITIAL_MERK_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const posisiOptions = useMemo(() => {
    const fromExisting = existingItems
      .flatMap((i) => (Array.isArray(i.implementasi) ? i.implementasi : [i.implementasi]))
      .filter(Boolean) as string[];
    return Array.from(new Set([...INITIAL_POSISI_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const areaOptions = useMemo(() => {
    const fromExisting = existingItems
      .flatMap((i) => (Array.isArray(i.lokasi) ? i.lokasi : [i.lokasi]))
      .filter(Boolean) as string[];
    return Array.from(new Set([...INITIAL_AREA_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const kategoriOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.kategori).filter(Boolean);
    return Array.from(new Set([...INITIAL_KATEGORI_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const ukuranOptions = useMemo(() => {
    const fromExisting = existingItems
      .map((i) => parseNilaiDanSatuan(i.ukuran).nilai)
      .filter(Boolean);
    return Array.from(new Set([...INITIAL_UKURAN_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const warnaOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.warna).filter(Boolean);
    return Array.from(new Set([...INITIAL_WARNA_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const tipeOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.tipe).filter(Boolean);
    return Array.from(new Set([...INITIAL_TIPE_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const permukaanOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.permukaan).filter(Boolean);
    return Array.from(new Set([...INITIAL_PERMUKAAN_OPTIONS, ...fromExisting]));
  }, [existingItems]);

  const kodeData = useMemo(() => {
    return getKodeData({
      kategori,
      item,
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
      existingItems: otherItems,
    });
  }, [
    kategori,
    item,
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
    item,
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

  const populateForm = (target: PengajuanHargaItem) => {
    setKategori(target.kategori || "Pekerjaan Keramik");
    setItem(target.item || "");

    const parsedUkuran = parseNilaiDanSatuan(target.ukuran, "cm");
    setUkuranNilai(parsedUkuran.nilai);
    setUkuranSatuan(parsedUkuran.satuan || "cm");

    setMerk(target.merk || "");
    setWarna(target.warna || "");
    setTipe(target.tipe || "");
    setPermukaan(target.permukaan || "");

    const parsedTebal = parseNilaiDanSatuan(target.tebal, "mm");
    setTebalNilai(parsedTebal.nilai);
    setTebalSatuan(parsedTebal.satuan || "mm");

    const parsedTol = parseNilaiDanSatuan(target.toleransi, "mm");
    setToleransiNilai(parsedTol.nilai);
    setToleransiSatuan(parsedTol.satuan || "mm");

    setImplementasi(
      target.implementasi
        ? Array.isArray(target.implementasi)
          ? target.implementasi
          : target.implementasi.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Dinding Gerai"]
    );
    setLokasi(
      target.lokasi
        ? Array.isArray(target.lokasi)
          ? target.lokasi
          : target.lokasi.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    );
    setJenisPengajuan(target.jenisPengajuan || "Material");
    setIsTermasukBongkaran(target.isTermasukBongkaran || false);
    setInformasiTambahan(target.informasiTambahan || "");
    setKodeItem(target.kode || "");
    setKodeMaster(target.kodeMaster || "");
  };

  const handleReset = () => {
    setKategori("Pekerjaan Keramik");
    setItem("");
    setUkuranNilai("");
    setUkuranSatuan("cm");
    setMerk("");
    setWarna("");
    setTipe("");
    setPermukaan("");
    setTebalNilai("");
    setTebalSatuan("mm");
    setToleransiNilai("");
    setToleransiSatuan("mm");
    setImplementasi(["Dinding Gerai"]);
    setLokasi([]);
    setJenisPengajuan("Material");
    setIsTermasukBongkaran(false);
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
      !ukuranNilai.trim() ||
      !merk.trim() ||
      !tipe.trim() ||
      !warna.trim() ||
      !permukaan.trim() ||
      !tebalNilai.trim() ||
      implementasi.length === 0 ||
      lokasi.length === 0 ||
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
      ukuran: combinedUkuran,
      merk: merk.trim(),
      warna: warna.trim(),
      tipe: tipe.trim(),
      tebal: combinedTebal,
      permukaan: permukaan.trim(),
      kategori: kategori.trim(),
      implementasi: Array.isArray(implementasi) ? implementasi.join(", ") : implementasi,
      lokasi: Array.isArray(lokasi) ? lokasi.join(", ") : lokasi,
      toleransi: combinedToleransi || undefined,
      informasiTambahan: informasiTambahan.trim(),
      jenisPengajuan,
      isTermasukBongkaran,
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
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 self-start sm:self-auto ${
              itemToEdit
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
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
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Jenis &amp; Item Utama
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Jenis Pengajuan <span className="text-red-500">*</span>
                  </span>
                </Label>
                <Select
                  value={jenisPengajuan}
                  onValueChange={(val) => setJenisPengajuan(val as "Hanya Jasa" | "Material")}
                >
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Hanya Jasa">Hanya Jasa</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">Material fisik atau hanya jasa pengerjaan</span>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[11px] font-semibold text-slate-700">Termasuk Pekerjaan Bongkaran?</span>
                    <Switch
                      checked={isTermasukBongkaran}
                      onCheckedChange={setIsTermasukBongkaran}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Nama Material / Item <span className="text-red-500">*</span>
                  </span>
                </Label>
                <CreatableSelect
                  value={item ? { label: item, value: item } : null}
                  onChange={handleItemSelect}
                  options={materialReactSelectOptions}
                  placeholder="Cari item eksisting atau ketik baru..."
                  formatCreateLabel={(val) => `Buat item baru: "${val}"`}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base) => ({
                      ...base,
                      width: "100%",
                      minWidth: "200px",
                      zIndex: 50,
                    }),
                    option: (base) => ({
                      ...base,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      fontSize: "12px",
                    }),
                  }}
                  maxMenuHeight={250}
                />
                <span className="text-[10px] text-slate-400">Pilih dari master atau ketik nama baru</span>
              </div>
            </div>

            {jenisPengajuan === "Hanya Jasa" && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>
                  Pengajuan <strong>Hanya Jasa</strong>. Pilih item yang sudah ada
                </p>
              </div>
            )}
            {jenisPengajuan === "Material" && item && existingItems.some((i) => i.item === item) && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>
                  Item <strong>sudah terdaftar</strong> di sistem. Pengajuan ini akan diteruskan sebagai form <strong>Review/Update Master</strong>.
                </p>
              </div>
            )}
            {jenisPengajuan === "Material" && item && !existingItems.some((i) => i.item === item) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2 mt-2">
                <p>
                  Item <strong>baru</strong>. Pengajuan akan dilanjutkan sebagai <strong>Pengajuan Master Harga Baru</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Data Pokok Material */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Data Pokok Material
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <CreatableSelect
                  value={kategori ? { label: kategori, value: kategori } : null}
                  onChange={(opt: any) => setKategori(opt ? opt.value : "")}
                  options={kategoriOptions.map((opt) => ({ label: opt, value: opt }))}
                  isDisabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik kategori..."
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={comboboxStyles}
                  maxMenuHeight={200}
                  isClearable
                />
                <span className="text-[10px] text-slate-400">Kategori lingkup pekerjaan</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ukuran / Dimensi <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0">
                    <CreatableSelect
                      value={ukuranNilai ? { label: ukuranNilai, value: ukuranNilai } : null}
                      onChange={(opt: any) => setUkuranNilai(opt ? opt.value : "")}
                      options={ukuranOptions.map((opt) => ({ label: opt, value: opt }))}
                      isDisabled={jenisPengajuan === "Hanya Jasa"}
                      placeholder="Pilih / ketik ukuran..."
                      formatCreateLabel={(val) => `Tambah "${val}"`}
                      styles={comboboxStyles}
                      maxMenuHeight={200}
                      isClearable
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <CreatableSelect
                      value={ukuranSatuan ? { label: ukuranSatuan, value: ukuranSatuan } : null}
                      onChange={(opt: any) => setUkuranSatuan(opt ? opt.value : "")}
                      options={SATUAN_UKURAN_OPTIONS}
                      isDisabled={jenisPengajuan === "Hanya Jasa"}
                      styles={unitSelectStyles}
                      placeholder="Satuan"
                      formatCreateLabel={(val) => `"${val}"`}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Nilai &amp; satuan terpisah</span>
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
                <span className="text-[10px] text-slate-400">Contoh: Roman</span>
              </div>
            </div>
          </div>

          {/* Section 3: Fisik & Karakteristik */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                3
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
                <CreatableSelect
                  value={warna ? { label: warna, value: warna } : null}
                  onChange={(opt: any) => setWarna(opt ? opt.value : "")}
                  options={warnaOptions.map((opt) => ({ label: opt, value: opt }))}
                  isDisabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik warna..."
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={comboboxStyles}
                  maxMenuHeight={200}
                  isClearable
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tipe / Motif <span className="text-red-500">*</span>
                </Label>
                <CreatableSelect
                  value={tipe ? { label: tipe, value: tipe } : null}
                  onChange={(opt: any) => setTipe(opt ? opt.value : "")}
                  options={tipeOptions.map((opt) => ({ label: opt, value: opt }))}
                  isDisabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik tipe..."
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={comboboxStyles}
                  maxMenuHeight={200}
                  isClearable
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Permukaan <span className="text-red-500">*</span>
                </Label>
                <CreatableSelect
                  value={permukaan ? { label: permukaan, value: permukaan } : null}
                  onChange={(opt: any) => setPermukaan(opt ? opt.value : "")}
                  options={permukaanOptions.map((opt) => ({ label: opt, value: opt }))}
                  isDisabled={jenisPengajuan === "Hanya Jasa"}
                  placeholder="Pilih / ketik permukaan..."
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={comboboxStyles}
                  maxMenuHeight={200}
                  isClearable
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ketebalan <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={tebalNilai}
                    onChange={(e) => setTebalNilai(e.target.value)}
                    disabled={jenisPengajuan === "Hanya Jasa"}
                    placeholder="Contoh: 9"
                    className="h-9 rounded-lg text-xs bg-white border-slate-200 flex-1 min-w-0"
                    required
                  />
                  <div className="w-24 shrink-0">
                    <CreatableSelect
                      value={tebalSatuan ? { label: tebalSatuan, value: tebalSatuan } : null}
                      onChange={(opt: any) => setTebalSatuan(opt ? opt.value : "")}
                      options={SATUAN_TEBAL_OPTIONS}
                      isDisabled={jenisPengajuan === "Hanya Jasa"}
                      styles={unitSelectStyles}
                      placeholder="Satuan"
                      formatCreateLabel={(val) => `"${val}"`}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Contoh: 9 mm</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Toleransi
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={toleransiNilai}
                    onChange={(e) => setToleransiNilai(e.target.value)}
                    disabled={jenisPengajuan === "Hanya Jasa"}
                    placeholder="Contoh: 0.5"
                    className="h-9 rounded-lg text-xs bg-white border-slate-200 flex-1 min-w-0"
                  />
                  <div className="w-24 shrink-0">
                    <CreatableSelect
                      value={toleransiSatuan ? { label: toleransiSatuan, value: toleransiSatuan } : null}
                      onChange={(opt: any) => setToleransiSatuan(opt ? opt.value : "")}
                      options={SATUAN_TOLERANSI_OPTIONS}
                      isDisabled={jenisPengajuan === "Hanya Jasa"}
                      styles={unitSelectStyles}
                      placeholder="Satuan"
                      formatCreateLabel={(val) => `"${val}"`}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Contoh: ± 0.5 mm</span>
              </div>
            </div>
          </div>

          {/* Section 4: Penempatan & Catatan */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Penempatan &amp; Catatan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Implementasi <span className="text-red-500">*</span>
                  </span>
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
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base) => ({
                      ...base,
                      fontSize: "12px",
                      zIndex: 50,
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0.375rem",
                    }),
                    multiValueLabel: (base) => ({
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
                  <span>
                    Lokasi / Area Gerai <span className="text-red-500">*</span>
                  </span>
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
                  formatCreateLabel={(val) => `Tambah "${val}"`}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                    }),
                    menu: (base) => ({
                      ...base,
                      fontSize: "12px",
                      zIndex: 50,
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0.375rem",
                    }),
                    multiValueLabel: (base) => ({
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
                5
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
