// =============================================================================
// components/prototipe-trial/TrialAuditLogCard.tsx
// Kartu Rekam Jejak (Audit Log) Persetujuan & Perjalanan Item Trial Sparta
// Fitur: Timeline Riwayat Keputusan, Aktor, Tanggal, dan Catatan
// Font: Geist (font-sans)
// =============================================================================

"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, CheckCircle2, RotateCcw, Send, Settings, Sparkles, RefreshCw } from 'lucide-react';
import { TrialHistoryLog } from './types';

interface TrialAuditLogCardProps {
  logs?: TrialHistoryLog[];
}

export function TrialAuditLogCard({ logs = [] }: TrialAuditLogCardProps) {
  const getActionBadge = (action: TrialHistoryLog['action']) => {
    switch (action) {
      case 'SUBMIT':
        return {
          label: 'Diajukan',
          icon: <Send className="w-3 h-3 text-blue-600" />,
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'APPROVE':
        return {
          label: 'Disetujui',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'REVISE':
        return {
          label: 'Minta Revisi',
          icon: <RotateCcw className="w-3 h-3 text-amber-600" />,
          colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CONFIG':
        return {
          label: 'Dikonfigurasi',
          icon: <Settings className="w-3 h-3 text-sky-600" />,
          colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'EVALUATE':
        return {
          label: 'Dievaluasi',
          icon: <CheckCircle2 className="w-3 h-3 text-orange-600" />,
          colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'PROMOTE':
        return {
          label: 'Resmi Master',
          icon: <Sparkles className="w-3 h-3 text-teal-600" />,
          colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'RE_ENTRY':
        return {
          label: 'Re-Entry',
          icon: <RefreshCw className="w-3 h-3 text-purple-600" />,
          colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      default:
        return {
          label: action,
          icon: <History className="w-3 h-3 text-slate-600" />,
          colorClass: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-2xs rounded-2xl overflow-hidden font-sans text-slate-800">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-red-600" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Riwayat Jejak Rekam (Audit Log)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {logs.length > 0 ? (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {logs.map((log, index) => {
              const meta = getActionBadge(log.action);
              return (
                <div key={index} className="relative group">
                  {/* Bullet Node */}
                  <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-red-500 transition-colors flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-red-500 transition-colors" />
                  </div>

                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {log.role}
                        </span>
                        {log.namaUser && (
                          <span className="text-[11px] text-slate-500">
                            ({log.namaUser})
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.colorClass}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {log.tanggal}
                      </span>
                    </div>

                    {log.catatan && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70 leading-relaxed">
                        &ldquo;{log.catatan}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada catatan riwayat untuk item ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
