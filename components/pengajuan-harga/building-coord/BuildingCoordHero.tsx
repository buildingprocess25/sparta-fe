"use client";

import React from 'react';
import { HardHat } from 'lucide-react';

interface BuildingCoordHeroProps {
  countSiapSurvei: number;
  countDiproses: number;
  countSelesai: number;
}

export function BuildingCoordHero({
  countSiapSurvei,
  countDiproses,
  countSelesai,
}: BuildingCoordHeroProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
          <HardHat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900">
            Building Coordinator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Survei harga material 3 toko
          </p>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
          <span className="text-[11px] text-slate-500 font-medium block">Siap Survei</span>
          <span className="text-lg font-bold text-amber-700">{countSiapSurvei}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
          <span className="text-[11px] text-slate-500 font-medium block">Diproses</span>
          <span className="text-lg font-bold text-blue-700">{countDiproses}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
          <span className="text-[11px] text-slate-500 font-medium block">Selesai</span>
          <span className="text-lg font-bold text-emerald-700">{countSelesai}</span>
        </div>
      </div>
    </div>
  );
}
