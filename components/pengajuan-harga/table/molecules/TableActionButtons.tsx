"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';

interface TableActionButtonsProps {
  item: PengajuanHargaItem;
  onViewDetail?: (item: PengajuanHargaItem) => void;
  renderCustomAction?: (item: PengajuanHargaItem) => React.ReactNode;
  className?: string;
}

export function TableActionButtons({
  item,
  onViewDetail,
  renderCustomAction,
  className = "",
}: TableActionButtonsProps) {
  return (
    <div className={`flex items-center justify-center gap-1.5 whitespace-nowrap ${className}`}>
      {/* Primary Detail Action */}
      {onViewDetail && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetail(item)}
          className="h-7 text-[11px] px-2.5 rounded-lg border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold gap-1.5 cursor-pointer shadow-2xs"
          title="Buka rincian lengkap spesifikasi"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Detail</span>
        </Button>
      )}

      {/* Custom Action (Edit Revisi / Approve / Reject, dll.) */}
      {renderCustomAction && renderCustomAction(item)}
    </div>
  );
}
