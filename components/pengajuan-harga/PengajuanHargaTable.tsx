"use client";

import React from 'react';
import { PengajuanHargaItem } from './types';
import { ReusableSpecTable } from './table';

export interface PengajuanHargaTableProps {
  items: PengajuanHargaItem[];
  loading?: boolean;
  onDeleteItem?: (id: string) => void;
  onViewCatatan?: (item: PengajuanHargaItem) => void;
  showCatatanReview?: boolean;
  renderAction?: (item: PengajuanHargaItem) => React.ReactNode;
  showTanggal?: boolean;
  showCabang?: boolean;
  showStatus?: boolean;
  showHarga?: boolean;
  title?: string;
  className?: string;
  onResetFilter?: () => void;
  getDetailHref?: (item: PengajuanHargaItem) => string;
}

export function PengajuanHargaTable({
  items,
  loading = false,
  onViewCatatan,
  showCatatanReview = false,
  renderAction,
  showTanggal = true,
  showCabang = true,
  showStatus = false,
  showHarga = false,
  title = "Daftar Spesifikasi Material",
  className = "",
  onResetFilter,
  getDetailHref,
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
      renderAction={renderAction}
      onResetFilter={onResetFilter}
      className={className}
      getDetailHref={getDetailHref}
    />
  );
}

// Re-export Atomic parts for modular imports elsewhere
export * from './table';
