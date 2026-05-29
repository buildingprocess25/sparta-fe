"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, FileSignature, CheckCircle, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import { 
  fetchDcProjectById,
  fetchDcProjectBast,
  createDcProjectBast,
  updateDcProjectBast,
  type DcProject,
  type DcBast
} from "@/lib/api";

export default function DcProjectBastPage() {
  const { id } = useParams() as { id: string };
  const { user } = useSession();
  
  const [project, setProject] = useState<DcProject | null>(null);
  const [bastList, setBastList] = useState<DcBast[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [bastType, setBastType] = useState("BAST_1");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const projectId = Number(id);
      const [projRes, bastRes] = await Promise.all([
        fetchDcProjectById(projectId, { suppressGlobalError: true }),
        fetchDcProjectBast(projectId, { suppressGlobalError: true })
      ]);
      setProject(projRes.data.project);
      setBastList(bastRes.data);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal memuat data BAST", 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateBast = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createDcProjectBast(Number(id), {
        bast_type: bastType,
        notes: notes,
        actor_email: user?.email,
      });
      showMessage("BAST berhasil di-draft", 'success');
      setBastType("BAST_1"); setNotes("");
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal membuat BAST", 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveBast = async (bastId: number) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui BAST ini?")) return;
    
    try {
      await updateDcProjectBast(Number(id), bastId, {
        status: 'APPROVED',
        actor_email: user?.email,
      });
      showMessage("BAST berhasil disetujui", 'success');
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal menyetujui BAST", 'error');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#edf2f6] px-4 py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#edf2f6] px-4 py-6 flex flex-col items-center justify-center gap-4">
        <div className="text-lg font-medium text-slate-700">Project tidak ditemukan</div>
        <Link href="/dc-development">
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/dc-development/projects/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Detail Project
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">Manajemen BAST</h1>
            <p className="text-sm text-slate-500 mt-1">{project.project_name} ({project.project_code})</p>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                Daftar BAST (Berita Acara Serah Terima)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Tipe BAST</th>
                      <th className="px-6 py-4 font-semibold">Tanggal Draft</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bastList.map((bast) => (
                      <tr key={bast.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{bast.bast_type.replace(/_/g, ' ')}</div>
                          {bast.notes && <div className="text-xs text-slate-500 mt-1 line-clamp-1">{bast.notes}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(bast.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            bast.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            bast.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {bast.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {bast.status === 'DRAFT' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApproveBast(bast.id)}
                            >
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                              Setujui BAST
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bastList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Belum ada data BAST. Silakan buat draft baru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white shadow-sm h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Draft BAST Baru</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateBast} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Tipe BAST</Label>
                  <Select value={bastType} onValueChange={setBastType}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAST_1">BAST 1 (Serah Terima Pekerjaan)</SelectItem>
                      <SelectItem value="BAST_2">BAST 2 (Selesai Masa Retensi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Catatan Khusus</Label>
                  <Textarea 
                    placeholder="Catatan tambahan (opsional)" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="bg-slate-50 min-h-[100px]"
                  />
                </div>
                <Button type="submit" disabled={creating} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                  Buat Draft BAST
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
