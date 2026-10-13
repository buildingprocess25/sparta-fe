// =============================================================================
// components/prototipe-trial/TrialEvaluasiKuorumCard.tsx
// Tampilan Formulir & Hasil Evaluasi Lapangan Pasca-Trial (1 Role POV Tunggal)
// Fitur:
// 1. Validasi Status: Hanya item dalam tahap evaluasi yang bisa dinilai (Trial Aktif terkunci)
// 2. Multi-Upload Lampiran Bukti Lapangan / Foto Toko (Bulking seperti ModalTambahTrial)
// 3. Formulir Inline Langsung di Halaman (Bebas Modal Pop-up)
// 4. Panel Penetapan Akhir Master Harga & Opsi Re-Trial Bebas Deadlock
// Desain: Anti-Slop Industrial Clean, Tombol Solid Pastel, Font Geist (font-sans)
// =============================================================================

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ClockAlert,
  Paperclip,
  Check,
  FileCheck2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Upload,
  AlertCircle,
  UserCheck,
  Edit3,
  X,
  FileText,
  Image as ImageIcon,
  Lock,
  Calendar,
  MapPin,
} from 'lucide-react';
import { TrialItem, getRemainingDays, LampiranFileItem } from './types';
import { confirmAlert, successAlert } from '@/components/ui/sweetalert';
import { useTrialStore } from './store';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TrialEvaluasiKuorumCardProps {
  item: TrialItem;
  onEndTrial?: () => void;
}

export function TrialEvaluasiKuorumCard({ item, onEndTrial }: TrialEvaluasiKuorumCardProps) {
  const {
    submitSingleEvaluation,
    approveFinalMaster,
    rejectFinalMaster,
    reEntry,
  } = useTrialStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status Validasi: Apakah item sudah berada di tahap evaluasi?
  const isTrialAktif = item.status === 'TRIAL_AKTIF';
  const remainingDays = getRemainingDays(item.trialStartDate, item.durasiHari);

  // Evaluasi representatif yang tersimpan
  const savedEvaluation = item.evaluasiBMES || item.evaluasiPP || item.evaluasiSB;
  const isAlreadyEvaluated = Boolean(savedEvaluation) && item.status !== 'TRIAL_EVALUASI_VOTING';

  // State Edit Mode (Jika user ingin mengubah evaluasi yang sudah tersimpan)
  const [isEditing, setIsEditing] = useState<boolean>(!isAlreadyEvaluated);

  // State Formulir Inline
  const [namaPenilai, setNamaPenilai] = useState<string>(
    savedEvaluation?.namaPenilai || 'Syahid Jaya (BMES Specialist)'
  );
  const [keputusan, setKeputusan] = useState<'LANJUT' | 'TIDAK_LANJUT'>(
    savedEvaluation?.keputusan || 'LANJUT'
  );
  const [catatan, setCatatan] = useState<string>(savedEvaluation?.catatan || '');
  const [lampiranList, setLampiranList] = useState<UploadedFileItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sinkronisasi state saat data item berubah
  useEffect(() => {
    if (savedEvaluation) {
      setNamaPenilai(savedEvaluation.namaPenilai);
      setKeputusan(savedEvaluation.keputusan);
      setCatatan(savedEvaluation.catatan);
      setIsEditing(item.status === 'TRIAL_EVALUASI_VOTING');

      // Sinkronisasi daftar lampiran yang tersimpan
      if (savedEvaluation.lampiranList && savedEvaluation.lampiranList.length > 0) {
        setLampiranList(
          savedEvaluation.lampiranList.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size || 256000,
            type: f.type || 'application/pdf',
            url: f.url,
            isImage: Boolean(f.name.match(/\.(jpg|jpeg|png|webp)$/i)),
          }))
        );
      } else if (savedEvaluation.lampiranName) {
        setLampiranList([
          {
            id: 'legacy-file-1',
            name: savedEvaluation.lampiranName,
            size: 320000,
            type: 'application/pdf',
            url: savedEvaluation.lampiranUrl || '#',
            isImage: Boolean(savedEvaluation.lampiranName.match(/\.(jpg|jpeg|png|webp)$/i)),
          },
        ]);
      } else {
        setLampiranList([]);
      }
    } else {
      setIsEditing(true);
      setLampiranList([]);
    }
  }, [savedEvaluation, item.status]);

  // Handler Multi-Upload File (Bulking dari Input File Asli)
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newItems: UploadedFileItem[] = [];

    fileArray.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Berkas "${file.name}" melebihi batas maksimal 10MB.`);
        return;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const isImg = file.type.startsWith('image/');
      const url = URL.createObjectURL(file);

      newItems.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        isImage: isImg,
      });
    });

    if (newItems.length > 0) {
      setLampiranList((prev) => [...prev, ...newItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulasi Tambah Banyak Bukti Lapangan / Foto Toko (Bulking Cepat)
  const handleSimulateUpload = () => {
    const timeStr = Date.now().toString().slice(-4);
    const mockFiles: UploadedFileItem[] = [
      {
        id: `mock-img-${timeStr}`,
        name: `foto_kondisi_material_toko_${item.cabang.toLowerCase().replace(/\s+/g, '_')}_${timeStr}.jpg`,
        size: 1450000,
        type: 'image/jpeg',
        url: '',
        isImage: true,
      },
      {
        id: `mock-doc-${timeStr}`,
        name: `laporan_inspeksi_teknis_${item.kode.toLowerCase()}_${timeStr}.pdf`,
        size: 890000,
        type: 'application/pdf',
        url: '#',
        isImage: false,
      },
    ];

    setLampiranList((prev) => [...prev, ...mockFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setLampiranList((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAllFiles = () => {
    setLampiranList([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simpan Evaluasi Inline
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPenilai.trim()) {
      setErrorMsg('Mohon isi nama lengkap personel penilai.');
      return;
    }
    if (!catatan.trim()) {
      setErrorMsg('Mohon tuliskan catatan sebagai dasar evaluasi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const today = new Date().toISOString().split('T')[0];

    // Konversi daftar lampiran ke interface LampiranFileItem
    const formattedLampiranList: LampiranFileItem[] = lampiranList.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url || '#',
      size: f.size,
      type: f.type,
    }));

    try {
      submitSingleEvaluation(item.id, {
        namaPenilai: namaPenilai.trim(),
        keputusan,
        catatan: catatan.trim(),
        lampiranName: formattedLampiranList.length > 0 ? formattedLampiranList[0].name : undefined,
        lampiranList: formattedLampiranList.length > 0 ? formattedLampiranList : undefined,
        tanggal: today,
      });

      setIsEditing(false);

      await successAlert(
        'Evaluasi Berhasil Disimpan',
        "Evaluasi telah berhasil disimpan"
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan evaluasi. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper Aksi Pengesahan Final Master
  const handleApproveFinalMaster = async () => {
    const isConfirmed = await confirmAlert({
      title: 'Sahkan ke Master Harga?',
      text: `Item ${item.kode} (${item.item}) telah lolos evaluasi lapangan. Sahkan item ini menjadi katalog acuan SPK permanen?`,
      confirmTone: 'emerald',
      confirmButtonText: 'Ya, Sahkan ke Master',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      approveFinalMaster(
        item.id,
        'Disahkan resmi ke Master Harga SPARTA berdasarkan rekomendasi evaluasi lapangan.'
      );
      await successAlert(
        'Penetapan Berhasil',
        `Item ${item.kode} kini resmi terdaftar di Katalog Master Harga permanen.`
      );
    }
  };

  // Helper Aksi Tolak Penetapan Final Master
  const handleRejectFinalMaster = async () => {
    const isConfirmed = await confirmAlert({
      title: 'Tolak Penetapan Master?',
      text: `Apakah Anda yakin ingin menolak penetapan item ${item.kode} ke Master Harga? Item akan diarahkan ke opsi re-entry/evaluasi ulang.`,
      confirmTone: 'rose',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      rejectFinalMaster(
        item.id,
        'Penetapan master ditolak oleh B&M Regional Manager. Perlu penyesuaian spesifikasi atau uji coba ulang.'
      );
      await successAlert(
        'Penetapan Ditolak',
        'Status item diperbarui. Tersedia opsi re-entry untuk diajukan kembali.'
      );
    }
  };

  // Helper Aksi Re-Trial
  const handleReTrial = async () => {
    const isConfirmed = await confirmAlert({
      title: 'Ajukan Uji Coba Ulang (Re-Trial)?',
      text: `Item ${item.kode} akan didaftarkan kembali untuk siklus trial babak baru dengan reset evaluasi.`,
      confirmTone: 'amber',
      confirmButtonText: 'Ya, Ajukan Ulang',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      reEntry(item.id, 'RE_TRIAL', 'Item diajukan kembali untuk siklus trial babak baru.');
      await successAlert(
        'Re-Trial Diajukan',
        'Item telah dikembalikan ke alur verifikasi awal untuk periode uji coba baru.'
      );
    }
  };

  // Helper Aksi Direct Master
  const handleDirectMaster = async () => {
    const isConfirmed = await confirmAlert({
      title: 'Ajukan ke Master?',
      text: `Ajukan item ke penetapan Master Harga?`,
      confirmTone: 'indigo',
      confirmButtonText: 'Ya, Ajukan',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      reEntry(item.id, 'DIRECT_MASTER', 'Item dieskalasikan langsung ke penetapan akhir Master Harga.');
      await successAlert(
        'Eskalasi Berhasil',
        'Item siap diputuskan oleh B&M Regional Manager untuk masuk Master Harga.'
      );
    }
  };

  // ===========================================================================
  // KONDISI 1: JIKA STATUS MASIH TRIAL AKTIF (EVALUASI TERKUNCI / BELUM BISA DINILAI)
  // ===========================================================================
  if (isTrialAktif) {
    return (
      <div className="space-y-6 font-sans text-slate-800">
        <Card className="bg-white border-amber-200 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-amber-50/70 border-b border-amber-200/80 py-4 px-5 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    Evaluasi Lapangan Terkunci (Masa Trial Sedang Berjalan)
                  </CardTitle>
                  <p className="text-[11px] text-amber-900">
                    Penilaian evaluasi lapangan hanya dapat dilakukan setelah masa pengujian trial selesai.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-200 text-amber-950 border border-amber-300">
                <ClockAlert className="w-4 h-4 text-amber-900" />
                <span>Masa Uji Berjalan ({remainingDays > 0 ? `${remainingDays} Hari Tersisa` : 'Waktu Habis'})</span>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold text-slate-900">
                Informasi Pelaksanaan Uji Coba Gerai:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cabang Pelaksanaan</span>
                    <strong className="text-slate-900">{item.cabang}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Durasi Pengujian</span>
                    <strong className="text-slate-900">{item.durasiBulan} Bulan ({item.durasiHari} Hari)</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                  <ClockAlert className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sisa Waktu Uji Coba</span>
                    <strong className="text-amber-950">{remainingDays > 0 ? `${remainingDays} Hari Lagi` : 'Selesai'}</strong>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Material saat ini sedang dipasang dan digunakan di gerai untuk menguji ketahanan fisik dan kemudahan perawatannya. Formulir penilaian evaluasi akan otomatis terbuka setelah periode trial ini selesai.
              </p>
            </div>

            {/* Aksi Opsional: Akhiri Pengujian Lebih Awal */}
            {onEndTrial && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-950 block">
                    Ingin melakukan penilaian sekarang?
                  </span>
                  <span className="text-[11px] text-amber-900">
                    Anda dapat mengakhiri masa pengujian trial lebih awal untuk langsung membuka formulir evaluasi lapangan.
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={onEndTrial}
                  className="bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 text-xs font-semibold px-4 py-2 rounded-xl gap-1.5 border-0 shadow-2xs cursor-pointer transition-colors shrink-0"
                >
                  <ClockAlert className="w-3.5 h-3.5 text-amber-900" />
                  <span>Akhiri Pengujian Sekarang</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===========================================================================
  // KONDISI 2: TAHAP EVALUASI (FORMULIR INLINE TERBUKA & HASIL EVALUASI)
  // ===========================================================================
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* 1. SEKSI FORMULIR INLINE / HASIL EVALUASI LAPANGAN */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4 px-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Evaluasi Hasil Uji Coba Lapangan
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  Penilaian kelayakan operasional.
                </p>
              </div>
            </div>

            {/* Status Penilaian */}
            <div>
              {savedEvaluation && !isEditing ? (
                savedEvaluation.keputusan === 'LANJUT' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Rekomendasi: Lanjut ke Master</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
                    <XCircle className="w-4 h-4 text-rose-700" />
                    <span>Rekomendasi: Tidak Lanjut</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  <ClockAlert className="w-4 h-4 text-amber-800" />
                  <span>Formulir Terbuka — Siap Dinilai</span>
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {/* TAMPILAN 1A: FORMULIR INLINE AKTIF (MODE PENGISIAN / EDIT) */}
          {isEditing ? (
            <form onSubmit={handleSubmitEvaluation} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Nama Evaluator */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Nama Penilai</span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={namaPenilai}
                    onChange={(e) => setNamaPenilai(e.target.value)}
                    placeholder="Contoh: Syahid Jaya (BMES Specialist)"
                    className="text-xs bg-white border-slate-200 rounded-xl h-10 font-medium pl-9"
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Personel teknis yang bertanggung jawab melakukan telaah fisik di gerai uji coba.
                </p>
              </div>

              {/* 2. Pilihan Rekomendasi (Segmented Radio Solid Pastel) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Rekomendasi Hasil Uji Coba</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pilih salah satu</span>
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opsi 1: Lanjut ke Master Harga */}
                  <button
                    type="button"
                    onClick={() => setKeputusan('LANJUT')}
                    className={`p-4 rounded-xl text-left transition-all cursor-pointer border-0 flex items-start gap-3.5 ${
                      keputusan === 'LANJUT'
                        ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        keputusan === 'LANJUT' ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold">Lanjut ke Master Harga</div>
                      <div className="text-[11px] leading-relaxed opacity-90">
                        Material terbukti bagus selama uji coba.
                      </div>
                    </div>
                  </button>

                  {/* Opsi 2: Tidak Lanjut / Perlu Uji Ulang */}
                  <button
                    type="button"
                    onClick={() => setKeputusan('TIDAK_LANJUT')}
                    className={`p-4 rounded-xl text-left transition-all cursor-pointer border-0 flex items-start gap-3.5 ${
                      keputusan === 'TIDAK_LANJUT'
                        ? 'bg-rose-100 text-rose-950 ring-2 ring-rose-500 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <XCircle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        keputusan === 'TIDAK_LANJUT' ? 'text-rose-700' : 'text-slate-400'
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold">Tidak Lanjut</div>
                      <div className="text-[11px] leading-relaxed opacity-90">
                        Material terbukti tidak bagus selama uji coba.  
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Catatan Telaah Lapangan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Catatan</span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                </Label>
                <Textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan hasil pengamatan visual, ketahanan fisik material, kemudahan instalasi teknisi, dan rekomendasi operasional..."
                  className="text-xs bg-white border-slate-200 rounded-xl min-h-[100px] leading-relaxed"
                />
              </div>

              {/* 4. LAMPIRAN BUKTI LAPANGAN & FOTO TOKO (BULKING / MULTI-UPLOAD) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <Label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Lampiran Dokumen &amp; Foto Bukti
                    </Label>
                  </div>
                  {lampiranList.length > 0 && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {lampiranList.length} Berkas Terlampir
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  onChange={handleFilesChange}
                  className="hidden"
                />

                {/* Area Dropzone / Upload Bulking */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-7 h-7 text-slate-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">
                    Pilih atau Tarik Berkas Laporan &amp; Foto ke Sini
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung unggah banyak berkas sekaligus: PDF, Word, Excel, JPG, PNG, WebP (Maks. 10MB per berkas)
                  </span>

                  <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border-0 shadow-2xs cursor-pointer"
                    >
                      Pilih dari Komputer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateUpload();
                      }}
                      className="bg-indigo-100 hover:bg-indigo-200 text-indigo-950 text-xs font-semibold px-3 py-1.5 rounded-lg border-0 shadow-2xs cursor-pointer"
                    >
                      + Tambah Contoh Berkas (Simulasi)
                    </Button>
                  </div>
                </div>

                {/* Daftar Berkas Terunggah (Bulking Preview Cards) */}
                {lampiranList.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                      <span>Daftar Berkas Terlampir ({lampiranList.length})</span>
                      <button
                        type="button"
                        onClick={handleClearAllFiles}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                      {lampiranList.map((file) => (
                        <div
                          key={file.id}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 relative group hover:border-slate-300 transition-colors shadow-2xs"
                        >
                          {file.isImage ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative flex items-center justify-center">
                              {file.url && file.url !== '#' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-purple-600" />
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-red-200 bg-red-50 text-red-600 flex flex-col items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                              <span className="text-[8px] font-bold uppercase mt-0.5">
                                {file.name.split('.').pop() || 'DOC'}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-bold text-slate-900 block truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatFileSize(file.size)} &bull; {file.isImage ? 'Foto Lapangan' : 'Dokumen Laporan'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 border-0 bg-transparent"
                            title="Hapus berkas ini"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {lampiranList.length} berkas siap disimpan
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-purple-700 hover:underline font-medium cursor-pointer border-0 bg-transparent"
                      >
                        + Tambah Berkas Lain
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Simpan Formulir */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                {savedEvaluation && (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border-0 shadow-2xs cursor-pointer transition-colors"
                  >
                    Batal Ubah
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-200 hover:bg-emerald-300 active:bg-emerald-400 text-emerald-950 text-xs font-semibold px-5 py-2.5 rounded-xl border-0 shadow-2xs cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          ) : (
            /* TAMPILAN 1B: HASIL EVALUASI TERSEDIA (READ-ONLY + DAFTAR LAMPIRAN BULKING) */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">Penilai:</span>
                    <strong className="text-slate-900">{savedEvaluation?.namaPenilai}</strong>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tanggal: {savedEvaluation?.tanggal}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Catatan Telaah Lapangan:
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-normal">
                    &ldquo;{savedEvaluation?.catatan}&rdquo;
                  </div>
                </div>

                {/* Tampilan Lampiran Tersimpan (Bulking) */}
                {lampiranList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Berkas Bukti Terlampir ({lampiranList.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lampiranList.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800"
                        >
                          <Paperclip className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{file.name}</span>
                            <span className="text-[10px] text-slate-400 block">{formatFileSize(file.size)}</span>
                          </div>
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Ubah Evaluasi jika item belum disahkan permanen ke master */}
              {item.status !== 'TRIAL_PROMOTED_MASTER' && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl gap-1.5 border-0 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ubah Evaluasi</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. TINDAK LANJUT PASCA-EVALUASI */}
      
      {/* 2B: Jika Tidak Lanjut atau Ditolak Regional Manager (Opsi Re-Entry) */}
      {(item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' || item.status === 'TRIAL_DITOLAK_REG_MGR') && (
        <Card className="bg-white border-amber-200 shadow-2xs rounded-2xl overflow-hidden">
          <CardHeader className="bg-amber-50/70 border-b border-amber-100 py-3.5 px-5">
            <div className="flex items-center gap-2 text-amber-950">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Pengajuan Ulang
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                onClick={handleReTrial}
                className="bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 text-xs font-semibold px-4 py-2 rounded-xl gap-1.5 border-0 shadow-2xs cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-amber-800" />
                <span>Ajukan Uji Coba Lapangan (Re-Trial)</span>
              </Button>

              <Button
                type="button"
                onClick={handleDirectMaster}
                className="bg-indigo-200 hover:bg-indigo-300 active:bg-indigo-400 text-indigo-950 text-xs font-semibold px-4 py-2 rounded-xl gap-1.5 border-0 shadow-2xs cursor-pointer transition-colors"
              >
                <span>Ajukan ke Master Harga</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2C: Jika Sudah Dipromosikan ke Master Harga */}
      {item.status === 'TRIAL_PROMOTED_MASTER' && (
        <div className="p-5 bg-emerald-100/80 border border-emerald-300 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                Item Masuk Master Harga
              </h4>
              <p className="text-[11px] text-emerald-900">
                Item ini telah selesai melewati trial dan telah masuk ke Master Harga.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-900 border border-emerald-300 shadow-2xs font-mono">
            {item.kodeMaster || item.kode}
          </span>
        </div>
      )}
    </div>
  );
}
