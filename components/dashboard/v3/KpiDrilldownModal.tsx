import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  FileText,
  ListTree,
  Loader2,
  MapPin,
  ReceiptText,
  SearchX,
  TimerReset,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchDashboardKpiDrilldown,
  type KpiCardType,
  type KpiDrilldownRow,
} from "@/lib/api/kpi-performance";

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: KpiCardType | "";
  kpiTitle: string;
  actorRole: string;
  actorCabang: string;
  cabangFilter: string;
  coordinatorFilter: string;
  supportFilter: string;
}

const metricColumnLabels: Record<KpiCardType, string> = {
  total_ulok: "Status Data",
  cost_m2: "Cost/m2",
  jhk: "JHK",
  denda: "Denda",
  keterlambatan: "Keterlambatan",
  sla_coord: "SLA Coord",
  sla_bm: "SLA B&M Manager",
  sla_branch_manager: "SLA Branch Manager",
  ketepatan_st: "Ketepatan ST",
  sla_ktk: "SLA KTK",
  kerja_tambah: "Kerja Tambah",
  kerja_kurang: "Kerja Kurang",
};

const formatRupiah = (val: number | null | undefined) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const formatDays = (value: number | null | undefined) => `${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} hari`;
const joinOrDash = (items: string[]) => items.length > 0 ? items.join(", ") : "-";
const addOneDayLabel = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + 1);
  return formatDate(date.toISOString());
};

type DetailFact = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: string;
};

const detailFactsFor = (row: KpiDrilldownRow, type: KpiCardType | ""): DetailFact[] => {
  if (type === "cost_m2") return [
    { label: "Cost/m2", value: row.value_label, icon: Banknote, tone: "text-emerald-700" },
    { label: "RAB Approved", value: formatRupiah(row.detail.rab_approved_total), icon: ReceiptText },
    { label: "Luas Bangunan", value: `${Number(row.detail.luas_bangunan || 0).toLocaleString("id-ID")} m2`, icon: Building2 },
    { label: "Lingkup", value: `${row.scope_breakdown.length} sumber`, icon: ListTree },
  ];

  if (type === "jhk") return [
    { label: "JHK", value: row.value_label, icon: Clock, tone: "text-blue-700" },
    { label: "Mulai SPK", value: formatDate(row.detail.spk_start_date), icon: CalendarDays },
    { label: "Akhir SPK", value: formatDate(row.detail.spk_end_date_after_extension), icon: CalendarDays },
    { label: "Lingkup", value: row.job_types.join(" + ") || "-", icon: ListTree },
  ];

  if (type === "denda" || type === "keterlambatan") return [
    { label: type === "denda" ? "Nominal Denda" : "Hari Terlambat", value: row.value_label, icon: type === "denda" ? CircleDollarSign : TimerReset, tone: type === "denda" ? "text-amber-700" : "text-rose-700" },
    { label: "Akhir SPK + 1", value: addOneDayLabel(row.detail.spk_end_date_after_extension), icon: CalendarDays },
    { label: "Serah Terima", value: formatDate(row.detail.st_date), icon: CheckCircle2 },
    { label: "Denda Final", value: formatRupiah(row.detail.official_penalty_amount), icon: CircleDollarSign },
  ];

  if (type === "sla_coord") return [
    { label: "Tertahan di Coord", value: row.value_label, icon: UserCheck, tone: "text-sky-700" },
    { label: "RAB Dibuat", value: formatDate(row.detail.rab_created_date), icon: FileText },
    { label: "Approved Coord", value: formatDate(row.detail.rab_coord_approved_date), icon: CheckCircle2 },
    { label: "Koordinator", value: joinOrDash(row.coordinators), icon: UserCheck },
  ];

  if (type === "sla_bm") return [
    { label: "Tertahan di B&M Manager", value: row.value_label, icon: UserCheck, tone: "text-indigo-700" },
    { label: "Approved Coord", value: formatDate(row.detail.rab_coord_approved_date), icon: CheckCircle2 },
    { label: "Approved Manager", value: formatDate(row.detail.rab_bm_approved_date), icon: CheckCircle2 },
    { label: "Koordinator", value: joinOrDash(row.coordinators), icon: UserCheck },
  ];

  if (type === "sla_branch_manager") return [
    { label: "Tertahan di Branch Manager", value: row.value_label, icon: Building2, tone: "text-cyan-700" },
    { label: "Approved Manager", value: formatDate(row.detail.rab_bm_approved_date), icon: CheckCircle2 },
    { label: "Approved Branch Manager", value: formatDate(row.detail.rab_branch_manager_approved_date), icon: CheckCircle2 },
    { label: "Cabang", value: row.cabang || "-", icon: MapPin },
  ];

  if (type === "ketepatan_st") return [
    { label: "Selisih ST", value: row.value_label, icon: CheckCircle2, tone: "text-teal-700" },
    { label: "Akhir SPK + 1", value: addOneDayLabel(row.detail.spk_end_date_after_extension), icon: CalendarDays },
    { label: "Serah Terima", value: formatDate(row.detail.st_date), icon: CheckCircle2 },
    { label: "Hari Denda", value: formatDays(row.detail.official_late_days), icon: TimerReset },
  ];

  if (type === "sla_ktk") return [
    { label: "SLA KTK", value: row.value_label, icon: FileText, tone: "text-violet-700" },
    { label: "Serah Terima", value: formatDate(row.detail.st_date), icon: CheckCircle2 },
    { label: "Final KTK", value: formatDate(row.detail.opname_final_date), icon: FileText },
    { label: "Nilai Final", value: formatRupiah(row.detail.opname_total), icon: CircleDollarSign },
  ];

  if (type === "kerja_tambah" || type === "kerja_kurang") return [
    { label: type === "kerja_tambah" ? "Kerja Tambah" : "Kerja Kurang", value: row.value_label, icon: type === "kerja_tambah" ? TrendingUp : TrendingDown, tone: type === "kerja_tambah" ? "text-emerald-700" : "text-orange-700" },
    { label: "RAB Approved", value: formatRupiah(row.detail.rab_approved_total), icon: ReceiptText },
    { label: "Opname Final", value: formatRupiah(row.detail.opname_total), icon: CircleDollarSign },
    { label: "Tanggal Final", value: formatDate(row.detail.opname_final_date), icon: CalendarDays },
  ];

  return [
    { label: "Nilai KPI", value: row.value_label, icon: ListTree },
    { label: "RAB Approved", value: formatRupiah(row.detail.rab_approved_total), icon: ReceiptText },
    { label: "Opname Final", value: formatRupiah(row.detail.opname_total), icon: CircleDollarSign },
    { label: "Lingkup", value: `${row.scope_breakdown.length} sumber`, icon: ListTree },
  ];
};

const detailExplanation = (type: KpiCardType | "") => {
  if (type === "cost_m2") return "Cost/m2 dihitung dari total RAB approved ULOK gabungan dibagi luas bangunan.";
  if (type === "jhk") return "JHK mengambil durasi SPK valid pada ULOK gabungan.";
  if (type === "denda") return "Denda memakai nilai denda final yang tersimpan pada opname final.";
  if (type === "keterlambatan") return "Keterlambatan memakai hari denda final, atau selisih ST terhadap akhir SPK + 1 jika denda belum tersedia.";
  if (type === "sla_coord") return "SLA Coord adalah selisih RAB dibuat sampai approval koordinator.";
  if (type === "sla_bm") return "SLA B&M Manager adalah selisih approval koordinator sampai approval manager.";
  if (type === "sla_branch_manager") return "SLA Branch Manager adalah selisih approval manager sampai approval branch manager.";
  if (type === "ketepatan_st") return "Ketepatan serah terima adalah tanggal ST dikurang hari akhir SPK setelah tambah SPK plus 1 hari.";
  if (type === "sla_ktk") return "SLA KTK adalah tanggal final KTK/opname final dikurang tanggal serah terima.";
  if (type === "kerja_tambah") return "Kerja tambah memakai selisih nominal final opname di atas RAB approved, bukan selisih volume.";
  if (type === "kerja_kurang") return "Kerja kurang memakai selisih nominal final opname di bawah RAB approved, bukan selisih volume.";
  return "Rincian KPI berbasis ULOK gabungan.";
};

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiType,
  kpiTitle,
  actorRole,
  actorCabang,
  cabangFilter,
  coordinatorFilter,
  supportFilter,
}: KpiDrilldownModalProps) {
  const [data, setData] = useState<KpiDrilldownRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedToko, setSelectedToko] = useState<KpiDrilldownRow | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setSelectedToko(null);
      return;
    }
    setSelectedToko(null);
  }, [isOpen, kpiType, cabangFilter, coordinatorFilter, supportFilter]);

  useEffect(() => {
    if (!isOpen || !kpiType) return;

    const selectedKpiType: KpiCardType = kpiType;
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchDashboardKpiDrilldown({
          actor_role: actorRole,
          actor_cabang: actorCabang,
          cabang: cabangFilter,
          coordinator: coordinatorFilter,
          support: supportFilter,
          kpi_type: selectedKpiType,
          page,
          limit,
        });

        if (ignore) return;
        setData(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalRecords(res.meta?.total || 0);
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat rincian KPI dari database.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [isOpen, kpiType, actorRole, actorCabang, cabangFilter, coordinatorFilter, supportFilter, page, limit]);

  const metricHeader = kpiType ? metricColumnLabels[kpiType] : "Nilai KPI";
  const startIndex = (page - 1) * limit;
  const selectedFacts = useMemo(() => selectedToko ? detailFactsFor(selectedToko, kpiType) : [], [kpiType, selectedToko]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[86vh] max-w-6xl flex-col overflow-hidden border-slate-200 bg-white p-0 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="flex flex-wrap items-center gap-3 text-xl font-extrabold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
                <ListTree className="h-5 w-5" aria-hidden="true" />
              </span>
              Rincian {kpiTitle || "KPI"}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {totalRecords.toLocaleString("id-ID")} ULOK
              </span>
            </DialogTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {detailExplanation(kpiType)}
            </p>
          </DialogHeader>

          <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden bg-slate-50/70">
            {loading && data.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" aria-hidden="true" />
                <p className="text-sm font-semibold">Menarik rincian ULOK gabungan dari database…</p>
              </div>
            ) : error ? (
              <div className="m-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" aria-live="polite">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                  <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    {loading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-red-600" aria-hidden="true" />
                      </div>
                    )}
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-slate-50 text-xs font-bold uppercase text-slate-600 shadow-sm">
                        <tr>
                          <th className="w-14 px-4 py-3 text-center">#</th>
                          <th className="px-4 py-3">ULOK / Proyek</th>
                          <th className="px-4 py-3">Cabang</th>
                          <th className="px-4 py-3">Lingkup</th>
                          <th className="px-4 py-3">{metricHeader}</th>
                          <th className="px-4 py-3 text-right">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.map((item, idx) => {
                          const isSelected = selectedToko?.nomor_ulok === item.nomor_ulok;
                          return (
                            <tr
                              key={item.nomor_ulok}
                              onClick={() => setSelectedToko(item)}
                              className={cn("cursor-pointer transition-colors hover:bg-red-50/40", isSelected && "bg-red-50/60")}
                            >
                              <td className="px-4 py-4 text-center text-xs font-bold text-slate-400">{startIndex + idx + 1}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                    <Building2 className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-slate-900">{item.nomor_ulok}</p>
                                    <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-slate-500">{item.proyek || "Nama proyek belum tersedia"}</p>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-400">Kode toko: {item.kode_toko || "-"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-600">{item.cabang || "-"}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {item.job_types.length > 0 ? item.job_types.map((job) => (
                                    <span key={job} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{job}</span>
                                  )) : <span className="text-xs font-semibold text-slate-400">-</span>}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-extrabold text-slate-900">{item.value_label}</p>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.secondary_label}</p>
                                {item.data_quality_flags.length > 0 && (
                                  <p className="mt-1 text-[11px] font-bold text-amber-700">{item.data_quality_flags.length} catatan data</p>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <ChevronRight className={cn("inline h-4 w-4 text-slate-300 transition-transform", isSelected && "translate-x-0.5 text-red-500")} aria-hidden="true" />
                              </td>
                            </tr>
                          );
                        })}
                        {data.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                              <SearchX className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
                              <p className="font-bold">Tidak ada ULOK untuk kombinasi filter ini.</p>
                              <p className="mt-1 text-xs font-medium">Coba longgarkan cabang, koordinator, atau support.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Menampilkan <span className="font-extrabold text-slate-800">{data.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-extrabold text-slate-800">{startIndex + data.length}</span> dari <span className="font-extrabold text-slate-800">{totalRecords.toLocaleString("id-ID")}</span> ULOK
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Halaman sebelumnya">
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <div className="min-w-20 text-center text-sm font-bold text-slate-600">{page} <span className="text-slate-400">/</span> {totalPages || 1}</div>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))} disabled={page >= (totalPages || 1) || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Halaman berikutnya">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedToko && (
        <div className="fixed inset-0 z-[100] isolate overflow-hidden overscroll-contain">
          <button type="button" className="absolute inset-0 z-0 cursor-default bg-slate-950/25 backdrop-blur-sm" onClick={() => setSelectedToko(null)} aria-label="Tutup detail ULOK" />
          <aside className="fixed inset-y-0 right-0 z-[110] flex h-[100svh] max-h-[100svh] w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-slate-500">ULOK Gabungan</p>
                  <h3 className="mt-1 truncate text-xl font-extrabold text-slate-950">{selectedToko.nomor_ulok}</h3>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">{selectedToko.proyek}</p>
                </div>
                <button type="button" onClick={() => setSelectedToko(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label="Tutup detail ULOK">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{selectedToko.cabang || "-"}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{selectedToko.value_label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{selectedToko.secondary_label}</span>
              </div>
            </div>

            <div
              className="min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain p-6 custom-scrollbar"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 ring-1 ring-slate-200">
                {detailExplanation(kpiType)}
              </p>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600", fact.tone)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold uppercase text-slate-500">{fact.label}</p>
                      <p className="mt-1 break-words text-base font-extrabold text-slate-900">{fact.value}</p>
                    </div>
                  );
                })}
              </section>

              <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ListTree className="h-4 w-4 text-red-600" aria-hidden="true" />Breakdown Lingkup</h4>
                  <span className="text-xs font-bold text-slate-500">{selectedToko.scope_breakdown.length} sumber</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Lingkup</th>
                        <th className="px-3 py-2 text-right">RAB</th>
                        <th className="px-3 py-2 text-right">Opname</th>
                        <th className="px-3 py-2 text-right">Denda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedToko.scope_breakdown.map((scope) => (
                        <tr key={`${scope.toko_id}-${scope.lingkup_pekerjaan}`}>
                          <td className="px-3 py-3 font-bold text-slate-700">{scope.lingkup_pekerjaan || "-"}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-600">{formatRupiah(scope.rab_approved_total)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-600">{formatRupiah(scope.opname_total)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-600">{formatRupiah(scope.official_penalty_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-900"><FileText className="h-4 w-4 text-red-600" aria-hidden="true" />Timeline & PIC</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><p className="text-xs font-bold uppercase text-slate-500">Mulai SPK</p><p className="mt-1 font-semibold text-slate-800">{formatDate(selectedToko.detail.spk_start_date)}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-500">Akhir SPK + 1</p><p className="mt-1 font-semibold text-slate-800">{addOneDayLabel(selectedToko.detail.spk_end_date_after_extension)}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-500">BAST</p><p className="mt-1 font-semibold text-slate-800">{formatDate(selectedToko.detail.st_date)}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-500">Final KTK</p><p className="mt-1 font-semibold text-slate-800">{formatDate(selectedToko.detail.opname_final_date)}</p></div>
                  <div className="col-span-2"><p className="text-xs font-bold uppercase text-slate-500">Koordinator</p><p className="mt-1 break-words font-semibold text-slate-800">{joinOrDash(selectedToko.coordinators)}</p></div>
                  <div className="col-span-2"><p className="text-xs font-bold uppercase text-slate-500">Support Building</p><p className="mt-1 break-words font-semibold text-slate-800">{joinOrDash(selectedToko.building_supports)}</p></div>
                </div>
              </section>

              <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />Kualitas Data</h4>
                {selectedToko.data_quality_flags.length === 0 ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">Data utama lengkap untuk KPI ini.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedToko.data_quality_flags.map((flag) => (
                      <span key={flag} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{flag}</span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
