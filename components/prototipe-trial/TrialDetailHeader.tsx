// =============================================================================
// components/prototipe-trial/TrialDetailHeader.tsx
// Header Terstandarisasi Halaman Detail Prototipe Trial Sparta
// Fitur: Navigasi Balik Dinamis, Status Pill, Meta Kategori, Durasi, & Cabang
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Clock, Calendar, UserCheck } from 'lucide-react';
import { TrialItem, TRIAL_STATUS_MAP } from './types';

interface TrialDetailHeaderProps {
  item: TrialItem;
  backHref: string;
  backLabel: string;
  actionButtons?: React.ReactNode;
}

export function TrialDetailHeader({
  item,
  backHref,
  backLabel,
  actionButtons,
}: TrialDetailHeaderProps) {
  const statusMeta = TRIAL_STATUS_MAP[item.status] || {
    label: item.status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs font-sans text-slate-800">
      {/* Tombol Navigasi Kembali */}
      <div className="mb-3.5">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/50 py-1 px-2.5 rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Baris Utama: Kode, Item, Kategori, Status, & Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {item.kode}
            </span>
            <Badge variant="outline" className="text-xs font-medium bg-slate-50 text-slate-700 border-slate-200">
              {item.kategori}
            </Badge>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor} animate-pulse`} />
              {statusMeta.label}
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-800">
            {item.item}
          </h1>

          {/* Metadata Tambahan */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Cabang: <strong>{item.cabang}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Durasi: <strong>{item.durasiBulan} Bulan ({item.durasiHari} Hari)</strong></span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Diajukan: <strong>{item.tanggalPengajuan}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Inisiator: <strong>{item.makerNama}</strong></span>
            </span>
          </div>
        </div>

        {/* Action Buttons Khusus jika disematkan di Header */}
        {actionButtons && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}
