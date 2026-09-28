"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Eye,
  FileText,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';

interface TablePengajuanBerjalanProps {
  items: PengajuanHargaItem[];
  title?: string;
  emptyMessage?: string;
  onOpenDetailModal: (item: PengajuanHargaItem) => void;
  onOpenCatatanModal: (item: PengajuanHargaItem) => void;
}

export function TablePengajuanBerjalan({
  items,
  title = 'Pengajuan Berjalan',
  emptyMessage = 'Belum ada data pengajuan',
  onOpenDetailModal,
  onOpenCatatanModal,
}: TablePengajuanBerjalanProps) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING_BM_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu B&amp;M Manager
          </span>
        );
      case 'PENDING_SB_SPECIALIST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-blue-600" />
            Menunggu S&amp;B Specialist
          </span>
        );
      case 'PENDING_REGIONAL_MGR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-indigo-600" />
            Menunggu Regional Manager
          </span>
        );
      case 'PENDING_KONTRAKTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-purple-600" />
            Menunggu Kontraktor
          </span>
        );
      case 'RELEASED':
      case 'APPROVED_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui
          </span>
        );
      case 'RETURNED_TO_BC':
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">
            <RotateCcw className="w-3 h-3 text-rose-600" />
            Dikembalikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status || 'Draft'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>
        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">
          {items.length} Material
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                No
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kode Item
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Material
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Merk &amp; Ukuran
              </th>
              <th className="text-right px-4 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Rata-Rata Harga
              </th>
              <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Survei 3 Toko
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Status
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Catatan
              </th>
              <th className="text-center px-3 py-3 font-bold whitespace-nowrap text-[11px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  <Calculator className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isReturned =
                  item.status === 'RETURNED_TO_BC' || item.status === 'DITOLAK';
                const avgPrice = item.hargaRataRata || item.estimasiHarga || 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="text-center px-3 py-3.5 font-semibold text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {item.kode}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100">
                      <div>{item.item}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {item.kategori} &bull; {item.lokasi}
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                      {item.merk} ({item.ukuran})
                    </td>
                    <td className="text-right px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      <span className="font-mono text-emerald-700 text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        {formatRupiah(avgPrice)}
                      </span>
                    </td>
                    <td className="text-center px-3 py-3.5 border-r border-slate-100 whitespace-nowrap">
                      {item.surveyToko && item.surveyToko.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenDetailModal(item)}
                          className="h-7 text-[11px] px-2.5 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>3 Toko</span>
                        </Button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="text-center px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="text-center px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                      {isReturned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenCatatanModal(item)}
                          className="h-7 text-[11px] px-2 border-rose-200 bg-rose-50 text-rose-800 rounded-lg gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>Catatan</span>
                        </Button>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">-</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-3.5 whitespace-nowrap">
                      <Link href={`/pengajuan-harga/building-coord/${item.id}`}>
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg gap-1 font-semibold cursor-pointer shadow-2xs"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
