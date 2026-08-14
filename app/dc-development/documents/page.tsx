"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FileArchive,
  FileDown,
  FileSpreadsheet,
  FolderArchive,
  Hammer,
  Loader2,
  RefreshCw,
  Search,
  Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import { fetchDcArchiveProjects, type DcArchiveProject } from "@/lib/api";
import { getTotalRequiredDcDocumentSlots } from "@/lib/dc-document.config";
import { canViewAllBranches, getParentBranch, getSubBranchesForParent } from "@/lib/constants";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function DcDocumentsPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [archives, setArchives] = useState<DcArchiveProject[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [tipeDcFilter, setTipeDcFilter] = useState("all"); // 'all', 'dc', 'warehouse'
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [message, setMessage] = useState("");
  
  const [selectedArchiveForType, setSelectedArchiveForType] = useState<DcArchiveProject | null>(null);

  const actor = useMemo(() => ({
    actor_email: user?.email || "",
    actor_role: user?.role || "",
  }), [user]);

  const isHOUser = useMemo(() => (
    canViewAllBranches(user?.roles, user?.isSuperHuman ?? false) || user?.cabang?.toUpperCase() === "HEAD OFFICE"
  ), [user]);

  const loadArchives = useCallback(async () => {
    if (!actor.actor_email || !actor.actor_role) return;
    setLoadingArchives(true);
    setMessage("");
    try {
      const subBranches = isHOUser && branchFilter !== "all"
        ? getSubBranchesForParent(branchFilter)
        : null;
      let data: DcArchiveProject[];

      if (subBranches && subBranches.length > 1) {
        const results = await Promise.all(
          subBranches.map((sub) =>
            fetchDcArchiveProjects({
              actor_email: actor.actor_email,
              actor_role: actor.actor_role,
              search: query.trim() || undefined,
              branch_name: sub,
              status: statusFilter as any,
            }, { suppressGlobalError: true }).then((res) => res.data ?? [])
          )
        );
        data = results.flat();
      } else {
        const res = await fetchDcArchiveProjects({
          actor_email: actor.actor_email,
          actor_role: actor.actor_role,
          search: query.trim() || undefined,
          branch_name: branchFilter === "all" ? undefined : branchFilter,
          status: statusFilter as any,
        }, { suppressGlobalError: true });
        data = res.data ?? [];
      }

      setArchives(data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal memuat arsip dokumen DC"));
    } finally {
      setLoadingArchives(false);
    }
  }, [actor.actor_email, actor.actor_role, branchFilter, query, statusFilter, isHOUser]);

  useEffect(() => {
    if (!isLoading && user) loadArchives();
  }, [isLoading, loadArchives, user]);

  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    archives.forEach((archive) => {
      if (archive.branch_name) branches.add(getParentBranch(archive.branch_name));
    });
    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [archives]);

  const filteredArchives = useMemo(() => {
    return archives.filter((item) => {
      const isWarehouse = tipeDcFilter === "warehouse";
      const searchTipe = isWarehouse ? "wh" : tipeDcFilter.toLowerCase();
      
      const matchesTipe = tipeDcFilter === "all" 
        ? true 
        : item.archive_name.toLowerCase().includes(searchTipe);
      const matchesStatus = statusFilter === "all"
        ? true
        : (statusFilter === "lengkap" ? item.jumlah_dokumen > 0 : item.jumlah_dokumen === 0);
      const matchesBranch = branchFilter === "all"
        ? true
        : getParentBranch(item.branch_name) === branchFilter;
      
      return matchesTipe && matchesStatus && matchesBranch;
    });
  }, [archives, tipeDcFilter, statusFilter, branchFilter]);

  const totals = useMemo(() => {
    const complete = filteredArchives.filter(a => a.jumlah_dokumen > 0).length;
    const branches = new Set(filteredArchives.map((item) => getParentBranch(item.branch_name)).filter(Boolean));
    return {
      total: filteredArchives.length,
      complete,
      incomplete: filteredArchives.length - complete,
      branches: branches.size,
      progress: filteredArchives.length > 0 ? Math.round((complete / filteredArchives.length) * 100) : 0,
    };
  }, [filteredArchives]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f9] text-slate-900 [font-family:var(--font-sans)]">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 to-red-600 shadow-md">
        <div className="mx-auto flex h-[80px] max-w-[1400px] items-center gap-5 px-6 lg:px-8">
          <Link href="/dc-development" className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-red-700" title="Kembali">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <Image src="/assets/Alfamart-Emblem.png" alt="Alfamart" width={94} height={42} className="h-[42px] w-auto drop-shadow-md" priority />
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">Penyimpanan Dokumen DC</h1>
          <Button
            variant="outline"
            className="ml-auto hidden rounded-xl border-white/20 bg-white/10 font-medium text-white backdrop-blur-sm transition-all hover:bg-white hover:text-red-700 md:inline-flex"
            onClick={loadArchives}
            disabled={loadingArchives}
          >
            <RefreshCw className={(loadingArchives) ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh Data
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        {message && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-4 text-sm font-semibold text-blue-800 shadow-sm backdrop-blur-md">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* DASHBOARD WIDGETS */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Cabang & Warehouse" value={totals.total} icon={<Building2 className="h-5 w-5 opacity-70" />} />
            <MetricCard title="Area Coverage" value={totals.branches} tone="red" filled />
            <MetricCard title="Sudah Mulai Upload" value={totals.complete} tone="green" icon={<CheckCircle2 className="h-5 w-5 opacity-70" />} />
            <MetricCard title="Progress Keseluruhan" value={`${totals.progress}%`} subtitle={`${totals.complete} dari ${totals.total} lokasi`} progress={totals.progress} />
          </section>

          {/* FILTER & TOOLS */}
          <section className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari kode, nama DC, atau lokasi..."
                  className="h-11 w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Select value={tipeDcFilter} onValueChange={setTipeDcFilter}>
                  <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="Tipe Gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="dc">DC</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lengkap">Sudah Upload</SelectItem>
                    <SelectItem value="belum">Belum Upload</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm lg:w-[180px]">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* MAIN DATA TABLE */}
          <Card className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/40">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Kode</th>
                    <th className="px-6 py-4">Nama Proyek</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArchives.map((archive, index) => {
                    const hasDocs = archive.jumlah_dokumen > 0;
                    return (
                      <tr key={archive.id} className="group transition-colors hover:bg-red-50/40">
                        <td className="px-6 py-5 text-slate-500">{index + 1}</td>
                        <td className="px-6 py-5 font-bold text-slate-700">{archive.archive_code}</td>
                        <td className="px-6 py-5">
                          <span className="font-semibold text-slate-900">{archive.archive_name}</span>
                          {archive.location_name && <div className="mt-0.5 text-xs text-slate-500">{archive.location_name}</div>}
                        </td>
                        <td className="px-6 py-5 font-medium text-slate-700">{archive.branch_name}</td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 font-medium text-slate-600">
                            {archive.project_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px] font-medium">
                              <span className="text-slate-500">Pembangunan</span>
                              <span className={archive.docs_pembangunan > 0 ? "text-emerald-600 font-bold" : "text-slate-400"}>{archive.docs_pembangunan || 0}/{getTotalRequiredDcDocumentSlots('Pembangunan')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium">
                              <span className="text-slate-500">Renovasi</span>
                              <span className={archive.docs_renovasi > 0 ? "text-emerald-600 font-bold" : "text-slate-400"}>{archive.docs_renovasi || 0}/{getTotalRequiredDcDocumentSlots('Renovasi')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium">
                              <span className="text-slate-500">Perluasan</span>
                              <span className={archive.docs_perluasan > 0 ? "text-emerald-600 font-bold" : "text-slate-400"}>{archive.docs_perluasan || 0}/{getTotalRequiredDcDocumentSlots('Perluasan')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button size="sm" className="rounded-lg bg-white font-semibold text-red-600 shadow-sm border border-red-100 transition-all hover:bg-red-600 hover:text-white" onClick={() => setSelectedArchiveForType(archive)}>
                            Kelola Dokumen
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {loadingArchives && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-500" />
                        <p className="mt-3 font-medium">Memuat data...</p>
                      </td>
                    </tr>
                  )}
                  {!loadingArchives && archives.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                        <FolderArchive className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-3 font-medium">Belum ada data DC / Warehouse.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* SELECTION MODAL */}
      <Dialog open={!!selectedArchiveForType} onOpenChange={(open) => !open && setSelectedArchiveForType(null)}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
          <div className="bg-gradient-to-br from-red-700 to-red-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/assets/pattern-light.svg')] opacity-10"></div>
            <h2 className="relative z-10 text-3xl font-black tracking-tight">{selectedArchiveForType?.archive_name}</h2>
            <p className="relative z-10 mt-2 text-red-100 font-medium">Pilih tipe pekerjaan untuk mengelola dokumen terkait.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-8">
            <button
              onClick={() => router.push(`/dc-development/documents/${selectedArchiveForType?.id}/RENOVASI`)}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-red-500 hover:shadow-xl focus:outline-none"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-4 text-red-600 transition-transform group-hover:scale-110">
                <Hammer className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Renovasi</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">4 Kategori Utama</p>
            </button>
            <button
              onClick={() => router.push(`/dc-development/documents/${selectedArchiveForType?.id}/PERLUASAN`)}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-red-500 hover:shadow-xl focus:outline-none"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-4 text-red-600 transition-transform group-hover:scale-110">
                <Maximize className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Perluasan</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Semua Kategori</p>
            </button>
            <button
              onClick={() => router.push(`/dc-development/documents/${selectedArchiveForType?.id}/PEMBANGUNAN`)}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-red-500 hover:shadow-xl focus:outline-none"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-4 text-red-600 transition-transform group-hover:scale-110">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Pembangunan</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Semua Kategori</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone = "slate",
  progress,
  icon,
  filled = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: "slate" | "red" | "green" | "amber";
  progress?: number;
  icon?: React.ReactNode;
  filled?: boolean;
}) {
  const isRed = tone === "red";
  const isGreen = tone === "green";
  const isAmber = tone === "amber";

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-shadow hover:shadow-md ${
      filled 
        ? isRed ? 'border-red-600 bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-200' : 'bg-slate-900 text-white' 
        : 'border-slate-200/60 bg-white/80 backdrop-blur-lg shadow-sm'
    }`}>
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold uppercase tracking-wider ${filled ? 'text-red-100' : 'text-slate-500'}`}>{title}</p>
          {icon && <div className={filled ? 'text-white' : isGreen ? 'text-emerald-500' : isAmber ? 'text-amber-500' : 'text-slate-400'}>{icon}</div>}
        </div>
        <div>
          <h3 className={`text-3xl font-black tracking-tight ${filled ? 'text-white' : isGreen ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-slate-800'}`}>
            {value}
          </h3>
          {subtitle && (
            <p className={`mt-1 text-xs font-medium ${filled ? 'text-red-100' : 'text-slate-500'}`}>{subtitle}</p>
          )}
        </div>
      </div>
      {progress !== undefined && (
        <div className="relative z-10 mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${isGreen ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
