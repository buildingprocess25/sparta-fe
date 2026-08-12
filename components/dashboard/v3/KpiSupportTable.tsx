import React, { useEffect, useState } from "react";
import { fetchPerformanceTable } from "@/lib/api/performance-v3";
import { Loader2, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiSupportTableProps {
  userInfo: { name: string; roles: string[]; cabang: string; namaPt: string };
  selectedCabang: string;
  selectedCoordinator: string;
  selectedSupport: string;
}

export function KpiSupportTable({
  userInfo,
  selectedCabang,
  selectedCoordinator,
  selectedSupport,
}: KpiSupportTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPerformanceTable({
          actor_cabang: userInfo.cabang || "",
          cabang: selectedCabang,
          coordinator: selectedCoordinator,
          support: selectedSupport,
        });
        setData(res.data || []);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data tabel support.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userInfo.cabang, selectedCabang, selectedCoordinator, selectedSupport]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Users className="h-5 w-5 text-red-600" />
            Tabel Performance Support Building
          </h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {data.length} Support
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Nama Support</th>
              <th className="px-6 py-4">JHK Notaris to End SPK</th>
              <th className="px-6 py-4">JHK Notaris to Start SPK</th>
              <th className="px-6 py-4">% Temuan</th>
              <th className="px-6 py-4">Ketepatan ST</th>
              <th className="px-6 py-4">SLA Kerja Tambah Kurang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4 font-extrabold text-slate-900">{row.nama_support}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.jhk_notaris_to_end_spk}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.jhk_notaris_to_start_spk}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.persentase_temuan}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.ketepatan_st}</td>
                <td className="px-6 py-4 font-medium text-slate-700">{row.sla_ktk}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center font-medium text-slate-500">
                  Tidak ada data support untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
