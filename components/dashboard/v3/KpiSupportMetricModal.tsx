import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type PerformanceTableRow, type PerformanceTableMetric } from "@/lib/api/performance-v3";
import { formatNumberKpi, formatPercentKpi, formatSignedDays } from "./kpi-formatters";
import { Clock3, Percent, CheckCircle2, FileText, TrendingUp } from "lucide-react";
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
      value: formatNumberKpi(supportRow.jhk_notaris_to_end_spk, " hari"),
      icon: Clock3,
      tone: "text-slate-400 bg-slate-50 border-slate-200",
      description: "Dari Notaris sampai akhir SPK",
      isDisabled: true
    },
    {
      id: "jhk_notaris_to_start_spk" as PerformanceTableMetric,
      title: "JHK Notaris to Start SPK",
      value: formatNumberKpi(supportRow.jhk_notaris_to_start_spk, " hari"),
      icon: Clock3,
      tone: "text-slate-400 bg-slate-50 border-slate-200",
      description: "Dari Notaris sampai mulai SPK",
      isDisabled: true
    },
    {
      id: "persentase_temuan" as PerformanceTableMetric,
      title: "% Temuan",
      value: formatPercentKpi(supportRow.persentase_temuan),
      icon: Percent,
      tone: "text-slate-400 bg-slate-50 border-slate-200",
      description: "Persentase temuan pengawasan",
      isDisabled: true
    },
    {
      id: "ketepatan_st" as PerformanceTableMetric,
      title: "Ketepatan ST",
      value: formatSignedDays(supportRow.ketepatan_st),
      icon: CheckCircle2,
      tone: "text-cyan-700 bg-cyan-50 border-cyan-200",
      description: "Ketepatan waktu serah terima",
      isDisabled: false
    },
    {
      id: "deviasi_pe" as PerformanceTableMetric,
      title: "Deviasi PE vs Penawaran",
      value: formatPercentKpi(supportRow.deviasi_pe),
      icon: TrendingUp,
      tone: "text-slate-400 bg-slate-50 border-slate-200",
      description: "Deviasi antara PE dan Penawaran",
      isDisabled: true
    },
    {
      id: "finalisasi_ktk" as PerformanceTableMetric,
      title: "Finalisasi KTK",
      value: formatNumberKpi(supportRow.finalisasi_ktk, " hari"),
      icon: FileText,
      tone: "text-violet-700 bg-violet-50 border-violet-200",
      description: "Waktu finalisasi kerja tambah kurang",
      isDisabled: false
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed !right-0 !top-0 !left-auto !bottom-auto !translate-x-0 !translate-y-0 z-50 flex h-[100dvh] w-full max-w-md flex-col gap-0 border-l border-white/60 bg-white/70 p-0 shadow-2xl backdrop-blur-2xl duration-300 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-lg">
        
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 border-b border-slate-200/50 bg-white/50 px-6 py-5 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rincian Metrik Support</p>
              <DialogTitle className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {supportRow.nama_support}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
            Menampilkan <span className="font-bold text-slate-700">{supportRow.total_ulok} ULOK</span> dan <span className="font-bold text-amber-600">{supportRow.incomplete_ulok} catatan</span>. Pilih metrik untuk melihat detail daftarnya.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex flex-col gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={card.isDisabled}
                  onClick={() => {
                    if (!card.isDisabled) {
                      onMetricClick(supportRow.nama_support, card.id, `${card.title} - ${supportRow.nama_support}`);
                    }
                  }}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 text-left shadow-[0_2px_10px_rgb(0,0,0,0.02)] ring-1 ring-slate-200/60 transition-all duration-300",
                    card.isDisabled 
                      ? "opacity-50 cursor-not-allowed bg-slate-50/50 grayscale-[0.5]" 
                      : "hover:-translate-y-1 hover:shadow-lg hover:ring-red-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">{card.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">{card.description}</p>
                    </div>
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur-md transition-transform group-hover:scale-110", card.isDisabled ? "bg-slate-100 ring-slate-200 text-slate-400" : card.tone)}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  
                  <div className="mt-5 flex w-full items-end justify-between border-t border-slate-50 pt-4">
                    <p className="truncate text-3xl font-black tracking-tighter text-slate-900">{card.value}</p>
                    {card.isDisabled ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">TBD</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
                        Buka Detail &rarr;
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
