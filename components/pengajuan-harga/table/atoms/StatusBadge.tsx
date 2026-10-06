"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status?: string;
  isTrial?: boolean;
  className?: string;
}

export function StatusBadge({ status, isTrial = false, className = "" }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-white text-sm font-semibold tracking-wide shadow-sm select-none leading-snug whitespace-normal text-center";

  switch (status) {
    // 1. Status Disetujui
    case 'DISETUJUI':
    case 'DISETUJUI_MASTERING':
    case 'APPROVED_ACTIVE':
    case 'RELEASED':
      return (
        <span className={cn(baseClasses, "bg-emerald-600", className)}>
          Disetujui
        </span>
      );

    // 2. Siap Survei BC
    case 'SIAP_SURVEI':
      return (
        <span className={cn(baseClasses, "bg-sky-600", className)}>
          Siap Survei
        </span>
      );

    // 3. Jalur Uji Coba (Trial 3 Bulan)
    case 'TRIAL_RELEASED':
      return (
        <span className={cn(baseClasses, "bg-indigo-600", className)}>
          (Trial) Aktif
        </span>
      );

    case 'TRIAL_PENDING_REGIONAL_MGR':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          (Trial) Menunggu Reg. Mgr
        </span>
      );

    case 'TRIAL_PROMOSI_BM_MGR':
    case 'TRIAL_PROMOSI_REGIONAL_MGR':
    case 'TRIAL_PROMOSI_KONTRAKTOR':
      return (
        <span className={cn(baseClasses, "bg-purple-600", className)}>
          Evaluasi Trial
        </span>
      );

    case 'TRIAL_REVISI':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          (Trial) Revisi Trial
        </span>
      );

    case 'TRIAL_DITOLAK':
      return (
        <span className={cn(baseClasses, "bg-rose-600", className)}>
          (Trial) Ditolak
        </span>
      );

    // 4. Status Ditolak
    case 'DITOLAK':
    case 'DITOLAK_SB':
    case 'RETURNED_TO_BC':
      return (
        <span className={cn(baseClasses, "bg-rose-600", className)}>
          Ditolak
        </span>
      );

    // 5. Status Perlu Revisi
    case 'REVISI':
    case 'PERLU_REVISI':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Perlu Revisi
        </span>
      );

    // 6. Status Pending / Dalam Proses Review
    case 'PENDING_VALIDASI_SB':
    case 'PENDING_SB_SPECIALIST':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Menunggu S&amp;B
        </span>
      );

    case 'PENDING_BM_MGR':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Menunggu B&amp;M Mgr
        </span>
      );

    case 'PENDING_REGIONAL_MGR':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Menunggu Reg. Mgr
        </span>
      );

    case 'PENDING_KONTRAKTOR':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Menunggu Kontraktor
        </span>
      );

    case 'DIAJUKAN':
      return (
        <span className={cn(baseClasses, "bg-amber-600", className)}>
          Diajukan
        </span>
      );

    default:
      return (
        <span className={cn(baseClasses, "bg-slate-600", className)}>
          {status || 'Draft'}
        </span>
      );
  }
}