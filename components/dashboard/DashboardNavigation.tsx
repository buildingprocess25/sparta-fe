"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FolderArchive,
  HardHat,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Upload,
  Download,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardMenu = {
  id: string;
  title: string;
  desc?: string;
  href: string;
  external?: boolean;
  isAlert?: boolean;
};

type NavigationGroup = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  menuIds: string[];
};

const GROUPS: NavigationGroup[] = [
  {
    id: "planning",
    label: "Perencanaan & RAB",
    icon: FileText,
    menuIds: ["menu-projek-planning", "menu-rab", "menu-ubah-rab-item"],
  },
  {
    id: "execution",
    label: "Pelaksanaan Proyek",
    icon: BarChart3,
    menuIds: ["menu-spk", "menu-tambahspk", "menu-gantt", "menu-inputpic", "menu-il", "menu-dokumentasi"],
  },
  {
    id: "completion",
    label: "Finalisasi & Arsip",
    icon: CheckCircle2,
    menuIds: ["menu-opname", "menu-svdokumen", "menu-daftardokumen"],
  },
  {
    id: "migration",
    label: "Pusat Migrasi",
    icon: Upload,
    menuIds: [
      "menu-migrasi-rab",
      "menu-migrasi-spk",
      "menu-migrasi-tambahspk",
      "menu-migrasi-gantt",
      "menu-migrasi-pengawasan",
      "menu-migrasi-opname-final",
      "menu-migrasi-dokumen",
      "menu-migrasi-il",
      "menu-migrasi-serah-terima",
    ],
  },
  {
    id: "reporting",
    label: "Data & Laporan",
    icon: Download,
    menuIds: ["menu-tarikan-data"],
  },
  {
    id: "control",
    label: "Kontrol Sistem",
    icon: Settings2,
    menuIds: ["menu-approval", "menu-intervensi", "menu-users", "menu-system-maintenance", "menu-spk-backdate-policy", "menu-serah-terima-date-correction", "menu-sp"],
  },
];

const SPECIAL_ICONS: Record<string, typeof LayoutDashboard> = {
  "menu-approval": ClipboardCheck,
  "menu-intervensi": ShieldAlert,
  "menu-daftardokumen": FolderArchive,
  "menu-tarikan-data": Download,
  "menu-system-maintenance": SlidersHorizontal,
  "menu-spk-backdate-policy": CalendarClock,
  "menu-serah-terima-date-correction": CalendarClock,
};

type Props = {
  menus: DashboardMenu[];
  menuCounts: Record<string, number>;
  userName: string;
  roleLabel: string;
  cabang: string;
  canAccessPerformanceDashboard: boolean;
  canAccessContractorPerformance: boolean;
  onCloseMobile: () => void;
  onFeatureAlert: (title: string, description: string) => void;
  onChangeWorkspace: () => void;
};

function NavigationItem({
  menu,
  count,
  onCloseMobile,
  onFeatureAlert,
  cabang,
  onBnmClick,
}: {
  menu: DashboardMenu;
  count: number;
  onCloseMobile: () => void;
  onFeatureAlert: Props["onFeatureAlert"];
  onBnmClick?: () => void;
  cabang: string;
}) {
  const Icon = SPECIAL_ICONS[menu.id] ?? FileText;
  const content = (
    <div className="group flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-red-950/70 transition-all hover:bg-red-50 hover:text-red-800 hover:shadow-[inset_3px_0_0_#dc2626]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-red-600" />
      <span className="min-w-0 flex-1 leading-snug">{menu.title}</span>
      {count > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[9px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
      )}
    </div>
  );



  if (menu.id === "menu-svdokumen" && cabang !== "HEAD OFFICE") {
    return (
      <button
        type="button"
        className="w-full text-left"
        onClick={() => {
          onFeatureAlert(
            "Akses Diberhentikan Sementara",
            "Penyimpanan dokumen saat ini terpusat di GDrive regional.",
          );
          onCloseMobile();
        }}
      >
        {content}
      </button>
    );
  }

  if (menu.id === "menu-rab") {
    return (
      <button
        type="button"
        className="w-full text-left"
        onClick={() => {
          if (onBnmClick) onBnmClick();
          onCloseMobile();
        }}
      >
        {content}
      </button>
    );
  }

  if (menu.isAlert) {
    return (
      <button
        type="button"
        className="w-full text-left"
        onClick={() => {
          onFeatureAlert("Fitur Belum Tersedia", `Halaman ${menu.title} belum tersedia saat ini.`);
          onCloseMobile();
        }}
      >
        {content}
      </button>
    );
  }

  if (menu.external) {
    return (
      <a href={menu.href} target="_blank" rel="noreferrer" onClick={onCloseMobile}>
        {content}
      </a>
    );
  }

  return (
    <Link href={menu.href} onClick={onCloseMobile}>
      {content}
    </Link>
  );
}

export default function DashboardNavigation({
  menus,
  menuCounts,
  userName,
  roleLabel,
  cabang,
  canAccessPerformanceDashboard,
  canAccessContractorPerformance,
  onCloseMobile,
  onFeatureAlert,
  onChangeWorkspace,
}: Props) {
  const [showBnmMigration, setShowBnmMigration] = useState(false);

  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const assignedIds = new Set(GROUPS.flatMap((group) => group.menuIds));
  const ungroupedMenus = menus.filter((menu) => !assignedIds.has(menu.id));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 px-4 py-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ruang kerja</p>

        <details className="group/nav-dash mt-2.5 overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm" open>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-t-xl bg-gradient-to-r from-red-600 to-red-700 px-3 text-[12px] font-semibold text-white transition-colors hover:from-red-700 hover:to-red-800 [&::-webkit-details-marker]:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">Pusat Dashboard</span>
            <ChevronDown className="h-3.5 w-3.5 text-white transition-transform group-open/nav-dash:rotate-180" />
          </summary>
          
          <div className="flex flex-col gap-1.5 p-2 bg-slate-50/50 border-t border-red-100">
            <Link
              href="/dashboard?view=monitoring"
              onClick={onCloseMobile}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 shadow-sm transition-all hover:border-red-300 hover:shadow-md hover:ring-1 hover:ring-red-100"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors group-hover:bg-red-100">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 leading-none">Monitoring Tracking</span>
                  <span className="text-[10px] font-medium text-slate-500 mt-1.5 leading-none">Lacak progress proyek</span>
                </div>
              </div>
            </Link>

            {canAccessPerformanceDashboard && (
              <Link
                href="/dashboard?view=performance"
                onClick={onCloseMobile}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md hover:ring-1 hover:ring-blue-100"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 leading-none">Performance SAT</span>
                    <span className="text-[10px] font-medium text-slate-500 mt-1.5 leading-none">Metrik & KPI tim internal</span>
                  </div>
                </div>
              </Link>
            )}

            {canAccessContractorPerformance && (
              <Link
                href="/dashboard?view=kontraktor"
                onClick={onCloseMobile}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md hover:ring-1 hover:ring-amber-100"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                    <HardHat className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 leading-none">Performance Kontraktor</span>
                    <span className="text-[10px] font-medium text-slate-500 mt-1.5 leading-none">Evaluasi & kinerja mitra</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </details>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3">
        {GROUPS.map((group) => {
          const groupMenus = group.menuIds.map((id) => menuById.get(id)).filter(Boolean) as DashboardMenu[];
          if (groupMenus.length === 0) return null;
          const Icon = group.icon;
          const groupCount = groupMenus.reduce((sum, menu) => sum + (menuCounts[menu.id] ?? 0), 0);
          return (
            <details key={group.id} className="group/nav mb-2 overflow-hidden rounded-xl border border-red-100 bg-white open:shadow-sm" open={group.id !== "migration"}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-t-xl bg-gradient-to-r from-red-600 to-red-700 px-3 text-[12px] font-semibold text-white transition-colors hover:from-red-700 hover:to-red-800 [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{group.label}</span>
                {groupCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[9px] font-semibold text-white ring-1 ring-white/30">
                    {groupCount > 99 ? "99+" : groupCount}
                  </span>
                ) : null}
                <ChevronDown className="h-3.5 w-3.5 text-white/70 transition-transform group-open/nav:rotate-180" />
              </summary>
              <div className="border-t border-red-100 bg-slate-50/50 px-1.5 py-1.5">
                {groupMenus.map((menu) => (
                  <NavigationItem
                    key={menu.id}
                    menu={menu}
                    count={menuCounts[menu.id] ?? 0}
                    cabang={cabang}
                    onCloseMobile={onCloseMobile}
                    onFeatureAlert={onFeatureAlert}
                    onBnmClick={() => setShowBnmMigration(true)}
                  />
                ))}
              </div>
            </details>
          );
        })}

        {ungroupedMenus.map((menu) => (
          <NavigationItem
            key={menu.id}
            menu={menu}
            count={menuCounts[menu.id] ?? 0}
            cabang={cabang}
            onCloseMobile={onCloseMobile}
            onFeatureAlert={onFeatureAlert}
            onBnmClick={() => setShowBnmMigration(true)}
          />
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[11px] font-semibold text-white">
            {userName.charAt(0) || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-slate-800">{userName || "-"}</p>
            <p className="mt-0.5 truncate text-[9px] text-slate-400">{roleLabel} Â· {cabang}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-1 h-9 w-full justify-start rounded-lg text-[11px] font-medium text-slate-500"
          onClick={onChangeWorkspace}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Ganti Workspace
        </Button>
      </div>

      <Dialog open={showBnmMigration} onOpenChange={setShowBnmMigration}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 opacity-[0.03]" />
            <div className="pointer-events-none absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />

            <div className="relative z-10 p-8 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 shadow-inner">
                  <ArrowRightLeft className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Pindah ke Aplikasi BNM</DialogTitle>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Penawaran Final Kontraktor</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">
                  Seluruh transaksi Penawaran Final Kontraktor kini telah dipindahkan ke aplikasi <strong>BNM</strong>. Untuk revisi Penawaran/RAB silahkan akses melalui notifikasi.
                </p>

                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <p className="text-xs font-semibold text-red-900 uppercase tracking-wider mb-3">Jadwal Sosialisasi & Panduan</p>

                  <div className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm border border-red-100">
                    <div className="flex flex-col items-center justify-center bg-red-600 rounded-md text-white min-w-[52px] py-1.5 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Sep</span>
                      <span className="text-xl font-black leading-none my-0.5">30</span>
                      <span className="text-[9px] font-medium opacity-80">2026</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                        <span>Rabu</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>13.30 WIB</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Link meeting akan diinformasikan lebih lanjut</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-600/20 rounded-xl px-8 h-11"
                onClick={() => setShowBnmMigration(false)}
              >
                Saya Mengerti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
