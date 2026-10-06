"use client";

import React, { useState } from 'react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';
import { TableEmptyState } from '../atoms/TableEmptyState';
import { TableLoadingSkeleton } from '../atoms/TableLoadingSkeleton';
import { StatusBadge } from '../atoms/StatusBadge';
import { PriceCell } from '../atoms/PriceCell';
import { CodeBadge } from '../atoms/CodeBadge';
import { MaterialSpecCell } from '../molecules/MaterialSpecCell';
import { CategoryAreaCell } from '../molecules/CategoryAreaCell';
import { DescriptionCell } from '../molecules/DescriptionCell';
import { TableActionButtons } from '../molecules/TableActionButtons';
import { DetailSpesifikasiModal } from './DetailSpesifikasiModal';
import { FileText, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReusableSpecTableProps {
  items: PengajuanHargaItem[];
  loading?: boolean;
  title?: string;
  showTanggal?: boolean;
  showCabang?: boolean;
  showStatus?: boolean;
  showHarga?: boolean;
  showCatatanReview?: boolean;
  onViewCatatan?: (item: PengajuanHargaItem) => void;
  onEditItem?: (item: PengajuanHargaItem) => void;
  onApprove?: (item: PengajuanHargaItem, catatan?: string) => void;
  onReject?: (item: PengajuanHargaItem, catatan: string) => void;
  onRevisi?: (item: PengajuanHargaItem, catatan: string, revisiFields: string[]) => void;
  onManageKoefisien?: (item: PengajuanHargaItem) => void;
  onIsiSurvei?: (item: PengajuanHargaItem) => void;
  onViewDetail?: (item: PengajuanHargaItem) => void;
  onReviewSurvei?: (item: PengajuanHargaItem) => void;
  renderAction?: (item: PengajuanHargaItem) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilter?: () => void;
  className?: string;
}

export function ReusableSpecTable({
  items,
  loading = false,
  title = "Daftar Spesifikasi Material",
  showTanggal = true,
  showCabang = true,
  showStatus = true,
  showHarga = false,
  showCatatanReview = false,
  onViewCatatan,
  onEditItem,
  onApprove,
  onReject,
  onRevisi,
  onManageKoefisien,
  onIsiSurvei,
  onViewDetail,
  onReviewSurvei,
  renderAction,
  emptyTitle,
  emptyDescription,
  onResetFilter,
  className = "",
}: ReusableSpecTableProps) {
  // Internal state for Option A (Detail Modal)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<PengajuanHargaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetail = (item: PengajuanHargaItem) => {
    if (onViewDetail) {
      onViewDetail(item);
    } else {
      setSelectedItemForDetail(item);
      setIsDetailModalOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedItemForDetail(null);
  };

  // Base Column Count calculation:
  // No (1) + Kode (1) + (showTanggal ? 1 : 0) + (showCabang ? 1 : 0) + Material & Spesifikasi (1) + Deskripsi Lengkap (1) + Kategori & Area (1)
  // + (showHarga ? 1 : 0) + (showStatus ? 1 : 0) + (showCatatanReview ? 1 : 0) + Aksi (1)
  const totalCols =
    5 +
    (showTanggal ? 1 : 0) +
    (showCabang ? 1 : 0) +
    (showHarga ? 1 : 0) +
    (showStatus ? 1 : 0) +
    (showCatatanReview ? 1 : 0) +
    1;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
      {/* Table Card Header */}
      {title && (
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
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <th className="text-center px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] w-12">
                No
              </th>
              <th className="text-center px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kode Item
              </th>

              {showTanggal && (
                <th className="px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center w-28">
                  Tanggal
                </th>
              )}

              {showCabang && (
                <th className="px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center w-28">
                  Cabang
                </th>
              )}

              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Material &amp; Spesifikasi
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Deskripsi Material
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kategori &amp; Area
              </th>

              {showHarga && (
                <th className="text-left px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                  Estimasi Harga
                </th>
              )}

              {showStatus && (
                <th className="px-3 py-3 font-bold border-r border-slate-200 text-[11px] text-center w-36 min-w-32.5">
                  Status
                </th>
              )}

              {showCatatanReview && (
                <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center">
                  Catatan Review
                </th>
              )}

              <th className="text-center px-3.5 py-3 font-bold whitespace-nowrap text-[11px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <TableLoadingSkeleton colSpan={totalCols} rowCount={5} />
            ) : items.length === 0 ? (
              <TableEmptyState
                colSpan={totalCols}
                title={emptyTitle}
                description={emptyDescription}
                onReset={onResetFilter}
              />
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  {/* 1. No */}
                  <td className="text-center px-3 py-3 font-semibold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>

                  {/* 2. Kode Item */}
                  <td className="px-3.5 py-3 border-r border-slate-100 text-center">
                    <CodeBadge
                      code={item.kode}
                      isTrial={Boolean(item.isTrial)}
                    />
                  </td>

                  {/* 3. Tanggal Pengajuan */}
                  {showTanggal && (
                    <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.tanggalPengajuan || item.historyLog?.[0]?.tanggal?.slice(0, 10) || '-'}</span>
                      </div>
                    </td>
                  )}

                  {/* 4. Cabang */}
                  {showCabang && (
                    <td className="px-3 py-3 border-r border-slate-100 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        <span>{item.cabang || 'Cikokol'}</span>
                      </span>
                    </td>
                  )}

                  {/* 5. Material & Spesifikasi */}
                  <td className="px-3.5 py-3 border-r border-slate-100">
                    <MaterialSpecCell
                      item={item.item}
                      merk={item.merk}
                      ukuran={item.ukuran}
                    />
                  </td>

                  {/* 4. Deskripsi Lengkap */}
                  <td className="px-3.5 py-3 border-r border-slate-100">
                    <DescriptionCell
                      description={item.deskripsiOtomatis}
                      onClickDetail={() => handleOpenDetail(item)}
                    />
                  </td>

                  {/* 5. Kategori & Area */}
                  <td className="px-3.5 py-3 border-r border-slate-100">
                    <CategoryAreaCell
                      kategori={item.kategori}
                      implementasi={item.implementasi}
                      lokasi={item.lokasi}
                    />
                  </td>

                  {/* 6. Estimasi Harga (Kondisional) */}
                  {showHarga && (
                    <td className="px-3.5 py-3 border-r border-slate-100 whitespace-nowrap">
                      <PriceCell
                        price={item.estimasiHarga || item.hargaRataRata}
                      />
                    </td>
                  )}

                  {/* 7. Status */}
                  {showStatus && (
                    <td className="px-3 py-3 text-center border-r border-slate-100 w-36 min-w-32.5">
                      <div className="flex items-center justify-center">
                        <StatusBadge
                          status={item.status}
                          isTrial={item.isTrial}
                        />
                      </div>
                    </td>
                  )}

                  {/* 8. Catatan S&B (Kondisional) */}
                  {showCatatanReview && (
                    <td className="px-3.5 py-3 text-center border-r border-slate-100 whitespace-nowrap">
                      {item.catatanReview ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (onViewCatatan) {
                              onViewCatatan(item);
                            } else {
                              handleOpenDetail(item);
                            }
                          }}
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

                  {/* 9. Aksi */}
                  <td className="text-center px-3.5 py-3 whitespace-nowrap">
                    <TableActionButtons
                      item={item}
                      onViewDetail={handleOpenDetail}
                      renderCustomAction={() => {
                        if (renderAction) {
                          return renderAction(item);
                        }
                        return null;
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Option A: Modal Dialog Detail Spesifikasi */}
      <DetailSpesifikasiModal
        item={selectedItemForDetail}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onEditItem={onEditItem}
        onApprove={onApprove}
        onRevisi={onRevisi}
        onReject={onReject}
        onManageKoefisien={onManageKoefisien}
        onIsiSurvei={onIsiSurvei}
        onReviewSurvei={onReviewSurvei}
      />
    </div>
  );
}
