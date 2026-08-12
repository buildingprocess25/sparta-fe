import React, { useEffect, useState } from "react";
import { fetchPerformanceTable, type PerformanceJobType, type PerformancePeriod, type PerformanceTableMetric, type PerformanceTableRow } from "@/lib/api/performance-v3";
import { formatNumberKpi, formatPercentKpi, formatSignedDays } from "./kpi-formatters";
import { AlertTriangle, Loader2, Users } from "lucide-react";

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

const columns: Array<{ key: PerformanceTableMetric; label: string; format: (value: number | null) => string }> = [
  { key: "jhk_notaris_to_end_spk", label: "JHK Notaris to End SPK", format: (value) => formatNumberKpi(value, " hari") },
  { key: "jhk_notaris_to_start_spk", label: "JHK Notaris to Start SPK", format: (value) => formatNumberKpi(value, " hari") },
  { key: "persentase_temuan", label: "% Temuan", format: formatPercentKpi },
  { key: "ketepatan_st", label: "Ketepatan ST", format: formatSignedDays },
  { key: "deviasi_pe", label: "Deviasi (%) PE vs Penawaran", format: formatPercentKpi },
  { key: "finalisasi_ktk", label: "Finalisasi KTK", format: (value) => formatNumberKpi(value, " hari") }
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  console.log("RENDERING KPI SUPPORT TABLE", { loading, error, dataLength: data.length });

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
    return () => { ignore = true; };
  }, [search, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, userInfo.cabang, userInfo.roles]);

  if (loading) {
    return <section className="shrink-0 min-h-72 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="Tabel Performance Branch Building Support"><div className="mb-4 h-6 w-80 animate-pulse rounded-md bg-slate-200" /><div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div></section>;
  }

  if (error) {
    return <div className="shrink-0 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700" aria-live="polite"><AlertTriangle className="h-5 w-5" aria-hidden="true" />{error}</div>;
  }

  return (
    <section className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Tabel Performance Branch Building Support">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black text-white"><Users className="h-5 w-5 text-red-300" aria-hidden="true" />Tabel Performance Branch Building Support</h3><p className="mt-1 text-sm font-semibold text-slate-300">Klik nama support untuk melihat detail kartu metrik.</p>
          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">{data.length} support</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-normal text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-5 py-4">Nama Branch Building Support</th>
              {columns.map((column) => <th key={column.key} className="px-4 py-4">{column.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((row) => (
              <tr 
                key={row.nama_support} 
                onClick={() => onSupportClick(row)}
                className="hover:bg-slate-50/70 cursor-pointer group"
              >
                <td className="sticky left-0 z-10 bg-white px-5 py-4 align-top transition-colors group-hover:bg-slate-50/70">
                  <div className="text-left font-black text-slate-950 underline-offset-4 group-hover:text-red-600 group-hover:underline">
                    {row.nama_support}
                    <span className="block text-xs font-semibold text-slate-500 no-underline">{row.total_ulok} ULOK; {row.incomplete_ulok} catatan</span>
                  </div>
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 align-top">
                    <span className="rounded-md px-2 py-1 text-left font-bold text-slate-500">
                      {column.format(row[column.key])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {!data.length && <tr><td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada data support untuk filter ini.</td></tr>}
          </tbody>
        </table>
      </div>
      
      {data.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-sm text-slate-500 font-semibold">
            Menampilkan <span className="font-bold text-slate-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, data.length)}</span> dari <span className="font-bold text-slate-900">{data.length}</span> support
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-bold text-slate-600 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.length / ITEMS_PER_PAGE), p + 1))}
              disabled={currentPage >= Math.ceil(data.length / ITEMS_PER_PAGE)}
              className="px-3 py-1 text-sm font-bold text-slate-600 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
