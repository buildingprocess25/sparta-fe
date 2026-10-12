// =============================================================================
// components/prototipe-trial/TrialTimelineBar.tsx
// Visualisasi Timeline Alur Standar Trial Sparta
// Lugas, Ringkas, Tanpa Teks yang Tidak Perlu
// =============================================================================

"use client";

import React from 'react';
import {
  Check,
  Clock,
  RotateCcw,
  XCircle,
  FlaskConical,
  Award,
} from 'lucide-react';
import { TrialItem, TrialStatus } from './types';

interface TrialTimelineBarProps {
  item: TrialItem;
  className?: string;
  compact?: boolean;
}

interface StepInfo {
  id: string;
  label: string;
  state: 'completed' | 'current' | 'pending' | 'revision' | 'rejected';
}

export function TrialTimelineBar({
  item,
  className = '',
  compact = false,
}: TrialTimelineBarProps) {
  const st: TrialStatus = item.status;

  // Pemetaan State Langkah
  const isDoneMaster = st === 'TRIAL_PROMOTED_MASTER';
  const isRejectReg = st === 'TRIAL_DITOLAK_REG_MGR';
  const isTidakLanjut = st === 'TRIAL_EVALUASI_TIDAK_LANJUT';
  const isRevisiMaker = st === 'TRIAL_REVISI_MAKER';
  const isRevisiSB = st === 'TRIAL_REVISI_SB';

  const steps: StepInfo[] = [
    {
      id: 'step-1',
      label: 'Inisiasi Maker',
      state: 'completed',
    },
    {
      id: 'step-2',
      label: 'Validasi PP Mgr',
      state: [
        'TRIAL_PENDING_BM_GM',
        'TRIAL_PENDING_SB_CONFIG',
        'TRIAL_PENDING_BM_REG_CONFIG',
        'TRIAL_REVISI_SB',
        'TRIAL_AKTIF',
        'TRIAL_EVALUASI_VOTING',
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_EVALUASI_TIDAK_LANJUT',
        'TRIAL_DITOLAK_REG_MGR',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_PENDING_PP_MGR'
        ? 'current'
        : isRevisiMaker
        ? 'revision'
        : 'pending',
    },
    {
      id: 'step-3',
      label: 'Approval BM GM',
      state: [
        'TRIAL_PENDING_SB_CONFIG',
        'TRIAL_PENDING_BM_REG_CONFIG',
        'TRIAL_REVISI_SB',
        'TRIAL_AKTIF',
        'TRIAL_EVALUASI_VOTING',
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_EVALUASI_TIDAK_LANJUT',
        'TRIAL_DITOLAK_REG_MGR',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_PENDING_BM_GM'
        ? 'current'
        : 'pending',
    },
    {
      id: 'step-4',
      label: 'Harga S&B',
      state: [
        'TRIAL_PENDING_BM_REG_CONFIG',
        'TRIAL_AKTIF',
        'TRIAL_EVALUASI_VOTING',
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_EVALUASI_TIDAK_LANJUT',
        'TRIAL_DITOLAK_REG_MGR',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_PENDING_SB_CONFIG'
        ? 'current'
        : isRevisiSB
        ? 'revision'
        : 'pending',
    },
    {
      id: 'step-5',
      label: 'Approval Reg. Mgr',
      state: [
        'TRIAL_AKTIF',
        'TRIAL_EVALUASI_VOTING',
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_EVALUASI_TIDAK_LANJUT',
        'TRIAL_DITOLAK_REG_MGR',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_PENDING_BM_REG_CONFIG'
        ? 'current'
        : isRevisiSB
        ? 'revision'
        : 'pending',
    },
    {
      id: 'step-6',
      label: `Trial Aktif (${item.durasiBulan || 3} Bln)`,
      state: [
        'TRIAL_EVALUASI_VOTING',
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_EVALUASI_TIDAK_LANJUT',
        'TRIAL_DITOLAK_REG_MGR',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_AKTIF'
        ? 'current'
        : 'pending',
    },
    {
      id: 'step-7',
      label: 'Evaluasi Kuorum 2/3',
      state: [
        'TRIAL_PENDING_FINAL_BM_REG',
        'TRIAL_PROMOTED_MASTER',
      ].includes(st)
        ? 'completed'
        : st === 'TRIAL_EVALUASI_VOTING'
        ? 'current'
        : isTidakLanjut
        ? 'rejected'
        : 'pending',
    },
    {
      id: 'step-8',
      label: 'Penetapan Master',
      state: isDoneMaster
        ? 'completed'
        : st === 'TRIAL_PENDING_FINAL_BM_REG'
        ? 'current'
        : isRejectReg
        ? 'rejected'
        : 'pending',
    },
  ];

  return (
    <div className={`p-4 bg-white border border-slate-200 rounded-xl shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Alur Tahapan Trial
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Durasi: <strong className="text-slate-800">{item.durasiBulan || 3} Bulan ({item.durasiHari || 90} Hari)</strong>
        </span>
      </div>

      {/* Stepper Bar Horisontal */}
      <div className="relative flex items-center justify-between overflow-x-auto pb-2 scrollbar-none">
        {/* Garis Penghubung Latar Belakang */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          let nodeBg = 'bg-slate-100 text-slate-400 border-slate-300';
          let icon = <span>{idx + 1}</span>;

          if (step.state === 'completed') {
            nodeBg = 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
            icon = <Check className="w-3.5 h-3.5 stroke-[2.5]" />;
          } else if (step.state === 'current') {
            nodeBg = 'bg-red-600 text-white border-red-600 ring-3 ring-red-100 shadow-xs animate-pulse';
            icon = <Clock className="w-3.5 h-3.5 stroke-[2.5]" />;
          } else if (step.state === 'revision') {
            nodeBg = 'bg-amber-500 text-white border-amber-500 ring-3 ring-amber-100';
            icon = <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />;
          } else if (step.state === 'rejected') {
            nodeBg = 'bg-rose-600 text-white border-rose-600';
            icon = <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />;
          }

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center min-w-[85px] sm:min-w-[95px] text-center px-1"
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${nodeBg}`}
              >
                {icon}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium leading-tight max-w-[90px] ${
                  step.state === 'current'
                    ? 'text-red-700 font-bold'
                    : step.state === 'completed'
                    ? 'text-emerald-700'
                    : step.state === 'revision'
                    ? 'text-amber-700 font-semibold'
                    : step.state === 'rejected'
                    ? 'text-rose-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
