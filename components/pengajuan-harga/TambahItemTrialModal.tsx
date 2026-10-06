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
  KoefisienDetailItem,
  generateDeskripsiOtomatis,
  getKodeData,
  DAFTAR_FIELD_SPESIFIKASI,
  DAFTAR_CABANG_ALFAMART,
} from "./types";
import { RincianKalkulasiKoefisien } from "./RincianKalkulasiKoefisien";
import {
  FileText,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FlaskConical,
} from "lucide-react";
import { PengajuanTimelineBar } from "./PengajuanTimelineBar";

export interface TambahItemTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PengajuanHargaItem) => void;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
  itemToEdit?: PengajuanHargaItem | null;
}

const INITIAL_KATEGORI_OPTIONS = [
  "Pekerjaan Keramik",
  "Pekerjaan Finishing",
  "Pekerjaan Pasangan",
  "Pekerjaan Sanitair",
  "Area Terbuka",
  "Pekerjaan Plafon",
  "Pekerjaan Lantai",
  "Pekerjaan Dinding",
  "Pekerjaan Elektrikal",
];

const INITIAL_MATERIAL_OPTIONS = [
  "Keramik",
  "Granit",
  "Homogeneous Tile",
  "Keramik Dinding",
  "Vinyl",
  "WPC Wallpanel",
  "Plafon PVC",
  "Cat Epoxy",
  "Lampu LED Batten",
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
  "20x290 cm",
  "20x400 cm",
  "20 Kg / Pail",
  "120 cm",
  "20x20 cm",
  "30x60 cm",
];

const INITIAL_MERK_OPTIONS = [
  "Sandimas",
  "Roman",
  "Mosaic",
  "Duma",
  "Propan",
  "Shunda Plafon",
  "Philips",
  "Toto",
  "KIA",
  "Inax",
  "Indogress",
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
  "Area Sales",
  "Area Teras Depan",
  "Area Kasir & POS",
  "Gudang",
  "Area Chiller",
  "Toilet",
  "Fascia Depan",
  "Area Parkir",
  "Back Office",
];

const INITIAL_SATUAN_TEBAL = ["mm", "cm", "m"];
const INITIAL_SATUAN_TOLERANSI = ["mm", "%", "cm"];

const DEFAULT_UPAH_ITEMS: KoefisienDetailItem[] = [
  { id: "u-1", label: "Mandor", value: "0.0188", unit: "Oh", hargaAcuan: 245000 },
  { id: "u-2", label: "Tukang Batu", value: "0.1875", unit: "Oh", hargaAcuan: 200000 },
  { id: "u-3", label: "Pekerja", value: "0.1250", unit: "Oh", hargaAcuan: 175000 },
];

const DEFAULT_MATERIAL_ITEMS: KoefisienDetailItem[] = [
  { id: "m-1", label: "Semen Portland (PC)", value: "9.3270", unit: "Kg" },
  { id: "m-2", label: "Pasir Pasang", value: "0.0436", unit: "m3" },
  { id: "m-3", label: "Semen Pengisi Nat (Grouting)", value: "1.5000", unit: "Kg" },
];

function parseNilaiDanSatuan(
  val?: string,
  defaultSatuan = "mm"
): { nilai: string; satuan: string } {
  if (!val) return { nilai: "", satuan: defaultSatuan };
  const trimmed = val.trim();
  const match = trimmed.match(/^(.+?)\s*([a-zA-Z%]+)$/);
  if (match) {
    return { nilai: match[1].trim(), satuan: match[2].trim() };
  }
  return { nilai: trimmed, satuan: defaultSatuan };
}

export function TambahItemTrialModal({
  isOpen,
  onClose,
  onSubmit,
  nextIndex = 1,
  existingItems = [],
  itemToEdit = null,
}: TambahItemTrialModalProps) {
  // Stepper / Tab State
  const [activeTab, setActiveTab] = useState<"spesifikasi" | "koefisien">("spesifikasi");

  // Form State Spesifikasi (Konsisten dengan TambahPengajuanModal)
  const [kategori, setKategori] = useState("Pekerjaan Keramik");
  const [item, setItem] = useState("");
  const [ukuran, setUkuran] = useState("");
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

  const [implementasi, setImplementasi] = useState("Lantai Gerai");
  const [lokasi, setLokasi] = useState("");
  const [cabang, setCabang] = useState("Cikokol");
  const [satuan, setSatuan] = useState("m2");
  const [informasiTambahan, setInformasiTambahan] = useState("");

  // Parameter Khusus Trial (Input Bebas Masa Aktif & Alasan)
  const [trialDurationValue, setTrialDurationValue] = useState("3");
  const [trialDurationUnit, setTrialDurationUnit] = useState<"bulan" | "hari">("bulan");
  const [alasanTrial, setAlasanTrial] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Kode & Deskripsi Otomatis
  const [kodeItem, setKodeItem] = useState(`SIP-${String(nextIndex).padStart(3, "0")}`);
  const [kodeMaster, setKodeMaster] = useState("");
  const [deskripsiOtomatis, setDeskripsiOtomatis] = useState("");
  const [copied, setCopied] = useState(false);

  // Koefisien State
  const [upahItems, setUpahItems] = useState<KoefisienDetailItem[]>(DEFAULT_UPAH_ITEMS);
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>(DEFAULT_MATERIAL_ITEMS);
  const [marginUpah, setMarginUpah] = useState<number>(8);
  const [marginMaterial, setMarginMaterial] = useState<number>(8);

  // Kalkulasi durasi trial dalam hari
  const calculatedDurationDays = useMemo(() => {
    const val = Number(trialDurationValue) || 1;
    return trialDurationUnit === "bulan" ? val * 30 : val;
  }, [trialDurationValue, trialDurationUnit]);

  // Nilai gabungan untuk ketebalan & toleransi
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
      .find(
        (l) =>
          l.action === "REVISE" ||
          (l.role === "Regional Manager" && l.catatan) ||
          (l.role === "S&B Specialist" && l.catatan)
      );
    return revLog?.catatan || null;
  }, [itemToEdit]);

  // Options untuk CreatableCombobox
  const kategoriOptions = useMemo(() => {
    const fromExisting = existingItems.map((i) => i.kategori).filter(Boolean);
    return Array.from(new Set([...INITIAL_KATEGORI_OPTIONS, ...fromExisting]));
  }, [existingItems]);

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

  // Perhitungan Kode Item (7 parameter fisik) & Kode Master
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
    ukuran,
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

  // Penyusunan Deskripsi Otomatis
  useEffect(() => {
    const desc = generateDeskripsiOtomatis({
      item,
      ukuran,
      merk,
      warna,
      tipe,
      tebal: combinedTebal,
      permukaan,
      toleransi: combinedToleransi,
      informasiTambahan,
      implementasi,
      lokasi,
    });
    setDeskripsiOtomatis(desc);
  }, [
    item,
    ukuran,
    merk,
    warna,
    tipe,
    combinedTebal,
    permukaan,
    combinedToleransi,
    informasiTambahan,
    implementasi,
    lokasi,
  ]);

  const populateForm = (target: PengajuanHargaItem) => {
    setKategori(target.kategori || "Pekerjaan Keramik");
    setItem(target.item || "");
    setUkuran(target.ukuran || "");
    setMerk(target.merk || "");
    setWarna(target.warna || "");
    setTipe(target.tipe || "");
    setPermukaan(target.permukaan || "");

    const parsedTebal = parseNilaiDanSatuan(target.tebal, "mm");
    setTebalNilai(parsedTebal.nilai);
    setTebalSatuan(parsedTebal.satuan);

    const parsedTol = parseNilaiDanSatuan(target.toleransi, "mm");
    setToleransiNilai(parsedTol.nilai);
    setToleransiSatuan(parsedTol.satuan);

    setImplementasi(target.implementasi || "Lantai Gerai");
    setLokasi(target.lokasi || "");
    setCabang(target.cabang || "Cikokol");
    setSatuan(target.satuan || "m2");
    setInformasiTambahan(target.informasiTambahan || "");
    setAlasanTrial(target.alasanTrial || "");
    setKodeItem(target.kode || "");
    setKodeMaster(target.kodeMaster || "");

    // Populate durasi trial
    if (target.trialDurationDays) {
      if (target.trialDurationDays % 30 === 0) {
        setTrialDurationValue(String(target.trialDurationDays / 30));
        setTrialDurationUnit("bulan");
      } else {
        setTrialDurationValue(String(target.trialDurationDays));
        setTrialDurationUnit("hari");
      }
    } else {
      setTrialDurationValue("3");
      setTrialDurationUnit("bulan");
    }

    if (target.koefisienUpahItems && target.koefisienUpahItems.length > 0) {
      setUpahItems(target.koefisienUpahItems);
    } else {
      setUpahItems(DEFAULT_UPAH_ITEMS);
    }

    if (target.koefisienMaterialItems && target.koefisienMaterialItems.length > 0) {
      setMaterialItems(target.koefisienMaterialItems);
    } else {
      setMaterialItems(DEFAULT_MATERIAL_ITEMS);
    }

    setMarginUpah(target.marginUpah ?? 8);
    setMarginMaterial(target.marginMaterial ?? 8);
  };

  const handleReset = () => {
    setActiveTab("spesifikasi");
    setKategori("Pekerjaan Keramik");
    setItem("");
    setUkuran("");
    setMerk("");
    setWarna("");
    setTipe("");
    setPermukaan("");
    setTebalNilai("");
    setTebalSatuan("mm");
    setToleransiNilai("");
    setToleransiSatuan("mm");
    setImplementasi("Lantai Gerai");
    setLokasi("");
    setCabang("Cikokol");
    setSatuan("m2");
    setInformasiTambahan("");
    setTrialDurationValue("3");
    setTrialDurationUnit("bulan");
    setAlasanTrial("");
    setValidationError(null);
    setKodeItem(`SIP-${String(nextIndex).padStart(3, "0")}`);
    setKodeMaster("");
    setDeskripsiOtomatis("");
    setUpahItems(DEFAULT_UPAH_ITEMS);
    setMaterialItems(DEFAULT_MATERIAL_ITEMS);
    setMarginUpah(8);
    setMarginMaterial(8);
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

  const isFieldRevised = (fieldId: string) => {
    return Boolean(itemToEdit?.revisiFields?.includes(fieldId));
  };

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

  // Validasi Kelengkapan Tab 1
  const isTab1Valid = useMemo(() => {
    const hasValidDuration = Number(trialDurationValue) > 0;
    return Boolean(
      kategori.trim() &&
      item.trim() &&
      ukuran.trim() &&
      merk.trim() &&
      warna.trim() &&
      tipe.trim() &&
      permukaan.trim() &&
      tebalNilai.trim() &&
      implementasi.trim() &&
      lokasi.trim() &&
      hasValidDuration &&
      alasanTrial.trim() &&
      !isDuplicate
    );
  }, [
    kategori,
    item,
    ukuran,
    merk,
    warna,
    tipe,
    permukaan,
    tebalNilai,
    implementasi,
    lokasi,
    trialDurationValue,
    alasanTrial,
    isDuplicate,
  ]);

  const handleGoToTab2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDuplicate) {
      setValidationError("Spesifikasi material untuk lokasi ini sudah pernah diajukan (duplikat).");
      return;
    }
    if (!item.trim() || !ukuran.trim() || !merk.trim()) {
      setValidationError("Mohon lengkapi Data Pokok Material (Nama Material, Ukuran, dan Merk).");
      return;
    }
    if (!warna.trim() || !tipe.trim() || !permukaan.trim() || !tebalNilai.trim()) {
      setValidationError("Mohon lengkapi Fisik & Karakteristik Material (Warna, Tipe, Permukaan, Ketebalan).");
      return;
    }
    if (!implementasi.trim() || !lokasi.trim()) {
      setValidationError("Mohon lengkapi Posisi dan Lokasi Area Gerai.");
      return;
    }
    if (!trialDurationValue || Number(trialDurationValue) <= 0) {
      setValidationError("Masa aktif percobaan wajib diisi dengan angka minimal 1.");
      return;
    }
    if (!alasanTrial.trim()) {
      setValidationError("Alasan kebutuhan uji coba trial wajib diisi.");
      return;
    }

    setValidationError(null);
    setActiveTab("koefisien");
  };

  // Item sementara untuk dikirim ke RincianKalkulasiKoefisien
  const draftItem: PengajuanHargaItem = useMemo(() => {
    return {
      ...(itemToEdit || {}),
      id: itemToEdit?.id || `item-trial-${Date.now()}`,
      kode: kodeItem.trim() || kodeData.kodeItem,
      kodeMaster: kodeMaster.trim() || kodeData.kodeMaster,
      item: item.trim() || "Item Baru (Trial)",
      ukuran: ukuran.trim(),
      merk: merk.trim(),
      warna: warna.trim(),
      tipe: tipe.trim(),
      tebal: combinedTebal,
      permukaan: permukaan.trim(),
      kategori: kategori.trim(),
      implementasi,
      lokasi,
      cabang: cabang || "Cikokol",
      toleransi: combinedToleransi || undefined,
      informasiTambahan: informasiTambahan.trim() || undefined,
      satuan: satuan.trim() || "m2",
      deskripsiOtomatis: deskripsiOtomatis.trim(),
      estimasiHarga: itemToEdit?.estimasiHarga || 0,
      hargaRataRata: itemToEdit?.hargaRataRata || 0,
      status: "TRIAL_PENDING_REGIONAL_MGR",
      isTrial: true,
      alasanTrial: alasanTrial.trim(),
      trialDurationDays: calculatedDurationDays,
      koefisienUpahItems: upahItems,
      koefisienMaterialItems: materialItems,
      marginUpah,
      marginMaterial,
    };
  }, [
    itemToEdit,
    kodeItem,
    kodeData,
    kodeMaster,
    item,
    ukuran,
    merk,
    warna,
    tipe,
    combinedTebal,
    permukaan,
    kategori,
    implementasi,
    lokasi,
    cabang,
    combinedToleransi,
    informasiTambahan,
    satuan,
    deskripsiOtomatis,
    alasanTrial,
    calculatedDurationDays,
    upahItems,
    materialItems,
    marginUpah,
    marginMaterial,
  ]);

  // Submit Final dari Tab 2 (RincianKalkulasiKoefisien)
  const handleFinalSubmit = (data: {
    upahItems: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah: number;
    marginMaterial: number;
  }) => {
    // Hitung total harga satuan acuan trial berdasarkan koefisien dan margin
    const totalUpahDasar = data.upahItems.reduce((acc, curr) => {
      const c = typeof curr.value === "string" ? parseFloat(curr.value) || 0 : curr.value;
      const h = curr.hargaAcuan || 0;
      return acc + Math.round(c * h);
    }, 0);
    const nominalMarginUpah = Math.round((totalUpahDasar * (data.marginUpah || 0)) / 100);
    const totalUpahAkhir = totalUpahDasar + nominalMarginUpah;

    const totalMaterialDasar = data.materialItems.reduce((acc, curr) => {
      const c = typeof curr.value === "string" ? parseFloat(curr.value) || 0 : curr.value;
      const h = curr.hargaAcuan || 0;
      return acc + Math.round(c * h);
    }, 0);
    const nominalMarginMaterial = Math.round((totalMaterialDasar * (data.marginMaterial || 0)) / 100);
    const totalMaterialAkhir = totalMaterialDasar + nominalMarginMaterial;

    const finalHargaAcuan = totalUpahAkhir + totalMaterialAkhir;
    const finalKodeItem = kodeItem.trim() || kodeData.kodeItem;
    const finalKodeMaster = kodeMaster.trim() || kodeData.kodeMaster;

    const updatedHistory = itemToEdit
      ? [
          ...(itemToEdit.historyLog || []),
          {
            role: "S&B Specialist" as const,
            action: "SUBMIT" as const,
            tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
            catatan: `Revisi Item Trial diperbaiki dan diajukan ulang ke Regional Manager. Masa trial: ${trialDurationValue} ${trialDurationUnit}. Alasan: ${alasanTrial.trim()}`,
          },
        ]
      : [
          {
            role: "S&B Specialist" as const,
            action: "SUBMIT" as const,
            tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
            catatan: `Pengajuan Item Trial baru beserta koefisien AHSP diajukan ke B&M Regional Manager. Masa trial: ${trialDurationValue} ${trialDurationUnit} (~${calculatedDurationDays} hari). Alasan: ${alasanTrial.trim()}`,
          },
        ];

    const newItem: PengajuanHargaItem = {
      ...(itemToEdit || {}),
      id: itemToEdit?.id || `item-trial-${Date.now()}`,
      kode: finalKodeItem,
      kodeMaster: finalKodeMaster,
      item: item.trim(),
      ukuran: ukuran.trim(),
      merk: merk.trim(),
      warna: warna.trim(),
      tipe: tipe.trim(),
      tebal: combinedTebal,
      permukaan: permukaan.trim(),
      kategori: kategori.trim(),
      implementasi: implementasi.trim(),
      lokasi: lokasi.trim(),
      cabang: cabang || "Cikokol",
      toleransi: combinedToleransi || undefined,
      informasiTambahan: informasiTambahan.trim() || undefined,
      satuan: satuan.trim() || "m2",
      deskripsiOtomatis: deskripsiOtomatis.trim(),
      estimasiHarga: finalHargaAcuan,
      hargaRataRata: finalHargaAcuan,
      status: "TRIAL_PENDING_REGIONAL_MGR",
      isTrial: true,
      alasanTrial: alasanTrial.trim(),
      trialDurationDays: calculatedDurationDays,
      koefisienUpahItems: data.upahItems,
      koefisienMaterialItems: data.materialItems,
      marginUpah: data.marginUpah,
      marginMaterial: data.marginMaterial,
      tanggalPengajuan: itemToEdit?.tanggalPengajuan || new Date().toISOString().slice(0, 10),
      historyLog: updatedHistory,
    };

    onSubmit(newItem);
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className={`w-2.5 h-5 rounded-full inline-block ${itemToEdit ? "bg-amber-600" : "bg-blue-600"}`} />
              <span>{itemToEdit ? "Edit Pengajuan Item Trial" : "Tambah Item Baru Trial"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {itemToEdit
                ? "Perbaiki data material trial dan sesuaikan koefisien acuan harga."
                : "Isi data spesifikasi material dan susun koefisien AHSP untuk masa uji coba lapangan."}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              itemToEdit
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
              <span>{itemToEdit ? "Revisi Trial" : `Trial`}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Bar Timeline Alur Trial */}
        <div className="pt-1">
          <PengajuanTimelineBar item={draftItem} />
        </div>

        {/* Stepper / Tab Navigasi */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 mt-1">
          <button
            type="button"
            onClick={() => setActiveTab("spesifikasi")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "spesifikasi"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isTab1Valid ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
            }`}>
              {isTab1Valid ? "✓" : "1"}
            </span>
            <span>1. Spesifikasi Material &amp; Kebutuhan Trial</span>
          </button>

          <button
            type="button"
            onClick={() => handleGoToTab2()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "koefisien"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>2. Kalkulasi Koefisien (AHSP)</span>
          </button>
        </div>

        {/* Catatan Review jika mode edit revisi */}
        {itemToEdit && latestCatatanRevisi && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 mt-1 shadow-2xs">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-amber-900">Catatan Review Regional Manager:</p>
              <p className="text-amber-800 text-[11px] leading-relaxed italic">
                "{latestCatatanRevisi}"
              </p>
              {itemToEdit.revisiFields && itemToEdit.revisiFields.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-amber-200">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    Bagian yang perlu diperbaiki:
                  </span>
                  {itemToEdit.revisiFields.map((fId) => {
                    const fieldDef = DAFTAR_FIELD_SPESIFIKASI.find((d) => d.id === fId);
                    return (
                      <span
                        key={fId}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs"
                      >
                        {fieldDef?.label || fId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: SPESIFIKASI MATERIAL & KEBUTUHAN TRIAL
            ========================================================================= */}
        {activeTab === "spesifikasi" && (
          <form onSubmit={handleGoToTab2} className="space-y-4 mt-1">
            {validationError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Section 1: Data Pokok Material */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  Data Pokok Material
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`flex flex-col gap-1 transition-all ${isFieldRevised("kategori") ? "p-2 -m-2 rounded-xl bg-amber-50/70 border border-amber-300 ring-2 ring-amber-400/20" : ""}`}>
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Kategori Pekerjaan <span className="text-red-500">*</span></span>
                  </Label>
                  <CreatableCombobox
                    value={kategori}
                    onChange={setKategori}
                    options={kategoriOptions}
                    required
                    placeholder="Pilih atau cari pekerjaan"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Pekerjaan Keramik
                  </span>
                </div>

                <div className={`flex flex-col gap-1 transition-all ${isFieldRevised("item") ? "p-2 -m-2 rounded-xl bg-amber-50/70 border border-amber-300 ring-2 ring-amber-400/20" : ""}`}>
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Nama Material <span className="text-red-500">*</span></span>
                  </Label>
                  <CreatableCombobox
                    value={item}
                    onChange={setItem}
                    options={materialOptions}
                    required
                    placeholder="Pilih atau cari material"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Keramik
                  </span>
                </div>

                <div className={`flex flex-col gap-1 transition-all ${isFieldRevised("ukuran") ? "p-2 -m-2 rounded-xl bg-amber-50/70 border border-amber-300 ring-2 ring-amber-400/20" : ""}`}>
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Ukuran / Dimensi <span className="text-red-500">*</span></span>
                  </Label>
                  <CreatableCombobox
                    value={ukuran}
                    onChange={setUkuran}
                    options={ukuranOptions}
                    required
                    placeholder="Pilih atau cari ukuran"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: 60x60 cm
                  </span>
                </div>

                <div className={`flex flex-col gap-1 transition-all ${isFieldRevised("merk") ? "p-2 -m-2 rounded-xl bg-amber-50/70 border border-amber-300 ring-2 ring-amber-400/20" : ""}`}>
                  <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Merk / Brand <span className="text-red-500">*</span></span>
                  </Label>
                  <CreatableCombobox
                    value={merk}
                    onChange={setMerk}
                    options={merkOptions}
                    required
                    placeholder="Pilih atau cari merk"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Roman
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Fisik & Karakteristik */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  Fisik &amp; Karakteristik
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Warna <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={warna}
                    onChange={(e) => setWarna(e.target.value)}
                    placeholder=""
                    className="h-9 rounded-lg text-xs bg-white border-slate-200"
                    required
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Putih
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Tipe / Motif <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value)}
                    placeholder=""
                    className="h-9 rounded-lg text-xs bg-white border-slate-200"
                    required
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Polos
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Permukaan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={permukaan}
                    onChange={(e) => setPermukaan(e.target.value)}
                    placeholder=""
                    className="h-9 rounded-lg text-xs bg-white border-slate-200"
                    required
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Glossy
                  </span>
                </div>

                {/* Ketebalan dengan input angka & combobox satuan */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Ketebalan <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={tebalNilai}
                      onChange={(e) => setTebalNilai(e.target.value)}
                      placeholder=""
                      className="h-9 rounded-lg text-xs bg-white border-slate-200 flex-1 min-w-0"
                      required
                    />
                    <div className="w-24 shrink-0">
                      <CreatableCombobox
                        value={tebalSatuan}
                        onChange={setTebalSatuan}
                        options={INITIAL_SATUAN_TEBAL}
                        placeholder="Satuan"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: 10 mm
                  </span>
                </div>

                {/* Toleransi dengan input angka & combobox satuan */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Toleransi Presisi
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={toleransiNilai}
                      onChange={(e) => setToleransiNilai(e.target.value)}
                      placeholder=""
                      className="h-9 rounded-lg text-xs bg-white border-slate-200 flex-1 min-w-0"
                    />
                    <div className="w-24 shrink-0">
                      <CreatableCombobox
                        value={toleransiSatuan}
                        onChange={setToleransiSatuan}
                        options={INITIAL_SATUAN_TOLERANSI}
                        placeholder="Satuan"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: ± 0.5 mm
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Penempatan & Keterangan (3 Kolom Proporsional - Satuan diset standar) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  Penempatan &amp; Kebutuhan Trial
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Cabang Pengaju <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={cabang}
                    onChange={(e) => setCabang(e.target.value)}
                    className="h-9 rounded-lg text-xs bg-white border border-slate-200 px-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {DAFTAR_CABANG_ALFAMART.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Unit cabang asal pengajuan
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Implementasi / Posisi <span className="text-red-500">*</span>
                  </Label>
                  <CreatableCombobox
                    value={implementasi}
                    onChange={setImplementasi}
                    options={posisiOptions}
                    required
                    placeholder="Pilih posisi"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Lantai Gerai
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Lokasi / Area Gerai <span className="text-red-500">*</span>
                  </Label>
                  <CreatableCombobox
                    value={lokasi}
                    onChange={setLokasi}
                    options={areaOptions}
                    required
                    placeholder="Pilih lokasi area"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Area Sales
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Informasi Tambahan
                  </Label>
                  <Input
                    value={informasiTambahan}
                    onChange={(e) => setInformasiTambahan(e.target.value)}
                    placeholder=""
                    className="h-9 rounded-lg text-xs bg-white border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Contoh: Khusus Area Kasir
                  </span>
                </div>
              </div>

              {/* Kotak Khusus Parameter Trial (Input Bebas Masa Aktif & Alasan) */}
              <div className="border border-blue-200/80 rounded-xl p-3.5 bg-blue-50/50 space-y-3 mt-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <FlaskConical className="w-4 h-4 text-blue-700" />
                  <span>Parameter Uji Coba Lapangan (Jalur Trial)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Masa Aktif Percobaan: Input Bebas Angka + Dropdown Bulan / Hari */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                      Masa Aktif Percobaan <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        value={trialDurationValue}
                        onChange={(e) => setTrialDurationValue(e.target.value)}
                        placeholder="Durasi"
                        className="h-9 rounded-lg text-xs bg-white border-blue-200 text-slate-800 flex-1 min-w-0"
                        required
                      />
                      <div className="w-24 shrink-0">
                        <Select
                          value={trialDurationUnit}
                          onValueChange={(val: "bulan" | "hari") => setTrialDurationUnit(val)}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bulan">Bulan</SelectItem>
                            <SelectItem value="hari">Hari</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-700/80 leading-tight">
                      {calculatedDurationDays} hari kalender
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                      Alasan Kebutuhan Uji Coba Trial <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={alasanTrial}
                      onChange={(e) => setAlasanTrial(e.target.value)}
                      placeholder="Jelaskan kebutuhan efisiensi atau alternatif material trial ini..."
                      className="h-9 rounded-lg text-xs bg-white border-blue-200 text-slate-800"
                      required
                    />
                    <span className="text-[10px] text-blue-700/80 leading-tight">
                      Wajib dicantumkan untuk pertimbangan persetujuan Regional Manager
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Kode & Deskripsi Spesifikasi */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  Kode Master &amp; Deskripsi
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Kode Item (Fisik)
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
                    Kode Master Item (Dengan Varian Lokasi)
                  </Label>
                  <Input
                    value={kodeMaster}
                    disabled
                    readOnly
                    className="h-9 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Peringatan Duplikat */}
              {isDuplicate && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Spesifikasi material untuk lokasi <strong>{lokasi}</strong> sudah pernah diajukan (Kode: {kodeItem} - Varian {kodeData.kodeArea}).
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Deskripsi Spesifikasi Standar</span>
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

            {/* Footer Tab 1 */}
            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100 flex items-center justify-between">
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
                disabled={isDuplicate}
                className={`rounded-xl h-9 text-xs font-semibold text-white cursor-pointer shadow-xs flex items-center gap-1.5 ${
                  isDuplicate ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <span>Lanjut ke Kalkulasi Koefisien (AHSP)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* =========================================================================
            TAB 2: RINCIAN KALKULASI KOEFISIEN (AHSP)
            ========================================================================= */}
        {activeTab === "koefisien" && (
          <div className="space-y-4 mt-1">
            {/* Banner Ringkasan Material Draft dari Tab 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] font-bold">
                    {draftItem.kodeMaster || draftItem.kode}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {draftItem.item} {draftItem.ukuran} {draftItem.merk}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {draftItem.implementasi} • Area {draftItem.lokasi} • Masa Trial: <strong className="text-slate-700">{trialDurationValue} {trialDurationUnit} (~{calculatedDurationDays} hari)</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("spesifikasi")}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold self-start sm:self-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ubah Spesifikasi</span>
              </button>
            </div>

            {/* Komponen Utuh Rincian Kalkulasi Koefisien */}
            <RincianKalkulasiKoefisien
              item={draftItem}
              initialUpahItems={upahItems}
              initialMaterialItems={materialItems}
              initialMarginUpah={marginUpah}
              initialMarginMaterial={marginMaterial}
              onSave={handleFinalSubmit}
              onBack={() => setActiveTab("spesifikasi")}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
