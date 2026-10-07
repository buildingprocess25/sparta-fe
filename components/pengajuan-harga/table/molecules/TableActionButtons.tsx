"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TableActionButtonsProps {
  item: PengajuanHargaItem;
  detailHref?: string | ((item: PengajuanHargaItem) => string);
  renderCustomAction?: (item: PengajuanHargaItem) => React.ReactNode;
  className?: string;
}

export function TableActionButtons({
  item,
  detailHref,
  renderCustomAction,
  className = "",
}: TableActionButtonsProps) {
  const pathname = usePathname();
  
  // Menentukan href: jika fungsi, panggil dengan item. Jika string, pakai string. Jika undefined, gunakan pathname + id.
  const href = typeof detailHref === 'function' 
    ? detailHref(item) 
    : (detailHref || `${pathname}/${item.id}`);

  return (
    <div className={`flex items-center justify-center gap-1.5 whitespace-nowrap ${className}`}>
      {/* Primary Detail Action */}
      <Link
        href={href}
        className="inline-flex items-center justify-center h-7 text-[11px] px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold gap-1.5 cursor-pointer shadow-2xs transition-colors"
        title="Buka rincian lengkap spesifikasi"
      >
        <Eye className="w-3.5 h-3.5 text-slate-500" />
        <span>Detail</span>
      </Link>

      {/* Custom Action (Edit Revisi / Approve / Reject, dll.) */}
      {renderCustomAction && renderCustomAction(item)}
    </div>
  );
}
