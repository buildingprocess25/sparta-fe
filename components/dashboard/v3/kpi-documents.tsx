import { ExternalLink } from "lucide-react";
import type { PerformanceDocumentLink } from "@/lib/api/performance-v3";

export function KpiDocuments({ documents }: { documents: PerformanceDocumentLink[] }) {
  if (!documents.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-black text-slate-900">Dokumen Terkait</h4>
        <p className="mt-2 text-sm font-medium text-slate-500">Tidak ada dokumen yang tersimpan untuk data ini.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-black text-slate-900">Dokumen Terkait</h4>
      <div className="mt-3 space-y-2">
        {documents.map((doc) => (
          <a
            key={`${doc.type}-${doc.url}`}
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition-[background-color,border-color] hover:border-red-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <span className="min-w-0">
              <span className="block truncate">{doc.label}</span>
              <span className="block text-[11px] font-semibold text-slate-400">Sumber KPI: {doc.source}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
