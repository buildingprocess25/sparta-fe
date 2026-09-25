"use client";

import React from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Database, ArrowLeft, Clock } from 'lucide-react';

export default function MasterCatalogPlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <AppNavbar title="Katalog Master Harga" showBackButton backHref="/pengajuan-harga" />
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-slate-200 text-slate-700 rounded-2xl mb-4">
          <Database className="w-10 h-10" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Tahap Konfirmasi</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Katalog Master Harga Aktif
        </h1>
        <p className="text-slate-600 max-w-md text-sm mb-6">
          Sesuai arahan, pengerjaan prototype dilakukan secara bertahap. Halaman katalog ini (koleksi item yang telah rampung seluruh layer approval dan siap digunakan di seluruh SPARTA) akan dikembangkan setelah alur peran dikonfirmasi.
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
