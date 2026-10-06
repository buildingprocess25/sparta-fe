"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PengajuanHargaItem } from "./types";
import { Trash2, Plus, Check, X } from "lucide-react";

export interface KoefisienDetailItem {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  isCustom?: boolean;
}

export interface ModalRincianKoefisienProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
  onSave: (data: {
    upahItems: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
  }) => void;
}

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

export function ModalRincianKoefisien({
  isOpen,
  onClose,
  item,
  onSave,
}: ModalRincianKoefisienProps) {
  const [upahItems, setUpahItems] =
    useState<KoefisienDetailItem[]>(DEFAULT_UPAH_ITEMS);
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>(
    DEFAULT_MATERIAL_ITEMS,
  );

  // State Form Tambah Inline (Tanpa prompt)
  const [isAddingUpah, setIsAddingUpah] = useState(false);
  const [newUpahName, setNewUpahName] = useState("");
  const [newUpahUnit, setNewUpahUnit] = useState("Oh");
  const [newUpahVal, setNewUpahVal] = useState("0.0000");

  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("Kg");
  const [newMaterialVal, setNewMaterialVal] = useState("0.0000");

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (item?.koefisienUpahItems && item.koefisienUpahItems.length > 0) {
        setUpahItems(item.koefisienUpahItems);
      } else {
        setUpahItems([...DEFAULT_UPAH_ITEMS]);
      }

      if (item?.koefisienMaterialItems && item.koefisienMaterialItems.length > 0) {
        setMaterialItems(item.koefisienMaterialItems);
      } else {
        const initialMaterials = [...DEFAULT_MATERIAL_ITEMS];
        if (item?.item) {
          initialMaterials[0] = {
            ...initialMaterials[0],
            label: item.item,
          };
        }
        setMaterialItems(initialMaterials);
      }
      setIsAddingUpah(false);
      setIsAddingMaterial(false);
      setNewUpahName("");
      setNewMaterialName("");
    }
  }, [isOpen, item]);

  // Handler Edit Nilai
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

  // Handler Tambah Upah Inline
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

  // Handler Tambah Material Inline
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

  // Handle Save
  const handleSave = () => {
    onSave({
      upahItems,
      materialItems,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full shrink-0"></div>
            <div>
              <DialogTitle className="text-gray-700 font-bold text-sm tracking-wide">
                RINCIAN INPUT KOEFISIEN PEKERJAAN
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-normal mt-0.5">
                {item ? (
                  <>
                    Item:{" "}
                    <span className="font-semibold text-gray-800">
                      {item.kode} - {item.item}
                    </span>{" "}
                    ({item.ukuran} • {item.merk})
                  </>
                ) : (
                  "Input rincian koefisien pekerjaan"
                )}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section A: Komponen Upah */}
          <div className="border border-gray-200 rounded-lg bg-white p-4">
            {/* Section Header */}
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

            {/* Inline Add Form Section A (Tanpa prompt) */}
            {isAddingUpah && (
              <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Nama Komponen Tenaga Kerja <span className="text-red-500">*</span>
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
                    Simpan
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
                    <label className="block text-xs font-semibold text-gray-700 truncate" title={u.label}>
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
            {/* Section Header */}
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

            {/* Inline Add Form Section B (Tanpa prompt) */}
            {isAddingMaterial && (
              <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Nama Material / Alat <span className="text-red-500">*</span>
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
                    Simpan
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
                    <label className="block text-xs font-semibold text-gray-700 truncate" title={m.label}>
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

          {/* Footer / Tombol Simpan */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
