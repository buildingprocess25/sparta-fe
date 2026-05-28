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
  FileStack,
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
import {
  BUILDING_DEVELOPMENT_GM_ROLE,
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_CONTRACTOR_ROLE,
  DC_PLANNER_CONSULTANT_ROLE,
  DC_SOIL_CONSULTANT_ROLE,
  DC_SUPERVISOR_MK_ROLE,
  LOCATION_DEVELOPMENT_GM_ROLE,
  PROPERTY_DEVELOPMENT_DIRECTOR_ROLE,
  ROLE_CONFIG,
  SUPER_HUMAN_ROLE,
  hasDcDevelopmentRole,
  normalizeRoles,
} from "@/lib/constants";
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

type DcMenuId =
  | "dc-projects"
  | "dc-tender-soil"
  | "dc-tender-planner"
  | "dc-tender-mk"
  | "dc-tender-contractor"
  | "dc-monitoring"
  | "dc-supervision"
  | "dc-terms"
  | "dc-bast"
  | "dc-documents"
  | "dc-vendors";

type DcMenuItem = {
  id: DcMenuId | "shared-approval" | "shared-documents";
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const dcMenus: DcMenuItem[] = [
  { id: "dc-projects", title: "Proyek DC", desc: "Dashboard dan master project DC.", href: "/dc-development/projects", icon: Building2 },
  { id: "dc-tender-soil", title: "Tender Soil", desc: "Workflow soil investigation.", href: "/dc-development/tenders?type=SOIL_INVESTIGATION", icon: FileText },
  { id: "dc-tender-planner", title: "Tender Perencana", desc: "Workflow konsultan perencana.", href: "/dc-development/tenders?type=PLANNER", icon: ClipboardCheck },
  { id: "dc-tender-mk", title: "Tender MK", desc: "Workflow konsultan pengawas.", href: "/dc-development/tenders?type=SUPERVISOR_MK", icon: ShieldCheck },
  { id: "dc-tender-contractor", title: "Tender Kontraktor", desc: "Workflow kontraktor DC.", href: "/dc-development/tenders?type=CONTRACTOR", icon: HardHat },
  { id: "dc-monitoring", title: "Monitoring", desc: "Monitoring pekerjaan DC.", href: "/dc-development/monitoring", icon: Hammer },
  { id: "dc-supervision", title: "Pengawasan", desc: "Pengawasan lapangan DC.", href: "/dc-development/supervision", icon: BadgeCheck },
  { id: "dc-terms", title: "Termin", desc: "Pengajuan dan review termin.", href: "/dc-development/terms", icon: ReceiptText },
  { id: "dc-bast", title: "BAST", desc: "Serah terima project DC.", href: "/dc-development/bast", icon: FileArchive },
  { id: "dc-documents", title: "Dokumen DC", desc: "Penyimpanan dokumen DC.", href: "/dc-development/documents", icon: FolderArchive },
  { id: "dc-vendors", title: "Master Vendor", desc: "Master vendor DC.", href: "/dc-development/vendors", icon: Users },
];

const internalDcRoles = [
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  BUILDING_DEVELOPMENT_GM_ROLE,
  LOCATION_DEVELOPMENT_GM_ROLE,
  PROPERTY_DEVELOPMENT_DIRECTOR_ROLE,
  SUPER_HUMAN_ROLE,
];

const dcMenuAccessByRole: Record<string, DcMenuId[]> = {
  [DC_SOIL_CONSULTANT_ROLE]: ["dc-projects", "dc-tender-soil", "dc-documents"],
  [DC_PLANNER_CONSULTANT_ROLE]: ["dc-projects", "dc-tender-planner", "dc-documents"],
  [DC_SUPERVISOR_MK_ROLE]: ["dc-projects", "dc-tender-mk", "dc-supervision", "dc-documents"],
  [DC_CONTRACTOR_ROLE]: ["dc-projects", "dc-tender-contractor", "dc-monitoring", "dc-terms", "dc-bast", "dc-documents"],
};

internalDcRoles.forEach((role) => {
  dcMenuAccessByRole[role] = dcMenus.map((menu) => menu.id).filter((id): id is DcMenuId => id.startsWith("dc-"));
});

const sharedMenus: DcMenuItem[] = [
  { id: "shared-approval", title: "Approval Dokumen", desc: "Approval sesuai role dan keterkaitan.", href: "/approval", icon: ClipboardCheck },
  { id: "shared-documents", title: "Daftar Dokumen", desc: "Dokumen sesuai role dan keterkaitan.", href: "/list", icon: FileStack },
];

const getAccessibleDcMenus = (roles: string[] | undefined) => {
  const normalizedRoles = normalizeRoles(roles);
  const menuIds = new Set<DcMenuId>();
  normalizedRoles.forEach((role) => {
    dcMenuAccessByRole[role]?.forEach((menuId) => menuIds.add(menuId));
  });
  return dcMenus.filter((menu) => menuIds.has(menu.id as DcMenuId));
};

const getAccessibleSharedMenus = (roles: string[] | undefined) => {
  const normalizedRoles = normalizeRoles(roles);
  const allowedIds = new Set<string>();
  normalizedRoles.forEach((role) => {
    ROLE_CONFIG[role]?.forEach((menuId) => allowedIds.add(menuId));
  });

  return sharedMenus.filter((menu) =>
    (menu.id === "shared-approval" && allowedIds.has("menu-approval"))
    || (menu.id === "shared-documents" && allowedIds.has("menu-daftardokumen"))
  );
};

export default function DcDevelopmentPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [projects, setProjects] = useState<DcProject[]>([]);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const canOpenDc = hasDcDevelopmentRole(user?.roles);
  const accessibleDcMenus = useMemo(() => getAccessibleDcMenus(user?.roles), [user?.roles]);
  const accessibleSharedMenus = useMemo(() => getAccessibleSharedMenus(user?.roles), [user?.roles]);
  const sidebarMenus = useMemo(
    () => [...accessibleDcMenus, ...accessibleSharedMenus],
    [accessibleDcMenus, accessibleSharedMenus]
  );

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
            {sidebarMenus.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent transition-all duration-200 group cursor-pointer">
                    <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-[12px] font-semibold text-slate-700 group-hover:text-red-700 leading-snug transition-colors wrap-break-word">{item.title}</p>
                        <p className="text-[10px] text-slate-400 leading-snug wrap-break-word mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-red-400 shrink-0 transition-colors" />
                  </div>
                </Link>
              );
            })}
            {sidebarMenus.length === 0 && (
              <div className="px-3 py-8 text-center">
                <BadgeCheck className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs text-slate-400">Tidak ada menu tersedia</p>
              </div>
            )}
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
              {accessibleSharedMenus.length > 0 && (
                <div className="flex items-center gap-2">
                  {accessibleSharedMenus.map((menu) => {
                    const Icon = menu.icon;
                    return (
                      <Button key={menu.id} variant="outline" className="h-9 rounded-xl bg-white" onClick={() => router.push(menu.href)}>
                        <Icon className="mr-2 h-4 w-4" />
                        {menu.title}
                      </Button>
                    );
                  })}
                </div>
              )}
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
