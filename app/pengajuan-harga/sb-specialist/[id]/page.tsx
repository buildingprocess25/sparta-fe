"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
  Building2,
  Trash2,
  Save,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import {
  PengajuanHargaItem,
  KoefisienDetailItem,
} from "@/components/pengajuan-harga/types";
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from "@/components/pengajuan-harga/store";
import { useGlobalAlert } from "@/context/GlobalAlertContext";

const DEFAULT_UPAH_ITEMS: KoefisienDetailItem[] = [
  { id: "u-1", label: "Mandor", value: 0.0188, unit: "Oh" },
  { id: "u-2", label: "Tukang", value: 0.1875, unit: "Oh" },
  { id: "u-3", label: "Pekerja", value: 0.125, unit: "Oh" },
];

const DEFAULT_MATERIAL_ITEMS: KoefisienDetailItem[] = [
  { id: "m-1", label: "Keramik", value: 1.034, unit: "M2" },
  { id: "m-2", label: "Semen PC", value: 9.327, unit: "Kg" },
  { id: "m-3", label: "Pasir", value: 0.0436, unit: "M3" },
];

export default function SBSpecialistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const itemId = params?.id as string;

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [upahItems, setUpahItems] =
    useState<KoefisienDetailItem[]>(DEFAULT_UPAH_ITEMS);
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>(
    DEFAULT_MATERIAL_ITEMS,
  );

  // State Form Tambah Inline
  const [isAddingUpah, setIsAddingUpah] = useState(false);
  const [newUpahName, setNewUpahName] = useState("");
  const [newUpahUnit, setNewUpahUnit] = useState("Oh");
  const [newUpahVal, setNewUpahVal] = useState("0.0000");

  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("Kg");
  const [newMaterialVal, setNewMaterialVal] = useState("0.0000");

  // Load Item from Store
  useEffect(() => {
    if (!itemId) return;
    const allItems = getStoredPengajuan();
    const found = allItems.find((i) => i.id === itemId);
    if (found) {
      setItem(found);

      // Load existing koefisien if available
      if (found.koefisienUpahItems && found.koefisienUpahItems.length > 0) {
        setUpahItems(found.koefisienUpahItems);
      } else {
        setUpahItems([...DEFAULT_UPAH_ITEMS]);
      }

      if (
        found.koefisienMaterialItems &&
        found.koefisienMaterialItems.length > 0
      ) {
        setMaterialItems(found.koefisienMaterialItems);
      } else {
        const initialMat = [...DEFAULT_MATERIAL_ITEMS];
        if (found.item) {
          initialMat[0] = { ...initialMat[0], label: found.item };
        }
        setMaterialItems(initialMat);
      }
    }
  }, [itemId]);

  // Handlers Edit Koefisien
  const handleUpahChange = (id: string, value: string) => {
    setUpahItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value } : it)),
    );
  };

  const handleMaterialChange = (id: string, value: string) => {
    setMaterialItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, value } : it)),
    );
  };

  // Add Inline Handlers
  const handleConfirmAddUpah = () => {
    if (!newUpahName.trim()) return;
    const newId = `u-${Date.now()}`;
    setUpahItems((prev) => [
      ...prev,
      {
        id: newId,
        label: newUpahName.trim(),
        value: newUpahVal || "0.0000",
        unit: newUpahUnit.trim() || "Oh",
        isCustom: true,
      },
    ]);
    setNewUpahName("");
    setNewUpahUnit("Oh");
    setNewUpahVal("0.0000");
    setIsAddingUpah(false);
  };

  const handleDeleteUpah = (id: string) => {
    setUpahItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleConfirmAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    const newId = `m-${Date.now()}`;
    setMaterialItems((prev) => [
      ...prev,
      {
        id: newId,
        label: newMaterialName.trim(),
        value: newMaterialVal || "0.0000",
        unit: newMaterialUnit.trim() || "Kg",
        isCustom: true,
      },
    ]);
    setNewMaterialName("");
    setNewMaterialUnit("Kg");
    setNewMaterialVal("0.0000");
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterialItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Save Koefisien
  const handleSaveKoefisien = () => {
    if (!item) return;

    const allItems = getStoredPengajuan();
    const updated = allItems.map((i) => {
      if (i.id === item.id) {
        const summaryUpah = upahItems
          .map((u) => `${u.label}: ${u.value} ${u.unit}`)
          .join(", ");
        const summaryMat = materialItems
          .map((m) => `${m.label}: ${m.value} ${m.unit}`)
          .join(", ");

        return {
          ...i,
          status: "SIAP_SURVEI" as const,
          koefisienUpahItems: upahItems,
          koefisienMaterialItems: materialItems,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "MASTERING" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: `Koefisien AHSP disimpan. Status berubah menjadi Siap Survei untuk Building Coordinator. [Upah: ${summaryUpah}] | [Material: ${summaryMat}]`,
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    setItem((prev) =>
      prev
        ? {
            ...prev,
            status: "SIAP_SURVEI" as const,
            koefisienUpahItems: upahItems,
            koefisienMaterialItems: materialItems,
          }
        : null,
    );

    showAlert({
      title: "Koefisien Berhasil Disimpan",
      message: `Koefisien ${item.kode} disimpan. Item siap untuk survei harga 3 toko oleh Building Coordinator.`,
      type: "success",
    });
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <AppNavbar
          title="Detail Item"
          showBackButton
          backHref="/pengajuan-harga/sb-specialist"
        />
        <main className="flex-1 max-w-4xl mx-auto p-8 text-center flex flex-col items-center justify-center">
          <p className="text-slate-500 mb-4">
            Item tidak ditemukan atau sedang dimuat...
          </p>
          <Link href="/pengajuan-harga/sb-specialist">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AppNavbar
        title="Detail Item & Input Koefisien"
        showBackButton
        backHref="/pengajuan-harga/sb-specialist"
      />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/pengajuan-harga/sb-specialist"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Antrean S&amp;B Specialist</span>
          </Link>
          {item.status === 'SIAP_SURVEI' ? (
            <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs px-2.5 py-0.5">
              <Store className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Status: Siap Survei
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Status: Disetujui
            </Badge>
          )}
        </div>

        {/* Card Ringkasan Spesifikasi Item */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Spesifikasi Item Pekerjaan
              </h2>
              <p className="text-xs text-slate-500">
                Data usulan yang diajukan oleh B&amp;M Manager
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">
                Kode Item
              </span>
              <span className="font-mono font-bold text-blue-700">
                {item.kode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Kode Master Item
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {item.kodeMaster || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Nama Material
              </span>
              <span className="font-bold text-slate-900">{item.item}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Ukuran &amp; Merk
              </span>
              <span className="font-medium text-slate-800">
                {item.ukuran} • {item.merk}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Warna &amp; Tipe
              </span>
              <span className="font-medium text-slate-800">
                {item.warna} ({item.tipe})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Permukaan &amp; Tebal
              </span>
              <span className="font-medium text-slate-800">
                {item.permukaan} • {item.tebal}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Kategori</span>
              <span className="font-medium text-slate-800">
                {item.kategori}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">
                Lokasi / Area
              </span>
              <span className="font-medium text-slate-800">
                {item.lokasi} ({item.implementasi})
              </span>
            </div>
          </div>

          {item.deskripsiOtomatis && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block font-medium">
                Deskripsi Lengkap:
              </span>
              <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {item.deskripsiOtomatis}
              </p>
            </div>
          )}
        </div>

        {/* KOMPONEN INPUT / UPDATE KOEFISIEN PEKERJAAN */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <h1 className="text-gray-700 font-bold text-sm tracking-wide">
                RINCIAN INPUT KOEFISIEN PEKERJAAN
              </h1>
            </div>{" "}
          </div>

          <div className="p-6 space-y-6">
            {/* Section A: Komponen Upah */}
            <div className="border border-gray-200 rounded-lg bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-blue-700 rounded-sm"></div>
                  <h2 className="text-gray-700 font-bold text-sm tracking-wide">
                    A. KOMPONEN UPAH / TENAGA KERJA
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingUpah(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>+</span> Tambah
                </button>
              </div>

              {/* Form Tambah Upah Inline */}
              {isAddingUpah && (
                <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Nama Komponen Tenaga Kerja{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kepala Tukang"
                      value={newUpahName}
                      onChange={(e) => setNewUpahName(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      placeholder="Oh"
                      value={newUpahUnit}
                      onChange={(e) => setNewUpahUnit(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Koefisien
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      value={newUpahVal}
                      onChange={(e) => setNewUpahVal(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleConfirmAddUpah}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                    >
                      Tambahkan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingUpah(false);
                        setNewUpahName("");
                      }}
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Grid Data A */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {upahItems.map((u) => (
                  <div
                    key={u.id}
                    className="border border-gray-200 rounded p-3 bg-gray-50/50 relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="block text-xs font-semibold text-gray-700 truncate"
                        title={u.label}
                      >
                        {u.label}
                      </label>
                      {u.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUpah(u.id)}
                          className="text-gray-400 hover:text-red-600 transition cursor-pointer p-0.5"
                          title="Hapus komponen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.0000"
                        value={u.value}
                        onChange={(e) => handleUpahChange(u.id, e.target.value)}
                        className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                      <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded text-xs font-medium shrink-0">
                        {u.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Komponen Material */}
            <div className="border border-gray-200 rounded-lg bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-green-500 rounded-sm"></div>
                  <h2 className="text-gray-700 font-bold text-sm tracking-wide">
                    B. KOMPONEN MATERIAL &amp; ALAT
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMaterial(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>+</span> Tambah
                </button>
              </div>

              {/* Form Tambah Material Inline */}
              {isAddingMaterial && (
                <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Nama Material / Alat{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Air Kerja, Paku, Lem"
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      placeholder="Kg"
                      value={newMaterialUnit}
                      onChange={(e) => setNewMaterialUnit(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Koefisien
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      value={newMaterialVal}
                      onChange={(e) => setNewMaterialVal(e.target.value)}
                      className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleConfirmAddMaterial}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
                    >
                      Tambahkan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingMaterial(false);
                        setNewMaterialName("");
                      }}
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Grid Data B */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {materialItems.map((m) => (
                  <div
                    key={m.id}
                    className="border border-gray-200 rounded p-3 bg-gray-50/50 relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="block text-xs font-semibold text-gray-700 truncate"
                        title={m.label}
                      >
                        {m.label}
                      </label>
                      {m.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="text-gray-400 hover:text-red-600 transition cursor-pointer p-0.5"
                          title="Hapus material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.0000"
                        value={m.value}
                        onChange={(e) =>
                          handleMaterialChange(m.id, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2.5 py-1.5 w-full text-gray-800 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                      <span className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded text-xs font-medium shrink-0">
                        {m.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Tombol Simpan Perubahan */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 italic">
                Perubahan koefisien akan otomatis tersimpan sebagai acuan
                perhitungan Building Coordinator.
              </span>
              <div className="flex gap-3">
                <Link href="/pengajuan-harga/sb-specialist">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Kembali
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={handleSaveKoefisien}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan &amp; Siap Survei</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
