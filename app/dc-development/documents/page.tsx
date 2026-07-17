"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileDown,
  FileSpreadsheet,
  FolderArchive,
  Loader2,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import {
  buildDcDocumentViewUrl,
  createDcArchiveProject,
  deleteDcDocument,
  fetchDcArchiveProjects,
  fetchDcDocuments,
  type DcArchiveProject,
  type DcDocument,
  uploadDcDocuments,
} from "@/lib/api";
import {
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_DOCUMENT_ADMIN_ROLE,
  BRANCH_TO_ULOK,
  SUPER_HUMAN_ROLE,
  normalizeRoles,
  canViewAllBranches,
  getParentBranch,
  getSubBranchesForParent,
} from "@/lib/constants";

const DOCUMENT_CATEGORIES = [
  { key: "fotoExisting", label: "Foto Toko Existing", group: "Foto" },
  { key: "fotoRenovasi", label: "Foto Proses Renovasi", group: "Foto" },
  { key: "me", label: "Gambar ME", group: "Gambar" },
  { key: "sipil", label: "Gambar Sipil", group: "Gambar" },
  { key: "sketsaAwal", label: "Sketsa Awal (Layout)", group: "Gambar" },
  { key: "spk", label: "Dokumen SPK" , group: "Dokumen" },
  { key: "rab", label: "Dokumen RAB & Penawaran", group: "Dokumen" },
  { key: "pendukung", label: "Dokumen Pendukung", group: "Dokumen" },
  { key: "instruksiLapangan", label: "Instruksi Lapangan", group: "Dokumen" },
  { key: "pengawasan", label: "Berkas Pengawasan", group: "Dokumen" },
  { key: "aanwijzing", label: "Aanwijzing", group: "Dokumen" },
  { key: "kerjaTambahKurang", label: "Kerja Tambah Kurang", group: "Dokumen" },
] as const;

const REQUIRED_CATEGORY_KEYS = DOCUMENT_CATEGORIES
  .map((category) => category.key)
  .filter((key) => key !== "pendukung");

const CAN_CREATE_ARCHIVE_ROLES = [
  SUPER_HUMAN_ROLE,
  DC_BUILDING_DEVELOPMENT_MANAGER_ROLE,
  DC_BUILDING_DEVELOPMENT_SPECIALIST_ROLE,
  DC_DOCUMENT_ADMIN_ROLE,
];

const emptyArchiveForm = {
  archive_code: "",
  archive_name: "",
  branch_name: "",
  location_name: "",
  project_type: "",
  address: "",
  notes: "",
};

const ARCHIVE_BRANCH_OPTIONS = Object.keys(BRANCH_TO_ULOK)
  .filter((branch) => branch !== "HEAD OFFICE")
  .sort((a, b) => a.localeCompare(b));

const PROJECT_TYPE_OPTIONS = ["New", "Renovasi"] as const;

type ExportRow = Record<string, string | number>;

function actorFromUser(user: ReturnType<typeof useSession>["user"]) {
  return {
    actor_email: user?.email || "",
    actor_role: user?.role || "",
  };
}

function canCreateArchive(role: string | string[] | undefined | null) {
  const roles = normalizeRoles(role);
  return roles.some((userRole) => CAN_CREATE_ARCHIVE_ROLES.includes(userRole));
}

function isArchiveComplete(item: DcArchiveProject) {
  const counts = item.kategori_counts ?? {};
  return REQUIRED_CATEGORY_KEYS.every((key) => Number(counts[key] ?? 0) > 0);
}

function countArchiveDocs(item: DcArchiveProject) {
  return Object.values(item.kategori_counts ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0);
}

function statusMeta(item: DcArchiveProject) {
  const complete = isArchiveComplete(item);
  return {
    label: complete ? "Sudah Lengkap" : "Belum Lengkap",
    className: complete
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
}

function exportRowsToCsv(filename: string, rows: ExportRow[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n");
  downloadTextFile(filename, csv, "text/csv;charset=utf-8");
}

function exportRowsToExcel(filename: string, rows: ExportRow[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const cells = rows.map((row) =>
    `<tr>${headers.map((header) => `<td>${String(row[header] ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</td>`).join("")}</tr>`
  ).join("");
  const html = `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${cells}</tbody></table>`;
  downloadTextFile(filename, html, "application/vnd.ms-excel;charset=utf-8");
}

function printRowsAsPdf(title: string, rows: ExportRow[]) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const printable = window.open("", "_blank", "width=1100,height=800");
  if (!printable) return;
  printable.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 20px; margin: 0 0 16px; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th { background: #dc000c; color: #fff; text-align: left; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; }
          tr:nth-child(even) { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${String(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </body>
    </html>
  `);
  printable.document.close();
  printable.focus();
  printable.print();
}

export default function DcDocumentsPage() {
  const { user, isLoading } = useSession();
  const [archives, setArchives] = useState<DcArchiveProject[]>([]);
  const [documents, setDocuments] = useState<DcDocument[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<DcArchiveProject | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "lengkap" | "belum">("all");
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [archiveForm, setArchiveForm] = useState(emptyArchiveForm);

  const actor = useMemo(() => actorFromUser(user), [user]);
  const roleSource = user?.roles?.length ? user.roles : user?.role;
  const canAddData = useMemo(() => canCreateArchive(roleSource), [roleSource]);

  const isHOUser = useMemo(() => (
    canViewAllBranches(user?.roles, user?.isSuperHuman ?? false) || user?.cabang?.toUpperCase() === "HEAD OFFICE"
  ), [user]);

  const loadArchives = useCallback(async () => {
    if (!actor.actor_email || !actor.actor_role) return;
    setLoadingArchives(true);
    setMessage("");
    try {
      const subBranches = isHOUser && branchFilter !== "all"
        ? getSubBranchesForParent(branchFilter)
        : null;
      let data: DcArchiveProject[];

      if (subBranches && subBranches.length > 1) {
        const results = await Promise.all(
          subBranches.map((sub) =>
            fetchDcArchiveProjects({
              actor_email: actor.actor_email,
              actor_role: actor.actor_role,
              search: query.trim() || undefined,
              branch_name: sub,
              status: statusFilter,
            }, { suppressGlobalError: true }).then((res) => res.data ?? [])
          )
        );
        data = results.flat();
      } else {
        const res = await fetchDcArchiveProjects({
          actor_email: actor.actor_email,
          actor_role: actor.actor_role,
          search: query.trim() || undefined,
          branch_name: branchFilter === "all" ? undefined : branchFilter,
          status: statusFilter,
        }, { suppressGlobalError: true });
        data = res.data ?? [];
      }

      setArchives(data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal memuat arsip dokumen DC"));
    } finally {
      setLoadingArchives(false);
    }
  }, [actor.actor_email, actor.actor_role, branchFilter, query, statusFilter, isHOUser]);

  const loadDocuments = useCallback(async (archive: DcArchiveProject) => {
    if (!actor.actor_email || !actor.actor_role) return;
    setLoadingDocs(true);
    setMessage("");
    try {
      const res = await fetchDcDocuments({
        project_id: archive.project_id,
        entity_type: "DC_ARCHIVE_PROJECT",
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, { suppressGlobalError: true });
      setDocuments(res.data ?? []);
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal memuat dokumen DC"));
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [actor.actor_email, actor.actor_role]);

  useEffect(() => {
    if (!isLoading && user && !selectedArchive) loadArchives();
  }, [isLoading, loadArchives, selectedArchive, user]);

  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    archives.forEach((archive) => {
      if (archive.branch_name) branches.add(isHOUser ? getParentBranch(archive.branch_name) : archive.branch_name);
    });
    if (branchFilter !== "all") branches.add(isHOUser ? getParentBranch(branchFilter) : branchFilter);
    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [archives, branchFilter, isHOUser]);

  const docsByType = useMemo(() => (
    documents.reduce<Record<string, DcDocument[]>>((acc, doc) => {
      acc[doc.document_type] = acc[doc.document_type] || [];
      acc[doc.document_type].push(doc);
      return acc;
    }, {})
  ), [documents]);

  const totals = useMemo(() => {
    const complete = archives.filter(isArchiveComplete).length;
    const totalDocs = archives.reduce((sum, item) => sum + countArchiveDocs(item), 0);
    const branches = new Set(archives.map((item) => item.branch_name).filter(Boolean));
    return {
      total: archives.length,
      complete,
      incomplete: archives.length - complete,
      totalDocs,
      branches: branches.size,
      progress: archives.length > 0 ? Math.round((complete / archives.length) * 100) : 0,
    };
  }, [archives]);

  const detailTotals = useMemo(() => {
    const countByGroup = (group: string) => {
      const keys = DOCUMENT_CATEGORIES.filter((category) => category.group === group).map((category) => category.key);
      return documents.filter((doc) => keys.includes(doc.document_type as typeof DOCUMENT_CATEGORIES[number]["key"])).length;
    };
    return {
      total: documents.length,
      foto: countByGroup("Foto"),
      gambar: countByGroup("Gambar"),
      dokumen: countByGroup("Dokumen"),
    };
  }, [documents]);

  const exportRows = useMemo<ExportRow[]>(() => archives.map((archive, index) => ({
    No: index + 1,
    Kode: archive.archive_code,
    "Nama DC": archive.archive_name,
    Cabang: archive.branch_name,
    Lokasi: archive.location_name || "-",
    "Tipe Project": archive.project_type,
    Status: statusMeta(archive).label,
    "Total Dokumen": countArchiveDocs(archive),
    "Kategori Terisi": Object.keys(archive.kategori_counts ?? {}).length,
  })), [archives]);

  const openArchive = (archive: DcArchiveProject) => {
    setSelectedArchive(archive);
    loadDocuments(archive);
  };

  const handleCreateArchive = async () => {
    if (!canAddData) {
      setMessage("Anda tidak memiliki akses untuk menambah data arsip DC.");
      return;
    }

    const payload = {
      archive_code: archiveForm.archive_code.trim(),
      archive_name: archiveForm.archive_name.trim(),
      branch_name: archiveForm.branch_name.trim().toUpperCase(),
      location_name: archiveForm.location_name.trim() || undefined,
      project_type: archiveForm.project_type.trim(),
      address: archiveForm.address.trim() || undefined,
      notes: archiveForm.notes.trim() || undefined,
      actor_email: actor.actor_email,
      actor_role: actor.actor_role,
    };

    if (!payload.archive_code || !payload.archive_name || !payload.branch_name || !payload.project_type) {
      setMessage("Kode, nama DC, cabang/lokasi, dan tipe project wajib diisi.");
      return;
    }

    setIsCreating(true);
    setMessage("");
    try {
      await createDcArchiveProject(payload);
      setArchiveForm(emptyArchiveForm);
      setIsCreateOpen(false);
      setMessage("Data arsip DC berhasil dibuat.");
      await loadArchives();
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal membuat data arsip DC"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpload = async (documentType: string, fileList: FileList | null) => {
    if (!selectedArchive || !fileList?.length) return;
    setUploadingKey(documentType);
    setMessage("");
    try {
      await uploadDcDocuments({
        project_id: selectedArchive.project_id,
        entity_type: "DC_ARCHIVE_PROJECT",
        entity_id: selectedArchive.id,
        document_type: documentType,
        stage: "LEGACY_ARCHIVE",
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, Array.from(fileList));
      await loadDocuments(selectedArchive);
      setMessage(`${fileList.length} file berhasil diupload.`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal upload dokumen DC"));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (doc: DcDocument) => {
    if (!selectedArchive) return;
    const ok = window.confirm(`Hapus dokumen "${doc.file_name || doc.document_type}"?`);
    if (!ok) return;

    setDeletingId(doc.id);
    setMessage("");
    try {
      await deleteDcDocument(doc.id, actor);
      await loadDocuments(selectedArchive);
      setMessage("Dokumen DC berhasil dihapus.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Gagal menghapus dokumen DC"));
    } finally {
      setDeletingId(null);
    }
  };

  const downloadAllVisibleDocs = () => {
    documents.forEach((doc, index) => {
      window.setTimeout(() => {
        window.open(buildDcDocumentViewUrl(doc.id, actor, "download"), "_blank", "noopener,noreferrer");
      }, index * 200);
    });
  };

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f7] text-slate-900 [font-family:var(--font-sans)]">
      <header className="sticky top-0 z-30 bg-[#d60010] shadow-md">
        <div className="mx-auto flex h-[86px] max-w-[1380px] items-center gap-5 px-5 md:px-8">
          <Link href="/dc-development" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15" title="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Image src="/assets/Alfamart-Emblem.png" alt="Alfamart" width={94} height={42} className="h-[42px] w-auto drop-shadow-md" priority />
          <div className="h-9 w-px bg-white/30" />
          <h1 className="text-xl font-semibold tracking-wide text-white md:text-[24px]">Penyimpanan Dokumen DC</h1>
          <Button
            variant="outline"
            className="ml-auto hidden rounded-xl border-white/25 bg-white/10 font-medium text-white hover:bg-white hover:text-red-700 md:inline-flex"
            onClick={() => selectedArchive ? loadDocuments(selectedArchive) : loadArchives()}
            disabled={loadingArchives || loadingDocs}
          >
            <RefreshCw className={(loadingArchives || loadingDocs) ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-4 py-6 md:px-8">
        {message && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {!selectedArchive ? (
          <div className="space-y-5">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total Data" value={totals.total} />
              <MetricCard title="Sudah Lengkap" value={totals.complete} tone="green" icon={<CheckCircle2 className="h-4 w-4" />} />
              <MetricCard title="Belum Lengkap" value={totals.incomplete} tone="amber" />
              <MetricCard title="Progress Input Data" value={`${totals.progress}%`} subtitle={`${totals.complete} / ${totals.total} data lengkap`} progress={totals.progress} />
              <MetricCard title="Total Dokumen" value={totals.totalDocs} />
              <MetricCard title="Hasil Filter" value={archives.length} />
              <MetricCard title="Cabang" value={totals.branches} tone="red" filled />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-10 rounded-xl bg-slate-50 pl-11"
                    placeholder="Cari kode, nama DC, cabang, atau lokasi..."
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: "all" | "lengkap" | "belum") => setStatusFilter(value)}>
                  <SelectTrigger className="h-10 w-full rounded-xl bg-white xl:w-56">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="lengkap">Sudah Lengkap</SelectItem>
                    <SelectItem value="belum">Belum Lengkap</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-10 w-full rounded-xl bg-white xl:w-56">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10 rounded-xl bg-white" onClick={() => exportRowsToCsv("dokumen-dc.csv", exportRows)} disabled={exportRows.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                  <Button variant="outline" className="h-10 rounded-xl bg-white" onClick={() => exportRowsToExcel("dokumen-dc.xls", exportRows)} disabled={exportRows.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline" className="h-10 rounded-xl bg-white" onClick={() => printRowsAsPdf("Daftar Penyimpanan Dokumen DC", exportRows)} disabled={exportRows.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  {canAddData && (
                    <Button className="h-10 rounded-xl bg-red-600 px-5 font-medium text-white hover:bg-red-700" onClick={() => setIsCreateOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tambah Data
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                <span>Ringkasan filter:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{totals.complete} sudah lengkap</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{totals.incomplete} belum lengkap</span>
              </div>
            </section>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">No</th>
                      <th className="px-6 py-4">Kode</th>
                      <th className="px-6 py-4">Nama DC</th>
                      <th className="px-6 py-4">Cabang/Lokasi</th>
                      <th className="px-6 py-4">Tipe</th>
                      <th className="px-6 py-4">Dokumen</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {archives.map((archive, index) => {
                      const status = statusMeta(archive);
                      return (
                        <tr key={archive.id} className="transition hover:bg-slate-50">
                          <td className="px-6 py-5 text-slate-500">{index + 1}</td>
                          <td className="px-6 py-5 font-medium text-slate-950">{archive.archive_code}</td>
                          <td className="px-6 py-5 font-medium text-slate-800">{archive.archive_name}</td>
                          <td className="px-6 py-5 text-slate-600">
                            <div className="font-medium">{archive.branch_name}</div>
                            <div className="text-xs text-slate-400">{archive.location_name || "-"}</div>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant="secondary" className="rounded-full">{archive.project_type}</Badge>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-medium text-slate-900">{countArchiveDocs(archive)}</span>
                            <span className="ml-1 text-xs text-slate-400">file</span>
                          </td>
                          <td className="px-6 py-5">
                            <Badge className={`${status.className} rounded-full border`}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Button size="sm" variant="outline" className="rounded-xl bg-white font-medium" onClick={() => openArchive(archive)}>
                              <FolderArchive className="mr-2 h-4 w-4" />
                              Kelola Dokumen
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {loadingArchives && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loadingArchives && archives.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Belum ada arsip dokumen DC.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Button variant="ghost" className="mb-3 h-8 px-0 text-slate-500 hover:bg-transparent" onClick={() => { setSelectedArchive(null); setDocuments([]); loadArchives(); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke daftar arsip
                  </Button>
                  <h2 className="text-2xl font-semibold text-slate-950">{selectedArchive.archive_name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full border-red-100 bg-red-50 text-red-700">{selectedArchive.archive_code}</Badge>
                    <Badge variant="secondary" className="rounded-full">{selectedArchive.branch_name}</Badge>
                    <Badge variant="secondary" className="rounded-full">{selectedArchive.location_name || "-"}</Badge>
                    <Badge variant="secondary" className="rounded-full">{selectedArchive.project_type}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <DetailMetric title="Total Dokumen" value={detailTotals.total} />
                  <DetailMetric title="Foto" value={detailTotals.foto} />
                  <DetailMetric title="Gambar" value={detailTotals.gambar} />
                  <DetailMetric title="Dokumen" value={detailTotals.dokumen} />
                  <Button variant="outline" className="h-10 rounded-xl bg-white" onClick={downloadAllVisibleDocs} disabled={documents.length === 0}>
                    <FileArchive className="mr-2 h-4 w-4" />
                    Download Semua
                  </Button>
                </div>
              </div>
            </section>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />
              </div>
            ) : (
              ["Foto", "Gambar", "Dokumen"].map((groupName) => (
                <section key={groupName} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-300" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{groupName}</h3>
                    <div className="h-px flex-1 bg-slate-300" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {DOCUMENT_CATEGORIES.filter((category) => category.group === groupName).map((category) => {
                      const docs = docsByType[category.key] || [];
                      const isUploading = uploadingKey === category.key;
                      return (
                        <Card key={category.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-red-100 hover:shadow-md">
                          <div className="flex h-[58px] items-center justify-between border-b border-slate-100 px-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-sm font-medium text-slate-800">{category.label}</h4>
                                {docs.length > 0 && <Badge className="rounded-full border-red-100 bg-red-50 text-red-600">{docs.length}</Badge>}
                              </div>
                              {isUploading && <p className="mt-1 text-xs text-slate-400">Mengupload file...</p>}
                            </div>
                            <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Upload file">
                              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                disabled={isUploading}
                                onChange={(event) => {
                                  handleUpload(category.key, event.target.files);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                          <CardContent className="min-h-[112px] space-y-2 p-3">
                            {docs.map((doc) => (
                              <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                      <File className="h-4 w-4 shrink-0 text-slate-400" />
                                      <span className="truncate">{doc.file_name || category.label}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      v{doc.version_no || 1} - {doc.uploaded_by_email || doc.created_by_email || "-"}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-blue-600" href={buildDcDocumentViewUrl(doc.id, actor, "view")} target="_blank" rel="noopener noreferrer" title="Lihat dokumen">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-emerald-600" href={buildDcDocumentViewUrl(doc.id, actor, "download")} target="_blank" rel="noopener noreferrer" title="Download dokumen">
                                      <Download className="h-4 w-4" />
                                    </a>
                                    <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-red-600" onClick={() => handleDelete(doc)} disabled={deletingId === doc.id} title="Hapus dokumen">
                                      {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {docs.length === 0 && (
                              <div className="flex h-[70px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-xs font-medium italic text-slate-400">
                                Belum ada file
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Data Arsip DC</DialogTitle>
            <DialogDescription>Data ini akan menjadi workspace penyimpanan dokumen DC.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Kode DC / Project</Label>
              <Input value={archiveForm.archive_code} onChange={(event) => setArchiveForm((prev) => ({ ...prev, archive_code: event.target.value }))} placeholder="Contoh: DC-LPG-2024-001" />
            </div>
            <div className="grid gap-2">
              <Label>Nama DC / Project</Label>
              <Input value={archiveForm.archive_name} onChange={(event) => setArchiveForm((prev) => ({ ...prev, archive_name: event.target.value }))} placeholder="Contoh: DC Lampung Expansion" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cabang / Area</Label>
                <Select value={archiveForm.branch_name} onValueChange={(value) => setArchiveForm((prev) => ({ ...prev, branch_name: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="-- Pilih Cabang --" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHIVE_BRANCH_OPTIONS.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tipe Project</Label>
                <Select value={archiveForm.project_type} onValueChange={(value) => setArchiveForm((prev) => ({ ...prev, project_type: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="-- Pilih Tipe Project --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lokasi</Label>
              <Input value={archiveForm.location_name} onChange={(event) => setArchiveForm((prev) => ({ ...prev, location_name: event.target.value }))} placeholder="Opsional" />
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Input value={archiveForm.address} onChange={(event) => setArchiveForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Opsional" />
            </div>
            <div className="grid gap-2">
              <Label>Catatan</Label>
              <Input value={archiveForm.notes} onChange={(event) => setArchiveForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>Batal</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleCreateArchive} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone = "slate",
  progress,
  icon,
  filled = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: "slate" | "green" | "amber" | "red";
  progress?: number;
  icon?: React.ReactNode;
  filled?: boolean;
}) {
  const toneClass = {
    slate: "text-slate-950",
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
  }[tone];

  if (filled) {
    return (
      <div className="rounded-2xl bg-red-600 px-5 py-4 text-white shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-white/90">{title}</div>
        <div className="mt-1 text-3xl font-semibold">{value}</div>
        {subtitle && <div className="mt-1 text-xs font-semibold text-white/80">{subtitle}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </div>
      <div className={`mt-1 text-3xl font-semibold ${toneClass}`}>{value}</div>
      {subtitle && <div className="mt-1 text-xs font-medium text-slate-500">{subtitle}</div>}
      {typeof progress === "number" && (
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function DetailMetric({ title, value }: { title: string; value: number }) {
  return (
    <div className="min-w-[96px] rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase text-slate-400">{title}</div>
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
