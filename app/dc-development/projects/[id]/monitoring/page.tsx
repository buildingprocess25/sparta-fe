"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Plus, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/context/SessionContext";
import { 
  fetchDcProjectById,
  fetchDcProjectTimelines,
  addDcProjectTimeline,
  updateDcProjectTimeline,
  fetchDcProjectIssues,
  addDcProjectIssue,
  updateDcProjectIssue,
  type DcProject,
  type DcProjectTimeline,
  type DcIssue
} from "@/lib/api";

export default function DcProjectMonitoringPage() {
  const { id } = useParams() as { id: string };
  const { user } = useSession();
  
  const [project, setProject] = useState<DcProject | null>(null);
  const [timelines, setTimelines] = useState<DcProjectTimeline[]>([]);
  const [issues, setIssues] = useState<DcIssue[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Timeline Form
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Issue Form
  const [issueType, setIssueType] = useState("TECHNICAL");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("MEDIUM");
  const [reportingIssue, setReportingIssue] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const projectId = Number(id);
      const [projRes, timeRes, issueRes] = await Promise.all([
        fetchDcProjectById(projectId, { suppressGlobalError: true }),
        fetchDcProjectTimelines(projectId, { suppressGlobalError: true }),
        fetchDcProjectIssues(projectId, { suppressGlobalError: true })
      ]);
      setProject(projRes.data.project);
      setTimelines(timeRes.data);
      setIssues(issueRes.data);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal memuat data monitoring", 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !startDate || !endDate) return showMessage("Lengkapi form task", 'error');
    
    setAddingTask(true);
    try {
      await addDcProjectTimeline(Number(id), {
        task_name: taskName,
        start_date: startDate,
        end_date: endDate,
        actor_email: user?.email,
      });
      showMessage("Task berhasil ditambahkan", 'success');
      setTaskName(""); setStartDate(""); setEndDate("");
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal menambahkan task", 'error');
    } finally {
      setAddingTask(false);
    }
  };

  const handleUpdateProgress = async (taskId: number, newProgress: number) => {
    try {
      const status = newProgress === 100 ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
      await updateDcProjectTimeline(Number(id), taskId, {
        progress_percent: newProgress,
        status,
        actor_email: user?.email,
      });
      showMessage("Progress berhasil diupdate", 'success');
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal mengupdate progress", 'error');
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle || !issueDescription) return showMessage("Judul dan deskripsi wajib diisi", 'error');
    
    setReportingIssue(true);
    try {
      await addDcProjectIssue(Number(id), {
        issue_type: issueType,
        title: issueTitle,
        description: issueDescription,
        severity: issueSeverity,
        actor_email: user?.email,
      });
      showMessage("Issue berhasil dilaporkan", 'success');
      setIssueTitle(""); setIssueDescription("");
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal melaporkan issue", 'error');
    } finally {
      setReportingIssue(false);
    }
  };

  const handleResolveIssue = async (issueId: number) => {
    const notes = prompt("Masukkan catatan penyelesaian:");
    if (notes === null) return;
    
    try {
      await updateDcProjectIssue(Number(id), issueId, {
        status: 'RESOLVED',
        resolution_notes: notes,
        actor_email: user?.email,
      });
      showMessage("Issue berhasil diselesaikan", 'success');
      loadData(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Gagal menyelesaikan issue", 'error');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#edf2f6] px-4 py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#edf2f6] px-4 py-6 flex flex-col items-center justify-center gap-4">
        <div className="text-lg font-medium text-slate-700">Project tidak ditemukan</div>
        <Link href="/dc-development">
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf2f6] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/dc-development/projects/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Detail Project
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">Project Monitoring</h1>
            <p className="text-sm text-slate-500 mt-1">{project.project_name} ({project.project_code})</p>
          </div>
          <Button variant="outline" className="rounded-lg bg-white" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Refresh
          </Button>
        </div>

        {message && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
            {message.text}
          </div>
        )}

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="timeline">Timeline & Kurva S</TabsTrigger>
            <TabsTrigger value="issues">Issue Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-xl border-slate-200 bg-white shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Timeline Pelaksanaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Nama Pekerjaan</th>
                          <th className="px-6 py-4 font-semibold">Periode</th>
                          <th className="px-6 py-4 font-semibold">Progress</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {timelines.map((task) => (
                          <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-800">{task.task_name}</td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-500">Mulai: {new Date(task.start_date).toLocaleDateString('id-ID')}</div>
                              <div className="text-xs text-slate-500">Selesai: {new Date(task.end_date).toLocaleDateString('id-ID')}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-200 rounded-full h-2 min-w-[80px]">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress_percent}%` }}></div>
                                </div>
                                <span className="text-xs font-semibold">{task.progress_percent}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {task.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {task.status !== 'COMPLETED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    const p = prompt("Masukkan progress baru (0-100):", task.progress_percent);
                                    if (p !== null && !isNaN(Number(p))) handleUpdateProgress(task.id, Number(p));
                                  }}
                                >
                                  Update %
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {timelines.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                              Belum ada timeline pekerjaan. Tambahkan task di form samping.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-slate-200 bg-white shadow-sm h-fit">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800">Tambah Task Baru</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Nama Pekerjaan</Label>
                      <Input 
                        placeholder="Contoh: Pondasi & Struktur" 
                        value={taskName} 
                        onChange={e => setTaskName(e.target.value)} 
                        className="bg-slate-50"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Start Date</Label>
                        <Input 
                          type="date"
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)} 
                          className="bg-slate-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">End Date</Label>
                        <Input 
                          type="date"
                          value={endDate} 
                          onChange={e => setEndDate(e.target.value)} 
                          className="bg-slate-50"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={addingTask} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                      {addingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Tambah Pekerjaan
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-xl border-slate-200 bg-white shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Daftar Kendala (Issues)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Kendala</th>
                          <th className="px-6 py-4 font-semibold">Severity & Tipe</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {issues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{issue.title}</div>
                              <div className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-sm">{issue.description}</div>
                              {issue.resolution_notes && (
                                <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100">
                                  <strong>Penyelesaian:</strong> {issue.resolution_notes}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-semibold text-slate-700">{issue.issue_type}</div>
                              <div className={`text-[10px] uppercase font-bold mt-1 ${
                                issue.severity === 'HIGH' || issue.severity === 'CRITICAL' ? 'text-red-600' :
                                issue.severity === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                              }`}>{issue.severity}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                issue.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                                issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {issue.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {issue.status !== 'RESOLVED' && issue.status !== 'CLOSED' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleResolveIssue(issue.id)}
                                >
                                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Resolve
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {issues.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                              Belum ada laporan kendala. Project berjalan lancar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-slate-200 bg-white shadow-sm h-fit">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800">Lapor Kendala</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleReportIssue} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Judul Kendala</Label>
                      <Input 
                        placeholder="Contoh: Akses jalan terhambat" 
                        value={issueTitle} 
                        onChange={e => setIssueTitle(e.target.value)} 
                        className="bg-slate-50"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Kategori</Label>
                        <Select value={issueType} onValueChange={setIssueType}>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNICAL">Teknis</SelectItem>
                            <SelectItem value="MATERIAL">Material</SelectItem>
                            <SelectItem value="WEATHER">Cuaca</SelectItem>
                            <SelectItem value="LEGAL_PERMIT">Perizinan</SelectItem>
                            <SelectItem value="OTHER">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">Severity</Label>
                        <Select value={issueSeverity} onValueChange={setIssueSeverity}>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-600">Deskripsi Detail</Label>
                      <Textarea 
                        placeholder="Jelaskan secara detail kendala yang terjadi" 
                        value={issueDescription} 
                        onChange={e => setIssueDescription(e.target.value)} 
                        className="bg-slate-50 min-h-[100px]"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={reportingIssue} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                      {reportingIssue ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                      Laporkan Issue
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
