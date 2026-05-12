"use client";

import { useEffect } from "react";

const isDev = process.env.NODE_ENV !== "production";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sistem mengalami error dan halaman tidak bisa ditampilkan.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pesan
          </div>
          <div className="mt-2 text-sm text-slate-800">
            {isDev ? error.message : "Silakan coba lagi atau hubungi admin."}
          </div>
          {isDev && error.stack ? (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
              {error.stack}
            </pre>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
