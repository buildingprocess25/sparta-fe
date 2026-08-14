"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileIcon,
  HelpCircle,
  Loader2,
  UploadCloud,
  Eye,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSession } from "@/context/SessionContext";
import { fetchDcArchiveProjects, fetchDcDocuments, uploadDcDocuments, type DcArchiveProject, type DcDocument } from "@/lib/api";
import { DC_DOCUMENT_CONFIG, DC_DOCUMENT_LEGENDS, RENOVASI_ALLOWED_UTAMA, type DokumenUtama } from "@/lib/dc-document.config";

export default function DcDocumentDetailPage({ params }: { params: { id: string; tipe: string } }) {
  const router = useRouter();
  const { user, isLoading } = useSession();
  
  const [archive, setArchive] = useState<DcArchiveProject | null>(null);
  const [documents, setDocuments] = useState<DcDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  
  const actor = useMemo(() => ({
    actor_email: user?.email || "",
    actor_role: user?.role || "",
  }), [user]);

  const loadData = useCallback(async () => {
    if (!actor.actor_email) return;
    setLoading(true);
    try {
      // 1. Fetch archives to find the current one (we need project_id)
      const archRes = await fetchDcArchiveProjects({
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, { suppressGlobalError: true });
      
      const currentArchive = (archRes.data ?? []).find(a => a.id === parseInt(params.id));
      if (!currentArchive) {
        throw new Error("Arsip tidak ditemukan");
      }
      setArchive(currentArchive);
      
      // 2. Fetch documents for this project_id and stage
      const docsRes = await fetchDcDocuments({
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
        project_id: currentArchive.project_id,
        entity_type: "DC_ARCHIVE_PROJECT",
        stage: params.tipe,
      }, { suppressGlobalError: true });
      
      setDocuments(docsRes.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [actor.actor_email, actor.actor_role, params.id, params.tipe]);

  useEffect(() => {
    if (!isLoading && user) loadData();
  }, [isLoading, user, loadData]);

  const docConfig = useMemo(() => {
    if (params.tipe === "RENOVASI") {
      return DC_DOCUMENT_CONFIG.filter(u => RENOVASI_ALLOWED_UTAMA.includes(u.title));
    }
    return DC_DOCUMENT_CONFIG;
  }, [params.tipe]);
  
  const formatKey = (jenisKey: string, type: string) => `${jenisKey}__${type.replace(/\//g, '_')}`;

  const handleFileUpload = async (jenisKey: string, type: string, file: File) => {
    if (!archive || !actor.actor_email) return;
    
    const compositeKey = formatKey(jenisKey, type);
    setUploadingKey(compositeKey);
    try {
      await uploadDcDocuments({
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
        project_id: archive.project_id,
        entity_type: "DC_ARCHIVE_PROJECT",
        document_type: compositeKey,
        stage: params.tipe,
      }, [file]);
      
      // Reload docs
      await loadData();
    } catch (error) {
      alert("Gagal mengupload dokumen");
    } finally {
      setUploadingKey(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadContext, setActiveUploadContext] = useState<{key: string, type: string} | null>(null);

  const triggerUpload = (jenisKey: string, type: string) => {
    setActiveUploadContext({ key: jenisKey, type });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadContext) {
      handleFileUpload(activeUploadContext.key, activeUploadContext.type, file);
    }
  };

  if (isLoading || (loading && !archive)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  if (!archive) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-lg font-medium text-slate-500">Data Arsip tidak ditemukan.</p>
        <Link href="/dc-development/documents">
          <Button variant="outline" className="mt-4">Kembali</Button>
        </Link>
      </main>
    );
  }

  const tipeLabel = params.tipe.charAt(0) + params.tipe.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-[#f4f7f9] text-slate-900 pb-20 [font-family:var(--font-sans)]">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 to-red-600 shadow-md">
        <div className="mx-auto flex h-[80px] max-w-[1400px] items-center gap-5 px-6 lg:px-8">
          <Link href="/dc-development/documents" className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-red-700" title="Kembali">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white">{archive.archive_name}</h1>
            <p className="text-xs font-medium text-red-100 flex items-center gap-2">
              <span className="bg-red-800/50 px-2 py-0.5 rounded uppercase tracking-wider">{tipeLabel}</span>
              {archive.branch_name}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT MAIN CONTENT */}
        <div className="flex-1 w-full space-y-6">
          
          <Accordion type="multiple" defaultValue={docConfig.map(d => d.id)} className="space-y-4">
            {docConfig.map((utama, uIdx) => (
              <AccordionItem key={utama.id} value={utama.id} className="border-0 rounded-2xl bg-white shadow-sm overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-black shrink-0">
                      {utama.id}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{utama.title}</h2>
                      <p className="text-xs text-slate-500 font-medium">Kategori Dokumen Utama</p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="space-y-8 pl-14">
                    {utama.details.map((detail, dIdx) => (
                      <div key={dIdx} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white px-2">
                            {detail.title}
                          </span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        
                        <div className="grid gap-3">
                          {detail.jenis.map((jenis, jIdx) => (
                            <div key={jenis.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-white">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 text-sm font-bold text-slate-400 w-6 shrink-0">{jIdx + 1}.</span>
                                <p className="font-semibold text-slate-700 leading-tight">{jenis.title}</p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end ml-9 sm:ml-0">
                                {jenis.slots.map(slot => {
                                  const compKey = formatKey(jenis.key, slot.type);
                                  const existingDoc = documents.find(d => d.document_type === compKey);
                                  const isUploading = uploadingKey === compKey;
                                  
                                  return (
                                    <div key={compKey} className="relative group/slot">
                                      {existingDoc ? (
                                        <a href={existingDoc.link_dokumen ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100">
                                          <CheckCircle2 className="h-4 w-4" />
                                          {slot.type}
                                          <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                                        </a>
                                      ) : isUploading ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Uploading...
                                        </div>
                                      ) : (
                                        <button onClick={() => triggerUpload(jenis.key, slot.type)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-300 hover:text-red-600 hover:shadow">
                                          <UploadCloud className="h-4 w-4" />
                                          {slot.type}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
        </div>

        {/* RIGHT SIDEBAR - LEGEND */}
        <div className="w-full lg:w-[320px] shrink-0 sticky top-[112px]">
          <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Info className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold">Legenda Singkatan</h3>
                <p className="text-xs text-slate-400">Panduan arti singkatan dokumen</p>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto px-5 py-2 custom-scrollbar">
                <ul className="space-y-3 py-3">
                  {DC_DOCUMENT_LEGENDS.map((leg, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-bold text-blue-300 block">{leg.abbrev}</span>
                      <span className="text-slate-300 text-xs leading-relaxed">{leg.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
