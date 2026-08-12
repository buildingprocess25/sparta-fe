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
      <DialogContent className="max-w-4xl bg-slate-50 p-6">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-2xl font-black text-slate-950">
            Metrik: {supportRow.nama_support}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Menampilkan {supportRow.total_ulok} ULOK dan {supportRow.incomplete_ulok} catatan. Pilih metrik di bawah untuk melihat detail daftar ULOK terkait.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  "group flex flex-col items-start justify-between min-h-[140px] rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200",
                  card.isDisabled 
                    ? "opacity-60 cursor-not-allowed bg-slate-50" 
                    : "hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                )}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-950">{card.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{card.description}</p>
                  </div>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.tone)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                
                <div className="mt-4 flex w-full items-end justify-between">
                  <p className="truncate text-2xl font-black text-slate-950">{card.value}</p>
                  {card.isDisabled ? (
                    <span className="text-xs font-bold text-slate-400 mb-1">Belum tersedia</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 opacity-0 transition-opacity group-hover:opacity-100 mb-1">Lihat ULOK &rarr;</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
