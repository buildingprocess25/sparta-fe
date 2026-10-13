// =============================================================================
// components/prototipe-trial/TrialKoefisienWorksheet.tsx
// Lembar Kerja Koefisien Upah, Material, Bongkaran, & Margin S&B Sparta
// Fitur: Mode Interaktif Editable (S&B) & Mode Ringkasan Read-Only (Reg Mgr)
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Plus,
  Trash2,
  Send,
  Wrench,
  Package,
  Hammer,
} from 'lucide-react';
import { TrialItem, KoefisienItem } from './types';

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

const DEFAULT_UPAH_ITEMS: KoefisienItem[] = [
  { id: 'u-1', label: 'Mandor Lapangan', unit: 'Oh', value: 0.02, hargaAcuan: 245000, jenis: 'UPAH' },
  { id: 'u-2', label: 'Tukang Terampil', unit: 'Oh', value: 0.25, hargaAcuan: 210000, jenis: 'UPAH' },
  { id: 'u-3', label: 'Pekerja Standar', unit: 'Oh', value: 0.15, hargaAcuan: 165000, jenis: 'UPAH' },
];

const DEFAULT_MATERIAL_ITEMS: KoefisienItem[] = [
  { id: 'm-1', label: 'Material Utama (Sesuai Spek)', unit: 'm2', value: 1.05, hargaAcuan: 75000, jenis: 'MATERIAL' },
  { id: 'm-2', label: 'Semen Instan Perekat (Tile Adhesive)', unit: 'kg', value: 5.0, hargaAcuan: 3200, jenis: 'MATERIAL' },
  { id: 'm-3', label: 'Alat Bantu & Perlengkapan Kerja', unit: 'ls', value: 1.0, hargaAcuan: 4500, jenis: 'MATERIAL' },
];

const DEFAULT_BONGKARAN_ITEMS: KoefisienItem[] = [
  { id: 'b-1', label: 'Pekerja Bongkaran Eksisting', unit: 'Oh', value: 0.1, hargaAcuan: 165000, jenis: 'BONGKARAN' },
  { id: 'b-2', label: 'Pembuangan Puing / Sisa Lapangan', unit: 'ls', value: 1.0, hargaAcuan: 15000, jenis: 'BONGKARAN' },
];

export function TrialKoefisienWorksheet({
  item,
  isEditable = false,
  onSave,
}: TrialKoefisienWorksheetProps) {
  // State Koefisien
  const [upahList, setUpahList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienUpah && item.koefisienUpah.length > 0) return item.koefisienUpah;
    return DEFAULT_UPAH_ITEMS;
  });

  const [materialList, setMaterialList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienMaterial && item.koefisienMaterial.length > 0) return item.koefisienMaterial;
    return DEFAULT_MATERIAL_ITEMS;
  });

  const [bongkaranList, setBongkaranList] = useState<KoefisienItem[]>(() => {
    if (item.koefisienBongkaran && item.koefisienBongkaran.length > 0) return item.koefisienBongkaran;
    return item.isTermasukBongkaran ? DEFAULT_BONGKARAN_ITEMS : [];
  });

  const [margin, setMargin] = useState<number>(() => item.marginUpah ?? 8);
  const [catatan, setCatatan] = useState<string>('Perhitungan koefisien upah, material, dan margin telah disesuaikan dengan standar indeks S&B.');

  // Kalkulasi Total
  const totalUpah = useMemo(() => {
    return upahList.reduce((acc, curr) => acc + (curr.value * curr.hargaAcuan), 0);
  }, [upahList]);

  const totalMaterial = useMemo(() => {
    return materialList.reduce((acc, curr) => acc + (curr.value * curr.hargaAcuan), 0);
  }, [materialList]);

  const totalBongkaran = useMemo(() => {
    if (!item.isTermasukBongkaran) return 0;
    return bongkaranList.reduce((acc, curr) => acc + (curr.value * curr.hargaAcuan), 0);
  }, [bongkaranList, item.isTermasukBongkaran]);

  const hpsDasar = totalUpah + totalMaterial + totalBongkaran;
  const nilaiMargin = hpsDasar * (margin / 100);
  const hargaTrialFinal = Math.round(hpsDasar + nilaiMargin);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  // Handler Mutasi Editable
  const handleUpdateUpah = (id: string, field: 'value' | 'hargaAcuan' | 'label', val: string | number) => {
    setUpahList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handleUpdateMaterial = (id: string, field: 'value' | 'hargaAcuan' | 'label', val: string | number) => {
    setMaterialList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handleUpdateBongkaran = (id: string, field: 'value' | 'hargaAcuan' | 'label', val: string | number) => {
    setBongkaranList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handleAddUpah = () => {
    const newId = `u-${Date.now()}`;
    setUpahList((prev) => [
      ...prev,
      { id: newId, label: 'Item Upah Baru', unit: 'Oh', value: 0.1, hargaAcuan: 180000, jenis: 'UPAH' },
    ]);
  };

  const handleAddMaterial = () => {
    const newId = `m-${Date.now()}`;
    setMaterialList((prev) => [
      ...prev,
      { id: newId, label: 'Material Pembantu', unit: 'ls', value: 1.0, hargaAcuan: 5000, jenis: 'MATERIAL' },
    ]);
  };

  const handleRemoveItem = (id: string, jenis: 'UPAH' | 'MATERIAL' | 'BONGKARAN') => {
    if (jenis === 'UPAH') setUpahList((prev) => prev.filter((i) => i.id !== id));
    if (jenis === 'MATERIAL') setMaterialList((prev) => prev.filter((i) => i.id !== id));
    if (jenis === 'BONGKARAN') setBongkaranList((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        koefisienUpah: upahList,
        koefisienMaterial: materialList,
        koefisienBongkaran: item.isTermasukBongkaran ? bongkaranList : undefined,
        marginUpah: margin,
        marginMaterial: margin,
        hargaTrialFinal,
        catatan,
      });
    }
  };

  return (
    <div className="space-y-5 font-sans text-slate-800">
      {/* 1. Header Ringkasan Metrik Finansial */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Simulasi HPS & Penyesuaian Harga Trial
              </CardTitle>
            </div>
            <span className="text-xs text-slate-500">
              Satuan: <strong>/{item.satuan}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estimasi Awal Maker */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Estimasi Awal Maker
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-700">
                {formatRupiah(item.estimasiHargaMaker)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Patokan acuan pengajuan</span>
            </div>

            {/* HPS Dasar Koefisien */}
            <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200">
              <span className="text-[11px] font-semibold text-sky-800 uppercase block mb-1">
                HPS Dasar (Total Koef)
              </span>
              <div className="text-base sm:text-lg font-bold font-mono text-sky-900">
                {formatRupiah(hpsDasar)}
              </div>
              <span className="text-[10px] text-sky-700/70 mt-1 block">
                Upah ({formatRupiah(totalUpah)}) + Mat ({formatRupiah(totalMaterial)})
                {item.isTermasukBongkaran && ` + Bongkar (${formatRupiah(totalBongkaran)})`}
              </span>
            </div>

            {/* Margin Kontraktor */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Margin Rekanan / Kontraktor
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900">
                  {margin}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({formatRupiah(nilaiMargin)})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Ditetapkan oleh tim S&B</span>
            </div>

            {/* Usulan HPS Final Trial */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
                Usulan HPS Final Trial
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-950">
                {formatRupiah(hargaTrialFinal)}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                HPS Resmi Pelaksanaan Trial
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tabel Rincian Koefisien Upah Tenaga Kerja */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-sky-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Koefisien Upah Tenaga Kerja
            </CardTitle>
          </div>
          {isEditable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUpah}
              className="text-xs h-7 gap-1 text-sky-700 border-sky-300 hover:bg-sky-50 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Upah</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Uraian Pekerja</th>
                  <th className="py-2.5 px-4 w-24">Satuan</th>
                  <th className="py-2.5 px-4 w-32">Koefisien</th>
                  <th className="py-2.5 px-4 w-36">Harga Acuan (Rp)</th>
                  <th className="py-2.5 px-4 w-36 text-right">Subtotal (Rp)</th>
                  {isEditable && <th className="py-2.5 px-4 w-12 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upahList.map((row) => {
                  const subtotal = row.value * row.hargaAcuan;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            value={row.label}
                            onChange={(e) => handleUpdateUpah(row.id, 'label', e.target.value)}
                            className="h-7 text-xs bg-white"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{row.label}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{row.unit}</td>
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={row.value}
                            onChange={(e) => handleUpdateUpah(row.id, 'value', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs font-mono bg-white"
                          />
                        ) : (
                          <span className="font-mono">{row.value}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            type="number"
                            step="500"
                            value={row.hargaAcuan}
                            onChange={(e) => handleUpdateUpah(row.id, 'hargaAcuan', parseInt(e.target.value) || 0)}
                            className="h-7 text-xs font-mono bg-white"
                          />
                        ) : (
                          <span className="font-mono">{formatRupiah(row.hargaAcuan)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(subtotal)}
                      </td>
                      {isEditable && (
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(row.id, 'UPAH')}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 text-slate-700">Total Upah Tenaga Kerja</td>
                  <td className="py-2.5 px-4 text-right font-mono text-sky-900 font-bold">{formatRupiah(totalUpah)}</td>
                  {isEditable && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabel Rincian Koefisien Material Utama */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Koefisien Material Utama & Pelengkap
            </CardTitle>
          </div>
          {isEditable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMaterial}
              className="text-xs h-7 gap-1 text-sky-700 border-sky-300 hover:bg-sky-50 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Material</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Nama Material</th>
                  <th className="py-2.5 px-4 w-24">Satuan</th>
                  <th className="py-2.5 px-4 w-32">Koefisien</th>
                  <th className="py-2.5 px-4 w-36">Harga Acuan (Rp)</th>
                  <th className="py-2.5 px-4 w-36 text-right">Subtotal (Rp)</th>
                  {isEditable && <th className="py-2.5 px-4 w-12 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialList.map((row) => {
                  const subtotal = row.value * row.hargaAcuan;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            value={row.label}
                            onChange={(e) => handleUpdateMaterial(row.id, 'label', e.target.value)}
                            className="h-7 text-xs bg-white"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{row.label}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{row.unit}</td>
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={row.value}
                            onChange={(e) => handleUpdateMaterial(row.id, 'value', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs font-mono bg-white"
                          />
                        ) : (
                          <span className="font-mono">{row.value}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {isEditable ? (
                          <Input
                            type="number"
                            step="500"
                            value={row.hargaAcuan}
                            onChange={(e) => handleUpdateMaterial(row.id, 'hargaAcuan', parseInt(e.target.value) || 0)}
                            className="h-7 text-xs font-mono bg-white"
                          />
                        ) : (
                          <span className="font-mono">{formatRupiah(row.hargaAcuan)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(subtotal)}
                      </td>
                      {isEditable && (
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(row.id, 'MATERIAL')}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 text-slate-700">Total Material</td>
                  <td className="py-2.5 px-4 text-right font-mono text-sky-900 font-bold">{formatRupiah(totalMaterial)}</td>
                  {isEditable && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tabel Rincian Koefisien Bongkaran (Jika Termasuk Bongkaran) */}
      {item.isTermasukBongkaran && (
        <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-3 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-emerald-700" />
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  3. Koefisien Upah & Pekerjaan Bongkaran
                </CardTitle>
                <span className="text-[10px] text-emerald-700 block">
                  Wajib dihitung karena Maker mengaktifkan opsi &ldquo;Termasuk Pekerjaan Bongkaran&rdquo;
                </span>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
              Bongkaran Aktif
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Uraian Pekerjaan Bongkaran</th>
                    <th className="py-2.5 px-4 w-24">Satuan</th>
                    <th className="py-2.5 px-4 w-32">Koefisien</th>
                    <th className="py-2.5 px-4 w-36">Harga Acuan (Rp)</th>
                    <th className="py-2.5 px-4 w-36 text-right">Subtotal (Rp)</th>
                    {isEditable && <th className="py-2.5 px-4 w-12 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bongkaranList.map((row) => {
                    const subtotal = row.value * row.hargaAcuan;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">
                          {isEditable ? (
                            <Input
                              value={row.label}
                              onChange={(e) => handleUpdateBongkaran(row.id, 'label', e.target.value)}
                              className="h-7 text-xs bg-white"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{row.label}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{row.unit}</td>
                        <td className="py-2.5 px-4">
                          {isEditable ? (
                            <Input
                              type="number"
                              step="0.001"
                              value={row.value}
                              onChange={(e) => handleUpdateBongkaran(row.id, 'value', parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs font-mono bg-white"
                            />
                          ) : (
                            <span className="font-mono">{row.value}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {isEditable ? (
                            <Input
                              type="number"
                              step="500"
                              value={row.hargaAcuan}
                              onChange={(e) => handleUpdateBongkaran(row.id, 'hargaAcuan', parseInt(e.target.value) || 0)}
                              className="h-7 text-xs font-mono bg-white"
                            />
                          ) : (
                            <span className="font-mono">{formatRupiah(row.hargaAcuan)}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                          {formatRupiah(subtotal)}
                        </td>
                        {isEditable && (
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(row.id, 'BONGKARAN')}
                              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-4 text-slate-700">Total Upah Bongkaran</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-900 font-bold">{formatRupiah(totalBongkaran)}</td>
                    {isEditable && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Pengaturan Margin & Catatan S&B (Mode Edit) */}
      {isEditable && (
        <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Persentase Margin Rekanan / Kontraktor (%)
              </label>
              <p className="text-xs text-slate-500">
                Nilai keuntungan wajar kontraktor pelaksana pekerjaan di gerai.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="30"
                value={margin}
                onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                className="w-24 h-9 text-xs font-bold font-mono text-center bg-slate-50 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-600">%</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Catatan Rekomendasi S&B Specialist untuk B&M Regional Manager
            </label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan justifikasi harga atau penyesuaian koefisien..."
              className="text-xs min-h-[75px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl gap-2 shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan & Ajukan Harga Trial ke Regional Manager</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
