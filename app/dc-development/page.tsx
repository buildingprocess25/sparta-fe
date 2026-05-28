"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileArchive,
  FolderArchive,
  FileText,
  Hammer,
  HardHat,
  Loader2,
  LogOut,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/context/SessionContext";
import { hasDcDevelopmentRole } from "@/lib/constants";
import { fetchDcProjects, type DcProject } from "@/lib/api";

const stageLabels: Record<string, string> = {
  PROJECT_CREATED: "Project Created",
  SOIL_TENDER: "Tender Soil",
  SOIL_WORK_RESULT: "Hasil Soil",
  PLANNER_TENDER: "Tender Perencana",
  MK_TENDER: "Tender MK",
  CONTRACTOR_TENDER: "Tender Kontraktor",
  CONSTRUCTION_MONITORING: "Monitoring",
  SAT_SUPERVISION: "Pengawasan SAT",
  BAST_PREPARATION: "Persiapan BAST",
  BAST_APPROVAL: "Approval BAST",
  FINAL_TERM_BILLING: "Termin Final",
  COMPLETED: "Completed",
};

const dcMenus = [
  { title: "Proyek DC", href: "/dc-development/projects", icon: Building2 },
  { title: "Tender Soil", href: "/dc-development/tenders?type=SOIL_INVESTIGATION", icon: FileText },
  { title: "Tender Perencana", href: "/dc-development/tenders?type=PLANNER", icon: ClipboardCheck },
  { title: "Tender MK", href: "/dc-development/tenders?type=SUPERVISOR_MK", icon: ShieldCheck },
  { title: "Tender Kontraktor", href: "/dc-development/tenders?type=CONTRACTOR", icon: HardHat },
  { title: "Monitoring", href: "/dc-development/monitoring", icon: Hammer },
  { title: "Pengawasan", href: "/dc-development/supervision", icon: BadgeCheck },
  { title: "Termin", href: "/dc-development/terms", icon: ReceiptText },
  { title: "BAST", href: "/dc-development/bast", icon: FileArchive },
  { title: "Dokumen DC", href: "/dc-development/documents", icon: FolderArchive },
  { title: "Master Vendor", href: "/dc-development/vendors", icon: Users },
];

export default function DcDevelopmentPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [projects, setProjects] = useState<DcProject[]>([]);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const canOpenDc = hasDcDevelopmentRole(user?.roles);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !canOpenDc) {
      router.replace("/workspace");
    }
  }, [canOpenDc, isLoading, router, user]);

  const loadProjects = async () => {
    setLoadingData(true);
    setError("");
    try {
      const res = await fetchDcProjects(undefined, { suppressGlobalError: true });
      setProjects(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat project DC");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && canOpenDc) {
      loadProjects();
      if (window.innerWidth <= 768) setSidebarOpen(false);
    }
  }, [canOpenDc, user]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      [project.project_code, project.project_name, project.location_name, project.branch_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [projects, query]);

  const activeProjects = projects.filter((project) => project.status !== "COMPLETED").length;
  const completedProjects = projects.filter((project) => project.status === "COMPLETED").length;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Memuat Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 font-sans text-slate-800">
      <AppNavbar
        title="SPARTA Building"
        showBuildingLogo={true}
        showMenuToggle={true}
        isMenuOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        showLogout={true}
        onLogout={() => {
          sessionStorage.clear();
          router.push("/");
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`
            shrink-0 bg-white border-r border-slate-200 flex flex-col z-20
            transition-all duration-300 ease-in-out overflow-hidden
            absolute md:relative top-0 left-0 h-full
            ${sidebarOpen ? "w-75 translate-x-0 shadow-xl md:shadow-none" : "w-0 -translate-x-full md:translate-x-0 md:w-0"}
          `}
        >
          <div className="px-4 pt-4 pb-2.5 border-b border-slate-100 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigasi</p>
            <h2 className="text-sm font-bold text-slate-700 mt-0.5">Fitur Akses</h2>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 flex flex-col gap-0.5">
            {dcMenus.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}>
                  <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="mt-0.5 p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-red-700 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.title === "Proyek DC" ? "Dashboard dan master project DC." : "Workflow DC Development."}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-2.5 border-t border-slate-100 shrink-0 space-y-2">
            <Button variant="ghost" className="h-8 w-full justify-start rounded-lg text-xs font-semibold text-slate-500" onClick={() => router.push("/workspace")}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Ganti Workspace
            </Button>
            <p className="text-[10px] text-slate-400 text-center">SPARTA Building — Alfamart</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="min-h-full bg-white/50 border border-slate-200 rounded-2xl p-3 md:p-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.namaLengkap ? user.namaLengkap.charAt(0).toUpperCase() : "D"}
                </div>
                <span className="text-sm font-bold text-slate-800">{user.namaLengkap?.toUpperCase() || "DC USER"}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">{user.role}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{user.cabang}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 rounded-xl bg-white" onClick={() => router.push("/approval")}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Approval Dokumen
                </Button>
                <Button variant="outline" className="h-9 rounded-xl bg-white" onClick={() => router.push("/list")}>
                  <FileArchive className="mr-2 h-4 w-4" />
                  Daftar Dokumen
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <SummaryCard title="Total Project" value={projects.length} subtitle="Project DC terdaftar" icon={Building2} tone="blue" />
              <SummaryCard title="Perlu Perhatian" value={0} subtitle="Approval atau revisi tertahan" icon={BadgeCheck} tone="red" />
              <SummaryCard title="Project Aktif" value={activeProjects} subtitle="Belum completed" icon={HardHat} tone="green" />
              <SummaryCard title="Project Completed" value={completedProjects} subtitle="Selesai sampai termin final" icon={ShieldCheck} tone="purple" />
            </div>

            <Card className="mt-5 overflow-hidden border-none shadow-md bg-white rounded-2xl">
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-base font-bold text-slate-800">Project Terbaru</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari project"
                        className="h-9 w-64 rounded-xl bg-slate-50 pl-9"
                      />
                    </div>
                    <Button variant="outline" className="h-9 rounded-xl" onClick={loadProjects} disabled={loadingData}>
                      <RefreshCw className={loadingData ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {error && <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Kode</th>
                        <th className="px-6 py-3">Project</th>
                        <th className="px-6 py-3">Lokasi</th>
                        <th className="px-6 py-3">Stage</th>
                        <th className="px-6 py-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-950">{project.project_code}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{project.project_name}</div>
                            <div className="text-xs text-slate-500">{project.branch_name || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{project.location_name || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {stageLabels[project.current_stage] || project.current_stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{new Date(project.updated_at).toLocaleDateString("id-ID")}</td>
                        </tr>
                      ))}
                      {!loadingData && filteredProjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            Belum ada project DC.
                          </td>
                        </tr>
                      )}
                      {loadingData && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "red" | "green" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-500",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  }[tone];

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white rounded-2xl">
      <CardContent className="px-3.5 py-2 flex items-center gap-4 h-23">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
