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
  onMetricClick: (support: string, metric: PerformanceTableMetric, label: string) => void;
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
  onMetricClick
}: KpiSupportTableProps) {
  const [data, setData] = useState<PerformanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => { ignore = true; };
  }, [search, selectedCabang, selectedCoordinator, selectedJobType, selectedPeriod, selectedSupport, userInfo.cabang, userInfo.roles]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white"><Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" /></div>;
  }

  if (error) {
    return <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700" aria-live="polite"><AlertTriangle className="h-5 w-5" aria-hidden="true" />{error}</div>;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Tabel Performance Branch Building Support">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Users className="h-5 w-5 text-red-600" aria-hidden="true" />Tabel Performance Branch Building Support</h3>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{data.length} support</span>
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
            {data.map((row) => (
              <tr key={row.nama_support} className="hover:bg-slate-50/70">
                <td className="sticky left-0 z-10 bg-white px-5 py-4 align-top">
                  <button type="button" onClick={() => onMetricClick(row.nama_support, "finalisasi_ktk", `Finalisasi KTK - ${row.nama_support}`)} className="text-left font-black text-slate-950 underline-offset-4 hover:text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                    {row.nama_support}
                    <span className="block text-xs font-semibold text-slate-500">{row.total_ulok} ULOK; {row.incomplete_ulok} catatan</span>
                  </button>
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 align-top">
                    <button type="button" onClick={() => onMetricClick(row.nama_support, column.key, `${column.label} - ${row.nama_support}`)} className="rounded-md px-2 py-1 text-left font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      {column.format(row[column.key])}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            {!data.length && <tr><td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada data support untuk filter ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
