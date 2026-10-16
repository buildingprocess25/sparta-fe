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
  AlertCircle,
  XCircle,
  Hammer,
  Package,
  Trash2,
  Coins,
  Clock,
  Building2,
  User,
} from 'lucide-react';
import {
  PengajuanHargaItem,
  ApprovalLog,
  VotingKontraktorItem,
} from '@/components/pengajuan-harga/types';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
  submitVoteKontraktor,
  DAFTAR_KONTRAKTOR_REKANAN_DEFAULT,
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

  // Akun Rekanan Kontraktor yang Sedang Aktif (Simulasi Multi-Rekanan)
  const [selectedKontraktorId, setSelectedKontraktorId] = useState<string>('kontraktor-1');

  // State Review / Keputusan
  const [activeAction, setActiveAction] = useState<'SEPAKATI' | 'TOLAK' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [catatanError, setCatatanError] = useState('');
  const [usulanHarga, setUsulanHarga] = useState<string>('');
  const [usulanHargaError, setUsulanHargaError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer batas waktu konfirmasi 3x24 jam
  const [sisaWaktuText, setSisaWaktuText] = useState<string>('3x24 Jam');
  const [isExpired, setIsExpired] = useState<boolean>(false);

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

  // Hitung Ringkasan Harga Akhir per Komponen (Upah, Material, Bongkaran) & Total
  const ringkasanHarga = React.useMemo(() => {
    if (!item) {
      return { upahAkhir: 0, materialAkhir: 0, bongkaranAkhir: 0, totalAkhir: 0, hasBongkaran: false };
    }

    const hasBongkaran = Boolean(
      item.isTermasukBongkaran &&
      item.koefisienUpahBongkaranItems &&
      item.koefisienUpahBongkaranItems.length > 0
    );

    if (!item.koefisienUpahItems?.length && !item.koefisienMaterialItems?.length) {
      const marginMaterial = item.marginMaterial || 0;
      const base = item.estimasiHarga || item.hargaRataRata || 0;
      const total = Math.round(base + (base * marginMaterial / 100));
      return {
        upahAkhir: 0,
        materialAkhir: total,
        bongkaranAkhir: 0,
        totalAkhir: total,
        hasBongkaran: false,
      };
    }

    const marginUpah = item.marginUpah || 0;
    const marginMaterial = item.marginMaterial || 0;
    const marginBongkaran = item.marginBongkaran ?? item.marginUpah ?? 0;

    const upah = (item.koefisienUpahItems || []).reduce(
      (acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)),
      0
    );
    const bongkaran = hasBongkaran
      ? (item.koefisienUpahBongkaranItems || []).reduce(
          (acc, curr) => acc + ((Number(curr.value) || 0) * (Number(curr.hargaAcuan) || 0)),
          0
        )
      : 0;
    const material = (item.koefisienMaterialItems || []).reduce((acc, curr) => {
      const avg = curr.hargaSurveiRataRata || (curr.hargaAcuan || 0);
      return acc + ((Number(curr.value) || 0) * avg);
    }, 0);

    const upahAkhir = Math.round(upah + (upah * marginUpah / 100));
    const bongkaranAkhir = Math.round(bongkaran + (bongkaran * marginBongkaran / 100));
    const materialAkhir = Math.round(material + (material * marginMaterial / 100));
    const totalAkhir = Math.round(upahAkhir + bongkaranAkhir + materialAkhir);

    return {
      upahAkhir,
      materialAkhir,
      bongkaranAkhir,
      totalAkhir,
      hasBongkaran,
    };
  }, [item]);

  const hargaPenawaranAkhir = ringkasanHarga.totalAkhir;

  // 1. Cek apakah pengajuan ini berada di Putaran 2 (S&B Specialist telah merespon/menyesuaikan margin setelah ada usulan kontraktor)
  const isPutaran2 = React.useMemo(() => {
    if (!item?.historyLog?.length) return false;
    let adaKontraktorReject = false;
    for (const log of item.historyLog) {
      if (log.role === 'Kontraktor' && log.action === 'REJECT') {
        adaKontraktorReject = true;
      }
      if (
        adaKontraktorReject &&
        log.role === 'S&B Specialist' &&
        (log.action === 'MASTERING' ||
          log.action === 'APPROVE' ||
          log.catatan?.toLowerCase().includes('penyesuaian') ||
          log.catatan?.toLowerCase().includes('negosiasi'))
      ) {
        return true;
      }
    }
    return false;
  }, [item?.historyLog]);

  // Daftar 3 Rekanan Kontraktor (Dari votingKontraktor di item atau default)
  const daftarRekanan = React.useMemo(() => {
    if (item?.votingKontraktor?.daftarKontraktor?.length) {
      return item.votingKontraktor.daftarKontraktor;
    }
    return DAFTAR_KONTRAKTOR_REKANAN_DEFAULT.map((k) => ({
      ...k,
      statusVote: 'MENUNGGU' as const,
    }));
  }, [item?.votingKontraktor]);

  // Rekanan yang Sedang Aktif
  const activeRekanan = React.useMemo(() => {
    return (
      daftarRekanan.find((k) => k.kontraktorId === selectedKontraktorId) ||
      daftarRekanan[0]
    );
  }, [daftarRekanan, selectedKontraktorId]);

  // Status Vote Akun Aktif
  const hasActiveRekananVoted =
    activeRekanan.statusVote === 'SETUJU' || activeRekanan.statusVote === 'TOLAK';

  // 2. Batas kesempatan pengajuan usulan harga baru (1x) untuk rekanan aktif
  // ATURAN SPARTA:
  // - Di Putaran 1 (sebelum ada revisi harga dari S&B), rekanan yang BELUM merespon memiliki hak penuh mengajukan usulan harga baru (batas belum terhitung).
  // - Batas 1x kesempatan HANYA terhitung habis jika item sudah memasuki Putaran 2 (hasil penyesuaian S&B setelah negosiasi).
  const activeRekananRejectedOnce = React.useMemo(() => {
    if (!isPutaran2) return false;
    return Boolean(
      activeRekanan.hasRejectedOnce ||
      (item?.historyLog || []).some(
        (log) =>
          log.role === 'Kontraktor' &&
          log.action === 'REJECT' &&
          log.catatan?.includes(activeRekanan.namaPerusahaan)
      ) ||
      isPutaran2
    );
  }, [isPutaran2, activeRekanan, item?.historyLog]);

  // Alias hasRejectedOnce agar merujuk ke status spesifik rekanan aktif (bukan sembarang rekanan global)
  const hasRejectedOnce = activeRekananRejectedOnce;

  // Countdown timer batas waktu konfirmasi 3x24 jam
  useEffect(() => {
    const deadlineStr = item?.votingKontraktor?.deadlineVoting;
    if (!deadlineStr) {
      setSisaWaktuText('3x24 Jam (72 Jam)');
      return;
    }

    const hitungSisa = () => {
      const now = new Date().getTime();
      const deadline = new Date(deadlineStr).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setSisaWaktuText('Batas Waktu Berakhir (72 Jam)');
        setIsExpired(true);
      } else {
        const jam = Math.floor(diff / (1000 * 60 * 60));
        const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setSisaWaktuText(`${jam} Jam ${menit} Menit Tersisa`);
        setIsExpired(false);
      }
    };

    hitungSisa();
    const interval = setInterval(hitungSisa, 60000);
    return () => clearInterval(interval);
  }, [item?.votingKontraktor?.deadlineVoting]);

  const usulanMargin = React.useMemo(() => {
    if (!usulanHarga || !totalHargaDasar) return 0;
    const usulan = Number(usulanHarga);
    if (isNaN(usulan)) return 0;
    return Number((((usulan - totalHargaDasar) / totalHargaDasar) * 100).toFixed(2));
  }, [usulanHarga, totalHargaDasar]);

  const handleSubmit = () => {
    if (!item) return;
    if (activeAction === 'TOLAK') {
      if (!activeRekananRejectedOnce) {
        // Putaran 1: Nego (wajib usulan harga dan alasan)
        if (!usulanHarga || Number(usulanHarga) <= 0) {
          setUsulanHargaError('Usulan Harga wajib diisi dengan valid.');
          return;
        }
        if (!catatan.trim()) { 
          setCatatanError('Catatan / Alasan usulan harga wajib diisi.'); 
          return; 
        }
      } else {
        // Putaran 2: Penolakan final & lepas proyek (wajib alasan)
        if (!catatan.trim()) {
          setCatatanError('Alasan penolakan final wajib diisi.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    const updated = submitVoteKontraktor(item.id, activeRekanan.kontraktorId, {
      action: activeAction === 'SEPAKATI' ? 'SETUJU' : 'TOLAK',
      usulanHarga: Number(usulanHarga),
      usulanMargin,
      catatan,
    });

    if (updated) {
      setItem(updated);
      setIsSubmitting(false);

      if (updated.status === 'RELEASED') {
        showAlert({ 
          title: 'Kuorum 50%+1 Terpenuhi!', 
          message: `Penawaran harga resmi disepakati dan dirilis ke Master Harga. Terima kasih atas partisipasi ${activeRekanan.namaPerusahaan}.`, 
          type: 'success' 
        });
      } else if (updated.status === 'USULAN_KONTRAKTOR') {
        showAlert({ 
          title: 'Usulan Harga Terkirim', 
          message: `Usulan harga dari ${activeRekanan.namaPerusahaan} telah diteruskan ke tim S&B Specialist.`, 
          type: 'warning' 
        });
      } else {
        showAlert({ 
          title: 'Persetujuan Berhasil Dicatat', 
          message: `Persetujuan dari ${activeRekanan.namaPerusahaan} telah dicatat. Menunggu konfirmasi rekanan lainnya.`, 
          type: 'success' 
        });
      }
      router.push('/pengajuan-harga/kontraktor');
    } else {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Memuat...</div>;
  if (!item) return <div className="min-h-screen flex justify-center items-center">Data tidak ditemukan</div>;

  const isPending = item.status === 'PENDING_KONTRAKTOR' || item.status === 'USULAN_KONTRAKTOR';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Review Kesepakatan Kontraktor" showBackButton backHref="/pengajuan-harga/kontraktor" />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <PengajuanTimelineBar item={item} />

        {/* PANEL SWITCHER AKUN REKANAN & SLA BATAS WAKTU (SIMULASI DEMO KONTRAKTOR) */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Simulasi Akun Rekanan Kontraktor (Demo SPARTA)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pilih entitas rekanan untuk menguji voting suara (Kuorum 50% + 1)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-amber-600'}`} />
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-medium leading-none">Batas Konfirmasi (3x24 Jam)</span>
                <span className={`text-xs font-bold font-mono ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                  {sisaWaktuText}
                </span>
              </div>
            </div>
          </div>

          {/* Switcher 3 Rekanan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {daftarRekanan.map((k) => {
              const isSelected = selectedKontraktorId === k.kontraktorId;
              const hasVoted = k.statusVote === 'SETUJU' || k.statusVote === 'TOLAK';

              return (
                <button
                  key={k.kontraktorId}
                  type="button"
                  onClick={() => {
                    setSelectedKontraktorId(k.kontraktorId);
                    setActiveAction(null);
                    setUsulanHarga('');
                    setCatatan('');
                    setUsulanHargaError('');
                    setCatatanError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rekanan {k.kontraktorId.replace('kontraktor-', '#')}
                    </span>
                    {k.statusVote === 'SETUJU' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Setuju
                      </span>
                    ) : k.statusVote === 'TOLAK' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                        <RotateCcw className="w-2.5 h-2.5" /> Usulan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">
                        Belum Respon
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-slate-800 truncate" title={k.namaPerusahaan}>
                    {k.namaPerusahaan}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    PIC: {k.picName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DetailSpesifikasi item={item} showDeskripsi={true} />
        

        {/* Ringkasan Harga Akhir untuk Kontraktor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-600" />
                Ringkasan Harga Satuan
              </h2>
            </div>
          </div>

          {/* Grid Ringkasan Subtotal Komponen (Tanpa rincian mikro) */}
          <div className={`grid grid-cols-1 ${ringkasanHarga.hasBongkaran ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            {/* 1. Komponen Upah */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Komponen Upah</span>
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Hammer className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-slate-900 block">
                  {formatRupiah(ringkasanHarga.upahAkhir)}
                </span>
                <span className="text-[10px] text-slate-400">Tenaga kerja</span>
              </div>
            </div>

            {/* 2. Komponen Material & Alat */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">Komponen Material &amp; Alat</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-slate-900 block">
                  {formatRupiah(ringkasanHarga.materialAkhir)}
                </span>
                <span className="text-[10px] text-slate-400">Pengadaan bahan &amp; alat</span>
              </div>
            </div>

            {/* 3. Komponen Bongkaran (Jika ada) */}
            {ringkasanHarga.hasBongkaran && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Komponen Bongkaran</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold font-mono text-slate-900 block">
                    {formatRupiah(ringkasanHarga.bongkaranAkhir)}
                  </span>
                  <span className="text-[10px] text-slate-400">Pekerjaan bongkaran</span>
                </div>
              </div>
            )}
          </div>

          {/* Total Harga Penawaran Akhir */}
          <div className="pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-200 rounded-xl px-5 py-3.5">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block">Total Harga Akhir</span>
                <span className="text-[11px] text-blue-700">Akumulasi seluruh komponen</span>
              </div>
              <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
                <span className="text-2xl font-black font-mono text-blue-700 tracking-tight">
                  {formatRupiah(ringkasanHarga.totalAkhir)}
                </span>
                <span className="text-sm font-bold text-blue-500 font-sans">/ {item.satuan || 'satuan'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Jika Akun Ini Sudah Memberikan Respon */}
        {hasActiveRekananVoted && (
          <div className={`rounded-2xl p-4.5 border flex items-start gap-3 shadow-2xs ${
            activeRekanan.statusVote === 'SETUJU'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
              activeRekanan.statusVote === 'SETUJU'
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                : 'bg-amber-100 border-amber-200 text-amber-700'
            }`}>
              {activeRekanan.statusVote === 'SETUJU' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold">
                {activeRekanan.statusVote === 'SETUJU'
                  ? `Persetujuan Tercatat (${activeRekanan.namaPerusahaan})`
                  : `Usulan Harga Tercatat (${activeRekanan.namaPerusahaan})`}
              </h3>
              <p className="text-xs leading-relaxed">
                {activeRekanan.statusVote === 'SETUJU'
                  ? `Perusahaan Anda telah menyetujui penawaran harga satuan ini pada ${activeRekanan.tanggalRespon || 'baru saja'}. Respon Anda telah tersimpan secara resmi.`
                  : `Perusahaan Anda telah mengajukan usulan penyesuaian harga sebesar ${formatRupiah(activeRekanan.usulanHarga)} (Margin: ${activeRekanan.usulanMargin}%) pada ${activeRekanan.tanggalRespon || 'baru saja'}. Usulan sedang ditinjau oleh tim S&B Specialist.`}
              </p>
              {activeRekanan.catatan && (
                <p className="text-xs italic bg-white/70 p-2.5 rounded-lg border border-current/20 mt-1">
                  &ldquo;{activeRekanan.catatan}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Banner Jika Status DITOLAK_KONTRAKTOR Final */}
        {item.status === 'DITOLAK_KONTRAKTOR' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">Harga Ditolak oleh Kontraktor</h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                Harga ini telah Anda tolak secara final. Perusahaan Anda tidak ditugaskan pada paket pekerjaan ini.
              </p>
            </div>
          </div>
        )}

        {isPending && !hasActiveRekananVoted && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
            {activeRekananRejectedOnce && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm font-semibold text-amber-900 leading-relaxed">
                  <span className="font-bold">Penyesuaian S&amp;B:</span> Harga ini telah disesuaikan kembali oleh tim S&amp;B Specialist berdasarkan pertimbangan usulan Anda sebelumnya. Kesempatan mengajukan usulan harga baru telah digunakan (maksimal 1x). Anda dapat menyepakati harga ini, atau menolak penawaran secara final dengan konsekuensi dikeluarkan dari paket pekerjaan ini.
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Keputusan dari {activeRekanan.namaPerusahaan}
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
                  onClick={() => {
                    setActiveAction('TOLAK');
                    setUsulanHargaError('');
                    setCatatanError('');
                  }}
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
                  {activeRekananRejectedOnce ? 'Tolak Harga' : 'Ajukan Harga Baru'}
                </Button>
              </div>
            </div>

            {activeAction === 'TOLAK' && (
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-4">
                {hasRejectedOnce ? (
                  <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-lg text-sm text-rose-900 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-950">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Konsekuensi Penolakan
                    </div>
                    <p>
                      Batas kesempatan pengajuan usulan harga baru hanya 1 kali. Jika Anda menolak harga ini, penolakan bersifat final dan Anda tidak akan ditugaskan / dikeluarkan dari pekerjaan ini.
                    </p>
                  </div>
                ) : (
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
                      className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none bg-white"
                    />
                    {usulanHargaError && <p className="text-xs text-rose-600 mt-1">{usulanHargaError}</p>}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    {hasRejectedOnce ? 'Alasan Penolakan Final' : 'Alasan'} <span className="text-rose-600">*</span>
                  </label>
                  <Textarea
                    value={catatan}
                    onChange={(e) => { setCatatan(e.target.value); setCatatanError(''); }}
                    placeholder={
                      hasRejectedOnce 
                        ? "Tuliskan alasan penolakan final mengapa harga penyesuaian tidak dapat diterima..."
                        : "Tuliskan argumen Anda mengapa harga perlu dinaikkan..."
                    }
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
                  {activeAction === 'TOLAK' 
                    ? (activeRekananRejectedOnce ? 'Konfirmasi Tolak' : 'Kirim Usulan') 
                    : 'Konfirmasi'}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
