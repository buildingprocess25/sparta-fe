import React, { useEffect, useState, useMemo } from "react";
import { fetchPerformanceTable, type PerformanceJobType, type PerformancePeriod, type PerformanceTableMetric, type PerformanceTableRow } from "@/lib/api/performance-v3";
import { formatNumberKpi, formatPercentKpi, formatSignedDays } from "./kpi-formatters";
import { AlertTriangle, Loader2, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiSupportTableProps {
  userInfo: { name: string; roles: string[]; cabang: string; namaPt: string };
  selectedCabang: string;
  selectedCoordinator: string;
  selectedSupport: string;
  selectedPeriod: PerformancePeriod;
  selectedJobType: PerformanceJobType;
  search: string;
  onSupportClick: (row: PerformanceTableRow) => void;
}

const columns: Array<{ key: PerformanceTableMetric; label: string; format: (value: number | null, row: PerformanceTableRow) => React.ReactNode }> = [
  { key: "jhk_notaris_to_end_spk", label: "JHK Not. to End", format: (value) => (
      value !== null ? <span className="font-semibold text-slate-800">{formatNumberKpi(value, " hari")}</span> : <span className="text-slate-300">-</span>
  ) },
  { key: "jhk_notaris_to_start_spk", label: "JHK Not. to Start", format: (value) => (
      value !== null ? <span className="font-semibold text-slate-800">{formatNumberKpi(value, " hari")}</span> : <span className="text-slate-300">-</span>
  ) },
  { key: "persentase_temuan", label: "% Temuan", format: (value) => {
      if (value === null) return <span className="text-slate-300">-</span>;
      const isHigh = value > 50; // Just an example threshold
      return (
        <span className={cn("font-bold", isHigh ? "text-amber-600" : "text-slate-800")}>
          {formatPercentKpi(value)}
        </span>
      );
  } },
  { key: "ketepatan_st", label: "Ketepatan ST", format: (value) => {
      if (value === null) return <span className="text-slate-300">-</span>;
      if (value < 0) return (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-emerald-600">-{formatNumberKpi(Math.abs(value), " hari")}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/80 mt-0.5">Lebih Cepat</span>
        </div>
      );
      if (value > 0) return (
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-rose-600">+{formatNumberKpi(value, " hari")}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500/80 mt-0.5">Terlambat</span>
        </div>
      );
      return <span className="text-[13px] font-bold text-slate-500">Tepat Waktu</span>;
  } },
  { key: "deviasi_pe", label: "Deviasi PE", format: (value) => (
      value !== null ? <span className="font-semibold text-slate-800">{formatPercentKpi(value)}</span> : <span className="text-slate-300">-</span>
  ) },
  { key: "finalisasi_ktk", label: "Finalisasi KTK", format: (value) => (
      value !== null ? <span className="font-semibold text-slate-800">{formatNumberKpi(value, " hari")}</span> : <span className="text-slate-300">-</span>
  ) }
];

export function KpiSupportTable({
  userInfo,
  selectedCabang,
  selectedCoordinator,
  selectedSupport,
  selectedPeriod,
  selectedJobType,
  search,
  onSupportClick
}: KpiSupportTableProps) {
  const [data, setData] = useState<PerformanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPerformanceTable({
          actor_role: userInfo.roles[0] || "USER",
          actor_cabang: userInfo.cabang || "",
          cabang: selectedCabang,
          coordinator: selectedCoordinator,
          support: selectedSupport,
          period: selectedPeriod,
          job_type: selectedJobType,
          search
        });
        if (!ignore) setData(res.data || []);
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat tabel support.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    setCurrentPage(1); // Reset page on filter change
    setTableSearch(""); // Reset local search on global filter change
    return () => { ignore = true; };
  }, [search, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, userInfo.cabang, userInfo.roles]);

  const filteredData = useMemo(() => {
    if (!tableSearch.trim()) return data;
    const lowerSearch = tableSearch.toLowerCase();
    return data.filter(row => row.nama_support?.toLowerCase().includes(lowerSearch));
  }, [data, tableSearch]);

  if (loading) {
    return <section className="shrink-0 min-h-72 rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-xl" aria-label="Tabel Performance Branch Building Support"><div className="mb-4 h-6 w-80 animate-pulse rounded-md bg-white/50" /><div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div></section>;
  }

  if (error) {
    return <div className="shrink-0 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-700 backdrop-blur-sm" aria-live="polite"><AlertTriangle className="h-5 w-5" aria-hidden="true" />{error}</div>;
  }

  return (
    <section className="shrink-0 rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-xl" aria-label="Tabel Performance Branch Building Support">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 pb-5">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              Performance Building Support
            </h3>
            <p className="mt-1.5 text-sm font-medium text-slate-500">Klik baris nama support untuk melihat rincian metrik lebih lanjut.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Cari support..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full rounded-full border border-slate-200/60 bg-white/70 py-2 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              {filteredData.length} Support Aktif
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-200/80">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Nama Support & Aktivitas</th>
                {columns.map((column) => <th key={column.key} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{column.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((row) => (
                  <tr
                    key={row.nama_support}
                    onClick={() => onSupportClick(row)}
                    className="group cursor-pointer bg-white transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                           {row.nama_support}
                         </span>
                         <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                           <span>{row.total_ulok} ULOK</span>
                           {row.incomplete_ulok > 0 && (
                             <>
                               <span>&bull;</span>
                               <span className="font-bold text-amber-600">{row.incomplete_ulok} Catatan</span>
                             </>
                           )}
                         </div>
                      </div>
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4">
                        {column.format(row[column.key], row)}
                      </td>
                    ))}
                  </tr>
                )
              )}
              {!filteredData.length && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-20 text-center bg-white">
                    <div className="text-sm font-bold text-slate-500">Tidak ada data support untuk filter ini.</div>
                    <div className="mt-1 text-xs text-slate-400">Coba ubah filter pencarian Anda.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <div className="mt-2 flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-slate-200/50 pt-5">
            <p className="text-sm font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="font-bold text-slate-900">{filteredData.length}</span> support
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage >= Math.ceil(filteredData.length / ITEMS_PER_PAGE)}
                className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
