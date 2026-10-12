// =============================================================================
// app/prototipe-trial/page.tsx
// Portal Utama / Pilih Peran Prototipe Alur Trial Sparta
// Mengadopsi Pola Desain /pengajuan-harga (Lugas, Ringkas, Clean Architecture)
// =============================================================================

"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrialNavbar } from '@/components/prototipe-trial/TrialNavbar';
import { useTrialStore } from '@/components/prototipe-trial/store';
import {
  FilePlus2,
  CheckCheck,
  Building2,
  Calculator,
  ShieldCheck,
  ClockAlert,
  Vote,
  Database,
  ArrowRight,
} from 'lucide-react';

interface RoleCardItem {
  key: string;
  name: string;
  roleDescription: string;
  href: string;
  icon: React.ReactNode;
  countKey?: 'maker' | 'pp' | 'bmgm' | 'sb' | 'regmgr' | 'aktif' | 'evaluasi' | 'master';
}

export default function PrototipeTrialLandingPage() {
  const { items, mounted } = useTrialStore();

  // Hitung jumlah item antrean per peran
  const counts = {
    maker: items.filter((i) => i.status === 'TRIAL_DRAFT' || i.status === 'TRIAL_REVISI_MAKER').length,
    pp: items.filter((i) => i.status === 'TRIAL_PENDING_PP_MGR').length,
    bmgm: items.filter((i) => i.status === 'TRIAL_PENDING_BM_GM').length,
    sb: items.filter((i) => i.status === 'TRIAL_PENDING_SB_CONFIG' || i.status === 'TRIAL_REVISI_SB').length,
    regmgr: items.filter((i) => i.status === 'TRIAL_PENDING_BM_REG_CONFIG' || i.status === 'TRIAL_PENDING_FINAL_BM_REG').length,
    aktif: items.filter((i) => i.status === 'TRIAL_AKTIF').length,
    evaluasi: items.filter((i) => i.status === 'TRIAL_EVALUASI_VOTING').length,
    master: items.filter((i) => i.status === 'TRIAL_PROMOTED_MASTER').length,
  };

  const ROLE_CARDS: RoleCardItem[] = [
    {
      key: 'maker',
      name: 'Maker',
      roleDescription: 'Inisiasi pengajuan trial, estimasi harga, bongkaran & lampiran.',
      href: '/prototipe-trial/maker',
      icon: <FilePlus2 className="w-5 h-5 text-blue-600" />,
      countKey: 'maker',
    },
    {
      key: 'pp-mgr',
      name: 'PP Manager',
      roleDescription: 'Validasi kelayakan awal (Auto-skip jika diajukan PP Mgr).',
      href: '/prototipe-trial/pp-manager',
      icon: <CheckCheck className="w-5 h-5 text-amber-600" />,
      countKey: 'pp',
    },
    {
      key: 'bm-gm',
      name: 'B&M General Manager',
      roleDescription: 'Persetujuan manajerial puncak sebelum penetapan harga.',
      href: '/prototipe-trial/bm-general-manager',
      icon: <Building2 className="w-5 h-5 text-purple-600" />,
      countKey: 'bmgm',
    },
    {
      key: 'sb',
      name: 'S&B Specialist',
      roleDescription: 'Penyesuaian harga final, koefisien upah, material & margin.',
      href: '/prototipe-trial/sb-specialist',
      icon: <Calculator className="w-5 h-5 text-sky-600" />,
      countKey: 'sb',
    },
    {
      key: 'reg-mgr',
      name: 'B&M Regional Manager',
      roleDescription: 'Persetujuan harga trial & penetapan akhir menjadi master.',
      href: '/prototipe-trial/regional-manager',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
      countKey: 'regmgr',
    },
    {
      key: 'monitoring',
      name: 'Trial Aktif (Katalog SPK)',
      roleDescription: 'Monitoring masa aktif di cabang & cetak dokumen resmi.',
      href: '/prototipe-trial/monitoring-trial',
      icon: <ClockAlert className="w-5 h-5 text-emerald-600" />,
      countKey: 'aktif',
    },
    {
      key: 'evaluasi',
      name: 'Tim Evaluasi (PP, BMES, S&B)',
      roleDescription: 'Form penilaian mandiri, lampiran bukti & kuorum 2 dari 3.',
      href: '/prototipe-trial/evaluasi-tim',
      icon: <Vote className="w-5 h-5 text-orange-600" />,
      countKey: 'evaluasi',
    },
    {
      key: 'master',
      name: 'Master Harga',
      roleDescription: 'Katalog master harga resmi hasil kelulusan pengujian trial.',
      href: '/prototipe-trial/master-harga',
      icon: <Database className="w-5 h-5 text-teal-600" />,
      countKey: 'master',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <TrialNavbar subtitle="Pilih Peran" />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {/* Header Bersih & Ringkas */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-3 border border-red-200">
            Prototipe Alur Pengajuan Trial Sparta
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pilih Peran Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Pilih salah satu peran untuk menguji alur kerja, pengisian formulir, persetujuan bertingkat, dan evaluasi kuorum.
          </p>
        </div>

        {/* Roles Grid (Mengadopsi Pola /pengajuan-harga) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {ROLE_CARDS.map((card) => {
            const count = mounted && card.countKey ? counts[card.countKey] : 0;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="group block outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
              >
                <Card className="h-full p-5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-md hover:border-red-500 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                        {card.icon}
                      </div>
                      {count > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-red-50 text-red-700 border-red-200 text-xs font-semibold px-2 py-0.5"
                        >
                          {count} Item
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {card.roleDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-red-600 transition-colors">
                    <span>Masuk Halaman</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Info Ringkas Status Data Demo */}
        <div className="mt-8 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>
            💡 Data demo tersimpan di peramban lokal (<code className="text-slate-700">localStorage</code>). Anda dapat melakukan reset data kapan saja lewat tombol di navigasi atas.
          </span>
          <span className="font-semibold text-slate-700 shrink-0">
            Total {mounted ? items.length : 0} Item Demo
          </span>
        </div>
      </main>
    </div>
  );
}
