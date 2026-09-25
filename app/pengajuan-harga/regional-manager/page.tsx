"use client";

import React from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, Clock } from 'lucide-react';

export default function RegionalManagerPlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="B&M Regional Manager" showBackButton backHref="/pengajuan-harga" />
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl mb-4">
          <Building2 className="w-10 h-10" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Tahap Konfirmasi</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Halaman B&M Regional Manager
        </h1>
        <p className="text-slate-600 max-w-md text-sm mb-6">
          Sesuai arahan, pengerjaan prototype dilakukan secara bertahap. Halaman ini (Approval Layer 3 & Approval Jalur Trial) akan dikembangkan setelah tahap sebelumnya dikonfirmasi.
        </p>
        <Link href="/pengajuan-harga">
          <Button variant="outline" className="rounded-4xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pilihan Peran</span>
          </Button>
        </Link>
      </main>
    </div>
  );
}
