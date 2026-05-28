"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  File,
  FolderArchive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import {
  buildDcDocumentViewUrl,
  deleteDcDocument,
  fetchDcDocuments,
  fetchDcProjects,
  type DcDocument,
  type DcProject,
  uploadDcDocuments,
} from "@/lib/api";

const DOCUMENT_GROUPS = [
  {
    title: "Project",
    stage: "PROJECT_CREATED",
    items: [
      { key: "PROJECT_BRIEF", label: "Project Brief" },
      { key: "SITE_DOCUMENT", label: "Dokumen Site" },
      { key: "INTERNAL_NOTE", label: "Catatan Internal" },
    ],
  },
  {
    title: "Tender",
    stage: "TENDER",
    items: [
      { key: "SOIL_TENDER", label: "Tender Soil" },
      { key: "PLANNER_TENDER", label: "Tender Perencana" },
      { key: "MK_TENDER", label: "Tender MK" },
      { key: "CONTRACTOR_TENDER", label: "Tender Kontraktor" },
    ],
  },
  {
    title: "Konstruksi",
    stage: "CONSTRUCTION_MONITORING",
    items: [
      { key: "MONITORING_REPORT", label: "Monitoring" },
      { key: "SAT_SUPERVISION", label: "Pengawasan SAT/DC" },
      { key: "FIELD_ATTACHMENT", label: "Lampiran Lapangan" },
    ],
  },
  {
    title: "Serah Terima",
    stage: "BAST_PREPARATION",
    items: [
      { key: "BAST", label: "BAST" },
      { key: "FINAL_TERM", label: "Termin Final" },
      { key: "COMPLETION_DOCUMENT", label: "Dokumen Penyelesaian" },
    ],
  },
];

const getDocKey = (doc: DcDocument) => doc.document_type;

function actorFromUser(user: ReturnType<typeof useSession>["user"]) {
  return {
    actor_email: user?.email || "",
    actor_role: user?.role || "",
  };
}

export default function DcDocumentsPage() {
  const { user, isLoading } = useSession();
  const [projects, setProjects] = useState<DcProject[]>([]);
  const [documents, setDocuments] = useState<DcDocument[]>([]);
  const [selectedProject, setSelectedProject] = useState<DcProject | null>(null);
  const [query, setQuery] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const actor = useMemo(() => actorFromUser(user), [user]);

  const loadProjects = useCallback(async () => {
    if (!actor.actor_email || !actor.actor_role) return;
    setLoadingProjects(true);
    setMessage("");
    try {
      const res = await fetchDcProjects({
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, { suppressGlobalError: true });
      setProjects(res.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat project DC");
    } finally {
      setLoadingProjects(false);
    }
  }, [actor.actor_email, actor.actor_role]);

  const loadDocuments = useCallback(async (project: DcProject) => {
    if (!actor.actor_email || !actor.actor_role) return;
    setLoadingDocs(true);
    setMessage("");
    try {
      const res = await fetchDcDocuments({
        project_id: project.id,
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, { suppressGlobalError: true });
      setDocuments(res.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat dokumen DC");
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [actor.actor_email, actor.actor_role]);

  useEffect(() => {
    if (!isLoading && user) loadProjects();
  }, [isLoading, loadProjects, user]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      [project.project_code, project.project_name, project.location_name, project.branch_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [projects, query]);

  const docsByType = useMemo(() => {
    return documents.reduce<Record<string, DcDocument[]>>((acc, doc) => {
      const key = getDocKey(doc);
      acc[key] = acc[key] || [];
      acc[key].push(doc);
      return acc;
    }, {});
  }, [documents]);

  const openProject = (project: DcProject) => {
    setSelectedProject(project);
    loadDocuments(project);
  };

  const handleUpload = async (documentType: string, stage: string, fileList: FileList | null) => {
    if (!selectedProject || !fileList?.length) return;
    setUploadingKey(documentType);
    setMessage("");
    try {
      await uploadDcDocuments({
        project_id: selectedProject.id,
        entity_type: "DC_PROJECT",
        entity_id: selectedProject.id,
        document_type: documentType,
        stage,
        actor_email: actor.actor_email,
        actor_role: actor.actor_role,
      }, Array.from(fileList));
      await loadDocuments(selectedProject);
      setMessage("Dokumen DC berhasil diupload.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal upload dokumen DC");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (doc: DcDocument) => {
    if (!selectedProject) return;
    setDeletingId(doc.id);
    setMessage("");
    try {
      await deleteDcDocument(doc.id, actor);
      await loadDocuments(selectedProject);
      setMessage("Dokumen DC berhasil dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus dokumen DC");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dc-development" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              DC Development
            </Link>
            <h1 className="mt-2 text-xl font-bold text-slate-800">Dokumen DC</h1>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={() => selectedProject ? loadDocuments(selectedProject) : loadProjects()} disabled={loadingProjects || loadingDocs}>
            <RefreshCw className={(loadingProjects || loadingDocs) ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{message}</div>}

        {!selectedProject ? (
          <Card className="rounded-lg bg-white">
            <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg font-bold">Pilih Project</CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Cari project DC" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Kode</th>
                      <th className="px-5 py-3">Project</th>
                      <th className="px-5 py-3">Stage</th>
                      <th className="px-5 py-3">Lokasi</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-bold">{project.project_code}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold">{project.project_name}</div>
                          <div className="text-xs text-slate-500">{project.branch_name || "-"}</div>
                        </td>
                        <td className="px-5 py-4 text-blue-700">{project.current_stage}</td>
                        <td className="px-5 py-4 text-slate-500">{project.location_name || "-"}</td>
                        <td className="px-5 py-4 text-right">
                          <Button size="sm" className="rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => openProject(project)}>
                            <FolderArchive className="mr-2 h-4 w-4" />
                            Kelola Dokumen
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {loadingProjects && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loadingProjects && filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">Belum ada project DC yang dapat diakses.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <Button variant="ghost" className="mb-2 h-8 px-0 text-slate-500 hover:bg-transparent" onClick={() => { setSelectedProject(null); setDocuments([]); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke daftar project
                  </Button>
                  <h2 className="text-lg font-bold text-slate-900">{selectedProject.project_name}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-red-50 text-red-700 border-red-100">{selectedProject.project_code}</Badge>
                    <Badge variant="secondary">{selectedProject.current_stage}</Badge>
                    <Badge variant="secondary">{selectedProject.location_name || "-"}</Badge>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="text-xs font-bold uppercase text-slate-400">Total Dokumen</div>
                  <div className="text-2xl font-bold text-slate-900">{documents.length}</div>
                </div>
              </div>
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-red-600" />
              </div>
            ) : (
              DOCUMENT_GROUPS.map((group) => (
                <section key={group.title} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{group.title}</h3>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => {
                      const docs = docsByType[item.key] || [];
                      const isUploading = uploadingKey === item.key;
                      return (
                        <Card key={item.key} className="rounded-lg bg-white shadow-sm">
                          <CardHeader className="border-b border-slate-100 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <CardTitle className="text-sm font-bold text-slate-800">{item.label}</CardTitle>
                              <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-red-600">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(event) => {
                                    handleUpload(item.key, group.stage, event.target.files);
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 p-3">
                            {docs.map((doc) => (
                              <div key={doc.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                      <File className="h-4 w-4 shrink-0 text-slate-400" />
                                      <span className="truncate">{doc.file_name || doc.document_type}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      v{doc.version_no || 1} - {doc.uploaded_by_email || doc.created_by_email || "-"}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <a
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-600"
                                      href={buildDcDocumentViewUrl(doc.id, actor, "view")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Lihat dokumen"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <a
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-600"
                                      href={buildDcDocumentViewUrl(doc.id, actor, "download")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Download dokumen"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                    <button
                                      type="button"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-red-600"
                                      onClick={() => handleDelete(doc)}
                                      disabled={deletingId === doc.id}
                                      title="Hapus dokumen"
                                    >
                                      {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {docs.length === 0 && (
                              <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs font-medium text-slate-400">
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
    </main>
  );
}
