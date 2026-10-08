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
  ApprovalLog,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
} from '@/components/pengajuan-harga/store';
import { DetailSpesifikasi } from '@/components/pengajuan-harga/DetailSpesifikasi';
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
  const [activeAction, setActiveAction] = useState<'SEPAKATI' | 'TOLAK' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [catatanError, setCatatanError] = useState('');
  const [usulanHarga, setUsulanHarga] = useState<string>('');
  const [usulanHargaError, setUsulanHargaError] = useState('');
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

  // Hitung Total Dasar (Tanpa Margin) untuk referensi reverse calculation
  const totalHargaDasar = React.useMemo(() => {
    if (!item) return 0;
    
    if (!item.koefisienUpahItems?.length && !item.koefisienMaterialItems?.length) {
      return item.estimasiHarga || item.hargaRataRata || 0;
    }

    const upah = (item.koefisienUpahItems || []).reduce((acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)), 0);
    const bongkaran = (item.koefisienUpahBongkaranItems || []).reduce((acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)), 0);
    const material = (item.koefisienMaterialItems || []).reduce((acc, curr) => {
      const avg = curr.hargaSurveiRataRata || (curr.hargaAcuan || 0);
      return acc + ((Number(curr.value) || 0) * avg);
    }, 0);

    return Math.round(upah + bongkaran + material);
  }, [item]);

  // Hitung Harga Penawaran Akhir (Dengan Margin)
  const hargaPenawaranAkhir = React.useMemo(() => {
    if (!item) return 0;

    if (!item.koefisienUpahItems?.length && !item.koefisienMaterialItems?.length) {
      const marginMaterial = item.marginMaterial || 0;
      const base = item.estimasiHarga || item.hargaRataRata || 0;
      return Math.round(base + (base * marginMaterial / 100));
    }

    const marginUpah = item.marginUpah || 0;
    const marginMaterial = item.marginMaterial || 0;

    const upah = (item.koefisienUpahItems || []).reduce((acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)), 0);
    const bongkaran = item.isTermasukBongkaran 
      ? (item.koefisienUpahBongkaranItems || []).reduce((acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)), 0)
      : 0;
    const material = (item.koefisienMaterialItems || []).reduce((acc, curr) => {
      const avg = curr.hargaSurveiRataRata || (curr.hargaAcuan || 0);
      return acc + ((Number(curr.value) || 0) * avg);
    }, 0);

    const upahAkhir = upah + (upah * marginUpah / 100);
    const bongkaranAkhir = bongkaran + (bongkaran * marginUpah / 100);
    const materialAkhir = material + (material * marginMaterial / 100);

    return Math.round(upahAkhir + bongkaranAkhir + materialAkhir);
  }, [item]);

  const usulanMargin = React.useMemo(() => {
    if (!usulanHarga || !totalHargaDasar) return 0;
    const usulan = Number(usulanHarga);
    if (isNaN(usulan)) return 0;
    return Number((((usulan - totalHargaDasar) / totalHargaDasar) * 100).toFixed(2));
  }, [usulanHarga, totalHargaDasar]);

  const handleSubmit = () => {
    if (!item) return;
    if (activeAction === 'TOLAK') {
      if (!usulanHarga || Number(usulanHarga) <= 0) {
        setUsulanHargaError('Usulan Harga wajib diisi dengan valid.');
        return;
      }
      if (!catatan.trim()) { 
        setCatatanError('Catatan / Alasan tolak wajib diisi.'); 
        return; 
      }
    } else {
      // Action === 'SEPAKATI'
      if (!catatan.trim() && activeAction === 'SEPAKATI') {
        // opsional, bypass if empty string
      }
    }

    setIsSubmitting(true);
    const updated = getStoredPengajuan().map((i) => {
      if (i.id === item.id) {
        const isReject = activeAction === 'TOLAK';
        // Saat kontraktor menolak/nego, kembalikan ke S&B Specialist (bukan BC) karena urusan margin
        const finalStatus = (isReject ? 'PENDING_SB_SPECIALIST' : 'RELEASED') as PengajuanHargaItem['status'];
        const logAction = (isReject ? 'REJECT' : 'APPROVE') as ApprovalLog['action'];
        const finalCatatan = isReject 
          ? catatan.trim() 
          : (catatan.trim() || 'Harga disepakati oleh Kontraktor (Layer 4). Harga resmi dirilis.');

        return {
          ...i,
          status: finalStatus,
          // Simpan usulan di root objek jika ditolak
          usulanHargaKontraktor: isReject ? Number(usulanHarga) : undefined,
          usulanMarginKontraktor: isReject ? usulanMargin : undefined,
          historyLog: [
            ...(i.historyLog || []),
            {
              role: 'Kontraktor' as const,
              action: logAction,
              tanggal: new Date().toISOString().slice(0, 16).replace('T', ' '),
              catatan: finalCatatan,
            },
          ],
        };
      }
      return i;
    });

    saveStoredPengajuan(updated);
    
    if (activeAction === 'TOLAK') {
      showAlert({ title: 'Berhasil', message: 'Harga ditolak dan dikembalikan untuk dinegosiasikan ulang.', type: 'warning' });
    } else {
      showAlert({ title: 'Berhasil', message: 'Harga satuan berhasil disepakati.', type: 'success' });
    }
    router.push('/pengajuan-harga/kontraktor');
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Memuat...</div>;
  if (!item) return <div className="min-h-screen flex justify-center items-center">Data tidak ditemukan</div>;

  const isPending = item.status === 'PENDING_KONTRAKTOR';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Review Kesepakatan Kontraktor" showBackButton backHref="/pengajuan-harga/kontraktor" />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <PengajuanTimelineBar item={item} />
        <DetailSpesifikasi item={item} showDeskripsi={true} />
        

        {/* Ringkasan Harga Akhir untuk Kontraktor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
         
          <div className="pt-3 pb-1">
            <div className="inline-flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-5 py-4 w-full sm:w-auto">
              <span className="text-slate-500 font-semibold text-sm">Harga:</span>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-black font-mono text-blue-700 tracking-tight">
                  {formatRupiah(hargaPenawaranAkhir)}
                </span>
                <span className="text-sm font-bold text-slate-400 pb-1">/ {item.satuan}</span>
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Keputusan Kontraktor
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={() => { setActiveAction('SEPAKATI'); setUsulanHargaError(''); setCatatanError(''); }}
                  variant={activeAction === 'SEPAKATI' ? 'default' : 'outline'}
                  className={`flex-1 justify-start gap-2 h-11 text-xs rounded-xl ${
                    activeAction === 'SEPAKATI'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeAction === 'SEPAKATI' ? 'border-emerald-600' : 'border-slate-300'}`}>
                    {activeAction === 'SEPAKATI' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </div>
                  Sepakati Harga  
                </Button>

                <Button
                  type="button"
                  onClick={() => { setActiveAction('TOLAK'); setUsulanHargaError(''); setCatatanError(''); }}
                  variant={activeAction === 'TOLAK' ? 'default' : 'outline'}
                  className={`flex-1 justify-start gap-2 h-11 text-xs rounded-xl ${
                    activeAction === 'TOLAK'
                      ? 'bg-rose-50 border-rose-600 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeAction === 'TOLAK' ? 'border-rose-600' : 'border-slate-300'}`}>
                    {activeAction === 'TOLAK' && <div className="w-2 h-2 rounded-full bg-rose-600" />}
                  </div>
                  Tolak & Ajukan Harga Baru
                </Button>
              </div>
            </div>

            {activeAction === 'TOLAK' && (
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Usulan Harga Akhir (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={usulanHarga ? formatRupiah(Number(usulanHarga)) : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      setUsulanHarga(rawValue);
                      setUsulanHargaError('');
                    }}
                    placeholder="Masukkan nominal usulan..."
                    className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  {usulanHargaError && <p className="text-xs text-rose-600 mt-1">{usulanHargaError}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Alasan <span className="text-rose-600">*</span>
                  </label>
                  <Textarea
                    value={catatan}
                    onChange={(e) => { setCatatan(e.target.value); setCatatanError(''); }}
                    placeholder="Tuliskan argumen Anda mengapa harga perlu dinaikkan..."
                    className="text-xs rounded-xl border-slate-200 bg-white"
                  />
                  {catatanError && <p className="text-xs text-rose-600 mt-1">{catatanError}</p>}
                </div>
              </div>
            )}

            {activeAction === 'SEPAKATI' && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Catatan Persetujuan (Opsional)
                </label>
                <Textarea
                  value={catatan}
                  onChange={(e) => { setCatatan(e.target.value); setCatatanError(''); }}
                  placeholder="Opsional: Tuliskan catatan kesepakatan..."
                  className="text-xs rounded-xl border-slate-200 bg-white"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Link href="/pengajuan-harga/kontraktor" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl text-xs">Kembali</Button>
              </Link>

              {activeAction && (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className={`w-full sm:w-auto text-white rounded-xl text-xs ${
                    activeAction === 'TOLAK' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {activeAction === 'TOLAK' ? <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                  {activeAction === 'TOLAK' ? 'Kirim Usulan' : 'Konfirmasi'}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
