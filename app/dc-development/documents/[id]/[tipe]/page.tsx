"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
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
  Info,
  Trash2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import { fetchDcArchiveProjects, fetchDcDocuments, uploadDcDocuments, deleteDcDocument, buildDcDocumentViewUrl, updateDcDocument, type DcArchiveProject, type DcDocument } from "@/lib/api";
import { DC_DOCUMENT_CONFIG, DC_DOCUMENT_LEGENDS, RENOVASI_ALLOWED_UTAMA, getTotalRequiredDcDocumentSlots, type DokumenUtama } from "@/lib/dc-document.config";

export default function DcDocumentDetailPage() {
  const router = useRouter();
  const { id, tipe } = useParams() as { id: string; tipe: string };
  const { user, isLoading } = useSession();
  
  const [archive, setArchive] = useState<DcArchiveProject | null>(null);
  const [documents, setDocuments] = useState<DcDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNoteDoc, setEditingNoteDoc] = useState<DcDocument | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  
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
      
      const currentArchive = (archRes.data ?? []).find(a => a.id === parseInt(id));
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
        stage: tipe,
      }, { suppressGlobalError: true });
      
      setDocuments(docsRes.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [actor.actor_email, actor.actor_role, id, tipe]);

  useEffect(() => {
    if (!isLoading && user) loadData();
  }, [isLoading, user, loadData]);

  const docConfig = useMemo(() => {
    if (tipe === "RENOVASI") {
      return DC_DOCUMENT_CONFIG.filter(u => RENOVASI_ALLOWED_UTAMA.includes(u.title));
    }
    return DC_DOCUMENT_CONFIG;
  }, [tipe]);
  
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
        stage: tipe,
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadContext) return;
    handleFileUpload(activeUploadContext.key, activeUploadContext.type, file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    try {
      await deleteDcDocument(docId, actor);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menghapus dokumen.");
    }
  };

  const handleSaveNote = async () => {
    if (!editingNoteDoc) return;
    setSavingNote(true);
    try {
      await updateDcDocument(editingNoteDoc.id, {
        ...actor,
        notes: noteText
      });
      await loadData();
      setNoteModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menyimpan catatan.");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
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

  const tipeLabel = tipe.charAt(0) + tipe.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-[#f4f7f9] text-slate-900 pb-20 [font-family:var(--font-sans)]">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 to-red-600 shadow-md">
        <div className="mx-auto flex h-[80px] max-w-[1400px] items-center gap-5 px-6 lg:px-8">
          <Link href="/dc-development/documents" className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-red-700" title="Kembali">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <Image src="/assets/Alfamart-Emblem.png" alt="Alfamart" width={94} height={42} className="h-[42px] w-auto drop-shadow-md" priority />
          <div className="h-8 w-px bg-white/20" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white">{archive.archive_name}</h1>
            <p className="text-xs font-medium text-red-100 flex items-center gap-2">
              <span className="bg-red-800/50 px-2 py-0.5 rounded uppercase tracking-wider">{tipeLabel}</span>
              {archive.branch_name}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-red-200 uppercase tracking-wider">Progress Dokumen</span>
              <span className="text-lg font-bold text-white">{new Set(documents.map(d => (d.document_type || "").split('__')[0])).size} / {getTotalRequiredDcDocumentSlots(tipe)}</span>
            </div>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-black shrink-0 text-lg">
                      {uIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{utama.title}</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Kategori Dokumen Utama</p>
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
                                    <div key={compKey} className="relative group/slot flex flex-col items-end gap-1">
                                      {existingDoc ? (
                                        <div className="flex flex-col gap-1 w-full items-end">
                                          <div className="flex items-center gap-1.5">
                                            <a href={buildDcDocumentViewUrl(existingDoc.id, actor, "view")} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100">
                                              <CheckCircle2 className="h-4 w-4" />
                                              {slot.type}
                                            </a>
                                            <button onClick={() => { setEditingNoteDoc(existingDoc); setNoteText(existingDoc.notes || ""); setNoteModalOpen(true); }} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300" title="Catatan">
                                              <MessageSquare className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(existingDoc.id)} className="flex items-center justify-center p-2 rounded-lg border border-red-200 bg-white text-red-500 transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-300" title="Hapus Dokumen">
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                          {existingDoc.notes && (
                                            <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 max-w-[200px] truncate" title={existingDoc.notes}>
                                              <span className="font-semibold text-slate-600">Catatan:</span> {existingDoc.notes}
                                            </div>
                                          )}
                                        </div>
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

        {/* RIGHT SIDEBAR / LEGEND */}
        <div className="w-full lg:w-80 shrink-0 sticky top-28 rounded-2xl bg-white p-6 shadow-xl border border-slate-200 h-fit">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-red-50 p-2.5">
              <Info className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Legenda Singkatan</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Panduan arti singkatan dokumen</p>
            </div>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
            {DC_DOCUMENT_LEGENDS.map(leg => (
              <div key={leg.abbrev}>
                <div className="font-bold text-red-600">{leg.abbrev}</div>
                <div className="text-sm leading-tight text-slate-600 mt-1">{leg.meaning}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DIALOG CATATAN */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catatan Dokumen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea 
              placeholder="Tulis catatan opsional..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveNote} disabled={savingNote} className="bg-red-600 hover:bg-red-700 text-white">
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
}
