"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import {
  PengajuanHargaItem,
  SurveyTokoItem,
  ApprovalLog,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { useGlobalAlert } from '@/context/GlobalAlertContext';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';

export default function BuildingCoordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const itemId = params?.id as string;

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State untuk 3 Toko
  const [surveyToko, setSurveyToko] = useState<SurveyTokoItem[]>([
    {
      namaToko: '',
      alamatToko: '',
      volumeAcuan: 1,
      hargaSatuan: 0,
      tanggalSurvei: new Date().toISOString().slice(0, 10),
    },
    {
      namaToko: '',
      alamatToko: '',
      volumeAcuan: 1,
      hargaSatuan: 0,
      tanggalSurvei: new Date().toISOString().slice(0, 10),
    },
    {
      namaToko: '',
      alamatToko: '',
      volumeAcuan: 1,
      hargaSatuan: 0,
      tanggalSurvei: new Date().toISOString().slice(0, 10),
    },
  ]);

  // Load Data Item dari Store
  useEffect(() => {
    if (!itemId) return;
    const all = getStoredPengajuan();
    const found = all.find((i) => i.id === itemId);

    if (found) {
      setItem(found);
      const existing = found.surveyToko || [];
      const today = new Date().toISOString().slice(0, 10);

      const initialStores: SurveyTokoItem[] = [
        existing[0]
          ? { ...existing[0], volumeAcuan: 1 }
          : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
        existing[1]
          ? { ...existing[1], volumeAcuan: 1 }
          : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
        existing[2]
          ? { ...existing[2], volumeAcuan: 1 }
          : { namaToko: '', alamatToko: '', volumeAcuan: 1, hargaSatuan: 0, tanggalSurvei: today },
      ];
      setSurveyToko(initialStores);
    }
    setLoading(false);
  }, [itemId]);

  const handleChangeToko = (index: number, updated: SurveyTokoItem) => {
    setSurveyToko((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  // Submit Survei Harga
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const [toko1, toko2, toko3] = surveyToko;

    if (!toko1?.namaToko.trim() || !toko2?.namaToko.trim() || !toko3?.namaToko.trim()) {
      showAlert({
        title: 'Perhatian',
        message: 'Nama toko wajib diisi.',
        type: 'warning',
      });
      return;
    }

    if (!toko1?.alamatToko?.trim() || !toko2?.alamatToko?.trim() || !toko3?.alamatToko?.trim()) {
      showAlert({
        title: 'Perhatian',
        message: 'Alamat toko wajib diisi.',
        type: 'warning',
      });
      return;
    }

    const h1 = Number(toko1.hargaSatuan) || 0;
    const h2 = Number(toko2.hargaSatuan) || 0;
    const h3 = Number(toko3.hargaSatuan) || 0;

    if (h1 <= 0 || h2 <= 0 || h3 <= 0) {
      showAlert({
        title: 'Perhatian',
        message: 'Harga survei wajib diisi.',
        type: 'warning',
      });
      return;
    }

    if (!toko1.tanggalSurvei || !toko2.tanggalSurvei || !toko3.tanggalSurvei) {
      showAlert({
        title: 'Perhatian',
        message: 'Tanggal survei wajib diisi.',
        type: 'warning',
      });
      return;
    }

    if (!toko1.buktiSurveiUrl || !toko2.buktiSurveiUrl || !toko3.buktiSurveiUrl) {
      showAlert({
        title: 'Perhatian',
        message: 'Bukti survei wajib diunggah.',
        type: 'warning',
      });
      return;
    }

    const calculatedAvg = Math.round((h1 + h2 + h3) / 3);

    const surveyData: SurveyTokoItem[] = [
      { ...toko1, volumeAcuan: 1, hargaSatuan: h1 },
      { ...toko2, volumeAcuan: 1, hargaSatuan: h2 },
      { ...toko3, volumeAcuan: 1, hargaSatuan: h3 },
    ];

    const isRevisi = item.status === 'RETURNED_TO_BC' || item.status === 'DITOLAK';

    const newLog: ApprovalLog = {
      role: 'Building Coordinator',
      action: isRevisi ? 'REVISE' : 'SUBMIT',
      tanggal: new Date().toISOString().slice(0, 10),
      catatan: `Survei 3 toko selesai. Rata-rata: Rp ${calculatedAvg.toLocaleString('id-ID')}`,
    };

    const all = getStoredPengajuan();
    const updated = all.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          surveyToko: surveyData,
          hargaRataRata: calculatedAvg,
          estimasiHarga: calculatedAvg,
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
      message: 'Harga survei berhasil disimpan.',
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

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Info Material Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 text-sm">
                  {item.kodeMaster || item.kode}
                </span>
                <span className="font-bold text-slate-900 text-lg">
                  {item.item} - {item.merk}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {item.kategori} &bull; {item.implementasi} &bull; {item.lokasi} &bull; {item.ukuran}
              </p>
            </div>

            <div className="text-right shrink-0 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Satuan</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                1 {item.satuan || 'm2'}
              </span>
            </div>
          </div>
        </div>

        {/* Reusable Form Survei 3 Toko */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <RincianSurvei3TokoCard
            mode="edit"
            surveyToko={surveyToko}
            satuan={item.satuan || 'm2'}
            materialCode={item.kodeMaster || item.kode}
            materialName={`${item.item} ${item.ukuran} ${item.merk}`}
            onChangeToko={handleChangeToko}
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
              className="rounded-xl h-9 text-xs font-semibold text-white shadow-xs cursor-pointer bg-red-600 hover:bg-red-700"
            >
              Ajukan Harga
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
