import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Building2, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, X, Clock, CalendarDays, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDashboardKpiDrilldown } from "@/lib/api/kpi-performance";

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: string;
  kpiTitle: string;
  actorRole: string;
  actorCabang: string;
  cabangFilter: string;
  coordinatorFilter: string;
  supportFilter: string;
}

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiType,
  kpiTitle,
  actorRole,
  actorCabang,
  cabangFilter,
  coordinatorFilter,
  supportFilter
}: KpiDrilldownModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sheet State
  const [selectedToko, setSelectedToko] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
        // Reset when closed
        setPage(1);
        setSelectedToko(null);
        return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetchDashboardKpiDrilldown({
            actor_role: actorRole,
            actor_cabang: actorCabang,
            cabang: cabangFilter,
            coordinator: coordinatorFilter,
            support: supportFilter,
            kpi_type: kpiType,
            page,
            limit
        });
        
        setData(res.data || []);
        if (res.meta) {
            setTotalPages(res.meta.totalPages);
            setTotalRecords(res.meta.total);
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat rincian dari database.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen, kpiType, actorRole, actorCabang, cabangFilter, coordinatorFilter, supportFilter, page, limit]);

  // Determine dynamic column header based on kpiType
  let thirdColumnHeader = "Nilai Rincian";
  if (kpiType === "cost_m2") thirdColumnHeader = "Cost/m2";
  if (kpiType === "jhk") thirdColumnHeader = "Durasi JHK (Hari)";
  if (kpiType === "denda") thirdColumnHeader = "Denda (Rp)";
  if (kpiType === "keterlambatan") thirdColumnHeader = "Terlambat (Hari)";
  if (kpiType === "ketepatan_st") thirdColumnHeader = "Selisih Serah Terima (Hari)";
  if (kpiType === "sla_ktk") thirdColumnHeader = "SLA KTK (Hari)";
  if (kpiType === "sla_approval") thirdColumnHeader = "SLA Approvals (Hari)";
  if (kpiType === "ktk_nominal") thirdColumnHeader = "Kerja Tambah/Kurang (Rp)";

  const formatRupiah = (val: any) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const renderInfo = (item: any) => {
    if (kpiType === "cost_m2") {
        return (
            <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-700">{formatRupiah(item.info)}/m2</span>
                <span className="text-[10px] sm:text-xs text-slate-400">Total: {formatRupiah(item.total)} | Luas: {item.luas} m2</span>
            </div>
        );
    }
    if (kpiType === "denda") {
        return <span className="font-bold text-amber-600">{formatRupiah(item.info)}</span>;
    }
    if (kpiType === "ktk_nominal") {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-emerald-600 font-semibold text-xs">+ {formatRupiah(item.tambah)}</span>
                <span className="text-rose-600 font-semibold text-xs">- {formatRupiah(item.kurang)}</span>
            </div>
        );
    }
    if (kpiType === "sla_approval") {
        return (
            <div className="flex gap-4 text-xs">
                <div className="flex flex-col"><span className="text-slate-400">Coord:</span> <span className="font-semibold">{item.coord_days || '0'}</span></div>
                <div className="flex flex-col"><span className="text-slate-400">Mgr:</span> <span className="font-semibold">{item.mgr_days || '0'}</span></div>
                <div className="flex flex-col"><span className="text-slate-400">BM:</span> <span className="font-semibold">{item.bm_days || '0'}</span></div>
            </div>
        );
    }
    return <span className="font-medium text-slate-700">{item.info}</span>;
  };

  const startIndex = (page - 1) * limit;

  return (
    <>
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-5xl bg-white/95 backdrop-blur-xl border-slate-200/60 shadow-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="shrink-0 p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Rincian Data: {kpiTitle}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">{totalRecords} Data</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col min-h-[350px] bg-slate-50/30">
              {loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                  <p className="text-sm font-medium text-slate-500 animate-pulse">Menarik data asli dari database...</p>
                </div>
              ) : error ? (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2 border border-red-100 m-6">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto flex-1 relative custom-scrollbar p-6 pt-4">
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                            </div>
                        )}
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50/95 backdrop-blur-sm text-slate-600 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 py-3 whitespace-nowrap w-12 text-center">#</th>
                              <th className="px-4 py-3 w-1/2">Nama Proyek</th>
                              <th className="px-4 py-3 whitespace-nowrap">Cabang</th>
                              <th className="px-4 py-3 whitespace-nowrap">{thirdColumnHeader}</th>
                              <th className="px-4 py-3 whitespace-nowrap text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 relative">
                            {data.map((item, idx) => (
                              <tr 
                                key={idx} 
                                onClick={() => setSelectedToko(item)}
                                className="hover:bg-indigo-50/50 transition-all cursor-pointer group"
                              >
                                <td className="px-4 py-4 text-slate-400 text-xs font-bold text-center">{startIndex + idx + 1}</td>
                                <td className="px-4 py-4 font-semibold text-slate-800 flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors" />
                                  {item.proyek || "Tidak Diketahui"}
                                </td>
                                <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{item.cabang}</td>
                                <td className="px-4 py-4 text-slate-600">
                                  {renderInfo(item)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <ChevronRight className="h-4 w-4 text-slate-300 inline-block group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                </td>
                              </tr>
                            ))}
                            {data.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-16 text-center text-slate-500 bg-slate-50/30">
                                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                  <p className="font-medium">Tidak ada data rincian untuk filter ini.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Pagination */}
                    <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between shrink-0">
                        <span className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-700">{data.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-bold text-slate-700">{startIndex + data.length}</span> dari <span className="font-bold text-slate-700">{totalRecords}</span> data
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="px-4 text-sm font-medium text-slate-600">
                                {page} <span className="text-slate-400 mx-1">/</span> {totalPages || 1}
                            </div>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Slide-over Panel for Project Overview */}
        {selectedToko && (
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
                    onClick={() => setSelectedToko(null)}
                />
                
                {/* Panel */}
                <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{selectedToko.proyek}</h3>
                                <p className="text-xs font-semibold text-slate-500">{selectedToko.cabang}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedToko(null)}
                            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            Quick Preview (WIP)
                        </h4>
                        
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 mb-6">
                            <p className="text-xs text-indigo-600 font-semibold mb-1">Rincian KPI saat ini:</p>
                            <div className="text-lg text-slate-800">{renderInfo(selectedToko)}</div>
                        </div>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-slate-800 text-sm">SPK & RAB</div>
                                        <time className="text-xs font-medium text-slate-400">Tahap 1</time>
                                    </div>
                                    <div className="text-xs text-slate-500">Pembuatan RAB dan penetapan nilai SPK awal dilakukan di sini. (Data detail akan segera disambungkan).</div>
                                </div>
                            </div>
                            
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-sky-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-slate-800 text-sm">Approvals</div>
                                        <time className="text-xs font-medium text-slate-400">Tahap 2</time>
                                    </div>
                                    <div className="text-xs text-slate-500">Waktu yang dihabiskan untuk persetujuan Coord, Manager, dan BM diukur pada tahap ini.</div>
                                </div>
                            </div>

                        </div>
                        
                        <div className="mt-8 text-center">
                            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                Ke Halaman Detail Proyek Penuh &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
