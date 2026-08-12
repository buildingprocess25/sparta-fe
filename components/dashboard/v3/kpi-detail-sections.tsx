import type { PerformanceDetailData } from "@/lib/api/performance-v3";
import { formatDateKpi, formatNumberKpi, formatPercentKpi, formatRupiahKpi, formatSignedDays } from "./kpi-formatters";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
    <p className="text-[11px] font-black uppercase tracking-normal text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
  </div>
);

export function KpiDetailSections({ detail }: { detail: PerformanceDetailData }) {
  const section = detail.sections;
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Identitas ULOK</h4>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cabang" value={detail.cabang ?? "-"} />
          <Field label="Kode Toko" value={detail.kode_toko ?? "-"} />
          <Field label="Kontraktor" value={detail.kontraktor ?? "-"} />
          <Field label="Support" value={detail.supports.join(", ") || "-"} />
        </div>
      </section>

      {detail.selected_card === "sla_approval" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Timeline SLA Approval</h4>
          <p className="mt-1 text-sm font-semibold text-slate-500">Rata-rata: {formatNumberKpi(section.sla_approval.avg_days, " hari")}</p>
          <div className="mt-4 space-y-3">
            {section.sla_approval.events.map((event) => (
              <div key={`${event.document}-${event.role}-${event.approvedAt}`} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{event.label}</p>
                  <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">{formatNumberKpi(event.durationDays, " hari")}</span>
                </div>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-3">
                  <div><dt>Mulai</dt><dd className="text-slate-800">{formatDateKpi(event.startAt)}</dd></div>
                  <div><dt>Approve</dt><dd className="text-slate-800">{formatDateKpi(event.approvedAt)}</dd></div>
                  <div><dt>Approver</dt><dd className="text-slate-800">{event.actorName ?? "-"}</dd></div>
                </dl>
              </div>
            ))}
            {!section.sla_approval.events.length && <p className="text-sm font-medium text-slate-500">Tidak ada event approval untuk pilihan ini.</p>}
          </div>
        </section>
      )}

      {detail.selected_card === "cost_m2" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Breakdown Cost / m2</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">{section.cost_m2.formula}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Terbangun" value={formatRupiahKpi(section.cost_m2.terbangun)} />
            <Field label="Bangunan" value={formatRupiahKpi(section.cost_m2.bangunan)} />
            <Field label="Area Terbuka" value={formatRupiahKpi(section.cost_m2.area_terbuka)} />
          </div>
        </section>
      )}

      {detail.selected_card === "jhk" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Durasi JHK</h4>
          <Field label="Rata-rata" value={formatNumberKpi(section.jhk.avg_days, " hari")} />
          <div className="mt-3 space-y-2">
            {section.jhk.scopes.map((scope, index) => <Field key={index} label={String(scope.lingkup ?? "Lingkup")} value={`${formatDateKpi(scope.spk_start)} sampai ${formatDateKpi(scope.st_date)}; tambah ${scope.extension_days ?? 0} hari`} />)}
          </div>
        </section>
      )}

      {detail.selected_card === "denda" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Denda</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">{section.denda.policy}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nilai Representatif" value={formatRupiahKpi(section.denda.value)} />
            {section.denda.scopes.map((scope, index) => <Field key={index} label={String(scope.lingkup ?? "Lingkup")} value={`${formatRupiahKpi(Number(scope.nilai_denda ?? 0))} / ${scope.hari_denda ?? "-"} hari`} />)}
          </div>
        </section>
      )}

      {(detail.selected_card === "kerja_tambah" || detail.selected_card === "kerja_kurang") && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Kerja Tambah/Kurang</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">{section.kerja_tambah_kurang.formula}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kerja Tambah" value={formatRupiahKpi(section.kerja_tambah_kurang.kerja_tambah)} />
            <Field label="Kerja Kurang" value={formatRupiahKpi(section.kerja_tambah_kurang.kerja_kurang)} />
          </div>
        </section>
      )}

      {detail.selected_card === "ketepatan_st" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Ketepatan Serah Terima</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">{section.ketepatan_st.formula}</p>
          <div className="mt-3"><Field label="Selisih" value={formatSignedDays(section.ketepatan_st.days)} /></div>
        </section>
      )}

      {detail.selected_card === "sla_ktk" && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-black text-slate-900">Finalisasi KTK</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">{section.sla_ktk.formula}</p>
          <div className="mt-3"><Field label="SLA KTK" value={formatNumberKpi(section.sla_ktk.days, " hari")} /></div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Metrik Tabel Support</h4>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Notaris to End SPK" value={formatNumberKpi(section.support_metrics.jhk_notaris_to_end_spk, " hari")} />
          <Field label="Notaris to Start SPK" value={formatNumberKpi(section.support_metrics.jhk_notaris_to_start_spk, " hari")} />
          <Field label="% Temuan" value={formatPercentKpi(section.support_metrics.persentase_temuan)} />
          <Field label="Deviasi PE" value={formatPercentKpi(section.support_metrics.deviasi_pe)} />
        </div>
      </section>

      {detail.data_quality.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-black text-amber-900">Catatan Kualitas Data</h4>
          <ul className="mt-2 space-y-1 text-sm font-semibold text-amber-800">
            {detail.data_quality.map((flag) => <li key={flag}>{flag}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
