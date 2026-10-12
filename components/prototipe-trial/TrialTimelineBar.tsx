// =============================================================================
// components/prototipe-trial/TrialTimelineBar.tsx
// Visualisasi Timeline Alur Standar Trial Sparta
// Selaras dengan Desain & Polish PengajuanTimelineBar.tsx
// =============================================================================

"use client";

import React from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  X,
  FlaskConical,
} from "lucide-react";
import { TrialItem, TrialStatus } from "./types";

export interface TrialTimelineBarProps {
  item: TrialItem;
  className?: string;
  compact?: boolean;
}

export interface TimelineStep {
  id: string;
  label: string;
  state: "completed" | "current" | "pending" | "revision" | "rejected";
}

export function TrialTimelineBar({
  item,
  className = "",
  compact = false,
}: TrialTimelineBarProps) {
  const st: TrialStatus = item.status;

  // Pemetaan State Langkah Alur Standar Trial Sparta
  const isDoneMaster = st === "TRIAL_PROMOTED_MASTER";
  const isRejectReg = st === "TRIAL_DITOLAK_REG_MGR";
  const isTidakLanjut = st === "TRIAL_EVALUASI_TIDAK_LANJUT";
  const isRevisiMaker = st === "TRIAL_REVISI_MAKER";
  const isRevisiSB = st === "TRIAL_REVISI_SB";
  const isDraft = st === "TRIAL_DRAFT";

  const steps: TimelineStep[] = [
    {
      id: "step-1",
      label: "Pengajuan Trial",
      state: isDraft ? "current" : "completed",
    },
    {
      id: "step-2",
      label: "Review PP Manager",
      state: [
        "TRIAL_PENDING_BM_GM",
        "TRIAL_PENDING_SB_CONFIG",
        "TRIAL_PENDING_BM_REG_CONFIG",
        "TRIAL_REVISI_SB",
        "TRIAL_AKTIF",
        "TRIAL_EVALUASI_VOTING",
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_EVALUASI_TIDAK_LANJUT",
        "TRIAL_DITOLAK_REG_MGR",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_PENDING_PP_MGR"
        ? "current"
        : isRevisiMaker
        ? "revision"
        : "pending",
    },
    {
      id: "step-3",
      label: "Review BM General Manager",
      state: [
        "TRIAL_PENDING_SB_CONFIG",
        "TRIAL_PENDING_BM_REG_CONFIG",
        "TRIAL_REVISI_SB",
        "TRIAL_AKTIF",
        "TRIAL_EVALUASI_VOTING",
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_EVALUASI_TIDAK_LANJUT",
        "TRIAL_DITOLAK_REG_MGR",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_PENDING_BM_GM"
        ? "current"
        : "pending",
    },
    {
      id: "step-4",
      label: "Menunggu S&B",
      state: [
        "TRIAL_PENDING_BM_REG_CONFIG",
        "TRIAL_AKTIF",
        "TRIAL_EVALUASI_VOTING",
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_EVALUASI_TIDAK_LANJUT",
        "TRIAL_DITOLAK_REG_MGR",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_PENDING_SB_CONFIG"
        ? "current"
        : isRevisiSB
        ? "revision"
        : "pending",
    },
    {
      id: "step-5",
      label: "Review B&M Regional Manager",
      state: [
        "TRIAL_AKTIF",
        "TRIAL_EVALUASI_VOTING",
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_EVALUASI_TIDAK_LANJUT",
        "TRIAL_DITOLAK_REG_MGR",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_PENDING_BM_REG_CONFIG"
        ? "current"
        : "pending",
    },
    {
      id: "step-6",
      label: `Trial Aktif`,
      state: [
        "TRIAL_EVALUASI_VOTING",
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_EVALUASI_TIDAK_LANJUT",
        "TRIAL_DITOLAK_REG_MGR",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_AKTIF"
        ? "current"
        : "pending",
    },
    {
      id: "step-7",
      label: "Evaluasi",
      state: [
        "TRIAL_PENDING_FINAL_BM_REG",
        "TRIAL_PROMOTED_MASTER",
      ].includes(st)
        ? "completed"
        : st === "TRIAL_EVALUASI_VOTING"
        ? "current"
        : isTidakLanjut
        ? "rejected"
        : "pending",
    },
    {
      id: "step-8",
      label: "Penetapan Master",
      state: isDoneMaster
        ? "completed"
        : st === "TRIAL_PENDING_FINAL_BM_REG"
        ? "current"
        : isRejectReg
        ? "rejected"
        : "pending",
    },
  ];

  // Temukan step aktif saat ini
  const activeStep = steps.find(
    (s) => s.state === "current" || s.state === "revision" || s.state === "rejected"
  );
  const isAllComplete = steps.every((s) => s.state === "completed");

  return (
    <div
      className={`border border-slate-200 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs space-y-3.5 ${className}`}
    >
      {/* Header Bar Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0 border border-red-100">
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">Alur Pelaksanaan Trial</h4>
              {compact && (
                <span className="text-[10px] text-slate-500">
                  ({item.durasiBulan || 3} Bulan / {item.durasiHari || 90} Hari)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Pelacakan progres tahapan dan persetujuan pengajuan trial ({item.durasiBulan || 3} Bulan / {item.durasiHari || 90} Hari)
            </p>
          </div>
        </div>

        {/* Status Tracker Pill */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {isAllComplete ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Selesai &amp; Resmi Master Harga
            </span>
          ) : activeStep ? (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                activeStep.state === "revision"
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : activeStep.state === "rejected"
                  ? "text-rose-800 bg-rose-50 border-rose-200"
                  : "text-blue-800 bg-blue-50 border-blue-200"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeStep.state === "revision"
                      ? "bg-amber-500"
                      : activeStep.state === "rejected"
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeStep.state === "revision"
                      ? "bg-amber-600"
                      : activeStep.state === "rejected"
                      ? "bg-rose-600"
                      : "bg-blue-600"
                  }`}
                ></span>
              </span>
              <span>
                {activeStep.state === "revision"
                  ? "Perlu Revisi: "
                  : activeStep.state === "rejected"
                  ? "Ditolak: "
                  : "Saat ini: "}
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
