"use client";

import React from 'react';
import { PengajuanHargaItem } from './types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PengajuanHargaTableProps {
  items: PengajuanHargaItem[];
  loading?: boolean;
  onDeleteItem?: (id: string) => void;
  title?: string;
  className?: string;
}

export function PengajuanHargaTable({
  items,
  loading = false,
  onDeleteItem,
  title = "Daftar Spesifikasi Material",
  className = "",
}: PengajuanHargaTableProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
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
                Kode
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
                Catatan
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap text-[11px] min-w-[280px]">
                Deskripsi Lengkap
              </th>
              {onDeleteItem && (
                <th className="text-center px-3 py-3 font-bold whitespace-nowrap text-[11px]">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={onDeleteItem ? 15 : 14} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={onDeleteItem ? 15 : 14} className="py-12 text-center text-slate-400">
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
                  <td className="px-4 py-3.5 text-slate-800 text-xs leading-relaxed min-w-[280px]">
                    {item.deskripsiOtomatis}
                  </td>
                  {onDeleteItem && (
                    <td className="text-center px-3 py-3.5 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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

