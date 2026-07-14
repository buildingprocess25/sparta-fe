"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useMemo, useState, Fragment } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  FileText,
  HardHat,
  Layers3,
  Search,
  Tag,
  UserCheck,
  DollarSign,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";

export type DashboardDetailState = {
  open: boolean;
  title: string;
  context: string;
  subContext: string;
};

type Stats = {
  total: number;
  attention: number;
  penawaran: number;
  spk: number;
  avgJHK: number;
  avgDelay: number;
  totalDenda: number;
  dendaTerlambat: number;
  dendaKritis: number;
  dendaAman: number;
  avgCostTerbuka: number;
  avgCostBangunan: number;
  avgCostTerbangun: number;
  avgNilaiToko: string;
  avgNilaiKontraktor: string;
  contractorGrouped: any[];
  avgBeanspot: number;
  beanspotStores: any[];
  miniStats: Record<string, number>;
  miniPerhatian: Record<string, number>;
};

type PriorityItem = {
  project: any;
  stage: string;
  lateDays: number;
  penalty: { amount: number; days: number; source: string };
  hasST: boolean;
};

type Props = {
  stats: Stats;
  projects: any[];
  priorityProjects: PriorityItem[];
  detail: DashboardDetailState;
  isGlobalView: boolean;
  isCompanyScoped: boolean;
  userName: string;
  cabang: string;
  opnameItemsMap: Record<number, any[]>;
  onOpenDetail: (title: string, context: string, subContext?: string) => void;
  onCloseDetail: () => void;
  onOpenPenalty: (project: any) => void;
  onOpenSerahTerima: (project: any) => void;
  onOpenSource: (project: any, context: string) => void;
  canOpenSource: (project: any, context: string) => boolean;
  getStage: (project: any) => string;
  getLateDays: (project: any) => number;
  getPenalty: (project: any) => { amount: number; days: number; source: string };
  getQuality: (items: any[]) => { desain: number; kualitas: number; spesifikasi: number; total: number };
};

// ============================================================================
// HELPER: Aggregate Cost/m² dari semua RAB dalam 1 ULOK (SIPIL + ME)
// ============================================================================
const getAggregatedCostData = (project: any, opname: any) => {
  const rabArr = Array.isArray(project?.rab) ? project.rab : (project?.rab ? [project.rab] : []);
  
  // Filter hanya RAB yang approved (DISETUJUI)
  const approvedRabs = rabArr.filter((r: any) => 
    String(r?.status || '').toUpperCase() === 'DISETUJUI'
  );
  
  // Jika tidak ada approved RAB, fallback ke semua RAB
  const activeRabs = approvedRabs.length > 0 ? approvedRabs : rabArr;
  
  // Aggregate total biaya dari semua lingkup (SIPIL + ME)
  const totalBiayaRAB = activeRabs.reduce((sum: number, rab: any) => {
    return sum + Number(rab?.grand_total_final || 0);
  }, 0);
  
  // Ambil luas_terbangun dari RAB pertama (asumsi: luas sama untuk SIPIL dan ME)
  const luasTerbangun = Number(activeRabs[0]?.luas_terbangun || 0);
  
  // Gunakan opname jika ada, kalau tidak pakai aggregate RAB
  const totalBiaya = Number(opname?.grand_total_opname || 0) > 0 
    ? Number(opname.grand_total_opname) 
    : totalBiayaRAB;
  
  const costPerM2 = luasTerbangun > 0 ? totalBiaya / luasTerbangun : 0;
  
  return {
    totalBiaya,
    luasTerbangun,
    costPerM2,
    jumlahLingkup: activeRabs.length,
    lingkupList: activeRabs.map((r: any) => String(r?.lingkup_pekerjaan || '').toUpperCase()).join('+'),
    sumber: opname ? 'Opname' : 'RAB',
    rabs: activeRabs,  // For breakdown display
  };
};

const PIPELINE = ["Approval RAB", "Proses Gantt", "Proses PJU", "Approval SPK", "Ongoing", "Kerja Tambah Kurang", "Done"];

const contextLabels: Record<string, string> = {
  PROJECT: "Status proyek",
  ATTENTION: "Perlu tindakan",
  PENAWARAN: "Nilai penawaran",
  SPK: "Nilai SPK",
  DENDA: "Denda",
  JHK: "JHK pekerjaan",
  DELAY: "Keterlambatan",
  NILAI_TOKO: "Nilai toko",
  NILAI_KONTRAKTOR: "Nilai kontraktor",
  COST_M2: "Cost per m²",
  BEANSPOT: "Nilai Beanspot",
};

const detailColumnLabels: Record<string, [string, string, string]> = {
  PROJECT: ["TAHAP PROYEK", "STATUS & SLA", "RINGKASAN"],
  ATTENTION: ["MASALAH UTAMA", "URGENSI", "DAMPAK"],
  PENAWARAN: ["STATUS RAB", "TANGGAL PENAWARAN", "NILAI PENAWARAN"],
  SPK: ["STATUS SPK", "PERIODE KERJA", "NILAI SPK"],
  DENDA: ["SUMBER DENDA", "KETERLAMBATAN", "NILAI DENDA"],
  JHK: ["DURASI AWAL", "TAMBAH HARI", "JHK EFEKTIF"],
  DELAY: ["TARGET SELESAI", "STATUS ST", "KETERLAMBATAN"],
  NILAI_TOKO: ["DESAIN", "KUALITAS", "TOTAL NILAI"],
  COST_M2: ["SUMBER BIAYA", "LUAS TERBANGUN", "COST / M²"],
};

const getApprovedExtensions = (project: any) => {
  const spk = firstSpk(project);
  return (Array.isArray(spk?.pertambahan_spk) ? spk.pertambahan_spk : [])
    .filter((item: any) => ["APPROVED", "DISETUJUI", "DISETUJUI BM"].includes(String(item?.status_persetujuan || "").toUpperCase()));
};

type ContextCell = { value: string; helper: string; danger?: boolean };

function getContextCells(
  project: any,
  context: string,
  stage: string,
  lateDays: number,
  penalty: ReturnType<Props["getPenalty"]>,
  quality: ReturnType<Props["getQuality"]>,
): ContextCell[] {
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  const st = Array.isArray(project?.berkas_serah_terima) ? project.berkas_serah_terima[0] : project?.berkas_serah_terima;
  const extensions = getApprovedExtensions(project);
  const extensionDays = extensions.reduce((sum: number, item: any) => sum + Number(item?.pertambahan_hari || 0), 0);
  const date = formatDashboardDate;
  const area = Number(rab?.luas_terbangun || 0);
  const totalCost = Number(opname?.grand_total_opname || rab?.grand_total_final || 0);
  const latestValue = ["Kerja Tambah Kurang", "Done"].includes(stage)
    ? Number(opname?.grand_total_opname || spk?.grand_total || rab?.grand_total_final || 0)
    : Number(spk?.grand_total || rab?.grand_total_final || 0);

  if (context === "ATTENTION") return [
    { value: stage, helper: penalty.amount > 0 ? "Denda aktif" : "Melewati SLA", danger: true },
    { value: lateDays > 3 ? "Kritis" : "Perlu dicek", helper: `${lateDays} hari`, danger: true },
    { value: penalty.amount > 0 ? formatRupiah(penalty.amount) : "Dokumen tertunda", helper: "Potensi dampak", danger: penalty.amount > 0 },
  ];
  if (context === "PENAWARAN") return [
    { value: rab?.status || "-", helper: rab?.no_sph ? `SPH ${rab.no_sph}` : "RAB terakhir" },
    { value: date(rab?.created_at), helper: rab?.nama_pt || project?.toko?.nama_kontraktor || "-" },
    { value: formatRupiah(rab?.grand_total_final || 0), helper: "Grand total final" },
  ];
  if (context === "SPK") return [
    { value: spk?.status || "-", helper: spk?.nomor_spk || "Nomor SPK -" },
    { value: `${date(spk?.waktu_mulai)} – ${date(spk?.waktu_selesai)}`, helper: `${Number(spk?.durasi || 0)} hari + ${extensionDays}` },
    { value: formatRupiah(spk?.grand_total || 0), helper: spk?.nama_kontraktor || project?.toko?.nama_kontraktor || "-" },
  ];
  if (context === "DENDA") return [
    { value: "Opname Final", helper: "Dari dokumen resmi", danger: true },
    { value: `${penalty.days} hari`, helper: `Target ${date(spk?.waktu_selesai)}`, danger: penalty.days > 0 },
    { value: formatRupiah(penalty.amount), helper: st ? `ST ${date(st.created_at)}` : "ST belum tersedia", danger: penalty.amount > 0 },
  ];
  if (context === "JHK") return [
    { value: `${Number(spk?.durasi || 0)} hari`, helper: `Mulai ${date(spk?.waktu_mulai)}` },
    { value: `${extensionDays} hari`, helper: `${extensions.length} persetujuan` },
    { value: `${Number(spk?.durasi || 0) + extensionDays + lateDays} hari`, helper: lateDays > 0 ? `Termasuk ${lateDays} hari terlambat` : "Sesuai target" },
  ];
  if (context === "DELAY") return [
    { value: date(spk?.waktu_selesai), helper: "Target efektif terakhir" },
    { value: st ? "Sudah ST" : "Belum ST", helper: st ? date(st.created_at) : "Masih berjalan" },
    { value: `${lateDays} hari`, helper: lateDays > 0 ? "Melewati target" : "Dalam target", danger: lateDays > 0 },
  ];
  if (context === "NILAI_TOKO") return [
    { value: `${quality.desain.toFixed(1)} / 30`, helper: "Kesesuaian desain" },
    { value: `${quality.kualitas.toFixed(1)} / 35`, helper: `Spesifikasi ${quality.spesifikasi.toFixed(1)} / 35` },
    { value: `${quality.total.toFixed(1)} poin`, helper: opname?.status_opname_final || "Opname", danger: quality.total < 75 },
  ];
  if (context === "COST_M2") {
    const costData = getAggregatedCostData(project, opname);
    return [
      { 
        value: costData.sumber, 
        helper: `${formatRupiah(costData.totalBiaya)} total` 
      },
      { 
        value: `${costData.luasTerbangun} m²`, 
        helper: `${costData.jumlahLingkup} lingkup (${costData.lingkupList})` 
      },
      { 
        value: formatRupiah(costData.costPerM2), 
        helper: "Gabungan semua lingkup" 
      },
    ];
  }
  const sla = getSlaInfo(project, stage, lateDays);
  return [
    { value: stage, helper: project?.toko?.lingkup_pekerjaan || "-" },
    { value: sla.label, helper: sla.helper, danger: sla.priority },
    { value: formatRupiah(latestValue), helper: penalty.amount > 0 ? `Denda ${formatRupiah(penalty.amount)}` : "Nilai terakhir" },
  ];
}

const projectHasSpk = (project: any) => {
  const spks = Array.isArray(project?.spk) ? project.spk : project?.spk ? [project.spk] : [];
  return spks.some((spk: any) => !["REJECTED", "REJECT", "CANCELLED", "CANCEL"].includes(String(spk?.status || "").toUpperCase()));
};

const firstRab = (project: any) => (Array.isArray(project?.rab) ? project.rab[0] : project?.rab) ?? null;
const firstSpk = (project: any) => (Array.isArray(project?.spk) ? project.spk[0] : project?.spk) ?? null;
const firstOpname = (project: any) => (Array.isArray(project?.opname_final) ? project.opname_final[0] : project?.opname_final) ?? null;

const normalizeStorePenaltyKeyPart = (value: unknown) => {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
};

const getProjectStorePenaltyKey = (project: any) => {
  const nomorUlok = normalizeStorePenaltyKeyPart(project?.toko?.nomor_ulok);
  if (nomorUlok) return `ULOK|${nomorUlok}`;

  const kodeToko = normalizeStorePenaltyKeyPart(project?.toko?.kode_toko);
  if (kodeToko) return `KODE|${kodeToko}`;

  const cabang = normalizeStorePenaltyKeyPart(project?.toko?.cabang);
  const namaToko = normalizeStorePenaltyKeyPart(project?.toko?.nama_toko);
  if (namaToko) return `NAMA|${cabang}|${namaToko}`;

  return `TOKO_ID|${project?.toko?.id || "UNKNOWN"}`;
};

const compareProjectPenaltyInfo = (current: any, next: any) => {
  if (!current) return next;
  if (current.source !== next.source) {
    return next.source === "Resmi" ? next : current;
  }
  return next.amount > current.amount ? next : current;
};

const formatDashboardDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const parseSlaDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const diffSlaDays = (start: Date | null, end: Date | null) => {
  if (!start || !end) return 0;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
};

const latestSerahTerima = (project: any) => {
  const stArr = Array.isArray(project?.berkas_serah_terima)
    ? project.berkas_serah_terima
    : (project?.berkas_serah_terima ? [project.berkas_serah_terima] : []);
  return stArr
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0] ?? null;
};

const getSlaWindow = (project: any, stage: string) => {
  const now = new Date();
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  const st = latestSerahTerima(project);

  if (stage === "Approval RAB") {
    return { start: parseSlaDate(rab?.created_at), end: parseSlaDate(rab?.waktu_persetujuan_manager) || now, limit: 2 };
  }
  if (stage === "Proses PJU") {
    return { start: parseSlaDate(rab?.waktu_persetujuan_manager), end: parseSlaDate(spk?.created_at) || now, limit: 10 };
  }
  if (stage === "Approval SPK") {
    return { start: parseSlaDate(spk?.created_at), end: parseSlaDate(spk?.waktu_persetujuan) || now, limit: 2 };
  }
  if (stage === "Ongoing") {
    const extensionDays = getApprovedExtensions(project).reduce((sum: number, item: any) => sum + Number(item?.pertambahan_hari || 0), 0);
    return { start: parseSlaDate(spk?.waktu_mulai), end: now, limit: Number(spk?.durasi || 0) + extensionDays };
  }
  if (stage === "Kerja Tambah Kurang") {
    return { start: parseSlaDate(st?.created_at), end: parseSlaDate(opname?.created_at) || now, limit: 14 };
  }
  return { start: null, end: null, limit: 0 };
};

const getSlaInfo = (project: any, stage: string, lateDays: number) => {
  if (stage === "Done") {
    return { label: "Selesai", helper: "Proyek telah ditutup", priority: false, tone: "done" as const };
  }
  if (stage === "Proses Gantt") {
    return { label: "Aman", helper: "Tidak masuk SLA utama", priority: false, tone: "safe" as const };
  }
  const { start, end, limit } = getSlaWindow(project, stage);
  const age = diffSlaDays(start, end);
  const exceeded = Math.max(0, age - limit);
  if (exceeded > 0) return { label: "Perlu Tindakan", helper: `Berjalan ${age} hari (batas ${limit} hari)`, priority: true, tone: "critical" as const };
  if (limit > 0 && age >= Math.max(1, limit - 1)) return { label: "Mendekati Batas", helper: `Berjalan ${age} hari (batas ${limit} hari)`, priority: false, tone: "warning" as const };
  return { label: "Aman", helper: limit > 0 ? `Berjalan ${age} hari (batas ${limit} hari)` : "Belum ada ketentuan batas", priority: false, tone: "safe" as const };
};

const isStageVisibleInDetail = (project: any, stage: string) => {
  if (stage === "Proses Gantt") return true;
  if (stage === "Done") return true;
  const { start, end } = getSlaWindow(project, stage);
  return diffSlaDays(start, end) > 0;
};

function DashboardMetric({
  label,
  value,
  helper,
  tone = "neutral",
  onClick,
  subMetrics,
}: {
  label: string;
  value: string | number;
  helper: string;
  tone?: "neutral" | "danger";
  onClick: () => void;
  subMetrics?: { label: string; value: string | number }[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 p-5 text-left shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(220,38,38,0.1)] ${
        tone === "danger" ? "bg-gradient-to-br from-white to-red-50/60 hover:border-red-300" : "bg-gradient-to-br from-white to-slate-50 hover:border-slate-300"
      }`}
    >
      <div className="relative z-10 w-full">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${tone === "danger" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
            <FileText className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">{label}</p>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <p className={`text-3xl font-bold tracking-tight ${tone === "danger" ? "text-red-700" : "text-slate-900"}`}>{value}</p>
          <TrendingUp className={`h-4 w-4 ${tone === "danger" ? "text-red-500" : "text-emerald-500"}`} />
        </div>
        <p className="mt-1 text-[11px] font-medium text-slate-500">{helper}</p>
      </div>

      {subMetrics && subMetrics.length > 0 && (
        <div className="relative z-10 mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-100/80 pt-4">
          {subMetrics.map((sm, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 leading-tight">{sm.label}</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-[13px] font-extrabold ${i === 2 && tone === "danger" ? "text-red-600" : i === 0 ? "text-emerald-600" : "text-sky-600"}`}>{sm.value}</span>
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Decorative gradient blur */}
      <div className={`absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full opacity-[0.06] blur-xl transition-opacity duration-300 group-hover:opacity-[0.12] ${tone === "danger" ? "bg-red-500" : "bg-blue-500"}`} />
    </button>
  );
}

function getProjectValue(project: any, context: string, getLateDays: Props["getLateDays"], getPenalty: Props["getPenalty"], quality: ReturnType<Props["getQuality"]>) {
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  if (context === "PENAWARAN") return { label: "Penawaran", value: formatRupiah(rab?.grand_total_final || 0), helper: rab?.status || "Belum ada status" };
  if (context === "SPK") return { label: "Nilai SPK", value: formatRupiah(spk?.grand_total || 0), helper: spk?.status || "Belum ada status" };
  if (context === "DENDA") {
    const penalty = getPenalty(project);
    return { label: "Denda", value: formatRupiah(penalty.amount), helper: `${penalty.days} hari keterlambatan` };
  }
  if (context === "JHK") return { label: "JHK efektif", value: `${Number(spk?.durasi || 0)} hari`, helper: "Durasi SPK dan tambah hari" };
  if (context === "DELAY") return { label: "Keterlambatan", value: `${getLateDays(project)} hari`, helper: spk?.waktu_selesai || "Target belum tersedia" };
  if (context === "NILAI_TOKO") return { label: "Nilai toko", value: `${quality.total.toFixed(1)} poin`, helper: `D ${quality.desain.toFixed(1)} · K ${quality.kualitas.toFixed(1)} · S ${quality.spesifikasi.toFixed(1)}` };
  if (context === "COST_M2") {
    const costData = getAggregatedCostData(project, opname);
    return { 
      label: "Cost/m² terbangun", 
      value: formatRupiah(costData.costPerM2), 
      helper: `${costData.luasTerbangun} m² · ${costData.sumber} · ${costData.jumlahLingkup} lingkup` 
    };
  }
  return { label: "Tahap", value: contextLabels[context] || "Proyek", helper: project?.toko?.lingkup_pekerjaan || "-" };
}

function Timeline({ project, stage }: { project: any; stage: string }) {
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  const st = Array.isArray(project?.berkas_serah_terima) ? project.berkas_serah_terima[0] : project?.berkas_serah_terima;
  const items = [
    { label: "RAB", value: rab?.status || "Belum tersedia", date: rab?.created_at },
    { label: "SPK", value: spk?.status || "Belum tersedia", date: spk?.created_at },
    { label: "Pelaksanaan", value: stage, date: spk?.waktu_mulai },
    { label: "Opname", value: opname?.status_opname_final || "Belum tersedia", date: opname?.created_at },
    { label: "Serah terima", value: st ? "Tersedia" : "Belum tersedia", date: st?.created_at },
  ];
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.label} className="grid grid-cols-[16px_1fr] gap-2.5">
          <div className="flex flex-col items-center">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full border-2 ${item.value.includes("Belum") ? "border-slate-300 bg-white" : "border-emerald-600 bg-emerald-50"}`} />
            {index < items.length - 1 ? <span className="h-11 w-px bg-slate-200" /> : null}
          </div>
          <div className="pb-3">
            <p className="text-[11px] font-semibold text-slate-800">{item.label}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{item.value}</p>
            {item.date ? <p className="mt-0.5 text-[9px] text-slate-400">{formatDashboardDate(item.date)}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContextInspector({
  project,
  context,
  quality,
  lateDays,
  penalty,
}: {
  project: any;
  context: string;
  quality: ReturnType<Props["getQuality"]>;
  lateDays: number;
  penalty: ReturnType<Props["getPenalty"]>;
}) {
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  const st = Array.isArray(project?.berkas_serah_terima) ? project.berkas_serah_terima[0] : project?.berkas_serah_terima;
  const extensions = getApprovedExtensions(project);
  const extensionDays = extensions.reduce((sum: number, item: any) => sum + Number(item?.pertambahan_hari || 0), 0);
  const date = formatDashboardDate;
  const infoBox = (label: string, value: string, helper?: string, danger = false) => (
    <div className={`rounded-xl border p-3 ${danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className={`text-[8px] font-medium uppercase tracking-[0.08em] ${danger ? "text-red-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-1.5 text-[12px] font-semibold ${danger ? "text-red-800" : "text-slate-900"}`}>{value}</p>
      {helper ? <p className="mt-1 text-[9px] text-slate-400">{helper}</p> : null}
    </div>
  );

  if (context === "PENAWARAN") return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {infoBox("Grand total final", formatRupiah(rab?.grand_total_final || 0))}
        {infoBox("Status RAB", rab?.status || "-")}
        {infoBox("Tanggal dibuat", date(rab?.created_at))}
        {infoBox("Kontraktor", rab?.nama_pt || project?.toko?.nama_kontraktor || "-")}
      </div>
      <div className="rounded-xl border border-slate-200 p-3"><p className="text-[9px] font-semibold text-slate-700">Identitas penawaran</p><p className="mt-2 text-[10px] text-slate-500">No. SPH: {rab?.no_sph || "-"}</p><p className="mt-1 text-[10px] text-slate-500">Kategori lokasi: {rab?.kategori_lokasi || "-"}</p><p className="mt-1 text-[10px] text-slate-500">Durasi: {rab?.durasi_pekerjaan || "-"} hari</p></div>
    </div>
  );
  if (context === "SPK") return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {infoBox("Nilai SPK", formatRupiah(spk?.grand_total || 0))}
        {infoBox("Status", spk?.status || "-")}
        {infoBox("Mulai", date(spk?.waktu_mulai))}
        {infoBox("Selesai", date(spk?.waktu_selesai))}
      </div>
      <div className="rounded-xl border border-slate-200 p-3"><p className="text-[9px] font-semibold text-slate-700">Durasi pekerjaan</p><div className="mt-3 flex items-end gap-2"><p className="text-2xl font-semibold text-slate-950">{Number(spk?.durasi || 0) + extensionDays}</p><p className="pb-1 text-[10px] text-slate-400">hari efektif</p></div><p className="mt-1 text-[9px] text-slate-400">{Number(spk?.durasi || 0)} hari awal + {extensionDays} hari tambahan</p></div>
    </div>
  );
  if (context === "DENDA" || context === "DELAY" || context === "ATTENTION") return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {infoBox("Keterlambatan", `${lateDays} hari`, "Dari target efektif", lateDays > 0)}
        {infoBox("Nilai denda", formatRupiah(penalty.amount), "Opname final", penalty.amount > 0)}
        {infoBox("Target SPK", date(spk?.waktu_selesai))}
        {infoBox("Serah terima", st ? date(st.created_at) : "Belum tersedia", undefined, !st)}
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-3"><p className="text-[9px] font-semibold text-red-800">Dasar perhitungan</p><p className="mt-2 text-[9px] leading-relaxed text-red-700">Nilai denda berasal dari opname final yang telah disetujui.</p></div>
    </div>
  );
  if (context === "JHK") return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {infoBox("SPK awal", `${Number(spk?.durasi || 0)} hari`)}
        {infoBox("Tambah hari", `${extensionDays} hari`)}
        {infoBox("Terlambat", `${lateDays} hari`, undefined, lateDays > 0)}
      </div>
      <div className="rounded-xl border border-slate-200 p-4 text-center"><p className="text-[9px] text-slate-400">JHK PEKERJAAN</p><p className="mt-2 text-3xl font-semibold text-slate-950">{Number(spk?.durasi || 0) + extensionDays + lateDays}</p><p className="mt-1 text-[9px] text-slate-400">hari kalender terukur</p></div>
    </div>
  );
  if (context === "NILAI_TOKO") return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><p className="text-[9px] text-amber-700">TOTAL NILAI TOKO</p><p className="mt-2 text-3xl font-semibold text-amber-950">{quality.total.toFixed(1)}</p><p className="mt-1 text-[9px] text-amber-700">dari 100 poin</p></div>
      <div className="grid grid-cols-3 gap-2">
        {infoBox("Desain", `${quality.desain.toFixed(1)}/30`)}
        {infoBox("Kualitas", `${quality.kualitas.toFixed(1)}/35`)}
        {infoBox("Spesifikasi", `${quality.spesifikasi.toFixed(1)}/35`)}
      </div>
    </div>
  );
  if (context === "COST_M2") {
    const costData = getAggregatedCostData(project, opname);
    
    return (
      <div className="space-y-3">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          {infoBox("Sumber", costData.sumber)}
          {infoBox("Total biaya", formatRupiah(costData.totalBiaya))}
          {infoBox("Luas terbangun", `${costData.luasTerbangun} m²`)}
          {infoBox("Cost/m²", formatRupiah(costData.costPerM2), undefined, true)}
        </div>
        
        {/* Breakdown per Lingkup */}
        {costData.rabs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-semibold text-slate-700 uppercase border-b border-slate-200 pb-1">Breakdown per Lingkup</p>
            {costData.rabs.map((rab: any, idx: number) => {
              const lingkup = String(rab?.lingkup_pekerjaan || '').toUpperCase();
              const biaya = Number(rab?.grand_total_final || 0);
              const luas = Number(rab?.luas_terbangun || 0);
              const perM2 = luas > 0 ? biaya / luas : 0;
              const status = String(rab?.status || '').toUpperCase();
              
              return (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-slate-800">{lingkup}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        status === 'DISETUJUI' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-600">{formatRupiah(biaya)}</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{luas} m²</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-red-700">{formatRupiah(perM2)}</p>
                    <p className="text-[8px] text-slate-400">per m²</p>
                  </div>
                </div>
              );
            })}
            
            {/* Total Gabungan Card */}
            <div className="flex items-center justify-between rounded-xl border-2 border-red-200 bg-red-50 p-3 mt-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-red-800 uppercase">Total Gabungan</p>
                  {costData.jumlahLingkup > 1 && (
                    <span className="text-[8px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-bold">
                      {costData.lingkupList}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] font-bold text-red-900">{formatRupiah(costData.totalBiaya)}</p>
                <p className="mt-0.5 text-[9px] text-red-700">{costData.luasTerbangun} m² terbangun</p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-extrabold text-red-900">{formatRupiah(costData.costPerM2)}</p>
                <p className="text-[9px] text-red-700 font-semibold">per m²</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function SpecializedDetailContent({
  context,
  rows,
  selectedIndex,
  onSelect,
  opnameItemsMap,
  getStage,
  getLateDays,
  getPenalty,
  getQuality,
  selectedProjectDetail,
  onOpenProjectDetail,
  onBackFromProject,
  canOpenSource,
  onOpenSource,
}: {
  context: string;
  rows: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  opnameItemsMap: Record<number, any[]>;
  getStage: Props["getStage"];
  getLateDays: Props["getLateDays"];
  getPenalty: Props["getPenalty"];
  getQuality: Props["getQuality"];
  selectedProjectDetail: any | null;
  onOpenProjectDetail: (project: any) => void;
  onBackFromProject: () => void;
  canOpenSource: Props["canOpenSource"];
  onOpenSource: Props["onOpenSource"];
}) {
  const selected = rows[Math.min(selectedIndex, Math.max(0, rows.length - 1))];
  const project = selected?.__kind ? null : selected;

  const stageIconMap: Record<string, typeof HardHat> = {
    "Approval RAB": FileText,
    "Proses Gantt": CalendarDays,
    "Proses PJU": Clock3,
    "Approval SPK": UserCheck,
    "Ongoing": HardHat,
    "Kerja Tambah Kurang": Layers3,
  };
  const stageColorMap: Record<string, { text: string; bar: string; borderTop: string; bg: string }> = {
    "Approval RAB":        { text: "text-violet-600", bar: "bg-violet-500", borderTop: "border-t-violet-500", bg: "bg-violet-50" },
    "Proses Gantt":        { text: "text-sky-600",    bar: "bg-sky-500",    borderTop: "border-t-sky-500",    bg: "bg-sky-50" },
    "Proses PJU":          { text: "text-amber-600",  bar: "bg-amber-500",  borderTop: "border-t-amber-500",  bg: "bg-amber-50" },
    "Approval SPK":        { text: "text-emerald-600",bar: "bg-emerald-500",borderTop: "border-t-emerald-500", bg: "bg-emerald-50" },
    "Ongoing":             { text: "text-red-600",    bar: "bg-red-500",    borderTop: "border-t-red-500",    bg: "bg-red-50" },
    "Kerja Tambah Kurang": { text: "text-orange-600", bar: "bg-orange-500", borderTop: "border-t-orange-500", bg: "bg-orange-50" },
  };

  if (selectedProjectDetail) {
    const p = selectedProjectDetail;
    const pStage = getStage(p);
    const pLate = getLateDays(p);
    const pPenalty = getPenalty(p);
    const pQuality = getQuality(opnameItemsMap[p?.toko?.id] || []);
    const colors = stageColorMap[pStage] || { text: "text-slate-600", bar: "bg-slate-500", borderTop: "border-t-slate-500", bg: "bg-slate-50" };
    const Icon = stageIconMap[pStage] || FileText;
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
        <button type="button" onClick={() => onBackFromProject()} className="group mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <ArrowLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-[11px] font-semibold text-slate-600">Kembali ke Daftar</span>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{p?.toko?.nama_toko}</span>
        </button>

        <div className={`relative overflow-hidden rounded-xl border border-slate-200 border-t-4 ${colors.borderTop} bg-white p-6 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>{pStage}</span>
                {pLate > 0 && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Terlambat {pLate} hari</span>}
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900 leading-tight">{p?.toko?.nama_toko}</h2>
              <p className="mt-1 text-[12px] text-slate-500">{p?.toko?.nomor_ulok} · {p?.toko?.cabang} · {p?.toko?.lingkup_pekerjaan || "—"}</p>
            </div>
            {canOpenSource && canOpenSource(p, context) && (
              <button type="button" onClick={() => onOpenSource(p, context)} className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md">
                Buka ULOK →
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-3">Analisis Risiko & Keterlambatan</p>
              <ContextInspector project={p} context={context} quality={pQuality} lateDays={pLate} penalty={pPenalty} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-4">Perjalanan Dokumen</p>
              <Timeline project={p} stage={pStage} />
            </div>
            {pPenalty.amount > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-3">Denda</p>
                <p className="text-3xl font-bold tracking-tight text-red-700">{formatRupiah(pPenalty.amount)}</p>
                <p className="mt-1 text-[12px] font-medium text-red-600">{pPenalty.days} hari keterlambatan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  if (context === "SPK") {
    const total = rows.reduce((sum, row) => sum + Number(firstSpk(row)?.grand_total || 0), 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fff8f8] p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText className="h-5 w-5"/></span><p className="mt-6 text-[9px] uppercase tracking-[.14em] text-red-500">Register kontrak aktif</p><p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</p><div className="mt-6 border-t border-red-100 pt-5"><p className="text-[9px] text-slate-400">Total komitmen</p><p className="mt-1 text-xl font-semibold text-red-700">{formatRupiah(total)}</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((row,index)=>{const spk=firstSpk(row);const extra=getApprovedExtensions(row).reduce((sum:number,item:any)=>sum+Number(item?.pertambahan_hari||0),0);return (
              <Fragment key={row?.toko?.id||index}>
                <button type="button" onClick={() => { onSelect(index); if (!row.__kind) onOpenProjectDetail(row); }} className={`rounded-2xl border bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md ${selectedIndex===index?"border-red-500 shadow-md":"border-slate-200"}`}><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-600">{spk?.nomor_spk||"SPK"}</span><span className="text-[9px] font-medium text-emerald-700">{spk?.status}</span></div><p className="mt-4 text-[12px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{spk?.nama_kontraktor||row?.toko?.nama_kontraktor}</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3"><div><p className="text-[8px] text-slate-400">PERIODE</p><p className="mt-1 text-[9px] font-medium">{formatDashboardDate(spk?.waktu_mulai)} – {formatDashboardDate(spk?.waktu_selesai)}</p></div><div className="text-right"><p className="text-[8px] text-slate-400">DURASI</p><p className="mt-1 text-[9px] font-medium">{Number(spk?.durasi||0)+extra} hari</p></div></div><p className="mt-4 text-lg font-semibold text-red-800">{formatRupiah(spk?.grand_total||0)}</p></button>
              </Fragment>
            )})}
          </div>
        </div>
      </div>
    );
  }

  if (context === "PENAWARAN") {
    const total = rows.reduce((sum, row) => sum + Number(context === "PENAWARAN" ? firstRab(row)?.grand_total_final : firstSpk(row)?.grand_total || 0), 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#f7f3ef] p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-red-700 p-5 text-white"><p className="text-[9px] uppercase tracking-[0.12em] text-red-100">Total {context === "PENAWARAN" ? "penawaran" : "SPK"}</p><p className="mt-2 text-2xl font-semibold">{formatRupiah(total)}</p><p className="mt-1 text-[10px] text-red-100">{rows.length} dokumen aktif</p></div>
          <div className="rounded-2xl border border-orange-200 bg-white p-5"><p className="text-[9px] text-slate-400">RATA-RATA NILAI</p><p className="mt-2 text-xl font-semibold text-slate-950">{formatRupiah(rows.length ? total / rows.length : 0)}</p></div>
          <div className="rounded-2xl border border-orange-200 bg-white p-5"><p className="text-[9px] text-slate-400">NILAI TERBESAR</p><p className="mt-2 text-xl font-semibold text-red-700">{formatRupiah(Math.max(0, ...rows.map((row) => Number(context === "PENAWARAN" ? firstRab(row)?.grand_total_final : firstSpk(row)?.grand_total || 0))))}</p></div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.25fr_.8fr_.8fr_.8fr] bg-orange-50 px-5 py-3 text-[8px] font-semibold uppercase tracking-[.08em] text-orange-800">
            <span>Toko & kontraktor</span><span>Status dokumen</span><span>Periode / tanggal</span><span className="text-right">Nilai</span>
          </div>
          {rows.map((row, index) => {
            const rab = firstRab(row); const spk = firstSpk(row);
            const value = context === "PENAWARAN" ? rab?.grand_total_final : spk?.grand_total;
            return (
              <Fragment key={row?.toko?.id || index}>
                <button type="button" onClick={() => { onSelect(index); if (!row.__kind) onOpenProjectDetail(row); }} className={`grid w-full grid-cols-[1.25fr_.8fr_.8fr_.8fr] items-center border-t border-orange-100 px-5 py-4 text-left transition-all hover:bg-red-50 ${selectedIndex === index ? "bg-red-50 shadow-[inset_4px_0_0_#dc2626]" : ""}`}>
                  <span><span className="block text-[11px] font-semibold text-slate-900">{row?.toko?.nama_toko}</span><span className="mt-1 block text-[9px] text-slate-400">{row?.toko?.nomor_ulok} · {context === "PENAWARAN" ? rab?.nama_pt : spk?.nama_kontraktor}</span></span>
                  <span className="text-[10px] font-medium text-slate-700">{context === "PENAWARAN" ? rab?.status : spk?.status}</span>
                  <span className="text-[9px] text-slate-500">{context === "PENAWARAN" ? formatDashboardDate(rab?.created_at) : `${formatDashboardDate(spk?.waktu_mulai)} – ${formatDashboardDate(spk?.waktu_selesai)}`}</span>
                  <span className="text-right text-[12px] font-semibold text-red-800">{formatRupiah(value || 0)}</span>
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  if (context === "DENDA") {
    // De-duplicate by store key (ULOK) and take minimum penalty among peers (SIPIL+ME)
    const penaltyByStore = new Map<string, number>();
    rows.forEach(row => {
      const penalty = getPenalty(row);
      const storeKey = row?.toko?.nomor_ulok || `TOKO_${row?.toko?.id}`;
      const existing = penaltyByStore.get(storeKey);
      // Take minimum penalty for stores with same ULOK (peer minimum logic)
      if (existing === undefined || penalty.amount < existing) {
        penaltyByStore.set(storeKey, penalty.amount);
      }
    });
    const totalPenalty = Array.from(penaltyByStore.values()).reduce((sum, amount) => sum + amount, 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fff5f5] p-4 md:p-6">
        <div className="rounded-2xl bg-linear-to-r from-red-800 to-red-600 p-6 text-white">
          <p className="text-[9px] uppercase tracking-[.14em] text-red-100">Eksposur denda portfolio</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><p className="text-3xl font-semibold">{formatRupiah(totalPenalty)}</p><p className="text-[10px] text-red-100">{rows.length} toko memiliki denda</p></div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-red-200 bg-white">
          <div className="grid grid-cols-[1.2fr_.8fr_.8fr] bg-red-50 px-5 py-3 text-[8px] font-semibold uppercase tracking-[.08em] text-red-800"><span>Toko</span><span>Hari terlambat</span><span className="text-right">Nilai denda</span></div>
          {rows.map((row,index)=>{const penalty=getPenalty(row);return (
            <Fragment key={row?.toko?.id||index}>
              <button type="button" onClick={() => { onSelect(index); if (!row.__kind) onOpenProjectDetail(row); }} className={`grid w-full grid-cols-[1.2fr_.8fr_.8fr] items-center border-t border-red-100 px-5 py-4 text-left transition-all hover:bg-red-50 ${selectedIndex===index?"bg-red-50 shadow-[inset_4px_0_0_#dc2626]":""}`}><span><span className="block text-[11px] font-semibold">{row?.toko?.nama_toko}</span><span className="mt-1 block text-[9px] text-slate-400">{row?.toko?.nomor_ulok} · {row?.toko?.cabang}</span></span><span className="text-[11px] font-semibold text-red-800">{penalty.days} hari</span><span className="text-right text-[13px] font-semibold text-red-900">{formatRupiah(penalty.amount)}</span></button>
            </Fragment>
          )})}
        </div>
      </div>
    );
  }

  if (context === "DELAY") {
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
        <div className="mb-4"><h2 className="text-lg font-semibold text-slate-950">Peta keterlambatan</h2><p className="mt-1 text-[10px] text-slate-400">Bandingkan target SPK dengan kondisi serah terima.</p></div>
        <div className="space-y-3">
          {rows.map((row,index)=>{const spk=firstSpk(row);const st=Array.isArray(row?.berkas_serah_terima)?row.berkas_serah_terima[0]:row?.berkas_serah_terima;const late=getLateDays(row);return <button key={row?.toko?.id||index} type="button" onClick={() => { onSelect(index); if (!row.__kind) onOpenProjectDetail(row); }} className={`w-full rounded-2xl border bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 ${selectedIndex===index?"border-red-500 shadow-[inset_4px_0_0_#dc2626]":"border-slate-200"}`}><div className="grid gap-4 lg:grid-cols-[220px_1fr_90px] lg:items-center"><div><p className="text-[11px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{row?.toko?.cabang} · {getStage(row)}</p></div><div className="relative pt-4"><div className="h-1.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-600" style={{width:`${Math.min(100,Math.max(8,late*7))}%`}}/></div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Target {formatDashboardDate(spk?.waktu_selesai)}</span><span>{st?`ST ${formatDashboardDate(st.created_at)}`:"Belum ST"}</span></div></div><p className="text-right text-2xl font-semibold text-red-700">{late}<span className="ml-1 text-[9px] font-normal text-slate-400">hari</span></p></div></button>})}
        </div>
      </div>
    );
  }

  if (context === "ATTENTION") {
    const stageBreakdown = PIPELINE.filter(s => s !== "Done").map(stage => ({
      stage,
      count: rows.filter((row) => getStage(row) === stage).length,
      lateDays: rows.filter((row) => getStage(row) === stage).reduce((sum, row) => sum + getLateDays(row), 0),
    })).filter(s => s.count > 0);
    const maxCount = Math.max(...stageBreakdown.map(s => s.count), 1);
    const totalExposure = rows.reduce((sum, row) => sum + getPenalty(row).amount, 0);
    const totalLate = rows.reduce((sum, row) => sum + getLateDays(row), 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4 md:p-6">
        {/* Hero summary bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 flex flex-col justify-center rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-red-700">Total Proyek Perlu Perhatian</p>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-bold tracking-tight text-red-700">{rows.length}</p>
              <p className="text-[12px] font-medium text-red-600">Tersebar di {stageBreakdown.length} Alur Business Process</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Hari Terlambat</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{totalLate.toLocaleString("id-ID")}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Hari estimasi</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-500">Rp</div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Eksposur Denda</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-red-600">{formatRupiah(totalExposure)}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Estimasi dan Resmi</p>
            </div>
          </div>
        </div>

        {/* Stage breakdown cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stageBreakdown.map(({ stage, count, lateDays: stageLate }) => {
            const Icon = stageIconMap[stage] || FileText;
            const colors = stageColorMap[stage] || { text: "text-slate-600", bar: "bg-slate-500", borderTop: "border-t-slate-500", bg: "bg-slate-50" };
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={stage} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${colors.bar}`} />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{stage}</p>
                  </div>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{count}</span>
                  <span className="text-[13px] font-medium text-slate-500">Toko</span>
                </div>
                {/* Progress bar */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{pct}%</span>
                </div>
                {stageLate > 0 && (
                  <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    {stageLate.toLocaleString("id-ID")} hari keterlambatan
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider + section header */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daftar {rows.length} Proyek · Klik untuk detail</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Project List Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">Nama Toko & ULOK</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">Cabang</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">Tahap Pipeline</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">Keterlambatan</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Eksposur Denda</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const penalty = getPenalty(row); 
                  const late = getLateDays(row); 
                  const stage = getStage(row);
                  const colors = stageColorMap[stage] || { text: "text-slate-600", bg: "bg-slate-50" };
                  
                  return (
                    <tr key={row?.toko?.id || index} className="group cursor-pointer transition-colors hover:bg-red-50/60" onClick={() => onOpenProjectDetail(row)}>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-bold text-slate-900 transition-colors group-hover:text-red-700">{row?.toko?.nama_toko || "-"}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{row?.toko?.nomor_ulok || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-medium text-slate-700">{row?.toko?.cabang || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                          {stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {late > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            <Clock3 className="h-3 w-3" /> {late} hari terlambat
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Tepat waktu</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {penalty.amount > 0 ? (
                          <div>
                            <p className="text-[11px] font-bold text-red-600">{formatRupiah(penalty.amount)}</p>
                            <p className="mt-0.5 text-[9px] text-red-500">{penalty.days} hari</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 transition-colors group-hover:bg-red-100">
                          Detail <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

    );
  }

  if (context === "JHK") {
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
        <div className="space-y-3">
          {rows.map((row, index) => {
            const spk = firstSpk(row); const extra = getApprovedExtensions(row).reduce((sum: number, item: any) => sum + Number(item?.pertambahan_hari || 0), 0); const late = getLateDays(row); const total = Number(spk?.durasi || 0) + extra + late;
            return (
              <button key={row?.toko?.id || index} type="button" onClick={() => onSelect(index)} className={`w-full rounded-2xl border bg-white p-5 text-left transition-all hover:border-red-300 hover:bg-red-50 ${selectedIndex === index ? "border-red-500 shadow-[inset_4px_0_0_#dc2626]" : "border-slate-200"}`}>
                <div className="grid items-center gap-4 md:grid-cols-[1fr_2fr_80px]">
                  <div><p className="text-[12px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{row?.toko?.nomor_ulok} · {row?.toko?.cabang}</p></div>
                  <div><div className="flex h-8 overflow-hidden rounded-lg text-[8px] font-semibold text-white"><span className="flex items-center justify-center bg-slate-600" style={{width:`${total ? Number(spk?.durasi || 0)/total*100 : 0}%`}}>SPK {Number(spk?.durasi || 0)}</span><span className="flex items-center justify-center bg-amber-500" style={{width:`${total ? extra/total*100 : 0}%`}}>+{extra}</span><span className="flex items-center justify-center bg-red-600" style={{width:`${total ? late/total*100 : 0}%`}}>TELAT {late}</span></div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>{formatDashboardDate(spk?.waktu_mulai)}</span><span>{formatDashboardDate(spk?.waktu_selesai)}</span></div></div>
                  <p className="text-right text-2xl font-semibold text-slate-950">{total}<span className="ml-1 text-[9px] font-normal text-slate-400">hari</span></p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (["NILAI_TOKO", "NILAI_KONTRAKTOR"].includes(context)) {
    const qualityRows = context === "NILAI_KONTRAKTOR" ? rows : rows.map((row) => ({ project: row, nilai: getQuality(opnameItemsMap[row?.toko?.id] || []).total, nama: row?.toko?.nama_toko, meta: `${row?.toko?.nomor_ulok} · ${row?.toko?.cabang}` }));
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fffaf0] p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
            <div className="bg-amber-50 px-5 py-4"><h2 className="text-sm font-semibold text-amber-950">Peringkat kualitas</h2><p className="mt-1 text-[9px] text-amber-700">Skor tertinggi ditampilkan lebih dahulu</p></div>
            {[...qualityRows].sort((a: any,b: any)=>Number(b.nilai)-Number(a.nilai)).map((row: any,index:number) => {
              const name = context === "NILAI_KONTRAKTOR" ? row.nama_kontraktor : row.nama; const value = Number(row.nilai || 0);
              return <button key={`${name}-${index}`} type="button" onClick={() => onSelect(rows.indexOf(context === "NILAI_KONTRAKTOR" ? row : row.project))} className="grid w-full grid-cols-[34px_1fr_80px] items-center gap-3 border-t border-amber-100 px-5 py-4 text-left transition-all hover:bg-red-50"><span className="text-lg font-semibold text-amber-500">#{index+1}</span><span><span className="block text-[11px] font-semibold">{name}</span><span className="mt-2 block h-2 overflow-hidden rounded-full bg-amber-100"><span className="block h-full rounded-full bg-linear-to-r from-amber-400 to-red-500" style={{width:`${Math.min(100,value)}%`}} /></span></span><span className="text-right text-xl font-semibold text-amber-950">{value.toFixed(1)}</span></button>;
            })}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-5">
            {context === "NILAI_KONTRAKTOR" && selected ? <><p className="text-[9px] text-amber-700">KONTRAKTOR</p><h2 className="mt-2 text-lg font-semibold">{selected.nama_kontraktor}</h2><p className="mt-1 text-[10px] text-slate-400">{selected.tokoCount} toko dinilai</p><div className="mt-5 text-center"><p className="text-5xl font-semibold text-amber-900">{Number(selected.nilai).toFixed(1)}</p><p className="mt-1 text-[9px] text-slate-400">rata-rata poin</p></div></> : project ? <><p className="text-[9px] text-amber-700">BREAKDOWN NILAI</p><h2 className="mt-2 text-lg font-semibold">{project?.toko?.nama_toko}</h2><div className="mt-5"><ContextInspector project={project} context="NILAI_TOKO" quality={getQuality(opnameItemsMap[project?.toko?.id] || [])} lateDays={getLateDays(project)} penalty={getPenalty(project)} /></div></> : null}
          </div>
        </div>
      </div>
    );
  }

  if (context === "COST_M2") {
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fff8f8] p-4 [_.border-emerald-200]:border-red-100 [_.bg-emerald-50]:bg-red-50 [_.text-emerald-700]:text-red-600 [_.text-emerald-900]:text-red-800 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => {
            // Beanspot store rendering (unchanged)
            if (row.__kind === "beanspot") {
              return (
                <button key={`${row.nomor_ulok}-${index}`} type="button" onClick={() => onSelect(index)} 
                  className="rounded-2xl border border-emerald-200 bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md">
                  <Coffee className="h-5 w-5 text-emerald-700"/>
                  <p className="mt-4 text-[12px] font-semibold">{row.nama_toko}</p>
                  <p className="mt-1 text-[9px] text-slate-400">{row.nomor_ulok} · {row.cabang}</p>
                  <p className="mt-5 text-xl font-semibold text-emerald-900">{formatRupiah(row.nominal)}</p>
                </button>
              );
            }
            
            // Regular project rendering with aggregated cost
            const opname = firstOpname(row);
            const costData = getAggregatedCostData(row, opname);
            
            return (
              <button key={row?.toko?.id || index} type="button" onClick={() => onSelect(index)} 
                className="rounded-2xl border border-emerald-200 bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                    <Ruler className="h-4 w-4"/>
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] text-slate-400">{costData.sumber}</span>
                    {costData.jumlahLingkup > 1 && (
                      <span className="text-[7px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                        {costData.lingkupList}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-[12px] font-semibold line-clamp-1">{row?.toko?.nama_toko}</p>
                <p className="mt-1 text-[9px] text-slate-400">
                  {costData.luasTerbangun} m² · {formatRupiah(costData.totalBiaya)}
                  {costData.jumlahLingkup > 1 && ` · ${costData.jumlahLingkup} lingkup`}
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <p className="text-xl font-semibold text-emerald-900">
                    {formatRupiah(costData.costPerM2)}
                  </p>
                  <span className="text-[9px] font-normal text-slate-400">/m²</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default function DashboardCommandWorkspace({
  stats,
  projects,
  priorityProjects,
  detail,
  isGlobalView,
  isCompanyScoped,
  userName,
  cabang,
  opnameItemsMap,
  onOpenDetail,
  onCloseDetail,
  onOpenPenalty,
  onOpenSerahTerima,
  onOpenSource,
  canOpenSource,
  getStage,
  getLateDays,
  getPenalty,
  getQuality,
}: Props) {
  const [detailSearch, setDetailSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailCategory, setDetailCategory] = useState("Semua");
  const [projectDetailView, setProjectDetailView] = useState<any | null>(null);

  const detailRows = useMemo(() => {
    if (detail.context === "NILAI_KONTRAKTOR") {
      return stats.contractorGrouped.map((item) => ({ ...item, __kind: "contractor" }));
    }
    if (detail.context === "BEANSPOT") {
      return stats.beanspotStores.map((item) => ({ ...item, __kind: "beanspot" }));
    }
    if (detail.context === "DENDA") {
      // Process ALL projects (including 0 penalty) to apply peer minimum logic correctly
      const byStore = new Map<string, { project: any; penalty: any; createdAt: number }>();
      projects.forEach((project) => {
        const key = getProjectStorePenaltyKey(project);
        const latestOpnameFinal = firstOpname(project);
        const penalty = getPenalty(project);
        const createdAt = new Date(latestOpnameFinal?.created_at || project?.toko?.created_at || 0).getTime() || 0;
        const existing = byStore.get(key);
        const selectedPenalty = compareProjectPenaltyInfo(existing?.penalty, penalty);

        if (
          !existing ||
          selectedPenalty !== existing.penalty ||
          (penalty.amount === existing.penalty.amount && penalty.source === existing.penalty.source && createdAt > existing.createdAt)
        ) {
          byStore.set(key, { project, penalty, createdAt });
        }
      });
      // Filter out stores with 0 penalty AFTER de-duplication (peer minimum applied)
      return Array.from(byStore.values())
        .filter((entry) => entry.penalty.amount > 0)
        .map((entry) => entry.project);
    }
    return projects.filter((project) => {
      const stage = getStage(project);
      if (detail.subContext && stage !== detail.subContext) return false;
      if (detail.context === "PROJECT" && detail.subContext && !isStageVisibleInDetail(project, stage)) return false;
      if (detail.context === "ATTENTION") {
        return getSlaInfo(project, stage, getLateDays(project)).priority || getPenalty(project).amount > 0;
      }
      if (detail.context === "SPK") return projectHasSpk(project);
      if (detail.context === "PENAWARAN" || detail.context === "COST_M2") return Boolean(firstRab(project));
      if (detail.context === "DELAY") return getLateDays(project) > 0;
      if (detail.context === "JHK") return projectHasSpk(project);
      if (detail.context === "NILAI_TOKO") return (opnameItemsMap[project?.toko?.id] || []).length > 0;
      return true;
    });
  }, [detail.context, detail.subContext, getLateDays, getPenalty, getStage, opnameItemsMap, projects, stats.beanspotStores, stats.contractorGrouped]);

  const searchedRows = useMemo(() => {
    let filtered = detailRows;
    if (detailCategory !== "Semua") {
      if (detail.context === "ATTENTION") {
        filtered = filtered.filter((row: any) => getStage(row) === detailCategory);
      } else if (detail.context === "PROJECT") {
        filtered = filtered.filter((row: any) => getStage(row) === detailCategory);
      }
    }
    const query = detailSearch.trim().toLowerCase();
    if (!query) return filtered;
    return filtered.filter((row: any) =>
      [row?.toko?.nama_toko, row?.toko?.nomor_ulok, row?.toko?.cabang, row?.nama_kontraktor, row?.nama_toko, row?.nomor_ulok, row?.cabang]
        .some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [detailRows, detailSearch, detailCategory, detail.context, getStage, getLateDays]);

  const selectedRow = searchedRows[Math.min(selectedIndex, Math.max(0, searchedRows.length - 1))];
  const selectedProject = selectedRow?.__kind ? null : selectedRow;
  const selectedStage = selectedProject ? getStage(selectedProject) : "";
  const selectedQuality = selectedProject ? getQuality(opnameItemsMap[selectedProject?.toko?.id] || []) : { desain: 0, kualitas: 0, spesifikasi: 0, total: 0 };
  const columnLabels = detailColumnLabels[detail.context] || detailColumnLabels.PROJECT;
  const slaPriorityProjects = useMemo(() => projects
    .map((project) => {
      const stage = getStage(project);
      const lateDays = getLateDays(project);
      return { project, stage, lateDays, sla: getSlaInfo(project, stage, lateDays), penalty: getPenalty(project) };
    })
    .filter((item) => item.sla.priority || item.penalty.amount > 0)
    .sort((a, b) => Number(b.sla.tone === "critical") - Number(a.sla.tone === "critical") || b.lateDays - a.lateDays), [getLateDays, getPenalty, getStage, projects]);

  if (detail.open) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
        {!projectDetailView && (
          <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:px-6">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => { onCloseDetail(); setDetailCategory("Semua"); setDetailSearch(""); setProjectDetailView(null); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-red-600">Workspace rincian</p>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">{detail.title || contextLabels[detail.context]}</h1>
              <p className="mt-1 text-[11px] text-slate-500">Pilih data untuk melihat perjalanan proyek dan sumber nilainya.</p>
            </div>
            <Badge className="w-fit border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600">{searchedRows.length} hasil</Badge>
          </div>
        )}

        {detail.context !== "PROJECT" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {detail.context === "ATTENTION" && projectDetailView ? null : (
            <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input value={detailSearch} onChange={(event) => { setDetailSearch(event.target.value); setSelectedIndex(0); }} placeholder="Cari toko, ULOK, cabang, atau kontraktor..." className="h-9 rounded-lg border-slate-200 pl-9 text-[11px]" />
              </div>
              {detail.context === "ATTENTION" && (
                <Select value={detailCategory} onValueChange={(val) => { setDetailCategory(val); setSelectedIndex(0); }}>
                  <SelectTrigger className="h-9 w-[180px] shrink-0 rounded-lg border-slate-200 text-[11px] font-medium focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Filter Tahap" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua" className="text-[11px]">Semua Tahap</SelectItem>
                    {PIPELINE.filter(s => s !== "Done").map(cat => (
                      <SelectItem key={cat} value={cat} className="text-[11px]">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge className="w-fit border-red-100 bg-red-50 text-[9px] font-medium text-red-700 hidden sm:flex">
                {searchedRows.length} hasil
              </Badge>
            </div>
          )}
            <SpecializedDetailContent
              context={detail.context}
              rows={searchedRows}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              opnameItemsMap={opnameItemsMap}
              getStage={getStage}
              getLateDays={getLateDays}
              getPenalty={getPenalty}
              getQuality={getQuality}
              selectedProjectDetail={projectDetailView}
              onOpenProjectDetail={(p) => setProjectDetailView(p)}
              onBackFromProject={() => setProjectDetailView(null)}
              canOpenSource={canOpenSource}
              onOpenSource={onOpenSource}
            />
            {selectedProject && !projectDetailView && detail.context !== "ATTENTION" ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
                <div>
                  <p className="text-[10px] font-semibold text-slate-800">{selectedProject?.toko?.nama_toko}</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">{selectedProject?.toko?.nomor_ulok} · data ULOK terpilih</p>
                </div>
                {canOpenSource(selectedProject, detail.context) ? (
                  <Button className="h-9 rounded-lg bg-red-600 text-[10px] hover:bg-red-700" onClick={() => onOpenSource(selectedProject, detail.context)}>
                    Buka data ULOK
                  </Button>
                ) : (
                  <p className="max-w-48 text-right text-[9px] leading-relaxed text-slate-400">Detail tidak ditampilkan karena akses role Anda dibatasi.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          projectDetailView ? (
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50">
              {/* Sticky back bar */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
                <button type="button" onClick={() => setProjectDetailView(null)} className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm">
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Kembali ke Daftar
                </button>
                <span className="text-[11px] text-slate-400">/</span>
                <span className="truncate text-[11px] font-semibold text-slate-700">
                  {projectDetailView.__kind === "contractor" ? projectDetailView.nama_kontraktor : projectDetailView.__kind === "beanspot" ? projectDetailView.nama_toko : projectDetailView?.toko?.nama_toko}
                </span>
              </div>

              <div className="p-4 md:p-6">
              {projectDetailView.__kind === "contractor" ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-600">Rincian kontraktor</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">{projectDetailView.nama_kontraktor}</h2>
                    <p className="mt-1 text-sm text-slate-500">{projectDetailView.tokoCount} toko · rata-rata {Number(projectDetailView.nilai).toFixed(1)} poin</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(projectDetailView.stores || []).map((store: any) => (
                      <div key={store.nomor_ulok} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2"><p className="text-[12px] font-bold text-slate-900 leading-tight">{store.nama_toko}</p><p className="shrink-0 text-base font-bold text-emerald-600">{Number(store.nilai).toFixed(1)}</p></div>
                        <p className="mt-1 text-[10px] text-slate-500">{store.nomor_ulok} · {store.cabang}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : projectDetailView.__kind === "beanspot" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-600">Rincian Beanspot</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">{projectDetailView.nama_toko}</h2>
                    <p className="mt-1 text-sm text-slate-500">{projectDetailView.nomor_ulok} · {projectDetailView.cabang}</p>
                    <div className="mt-6 inline-block rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Nilai pekerjaan Beanspot</p>
                      <p className="mt-2 text-3xl font-bold text-emerald-700">{formatRupiah(projectDetailView.nominal)}</p>
                    </div>
                  </div>
                </div>
              ) : (() => {
                const pdStage = getStage(projectDetailView);
                const pdLate = getLateDays(projectDetailView);
                const pdPenalty = getPenalty(projectDetailView);
                const pdQuality = getQuality(opnameItemsMap[projectDetailView?.toko?.id] || []);
                const pdStageColorMap: Record<string, { text: string; bar: string; borderTop: string; bg: string }> = {
                  "Approval RAB":        { text: "text-violet-600", bar: "bg-violet-500", borderTop: "border-t-violet-500", bg: "bg-violet-50" },
                  "Proses Gantt":        { text: "text-sky-600",    bar: "bg-sky-500",    borderTop: "border-t-sky-500",    bg: "bg-sky-50" },
                  "Proses PJU":          { text: "text-amber-600",  bar: "bg-amber-500",  borderTop: "border-t-amber-500",  bg: "bg-amber-50" },
                  "Approval SPK":        { text: "text-emerald-600",bar: "bg-emerald-500",borderTop: "border-t-emerald-500", bg: "bg-emerald-50" },
                  "Ongoing":             { text: "text-red-600",    bar: "bg-red-500",    borderTop: "border-t-red-500",    bg: "bg-red-50" },
                  "Kerja Tambah Kurang": { text: "text-orange-600", bar: "bg-orange-500", borderTop: "border-t-orange-500", bg: "bg-orange-50" },
                };
                const pdStageIconMap: Record<string, typeof HardHat> = {
                  "Approval RAB": FileText, "Proses Gantt": CalendarDays, "Proses PJU": Clock3,
                  "Approval SPK": UserCheck, "Ongoing": HardHat, "Kerja Tambah Kurang": Layers3,
                };
                const pdColors = pdStageColorMap[pdStage] || { text: "text-slate-600", bar: "bg-slate-500", borderTop: "border-t-slate-500", bg: "bg-slate-50" };
                const PdIcon = pdStageIconMap[pdStage] || FileText;
                return (
                  <div className="space-y-4">
                    {/* Hero card */}
                    <div className={`relative overflow-hidden rounded-xl border border-slate-200 border-t-4 ${pdColors.borderTop} bg-white p-5 shadow-sm`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${pdColors.bg}`}>
                          <PdIcon className={`h-5 w-5 ${pdColors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pdColors.bg} ${pdColors.text}`}>{pdStage}</span>
                            {pdLate > 0 && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Terlambat {pdLate} hari</span>}
                          </div>
                          <h2 className="mt-1.5 text-xl font-bold text-slate-900 leading-tight">{projectDetailView?.toko?.nama_toko}</h2>
                          <p className="mt-1 text-[11px] text-slate-500">{projectDetailView?.toko?.nomor_ulok} · {projectDetailView?.toko?.cabang} · {projectDetailView?.toko?.lingkup_pekerjaan || "—"}</p>
                        </div>
                        {canOpenSource(projectDetailView, detail.context) && (
                          <button type="button" onClick={() => onOpenSource(projectDetailView, detail.context)} className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-red-700">
                            Buka ULOK →
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Content grid — full width, 2 cols on large screens */}
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-700">Analisis Risiko &amp; Keterlambatan</p>
                          <ContextInspector project={projectDetailView} context={detail.context} quality={pdQuality} lateDays={pdLate} penalty={pdPenalty} />
                        </div>
                        {pdPenalty.amount > 0 && (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red-600">Denda</p>
                            <p className="text-3xl font-bold tracking-tight text-red-700">{formatRupiah(pdPenalty.amount)}</p>
                            <p className="mt-1 text-[12px] font-medium text-red-600">{pdPenalty.days} hari keterlambatan</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-700">Perjalanan Dokumen</p>
                          <Timeline project={projectDetailView} stage={pdStage} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input value={detailSearch} onChange={(event) => { setDetailSearch(event.target.value); setSelectedIndex(0); }} placeholder="Cari toko, ULOK, cabang, atau kontraktor..." className="h-9 rounded-lg border-slate-200 pl-9 text-[11px]" />
              </div>
              {detail.context === "PROJECT" && !detail.subContext && (
                <div className="w-[160px] shrink-0 pb-1 sm:pb-0">
                  <Select value={detailCategory} onValueChange={(val) => { setDetailCategory(val); setSelectedIndex(0); }}>
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 text-[11px] font-medium focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Semua Tahap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semua" className="text-[11px]">Semua Tahap</SelectItem>
                      {PIPELINE.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-[11px]">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {!["NILAI_KONTRAKTOR", "BEANSPOT"].includes(detail.context) ? (
              <div className="hidden shrink-0 grid-cols-[minmax(200px,1.5fr)_minmax(110px,.7fr)_minmax(110px,.7fr)_minmax(120px,.75fr)_20px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400 lg:grid">
                <span>TOKO / IDENTITAS</span><span>{columnLabels[0]}</span><span>{columnLabels[1]}</span><span className="text-right">{columnLabels[2]}</span><span />
              </div>
            ) : null}

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-auto">
              {searchedRows.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                  <Search className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">Data tidak ditemukan</p>
                  <p className="mt-1 text-[11px] text-slate-400">Coba ubah pencarian atau kembali ke ringkasan.</p>
                </div>
              ) : (
                searchedRows.map((row: any, index) => {
                  if (row.__kind === "contractor") {
                    return (
                      <button key={row.nama_kontraktor} type="button" onClick={() => { setSelectedIndex(index); setProjectDetailView(row); }} className="group grid w-full grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-4 py-4 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626]">
                        <div><p className="text-[12px] font-semibold text-slate-900 transition-colors group-hover:text-red-700">{row.nama_kontraktor}</p><p className="mt-1 text-[10px] text-slate-400">{row.tokoCount} toko dinilai</p></div>
                        <div className="flex items-center gap-2"><p className="text-lg font-semibold text-slate-950">{Number(row.nilai).toFixed(1)}</p><ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-500" /></div>
                      </button>
                    );
                  }
                  if (row.__kind === "beanspot") {
                    return (
                      <button key={`${row.nomor_ulok}-${index}`} type="button" onClick={() => { setSelectedIndex(index); setProjectDetailView(row); }} className="group grid w-full grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-4 py-4 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626]">
                        <div><p className="text-[12px] font-semibold text-slate-900 transition-colors group-hover:text-red-700">{row.nama_toko}</p><p className="mt-1 text-[10px] text-slate-400">{row.nomor_ulok} · {row.cabang}</p></div>
                        <div className="flex items-center gap-2"><p className="text-[12px] font-semibold text-slate-950">{formatRupiah(row.nominal)}</p><ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-500" /></div>
                      </button>
                    );
                  }
                  const stage = getStage(row);
                  const late = getLateDays(row);
                  const penalty = getPenalty(row);
                  const quality = getQuality(opnameItemsMap[row?.toko?.id] || []);
                  const cells = getContextCells(row, detail.context, stage, late, penalty, quality);
                  return (
                    <button
                      key={row?.toko?.id || `${row?.toko?.nomor_ulok}-${index}`}
                      type="button"
                      onClick={() => { setSelectedIndex(index); setProjectDetailView(row); }}
                      className="group flex flex-col gap-3 lg:grid w-full lg:grid-cols-[minmax(200px,1.5fr)_minmax(110px,.7fr)_minmax(110px,.7fr)_minmax(120px,.75fr)_20px] lg:items-center border-b border-slate-100 px-4 py-3.5 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626]"
                    >
                      <div className="min-w-0 flex items-center justify-between lg:block">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-900 transition-colors group-hover:text-red-700">{row?.toko?.nama_toko || "-"}</p>
                          <p className="mt-1 truncate text-[9px] text-slate-400">{row?.toko?.nomor_ulok || "-"} · {row?.toko?.cabang || "-"} · {row?.toko?.lingkup_pekerjaan || "-"}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 lg:hidden transition-colors group-hover:text-red-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:contents">
                        {cells.map((cell, cellIndex) => (
                          <div key={`${row?.toko?.id}-${cellIndex}`} className={`min-w-0 rounded-md bg-slate-50/50 p-2 lg:bg-transparent lg:p-0 ${cellIndex === 2 ? "lg:text-right" : ""}`}>
                            <p className="mb-0.5 text-[8px] font-medium uppercase tracking-wider text-slate-400 lg:hidden">{columnLabels[cellIndex]}</p>
                            <p className={`truncate text-[10px] font-semibold ${cell.danger ? "text-red-700" : "text-slate-700"}`}>{cell.value}</p>
                            <p className="mt-1 truncate text-[9px] text-slate-400">{cell.helper}</p>
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="hidden lg:block h-4 w-4 text-slate-300 transition-colors group-hover:text-red-500" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
          )
        )}
      </div>
    );
  }

  const primaryKpis = isCompanyScoped
    ? [
        ["Total proyek", stats.total, "Seluruh toko dalam cakupan", "PROJECT", "neutral"],
        ["Prioritas SLA", slaPriorityProjects.length, "Tahap yang melewati batas waktu atau berisiko", "ATTENTION", "danger"],
        ["Nilai penawaran", formatRupiah(stats.penawaran), "Grand total final", "PENAWARAN", "neutral"],
        ["Nilai SPK", formatRupiah(stats.spk), "SPK perusahaan", "SPK", "neutral"],
        ["Denda", formatRupiah(stats.totalDenda), "", "DENDA", "danger"],
      ]
    : [
        ["Total proyek", stats.total, isGlobalView ? "Seluruh cabang pada filter" : `Cabang ${cabang}`, "PROJECT", "neutral"],
        ["Prioritas SLA", slaPriorityProjects.length, "Tahap yang melewati batas waktu atau berisiko", "ATTENTION", "danger"],
        ["Nilai SPK", formatRupiah(stats.spk), "Seluruh SPK non-ditolak", "SPK", "neutral"],
        ["Nilai penawaran", formatRupiah(stats.penawaran), "Grand total final penawaran aktif", "PENAWARAN", "neutral"],
        ["Denda", formatRupiah(stats.totalDenda), "", "DENDA", "danger"],
      ];

  const insightItems = [
    { label: "JHK pekerjaan", value: `${stats.avgJHK} hari`, context: "JHK", icon: CalendarDays },
    { label: "Keterlambatan", value: `${stats.avgDelay} hari`, context: "DELAY", icon: Clock3 },
    { label: "Nilai toko", value: `${stats.avgNilaiToko} poin`, context: "NILAI_TOKO", icon: Tag },
    { label: "Nilai kontraktor", value: `${stats.avgNilaiKontraktor} poin`, context: "NILAI_KONTRAKTOR", icon: UserCheck },
  ];
  const completeMetrics: Array<{ label: string; value: string | number; helper: string; context: string; subContext?: string; icon: typeof HardHat }> = [
    { label: "Ongoing", value: stats.miniStats.Ongoing, helper: "Sudah SPK dan masih berjalan", context: "PROJECT", subContext: "Ongoing", icon: HardHat },
    { label: "Done / ST", value: stats.miniStats.Done, helper: "Pekerjaan selesai", context: "PROJECT", subContext: "Done", icon: CheckCircle2 },
    { label: "SPK", value: formatRupiah(stats.spk), helper: "Nilai komitmen kerja", context: "SPK", icon: DollarSign },
    { label: "Denda", value: formatRupiah(stats.totalDenda), helper: "", context: "DENDA", icon: AlertTriangle },
    { label: "Cost/m² bangunan", value: formatRupiah(stats.avgCostBangunan), helper: "Rata-rata luas bangunan", context: "COST_M2", icon: Ruler },
    { label: "Cost/m² terbuka", value: formatRupiah(stats.avgCostTerbuka), helper: "Rata-rata area terbuka", context: "COST_M2", icon: Layers3 },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-slate-50 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-400">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-red-600">{isGlobalView ? "Monitoring nasional" : "Ruang kerja operasional"}</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">Selamat datang, {userName.split(" ")[0] || "Pengguna"}.</h1>
            <p className="mt-1 text-[11px] text-slate-500">{isGlobalView ? "Ringkasan prioritas, nilai, dan kondisi proyek lintas cabang." : `Fokus pekerjaan dan proyek aktif cabang ${cabang}.`}</p>
          </div>
          <p className="text-[10px] text-slate-400">Data dashboard mengikuti filter aktif</p>
        </div>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {primaryKpis.map(([label, value, helper, context, tone]) => {
            let subMetrics: { label: string; value: string | number }[] | undefined = undefined;
            if (context === "PROJECT") {
              subMetrics = [
                { label: "Selesai", value: stats.miniStats["Done"] || 0 },
                { label: "Aktif", value: stats.miniStats["Ongoing"] || 0 },
                { label: "Review SPK", value: stats.miniStats["Approval SPK"] || 0 },
              ];
            } else if (context === "ATTENTION") {
              subMetrics = [
                { label: "PJU", value: stats.miniPerhatian?.["Proses PJU"] || 0 },
                { label: "SPK", value: stats.miniPerhatian?.["Approval SPK"] || 0 },
                { label: "Ongoing", value: stats.miniPerhatian?.["Ongoing"] || 0 },
              ];
            } else if (context === "PENAWARAN") {
              subMetrics = [
                { label: "Total RAB", value: stats.total },
                { label: "Review RAB", value: stats.miniStats["Approval RAB"] || 0 },
                { label: "Selesai", value: stats.miniStats["Done"] || 0 },
              ];
            } else if (context === "SPK") {
              subMetrics = [
                { label: "Total SPK", value: stats.total },
                { label: "Aktif", value: stats.miniStats["Ongoing"] || 0 },
                { label: "Review SPK", value: stats.miniStats["Approval SPK"] || 0 },
              ];
            } else if (context === "DENDA") {
              subMetrics = [
                { label: "Terlambat", value: stats.dendaTerlambat || 0 },
                { label: "Kritis", value: stats.dendaKritis || 0 },
                { label: "Aman", value: stats.dendaAman || 0 },
              ];
            } else if (context === "DENDA") {
              const kritis = priorityProjects.filter((item: any) => item.lateDays > 3).length;
              subMetrics = [
                { label: "Terlambat", value: slaPriorityProjects.length },
                { label: "Kritis", value: kritis },
                { label: "Aman", value: Math.max(0, stats.total - slaPriorityProjects.length) },
              ];
            }

            return (
              <DashboardMetric
                key={String(label)}
                label={String(label)}
                value={value as string | number}
                helper={String(helper)}
                tone={tone as "neutral" | "danger"}
                onClick={() => onOpenDetail(String(label), String(context))}
                subMetrics={subMetrics}
              />
            );
          })}
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.72fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h2 className="text-sm font-semibold text-slate-950">Alur proyek</h2><p className="mt-1 text-[10px] text-slate-400">Distribusi toko pada setiap tahap pekerjaan</p></div>
              <button type="button" className="text-[9px] font-semibold text-red-600" onClick={() => onOpenDetail("Semua proyek", "PROJECT")}>LIHAT SEMUA →</button>
            </div>
            <div className="px-5 py-1">
              {PIPELINE.map((stage, index) => {
                const value = stats.miniStats[stage] ?? 0;
                const attention = slaPriorityProjects.filter((item) => item.stage === stage).length;
                const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
                return (
                  <button key={stage} type="button" onClick={() => onOpenDetail(stage, "PROJECT", stage)} className="group grid w-full grid-cols-[30px_minmax(120px,1fr)_90px_54px_16px] items-center gap-3 border-b border-slate-100 px-2 py-3.5 text-left transition-all last:border-0 hover:bg-red-50 hover:text-red-700 hover:shadow-[inset_3px_0_0_#dc2626]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                    <span><span className="block text-[11px] font-medium">{stage}</span><span className={`mt-1 block text-[9px] ${attention > 0 ? "text-red-600" : "text-slate-400"}`}>{attention > 0 ? `${attention} toko melewati ketentuan waktu` : "Semua toko masih dalam ketentuan waktu"}</span></span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${attention > 0 ? "bg-red-600" : "bg-emerald-600"}`} style={{ width: `${Math.max(value > 0 ? 4 : 0, pct)}%` }} /></span>
                    <span className="text-right text-[11px] font-semibold text-slate-800">{value}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                );
              })}
            </div>
          </section>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div><h2 className="text-sm font-semibold text-slate-950">Prioritas teratas</h2><p className="mt-1 text-[10px] text-slate-400">Urut berdasarkan dampak dan keterlambatan</p></div>
                <button type="button" className="text-[9px] font-semibold text-red-600" onClick={() => onOpenDetail("Perlu tindakan", "ATTENTION")}>SEMUA</button>
              </div>
              <div className="px-4 py-1">
                {slaPriorityProjects.length === 0 ? (
                  <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-[11px] font-medium text-slate-700">Tidak ada proyek prioritas</p></div>
                ) : slaPriorityProjects.slice(0, 5).map(({ project, stage, sla, penalty }) => (
                  <button key={project?.toko?.id || project?.toko?.nomor_ulok} type="button" onClick={() => onOpenDetail("Prioritas SLA", "ATTENTION", stage)} className="group grid w-full grid-cols-[4px_1fr_auto] gap-3 border-b border-slate-100 px-2 py-3 text-left transition-all last:border-0 hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626]">
                    <span className={`rounded-full ${sla.tone === "critical" ? "bg-red-700" : "bg-amber-500"}`} />
                    <span><span className="block truncate text-[10px] font-semibold text-slate-800">{project?.toko?.nama_toko || "-"}</span><span className="mt-1 block text-[9px] leading-relaxed text-slate-400">{stage} · {sla.helper}</span></span>
                    <Badge className="border-red-100 bg-red-50 text-[8px] font-medium text-red-700">{penalty.amount > 0 ? formatRupiah(penalty.amount) : sla.label}</Badge>
                  </button>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-950">Nilai pekerjaan</h2><p className="mt-1 text-[10px] text-slate-400">Komitmen biaya dan kualitas</p></div>
              <div className="grid grid-cols-2 gap-px bg-slate-200">
                {insightItems.filter((item) => !isCompanyScoped || !["NILAI_KONTRAKTOR", "BEANSPOT"].includes(item.context)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.context} type="button" onClick={() => onOpenDetail(item.label, item.context)} className="group bg-white p-3.5 text-left transition-all hover:bg-red-50 hover:shadow-[inset_0_-3px_0_#dc2626]">
                      <Icon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-red-600" />
                      <p className="mt-3 text-[9px] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-900">{item.value}</p>
                    </button>
                  );
                })}
              </div>
              {!isCompanyScoped ? (
                <button type="button" onClick={() => onOpenDetail("Cost per m²", "COST_M2")} className="group flex w-full items-center justify-between border-t border-slate-200 px-4 py-3 text-left transition-all hover:bg-red-50 hover:shadow-[inset_0_-3px_0_#dc2626]">
                  <span><span className="block text-[9px] text-slate-400">Cost/m² terbangun</span><span className="mt-1 block text-[11px] font-semibold text-slate-900">{formatRupiah(stats.avgCostTerbangun)}</span></span>
                  <Layers3 className="h-4 w-4 text-slate-400" />
                </button>
              ) : null}
            </section>
          </div>
        </div>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-semibold text-slate-950">Ringkasan lengkap</h2><p className="mt-1 text-[10px] text-slate-400">Seluruh data dashboard lama tetap tersedia dan dapat dibuka.</p></div>
            <Badge className="w-fit border-red-100 bg-red-50 text-[9px] font-medium text-red-700">Klik data untuk rincian</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {completeMetrics
              .filter((item) => !isCompanyScoped || !["NILAI_KONTRAKTOR", "BEANSPOT", "COST_M2"].includes(item.context))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.label}-${item.subContext || ""}`}
                    type="button"
                    onClick={() => onOpenDetail(item.label, item.context, item.subContext)}
                    className="group min-h-27 border-b border-r border-slate-100 p-4 text-left transition-all hover:bg-red-50 hover:shadow-[inset_0_-3px_0_#dc2626]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors group-hover:border-red-200 group-hover:bg-white group-hover:text-red-600"><Icon className="h-4 w-4" /></span>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-500" />
                    </div>
                    <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.07em] text-slate-400 group-hover:text-red-500">{item.label}</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-900 transition-colors group-hover:text-red-800">{item.value}</p>
                    <p className="mt-1 text-[9px] text-slate-400">{item.helper}</p>
                  </button>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}
