"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '../atoms/StatusBadge';
import { PriceCell } from '../atoms/PriceCell';
import { CodeBadge } from '../atoms/CodeBadge';
import { PengajuanHargaItem, ApprovalLog, DAFTAR_FIELD_SPESIFIKASI } from '@/components/pengajuan-harga/types';
import { DetailSpesifikasi } from '@/components/pengajuan-harga/DetailSpesifikasi';
import { RingkasanBiayaMaterial } from '@/components/pengajuan-harga/RingkasanBiayaMaterial';
import { PengajuanTimelineBar } from '@/components/pengajuan-harga/PengajuanTimelineBar';
import Link from 'next/link';
import {
  Layers,
  FileText,
  AlertTriangle,
  Pencil,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Store,
  DollarSign,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  SlidersHorizontal,
  ClipboardCheck,
} from 'lucide-react';

type ActiveAction = 'none' | 'approve' | 'revisi' | 'reject';

interface RevisiEntry {
  id: string;
  field: string;
  catatan: string;
}

export interface DetailSpesifikasiModalProps {
  item: PengajuanHargaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEditItem?: (item: PengajuanHargaItem) => void;
  onApprove?: (item: PengajuanHargaItem, catatan?: string) => void;
  onRevisi?: (item: PengajuanHargaItem, catatan: string, revisiFields: string[]) => void;
  onReject?: (item: PengajuanHargaItem, catatan: string) => void;
  onManageKoefisien?: (item: PengajuanHargaItem) => void;
  onIsiSurvei?: (item: PengajuanHargaItem) => void;
  onReviewSurvei?: (item: PengajuanHargaItem) => void;
}

export function DetailSpesifikasiModal({
  item,
  isOpen,
  onClose,
  onEditItem,
  onApprove,
  onRevisi,
  onReject,
  onManageKoefisien,
  onIsiSurvei,
  onReviewSurvei,
}: DetailSpesifikasiModalProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction>('none');

  // State untuk Persetujuan
  const [catatanApprove, setCatatanApprove] = useState('');

  // State untuk Revisi (Daftar bagian & catatan dinamis)
  const [revisiEntries, setRevisiEntries] = useState<RevisiEntry[]>([]);
  const [revisiError, setRevisiError] = useState('');

  // State untuk Tolak
  const [catatanReject, setCatatanReject] = useState('');
  const [rejectError, setRejectError] = useState('');

  const actionSectionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && item) {
      setActiveAction('none');
      setCatatanApprove('');
      setCatatanReject('');
      setRejectError('');
      setRevisiError('');

      if (item.revisiFields && item.revisiFields.length > 0) {
        setRevisiEntries(
          item.revisiFields.map((fId, index) => ({
            id: `rev-${index}-${Date.now()}`,
            field: fId,
            catatan: '',
          }))
        );
      } else {
        setRevisiEntries([]);
      }
    }
  }, [isOpen, item]);

  React.useEffect(() => {
    if (activeAction !== 'none' && actionSectionRef.current) {
      actionSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeAction]);

  const handleAddRevisiEntry = () => {
    const usedFields = revisiEntries.map(e => e.field);
    const availableField = DAFTAR_FIELD_SPESIFIKASI.find(f => !usedFields.includes(f.id));

    setRevisiEntries(prev => [
      ...prev,
      {
        id: `rev-${Date.now()}-${Math.random()}`,
        field: availableField ? availableField.id : '',
        catatan: '',
      },
    ]);
    setRevisiError('');
  };

  const handleUpdateRevisiEntry = (id: string, key: 'field' | 'catatan', value: string) => {
    setRevisiEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, [key]: value } : entry))
    );
    if (revisiError) setRevisiError('');
  };

  const handleRemoveRevisiEntry = (id: string) => {
    setRevisiEntries(prev => prev.filter(entry => entry.id !== id));
    if (revisiError) setRevisiError('');
  };

  const handleConfirmApproveInline = () => {
    if (!item || !onApprove) return;
    onApprove(item, catatanApprove.trim());
    onClose();
  };

  const handleConfirmRevisiInline = () => {
    if (!item || !onRevisi) return;

    if (revisiEntries.length === 0) {
      setRevisiError('Tambahkan minimal 1 bagian yang ingin direvisi');
      return;
    }

    const emptyField = revisiEntries.some(e => !e.field);
    if (emptyField) {
      setRevisiError('Pilih bagian spesifikasi untuk semua baris revisi');
      return;
    }

    const emptyCatatan = revisiEntries.some(e => !e.catatan.trim());
    if (emptyCatatan) {
      setRevisiError('Isi catatan perbaikan untuk setiap bagian yang dipilih');
      return;
    }

    const revisiFields = Array.from(new Set(revisiEntries.map(e => e.field)));
    const catatanCombined = revisiEntries
      .map(e => {
        const fieldDef = DAFTAR_FIELD_SPESIFIKASI.find(f => f.id === e.field);
        const label = fieldDef?.label || e.field;
        return `• ${label}: ${e.catatan.trim()}`;
      })
      .join('\n');

    onRevisi(item, catatanCombined, revisiFields);
    onClose();
  };

  const handleConfirmRejectInline = () => {
    if (!item || !onReject) return;
    if (!catatanReject.trim()) {
      setRejectError('Alasan penolakan wajib diisi');
      return;
    }
    onReject(item, catatanReject.trim());
    onClose();
  };

  if (!item) return null;

  const isPending =
    item.status === 'DIAJUKAN' ||
    item.status === 'PENDING_VALIDASI_SB';

  const isApproved =
    item.status === 'DISETUJUI' ||
    item.status === 'DISETUJUI_MASTERING' ||
    item.status === 'APPROVED_ACTIVE' ||
    item.status === 'RELEASED';

  const isRevisi =
    item.status === 'REVISI' ||
    item.status === 'PERLU_REVISI' ||
    item.status === 'TRIAL_REVISI';

  const isDitolak =
    item.status === 'DITOLAK' ||
    item.status === 'DITOLAK_SB' ||
    item.status === 'TRIAL_DITOLAK' ||
    item.status === 'RETURNED_TO_BC';

  const handleEditClick = () => {
    onClose();
    if (onEditItem) {
      onEditItem(item);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-slate-200">
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-slate-50/90 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100/70 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {item.item}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                    {item.kode}
                  </span>
                  {item.kodeMaster && (
                    <span className="text-[11px] font-mono text-slate-500">
                      • {item.kodeMaster}
                    </span>
                  )}
                  {item.cabang && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      Cabang {item.cabang}
                    </span>
                  )}
                  {item.tanggalPengajuan && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {item.tanggalPengajuan}
                    </span>
                  )}
                  {item.isTrial && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      Uji Coba
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <StatusBadge status={item.status} isTrial={item.isTrial} />
            </div>
          </div>
          <DialogDescription className="sr-only">
            Rincian spesifikasi material {item.item}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Bar Timeline Alur Pengajuan */}
          <PengajuanTimelineBar item={item} />

          {/* Banner Peringatan Revisi */}
          {isRevisi && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                    Catatan Review S&amp;B Specialist
                  </h4>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                    {item.catatanReview ||
                      'Spesifikasi ini membutuhkan penyesuaian sebelum dapat diproses lebih lanjut.'}
                  </p>
                  {item.revisiFields && item.revisiFields.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-amber-200/80">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                        Bagian yang perlu diperbaiki:
                      </span>
                      {item.revisiFields.map(fId => {
                        const fieldDef = DAFTAR_FIELD_SPESIFIKASI.find(d => d.id === fId);
                        return (
                          <span
                            key={fId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300"
                          >
                            {fieldDef?.label || fId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {onEditItem && (
                <Button
                  size="sm"
                  onClick={handleEditClick}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Revisi Spesifikasi</span>
                </Button>
              )}
            </div>
          )}

          {/* Banner Peringatan Ditolak */}
          {isDitolak && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                  Pengajuan Ditolak
                </h4>
                <p className="text-rose-800 text-xs mt-1 leading-relaxed">
                  {item.catatanReview || 'Pengajuan material ini ditolak dan tidak dapat diproses lebih lanjut.'}
                </p>
              </div>
            </div>
          )}

          {/* Spesifikasi Material menggunakan DetailSpesifikasi */}
          <DetailSpesifikasi
            item={item}
            showHeader={false}
            showCodes={false}
            showDeskripsi={true}
            className="border-0 shadow-none p-0 rounded-none bg-transparent"
          />

          {/* Panel Persetujuan (Aktif saat S&B Specialist klik Setujui) */}
          {activeAction === 'approve' && (
            <div
              ref={actionSectionRef}
              className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 space-y-3 shadow-2xs scroll-mt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
                    Persetujuan Spesifikasi Material
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Spesifikasi material akan disetujui dan dialihkan ke tahap penetapan koefisien toko.
                  </p>
                </div>
              </div>

              {/* Catatan Persetujuan */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Catatan Persetujuan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={catatanApprove}
                  onChange={e => setCatatanApprove(e.target.value)}
                  placeholder="Tuliskan catatan persetujuan jika ada..."
                  rows={2}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Panel Input Revisi (Aktif saat S&B Specialist klik Minta Revisi) */}
          {activeAction === 'revisi' && (
            <div
              ref={actionSectionRef}
              className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3.5 shadow-2xs scroll-mt-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                      Catatan Revisi
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Tambahkan bagian yang perlu diperbaiki beserta petunjuknya.
                    </p>
                  </div>
                </div>
                {revisiEntries.length > 0 && (
                  <span className="text-[11px] font-semibold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                    {revisiEntries.length} Bagian
                  </span>
                )}
              </div>

              {/* Daftar Baris Revisi */}
              <div className="space-y-2.5">
                {revisiEntries.length === 0 ? (
                  <div className="bg-white/80 border border-dashed border-amber-300 rounded-xl p-4 text-center">
                    <p className="text-xs text-amber-800 mb-2.5">
                      Belum ada bagian spesifikasi yang dipilih untuk direvisi.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRevisiEntry}
                      className="text-xs font-semibold h-8 px-3 rounded-lg bg-white border-amber-300 text-amber-900 hover:bg-amber-100/70 cursor-pointer shadow-2xs"
                    >
                      + Tambah bagian yang ingin direvisi
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {revisiEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="bg-white p-3 rounded-xl border border-amber-200/90 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 max-w-xs">
                            <label className="text-[10px] font-bold text-slate-700 block mb-1">
                              Bagian Spesifikasi <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={entry.field}
                              onChange={e => handleUpdateRevisiEntry(entry.id, 'field', e.target.value)}
                              className="w-full h-8 text-xs rounded-lg border border-slate-300 bg-white px-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                            >
                              <option value="" disabled>Pilih spesifikasi...</option>
                              {DAFTAR_FIELD_SPESIFIKASI.map(f => {
                                const isUsedElsewhere = revisiEntries.some(
                                  e => e.id !== entry.id && e.field === f.id
                                );
                                return (
                                  <option key={f.id} value={f.id} disabled={isUsedElsewhere}>
                                    {f.label} {isUsedElsewhere ? '(sudah dipilih)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRevisiEntry(entry.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer self-end mb-0.5"
                          >
                            Hapus
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Catatan Perbaikan <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={entry.catatan}
                            onChange={e => handleUpdateRevisiEntry(entry.id, 'catatan', e.target.value)}
                            placeholder="Tuliskan petunjuk perbaikan untuk bagian ini..."
                            className="w-full h-8 text-xs rounded-lg border border-slate-300 bg-white px-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Tombol Tambah Bagian Lain */}
                    {revisiEntries.length < DAFTAR_FIELD_SPESIFIKASI.length && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddRevisiEntry}
                        className="w-full text-xs font-semibold h-8 rounded-lg border-dashed border-amber-300 text-amber-900 bg-amber-100/40 hover:bg-amber-100 cursor-pointer"
                      >
                        + Tambah bagian yang ingin direvisi
                      </Button>
                    )}
                  </div>
                )}

                {revisiError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {revisiError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Panel Penolakan (Aktif saat S&B Specialist klik Tolak) */}
          {activeAction === 'reject' && (
            <div
              ref={actionSectionRef}
              className="bg-rose-50/90 border border-rose-300 rounded-xl p-4 space-y-3 shadow-2xs scroll-mt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-950 text-xs uppercase tracking-wider">
                    Tolak Permohonan Spesifikasi
                  </h4>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Permohonan spesifikasi material ini akan ditolak dan tidak dapat diproses lebih lanjut.
                  </p>
                </div>
              </div>

              {/* Alasan Penolakan */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={catatanReject}
                  onChange={e => {
                    setCatatanReject(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder="Tuliskan alasan penolakan..."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 placeholder:text-slate-400"
                />
                {rejectError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {rejectError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. Informasi Harga Satuan */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span>Informasi Harga Satuan</span>
            </h3>
            {item.hargaRataRata && item.hargaRataRata > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Harga Rata-rata Survei Toko</span>
                    <PriceCell price={item.hargaRataRata}/>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Status Harga</span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {item.status === 'PENDING_BM_MGR'
                        ? 'Telah Disurvei BC (Menunggu Review B&M Manager)'
                        : item.status === 'PENDING_SB_SPECIALIST'
                        ? 'Menunggu Review S&B Specialist'
                        : item.status === 'PENDING_REGIONAL_MGR'
                        ? 'Menunggu Review Regional Manager'
                        : item.status === 'PENDING_KONTRAKTOR'
                        ? 'Menunggu Kesepakatan Kontraktor'
                        : item.status === 'RELEASED' || item.status === 'APPROVED_ACTIVE'
                        ? 'Harga Telah Disepakati & Rilis'
                        : 'Telah Disurvei oleh BC'}
                    </span>
                  </div>
                </div>

                {item.koefisienMaterialItems && item.koefisienMaterialItems.length > 0 && (
                  <RingkasanBiayaMaterial
                    materialItems={item.koefisienMaterialItems}
                    totalBiayaMaterial={item.hargaRataRata || item.estimasiHarga || 0}
                    marginMaterial={item?.marginMaterial}
                  />
                )}

                {/* Ringkasan Disparitas Harga Antar Cabang */}
                {item.hargaPerCabang && item.hargaPerCabang.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cabang Aktif</span>
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {item.hargaPerCabang.filter((c) => c.status === 'AKTIF').length} Cabang Aktif
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {item.hargaPerCabang.map((b) => {
                        const isActive = b.status === 'AKTIF';
                        return (
                          <div
                            key={b.cabang}
                            className={`p-2 rounded-lg border ${
                              isActive
                                ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                                : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px]">Cabang {b.cabang}</span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              />
                            </div>
                            <div className="mt-1 font-mono font-bold text-xs text-slate-900">
                              {isActive
                                ? `Rp ${(b.harga || 0).toLocaleString('id-ID')}`
                                : 'Nonaktif'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <span>Belum ada penetapan harga. Harga akan ditentukan melalui survei pasar oleh Building Coordinator (BC) setelah spesifikasi disetujui S&amp;B.</span>
              </div>
            )}
          </div>

          {/* 4. Riwayat Perubahan (Accordion) */}
          <Accordion type="single" collapsible className="w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70 shadow-2xs">
            <AccordionItem value="riwayat-perubahan" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Riwayat Perubahan
                  </span>
                  {item.historyLog && item.historyLog.length > 0 && (
                    <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full ml-1">
                      {item.historyLog.length} Catatan
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-1">
                {item.historyLog && item.historyLog.length > 0 ? (
                  <div className="space-y-2.5 divide-y divide-slate-200/70">
                    {item.historyLog.map((log: ApprovalLog, index: number) => (
                      <div key={index} className="flex items-start gap-3 pt-2.5 first:pt-0">
                        <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800 text-xs">{log.role}</span>
                            <span className="text-[10px] font-mono text-slate-400">{log.tanggal}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            <span className="font-medium text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px] mr-1.5 font-mono">
                              [{log.action}]
                            </span>
                            {log.catatan || '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic py-1">
                    Belum ada riwayat perubahan tercatat untuk material ini.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {activeAction === 'approve' && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAction('none')}
                className="rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmApproveInline}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <span>Setujui &amp; Lanjut Input Koefisien</span>
              </Button>
            </div>
          )}

          {activeAction === 'revisi' && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveAction('none');
                  setRevisiError('');
                }}
                className="rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRevisiInline}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <span>Kirim Revisi</span>
              </Button>
            </div>
          )}

          {activeAction === 'reject' && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveAction('none');
                  setRejectError('');
                }}
                className="rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRejectInline}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <span>Konfirmasi Tolak</span>
              </Button>
            </div>
          )}

          {activeAction === 'none' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs h-9 px-4 border-slate-200 cursor-pointer order-last sm:order-first"
              >
                Tutup
              </Button>

              {/* S&B Specialist Action: Pending Validasi */}
              {isPending && (onApprove || onRevisi || onReject) && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {onReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveAction('reject')}
                      className="rounded-xl text-xs h-9 px-3.5 border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer shadow-2xs"
                      title="Tolak permohonan spesifikasi material"
                    >
                      <span>Tolak</span>
                    </Button>
                  )}

                  {onRevisi && (
                    <Button
                      size="sm"
                      onClick={() => setActiveAction('revisi')}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-3.5 font-semibold shadow-2xs cursor-pointer"
                      title="Kembalikan ke B&M Manager untuk direvisi"
                    >
                      <span>Minta Revisi</span>
                    </Button>
                  )}

                  {onApprove && (
                    <Button
                      size="sm"
                      onClick={() => setActiveAction('approve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-3.5 font-semibold shadow-2xs cursor-pointer"
                      title="Setujui spesifikasi material"
                    >
                      <span>Setujui Spesifikasi</span>
                    </Button>
                  )}
                </div>
              )}

              {/* S&B Specialist Action: Disetujui -> Kelola Koefisien */}
              {isApproved && onManageKoefisien && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onManageKoefisien(item);
                  }}
                  className="bg-[#005faa] hover:bg-[#004f8f] text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer"
                >
                  <span>Kelola Koefisien</span>
                </Button>
              )}

              {/* B&M Manager Action: Revisi Spesifikasi */}
              {isRevisi && onEditItem && (
                <Button
                  size="sm"
                  onClick={handleEditClick}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer"
                >
                  <span>Revisi Spesifikasi</span>
                </Button>
              )}

              {/* Building Coordinator Action: Isi Survei / Revisi Survei */}
              {onIsiSurvei && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onIsiSurvei(item);
                  }}
                  className={`rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer text-white ${
                    item.status === 'RETURNED_TO_BC' || item.status === 'DITOLAK'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <span>
                    {item.status === 'RETURNED_TO_BC' || item.status === 'DITOLAK'
                      ? 'Revisi Survei'
                      : 'Isi Survei'}
                  </span>
                </Button>
              )}

              {/* Tombol Review Survei / Konfirmasi Harga di Halaman Khusus */}
              {(item.status === 'PENDING_BM_MGR' ||
                item.status === 'PENDING_SB_SPECIALIST' ||
                item.status === 'PENDING_REGIONAL_MGR' ||
                item.status === 'PENDING_KONTRAKTOR') && (
                <Link
                  href={`/pengajuan-harga/review/survei/${item.id}?from=${
                    item.status === 'PENDING_BM_MGR'
                      ? 'bm-manager'
                      : item.status === 'PENDING_SB_SPECIALIST'
                      ? 'sb-specialist'
                      : item.status === 'PENDING_REGIONAL_MGR'
                      ? 'regional-manager'
                      : 'kontraktor'
                  }`}
                  onClick={onClose}
                >
                  <Button
                    size="sm"
                    className={`rounded-xl text-xs h-9 px-4 font-semibold shadow-2xs cursor-pointer gap-1.5 text-white ${
                      item.status === 'PENDING_BM_MGR'
                        ? 'bg-red-600 hover:bg-red-700'
                        : item.status === 'PENDING_SB_SPECIALIST'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : item.status === 'PENDING_REGIONAL_MGR'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>
                      {item.status === 'PENDING_KONTRAKTOR'
                        ? 'Konfirmasi Harga'
                        : 'Review Survei'}
                    </span>
                  </Button>
                </Link>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
