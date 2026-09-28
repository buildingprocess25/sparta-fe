"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Store, ArrowRight } from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';

interface TableSiapSurveiProps {
  items: PengajuanHargaItem[];
}

export function TableSiapSurvei({ items }: TableSiapSurveiProps) {
  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">
          Material Siap Survei
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
              <th className="px-3 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Ukuran
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Merk
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Kategori
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Posisi &amp; Area
              </th>
              <th className="text-right px-4 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px]">
                Rata-Rata Harga
              </th>
              <th className="px-3.5 py-3 font-bold border-r border-slate-200 whitespace-nowrap text-[11px] text-center">
                Status
              </th>
              <th className="text-center px-3 py-3 font-bold whitespace-nowrap text-[11px]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  <Store className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-500">Tidak ada material yang menunggu survei</p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
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
                    {item.item}
                  </td>
                  <td className="px-3 py-3.5 border-r border-slate-100 whitespace-nowrap">
                    {item.ukuran}
                  </td>
                  <td className="px-3.5 py-3.5 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                    {item.merk}
                  </td>
                  <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap">
                    {item.kategori}
                  </td>
                  <td className="px-3.5 py-3.5 border-r border-slate-100 whitespace-nowrap text-slate-600">
                    {item.implementasi} &bull; {item.lokasi}
                  </td>
                  <td className="text-right px-4 py-3.5 border-r border-slate-100 whitespace-nowrap font-medium text-slate-500">
                    {item.hargaRataRata ? (
                      <span className="font-mono font-bold text-emerald-700">
                        {formatRupiah(item.hargaRataRata)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3.5 py-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      <Store className="w-3 h-3 text-blue-600" />
                      Siap Survei
                    </span>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
