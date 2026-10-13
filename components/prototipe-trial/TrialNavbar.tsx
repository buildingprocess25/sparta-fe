// =============================================================================
// components/prototipe-trial/TrialNavbar.tsx
// Navigasi Bersih & Quick Role Switcher untuk Prototipe Alur Trial
// Bahasa: Lugas, Ringkas, Tanpa Teks Tidak Perlu
// =============================================================================

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { resetToDefaultTrialItems } from './store';

export interface RoleRoute {
  key: string;
  label: string;
  href: string;
}

export const TRIAL_ROLES: RoleRoute[] = [
  { key: 'maker', label: 'Maker', href: '/prototipe-trial/maker' },
  { key: 'pp_mgr', label: 'PP Manager', href: '/prototipe-trial/pp-manager' },
  { key: 'bm_gm', label: 'B&M GM', href: '/prototipe-trial/bm-general-manager' },
  { key: 'sb', label: 'S&B Specialist', href: '/prototipe-trial/sb-specialist' },
  { key: 'reg_mgr', label: 'Regional Manager', href: '/prototipe-trial/regional-manager' },
  { key: 'monitoring', label: 'Trial Aktif (SPK)', href: '/prototipe-trial/monitoring-trial' },
  { key: 'evaluasi', label: 'Evaluasi Tim', href: '/prototipe-trial/evaluasi-tim' },
  { key: 'master', label: 'Master Harga', href: '/prototipe-trial/master-harga' },
];

interface TrialNavbarProps {
  subtitle?: string;
}

export function TrialNavbar({
  subtitle,
}: TrialNavbarProps) {
  const pathname = usePathname();

  const handleResetData = () => {
    if (confirm('Kembalikan data prototipe ke data awal (mock)?')) {
      resetToDefaultTrialItems();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Baris Atas: Identitas Portal & Aksi Reset */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/prototipe-trial"
            className="flex items-center gap-2 font-bold text-slate-900 hover:text-red-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">SPARTA</span>
              <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold uppercase">
                Trial
              </span>
            </div>
          </Link>

          <span className="text-slate-300">/</span>

          <div className="flex items-center text-xs text-slate-500 gap-1.5">
            <Link href="/prototipe-trial" className="hover:text-slate-800 transition-colors">
              Portal Peran
            </Link>
            {subtitle && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{subtitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Button: Reset Mock Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetData}
            title="Reset data demo ke awal"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <Link
            href="/pengajuan-harga"
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            Ke Menu Utama
          </Link>
        </div>
      </div>

      {/* Baris Bawah: Quick Role Switcher Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs">
          <span className="text-slate-600 font-semibold shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Peran:
          </span>

          <Link
            href="/prototipe-trial"
            className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
              pathname === '/prototipe-trial'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Portal Utama
          </Link>

          {TRIAL_ROLES.map((role) => {
            const isActive = pathname.startsWith(role.href);
            return (
              <Link
                key={role.key}
                href={role.href}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {role.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
