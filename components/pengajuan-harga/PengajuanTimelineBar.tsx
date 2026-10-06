"use client";

import React from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { PengajuanHargaItem } from "@/components/pengajuan-harga/types";

export type TimelineFlowType = "pengajuan_baru" | "pengajuan_trial" | "trial_permanen";

export interface TimelineStep {
  id: string;
  label: string;
  state: "completed" | "current" | "pending" | "revision" | "rejected";
}

export interface PengajuanTimelineBarProps {
  item: PengajuanHargaItem;
  className?: string;
  compact?: boolean;
}

export function PengajuanTimelineBar({
  item,
  className = "",
  compact = false,
}: PengajuanTimelineBarProps) {
  // 1. Tentukan Jenis Alur
  const flowType: TimelineFlowType = (() => {
    if (
      item.isTrial &&
      (item.status === "TRIAL_PROMOSI_REGIONAL_MGR" ||
        item.trialEvaluationAction === "PERMANEN" ||
        item.historyLog?.some(
          (h) =>
            h.action === "EVALUATE" ||
            h.catatan?.toLowerCase().includes("promosi") ||
            h.catatan?.toLowerCase().includes("permanen")
        ))
    ) {
      return "trial_permanen";
    }
    if (item.isTrial) {
      return "pengajuan_trial";
    }
    return "pengajuan_baru";
  })();

  // 2. Susun Langkah berdasarkan Jenis Alur
  let steps: TimelineStep[] = [];
  let flowTitle = "";
  let flowIcon = <Sparkles className="w-3.5 h-3.5" />;

  if (flowType === "pengajuan_baru") {
    flowTitle = "Alur Pengajuan Baru";
    flowIcon = <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;

    // Alur: Pengajuan spesifikasi -> Review S&B -> Survei -> Review B&M Manager -> Review S&B -> Review B&M Regional Manager -> Review Kontraktor -> Selesai
    const st = item.status;
    const isDone = st === "RELEASED" || st === "APPROVED_ACTIVE" || st === "DISETUJUI";
    const isRevisiBC = st === "RETURNED_TO_BC" || st === "PERLU_REVISI";
    const isReject = st === "DITOLAK" || st === "DITOLAK_SB";

    steps = [
      {
        id: "step-1",
        label: "Pengajuan Spesifikasi",
        state: "completed",
      },
      {
        id: "step-2",
        label: "Review S&B Controller Spesialist",
        state: isDone
          ? "completed"
          : [
              "SIAP_SURVEI",
              "RETURNED_TO_BC",
              "PERLU_REVISI",
              "PENDING_BM_MGR",
              "PENDING_SB_SPECIALIST",
              "PENDING_REGIONAL_MGR",
              "PENDING_KONTRAKTOR",
            ].includes(st)
          ? "completed"
          : st === "PENDING_VALIDASI_SB" || st === "DIAJUKAN" || st === "DRAFT"
          ? "current"
          : isReject
          ? "rejected"
          : "pending",
      },
      {
        id: "step-3",
        label: "Survei",
        state: isDone
          ? "completed"
          : [
              "PENDING_BM_MGR",
              "PENDING_SB_SPECIALIST",
              "PENDING_REGIONAL_MGR",
              "PENDING_KONTRAKTOR",
            ].includes(st)
          ? "completed"
          : isRevisiBC
          ? "revision"
          : st === "SIAP_SURVEI"
          ? "current"
          : "pending",
      },
      {
        id: "step-4",
        label: "Review B&M Manager",
        state: isDone
          ? "completed"
          : [
              "PENDING_SB_SPECIALIST",
              "PENDING_REGIONAL_MGR",
              "PENDING_KONTRAKTOR",
            ].includes(st)
          ? "completed"
          : st === "PENDING_BM_MGR"
          ? "current"
          : "pending",
      },
      {
        id: "step-5",
        label: "Review S&B",
        state: isDone
          ? "completed"
          : ["PENDING_REGIONAL_MGR", "PENDING_KONTRAKTOR"].includes(st)
          ? "completed"
          : st === "PENDING_SB_SPECIALIST"
          ? "current"
          : "pending",
      },
      {
        id: "step-6",
        label: "Review B&M Regional Manager",
        state: isDone
          ? "completed"
          : st === "PENDING_KONTRAKTOR"
          ? "completed"
          : st === "PENDING_REGIONAL_MGR"
          ? "current"
          : "pending",
      },
      {
        id: "step-7",
        label: "Review Kontraktor",
        state: isDone
          ? "completed"
          : st === "PENDING_KONTRAKTOR"
          ? "current"
          : "pending",
      },
      {
        id: "step-8",
        label: "Selesai",
        state: isDone ? "completed" : "pending",
      },
    ];
  } else if (flowType === "pengajuan_trial") {
    flowTitle = "Alur Pengajuan Trial";
    flowIcon = <FlaskConical className="w-3.5 h-3.5 text-amber-600" />;

    // Alur Trial: Pengajuan -> Review B&M Regional Manager -> Selesai
    const st = item.status;
    const isDone = st === "TRIAL_RELEASED";
    const isRevisi = st === "TRIAL_REVISI";
    const isReject = st === "TRIAL_DITOLAK";

    steps = [
      {
        id: "step-trial-1",
        label: "Pengajuan",
        state: isRevisi ? "revision" : "completed",
      },
      {
        id: "step-trial-2",
        label: "Review B&M Regional Manager",
        state: isDone
          ? "completed"
          : isReject
          ? "rejected"
          : st === "TRIAL_PENDING_REGIONAL_MGR"
          ? "current"
          : "pending",
      },
      {
        id: "step-trial-3",
        label: "Selesai",
        state: isDone ? "completed" : "pending",
      },
    ];
  } else {
    // flowType === 'trial_permanen'
    flowTitle = "Alur Penetapan Trial ke Master";
    flowIcon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;

    // Alur Trial ke Permanen: Pengajuan -> Review B&M Regional Manager -> Selesai
    const st = item.status;
    const isDone = st === "APPROVED_ACTIVE" || st === "RELEASED";

    steps = [
      {
        id: "step-perm-1",
        label: "Pengajuan",
        state: "completed",
      },
      {
        id: "step-perm-2",
        label: "Review B&M Regional Manager",
        state: isDone
          ? "completed"
          : st === "TRIAL_PROMOSI_REGIONAL_MGR"
          ? "current"
          : "pending",
      },
      {
        id: "step-perm-3",
        label: "Selesai",
        state: isDone ? "completed" : "pending",
      },
    ];
  }

  // Temukan step aktif saat ini
  const activeStep = steps.find((s) => s.state === "current" || s.state === "revision");
  const isAllComplete = steps.every((s) => s.state === "completed");

  return (
    <div
      className={`border border-slate-200 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs space-y-3.5 ${className}`}
    >
      {/* Header Bar Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
            {flowIcon}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{flowTitle}</h4>
            <p className="text-[11px] text-slate-500">
              Pelacakan progres tahapan dan persetujuan pengajuan
            </p>
          </div>
        </div>

        {/* Status Tracker Pill */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {isAllComplete ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Selesai &amp; Resmi Aktif
            </span>
          ) : activeStep ? (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                activeStep.state === "revision"
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : "text-blue-800 bg-blue-50 border-blue-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeStep.state === "revision" ? "bg-amber-500" : "bg-blue-500"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeStep.state === "revision" ? "bg-amber-600" : "bg-blue-600"
                  }`}
                ></span>
              </span>
              <span>
                {activeStep.state === "revision" ? "Perlu Revisi: " : "Saat ini: "}
                <strong>{activeStep.label}</strong>
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Menunggu Tindakan
            </span>
          )}
        </div>
      </div>

      {/* Bar Stepper / Timeline Nodes */}
      <div className="overflow-x-auto pb-1.5 pt-1">
        <div className="min-w-[620px] px-2 flex items-start justify-between relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const nextStep = steps[idx + 1];

            // Status konektor garis ke step berikutnya
            let lineBg = "bg-slate-200";
            if (step.state === "completed") {
              if (nextStep && (nextStep.state === "completed" || nextStep.state === "current")) {
                lineBg = "bg-emerald-500";
              } else {
                lineBg = "bg-slate-200";
              }
            }

            return (
              <div
                key={step.id}
                className="flex-1 flex flex-col items-center relative group"
              >
                {/* Garis Penghubung Horizontal */}
                {!isLast && (
                  <div
                    className={`absolute top-3 left-1/2 w-full h-0.5 ${lineBg} transition-colors z-0`}
                  />
                )}

                {/* Node Titik Langkah */}
                <div className="relative z-10 flex items-center justify-center">
                  {step.state === "completed" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  {step.state === "current" && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-blue-100 shadow-xs transition-transform group-hover:scale-110">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </div>
                  )}

                  {step.state === "revision" && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-amber-100 shadow-xs transition-transform group-hover:scale-110">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}

                  {step.state === "rejected" && (
                    <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center ring-4 ring-rose-100 shadow-xs transition-transform group-hover:scale-110">
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}

                  {step.state === "pending" && (
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    </div>
                  )}
                </div>

                {/* Label Informasi Langkah */}
                <div className="mt-2 text-center px-1">
                  <span
                    className={`text-[11px] font-bold leading-tight block ${
                      step.state === "completed"
                        ? "text-emerald-800"
                        : step.state === "current"
                        ? "text-blue-700"
                        : step.state === "revision"
                        ? "text-amber-800"
                        : step.state === "rejected"
                        ? "text-rose-700"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
