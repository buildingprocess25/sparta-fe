"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useMemo, useState } from "react";
import {
  ArrowLeft,
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

const PIPELINE = ["Approval RAB", "Proses Gantt", "Proses PJU", "Approval SPK", "Ongoing", "Kerja Tambah Kurang", "Done"];

const contextLabels: Record<string, string> = {
  PROJECT: "Status proyek",
  ATTENTION: "Perlu tindakan",
  PENAWARAN: "Nilai penawaran",
  SPK: "Nilai SPK",
  DENDA: "Risiko dan denda",
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

  if (context === "ATTENTION") return [
    { value: stage, helper: penalty.amount > 0 ? `Denda ${penalty.source}` : "Melewati SLA", danger: true },
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
    { value: penalty.source, helper: penalty.source === "Resmi" ? "Opname final" : "Kalkulasi SPK", danger: true },
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
  if (context === "COST_M2") return [
    { value: opname ? "Opname" : "RAB", helper: formatRupiah(totalCost) },
    { value: `${area} m²`, helper: `Bangunan ${Number(rab?.luas_bangunan || 0)} m²` },
    { value: formatRupiah(area > 0 ? totalCost / area : 0), helper: "Area terbangun" },
  ];
  const sla = getSlaInfo(project, stage, lateDays);
  return [
    { value: stage, helper: project?.toko?.lingkup_pekerjaan || "-" },
    { value: sla.label, helper: sla.helper, danger: sla.priority },
    { value: formatRupiah(spk?.grand_total || rab?.grand_total_final || 0), helper: penalty.amount > 0 ? `Denda ${formatRupiah(penalty.amount)}` : "Nilai terakhir" },
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

const SLA_LIMITS: Record<string, number> = {
  "Approval RAB": 2,
  "Proses Gantt": 2,
  "Proses PJU": 10,
  "Approval SPK": 2,
  Ongoing: 0,
  "Kerja Tambah Kurang": 14,
};

const getStageStartDate = (project: any, stage: string) => {
  const rab = firstRab(project);
  const spk = firstSpk(project);
  const opname = firstOpname(project);
  if (stage === "Approval RAB" || stage === "Proses Gantt") return rab?.created_at;
  if (stage === "Proses PJU") return rab?.waktu_persetujuan_manager || rab?.updated_at || rab?.created_at;
  if (stage === "Approval SPK") return spk?.created_at;
  if (stage === "Ongoing") return spk?.waktu_mulai || spk?.created_at;
  if (stage === "Kerja Tambah Kurang") return opname?.created_at;
  return project?.toko?.created_at;
};

const getSlaInfo = (project: any, stage: string, lateDays: number) => {
  if (stage === "Done") {
    return { label: "Selesai", helper: "Proyek telah ditutup", priority: false, tone: "done" as const };
  }
  if (stage === "Ongoing") {
    if (lateDays > 0) return { label: "Perlu Tindakan", helper: `Melewati target SPK selama ${lateDays} hari`, priority: true, tone: "critical" as const };
    return { label: "Dalam Target", helper: "Masih dalam durasi SPK", priority: false, tone: "safe" as const };
  }
  const limit = SLA_LIMITS[stage] ?? 0;
  const startDate = getStageStartDate(project, stage);
  const start = startDate ? new Date(startDate) : null;
  const age = start && !Number.isNaN(start.getTime())
    ? Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000))
    : 0;
  const exceeded = Math.max(0, age - limit);
  if (exceeded > 0) return { label: "Perlu Tindakan", helper: `Berjalan ${age} hari (batas ${limit} hari)`, priority: true, tone: "critical" as const };
  if (limit > 0 && age >= Math.max(1, limit - 1)) return { label: "Mendekati Batas", helper: `Sudah berjalan ${age} hari`, priority: false, tone: "warning" as const };
  return { label: "Aman", helper: limit > 0 ? `Berjalan ${age} hari` : "Belum ada ketentuan batas", priority: false, tone: "safe" as const };
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
    return { label: `Denda ${penalty.source}`, value: formatRupiah(penalty.amount), helper: `${penalty.days} hari` };
  }
  if (context === "JHK") return { label: "JHK efektif", value: `${Number(spk?.durasi || 0)} hari`, helper: "Durasi SPK dan tambah hari" };
  if (context === "DELAY") return { label: "Keterlambatan", value: `${getLateDays(project)} hari`, helper: spk?.waktu_selesai || "Target belum tersedia" };
  if (context === "NILAI_TOKO") return { label: "Nilai toko", value: `${quality.total.toFixed(1)} poin`, helper: `D ${quality.desain.toFixed(1)} · K ${quality.kualitas.toFixed(1)} · S ${quality.spesifikasi.toFixed(1)}` };
  if (context === "COST_M2") {
    const area = Number(rab?.luas_terbangun || 0);
    const total = Number(opname?.grand_total_opname || rab?.grand_total_final || 0);
    return { label: "Cost terbangun", value: formatRupiah(area > 0 ? total / area : 0), helper: `${area || 0} m² · ${opname ? "Opname" : "RAB"}` };
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
        {infoBox("Nilai denda", formatRupiah(penalty.amount), penalty.source, penalty.amount > 0)}
        {infoBox("Target SPK", date(spk?.waktu_selesai))}
        {infoBox("Serah terima", st ? date(st.created_at) : "Belum tersedia", undefined, !st)}
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-3"><p className="text-[9px] font-semibold text-red-800">Dasar perhitungan</p><p className="mt-2 text-[9px] leading-relaxed text-red-700">{penalty.source === "Resmi" ? "Nilai berasal dari denda pada opname final." : "Estimasi dihitung dari target SPK efektif sampai serah terima atau tanggal hari ini."}</p></div>
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
    const total = Number(opname?.grand_total_opname || rab?.grand_total_final || 0);
    const areaTerbangun = Number(rab?.luas_terbangun || 0);
    const areaBangunan = Number(rab?.luas_bangunan || 0);
    const areaTerbuka = Number(rab?.luas_area_terbuka || 0);
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">{infoBox("Sumber", opname ? "Opname" : "RAB")}{infoBox("Total biaya", formatRupiah(total))}</div>
        <div className="space-y-2">
          {[["Area terbangun", areaTerbangun], ["Bangunan", areaBangunan], ["Area terbuka", areaTerbuka]].map(([label, area]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><p className="text-[9px] text-slate-400">{label}</p><p className="mt-1 text-[10px] font-medium">{Number(area)} m²</p></div><p className="text-[12px] font-semibold text-red-700">{formatRupiah(Number(area) > 0 ? total / Number(area) : 0)}</p></div>
          ))}
        </div>
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

  if (context === "SPK") {
    const total = rows.reduce((sum, row) => sum + Number(firstSpk(row)?.grand_total || 0), 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fff8f8] p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText className="h-5 w-5"/></span><p className="mt-6 text-[9px] uppercase tracking-[.14em] text-red-500">Register kontrak aktif</p><p className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</p><div className="mt-6 border-t border-red-100 pt-5"><p className="text-[9px] text-slate-400">Total komitmen</p><p className="mt-1 text-xl font-semibold text-red-700">{formatRupiah(total)}</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((row,index)=>{const spk=firstSpk(row);const extra=getApprovedExtensions(row).reduce((sum:number,item:any)=>sum+Number(item?.pertambahan_hari||0),0);return <button key={row?.toko?.id||index} type="button" onClick={()=>onSelect(index)} className={`rounded-2xl border bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md ${selectedIndex===index?"border-red-500 shadow-md":"border-slate-200"}`}><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-600">{spk?.nomor_spk||"SPK"}</span><span className="text-[9px] font-medium text-emerald-700">{spk?.status}</span></div><p className="mt-4 text-[12px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{spk?.nama_kontraktor||row?.toko?.nama_kontraktor}</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3"><div><p className="text-[8px] text-slate-400">PERIODE</p><p className="mt-1 text-[9px] font-medium">{formatDashboardDate(spk?.waktu_mulai)} – {formatDashboardDate(spk?.waktu_selesai)}</p></div><div className="text-right"><p className="text-[8px] text-slate-400">DURASI</p><p className="mt-1 text-[9px] font-medium">{Number(spk?.durasi||0)+extra} hari</p></div></div><p className="mt-4 text-lg font-semibold text-red-800">{formatRupiah(spk?.grand_total||0)}</p></button>})}
          </div>
        </div>
        {project ? <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><ContextInspector project={project} context="SPK" quality={getQuality(opnameItemsMap[project?.toko?.id] || [])} lateDays={getLateDays(project)} penalty={getPenalty(project)} /></div> : null}
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
              <button key={row?.toko?.id || index} type="button" onClick={() => onSelect(index)} className={`grid w-full grid-cols-[1.25fr_.8fr_.8fr_.8fr] items-center border-t border-orange-100 px-5 py-4 text-left transition-all hover:bg-red-50 ${selectedIndex === index ? "bg-red-50 shadow-[inset_4px_0_0_#dc2626]" : ""}`}>
                <span><span className="block text-[11px] font-semibold text-slate-900">{row?.toko?.nama_toko}</span><span className="mt-1 block text-[9px] text-slate-400">{row?.toko?.nomor_ulok} · {context === "PENAWARAN" ? rab?.nama_pt : spk?.nama_kontraktor}</span></span>
                <span className="text-[10px] font-medium text-slate-700">{context === "PENAWARAN" ? rab?.status : spk?.status}</span>
                <span className="text-[9px] text-slate-500">{context === "PENAWARAN" ? formatDashboardDate(rab?.created_at) : `${formatDashboardDate(spk?.waktu_mulai)} – ${formatDashboardDate(spk?.waktu_selesai)}`}</span>
                <span className="text-right text-[12px] font-semibold text-red-800">{formatRupiah(value || 0)}</span>
              </button>
            );
          })}
        </div>
        {project ? <div className="mt-4 rounded-2xl border border-orange-200 bg-white p-5"><ContextInspector project={project} context={context} quality={getQuality(opnameItemsMap[project?.toko?.id] || [])} lateDays={getLateDays(project)} penalty={getPenalty(project)} /></div> : null}
      </div>
    );
  }

  if (context === "DENDA") {
    const totalPenalty = rows.reduce((sum, row) => sum + getPenalty(row).amount, 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fff5f5] p-4 md:p-6">
        <div className="rounded-2xl bg-linear-to-r from-red-800 to-red-600 p-6 text-white">
          <p className="text-[9px] uppercase tracking-[.14em] text-red-100">Eksposur denda portfolio</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><p className="text-3xl font-semibold">{formatRupiah(totalPenalty)}</p><p className="text-[10px] text-red-100">{rows.length} toko memiliki denda resmi atau estimasi</p></div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-red-200 bg-white">
          <div className="grid grid-cols-[1.2fr_.7fr_.7fr_.8fr] bg-red-50 px-5 py-3 text-[8px] font-semibold uppercase tracking-[.08em] text-red-800"><span>Toko</span><span>Sumber</span><span>Hari terlambat</span><span className="text-right">Nilai denda</span></div>
          {rows.map((row,index)=>{const penalty=getPenalty(row);return <button key={row?.toko?.id||index} type="button" onClick={()=>onSelect(index)} className={`grid w-full grid-cols-[1.2fr_.7fr_.7fr_.8fr] items-center border-t border-red-100 px-5 py-4 text-left transition-all hover:bg-red-50 ${selectedIndex===index?"bg-red-50 shadow-[inset_4px_0_0_#dc2626]":""}`}><span><span className="block text-[11px] font-semibold">{row?.toko?.nama_toko}</span><span className="mt-1 block text-[9px] text-slate-400">{row?.toko?.nomor_ulok} · {row?.toko?.cabang}</span></span><span className="text-[10px] font-medium text-red-700">{penalty.source}</span><span className="text-[11px] font-semibold text-red-800">{penalty.days} hari</span><span className="text-right text-[13px] font-semibold text-red-900">{formatRupiah(penalty.amount)}</span></button>})}
        </div>
        {project ? <div className="mt-4 rounded-2xl border border-red-200 bg-white p-5"><ContextInspector project={project} context="DENDA" quality={getQuality(opnameItemsMap[project?.toko?.id] || [])} lateDays={getLateDays(project)} penalty={getPenalty(project)} /></div> : null}
      </div>
    );
  }

  if (context === "DELAY") {
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
        <div className="mb-4"><h2 className="text-lg font-semibold text-slate-950">Peta keterlambatan</h2><p className="mt-1 text-[10px] text-slate-400">Bandingkan target SPK dengan kondisi serah terima.</p></div>
        <div className="space-y-3">
          {rows.map((row,index)=>{const spk=firstSpk(row);const st=Array.isArray(row?.berkas_serah_terima)?row.berkas_serah_terima[0]:row?.berkas_serah_terima;const late=getLateDays(row);return <button key={row?.toko?.id||index} type="button" onClick={()=>onSelect(index)} className={`w-full rounded-2xl border bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 ${selectedIndex===index?"border-red-500 shadow-[inset_4px_0_0_#dc2626]":"border-slate-200"}`}><div className="grid gap-4 lg:grid-cols-[220px_1fr_90px] lg:items-center"><div><p className="text-[11px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{row?.toko?.cabang} · {getStage(row)}</p></div><div className="relative pt-4"><div className="h-1.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-600" style={{width:`${Math.min(100,Math.max(8,late*7))}%`}}/></div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Target {formatDashboardDate(spk?.waktu_selesai)}</span><span>{st?`ST ${formatDashboardDate(st.created_at)}`:"Belum ST"}</span></div></div><p className="text-right text-2xl font-semibold text-red-700">{late}<span className="ml-1 text-[9px] font-normal text-slate-400">hari</span></p></div></button>})}
        </div>
      </div>
    );
  }

  if (context === "ATTENTION") {
    // Defined first so both branches (detail page + list) can access them
    const stageIconMap: Record<string, typeof HardHat> = {
      "Approval RAB": FileText,
      "Proses Gantt": CalendarDays,
      "Proses PJU": Clock3,
      "Approval SPK": UserCheck,
      "Ongoing": HardHat,
      "Kerja Tambah Kurang": Layers3,
    };
    const stageColorMap: Record<string, { bg: string; icon: string; text: string; bar: string; border: string }> = {
      "Approval RAB":        { bg: "from-violet-50 to-white",  icon: "bg-violet-100 text-violet-600",  text: "text-violet-700",  bar: "bg-violet-500",  border: "border-violet-100"  },
      "Proses Gantt":        { bg: "from-sky-50 to-white",     icon: "bg-sky-100 text-sky-600",        text: "text-sky-700",     bar: "bg-sky-500",     border: "border-sky-100"     },
      "Proses PJU":          { bg: "from-amber-50 to-white",   icon: "bg-amber-100 text-amber-600",    text: "text-amber-700",   bar: "bg-amber-500",   border: "border-amber-100"   },
      "Approval SPK":        { bg: "from-emerald-50 to-white", icon: "bg-emerald-100 text-emerald-600",text: "text-emerald-700", bar: "bg-emerald-500", border: "border-emerald-100" },
      "Ongoing":             { bg: "from-red-50 to-white",     icon: "bg-red-100 text-red-600",        text: "text-red-700",     bar: "bg-red-500",     border: "border-red-100"     },
      "Kerja Tambah Kurang": { bg: "from-orange-50 to-white",  icon: "bg-orange-100 text-orange-600",  text: "text-orange-700",  bar: "bg-orange-500",  border: "border-orange-100"  },
    };

    // ── Project detail full-page view ──────────────────────────────────────────
    if (selectedProjectDetail) {
      const p = selectedProjectDetail;
      const pStage = getStage(p);
      const pLate = getLateDays(p);
      const pPenalty = getPenalty(p);
      const pQuality = getQuality(opnameItemsMap[p?.toko?.id] || []);
      const colors = stageColorMap[pStage] || { bg: "from-slate-50 to-white", icon: "bg-slate-100 text-slate-600", text: "text-slate-600", bar: "bg-slate-400", border: "border-slate-100" };
      const Icon = stageIconMap[pStage] || FileText;
      return (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {/* Back button + breadcrumb */}
          <button type="button" onClick={() => onBackFromProject()} className="group mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <ArrowLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-[11px] font-semibold text-slate-600">Kembali ke Prioritas SLA</span>
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{p?.toko?.nama_toko}</span>
          </button>

          {/* Hero project header */}
          <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-6 shadow-sm`}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.06] bg-current" />
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colors.icon}`}>{pStage}</span>
                  {pLate > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[9px] font-bold text-red-700">Terlambat {pLate} hari</span>}
                </div>
                <h2 className="mt-2 text-xl font-black text-slate-900 leading-tight">{p?.toko?.nama_toko}</h2>
                <p className="mt-1 text-[11px] text-slate-500">{p?.toko?.nomor_ulok} · {p?.toko?.cabang} · {p?.toko?.lingkup_pekerjaan || "—"}</p>
              </div>
              {canOpenSource && canOpenSource(p, context) && (
                <button type="button" onClick={() => onOpenSource(p, context)} className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md">
                  Buka ULOK →
                </button>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Left: context inspector */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">Analisis Risiko & Keterlambatan</p>
                <ContextInspector project={p} context={context} quality={pQuality} lateDays={pLate} penalty={pPenalty} />
              </div>
            </div>
            {/* Right: timeline + penalty */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Perjalanan Dokumen</p>
                <Timeline project={p} stage={pStage} />
              </div>
              {pPenalty.amount > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">Denda {pPenalty.source}</p>
                  <p className="text-3xl font-black text-red-700">{formatRupiah(pPenalty.amount)}</p>
                  <p className="mt-1 text-[11px] text-red-500">{pPenalty.days} hari keterlambatan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const stageBreakdown = PIPELINE.filter(s => s !== "Done").map(stage => ({
      stage,
      count: rows.filter((row) => getStage(row) === stage).length,
      lateDays: rows.filter((row) => getStage(row) === stage).reduce((sum, row) => sum + getLateDays(row), 0),
    })).filter(s => s.count > 0);
    const maxCount = Math.max(...stageBreakdown.map(s => s.count), 1);
    const totalExposure = rows.reduce((sum, row) => sum + getPenalty(row).amount, 0);
    const totalLate = rows.reduce((sum, row) => sum + getLateDays(row), 0);
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50/80 p-4 md:p-6">
        {/* Hero summary bar */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-red-200 bg-gradient-to-br from-red-700 to-red-900 p-5 text-white shadow-lg shadow-red-200/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6 text-red-100" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-200">Total Proyek Bermasalah</p>
              <p className="mt-1 text-3xl font-black tracking-tight">{rows.length}</p>
              <p className="mt-0.5 text-[11px] text-red-200">tersebar di {stageBreakdown.length} tahap pipeline</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Clock3 className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-[10px] font-semibold text-slate-500">Total Hari Terlambat</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalLate.toLocaleString("id-ID")}</p>
              <p className="text-[10px] text-slate-400">hari akumulasi</p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <DollarSign className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-[10px] font-semibold text-slate-500">Eksposur Denda</p>
            </div>
            <div>
              <p className="text-lg font-black text-red-700 leading-tight">{formatRupiah(totalExposure)}</p>
              <p className="text-[10px] text-slate-400">estimasi &amp; resmi</p>
            </div>
          </div>
        </div>

        {/* Stage breakdown cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stageBreakdown.map(({ stage, count, lateDays: stageLate }) => {
            const Icon = stageIconMap[stage] || FileText;
            const colors = stageColorMap[stage] || { bg: "from-slate-50 to-white", icon: "bg-slate-100 text-slate-600", text: "text-slate-600", bar: "bg-slate-400", border: "border-slate-100" };
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={stage} className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-5 shadow-sm transition-all hover:shadow-md`}>
                {/* Decorative circle */}
                <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.08] ${colors.bar}`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.icon}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className={`text-[10px] font-bold ${colors.text}`}>{pct}%</span>
                  </div>
                  <p className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{stage}</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900">{count}</span>
                    <span className="text-sm font-medium text-slate-400">toko</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  {stageLate > 0 && (
                    <p className={`mt-2.5 text-[10px] font-semibold ${colors.text}`}>
                      ⏱ {stageLate.toLocaleString("id-ID")} hari keterlambatan
                    </p>
                  )}
                </div>
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

        {/* Project cards — clicking navigates to full detail */}
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => {
            const penalty = getPenalty(row); const late = getLateDays(row); const stage = getStage(row); const sla = getSlaInfo(row, stage, late);
            const colors = stageColorMap[stage] || { border: "border-slate-200", bg: "from-slate-50 to-white", icon: "bg-slate-100 text-slate-600", text: "text-slate-600", bar: "bg-slate-400" };
            const Icon = stageIconMap[stage] || FileText;
            return (
              <button key={row?.toko?.id || index} type="button" onClick={() => onOpenProjectDetail(row)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                {/* Stage accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${colors.bar}`} />
                {/* Hover shimmer */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative pl-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </div>
                  <p className="mt-3 text-[12px] font-bold text-slate-900 leading-snug line-clamp-1">{row?.toko?.nama_toko}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{row?.toko?.nomor_ulok} · {row?.toko?.cabang}</p>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${colors.icon}`}>{stage}</span>
                    {late > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">{late} hari terlambat</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[9px] text-slate-400">{penalty.amount > 0 ? `Denda ${penalty.source}` : sla.helper.substring(0, 30) + "..."}</span>
                    <span className={`text-[11px] font-black ${penalty.amount > 0 ? "text-red-700" : colors.text}`}>
                      {penalty.amount > 0 ? formatRupiah(penalty.amount) : "Lihat →"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
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
          {rows.map((row,index) => {
            if (row.__kind === "beanspot") return <button key={`${row.nomor_ulok}-${index}`} type="button" onClick={()=>onSelect(index)} className="rounded-2xl border border-emerald-200 bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md"><Coffee className="h-5 w-5 text-emerald-700"/><p className="mt-4 text-[12px] font-semibold">{row.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{row.nomor_ulok} · {row.cabang}</p><p className="mt-5 text-xl font-semibold text-emerald-900">{formatRupiah(row.nominal)}</p></button>;
            const rab=firstRab(row); const opname=firstOpname(row); const total=Number(opname?.grand_total_opname||rab?.grand_total_final||0); const area=Number(rab?.luas_terbangun||0);
            return <button key={row?.toko?.id||index} type="button" onClick={()=>onSelect(index)} className="rounded-2xl border border-emerald-200 bg-white p-5 text-left transition-all hover:border-red-400 hover:bg-red-50 hover:shadow-md"><div className="flex items-center justify-between"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Ruler className="h-4 w-4"/></span><span className="text-[8px] text-slate-400">{opname?"OPNAME":"RAB"}</span></div><p className="mt-4 text-[12px] font-semibold">{row?.toko?.nama_toko}</p><p className="mt-1 text-[9px] text-slate-400">{area} m² · {formatRupiah(total)}</p><p className="mt-5 text-xl font-semibold text-emerald-900">{formatRupiah(area>0?total/area:0)}<span className="ml-1 text-[9px] font-normal text-slate-400">/m²</span></p></button>;
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
      const penaltyProjects = projects.filter((project) => getPenalty(project).amount > 0);
      const byStore = new Map<string, { project: any; penalty: any; createdAt: number }>();
      penaltyProjects.forEach((project) => {
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
      return Array.from(byStore.values()).map((entry) => entry.project);
    }
    return projects.filter((project) => {
      const stage = getStage(project);
      if (detail.subContext && stage !== detail.subContext) return false;
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
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:px-6">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => { onCloseDetail(); setDetailCategory("Semua"); setDetailSearch(""); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-red-600">Workspace rincian</p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">{detail.title || contextLabels[detail.context]}</h1>
            <p className="mt-1 text-[11px] text-slate-500">Pilih data untuk melihat perjalanan proyek dan sumber nilainya.</p>
          </div>
          <Badge className="w-fit border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-600">{searchedRows.length} hasil</Badge>
        </div>

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
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
            <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input value={detailSearch} onChange={(event) => { setDetailSearch(event.target.value); setSelectedIndex(0); }} placeholder="Cari toko, ULOK, cabang, atau kontraktor..." className="h-9 rounded-lg border-slate-200 pl-9 text-[11px]" />
              </div>
              {detail.context === "PROJECT" && !detail.subContext && (
                <div className="w-[140px] shrink-0 pb-1 sm:pb-0">
                  <Select
                    value={detailCategory}
                    onValueChange={(val) => {
                      setDetailCategory(val);
                      setSelectedIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 text-[11px] font-medium focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Semua Tahap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semua" className="text-[11px]">Semua Tahap</SelectItem>
                      {PIPELINE.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-[11px]">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {!["NILAI_KONTRAKTOR", "BEANSPOT"].includes(detail.context) ? (
              <div className="hidden shrink-0 grid-cols-[minmax(185px,1.25fr)_minmax(110px,.7fr)_minmax(110px,.7fr)_minmax(120px,.75fr)_20px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400 lg:grid">
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
                      <button key={row.nama_kontraktor} type="button" onClick={() => setSelectedIndex(index)} className={`group grid w-full grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-4 py-4 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626] ${selectedIndex === index ? "bg-red-50/70 shadow-[inset_3px_0_0_#dc2626]" : ""}`}>
                        <div><p className="text-[12px] font-semibold text-slate-900">{row.nama_kontraktor}</p><p className="mt-1 text-[10px] text-slate-400">{row.tokoCount} toko dinilai</p></div>
                        <p className="text-lg font-semibold text-slate-950">{Number(row.nilai).toFixed(1)}</p>
                      </button>
                    );
                  }
                  if (row.__kind === "beanspot") {
                    return (
                      <button key={`${row.nomor_ulok}-${index}`} type="button" onClick={() => setSelectedIndex(index)} className={`group grid w-full grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-4 py-4 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626] ${selectedIndex === index ? "bg-red-50/70 shadow-[inset_3px_0_0_#dc2626]" : ""}`}>
                        <div><p className="text-[12px] font-semibold text-slate-900">{row.nama_toko}</p><p className="mt-1 text-[10px] text-slate-400">{row.nomor_ulok} · {row.cabang}</p></div>
                        <p className="text-[12px] font-semibold text-slate-950">{formatRupiah(row.nominal)}</p>
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
                      onClick={() => setSelectedIndex(index)}
                      className={`group flex flex-col gap-3 lg:grid w-full lg:grid-cols-[minmax(185px,1.25fr)_minmax(110px,.7fr)_minmax(110px,.7fr)_minmax(120px,.75fr)_20px] lg:items-center border-b border-slate-100 px-4 py-3.5 text-left transition-all hover:bg-red-50 hover:shadow-[inset_3px_0_0_#dc2626] ${selectedIndex === index ? "bg-red-50/70 shadow-[inset_3px_0_0_#dc2626]" : ""}`}
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

          <aside className="custom-scrollbar min-h-0 overflow-y-auto bg-white p-5">
            {!selectedRow ? null : selectedRow.__kind === "contractor" ? (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-600">Rincian kontraktor</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{selectedRow.nama_kontraktor}</h2>
                <p className="mt-1 text-[11px] text-slate-500">{selectedRow.tokoCount} toko · rata-rata {Number(selectedRow.nilai).toFixed(1)} poin</p>
                <div className="mt-5 space-y-2">
                  {(selectedRow.stores || []).slice(0, 8).map((store: any) => (
                    <div key={store.nomor_ulok} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold text-slate-800">{store.nama_toko}</p><p className="text-[11px] font-semibold">{Number(store.nilai).toFixed(1)}</p></div>
                      <p className="mt-1 text-[9px] text-slate-400">{store.nomor_ulok} · {store.cabang}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedRow.__kind === "beanspot" ? (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-600">Rincian Beanspot</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{selectedRow.nama_toko}</h2>
                <p className="mt-1 text-[11px] text-slate-500">{selectedRow.nomor_ulok} · {selectedRow.cabang}</p>
                <div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-[9px] text-slate-400">Nilai pekerjaan Beanspot</p><p className="mt-2 text-xl font-semibold">{formatRupiah(selectedRow.nominal)}</p></div>
              </>
            ) : (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-red-600">Rincian proyek</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{selectedProject?.toko?.nama_toko || "-"}</h2>
                <p className="mt-1 text-[11px] text-slate-500">{selectedProject?.toko?.nomor_ulok || "-"} · {selectedProject?.toko?.cabang || "-"} · {selectedProject?.toko?.lingkup_pekerjaan || "-"}</p>
                <div className="mt-5">
                  <ContextInspector
                    project={selectedProject}
                    context={detail.context}
                    quality={selectedQuality}
                    lateDays={getLateDays(selectedProject)}
                    penalty={getPenalty(selectedProject)}
                  />
                </div>
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="mb-4 text-[10px] font-semibold text-slate-800">
                    {["PROJECT", "ATTENTION"].includes(detail.context) ? "Perjalanan dokumen" : "Jejak dokumen terkait"}
                  </p>
                  <Timeline project={selectedProject} stage={selectedStage} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {canOpenSource(selectedProject, detail.context) ? (
                    <Button variant="outline" className="h-9 rounded-lg text-[10px]" onClick={() => onOpenSource(selectedProject, detail.context)}>Buka data ULOK</Button>
                  ) : (
                    <div className="flex items-center rounded-lg border border-slate-200 px-3 text-[9px] text-slate-400">Akses detail dibatasi</div>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
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
        ["Total denda", formatRupiah(stats.totalDenda), "Resmi dan estimasi", "DENDA", "danger"],
      ]
    : [
        ["Total proyek", stats.total, isGlobalView ? "Seluruh cabang pada filter" : `Cabang ${cabang}`, "PROJECT", "neutral"],
        ["Prioritas SLA", slaPriorityProjects.length, "Tahap yang melewati batas waktu atau berisiko", "ATTENTION", "danger"],
        ["Nilai SPK", formatRupiah(stats.spk), "Seluruh SPK non-ditolak", "SPK", "neutral"],
        ["Nilai penawaran", formatRupiah(stats.penawaran), "Grand total final penawaran aktif", "PENAWARAN", "neutral"],
        ["Total denda", formatRupiah(stats.totalDenda), "Resmi dan estimasi", "DENDA", "danger"],
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
    { label: "Denda", value: formatRupiah(stats.totalDenda), helper: "Resmi dan estimasi", context: "DENDA", icon: AlertTriangle },
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
