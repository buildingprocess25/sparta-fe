"use client";

import React from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Card } from '@/components/ui/card';

interface RoleOption {
  name: string;
  href: string;
}

const ROLES: RoleOption[] = [
  {
    name: 'B&M Manager',
    href: '/pengajuan-harga/bm-manager',
  },
  {
    name: 'S&B Controlling Specialist',
    href: '/pengajuan-harga/sb-specialist',
  },
  {
    name: 'Building Coordinator',
    href: '/pengajuan-harga/building-coord',
  },
  {
    name: 'B&M Regional Manager',
    href: '/pengajuan-harga/regional-manager',
  },
  {
    name: 'Kontraktor',
    href: '/pengajuan-harga/kontraktor',
  },
  {
    name: 'Katalog Master Harga',
    href: '/pengajuan-harga/master-catalog',
  },
];

export default function PengajuanHargaLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Pengajuan Master Harga" showBackButton backHref="/dashboard" />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Pilih Peran
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-2">
            Silakan pilih peran untuk mengakses halaman masing-masing
          </p>
        </div>

        {/* Roles Grid: Hanya menampilkan nama role saja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {ROLES.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="group block outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
            >
              <Card className="h-28 md:h-32 flex items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-md hover:border-red-500 hover:-translate-y-0.5 transition-all text-center cursor-pointer">
                <span className="text-base md:text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                  {role.name}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
