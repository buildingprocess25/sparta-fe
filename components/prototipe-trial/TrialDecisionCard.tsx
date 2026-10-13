// =============================================================================
// components/prototipe-trial/TrialDecisionCard.tsx
// Komponen Formulir Keputusan & Catatan Peninjauan Inline di Dalam Halaman
// Menggantikan modal popup agar reviewer leluasa scroll dokumen sambil mencatat
// Desain: Anti-Slop Industrial Clean, Tombol Solid Pastel (Tanpa Outline/Transparan)
// =============================================================================

"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  XCircle,
  Info,
} from 'lucide-react';

export interface TrialDecisionCardProps {
  id?: string;
  roleBadge: string;
  itemKode: string;
  activeMode: 'APPROVE' | 'REVISE';
  onModeChange: (mode: 'APPROVE' | 'REVISE') => void;
  // Opsi Approve / Persetujuan
  approveTitle?: string;
  approveDescription: string;
  approveNote: string;
  onApproveNoteChange: (val: string) => void;
  approveButtonText?: string;
  onApproveSubmit: () => void;
  // Opsi Revise / Tolak
  reviseTitle?: string;
  reviseDescription: string;
  reviseNote: string;
  onReviseNoteChange: (val: string) => void;
  reviseError?: string;
  reviseButtonText?: string;
  onReviseSubmit: () => void;
  reviseTone?: 'amber' | 'rose';
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function TrialDecisionCard({
  id = 'keputusan-section',
  roleBadge,
  itemKode,
  activeMode,
  onModeChange,
  approveTitle = 'Setujui',
  approveDescription,
  approveNote,
  onApproveNoteChange,
  approveButtonText = 'Setujui Pengajuan',
  onApproveSubmit,
  reviseTitle = 'Revisi',
  reviseDescription,
  reviseNote,
  onReviseNoteChange,
  reviseError,
  reviseButtonText = 'Kirim Revisi',
  onReviseSubmit,
  reviseTone = 'amber',
  textareaRef,
}: TrialDecisionCardProps) {
  const isApprove = activeMode === 'APPROVE';

  const reviseActiveClass =
    reviseTone === 'rose'
      ? 'bg-rose-200 text-rose-950 ring-2 ring-rose-400 font-bold'
      : 'bg-amber-200 text-amber-950 ring-2 ring-amber-400 font-bold';

  const reviseSubmitBtnClass =
    reviseTone === 'rose'
      ? 'bg-rose-200 hover:bg-rose-300 active:bg-rose-400 text-rose-950 font-semibold border-0'
      : 'bg-amber-200 hover:bg-amber-300 active:bg-amber-400 text-amber-950 font-semibold border-0';

  const ReviseIcon = reviseTone === 'rose' ? XCircle : RotateCcw;

  return (
    <Card
      id={id}
      className="scroll-mt-24 border border-slate-200/90 bg-white rounded-2xl shadow-2xs font-sans text-slate-800 transition-all overflow-hidden"
    >
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Keputusan & Catatan Peninjauan
            </CardTitle>
          </div>
        </div>

        <Badge
          variant="outline"
          className="w-fit text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200 px-2.5 py-1 rounded-lg"
        >
          Peran: {roleBadge}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Segmented Aksi: Setujui vs Revisi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Pilih Keputusan:
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onModeChange('APPROVE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                isApprove
                  ? 'bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400 font-bold shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <span>{approveTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('REVISE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                !isApprove
                  ? `${reviseActiveClass} shadow-xs`
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
              }`}
            >
              <ReviseIcon className={`w-4 h-4 ${reviseTone === 'rose' ? 'text-rose-800' : 'text-amber-800'}`} />
              <span>{reviseTitle}</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Konsekuensi Alur */}
        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            isApprove
              ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
              : reviseTone === 'rose'
              ? 'bg-rose-50/70 border-rose-100 text-rose-950'
              : 'bg-amber-50/70 border-amber-100 text-amber-950'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
          <div>{isApprove ? approveDescription : reviseDescription}</div>
        </div>

        {/* Form Catatan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              {isApprove ? (
                'Catatan Persetujuan (Opsional)'
              ) : (
                <span>
                  Catatan {reviseTitle} <span className="text-red-500">*</span>
                </span>
              )}
            </label>
          </div>

          <Textarea
            ref={textareaRef}
            value={isApprove ? approveNote : reviseNote}
            onChange={(e) => {
              if (isApprove) {
                onApproveNoteChange(e.target.value);
              } else {
                onReviseNoteChange(e.target.value);
              }
            }}
            placeholder={
              isApprove
                ? 'Tuliskan catatan arahan persetujuan manajerial jika ada...'
                : `Tuliskan rincian bagian atau spesifikasi yang perlu di-${reviseTitle.toLowerCase()}...`
            }
            className="text-xs min-h-[95px] rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-0 leading-relaxed bg-white"
          />

          {!isApprove && reviseError && (
            <p className="text-[11px] text-red-600 font-semibold mt-1">
              {reviseError}
            </p>
          )}
        </div>

        {/* Tombol Eksekusi Solid Pastel */}
        <div className="flex items-center justify-end pt-2">
          {isApprove ? (
            <Button
              type="button"
              onClick={onApproveSubmit}
              className="bg-emerald-200 hover:bg-emerald-300 active:bg-emerald-400 text-emerald-950 font-semibold px-5 py-2.5 rounded-xl text-xs gap-2 shadow-2xs transition-colors border-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-900" />
              <span>{approveButtonText}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onReviseSubmit}
              className={`${reviseSubmitBtnClass} px-5 py-2.5 rounded-xl text-xs gap-2 shadow-2xs transition-colors cursor-pointer`}
            >
              <ReviseIcon className="w-4 h-4" />
              <span>{reviseButtonText}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
