import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type PerformanceTableRow, type PerformanceTableMetric } from "@/lib/api/performance-v3";
import { numberFormatter, percentFormatter } from "./kpi-formatters";
import { Clock3, Percent, CheckCircle2, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiSupportMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  supportRow: PerformanceTableRow | null;
  onMetricClick: (support: string, metric: PerformanceTableMetric, label: string) => void;
}

export function KpiSupportMetricModal({ isOpen, onClose, supportRow, onMetricClick }: KpiSupportMetricModalProps) {
  if (!supportRow) return null;

  const cards = [
    {
      id: "jhk_notaris_to_end_spk" as PerformanceTableMetric,
      title: "JHK Notaris to End SPK",
      mainValue: "-",
      unit: "",
      subValue: "Belum Tersedia",
      statusColor: "disabled",
      icon: Clock3,
      tone: "default",
      description: "Dari Notaris sampai akhir SPK",
      isDisabled: true
    },
    {
      id: "jhk_notaris_to_start_spk" as PerformanceTableMetric,
      title: "JHK Notaris to Start SPK",
      mainValue: "-",
      unit: "",
      subValue: "Belum Tersedia",
      statusColor: "disabled",
      icon: Clock3,
      tone: "default",
      description: "Dari Notaris sampai mulai SPK",
      isDisabled: true
    },
    {
      id: "persentase_temuan" as PerformanceTableMetric,
      title: "% Temuan",
      mainValue: "-",
      unit: "",
      subValue: "Belum Tersedia",
      statusColor: "disabled",
      icon: Percent,
      tone: "default",
      description: "Persentase temuan pengawasan",
      isDisabled: true
    },
    {
      id: "ketepatan_st" as PerformanceTableMetric,
      title: "Ketepatan ST",
      mainValue: supportRow.ketepatan_st === null || supportRow.ketepatan_st === undefined ? "-" : (supportRow.ketepatan_st > 0 ? `+${numberFormatter.format(supportRow.ketepatan_st)}` : numberFormatter.format(supportRow.ketepatan_st)),
      unit: supportRow.ketepatan_st === null || supportRow.ketepatan_st === undefined ? "" : "hari",
      subValue: supportRow.ketepatan_st === null || supportRow.ketepatan_st === undefined ? "Data Kosong" : (supportRow.ketepatan_st < 0 ? `Lebih cepat ${numberFormatter.format(Math.abs(supportRow.ketepatan_st))} hari` : supportRow.ketepatan_st > 0 ? `Terlambat ${numberFormatter.format(supportRow.ketepatan_st)} hari` : "Tepat Waktu"),
      statusColor: supportRow.ketepatan_st === null || supportRow.ketepatan_st === undefined ? "disabled" : (supportRow.ketepatan_st <= 0 ? "success" : "danger"),
      icon: CheckCircle2,
      tone: "emerald",
      description: "Ketepatan waktu serah terima proyek",
      isDisabled: false
    },
    {
      id: "deviasi_pe" as PerformanceTableMetric,
      title: "Deviasi PE vs Penawaran",
      mainValue: "-",
      unit: "",
      subValue: "Belum Tersedia",
      statusColor: "disabled",
      icon: TrendingUp,
      tone: "default",
      description: "Deviasi antara PE dan Penawaran",
      isDisabled: true
    },
    {
      id: "finalisasi_ktk" as PerformanceTableMetric,
      title: "Finalisasi KTK",
      mainValue: supportRow.finalisasi_ktk === null || supportRow.finalisasi_ktk === undefined ? "-" : numberFormatter.format(supportRow.finalisasi_ktk),
      unit: supportRow.finalisasi_ktk === null || supportRow.finalisasi_ktk === undefined ? "" : "hari",
      subValue: supportRow.finalisasi_ktk === null || supportRow.finalisasi_ktk === undefined ? "Data Kosong" : "Waktu Rata-rata",
      statusColor: supportRow.finalisasi_ktk === null || supportRow.finalisasi_ktk === undefined ? "disabled" : "info",
      icon: FileText,
      tone: "violet",
      description: "Waktu finalisasi kerja tambah kurang",
      isDisabled: false
    }
  ];

  const toneMap: Record<string, { border: string; bgHover: string; iconBg: string; textMain: string; watermark: string }> = {
    default: {
      border: "border-slate-200/80 hover:border-slate-300",
      bgHover: "hover:bg-slate-50",
      iconBg: "bg-slate-100/80 text-slate-400",
      textMain: "text-slate-900",
      watermark: "text-slate-200 opacity-[0.1]"
    },
    emerald: {
      border: "border-emerald-200 hover:border-emerald-300",
      bgHover: "hover:bg-emerald-50/30",
      iconBg: "bg-emerald-50 text-emerald-600",
      textMain: "text-emerald-700",
      watermark: "text-emerald-50 opacity-[0.5]"
    },
    violet: {
      border: "border-violet-200 hover:border-violet-300",
      bgHover: "hover:bg-violet-50/30",
      iconBg: "bg-violet-50 text-violet-600",
      textMain: "text-violet-700",
      watermark: "text-violet-50 opacity-[0.5]"
    }
  };

  const statusPill: Record<string, string> = {
    disabled: "bg-slate-100 text-slate-500",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700"
  };

  const activeCards = cards.filter(c => !c.isDisabled);
  const inactiveCards = cards.filter(c => c.isDisabled);



  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 border-slate-200/60 shadow-2xl flex flex-col max-h-[90dvh] rounded-3xl">
        <DialogHeader className="shrink-0 px-8 py-8 text-left bg-white border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                {supportRow.nama_support}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="font-bold text-slate-900">{supportRow.total_ulok}</span> Proyek ULOK</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5 text-slate-600"><span className="font-bold text-slate-900">{supportRow.incomplete_ulok}</span> Catatan Aktif</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 custom-scrollbar">
          
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indikator Kinerja Utama</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onMetricClick(supportRow.nama_support, card.id, `${card.title} - ${supportRow.nama_support}`)}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border p-6 text-left shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                    toneMap[card.tone]?.border || toneMap.default.border,
                    toneMap[card.tone]?.bgHover || toneMap.default.bgHover
                  )}
                >
                  {/* Subtle Background Watermark */}
                  <div className={cn(
                    "absolute right-0 top-0 -mr-6 -mt-6 transition-transform duration-500 group-hover:scale-110 pointer-events-none",
                    toneMap[card.tone]?.watermark || toneMap.default.watermark
                  )}>
                     <Icon className="h-40 w-40" aria-hidden="true" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col h-full w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toneMap[card.tone]?.iconBg || toneMap.default.iconBg)}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        {card.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-500 mb-8 max-w-[85%] leading-relaxed">
                      {card.description}
                    </p>

                    <div className="mt-auto flex w-full items-end justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn(
                            "text-4xl font-black tracking-tighter",
                            toneMap[card.tone]?.textMain || toneMap.default.textMain
                          )}>
                            {card.mainValue}
                          </span>
                          {card.unit && <span className="text-base font-semibold text-slate-500 mb-1">{card.unit}</span>}
                        </div>
                        <span className={cn("inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", statusPill[card.statusColor])}>
                          {card.subValue}
                        </span>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 opacity-0 transition-all duration-300 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:opacity-100 shadow-sm">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {inactiveCards.length > 0 && (
            <div className="mt-10">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metrik Dalam Pengembangan (Belum Tersedia)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {inactiveCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-slate-100/50 p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-600">{card.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400">Belum tersedia untuk {supportRow.nama_support}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
