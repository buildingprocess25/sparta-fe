"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FolderArchive,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Upload,
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
    id: "control",
    label: "Kontrol Sistem",
    icon: Settings2,
    menuIds: ["menu-approval", "menu-intervensi", "menu-users", "menu-system-maintenance", "menu-sp"],
  },
];

const SPECIAL_ICONS: Record<string, typeof LayoutDashboard> = {
  "menu-approval": ClipboardCheck,
  "menu-intervensi": ShieldAlert,
  "menu-daftardokumen": FolderArchive,
  "menu-system-maintenance": SlidersHorizontal,
};

type Props = {
  menus: DashboardMenu[];
  menuCounts: Record<string, number>;
  userName: string;
  roleLabel: string;
  cabang: string;
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
}: {
  menu: DashboardMenu;
  count: number;
  onCloseMobile: () => void;
  onFeatureAlert: Props["onFeatureAlert"];
  cabang: string;
}) {
  const Icon = SPECIAL_ICONS[menu.id] ?? FileText;
  const content = (
    <div className="group flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-700 hover:shadow-[inset_3px_0_0_#dc2626]">
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
  onCloseMobile,
  onFeatureAlert,
  onChangeWorkspace,
}: Props) {
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const assignedIds = new Set(GROUPS.flatMap((group) => group.menuIds));
  const ungroupedMenus = menus.filter((menu) => !assignedIds.has(menu.id));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 px-4 py-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ruang kerja</p>
        <Link
          href="/dashboard"
          className="mt-2 flex min-h-10 items-center gap-2.5 rounded-lg bg-red-50 px-3 text-[12px] font-semibold text-red-700"
          onClick={onCloseMobile}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
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
            <p className="mt-0.5 truncate text-[9px] text-slate-400">{roleLabel} · {cabang}</p>
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
    </div>
  );
}
