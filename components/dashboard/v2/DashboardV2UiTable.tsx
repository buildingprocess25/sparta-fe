import React from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronRight as ArrowRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import { formatDateTimeId } from '@/lib/date-format';

import { DashboardV2Row } from 'sparta-be/src/modules/dashboard/dashboard-v2.types';

interface DashboardV2UiTableProps {
    rows: DashboardV2Row[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onRowClick: (row: DashboardV2Row) => void;
    initialCardType: string | null;
}

const TONE_CLASSES: Record<string, string> = {
    'blue': 'bg-blue-50 text-blue-700 border-blue-200',
    'green': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'yellow': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'red': 'bg-rose-50 text-rose-700 border-rose-200',
    'purple': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'orange': 'bg-orange-50 text-orange-700 border-orange-200',
    'neutral': 'bg-slate-50 text-slate-700 border-slate-200',
};

export const DashboardV2UiTable: React.FC<DashboardV2UiTableProps> = React.memo(({
    rows,
    currentPage,
    totalPages,
    onPageChange,
    onRowClick,
    initialCardType
}) => {

    if (!rows || rows.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center p-12 shadow-sm h-full">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">Tidak ada data yang sesuai.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-4 border-r border-slate-200/60 w-[30%]">Toko / ULOK</th>
                                <th className="p-4 border-r border-slate-200/60 w-[15%]">Cabang & Lingkup</th>
                                <th className="p-4 border-r border-slate-200/60 w-[15%] text-center">Status</th>
                                <th className="p-4 border-r border-slate-200/60 w-[20%] text-right">Nilai / Info</th>
                                {initialCardType && !['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'KERJA_TAMBAH_KURANG', 'SERAH_TERIMA', 'ST', 'IL'].includes(initialCardType) && (
                                    <th className="p-4 border-r border-slate-200/60 w-[15%] text-right">Metrik Tambahan</th>
                                )}
                                <th className="p-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, idx) => {
                                return (
                                    <tr 
                                        key={idx} 
                                        onClick={() => onRowClick(row)}
                                        className="group hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td className="p-4 border-r border-slate-200/60 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-slate-800 text-sm group-hover:text-red-600 transition-colors">{row.nama_toko || 'Unknown'}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 text-[10px] tracking-widest">{row.nomor_ulok || 'Unknown'}</Badge>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-slate-200/60 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700">{row.cabang || '-'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.lingkup_pekerjaan || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-slate-200/60 align-middle text-center">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 px-2 py-0.5 text-[10px] tracking-widest uppercase">
                                                {row.status_label || row.stage || '-'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 border-r border-slate-200/60 align-middle text-right">
                                            <div className="flex flex-col justify-end gap-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">INFO</span>
                                                <span className="text-sm font-black text-slate-700">{row.value_label}</span>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 border-r border-slate-200/60 align-middle text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                {row.metrics?.map((m: any, i: number) => (
                                                    <div key={i} className="flex flex-col items-end gap-0.5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                                                        <span className={`text-sm font-black ${TONE_CLASSES[m.tone] ? TONE_CLASSES[m.tone].split(' ')[1] : 'text-slate-700'}`}>{m.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 align-middle text-center">
                                            <div className="w-8 h-8 mx-auto rounded-full bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 group-hover:text-white text-slate-400 transition-all shrink-0">
                                                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <p className="text-sm font-semibold text-slate-500">
                        Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari <span className="text-slate-900 font-black">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="rounded-xl font-bold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="rounded-xl font-bold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});
