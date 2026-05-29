"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/context/SessionContext";
import { fetchDcTenders, type DcTender } from "@/lib/api";

export default function DcTendersPage() {
  const { user } = useSession();
  const [tenders, setTenders] = useState<DcTender[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadTenders = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetchDcTenders(undefined, { suppressGlobalError: true });
      setTenders(res.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat daftar tender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dc-development" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              DC Development
            </Link>
            <h1 className="mt-2 text-xl font-bold text-slate-800">Daftar Tender</h1>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={loadTenders} disabled={loading}>
            <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{message}</div>}

        <Card className="rounded-lg bg-white">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg font-bold">Data Tender</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tender</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Tipe</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold">{tender.title}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{tender.project_name || "-"}</div>
                        <div className="text-xs text-slate-500">{tender.project_code || "-"}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{tender.tender_type.replace(/_/g, " ")}</td>
                      <td className="px-5 py-4 text-blue-700 font-semibold">{tender.status}</td>
                      <td className="px-5 py-4">
                        <Link href={`/dc-development/tenders/${tender.id}`}>
                          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white text-xs">
                            <Eye className="mr-2 h-3 w-3" />
                            Detail
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  )}
                  {!loading && tenders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">Belum ada data tender.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
