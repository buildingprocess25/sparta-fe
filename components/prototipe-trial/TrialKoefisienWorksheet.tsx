// =============================================================================
// components/prototipe-trial/TrialKoefisienWorksheet.tsx
// Lembar Kerja Koefisien Upah, Material, Bongkaran, & Margin S&B Sparta B&M
// Arsitektur: Komponen Modular Terpisah di ./worksheet/
// Standar Desain: Anti-Slop (Industrial Clean, High Density, WCAG AA Compliant)
// =============================================================================

"use client";

import React, { useState, useMemo } from "react";
import { Wrench, Package, Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrialItem, KoefisienItem } from "./types";
import {
  WorksheetSection,
  WorksheetHpsSummary,
  STANDAR_UPAH_OPTIONS,
  STANDAR_MATERIAL_OPTIONS,
  STANDAR_BONGKARAN_OPTIONS,
  UPAH_UNIT_OPTIONS,
  MATERIAL_UNIT_OPTIONS,
} from "./worksheet";

// Re-export untuk kompatibilitas modul luar jika diperlukan
export { UPAH_UNIT_OPTIONS, MATERIAL_UNIT_OPTIONS };

// =============================================================================
// Interface Props TrialKoefisienWorksheet
// =============================================================================
interface TrialKoefisienWorksheetProps {
  item: TrialItem;
  isEditable?: boolean;
  onSave?: (data: {
    koefisienUpah: KoefisienItem[];
    koefisienMaterial: KoefisienItem[];
    koefisienBongkaran?: KoefisienItem[];
    marginUpah: number;
    marginMaterial: number;
    hargaTrialFinal: number;
    catatan?: string;
  }) => void;
}

export function TrialKoefisienWorksheet({
  item,
  isEditable = false,
  onSave,
}: TrialKoefisienWorksheetProps) {
  // State Komponen Upah Tenaga Kerja
  const [upahList, setUpahList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienUpah && item.koefisienUpah.length > 0) {
      return item.koefisienUpah;
    }
    return [
      { id: "u-1", label: "Mandor Lapangan", unit: "Oh", value: 0.02, hargaAcuan: 245000, jenis: "UPAH" },
      { id: "u-2", label: "Tukang Terampil / Pasang", unit: "Oh", value: 0.25, hargaAcuan: 200000, jenis: "UPAH" },
      { id: "u-3", label: "Pekerja Standar", unit: "Oh", value: 0.15, hargaAcuan: 175000, jenis: "UPAH" },
    ];
  });

  // State Komponen Material
  const [materialList, setMaterialList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienMaterial && item.koefisienMaterial.length > 0) {
      return item.koefisienMaterial;
    }
    return [
      { id: "m-1", label: `Material Utama (${item.item || "Spek Trial"})`, unit: item.satuan || "m2", value: 1.05, hargaAcuan: item.estimasiHargaMaker || 75000, jenis: "MATERIAL" },
      { id: "m-2", label: "Semen Instan / Mortar (Tile Adhesive)", unit: "sak", value: 0.15, hargaAcuan: 95000, jenis: "MATERIAL" },
      { id: "m-3", label: "Semen Pengisi Nat (Tile Grouting)", unit: "Kg", value: 0.5, hargaAcuan: 18000, jenis: "MATERIAL" },
      { id: "m-4", label: "Alat Bantu & Perlengkapan Kerja", unit: "ls", value: 1.0, hargaAcuan: 5000, jenis: "MATERIAL" },
    ];
  });

  // State Komponen Bongkaran (Kondisional)
  const [bongkaranList, setBongkaranList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienBongkaran && item.koefisienBongkaran.length > 0) {
      return item.koefisienBongkaran;
    }
    if (item.isTermasukBongkaran) {
      return [
        { id: "b-1", label: "Pekerja Bongkaran Eksisting", unit: "Oh", value: 0.1, hargaAcuan: 165000, jenis: "BONGKARAN" },
        { id: "b-2", label: "Pembuangan Puing / Sisa Lapangan", unit: "ls", value: 1.0, hargaAcuan: 25000, jenis: "BONGKARAN" },
      ];
    }
    return [];
  });

  // State Margin Terintegrasi per Seksi (Default 8%)
  const [marginUpah, setMarginUpah] = useState<number>(() => item.marginUpah ?? 8);
  const [marginMaterial, setMarginMaterial] = useState<number>(() => item.marginMaterial ?? 8);
  const [marginBongkaran, setMarginBongkaran] = useState<number>(() => item.marginUpah ?? 8);

  // State Catatan Rekomendasi S&B
  const [catatan, setCatatan] = useState<string>(
    "Perhitungan koefisien upah tenaga kerja, material, serta margin telah disesuaikan dengan indeks biaya standar S&B."
  );

  // =============================================================================
  // Kalkulasi Real-Time
  // =============================================================================
  // 1. Upah
  const totalUpahDasar = useMemo(() => {
    return upahList.reduce((acc, curr) => acc + Math.round(curr.value * curr.hargaAcuan), 0);
  }, [upahList]);

  const nominalMarginUpah = useMemo(() => {
    return Math.round((totalUpahDasar * (marginUpah || 0)) / 100);
  }, [totalUpahDasar, marginUpah]);

  const totalUpahAkhir = useMemo(() => {
    return totalUpahDasar + nominalMarginUpah;
  }, [totalUpahDasar, nominalMarginUpah]);

  // 2. Material
  const totalMaterialDasar = useMemo(() => {
    return materialList.reduce((acc, curr) => acc + Math.round(curr.value * curr.hargaAcuan), 0);
  }, [materialList]);

  const nominalMarginMaterial = useMemo(() => {
    return Math.round((totalMaterialDasar * (marginMaterial || 0)) / 100);
  }, [totalMaterialDasar, marginMaterial]);

  const totalMaterialAkhir = useMemo(() => {
    return totalMaterialDasar + nominalMarginMaterial;
  }, [totalMaterialDasar, nominalMarginMaterial]);

  // 3. Bongkaran (Kondisional)
  const totalBongkaranDasar = useMemo(() => {
    if (!item.isTermasukBongkaran) return 0;
    return bongkaranList.reduce((acc, curr) => acc + Math.round(curr.value * curr.hargaAcuan), 0);
  }, [bongkaranList, item.isTermasukBongkaran]);

  const nominalMarginBongkaran = useMemo(() => {
    if (!item.isTermasukBongkaran) return 0;
    return Math.round((totalBongkaranDasar * (marginBongkaran || 0)) / 100);
  }, [totalBongkaranDasar, marginBongkaran, item.isTermasukBongkaran]);

  const totalBongkaranAkhir = useMemo(() => {
    return totalBongkaranDasar + nominalMarginBongkaran;
  }, [totalBongkaranDasar, nominalMarginBongkaran]);

  // 4. Grand Total Rekomendasi HPS Final
  const grandTotalRaw = totalUpahAkhir + totalMaterialAkhir + totalBongkaranAkhir;
  const grandTotalRounded = Math.ceil(grandTotalRaw / 100) * 100;

  // =============================================================================
  // Handlers Mutasi Upah
  // =============================================================================
  const handleUpahHargaChange = (id: string, hargaAcuan: number) => {
    setUpahList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hargaAcuan } : it))
    );
  };

  const handleUpahUnitChange = (id: string, unit: string) => {
    setUpahList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unit } : it))
    );
  };

  const handleUpahKoefChange = (id: string, value: string) => {
    setUpahList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value: parseFloat(value) || 0 } : it))
    );
  };

  const handleDeleteUpah = (id: string) => {
    setUpahList((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddUpah = (newItem: {
    label: string;
    unit: string;
    hargaAcuan: number;
    value: number;
  }) => {
    setUpahList((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        label: newItem.label,
        value: newItem.value,
        unit: newItem.unit,
        hargaAcuan: newItem.hargaAcuan,
        jenis: "UPAH",
      },
    ]);
  };

  // =============================================================================
  // Handlers Mutasi Material
  // =============================================================================
  const handleMaterialHargaChange = (id: string, hargaAcuan: number) => {
    setMaterialList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hargaAcuan } : it))
    );
  };

  const handleMaterialUnitChange = (id: string, unit: string) => {
    setMaterialList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unit } : it))
    );
  };

  const handleMaterialKoefChange = (id: string, value: string) => {
    setMaterialList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value: parseFloat(value) || 0 } : it))
    );
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterialList((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddMaterial = (newItem: {
    label: string;
    unit: string;
    hargaAcuan: number;
    value: number;
  }) => {
    setMaterialList((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        label: newItem.label,
        value: newItem.value,
        unit: newItem.unit,
        hargaAcuan: newItem.hargaAcuan,
        jenis: "MATERIAL",
      },
    ]);
  };

  // =============================================================================
  // Handlers Mutasi Bongkaran
  // =============================================================================
  const handleBongkaranHargaChange = (id: string, hargaAcuan: number) => {
    setBongkaranList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, hargaAcuan } : it))
    );
  };

  const handleBongkaranUnitChange = (id: string, unit: string) => {
    setBongkaranList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unit } : it))
    );
  };

  const handleBongkaranKoefChange = (id: string, value: string) => {
    setBongkaranList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value: parseFloat(value) || 0 } : it))
    );
  };

  const handleDeleteBongkaran = (id: string) => {
    setBongkaranList((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddBongkaran = (newItem: {
    label: string;
    unit: string;
    hargaAcuan: number;
    value: number;
  }) => {
    setBongkaranList((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        label: newItem.label,
        value: newItem.value,
        unit: newItem.unit,
        hargaAcuan: newItem.hargaAcuan,
        jenis: "BONGKARAN",
      },
    ]);
  };

  // =============================================================================
  // Simpan Usulan Harga ke Parent
  // =============================================================================
  const handleSaveAll = () => {
    if (onSave) {
      onSave({
        koefisienUpah: upahList,
        koefisienMaterial: materialList,
        koefisienBongkaran: item.isTermasukBongkaran ? bongkaranList : undefined,
        marginUpah,
        marginMaterial,
        hargaTrialFinal: grandTotalRounded,
        catatan,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* =======================================================================
          SEKSI 1: UPAH TENAGA KERJA
          ======================================================================= */}
      <WorksheetSection
        sectionNumber="1"
        title="Tenaga Kerja"
        subtitle="Rincian koefisien upah  "
        icon={<Wrench className="w-4 h-4 text-slate-700" />}
        items={upahList}
        margin={marginUpah}
        onMarginChange={setMarginUpah}
        isEditable={isEditable}
        catalogOptions={STANDAR_UPAH_OPTIONS}
        unitOptions={UPAH_UNIT_OPTIONS}
        defaultUnit="Oh"
        focusColor="#0284c7"
        addFormTitle="Tambah Komponen Tenaga Kerja Baru"
        addBtnText="Tambah Tenaga Kerja"
        onItemHargaChange={handleUpahHargaChange}
        onItemUnitChange={handleUpahUnitChange}
        onItemKoefChange={handleUpahKoefChange}
        onItemDelete={handleDeleteUpah}
        onItemAdd={handleAddUpah}
      />

      {/* =======================================================================
          SEKSI 2: BAHAN & MATERIAL
          ======================================================================= */}
      <WorksheetSection
        sectionNumber="2"
        title="Bahan & Material"
        subtitle="Rincian material utama dan bahan penunjang pekerjaan"
        icon={<Package className="w-4 h-4 text-slate-700" />}
        items={materialList}
        margin={marginMaterial}
        onMarginChange={setMarginMaterial}
        isEditable={isEditable}
        catalogOptions={STANDAR_MATERIAL_OPTIONS}
        unitOptions={MATERIAL_UNIT_OPTIONS}
        defaultUnit={item.satuan || "m2"}
        focusColor="#059669"
        addFormTitle="Tambah Komponen Bahan / Material Baru"
        addBtnText="Tambah Material"
        onItemHargaChange={handleMaterialHargaChange}
        onItemUnitChange={handleMaterialUnitChange}
        onItemKoefChange={handleMaterialKoefChange}
        onItemDelete={handleDeleteMaterial}
        onItemAdd={handleAddMaterial}
      />

      {/* =======================================================================
          SEKSI 3: PEKERJAAN BONGKARAN (KONDISIONAL)
          ======================================================================= */}
      {item.isTermasukBongkaran && (
        <WorksheetSection
          sectionNumber="3"
          title="Pekerjaan Bongkaran"
          subtitle="Rincian pembongkaran"
          icon={<Hammer className="w-4 h-4 text-slate-700" />}
          headerBadge={
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
              Termasuk Bongkaran
            </Badge>
          }
          items={bongkaranList}
          margin={marginBongkaran}
          onMarginChange={setMarginBongkaran}
          isEditable={isEditable}
          catalogOptions={STANDAR_BONGKARAN_OPTIONS}
          unitOptions={UPAH_UNIT_OPTIONS}
          defaultUnit="Oh"
          focusColor="#d97706"
          addFormTitle="Tambah Komponen Bongkaran Baru"
          addBtnText="Tambah Bongkaran"
          onItemHargaChange={handleBongkaranHargaChange}
          onItemUnitChange={handleBongkaranUnitChange}
          onItemKoefChange={handleBongkaranKoefChange}
          onItemDelete={handleDeleteBongkaran}
          onItemAdd={handleAddBongkaran}
        />
      )}

      {/* =======================================================================
          SEKSI 4: RINGKASAN AKHIR KALKULASI HPS TRIAL (REKOMENDASI HARGA SATUAN)
          ======================================================================= */}
      <WorksheetHpsSummary
        satuan={item.satuan || "m2"}
        totalUpahAkhir={totalUpahAkhir}
        marginUpah={marginUpah}
        totalMaterialAkhir={totalMaterialAkhir}
        marginMaterial={marginMaterial}
        totalBongkaranAkhir={totalBongkaranAkhir}
        marginBongkaran={marginBongkaran}
        isTermasukBongkaran={item.isTermasukBongkaran}
        grandTotalRounded={grandTotalRounded}
        catatan={catatan}
        onCatatanChange={setCatatan}
        isEditable={isEditable}
        onSaveAll={handleSaveAll}
      />
    </div>
  );
}
