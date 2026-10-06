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
  Tag,
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
import { RincianKalkulasiKoefisien } from "@/components/pengajuan-harga/RincianKalkulasiKoefisien";
import { DetailSpesifikasi } from "@/components/pengajuan-harga/DetailSpesifikasi";
import { PengajuanTimelineBar } from "@/components/pengajuan-harga/PengajuanTimelineBar";

export default function SBSpecialistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const itemId = params?.id as string;

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);

  // Load Item from Store
  useEffect(() => {
    if (!itemId) return;
    const allItems = getStoredPengajuan();
    const found = allItems.find((i) => i.id === itemId);
    if (found) {
      setItem(found);
    }
  }, [itemId]);

  // Save Koefisien Callback dari Komponen Independen
  const handleSaveKoefisien = (data: {
    upahItems: KoefisienDetailItem[];
    materialItems: KoefisienDetailItem[];
    marginUpah: number;
    marginMaterial: number;
  }) => {
    if (!item) return;

    const allItems = getStoredPengajuan();
    const updated = allItems.map((i) => {
      if (i.id === item.id) {
        const summaryUpah =
          data.upahItems.length > 0
            ? data.upahItems
                .map(
                  (u) =>
                    `${u.label}: ${u.value} ${u.unit} (@Rp ${u.hargaAcuan || 0})`,
                )
                .join(", ")
            : "Tidak ada";
        const summaryMat =
          data.materialItems.length > 0
            ? data.materialItems
                .map((m) => `${m.label}: ${m.value} ${m.unit}`)
                .join(", ")
            : "Tidak ada";

        const nextStatus = i.isTrial
          ? i.status === "TRIAL_REVISI"
            ? "TRIAL_PENDING_REGIONAL_MGR"
            : i.status
          : ("SIAP_SURVEI" as const);

        return {
          ...i,
          status: nextStatus,
          koefisienUpahItems: data.upahItems,
          koefisienMaterialItems: data.materialItems,
          marginUpah: data.marginUpah,
          marginMaterial: data.marginMaterial,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: "S&B Specialist" as const,
              action: "MASTERING" as const,
              tanggal: new Date().toISOString().slice(0, 16).replace("T", " "),
              catatan: `Koefisien teknis AHSP disimpan (Margin Upah: ${data.marginUpah}%, Margin Material: ${data.marginMaterial}%). Status berubah menjadi Siap Survei untuk Building Coordinator. [Upah: ${summaryUpah}] | [Material: ${summaryMat}]`,
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
            status: prev.isTrial
              ? prev.status === "TRIAL_REVISI"
                ? "TRIAL_PENDING_REGIONAL_MGR"
                : prev.status
              : ("SIAP_SURVEI" as const),
            koefisienUpahItems: data.upahItems,
            koefisienMaterialItems: data.materialItems,
            marginUpah: data.marginUpah,
            marginMaterial: data.marginMaterial,
          }
        : null,
    );

    showAlert({
      title: "Koefisien Berhasil Disimpan",
      message: `Koefisien berhasil disimpan. Item siap untuk survei harga oleh Building Coordinator.`,
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

        {/* Timeline Bar Pengajuan */}
        <PengajuanTimelineBar item={item} />

        {/* Card Ringkasan Spesifikasi Item */}
        <DetailSpesifikasi
          item={item}
          showDeskripsi={true}
        />

        {/* RINCIAN KALKULASI KOEFISIEN (KOMPONEN INDEPENDEN) */}
        <RincianKalkulasiKoefisien
          item={item}
          onSave={handleSaveKoefisien}
          onBack={() => router.push("/pengajuan-harga/sb-specialist")}
        />
      </main>
    </div>
  );
}
