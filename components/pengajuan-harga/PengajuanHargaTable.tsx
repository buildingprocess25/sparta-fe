"use client";

import React from 'react';
import { PengajuanHargaItem } from './types';
import { CheckCircle2, RotateCcw, Clock, XCircle, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PengajuanHargaTableProps {
  items: PengajuanHargaItem[];
  loading?: boolean;
  onDeleteItem?: (id: string) => void;
  onApprove?: (item: PengajuanHargaItem) => void;
  onReject?: (item: PengajuanHargaItem) => void;
  onViewCatatan?: (item: PengajuanHargaItem) => void;
  showCatatanReview?: boolean;
  renderAction?: (item: PengajuanHargaItem) => React.ReactNode;
  showStatus?: boolean;
  showHarga?: boolean;
  title?: string;
  className?: string;
}

export function PengajuanHargaTable({
  items,
  loading = false,
  onDeleteItem,
  onApprove,
  onReject,
  onViewCatatan,
  showCatatanReview = false,
  renderAction,
  showStatus = false,
  showHarga = false,
  title = "Daftar Spesifikasi Material",
  className = "",
}: PengajuanHargaTableProps) {
  const hasActions = Boolean(onApprove || onReject || renderAction);

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'DIAJUKAN':
      case 'PENDING_VALIDASI_SB':
      case 'PENDING_BM_MGR':
      case 'PENDING_SB_SPECIALIST':
      case 'PENDING_REGIONAL_MGR':
      case 'PENDING_KONTRAKTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600" />
            Diajukan
          </span>
        );
      case 'DISETUJUI':
      case 'DISETUJUI_MASTERING':
      case 'APPROVED_ACTIVE':
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui
          </span>
        );
      case 'DITOLAK':
      case 'DITOLAK_SB':
      case 'RETURNED_TO_BC':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">
            <XCircle className="w-3 h-3 text-rose-600" />
            Ditolak
          </span>
        );
      case 'REVISI':
      case 'PERLU_REVISI':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            {status || 'Draft'}
          </span>
        );
    }
  };

  // Base col count: 14 + (showStatus ? 1 : 0) + (showCatatanReview ? 1 : 0) + (showHarga ? 1 : 0) + (hasActions ? 1 : 0)
  const totalCols = 14 + (showStatus ? 1 : 0) + (showCatatanReview ? 1 : 0) + (showHarga ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
      {/* Table Card Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm font-bold text-slate-900 tracking-wide">
            {title}
          </span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold">
            {items.length} Material
          </span>
        </div>
      </div>

      {/* Table Container */}
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
              <th className="px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Ukuran
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Merk
              </th>
              <th className="px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Warna
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Tipe
              </th>
              <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Tebal
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Permukaan
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kategori
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Posisi
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Area
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Info Tambahan
              </th>
              <th className="px-4 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] min-w-[260px]">
                Deskripsi Lengkap
              </th>

              {showStatus && (
                <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center">
                  Status
                </th>
              )}

              {showCatatanReview && (
                <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center">
                  Catatan S&amp;B
                </th>
              )}

              {hasActions && (
                <th className="text-center px-3 py-3 font-bold whitespace-nowrap text-[11px]">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-sm">Data tidak ditemukan</p>
                  <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter.</p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="text-center px-3 py-3.5 font-semibold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="text-center px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                    <span className="inline-block bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200 font-mono text-xs">
                      {item.kode}
                    </span>
                  </td>
                  <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100">
                    {item.item}
                  </td>
                  <td className="px-3 py-3.5 border-r border-slate-100 whitespace-nowrap">
                    {item.ukuran}
                  </td>
                  <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                    {item.merk}
                  </td>
                  <td className="px-3 py-3.5 border-r border-slate-100 whitespace-nowrap">
                    {item.warna}
                  </td>
                  <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                    {item.tipe}
                  </td>
                  <td className="text-center px-3 py-3.5 text-slate-500 border-r border-slate-100 whitespace-nowrap">
                    {item.tebal}
                  </td>
                  <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                    {item.permukaan}
                  </td>
                  <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap text-slate-700">
                    {item.kategori}
                  </td>
                  <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                    {item.implementasi}
                  </td>
                  <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap text-slate-700">
                    {item.lokasi}
                  </td>
                  <td className="px-3.5 py-3.5 italic text-slate-500 border-r border-slate-100">
                    {item.informasiTambahan || '-'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-800 text-xs leading-relaxed min-w-[260px] border-r border-slate-100">
                    {item.deskripsiOtomatis}
                  </td>

                
                  {showStatus && (
                    <td className="px-3.5 py-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>
                  )}

                  {showCatatanReview && (
                    <td className="px-3.5 py-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                      {item.status === 'REVISI' ||
                      item.status === 'PERLU_REVISI' ||
                      item.status === 'DITOLAK' ||
                      item.status === 'DITOLAK_SB' ||
                      item.status === 'RETURNED_TO_BC' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCatatan?.(item)}
                          className="h-7 text-[11px] px-2.5 border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 rounded-lg gap-1.5 font-medium cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Lihat Catatan</span>
                        </Button>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">-</span>
                      )}
                    </td>
                  )}

                  {hasActions && (
                    <td className="text-center px-3 py-3.5 whitespace-nowrap">
                      {renderAction ? (
                        renderAction(item)
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {onApprove && (
                            <Button
                              size="sm"
                              onClick={() => onApprove(item)}
                              className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Setujui
                            </Button>
                          )}
                          {onReject && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReject(item)}
                              className="h-7 text-[11px] px-2.5 text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg gap-1 font-semibold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Tolak
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
