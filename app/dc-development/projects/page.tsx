"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import { createDcProject, fetchDcProjects, type DcProject } from "@/lib/api";

export default function DcProjectsPage() {
  const { user } = useSession();
  const [projects, setProjects] = useState<DcProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    project_code: "",
    project_name: "",
    location_name: "",
    branch_name: "",
    address: "",
    area_size: "",
  });

  const loadProjects = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetchDcProjects(undefined, { suppressGlobalError: true });
      setProjects(res.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat project DC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const submitProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createDcProject({
        project_code: form.project_code.trim(),
        project_name: form.project_name.trim(),
        location_name: form.location_name.trim() || undefined,
        branch_name: form.branch_name.trim() || undefined,
        address: form.address.trim() || undefined,
        area_size: form.area_size ? Number(form.area_size) : undefined,
        created_by_email: user?.email,
        created_by_role: user?.role,
      });
      setForm({ project_code: "", project_name: "", location_name: "", branch_name: "", address: "", area_size: "" });
      await loadProjects();
      setMessage("Project DC berhasil dibuat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat project DC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dc-development" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              DC Development
            </Link>
            <h1 className="mt-2 text-xl font-bold text-slate-800">Project DC</h1>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={loadProjects} disabled={loading}>
            <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{message}</div>}

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="rounded-lg bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Buat Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitProject} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kode Project</Label>
                  <Input value={form.project_code} onChange={(e) => setForm((prev) => ({ ...prev, project_code: e.target.value.toUpperCase() }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Nama Project</Label>
                  <Input value={form.project_name} onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.target.value }))} required />
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Input value={form.location_name} onChange={(e) => setForm((prev) => ({ ...prev, location_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cabang/DC</Label>
                    <Input value={form.branch_name} onChange={(e) => setForm((prev) => ({ ...prev, branch_name: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Luas Area</Label>
                  <Input type="number" min="0" step="0.01" value={form.area_size} onChange={(e) => setForm((prev) => ({ ...prev, area_size: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <Button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Simpan Project
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-white">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-bold">Daftar Project</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Kode</th>
                      <th className="px-5 py-3">Project</th>
                      <th className="px-5 py-3">Stage</th>
                      <th className="px-5 py-3">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-5 py-4 font-bold">{project.project_code}</td>
                        <td className="px-5 py-4">{project.project_name}</td>
                        <td className="px-5 py-4 text-blue-700">{project.current_stage}</td>
                        <td className="px-5 py-4 text-slate-500">{project.location_name || "-"}</td>
                      </tr>
                    ))}
                    {loading && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loading && projects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">Belum ada project DC.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
