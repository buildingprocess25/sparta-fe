import type { PerformanceDetailData } from "@/lib/api/performance-v3";
import { formatDateKpi, formatNumberKpi, formatPercentKpi, formatRupiahKpi, formatSignedDays } from "./kpi-formatters";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

const SectionHeader = ({ title, badge }: { title: string; badge?: string }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="h-6 w-1.5 shrink-0 rounded-full bg-red-500" />
      <h4 className="text-xl font-bold tracking-tight text-slate-900">{title}</h4>
    </div>
    {badge && (
      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 ring-1 ring-inset ring-red-100">
        {badge}
      </span>
    )}
  </div>
);

const Field = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={cn(
    "relative flex flex-col justify-center overflow-hidden rounded-[20px] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
    highlight 
      ? "bg-gradient-to-br from-red-50/80 to-white/90 border border-red-200/60 shadow-[0_8px_30px_rgb(220,38,38,0.06)] ring-1 ring-inset ring-red-500/5" 
      : "bg-white/80 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-slate-300/60"
  )}>
    <p className={cn("text-[10px] font-bold uppercase tracking-widest", highlight ? "text-red-600/80" : "text-slate-400")}>{label}</p>
    <p className={cn("mt-1 text-lg font-bold tracking-tight", highlight ? "text-red-700" : "text-slate-900")}>{value}</p>
  </div>
);

export function KpiDetailSections({ detail }: { detail: PerformanceDetailData }) {
  const section = detail.sections;
  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader title="Identitas ULOK" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cabang" value={detail.cabang ?? "-"} />
          <Field label="Kode Toko" value={detail.kode_toko ?? "-"} highlight />
          <Field label="Kontraktor" value={detail.kontraktor ?? "-"} />
          <Field label="Support" value={detail.supports.join(", ") || "-"} />
        </div>
      </section>

      {detail.selected_card === "sla_approval" && (
        <section>
          <SectionHeader title="Timeline SLA Approval" badge={`Rata-rata: ${formatNumberKpi(section.sla_approval.avg_days, " hari")}`} />
          <div className="grid grid-cols-1 gap-4">
            {section.sla_approval.events.map((event) => (
              <div key={`${event.document}-${event.role}-${event.approvedAt}`} className="group flex flex-col sm:flex-row sm:items-start gap-4 rounded-[24px] bg-white/70 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] ring-1 ring-slate-200/60 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:ring-red-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-red-50 group-hover:text-red-500 group-hover:ring-red-100">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <p className="text-base font-bold text-slate-900">{event.label}</p>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition-colors group-hover:bg-red-600">{formatNumberKpi(event.durationDays, " hari")}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
                    <div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mulai</dt><dd className="mt-0.5 text-sm font-bold text-slate-800">{formatDateKpi(event.startAt)}</dd></div>
                    <div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approve</dt><dd className="mt-0.5 text-sm font-bold text-slate-800">{formatDateKpi(event.approvedAt)}</dd></div>
                    <div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approver</dt><dd className="mt-0.5 truncate text-sm font-bold text-slate-800">{event.actorName ?? "-"}</dd></div>
                  </dl>
                </div>
              </div>
            ))}
            {!section.sla_approval.events.length && (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-slate-500">
                <Clock className="h-5 w-5 opacity-50" />
                <p className="text-sm font-semibold">Tidak ada event approval untuk pilihan ini.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {detail.selected_card === "cost_m2" && (
        <section>
          <SectionHeader title="Breakdown Cost / m2" />
          <p className="mb-4 text-xs font-semibold text-slate-500">{section.cost_m2.formula}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Terbangun" value={formatRupiahKpi(section.cost_m2.terbangun)} highlight />
            <Field label="Bangunan" value={formatRupiahKpi(section.cost_m2.bangunan)} />
            <Field label="Area Terbuka" value={formatRupiahKpi(section.cost_m2.area_terbuka)} />
          </div>
        </section>
      )}

      {detail.selected_card === "jhk" && (
        <section>
          <SectionHeader title="Durasi JHK" badge={`Actual ${formatNumberKpi(section.jhk.avg_days, " hari")} / Target ${formatNumberKpi(section.jhk.avg_target_days, " hari")}`} />
          <div className="grid grid-cols-1 gap-3">
            {section.jhk.scopes.map((scope, index) => {
              const isTarget = !scope.st_date && scope.target_st_date;
              const endDate = isTarget ? scope.target_st_date : scope.st_date;
              const days = isTarget ? scope.jhk_target_days : scope.jhk_actual_days;
              return <Field key={index} label={`${String(scope.lingkup ?? "Lingkup")} ${isTarget ? "Target" : "Actual"}`} value={`${formatDateKpi(scope.spk_start)} s/d ${formatDateKpi(endDate)} (${formatNumberKpi(Number(days ?? 0), " hari")})`} />;
            })}
          </div>
        </section>
      )}

      {detail.selected_card === "denda" && (
        <section>
          <SectionHeader title="Denda" />
          <p className="mb-4 text-xs font-semibold text-slate-500">{section.denda.policy}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nilai Representatif" value={formatRupiahKpi(section.denda.value)} highlight />
            {section.denda.scopes.map((scope, index) => <Field key={index} label={String(scope.lingkup ?? "Lingkup")} value={`${formatRupiahKpi(Number(scope.nilai_denda ?? 0))} / ${scope.hari_denda ?? "-"} hr`} />)}
          </div>
        </section>
      )}

      {(detail.selected_card === "kerja_tambah" || detail.selected_card === "kerja_kurang") && (
        <section>
          <SectionHeader title="Kerja Tambah/Kurang" />
          <p className="mb-4 text-xs font-semibold text-slate-500">{section.kerja_tambah_kurang.formula}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kerja Tambah" value={formatRupiahKpi(section.kerja_tambah_kurang.kerja_tambah)} highlight={detail.selected_card === "kerja_tambah"} />
            <Field label="Kerja Kurang" value={formatRupiahKpi(section.kerja_tambah_kurang.kerja_kurang)} highlight={detail.selected_card === "kerja_kurang"} />
          </div>
        </section>
      )}

      {detail.selected_card === "ketepatan_st" && (
        <section>
          <SectionHeader title="Ketepatan Serah Terima" />
          <p className="mb-4 text-xs font-semibold text-slate-500">{section.ketepatan_st.formula}</p>
          <div className="grid grid-cols-1"><Field label="Selisih" value={formatSignedDays(section.ketepatan_st.days)} highlight /></div>
        </section>
      )}

      {detail.selected_card === "sla_ktk" && (
        <section>
          <SectionHeader title="Finalisasi KTK" />
          <p className="mb-4 text-xs font-semibold text-slate-500">{section.sla_ktk.formula}</p>
          <div className="grid grid-cols-1"><Field label="SLA KTK" value={formatNumberKpi(section.sla_ktk.days, " hari")} highlight /></div>
        </section>
      )}

      <section>
        <SectionHeader title="Metrik Tabel Support" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Notaris to End SPK" value={formatNumberKpi(section.support_metrics.jhk_notaris_to_end_spk, " hari")} />
          <Field label="Notaris to Start SPK" value={formatNumberKpi(section.support_metrics.jhk_notaris_to_start_spk, " hari")} />
          <Field label="% Temuan" value={formatPercentKpi(section.support_metrics.persentase_temuan)} />
          <Field label="Deviasi PE" value={formatPercentKpi(section.support_metrics.deviasi_pe)} />
        </div>
      </section>

      {detail.data_quality.length > 0 && (
        <section className="rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white/90 p-6 shadow-sm">
          <SectionHeader title="Catatan Kualitas Data" />
          <ul className="mt-3 space-y-3 text-sm font-semibold text-amber-900">
            {detail.data_quality.map((flag) => (
              <li key={flag} className="flex items-start gap-2.5 rounded-xl bg-white/50 p-3 shadow-sm ring-1 ring-amber-100">
                <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
