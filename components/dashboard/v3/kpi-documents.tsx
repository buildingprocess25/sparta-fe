import { ExternalLink, FileIcon } from "lucide-react";
import type { PerformanceDocumentLink } from "@/lib/api/performance-v3";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="h-6 w-1.5 shrink-0 rounded-full bg-red-500" />
    <h4 className="text-xl font-bold tracking-tight text-slate-900">{title}</h4>
  </div>
);

export function KpiDocuments({ documents }: { documents: PerformanceDocumentLink[] }) {
  if (!documents.length) {
    return (
      <section>
        <SectionHeader title="Dokumen Terkait" />
        <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/40 py-10">
          <FileIcon className="h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Tidak ada dokumen yang tersimpan untuk data ini.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Dokumen Terkait" />
      <div className="mt-4 flex flex-col gap-3">
        {documents.map((doc) => (
          <a
            key={`${doc.type}-${doc.url}`}
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-4 rounded-[20px] bg-white/80 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] ring-1 ring-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-red-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-red-50 group-hover:text-red-500 group-hover:ring-red-100">
                <FileIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold tracking-tight text-slate-800 transition-colors group-hover:text-red-600">{doc.label}</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Sumber: {doc.source}</span>
              </span>
            </div>
            <ExternalLink className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-red-500" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
