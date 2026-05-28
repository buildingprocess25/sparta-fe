"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DcTendersPage() {
  return (
    <main className="min-h-screen bg-[#edf2f6] px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/dc-development" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          DC Development
        </Link>
        <section className="mt-6 rounded-lg bg-white p-8 ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Tender</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Tender DC Development</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Struktur backend dan database tender sudah disiapkan. Implementasi detail peserta, OE review, revisi, dan pemenang akan masuk tahap berikutnya.
          </p>
        </section>
      </div>
    </main>
  );
}
