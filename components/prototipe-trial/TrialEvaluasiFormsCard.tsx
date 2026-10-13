// =============================================================================
// components/prototipe-trial/TrialEvaluasiFormsCard.tsx
// Kartu Formulir Penilaian Mandiri 3 Tim Evaluator (PP, BMES, S&B) Sparta
// Fitur: Pilihan Suara Mandiri, Catatan Telaah, Upload Bukti Lapangan,
// Meter Kuorum Real-Time (Minimal 2 dari 3 Setuju)
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  CheckCircle2,
  XCircle,
  Paperclip,
  Upload,
  Send,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { TrialItem, FormEvaluasiTim, calculateEvaluationQuorum } from './types';

interface TrialEvaluasiFormsCardProps {
  item: TrialItem;
  onSaveEvaluation?: (tim: 'TIM_PP' | 'TIM_BMES' | 'TIM_SB', form: FormEvaluasiTim) => void;
  isReadOnly?: boolean;
}

export function TrialEvaluasiFormsCard({
  item,
  onSaveEvaluation,
  isReadOnly = false,
}: TrialEvaluasiFormsCardProps) {
  const quorum = calculateEvaluationQuorum(item);

  // State Aktif Tab Tim yang Sedang Dinilai
  const [selectedTim, setSelectedTim] = useState<'TIM_PP' | 'TIM_BMES' | 'TIM_SB'>('TIM_PP');

  // State Formulir Mandiri per Tim
  const existingForm =
    selectedTim === 'TIM_PP'
      ? item.evaluasiPP
      : selectedTim === 'TIM_BMES'
      ? item.evaluasiBMES
      : item.evaluasiSB;

  const [namaPenilai, setNamaPenilai] = useState<string>(existingForm?.namaPenilai || '');
  const [keputusan, setKeputusan] = useState<'LANJUT' | 'TIDAK_LANJUT'>(
    existingForm?.keputusan || 'LANJUT'
  );
  const [catatan, setCatatan] = useState<string>(existingForm?.catatan || '');
  const [lampiranName, setLampiranName] = useState<string>(existingForm?.lampiranName || '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Ganti tab tim dan reset form state sesuai data tim terpilih
  const handleSelectTim = (tim: 'TIM_PP' | 'TIM_BMES' | 'TIM_SB') => {
    setSelectedTim(tim);
    const form =
      tim === 'TIM_PP' ? item.evaluasiPP : tim === 'TIM_BMES' ? item.evaluasiBMES : item.evaluasiSB;
    setNamaPenilai(form?.namaPenilai || (tim === 'TIM_PP' ? 'Eko Indra (PP Manager)' : tim === 'TIM_BMES' ? 'Bima (BMES Specialist)' : 'Dyan (S&B Specialist)'));
    setKeputusan(form?.keputusan || 'LANJUT');
    setCatatan(form?.catatan || '');
    setLampiranName(form?.lampiranName || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSimulateUpload = () => {
    const dummyFiles = [
      'laporan_uji_lapangan_gerai.pdf',
      'foto_kondisi_material_90hari.jpg',
      'berita_acara_inspeksi_toko.pdf',
    ];
    const picked = dummyFiles[Math.floor(Math.random() * dummyFiles.length)];
    setLampiranName(picked);
  };

  const handleSave = () => {
    if (!namaPenilai.trim()) {
      setErrorMsg('Mohon isi nama personil penilai tim.');
      return;
    }
    if (!catatan.trim()) {
      setErrorMsg('Mohon tuliskan catatan evaluasi hasil uji coba lapangan.');
      return;
    }

    const newForm: FormEvaluasiTim = {
      tim: selectedTim,
      namaPenilai: namaPenilai.trim(),
      keputusan,
      catatan: catatan.trim(),
      lampiranName: lampiranName.trim() || undefined,
      lampiranUrl: lampiranName ? '#' : undefined,
      tanggal: new Date().toISOString().split('T')[0],
    };

    if (onSaveEvaluation) {
      onSaveEvaluation(selectedTim, newForm);
      setSuccessMsg(`Penilaian untuk ${getTimLabel(selectedTim)} berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const getTimLabel = (tim: 'TIM_PP' | 'TIM_BMES' | 'TIM_SB') => {
    switch (tim) {
      case 'TIM_PP':
        return 'Tim Property & Project (PP)';
      case 'TIM_BMES':
        return 'Tim B&M Engineering Specialist (BMES)';
      case 'TIM_SB':
        return 'Tim Standarisasi & Budgeting (S&B)';
    }
  };

  return (
    <div className="space-y-5 font-sans text-slate-800">
      {/* 1. Header Banner & Meter Status Kuorum 2/3 */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-orange-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Kuorum Evaluasi Pasca-Trial (Kuorum Min. 2 dari 3 Tim)
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs font-bold ${
                  quorum.isQuorumMet
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : quorum.isComplete
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {quorum.isQuorumMet
                  ? 'Kuorum Terpenuhi (Lolos)'
                  : quorum.isComplete
                  ? 'Kuorum Gagal (Tidak Lanjut)'
                  : 'Menunggu Kelengkapan Tim'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Formulir Terisi
              </span>
              <div className="text-lg font-bold font-mono text-slate-900">
                {quorum.filledCount} / 3 Tim
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">PP, BMES, dan S&B</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">
                Suara Setuju Lanjut
              </span>
              <div className="text-lg font-bold font-mono text-emerald-900">
                {quorum.agreeCount} Tim
              </div>
              <span className="text-[10px] text-emerald-700/80 mt-1 block">Syarat lolos: min. 2 tim</span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200">
              <span className="text-[11px] font-semibold text-red-800 uppercase block mb-1">
                Suara Tidak Lanjut
              </span>
              <div className="text-lg font-bold font-mono text-red-900">
                {quorum.rejectCount} Tim
              </div>
              <span className="text-[10px] text-red-700/80 mt-1 block">Menolak penetapan master</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Langkah Berikutnya
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {quorum.isQuorumMet
                  ? 'Menunggu B&M Regional Manager'
                  : quorum.isComplete
                  ? 'Aksi Re-Entry oleh Maker'
                  : 'Lengkapi formulir 3 tim'}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Otomatisasi status SPARTA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Seleksi Tab Formulir 3 Tim */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tombol Tab Tim PP */}
        <button
          type="button"
          onClick={() => handleSelectTim('TIM_PP')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedTim === 'TIM_PP'
              ? 'bg-orange-50/80 border-orange-400 shadow-xs ring-2 ring-orange-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">1. Tim PP</span>
            {item.evaluasiPP ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.evaluasiPP.keputusan === 'LANJUT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.evaluasiPP.keputusan === 'LANJUT' ? 'Setuju' : 'Tidak Lanjut'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Belum Diisi</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Evaluasi standar & kelayakan proyek</p>
        </button>

        {/* Tombol Tab Tim BMES */}
        <button
          type="button"
          onClick={() => handleSelectTim('TIM_BMES')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedTim === 'TIM_BMES'
              ? 'bg-orange-50/80 border-orange-400 shadow-xs ring-2 ring-orange-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">2. Tim BMES</span>
            {item.evaluasiBMES ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.evaluasiBMES.keputusan === 'LANJUT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.evaluasiBMES.keputusan === 'LANJUT' ? 'Setuju' : 'Tidak Lanjut'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Belum Diisi</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Evaluasi ketahanan & kondisi fisik gerai</p>
        </button>

        {/* Tombol Tab Tim S&B */}
        <button
          type="button"
          onClick={() => handleSelectTim('TIM_SB')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedTim === 'TIM_SB'
              ? 'bg-orange-50/80 border-orange-400 shadow-xs ring-2 ring-orange-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">3. Tim S&B</span>
            {item.evaluasiSB ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.evaluasiSB.keputusan === 'LANJUT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.evaluasiSB.keputusan === 'LANJUT' ? 'Setuju' : 'Tidak Lanjut'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Belum Diisi</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Evaluasi efisiensi biaya & standarisasi</p>
        </button>
      </div>

      {/* 3. Formulir Penilaian Mandiri untuk Tim Terpilih */}
      <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Formulir Evaluasi: {getTimLabel(selectedTim)}
            </CardTitle>
          </div>
          {existingForm && (
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Telah Dinilai pada {existingForm.tanggal}
            </span>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Baris Nama Penilai */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nama Personil Penilai / Auditor Lapangan <span className="text-red-500">*</span>
            </label>
            <Input
              disabled={isReadOnly}
              value={namaPenilai}
              onChange={(e) => setNamaPenilai(e.target.value)}
              placeholder="Contoh: Bima (BMES Specialist)"
              className="text-xs h-9 bg-slate-50/50"
            />
          </div>

          {/* Baris Keputusan Suara */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Keputusan Suara Evaluasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  keputusan === 'LANJUT'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="keputusan"
                  disabled={isReadOnly}
                  checked={keputusan === 'LANJUT'}
                  onChange={() => setKeputusan('LANJUT')}
                  className="sr-only"
                />
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    Setuju Lanjut ke Master Harga
                  </span>
                  <span className="text-[11px] text-emerald-700/80 block mt-0.5">
                    Material lulus uji ketahanan dan layak diterapkan nasional.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  keputusan === 'TIDAK_LANJUT'
                    ? 'bg-red-50 border-red-400 ring-2 ring-red-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="keputusan"
                  disabled={isReadOnly}
                  checked={keputusan === 'TIDAK_LANJUT'}
                  onChange={() => setKeputusan('TIDAK_LANJUT')}
                  className="sr-only"
                />
                <div className="p-1.5 rounded-lg bg-red-100 text-red-700 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-950 block">
                    Tidak Lanjut (Tolak Masuk Master)
                  </span>
                  <span className="text-[11px] text-red-700/80 block mt-0.5">
                    Terdapat kelemahan material atau ketidaksesuaian operasional.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Baris Catatan Telaah */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Catatan & Justifikasi Hasil Uji Coba <span className="text-red-500">*</span>
            </label>
            <Textarea
              disabled={isReadOnly}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan temuan fisik lapangan, keawetan material, dan rekomendasi teknis..."
              className="text-xs min-h-[90px]"
            />
          </div>

          {/* Baris Unggah Lampiran Bukti Evaluasi */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Lampiran Dokumen Bukti / Foto Evaluasi Lapangan
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {lampiranName || 'Belum ada berkas bukti yang dilampirkan'}
                </span>
              </div>

              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSimulateUpload}
                  className="text-xs h-8 gap-1.5 text-slate-700 border-slate-300 hover:bg-white cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih / Simulasikan Berkas Bukti</span>
                </Button>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Disarankan melampirkan foto kondisi material setelah 90 hari atau berita acara inspeksi.
            </span>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tombol Simpan Form */}
          {!isReadOnly && (
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl gap-2 shadow-2xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Formulir Penilaian {selectedTim.replace('TIM_', 'Tim ')}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
