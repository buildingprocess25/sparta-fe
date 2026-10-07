"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  PengajuanHargaItem,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { DetailSpesifikasi } from '@/components/pengajuan-harga/DetailSpesifikasi';
import { RincianSurvei3TokoCard } from '@/components/pengajuan-harga/RincianSurvei3TokoCard';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

export default function KontraktorReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const itemId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const [item, setItem] = useState<PengajuanHargaItem | null>(null);
  const [loading, setLoading] = useState(true);

  // State Review / Keputusan
  const [catatan, setCatatan] = useState('');
  const [catatanError, setCatatanError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatRupiah = (val?: number) => {
    if (!val || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  useEffect(() => {
    if (!itemId) return;
    const all = getStoredPengajuan();
    const found = all.find((i) => i.id === itemId);
    if (found) {
      setItem(found);
    }
    setLoading(false);
  }, [itemId]);

  const handleSepakati = () => {
    if (!item) return;
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'RELEASED' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Kontraktor' as const,
              action: 'APPROVE' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatan.trim() || 'Harga disepakati oleh Kontraktor (Layer 4). Harga resmi dirilis.',
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    showAlert({ title: 'Berhasil', message: 'Harga satuan berhasil disepakati.', type: 'success' });
    router.push('/pengajuan-harga/kontraktor');
  };

  const handleReject = () => {
    if (!item) return;
    if (!catatan.trim()) { setCatatanError('Catatan wajib diisi.'); return; }
    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'RETURNED_TO_BC' as const,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Kontraktor' as const,
              action: 'REJECT' as const,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: catatan.trim(),
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    showAlert({ title: 'Berhasil', message: 'Pengajuan dikembalikan ke BC.', type: 'warning' });
    router.push('/pengajuan-harga/kontraktor');
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Memuat...</div>;
  if (!item) return <div className="min-h-screen flex justify-center items-center">Data tidak ditemukan</div>;

  const isPending = item.status === 'PENDING_KONTRAKTOR';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Review Kesepakatan Kontraktor" showBackButton backHref="/pengajuan-harga/kontraktor" />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <DetailSpesifikasi item={item} showDeskripsi={true} />
        
        <PengajuanTimelineBar item={item} />

        {item.koefisienMaterialItems && item.koefisienMaterialItems.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <RingkasanBiayaMaterial
              materialItems={item.koefisienMaterialItems}
              totalBiayaMaterial={item.hargaRataRata || item.estimasiHarga || 0}
              marginMaterial={item.marginMaterial}
              formatRupiah={formatRupiah}
            />
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Detail Survei Toko per Komponen:</h4>
              {item.koefisienMaterialItems.map((mat) => (
                <RincianSurvei3TokoCard
                  key={mat.id}
                  mode="readonly"
                  surveyToko={mat.surveyToko || []}
                  satuan={mat.unit || 'm2'}
                  materialCode={mat.id}
                  materialName={mat.label}
                />
              ))}
            </div>
          </div>
        ) : item.surveyToko && item.surveyToko.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <RincianSurvei3TokoCard
              mode="readonly"
              surveyToko={item.surveyToko}
              satuan={item.satuan || 'm2'}
              materialCode={item.kodeMaster || item.kode}
              materialName={`${item.item} ${item.ukuran} ${item.merk}`}
            />
          </div>
        ) : null}

        {isPending && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                Catatan Kontraktor
              </label>
              <Textarea
                value={catatan}
                onChange={(e) => { setCatatan(e.target.value); setCatatanError(''); }}
                placeholder="Tuliskan catatan kesepakatan atau revisi jika negosiasi ulang..."
                className="text-xs rounded-xl border-slate-200"
              />
              {catatanError && <p className="text-xs text-red-600 mt-1">{catatanError}</p>}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Link href="/pengajuan-harga/kontraktor" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl text-xs">Kembali</Button>
              </Link>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button onClick={handleReject} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs"><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Revisi ke BC</Button>
                <Button onClick={handleSepakati} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Sepakati Harga</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
