"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UploadCloud,
  Info,
  Trash2,
  MessageSquare,
  DownloadCloud,
  FileText,
  FileSpreadsheet,
  File,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSession } from "@/context/SessionContext";
import { fetchDcArchiveProjects, fetchDcDocuments, uploadDcDocuments, deleteDcDocument, buildDcDocumentViewUrl, updateDcDocument, exportDcData, fetchDcDocumentCustomItems, createDcDocumentCustomItem, deleteDcDocumentCustomItem, type DcArchiveProject, type DcDocument, type DcDocumentCustomItem, type DcDocumentUploadSlotType } from "@/lib/api";
import { DC_DOCUMENT_LEGENDS, getDcDocumentConfigForStage, getTotalRequiredDcDocumentSlots } from "@/lib/dc-document.config";

const CUSTOM_SLOT_OPTIONS: DcDocumentUploadSlotType[] = ["PDF/JPEG", "AUTOCAD", "WORD", "EXCEL", "PPT"];

const getCustomItemKey = (item: DcDocumentCustomItem) => `CUSTOM_K_${item.id}`;

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function DcDocumentDetailPage() {
  const { id, tipe } = useParams() as { id: string; tipe: string };
  const { user, isLoading } = useSession();

  const [archive, setArchive] = useState<DcArchiveProject | null>(null);
  const [documents, setDocuments] = useState<DcDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNoteDoc, setEditingNoteDoc] = useState<DcDocument | null>(null);
  const [noteUploadContext, setNoteUploadContext] = useState<{key: string, type: string} | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [customItems, setCustomItems] = useState<DcDocumentCustomItem[]>([]);
  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [customItemTitle, setCustomItemTitle] = useState("");
  const [customItemSlots, setCustomItemSlots] = useState<DcDocumentUploadSlotType[]>(["PDF/JPEG"]);
  const [savingCustomItem, setSavingCustomItem] = useState(false);
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

      // 2. Fetch documents and custom items for this project_id and stage
      const [docsRes, customItemsRes] = await Promise.all([
        fetchDcDocuments({
          actor_email: actor.actor_email,
          actor_role: actor.actor_role,
          project_id: currentArchive.project_id,
          entity_type: "DC_ARCHIVE_PROJECT",
          stage: tipe,
        }, { suppressGlobalError: true }),
        fetchDcDocumentCustomItems(currentArchive.id, {
          actor_email: actor.actor_email,
          actor_role: actor.actor_role,
          stage: tipe,
        }, { suppressGlobalError: true }),
      ]);

      setDocuments(docsRes.data ?? []);
      setCustomItems(customItemsRes.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [actor.actor_email, actor.actor_role, id, tipe]);

  useEffect(() => {
    if (!isLoading && user) loadData();
  }, [isLoading, user, loadData]);

  const docConfig = useMemo(() => getDcDocumentConfigForStage(tipe), [tipe]);

  const customDocumentItemsForStage = useMemo(() => (
    customItems.filter(item => item.stage === tipe.toUpperCase())
  ), [customItems, tipe]);

  const visibleItemKeys = useMemo(() => {
    const keys = new Set<string>();
    docConfig.forEach(utama => {
      utama.details.forEach(detail => {
        detail.jenis.forEach(jenis => keys.add(jenis.key));
      });
    });
    customDocumentItemsForStage.forEach(item => keys.add(getCustomItemKey(item)));
    return keys;
  }, [customDocumentItemsForStage, docConfig]);

  const uploadedItemCount = useMemo(() => (
    new Set(
      documents
        .filter(d => !!(d.drive_file_id || d.file_name))
        .map(d => (d.document_type || "").split('__')[0])
        .filter(key => visibleItemKeys.has(key))
    ).size
  ), [documents, visibleItemKeys]);

  const requiredItemCount = useMemo(() => (
    getTotalRequiredDcDocumentSlots(tipe) + customDocumentItemsForStage.length
  ), [customDocumentItemsForStage.length, tipe]);

  const formatKey = (jenisKey: string, type: string) => `${jenisKey}__${type.replace(/\//g, '_')}`;

  const handleFileUpload = async (jenisKey: string, type: string, files: File[]) => {
    if (!archive || !actor.actor_email || files.length === 0) return;

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
      }, files);

      // Reload docs
      await loadData();
    } catch {
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
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0 || !activeUploadContext) return;
    handleFileUpload(activeUploadContext.key, activeUploadContext.type, selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    try {
      await deleteDcDocument(docId, actor);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Gagal menghapus dokumen."));
    }
  };

  const renderDocumentSlot = (jenisKey: string, type: string) => {
    const compKey = formatKey(jenisKey, type);
    const slotDocuments = documents.filter(d => d.document_type === compKey);
    const isUploading = uploadingKey === compKey;

    return (
      <div key={compKey} className="relative group/slot w-full sm:w-auto">
        {slotDocuments.length > 0 ? (
          <div className="flex flex-col gap-3 w-full sm:items-end">
            {slotDocuments.map((doc, index) => (
              <div key={doc.id} className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.drive_file_id || doc.file_name ? (
                    <a href={buildDcDocumentViewUrl(doc.id, actor, "view")} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[120px]">{slotDocuments.length > 1 ? `${type} ${index + 1}` : type}</span>
                    </a>
                  ) : (
                    <button onClick={() => triggerUpload(jenisKey, type)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-300 hover:text-red-600 hover:shadow">
                      <UploadCloud className="h-4 w-4 shrink-0" />
                      Upload {type}
                    </button>
                  )}
                  <button onClick={() => { setNoteUploadContext(null); setEditingNoteDoc(doc); setNoteText(doc.notes || ""); setNoteModalOpen(true); }} className="flex shrink-0 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300" title="Catatan">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="flex shrink-0 items-center justify-center p-2 rounded-lg border border-red-200 bg-white text-red-500 transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-300" title="Hapus Dokumen">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {doc.notes && (
                  <div className="text-[11px] text-slate-600 bg-yellow-50/50 border border-yellow-200/60 rounded-md px-2.5 py-1.5 w-full sm:max-w-[200px] break-words" title={doc.notes}>
                    <span className="font-bold text-yellow-700/80 mr-1">Catatan:</span>{doc.notes}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end w-full">
              <button onClick={() => triggerUpload(jenisKey, type)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-transparent px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm transition-all hover:border-red-300 hover:text-red-600 hover:bg-red-50" title="Tambah file lagi">
                <Plus className="h-3 w-3 shrink-0" />
                Tambah File
              </button>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingNoteDoc(null); setNoteUploadContext({ key: jenisKey, type }); setNoteText(""); setNoteModalOpen(true); }} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300" title="Tambah Catatan">
              <MessageSquare className="h-4 w-4" />
            </button>
            <button onClick={() => triggerUpload(jenisKey, type)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-300 hover:text-red-600 hover:shadow">
              <UploadCloud className="h-4 w-4" />
              {type}
            </button>
          </div>
        )}
      </div>
    );
  };
  const handleSaveNote = async () => {
    if (!actor.actor_email) return;
    setSavingNote(true);
    try {
      if (editingNoteDoc) {
        await updateDcDocument(editingNoteDoc.id, {
          ...actor,
          notes: noteText
        });
      } else if (noteUploadContext) {
        if (!archive) throw new Error("Arsip tidak ditemukan");
        const compositeKey = noteUploadContext.type 
          ? formatKey(noteUploadContext.key, noteUploadContext.type)
          : noteUploadContext.key;
          
        await uploadDcDocuments({
          actor_email: actor.actor_email,
          actor_role: actor.actor_role,
          project_id: archive.project_id,
          entity_type: "DC_ARCHIVE_PROJECT",
          document_type: compositeKey,
          stage: tipe,
          notes: noteText
        }, []);
      }
      await loadData();
      setNoteModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Gagal menyimpan catatan."));
    } finally {
      setSavingNote(false);
    }
  };
  const resetCustomItemForm = () => {
    setCustomItemTitle("");
    setCustomItemSlots(["PDF/JPEG"]);
  };

  const openCreateCustomItemModal = () => {
    resetCustomItemForm();
    setCustomItemModalOpen(true);
  };

  const toggleCustomItemSlot = (slot: DcDocumentUploadSlotType) => {
    setCustomItemSlots(current => (
      current.includes(slot)
        ? current.filter(item => item !== slot)
        : [...current, slot]
    ));
  };

  const handleCreateCustomItem = async () => {
    if (!archive || !actor.actor_email) return;
    const title = customItemTitle.trim();
    if (!title) {
      alert("Nama item wajib diisi.");
      return;
    }
    if (customItemSlots.length === 0) {
      alert("Pilih minimal satu jenis file upload.");
      return;
    }

    setSavingCustomItem(true);
    try {
      await createDcDocumentCustomItem(archive.id, {
        ...actor,
        stage: tipe.toUpperCase() as DcDocumentCustomItem["stage"],
        title,
        slots: customItemSlots,
      });
      await loadData();
      setCustomItemModalOpen(false);
      resetCustomItemForm();
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Gagal menambah item dokumen."));
    } finally {
      setSavingCustomItem(false);
    }
  };

  const handleDeleteCustomItem = async (item: DcDocumentCustomItem) => {
    if (!confirm(`Hapus item tambahan "${item.title}" dari tahap ini?`)) return;
    try {
      await deleteDcDocumentCustomItem(item.id, actor);
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, "Gagal menghapus item dokumen."));
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      await exportDcData(Number(id), format, user?.role || "", user?.email || "", tipe);
    } catch (e: unknown) {
      console.error(e);
      alert(getErrorMessage(e, "Gagal mengunduh laporan"));
    }
  };

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
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />

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
          <div className="ml-auto flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-red-400 bg-red-700/50 text-white hover:bg-red-700 hover:text-white transition-colors">
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Ekspor Laporan
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl">
                <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer hover:bg-slate-50 font-medium text-slate-700">
                  <FileText className="mr-2 h-4 w-4 text-slate-500" />
                  Unduh CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")} className="cursor-pointer hover:bg-slate-50 font-medium text-slate-700">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Unduh Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer hover:bg-slate-50 font-medium text-slate-700">
                  <File className="mr-2 h-4 w-4 text-red-500" />
                  Unduh PDF (Laporan)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-red-200 uppercase tracking-wider">Progress Dokumen</span>
              <span className="text-lg font-bold text-white">{uploadedItemCount} / {requiredItemCount}</span>
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
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-4">
                  <div className="flex flex-1 items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 font-black shrink-0 text-lg">
                        {uIdx + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{utama.title}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">Kategori Dokumen Utama</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const catNoteKey = `CAT_NOTE_${utama.id}`;
                        const catNoteDoc = documents.find(d => d.document_type === catNoteKey);
                        const hasNote = !!catNoteDoc?.notes;
                        return (
                          <Button
                            type="button"
                            size="sm"
                            variant={hasNote ? "default" : "outline"}
                            className={`rounded-lg shadow-sm transition-all ${hasNote ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"}`}
                            onClick={(event) => { 
                              event.stopPropagation();
                              if (catNoteDoc) {
                                setEditingNoteDoc(catNoteDoc);
                                setNoteUploadContext(null);
                                setNoteText(catNoteDoc.notes || "");
                              } else {
                                setEditingNoteDoc(null);
                                setNoteUploadContext({ key: catNoteKey, type: "" });
                                setNoteText("");
                              }
                              setNoteModalOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {hasNote ? "Lihat Catatan Kategori" : "Catatan Kategori"}
                          </Button>
                        );
                      })()}
                      {utama.title === "DATA PENTING LAINNYA" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={(event) => { event.stopPropagation(); openCreateCustomItemModal(); }}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Item
                        </Button>
                      )}
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
                            <div key={jenis.key} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-white">
                              <div className="flex items-start gap-3 mt-1.5">
                                <span className="text-sm font-bold text-slate-400 w-6 shrink-0">{jIdx + 1}.</span>
                                <p className="font-semibold text-slate-700 leading-tight">{jenis.title}</p>
                              </div>

                              <div className="flex flex-col items-end gap-2 w-full sm:w-auto ml-9 sm:ml-0">
                                {jenis.slots.map(slot => renderDocumentSlot(jenis.key, slot.type))}
                              </div>
                            </div>
                          ))}
                          {utama.title === "DATA PENTING LAINNYA" && customDocumentItemsForStage.map((customItem, customIdx) => (
                            <div key={customItem.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border border-red-100 bg-red-50/40 p-4 transition-colors hover:border-red-200 hover:bg-white">
                              <div className="flex items-start gap-3 mt-1.5">
                                <span className="mt-0.5 text-sm font-bold text-red-300 w-6 shrink-0">{detail.jenis.length + customIdx + 1}.</span>
                                <div>
                                  <p className="font-semibold text-slate-800 leading-tight">{customItem.title}</p>
                                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-red-500">Item tambahan</p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 w-full sm:w-auto ml-9 sm:ml-0">
                                {customItem.slots.map(slotType => renderDocumentSlot(getCustomItemKey(customItem), slotType))}
                                <button onClick={() => handleDeleteCustomItem(customItem)} className="flex items-center justify-center p-2 rounded-lg border border-red-200 bg-white text-red-500 transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-300" title="Hapus Item Tambahan">
                                  <Trash2 className="h-4 w-4" />
                                </button>
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

      {/* DIALOG TAMBAH ITEM */}
      <Dialog open={customItemModalOpen} onOpenChange={(open) => { setCustomItemModalOpen(open); if (!open) resetCustomItemForm(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Tambah Item Data Penting Lainnya</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="custom-item-title">Nama Item</label>
              <Input
                id="custom-item-title"
                placeholder="Contoh: Berita Acara Pemeriksaan Lapangan"
                value={customItemTitle}
                onChange={(event) => setCustomItemTitle(event.target.value)}
              />
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">Jenis File Upload</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CUSTOM_SLOT_OPTIONS.map(slot => {
                  const selected = customItemSlots.includes(slot);
                  return (
                    <label key={slot} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selected ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-red-600"
                        checked={selected}
                        onChange={() => toggleCustomItemSlot(slot)}
                      />
                      {slot}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomItemModalOpen(false)}>Batal</Button>
            <Button onClick={handleCreateCustomItem} disabled={savingCustomItem || !customItemTitle.trim() || customItemSlots.length === 0} className="bg-red-600 hover:bg-red-700 text-white">
              {savingCustomItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Tambah Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
