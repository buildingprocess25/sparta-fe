"use client";

import React from 'react';
import { PengajuanHargaItem } from './types';
import { ReusableSpecTable } from './table';

export interface PengajuanHargaTableProps {
  items: PengajuanHargaItem[];
  loading?: boolean;
  onDeleteItem?: (id: string) => void;
  onApprove?: (item: PengajuanHargaItem, catatan?: string) => void;
  onReject?: (item: PengajuanHargaItem, catatan: string) => void;
  onRevisi?: (item: PengajuanHargaItem, catatan: string, revisiFields: string[]) => void;
  onManageKoefisien?: (item: PengajuanHargaItem) => void;
  onViewCatatan?: (item: PengajuanHargaItem) => void;
  showCatatanReview?: boolean;
  renderAction?: (item: PengajuanHargaItem) => React.ReactNode;
  showTanggal?: boolean;
  showCabang?: boolean;
  showStatus?: boolean;
  showHarga?: boolean;
  title?: string;
  className?: string;
  onEditItem?: (item: PengajuanHargaItem) => void;
  onViewDetail?: (item: PengajuanHargaItem) => void;
  onResetFilter?: () => void;
  onReviewSurvei?: (item: PengajuanHargaItem) => void;
  onIsiSurvei?: (item: PengajuanHargaItem) => void;
}

export function PengajuanHargaTable({
  items,
  loading = false,
  onDeleteItem,
  onApprove,
  onReject,
  onRevisi,
  onManageKoefisien,
  onViewCatatan,
  showCatatanReview = false,
  renderAction,
  showTanggal = true,
  showCabang = true,
  showStatus = false,
  showHarga = false,
  title = "Daftar Spesifikasi Material",
  className = "",
  onEditItem,
  onViewDetail,
  onResetFilter,
  onReviewSurvei,
  onIsiSurvei,
}: PengajuanHargaTableProps) {
  return (
    <ReusableSpecTable
      items={items}
      loading={loading}
      title={title}
      showTanggal={showTanggal}
      showCabang={showCabang}
      showStatus={showStatus}
      showHarga={showHarga}
      showCatatanReview={showCatatanReview}
      onViewCatatan={onViewCatatan}
      onEditItem={onEditItem}
      onApprove={onApprove}
      onReject={onReject}
      onRevisi={onRevisi}
      onManageKoefisien={onManageKoefisien}
      onIsiSurvei={onIsiSurvei}
      onViewDetail={onViewDetail}
      onReviewSurvei={onReviewSurvei}
      renderAction={renderAction}
      onResetFilter={onResetFilter}
      className={className}
    />
  );
}

// Re-export Atomic parts for modular imports elsewhere
export * from './table';
