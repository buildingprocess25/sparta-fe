// =============================================================================
// app/prototipe-trial/detail/[id]/page.tsx
// Halaman Detail Item Trial Terpadu Sparta
// Fitur: Spesifikasi Fisik, Estimasi Harga, Bongkaran, Lampiran, Koefisien S&B,
// Dokumen Trial, Evaluasi Kuorum 3 Tim, Audit Log & Bilah Aksi Kontekstual
// Bahasa: Lugas, Ringkas, Clean Architecture
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { TrialTimelineBar } from '@/components/prototipe-trial/TrialTimelineBar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import {
  TRIAL_STATUS_MAP,
  getRemainingDays,
  calculateEvaluationQuorum,
} from '@/components/prototipe-trial/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Paperclip,
  Check,
  X,
  History,
  FileCheck,
  Calculator,
  Vote,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function DetailTrialItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params?.id as string;

  const {
    items,
    mounted,
    approvePP,
    revisePP,
    approveBMGM,
    reviseBMGM,
    approveRegMgrConfig,
    reviseRegMgrConfig,
    approveFinalMaster,
    rejectFinalMaster,
    reEntry,
  } = useTrialStore();

  const [activeTab, setActiveTab] = useState<'spek' | 'koefisien' | 'dokumen' | 'evaluasi' | 'history'>('spek');
  const [revisiCatatan, setRevisiCatatan] = useState('');
  const [isRevisiModalOpen, setIsRevisiModalOpen] = useState(false);
  const [revisiTargetAction, setRevisiTargetAction] = useState<string>('');

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        Memuat data trial...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TrialNavbar subtitle="Item Tidak Ditemukan" />
        <div className="flex-1 max-w-xl mx-auto p-8 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-slate-700">Item trial tidak ditemukan.</p>
          <Link
            href="/prototipe-trial"
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold"
          >
            Kembali ke Portal
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = TRIAL_STATUS_MAP[item.status] || {
    label: item.status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  };

  const remainingDays = getRemainingDays(item.trialStartDate, item.durasiHari);
  const quorum = calculateEvaluationQuorum(item);

  // Handler Aksi Approval
  const handleApprove = () => {
    if (item.status === 'TRIAL_PENDING_PP_MGR') {
      approvePP(item.id, 'Disetujui oleh PP Manager.');
    } else if (item.status === 'TRIAL_PENDING_BM_GM') {
      approveBMGM(item.id, 'Disetujui oleh B&M General Manager.');
    } else if (item.status === 'TRIAL_PENDING_BM_REG_CONFIG') {
      approveRegMgrConfig(item.id, 'Harga trial disetujui oleh B&M Regional Manager.');
    } else if (item.status === 'TRIAL_PENDING_FINAL_BM_REG') {
      approveFinalMaster(item.id, 'Disetujui resmi. Ditetapkan menjadi Master Harga.');
    }
  };

  const handleOpenRevisi = (action: string) => {
    setRevisiTargetAction(action);
    setRevisiCatatan('');
    setIsRevisiModalOpen(true);
  };

  const handleConfirmRevisi = () => {
    if (!revisiCatatan.trim()) {
      alert('Mohon tuliskan catatan revisi.');
      return;
    }
    if (revisiTargetAction === 'PP') {
      revisePP(item.id, revisiCatatan);
    } else if (revisiTargetAction === 'BMGM') {
      reviseBMGM(item.id, revisiCatatan);
    } else if (revisiTargetAction === 'REG_MGR_CONFIG') {
      reviseRegMgrConfig(item.id, revisiCatatan);
    } else if (revisiTargetAction === 'REG_MGR_FINAL') {
      rejectFinalMaster(item.id, revisiCatatan);
    }
    setIsRevisiModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      <TrialNavbar subtitle={`Detail: ${item.kode}`} />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        {/* Navigasi Balik & Identitas Utama */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="mt-0.5 p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs">
                  {item.kode}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {item.item} {item.merk ? `- ${item.merk}` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kategori: <strong className="text-slate-700">{item.kategori}</strong> &bull; Cabang: <strong className="text-slate-700">{item.cabang}</strong> &bull; Pengaju: <span className="text-slate-700">{item.makerNama}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor}`} />
              {statusMeta.label}
            </span>

            {item.status === 'TRIAL_AKTIF' && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-semibold py-1">
                Sisa {remainingDays} Hari
              </Badge>
            )}
          </div>
        </div>

        {/* Stepper Timeline Bar */}
        <TrialTimelineBar item={item} />

        {/* Peringatan Revisi Jika Ada */}
        {item.revisiCatatan && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Catatan Revisi dari {item.revisiOleh || 'Approver'}:</span>
              <p className="mt-0.5 text-rose-800">{item.revisiCatatan}</p>
            </div>
          </div>
        )}

        {/* Tab Navigasi Konten */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl overflow-x-auto scrollbar-none">
          {[
            { id: 'spek', label: '1. Spesifikasi & Maker', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'koefisien', label: '2. Harga & Koefisien S&B', icon: <Calculator className="w-3.5 h-3.5" /> },
            { id: 'dokumen', label: '3. Dokumen Trial (PDF)', icon: <FileCheck className="w-3.5 h-3.5" /> },
            { id: 'evaluasi', label: '4. Evaluasi Kuorum 3 Tim', icon: <Vote className="w-3.5 h-3.5" /> },
            { id: 'history', label: '5. Riwayat Audit', icon: <History className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 text-xs font-bold shrink-0 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: SPESIFIKASI FISIK & MAKER */}
        {activeTab === 'spek' && (
          <div className="bg-white p-5 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Ukuran / Dimensi</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.ukuran}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Merk / Brand</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.merk || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Warna & Tipe</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.warna} - {item.tipe || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Finishing Permukaan</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.permukaan || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Ketebalan & Toleransi</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.tebal} (Tol. {item.toleransi})</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Posisi & Lokasi Gerai</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.implementasi} / {item.lokasi}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Satuan Pekerjaan</span>
                <p className="font-bold text-slate-900 mt-0.5">{item.satuan}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Durasi Uji Coba</span>
                <p className="font-bold text-red-600 mt-0.5">{item.durasiBulan} Bulan ({item.durasiHari} Hari)</p>
              </div>
            </div>

            {/* Parameter Biaya Awal Maker & Bongkaran */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Estimasi Harga Awal Maker</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  Rp {item.estimasiHargaMaker.toLocaleString('id-ID')} / {item.satuan}
                </p>
                <span className="text-[10px] text-slate-400">*Acuan awal, dapat disesuaikan tim S&B</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Pekerjaan Bongkaran</span>
                <div className="mt-1">
                  {item.isTermasukBongkaran ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                      Termasuk Bongkaran
                    </Badge>
                  ) : (
                    <span className="font-bold text-slate-700">Tidak Termasuk</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Lampiran Dokumen Maker</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-blue-700 underline cursor-pointer text-xs">
                    {item.lampiranMakerName || 'Tidak ada berkas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alasan Trial */}
            <div>
              <span className="text-xs font-bold text-slate-700">Latar Belakang & Alasan Pengajuan Trial:</span>
              <p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed border border-slate-100">
                {item.alasanTrial}
              </p>
            </div>

            {/* Deskripsi Otomatis */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold text-slate-800">Deskripsi Otomatis Sistem:</span>
              <p className="font-mono text-slate-900 text-[11px] mt-1">{item.deskripsiOtomatis}</p>
            </div>
          </div>
        )}

        {/* TAB 2: HARGA & KOEFISIEN S&B */}
        {activeTab === 'koefisien' && (
          <div className="bg-white p-5 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs space-y-5">
            {item.hargaTrialFinal ? (
              <>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">Harga Satuan Trial yang Disepakati S&B:</span>
                    <h3 className="text-xl font-bold text-emerald-900 mt-0.5">
                      Rp {item.hargaTrialFinal.toLocaleString('id-ID')} / {item.satuan}
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-white text-emerald-800 border-emerald-300 text-xs">
                    Margin: {item.marginUpah || 8}%
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Upah */}
                  <div className="border border-slate-200 rounded-xl p-3">
                    <h5 className="font-bold text-slate-800 mb-2">Komponen Upah Kerja:</h5>
                    <div className="space-y-1.5 font-mono">
                      {item.koefisienUpah?.map((u) => (
                        <div key={u.id} className="flex justify-between text-slate-700">
                          <span>{u.label} ({u.value} {u.unit})</span>
                          <span>Rp {u.hargaAcuan.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Material */}
                  <div className="border border-slate-200 rounded-xl p-3">
                    <h5 className="font-bold text-slate-800 mb-2">Komponen Material Acuan:</h5>
                    <div className="space-y-1.5 font-mono">
                      {item.koefisienMaterial?.map((m) => (
                        <div key={m.id} className="flex justify-between text-slate-700">
                          <span>{m.label} ({m.value} {m.unit})</span>
                          <span>Rp {m.hargaAcuan.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Calculator className="w-8 h-8 mx-auto text-slate-300" />
                <p>Koefisien dan harga final trial belum dikonfigurasi oleh S&B Specialist.</p>
                <p className="text-[11px] text-slate-500">
                  Tahap ini akan aktif setelah pengajuan disetujui oleh B&M General Manager.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOKUMEN TRIAL */}
        {activeTab === 'dokumen' && (
          <div className="bg-white p-5 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs space-y-4">
            {item.nomorDokumenTrial ? (
              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center text-center space-y-3">
                <FileCheck className="w-10 h-10 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dokumen Pelaksanaan Trial Resmi Terbit
                  </h4>
                  <p className="font-mono text-xs text-red-600 font-bold mt-1">
                    {item.nomorDokumenTrial}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Dokumen ini merupakan dasar legalitas pelaksanaan pengujian item di cabang <strong>{item.cabang}</strong> dengan masa aktif {item.durasiHari} hari.
                  </p>
                </div>
                <Button
                  onClick={() => alert(`Membuka Dokumen Resmi: ${item.nomorDokumenTrial}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 h-8"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Lihat / Cetak Dokumen PDF
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <FileCheck className="w-8 h-8 mx-auto text-slate-300" />
                <p>Dokumen Pelaksanaan Trial belum terbit.</p>
                <p className="text-[11px] text-slate-500">
                  Dokumen akan di-generate otomatis begitu B&M Regional Manager menyetujui konfigurasi harga S&B.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EVALUASI KUORUM 3 TIM */}
        {activeTab === 'evaluasi' && (
          <div className="bg-white p-5 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs space-y-5">
            {/* Meter Kuorum 2 dari 3 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Status Kuorum Evaluasi Pasca-Trial (2 dari 3 Tim)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setuju Lanjut: <strong className="text-emerald-700">{quorum.approvedCount} Tim</strong> &bull; Tidak Lanjut: <strong className="text-rose-700">{quorum.rejectedCount} Tim</strong>
                </p>
              </div>

              <div>
                {quorum.isQuorumApproved ? (
                  <Badge className="bg-emerald-600 text-white text-xs py-1 px-3">
                    Lolos Kuorum (Disetujui Lanjut ke Master)
                  </Badge>
                ) : quorum.isQuorumRejected ? (
                  <Badge className="bg-rose-600 text-white text-xs py-1 px-3">
                    Mayoritas Menolak (Tidak Lanjut)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-white text-slate-700 text-xs py-1 px-3">
                    {quorum.totalVoted}/3 Formulir Terisi
                  </Badge>
                )}
              </div>
            </div>

            {/* 3 Kartu Evaluasi Mandiri Tim */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Form PP */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">1. Tim PP</span>
                    {item.evaluasiPP ? (
                      <Badge className={item.evaluasiPP.keputusan === 'LANJUT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {item.evaluasiPP.keputusan}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Belum Mengisi</Badge>
                    )}
                  </div>
                  {item.evaluasiPP ? (
                    <div className="space-y-1.5 text-slate-700">
                      <p className="italic bg-slate-50 p-2 rounded">&ldquo;{item.evaluasiPP.catatan}&rdquo;</p>
                      <div className="flex items-center gap-1 text-[11px] text-blue-600">
                        <Paperclip className="w-3 h-3" />
                        <span>{item.evaluasiPP.lampiranName || 'Lampiran ada'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Penilai: {item.evaluasiPP.namaPenilai}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Menunggu input penilaian dari tim PP.</p>
                  )}
                </div>
              </div>

              {/* Form BMES */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">2. Tim BMES</span>
                    {item.evaluasiBMES ? (
                      <Badge className={item.evaluasiBMES.keputusan === 'LANJUT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {item.evaluasiBMES.keputusan}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Belum Mengisi</Badge>
                    )}
                  </div>
                  {item.evaluasiBMES ? (
                    <div className="space-y-1.5 text-slate-700">
                      <p className="italic bg-slate-50 p-2 rounded">&ldquo;{item.evaluasiBMES.catatan}&rdquo;</p>
                      <div className="flex items-center gap-1 text-[11px] text-blue-600">
                        <Paperclip className="w-3 h-3" />
                        <span>{item.evaluasiBMES.lampiranName || 'Lampiran ada'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Penilai: {item.evaluasiBMES.namaPenilai}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Menunggu input penilaian dari tim BMES.</p>
                  )}
                </div>
              </div>

              {/* Form S&B */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">3. Tim S&B</span>
                    {item.evaluasiSB ? (
                      <Badge className={item.evaluasiSB.keputusan === 'LANJUT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                        {item.evaluasiSB.keputusan}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Belum Mengisi</Badge>
                    )}
                  </div>
                  {item.evaluasiSB ? (
                    <div className="space-y-1.5 text-slate-700">
                      <p className="italic bg-slate-50 p-2 rounded">&ldquo;{item.evaluasiSB.catatan}&rdquo;</p>
                      <div className="flex items-center gap-1 text-[11px] text-blue-600">
                        <Paperclip className="w-3 h-3" />
                        <span>{item.evaluasiSB.lampiranName || 'Lampiran ada'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Penilai: {item.evaluasiSB.namaPenilai}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Menunggu input penilaian dari tim S&B.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RIWAYAT AUDIT */}
        {activeTab === 'history' && (
          <div className="bg-white p-5 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Log Riwayat Persetujuan
            </h4>
            <div className="divide-y divide-slate-100">
              {item.historyLog?.map((log, idx) => (
                <div key={idx} className="py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900">{log.role}</span>
                    {log.namaUser && <span className="text-slate-500"> ({log.namaUser})</span>}
                    <span className="mx-2 text-slate-300">&bull;</span>
                    <Badge variant="outline" className="text-[10px] py-0">{log.action}</Badge>
                    {log.catatan && <p className="text-slate-600 mt-0.5">{log.catatan}</p>}
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">{log.tanggal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODUL AKSI RE-ENTRY NON-DEADLOCK (JIKA TIDAK LANJUT / DITOLAK REG MGR) */}
        {(item.status === 'TRIAL_EVALUASI_TIDAK_LANJUT' || item.status === 'TRIAL_DITOLAK_REG_MGR') && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-bold uppercase tracking-wide">
                Aksi Lanjutan (Kebijakan Non-Deadlock: Item Tidak Dikunci)
              </h4>
            </div>
            <p className="text-xs text-amber-800">
              Item ini tidak dikunci mati. Anda dapat mengajukan periode trial baru, meneruskan langsung ke penetapan master, atau mengajukan kembali perbaikan.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={() => {
                  reEntry(item.id, 'RE_TRIAL');
                  alert('Item diajukan untuk periode trial babak baru.');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8"
              >
                Ajukan Trial Kembali
              </Button>

              <Button
                onClick={() => {
                  reEntry(item.id, 'DIRECT_MASTER');
                  alert('Item diteruskan langsung ke penetapan akhir Master Harga.');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
              >
                Ajukan Langsung ke Master
              </Button>

              <Button
                onClick={() => {
                  reEntry(item.id, 'RESUBMIT');
                  alert('Item diperbaiki dan diajukan kembali ke alur pengajuan.');
                }}
                variant="outline"
                className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs font-semibold h-8"
              >
                Ajukan Kembali / Resubmit
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* BILAH AKSI KONTEKSTUAL BAWAH LAYAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 py-3 px-4 sm:px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Status saat ini: </span>
            <strong className="text-slate-800">{statusMeta.label}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Aksi PP Manager */}
            {item.status === 'TRIAL_PENDING_PP_MGR' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRevisi('PP')}
                  className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Minta Revisi
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Setujui Pengajuan
                </Button>
              </>
            )}

            {/* Aksi B&M General Manager */}
            {item.status === 'TRIAL_PENDING_BM_GM' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRevisi('BMGM')}
                  className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Minta Revisi
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Setujui Pengajuan
                </Button>
              </>
            )}

            {/* Aksi S&B Specialist */}
            {(item.status === 'TRIAL_PENDING_SB_CONFIG' || item.status === 'TRIAL_REVISI_SB') && (
              <Link
                href={`/prototipe-trial/sb-specialist`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Buka Form Konfigurasi Harga S&B</span>
              </Link>
            )}

            {/* Aksi Regional Manager: Konfigurasi Harga */}
            {item.status === 'TRIAL_PENDING_BM_REG_CONFIG' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRevisi('REG_MGR_CONFIG')}
                  className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Minta Revisi S&B
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Setujui Harga & Terbitkan Dokumen
                </Button>
              </>
            )}

            {/* Aksi Regional Manager: Penetapan Akhir Master */}
            {item.status === 'TRIAL_PENDING_FINAL_BM_REG' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRevisi('REG_MGR_FINAL')}
                  className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Tolak Penetapan
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Tetapkan Menjadi Master Harga
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Dialog Input Catatan Revisi */}
      {isRevisiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900">Catatan Pengembalian / Revisi</h4>
            <p className="text-xs text-slate-500">
              Tuliskan alasan pengembalian agar tim terkait dapat menyesuaikan data item.
            </p>
            <textarea
              className="w-full h-24 p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Contoh: Estimasi harga perlu disesuaikan dengan kondisi pasar terbaru..."
              value={revisiCatatan}
              onChange={(e) => setRevisiCatatan(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsRevisiModalOpen(false)} className="text-xs">
                Batal
              </Button>
              <Button size="sm" onClick={handleConfirmRevisi} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">
                Kirim Catatan Revisi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
