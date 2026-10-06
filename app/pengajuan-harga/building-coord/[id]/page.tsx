"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import {
  PengajuanHargaItem,
  KoefisienDetailItem,
  SurveyTokoItem,
  ApprovalLog,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { useGlobalAlert } from '@/context/GlobalAlertContext';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { DetailSpesifikasi } from '@/components/pengajuan-harga/DetailSpesifikasi';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';

export default function BuildingCoordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const itemId = params?.id as string;

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>([]);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper untuk inisialisasi 3 slot toko
  const makeInitialStores = (existing?: SurveyTokoItem[]): SurveyTokoItem[] => {
    const today = new Date().toISOString().slice(0, 10);
    const ex = existing || [];
    return [
      ex[0]
        ? { ...ex[0], volumeAcuan: 1 }
        : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
      ex[1]
        ? { ...ex[1], volumeAcuan: 1 }
        : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
      ex[2]
        ? { ...ex[2], volumeAcuan: 1 }
        : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
    ];
  };

  // Load Data Item dari Store
  useEffect(() => {
    if (!itemId) return;
    const all = getStoredPengajuan();
    const found = all.find((i) => i.id === itemId);

    if (found) {
      setItem(found);

      let rawMaterials: KoefisienDetailItem[] = found.koefisienMaterialItems || [];

      // Jika belum ada komponen material dari S&B, buatkan default terstandarisasi
      if (rawMaterials.length === 0) {
        const isKeramik =
          found.item.toLowerCase().includes('keramik') ||
          found.item.toLowerCase().includes('granit');
        const isCat = found.item.toLowerCase().includes('cat');

        if (isKeramik) {
          rawMaterials = [
            {
              id: `m-1-${found.id}`,
              label: `${found.item} ${found.ukuran} ${found.merk}`,
              value: found.koefisienMaterial || '1.0500',
              unit: found.satuan || 'm2',
              surveyToko: makeInitialStores(found.surveyToko),
            },
            {
              id: `m-2-${found.id}`,
              label: 'Semen Instan / Mortar Perekat',
              value: '0.1000',
              unit: 'sak',
              surveyToko: makeInitialStores(),
            },
            {
              id: `m-3-${found.id}`,
              label: 'Semen Pengisi Nat (Tile Grout)',
              value: '0.0500',
              unit: 'Kg',
              surveyToko: makeInitialStores(),
            },
          ];
        } else if (isCat) {
          rawMaterials = [
            {
              id: `m-1-${found.id}`,
              label: `${found.item} ${found.ukuran} ${found.merk}`,
              value: found.koefisienMaterial || '1.0000',
              unit: found.satuan || 'Pail',
              surveyToko: makeInitialStores(found.surveyToko),
            },
            {
              id: `m-2-${found.id}`,
              label: 'Plamir Alkali Killer',
              value: '2.5000',
              unit: 'Kg',
              surveyToko: makeInitialStores(),
            },
            {
              id: `m-3-${found.id}`,
              label: 'Rol Cat & Kuas Standar',
              value: '0.0500',
              unit: 'Set',
              surveyToko: makeInitialStores(),
            },
          ];
        } else {
          rawMaterials = [
            {
              id: `m-1-${found.id}`,
              label: `${found.item} ${found.ukuran} ${found.merk}`,
              value: found.koefisienMaterial || '1.0000',
              unit: found.satuan || 'Unit',
              surveyToko: makeInitialStores(found.surveyToko),
            },
          ];
        }
      } else {
        rawMaterials = rawMaterials.map((m) => ({
          ...m,
          surveyToko: makeInitialStores(m.surveyToko),
        }));
      }

      setMaterialItems(rawMaterials);
      if (rawMaterials.length > 0) {
        setOpenAccordionValues([rawMaterials[0].id]);
      }
    }
    setLoading(false);
  }, [itemId]);

  // Handler Perubahan Data Toko untuk Komponen Material tertentu
  const handleChangeTokoForMaterial = (
    materialIndex: number,
    storeIndex: number,
    updatedStore: SurveyTokoItem
  ) => {
    setMaterialItems((prev) => {
      const next = [...prev];
      const target = { ...next[materialIndex] };
      const nextStores = [...(target.surveyToko || [])];
      nextStores[storeIndex] = updatedStore;

      const h1 = Number(nextStores[0]?.hargaSatuan) || 0;
      const h2 = Number(nextStores[1]?.hargaSatuan) || 0;
      const h3 = Number(nextStores[2]?.hargaSatuan) || 0;
      const validCount = [h1, h2, h3].filter((h) => h > 0).length;
      const avg = validCount === 3 ? Math.round((h1 + h2 + h3) / 3) : 0;
      const subtotal = avg > 0 ? Math.round(Number(target.value) * avg) : 0;

      target.surveyToko = nextStores;
      target.hargaSurveiRataRata = avg;
      target.hargaAcuan = avg;
      target.subtotal = subtotal;
      next[materialIndex] = target;
      return next;
    });
  };

  // Hitung Total Biaya Material
  const totalBiayaMaterial = useMemo(() => {
    return materialItems.reduce((acc, curr) => {
      const h1 = Number(curr.surveyToko?.[0]?.hargaSatuan) || 0;
      const h2 = Number(curr.surveyToko?.[1]?.hargaSatuan) || 0;
      const h3 = Number(curr.surveyToko?.[2]?.hargaSatuan) || 0;
      const avg = h1 > 0 && h2 > 0 && h3 > 0 ? Math.round((h1 + h2 + h3) / 3) : 0;
      const sub = avg * (Number(curr.value) || 0);
      return acc + sub;
    }, 0);
  }, [materialItems]);

  // Submit Survei Harga Seluruh Komponen Material
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    // Validasi setiap komponen material
    for (let i = 0; i < materialItems.length; i++) {
      const mat = materialItems[i];
      const stores = mat.surveyToko || [];
      const [t1, t2, t3] = stores;

      if (!t1?.namaToko?.trim() || !t2?.namaToko?.trim() || !t3?.namaToko?.trim()) {
        setOpenAccordionValues((prev) => Array.from(new Set([...prev, mat.id])));
        showAlert({
          title: 'Perhatian',
          message: 'Nama toko wajib diisi.',
          type: 'warning',
        });
        return;
      }

      if (!t1?.alamatToko?.trim() || !t2?.alamatToko?.trim() || !t3?.alamatToko?.trim()) {
        setOpenAccordionValues((prev) => Array.from(new Set([...prev, mat.id])));
        showAlert({
          title: 'Perhatian',
          message: 'Alamat toko wajib diisi.',
          type: 'warning',
        });
        return;
      }

      const h1 = Number(t1.hargaSatuan) || 0;
      const h2 = Number(t2.hargaSatuan) || 0;
      const h3 = Number(t3.hargaSatuan) || 0;

      if (h1 <= 0 || h2 <= 0 || h3 <= 0) {
        setOpenAccordionValues((prev) => Array.from(new Set([...prev, mat.id])));
        showAlert({
          title: 'Perhatian',
          message: 'Harga survei wajib diisi.',
          type: 'warning',
        });
        return;
      }

      if (!t1.tanggalSurvei || !t2.tanggalSurvei || !t3.tanggalSurvei) {
        setOpenAccordionValues((prev) => Array.from(new Set([...prev, mat.id])));
        showAlert({
          title: 'Perhatian',
          message: 'Tanggal survei wajib diisi.',
          type: 'warning',
        });
        return;
      }

      if (!t1.buktiSurveiUrl || !t2.buktiSurveiUrl || !t3.buktiSurveiUrl) {
        setOpenAccordionValues((prev) => Array.from(new Set([...prev, mat.id])));
        showAlert({
          title: 'Perhatian',
          message: 'Bukti survei wajib diunggah.',
          type: 'warning',
        });
        return;
      }
    }

    // Kalkulasi final per komponen
    const updatedMaterialItems = materialItems.map((mat) => {
      const stores = mat.surveyToko || [];
      const h1 = Number(stores[0]?.hargaSatuan) || 0;
      const h2 = Number(stores[1]?.hargaSatuan) || 0;
      const h3 = Number(stores[2]?.hargaSatuan) || 0;
      const avg = Math.round((h1 + h2 + h3) / 3);
      const subtotal = Math.round(Number(mat.value) * avg);

      return {
        ...mat,
        hargaSurveiRataRata: avg,
        hargaAcuan: avg,
        subtotal,
      };
    });

    const totalCalculated = updatedMaterialItems.reduce(
      (acc, curr) => acc + (curr.subtotal || 0),
      0
    );

    const isRevisi = item.status === 'RETURNED_TO_BC' || item.status === 'DITOLAK';

    const newLog: ApprovalLog = {
      role: 'Building Coordinator',
      action: isRevisi ? 'REVISE' : 'SUBMIT',
      tanggal: new Date().toISOString().slice(0, 10),
      catatan: `Survei 3 toko selesai untuk ${updatedMaterialItems.length} item material. Total Biaya Material: Rp ${totalCalculated.toLocaleString('id-ID')}`,
    };

    const all = getStoredPengajuan();
    const updated = all.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          koefisienMaterialItems: updatedMaterialItems,
          surveyToko: updatedMaterialItems[0]?.surveyToko || [],
          hargaRataRata: totalCalculated,
          estimasiHarga: totalCalculated,
          status: 'PENDING_BM_MGR' as const,
          tanggalPengajuan: new Date().toISOString().slice(0, 10),
          historyLog: [...(i.historyLog || []), newLog],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);

    showAlert({
      title: 'Berhasil',
      message: 'Survei harga berhasil diajukan.',
      type: 'success',
    });

    router.push('/pengajuan-harga/building-coord');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500 text-xs">Memuat data...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
        <h2 className="text-base font-bold text-slate-800">Material Tidak Ditemukan</h2>
        <Link href="/pengajuan-harga/building-coord" className="mt-4">
          <Button variant="outline" className="rounded-xl text-xs gap-1.5 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar
        title="Survei Harga Material"
        showBackButton
        backHref="/pengajuan-harga/building-coord"
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Timeline Bar Pengajuan */}
        <PengajuanTimelineBar item={item} />

        {/* Rincian Spesifikasi Material */}
        <DetailSpesifikasi
          item={item}
          showDeskripsi={true}
        />

        {/* Form Survei Menggunakan Accordion */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Komponen Material</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordionValues(materialItems.map((m, idx) => m.id || `mat-${idx}`))
                  }
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Buka Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setOpenAccordionValues([])}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Tutup Semua
                </button>
              </div>
            </div>

            {/* Accordion List Item Material */}
            <Accordion
              type="multiple"
              value={openAccordionValues}
              onValueChange={setOpenAccordionValues}
              className="space-y-3"
            >
              {materialItems.map((mat, idx) => {
                const itemKey = mat.id || `mat-${idx}`;
                const stores = mat.surveyToko || [];
                const validCount = stores.filter(
                  (s) =>
                    s.namaToko?.trim() &&
                    s.alamatToko?.trim() &&
                    Number(s.hargaSatuan) > 0 &&
                    s.buktiSurveiUrl
                ).length;
                const isComplete = validCount === 3;

                return (
                  <AccordionItem
                    key={itemKey}
                    value={itemKey}
                    className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs border-b transition-all"
                  >
                    <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-3 text-left gap-2 sm:gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs flex items-center justify-center font-bold shrink-0 border border-slate-200">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                              <span>{mat.label}</span>
                              {isComplete ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>3/3 Toko</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                                  {validCount}/3 Toko
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Koefisien: <span className="font-bold text-slate-700">{mat.value} {mat.unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Rata-Rata</span>
                            <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm">
                              {formatRupiah(mat.hargaSurveiRataRata || 0)} / {mat.unit}
                            </span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                            <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                              {formatRupiah(mat.subtotal || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40">
                      <div className="pt-2">
                        <RincianSurvei3TokoCard
                          mode="edit"
                          hideHeader={true}
                          surveyToko={mat.surveyToko || []}
                          satuan={mat.unit}
                          materialName={mat.label}
                          onChangeToko={(storeIdx, updated) =>
                            handleChangeTokoForMaterial(idx, storeIdx, updated)
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Ringkasan Biaya Material */}
          <RingkasanBiayaMaterial
            materialItems={materialItems}
            totalBiayaMaterial={totalBiayaMaterial}
            marginMaterial={item?.marginMaterial}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/pengajuan-harga/building-coord">
              <Button type="button" variant="outline" className="rounded-xl h-9 text-xs cursor-pointer">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              className="rounded-xl h-9 text-xs font-semibold text-white shadow-xs cursor-pointer bg-red-600 hover:bg-red-700 px-5"
            >
              Ajukan Survei
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
