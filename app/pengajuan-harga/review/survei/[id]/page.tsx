"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Package,
  AlertCircle,
  FileText,
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
import { DetailSpesifikasi } from '@/components/pengajuan-harga/DetailSpesifikasi';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { RincianKalkulasiKoefisien } from '@/components/pengajuan-harga/RincianKalkulasiKoefisien';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';
import { Pencil } from 'lucide-react';
import { Suspense } from 'react';
import { TambahPengajuanModal } from '@/components/pengajuan-harga/TambahPengajuanModal';
import { TambahItemTrialModal } from '@/components/pengajuan-harga/TambahItemTrialModal';

function ReviewSurveiContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const itemId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const fromParam = searchParams.get('from');

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [materialItems, setMaterialItems] = useState<KoefisienDetailItem[]>([]);
  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // State Review / Keputusan
  const [catatan, setCatatan] = useState('');
  const [catatanError, setCatatanError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<"approve" | "revise" | null>(null);
  const [usulanHarga, setUsulanHarga] = useState<number | undefined>(undefined);

  // Edit Specification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const formatRupiah = (val?: number) => {
    if (!val || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper slot 3 toko jika belum ada
  const makeInitialStores = (existing?: SurveyTokoItem[]): SurveyTokoItem[] => {
    const today = new Date().toISOString().slice(0, 10);
    const ex = existing || [];
    return [
      ex[0] ? { ...ex[0], volumeAcuan: 1 } : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
      ex[1] ? { ...ex[1], volumeAcuan: 1 } : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
      ex[2] ? { ...ex[2], volumeAcuan: 1 } : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
    ];
  };

  // Load Data
  useEffect(() => {
    if (!itemId) return;
    const all = getStoredPengajuan();
    const found = all.find((i) => i.id === itemId);

    if (found) {
      setItem(found);

      let rawMaterials: KoefisienDetailItem[] = found.koefisienMaterialItems || [];

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
        rawMaterials = rawMaterials.map((m) => {
          const stores = makeInitialStores(m.surveyToko);
          const h1 = Number(stores[0]?.hargaSatuan) || 0;
          const h2 = Number(stores[1]?.hargaSatuan) || 0;
          const h3 = Number(stores[2]?.hargaSatuan) || 0;
          const avg = h1 > 0 && h2 > 0 && h3 > 0 ? Math.round((h1 + h2 + h3) / 3) : 0;
          const subtotal = avg > 0 ? Math.round(Number(m.value) * avg) : 0;

          return {
            ...m,
            surveyToko: stores,
            hargaSurveiRataRata: m.hargaSurveiRataRata || avg,
            subtotal: m.subtotal || subtotal,
          };
        });
      }

      setMaterialItems(rawMaterials);
      if (rawMaterials.length > 0) {
        setOpenAccordionValues([rawMaterials[0].id]);
      }
    }

    setLoading(false);
  }, [itemId]);

  // Total Biaya Material
  const totalBiayaMaterial = useMemo(() => {
    return materialItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  }, [materialItems]);

  // Dynamic Role Config based on Item Status & query param
  const roleConfig = useMemo(() => {
    if (item?.status === 'PENDING_BM_MGR' || fromParam === 'bm-manager') {
      return {
        role: 'B&M Manager' as const,
        navbarTitle: 'Review Survei Harga (B&M Manager - Layer 1)',
        backHref: '/pengajuan-harga/bm-manager',
        nextStatus: 'PENDING_SB_SPECIALIST' as const,
        approveLabel: 'Setujui',
        approveSuccessMsg: 'Survei harga berhasil disetujui dan diteruskan ke S&B Specialist.',
        noteLabel: 'Catatan B&M Manager',
        approveLogText: 'Survei harga 3 toko disetujui B&M Manager (Layer 1) dan diteruskan ke S&B Specialist.',
      };
    }
    if (item?.status === 'PENDING_SB_SPECIALIST' || fromParam === 'sb-specialist') {
      return {
        role: 'S&B Specialist' as const,
        navbarTitle: 'Review Survei Harga (S&B Specialist - Layer 2)',
        backHref: '/pengajuan-harga/sb-specialist',
        nextStatus: 'PENDING_REGIONAL_MGR' as const,
        approveLabel: 'Setujui',
        approveSuccessMsg: 'Survei harga berhasil disetujui dan diteruskan ke B&M Regional Manager.',
        noteLabel: 'Catatan S&B Specialist',
        approveLogText: 'Survei harga 3 toko disetujui S&B Specialist (Layer 2) dan diteruskan ke Regional Manager.',
      };
    }
    if (item?.status === 'PENDING_REGIONAL_MGR' || fromParam === 'regional-manager') {
      return {
        role: 'Regional Manager' as const,
        navbarTitle: 'Review Survei Harga (Regional Manager - Layer 3)',
        backHref: '/pengajuan-harga/regional-manager',
        nextStatus: 'PENDING_KONTRAKTOR' as const,
        approveLabel: 'Setujui',
        approveSuccessMsg: 'Survei harga berhasil disetujui dan diteruskan ke Kontraktor.',
        noteLabel: 'Catatan Regional Manager',
        approveLogText: 'Survei harga 3 toko disetujui B&M Regional Manager (Layer 3) dan diteruskan ke Kontraktor.',
      };
    }
    if (item?.status === 'PENDING_KONTRAKTOR' || fromParam === 'kontraktor') {
      return {
        role: 'Kontraktor' as const,
        navbarTitle: 'Konfirmasi & Kesepakatan Harga (Portal Kontraktor - Layer 4)',
        backHref: '/pengajuan-harga/kontraktor',
        nextStatus: 'RELEASED' as const,
        approveLabel: 'Sepakati Harga',
        approveSuccessMsg: 'Harga satuan material berhasil disepakati dan resmi dirilis ke katalog.',
        noteLabel: 'Catatan Kontraktor',
        approveLogText: 'Harga satuan material disepakati oleh Kontraktor (Layer 4). Harga resmi dirilis.',
      };
    }
    // Fallback if already released / viewed as history
    return {
      role: 'B&M Manager' as const,
      navbarTitle: 'Review Survei Harga Material',
      backHref: '/pengajuan-harga',
      nextStatus: 'RELEASED' as const,
      approveLabel: 'Setujui',
      approveSuccessMsg: 'Persetujuan berhasil disimpan.',
      noteLabel: 'Catatan Evaluasi',
      approveLogText: 'Disetujui.',
    };
  }, [item?.status, fromParam]);

  // Eksekusi Revisi -> Dikembalikan ke BC
  const handleRevisi = () => {
    if (!item) return;

    if (!catatan.trim()) {
      setCatatanError('Catatan revisi wajib diisi agar Building Coordinator mengetahui bagian yang perlu diperbaiki.');
      return;
    }

    setIsSubmitting(true);

    const newLog: ApprovalLog = {
      role: roleConfig.role,
      action: 'REVISE',
      tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
      catatan: catatan.trim(),
    };

    const all = getStoredPengajuan();
    const updated = all.map((i) => {
      if (i.id === item.id) {
        // Jika yang merevisi adalah kontraktor, kembalikan ke S&B Specialist dan simpan usulan harga
        if (roleConfig.role === 'Kontraktor') {
          // Hitung margin usulan
          let calculatedMargin = 0;
          if (usulanHarga) {
            const upahItems = i.koefisienUpahItems || [];
            const bongkaranItems = i.koefisienUpahBongkaranItems || [];
            const materialItems = i.koefisienMaterialItems || [];

            const totalUpahDasar = upahItems.reduce((acc, curr) => acc + (Number(curr.value) * (curr.hargaAcuan || 0)), 0);
            const totalUpahBongkaranDasar = i.isTermasukBongkaran
              ? bongkaranItems.reduce((acc, curr) => acc + (Number(curr.value) * (curr.hargaAcuan || 0)), 0)
              : 0;
            const totalMaterialDasar = materialItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
            const totalHargaDasar = totalUpahDasar + totalUpahBongkaranDasar + totalMaterialDasar;
            
            calculatedMargin = totalHargaDasar > 0 ? ((usulanHarga - totalHargaDasar) / totalHargaDasar) * 100 : 0;
          }

          return {
            ...i,
            status: 'USULAN_KONTRAKTOR' as const,
            catatanReview: catatan.trim(),
            usulanHargaKontraktor: usulanHarga,
            usulanMarginKontraktor: usulanHarga ? calculatedMargin : undefined,
            historyLog: [...(i.historyLog || []), newLog],
          };
        }

        return {
          ...i,
          status: 'RETURNED_TO_BC' as const,
          catatanReview: catatan.trim(),
          historyLog: [...(i.historyLog || []), newLog],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);

    showAlert({
      title: 'Pengajuan Direvisi',
      message: 'Survei dikembalikan ke Building Coordinator untuk diperbaiki.',
      type: 'warning',
    });

    router.push(roleConfig.backHref);
  };

  // Eksekusi Setujui -> Diteruskan ke tahap berikutnya
  const handleSetujui = () => {
    if (!item) return;

    setIsSubmitting(true);

    const newLog: ApprovalLog = {
      role: roleConfig.role,
      action: 'APPROVE',
      tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
      catatan: catatan.trim() || roleConfig.approveLogText,
    };

    const all = getStoredPengajuan();
    const updated = all.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: roleConfig.nextStatus,
          usulanHargaKontraktor: roleConfig.role === 'S&B Specialist' ? undefined : i.usulanHargaKontraktor,
          usulanMarginKontraktor: roleConfig.role === 'S&B Specialist' ? undefined : i.usulanMarginKontraktor,
          historyLog: [...(i.historyLog || []), newLog],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);

    showAlert({
      title: 'Survei Disetujui',
      message: roleConfig.approveSuccessMsg,
      type: 'success',
    });

    router.push(roleConfig.backHref);
  };

  const handleSaveKoefisien = (updatedData: {
    upahItems: KoefisienDetailItem[];
    koefisienUpahBongkaranItems?: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah?: number;
    marginMaterial?: number;
  }) => {
    if (!item) return;

    const all = getStoredPengajuan();
    const updated = all.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          koefisienUpahItems: updatedData.upahItems,
          koefisienUpahBongkaranItems: updatedData.koefisienUpahBongkaranItems,
          koefisienMaterialItems: updatedData.materialItems,
          marginUpah: updatedData.marginUpah,
          marginMaterial: updatedData.marginMaterial,
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    
    // Perbarui state lokal
    setItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        koefisienUpahItems: updatedData.upahItems,
        koefisienUpahBongkaranItems: updatedData.koefisienUpahBongkaranItems,
        koefisienMaterialItems: updatedData.materialItems,
        marginUpah: updatedData.marginUpah,
        marginMaterial: updatedData.marginMaterial,
      };
    });

    showAlert({
      title: "Berhasil",
      message: "Data koefisien berhasil disimpan",
      type: "success",
    });
  };

  const handleUpdateSpesifikasi = (updatedItem: PengajuanHargaItem) => {
    // get all items
    const allItems = getStoredPengajuan();
    const updatedAll = allItems.map(i => i.id === updatedItem.id ? updatedItem : i);
    saveStoredPengajuan(updatedAll);

    setItem(updatedItem);
    setMaterialItems(updatedItem.koefisienMaterialItems || []);
    setIsEditModalOpen(false);
    
    showAlert({
      title: 'Berhasil',
      message: 'Spesifikasi berhasil diperbarui.',
      type: 'success',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500 text-xs">Memuat data survei...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
        <h2 className="text-base font-bold text-slate-800">Material Tidak Ditemukan</h2>
        <Link href={roleConfig.backHref} className="mt-4">
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
        title={roleConfig.navbarTitle}
        showBackButton
        backHref={roleConfig.backHref}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <PengajuanTimelineBar item={item} />

        {/* Jika S&B Specialist melihat usulan harga dari Kontraktor */}
        {roleConfig.role === "S&B Specialist" && item.usulanHargaKontraktor && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-800 mb-1">
                Kontraktor Mengusulkan Revisi Harga
              </h3>
              <p className="text-xs text-red-700 leading-relaxed mb-3">
                Kontraktor menolak harga sebelumnya dan mengusulkan harga baru sebesar{" "}
                <strong className="font-mono text-[13px]">{formatRupiah(item.usulanHargaKontraktor)}</strong>.
                Silakan sesuaikan margin di bawah untuk menyepakati harga usulan ini, atau tolak.
              </p>
              {item.usulanMarginKontraktor !== undefined && (
                <div className="inline-flex bg-white/60 px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-800 font-medium">
                  Ekuivalen Margin: {item.usulanMarginKontraktor.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {((!item.isTrial && roleConfig.role === 'B&M Manager' && (item.status === 'DRAFT' || item.status === 'DIAJUKAN' || item.status === 'REVISI')) ||
            (item.isTrial && roleConfig.role === 'S&B Specialist' && (item.status === 'TRIAL_PENDING_REGIONAL_MGR' || item.status === 'TRIAL_REVISI' || item.status === 'DIAJUKAN' || item.status === 'DRAFT'))) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer gap-1.5 shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Spesifikasi
              </Button>
            </div>
          )}
          <DetailSpesifikasi
            item={item}
            showDeskripsi={true}
          />
        </div>

        {/* Hasil Survei Komponen Material (Read-only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Hasil Survei Komponen Material</span>
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

          {/* Accordion Komponen Material */}
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
                        mode="readonly"
                        hideHeader={true}
                        surveyToko={mat.surveyToko || []}
                        satuan={mat.unit}
                        materialName={mat.label}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Rincian Kalkulasi (Upah, Material, Bongkaran & Margin) */}
        <RincianKalkulasiKoefisien
          item={item}
          onSave={handleSaveKoefisien}
          onBack={() => {}} // Not used here, back is handled by the page's own button
          isReadOnly={true}
          userRole={roleConfig.role}
        />

        {/* Form Catatan & Aksi Keputusan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{roleConfig.noteLabel}</span>
            </label>
            <Textarea
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                if (catatanError) setCatatanError('');
              }}
              placeholder="Tuliskan catatan persetujuan atau alasan revisi survei..."
              rows={3}
              className="text-xs rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
            />
            {catatanError && (
              <p className="text-xs text-red-600 mt-1 font-medium">{catatanError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Link href={roleConfig.backHref} className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </Link>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
              {roleConfig.role === "Kontraktor" ? (
                <>
                  {!activeAction ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setActiveAction("revise")}
                        disabled={isSubmitting}
                        variant="outline"
                        className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-xl text-xs h-9 px-5 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Tolak & Ajukan Harga Baru
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveAction("approve")}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-5 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sepakati Harga Standar
                      </Button>
                    </>
                  ) : activeAction === "revise" ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto bg-red-50 p-1.5 rounded-xl border border-red-100">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">Rp</span>
                        <input
                          type="number"
                          value={usulanHarga || ""}
                          onChange={(e) => setUsulanHarga(Number(e.target.value))}
                          placeholder="Masukkan usulan harga total..."
                          className="w-[220px] pl-8 pr-3 py-1.5 text-xs rounded-lg border-slate-200 focus:ring-red-500/20"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => setActiveAction(null)}
                        variant="ghost"
                        className="h-8 px-3 text-xs text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRevisi}
                        disabled={isSubmitting || !usulanHarga}
                        className="h-8 px-4 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-2xs gap-1.5 cursor-pointer"
                      >
                        Kirim Penolakan
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={() => setActiveAction(null)}
                        variant="ghost"
                        className="h-9 px-4 text-xs text-slate-500 hover:text-slate-700 rounded-xl cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSetujui}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-5 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                      >
                        Konfirmasi Sepakat
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleRevisi}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-5 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisi</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSetujui}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-5 font-semibold shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{roleConfig.approveLabel}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {item && !item.isTrial && (
        <TambahPengajuanModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateSpesifikasi}
          existingItems={getStoredPengajuan()}
          itemToEdit={item}
        />
      )}

      {item && item.isTrial && (
        <TambahItemTrialModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateSpesifikasi}
          existingItems={getStoredPengajuan()}
          itemToEdit={item}
        />
      )}
    </div>
  );
}

export default function ReviewSurveiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center text-slate-500 text-xs">Memuat data review survei...</div>
        </div>
      }
    >
      <ReviewSurveiContent />
    </Suspense>
  );
}
