"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSession } from "@/context/SessionContext";
import {
    ROLE_CONFIG,
    canViewAllBranches,
    getAccessibleBranchesForUser,
    getSessionBranchCoverage,
    normalizeBranchValue,
} from "@/lib/constants";
import { downloadDashboardExport, fetchDashboardAll, type DashboardExportFormat } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import {
    AlertCircle,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Search,
    ShieldAlert,
    Store,
    X,
} from "lucide-react";

type PeriodMode = "months" | "ytd" | "all";
type SpkStatus = "all" | "with_spk" | "without_spk";

type DataTypeOption = {
    id: string;
    label: string;
    desc: string;
};

const monthOptions = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
].map((label, index) => ({ label, value: index + 1 }));

const dataTypeOptions: DataTypeOption[] = [
    { id: "identitas", label: "Identitas Toko", desc: "Cabang, ULOK, toko, lingkup, kontraktor, status." },
    { id: "rab", label: "RAB & Luasan", desc: "Status RAB, total penawaran, area, GO, dan approval." },
    { id: "spk", label: "SPK", desc: "Tanggal, durasi, nominal, pertambahan, dan real SPK." },
    { id: "opname", label: "Opname & Denda", desc: "Serah terima, keterlambatan, denda, tambah kurang." },
];

const formatOptions: Array<{ id: DashboardExportFormat; label: string; helper: string }> = [
    { id: "xlsx", label: "Excel", helper: ".xlsx" },
    { id: "csv", label: "CSV", helper: ".zip" },
    { id: "pdf", label: "PDF", helper: "dokumen" },
];

const normalizeText = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
const projectId = (project: any) => Number(project?.toko?.id || 0);
const projectBranch = (project: any) => normalizeBranchValue(project?.toko?.cabang);
const hasSpk = (project: any) => Array.isArray(project?.spk) && project.spk.length > 0;

const collectProjectWorkItems = (project: any): string[] => {
    const values: string[] = [];
    const push = (value: unknown) => {
        const normalized = normalizeText(value);
        if (normalized) values.push(normalized);
    };

    // Sumber utama: RAB
    (project?.rab || []).forEach((rab: any) => {
        (rab?.items || []).forEach((item: any) => push(item?.kategori_pekerjaan || item?.jenis_pekerjaan));
    });

    // Sumber tambahan: Instruksi Lapangan (jika ada)
    (project?.instruksi_lapangan || []).forEach((instruksi: any) => {
        (instruksi?.items || []).forEach((item: any) => push(item?.kategori_pekerjaan || item?.jenis_pekerjaan));
    });

    return Array.from(new Set(values));
};

const collectProjectDates = (project: any): Date[] => {
    const values = [
        ...(project?.rab || []).map((item: any) => item?.created_at),
        ...(project?.spk || []).map((item: any) => item?.created_at),
        ...(project?.opname_final || []).map((item: any) => item?.created_at),
        ...(project?.berkas_serah_terima || []).map((item: any) => item?.created_at),
    ];
    return values
        .map((value) => value ? new Date(value) : null)
        .filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime())));
};

const sumSpk = (projects: any[]) => projects.reduce((total, project) => {
    const latest = [...(project?.spk || [])].sort((a: any, b: any) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())[0];
    return total + Number(latest?.grand_total || 0);
}, 0);

export default function TarikanDataPage() {
    const router = useRouter();
    const { user } = useSession();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([new Date().getMonth() + 1]));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [periodMode, setPeriodMode] = useState<PeriodMode>("ytd");
    const [selectedDataTypes, setSelectedDataTypes] = useState<Set<string>>(new Set(dataTypeOptions.map((item) => item.id)));
    const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
    const [selectedJobTypes, setSelectedJobTypes] = useState<Set<string>>(new Set());
    const [spkStatus, setSpkStatus] = useState<SpkStatus>("all");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [exporting, setExporting] = useState<DashboardExportFormat | null>(null);
    const [notice, setNotice] = useState("");

    const roles = useMemo(() => (user?.roles || []).map((role: string) => normalizeText(role)), [user?.roles]);
    const isBlocked = roles.some((role) => role === "KONTRAKTOR" || role === "DIREKTUR KONTRAKTOR" || role === "KONTRAKTOR DC");
    const canAccess = Boolean(user?.isSuperHuman) || roles.some((role) => ROLE_CONFIG[role]?.includes("menu-tarikan-data"));

    const allowedBranches = useMemo(() => {
        if (!user) return [];
        const userCabang = normalizeBranchValue(user.cabang);
        const allBranches = Array.from(new Set(projects.map(projectBranch).filter(Boolean))).sort();
        if (canViewAllBranches(roles, Boolean(user.isSuperHuman)) || userCabang === "HEAD OFFICE") return allBranches;
        const coverage = getSessionBranchCoverage();
        const accessible = getAccessibleBranchesForUser(roles, userCabang, coverage);
        return allBranches.filter((branch) => accessible.includes(branch));
    }, [projects, roles, user]);

    useEffect(() => {
        // removed auto-select branches effect to start empty
    }, [allowedBranches, selectedBranches.size]);

    const availableJobTypes = useMemo(() => {
        return Array.from(new Set(
            projects
                .filter((project) => {
                    const branch = projectBranch(project);
                    return selectedBranches.size === 0 || selectedBranches.has(branch);
                })
                .flatMap(collectProjectWorkItems)
                .filter(Boolean)
        )).sort();
    }, [projects, selectedBranches]);

    useEffect(() => {
        if (!user) return;
        if (isBlocked || !canAccess) {
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchDashboardAll()
            .then((result) => {
                const rows = Array.isArray(result?.data) ? result.data : [];
                setProjects(rows.filter((project: any) => normalizeBranchValue(project?.toko?.cabang) !== "HEAD OFFICE"));
                setError("");
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Gagal mengambil data dashboard."))
            .finally(() => setLoading(false));
    }, [canAccess, isBlocked, user]);

    const availableYears = useMemo(() => {
        const years = new Set<number>([new Date().getFullYear()]);
        projects.forEach((project) => collectProjectDates(project).forEach((date) => years.add(date.getFullYear())));
        return Array.from(years).sort((a, b) => b - a);
    }, [projects]);

    const filteredProjects = useMemo(() => {
        const query = normalizeText(search);
        return projects.filter((project) => {
            const branch = projectBranch(project);
            const workItems = collectProjectWorkItems(project);
            if (selectedBranches.size > 0 && !selectedBranches.has(branch)) return false;
            if (selectedJobTypes.size > 0 && !workItems.some((item) => selectedJobTypes.has(item))) return false;
            if (spkStatus === "with_spk" && !hasSpk(project)) return false;
            if (spkStatus === "without_spk" && hasSpk(project)) return false;

            if (periodMode !== "all") {
                const dates = collectProjectDates(project);
                if (dates.length === 0) return false;
                if (periodMode === "ytd" && !dates.some((date) => date.getFullYear() === selectedYear && date <= new Date())) return false;
                if (periodMode === "months" && selectedMonths.size > 0 && !dates.some((date) => date.getFullYear() === selectedYear && selectedMonths.has(date.getMonth() + 1))) return false;
            }

            if (!query) return true;
            return [project?.toko?.nama_toko, project?.toko?.nomor_ulok, project?.toko?.kode_toko, project?.toko?.cabang, project?.toko?.lingkup_pekerjaan]
                .map(normalizeText)
                .some((value) => value.includes(query));
        }).sort((a, b) => String(a?.toko?.nama_toko || "").localeCompare(String(b?.toko?.nama_toko || ""), "id"));
    }, [periodMode, projects, search, selectedBranches, selectedJobTypes, selectedMonths, selectedYear, spkStatus]);

    const visibleIds = useMemo(() => filteredProjects.map(projectId).filter(Boolean), [filteredProjects]);
    const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
    const selectedProjects = useMemo(() => projects.filter((project) => selectedIds.has(projectId(project))), [projects, selectedIds]);

    const toggleSetValue = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
        setter((current) => {
            const next = new Set(current);
            next.has(value) ? next.delete(value) : next.add(value);
            return next;
        });
    };

    const selectVisible = () => setSelectedIds(new Set(visibleIds));
    const clearSelection = () => setSelectedIds(new Set());

    const handleExport = useCallback(async (format: DashboardExportFormat) => {
        if (!user || selectedIds.size === 0 || (selectedDataTypes.size === 0 && selectedJobTypes.size === 0) || exporting) return;
        setExporting(format);
        setNotice("");
        try {
            await downloadDashboardExport({
                format,
                actorRole: roles.join(", ") || "UNKNOWN",
                actorCabang: normalizeBranchValue(user.cabang),
                tokoIds: Array.from(selectedIds),
                months: Array.from(selectedMonths),
                year: selectedYear,
                periodMode,
                dataTypes: Array.from(selectedDataTypes),
                jobTypes: Array.from(selectedJobTypes),
                cabangs: Array.from(selectedBranches),
                spkStatus,
            });
            setNotice("Export berhasil dibuat sesuai pilihan data.");
        } catch (err) {
            setNotice(err instanceof Error ? err.message : "Export gagal dibuat.");
        } finally {
            setExporting(null);
        }
    }, [exporting, periodMode, roles, selectedBranches, selectedDataTypes, selectedIds, selectedJobTypes, selectedMonths, selectedYear, spkStatus, user]);

    const monthLabel = periodMode === "ytd"
        ? `YTD ${selectedYear}`
        : periodMode === "all"
            ? "Semua periode"
            : `${selectedMonths.size || 0} bulan dipilih`;

    if (!user) return null;

    if (isBlocked || !canAccess) {
        return (
            <div className="min-h-screen bg-slate-50">
                <AppNavbar title="Tarikan Data" showBackButton backHref="/dashboard" variant="brand" />
                <main className="mx-auto max-w-3xl px-4 py-10">
                    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
                        <ShieldAlert className="mb-3 h-8 w-8 text-red-600" />
                        <h1 className="text-xl font-black text-slate-950">Akses tidak tersedia</h1>
                        <p className="mt-2 text-sm font-medium text-slate-600">Menu Tarikan Data tidak dibuka untuk role kontraktor dan direktur kontraktor.</p>
                        <Button className="mt-5 bg-red-700 hover:bg-red-800" onClick={() => router.push("/dashboard")}>Kembali ke Dashboard</Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <AppNavbar title="Tarikan Data" showBackButton backHref="/dashboard" variant="brand" />
            <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <Badge className="border-red-100 bg-red-50 text-red-700">Export terarah</Badge>
                                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Pilih data sebelum ditarik</h1>
                                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">Atur periode, cabang, item pekerjaan, status SPK, dan kelompok kolom. File hanya berisi data yang dicentang.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase text-slate-500">Hasil filter</p>
                                    <p className="text-xl font-black">{filteredProjects.length}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase text-slate-500">Dipilih</p>
                                    <p className="text-xl font-black text-red-700">{selectedIds.size}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase text-slate-500">Nilai SPK</p>
                                    <p className="text-sm font-black">{formatRupiah(sumSpk(selectedProjects))}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 border-b border-slate-100 p-5 lg:grid-cols-[1.1fr_1fr]">
                        <div className="grid gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-5 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500">Tahun</label>
                                <select disabled={periodMode === "all"} value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-red-300 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                                    {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500">Periode</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="mt-2 h-10 w-full justify-between rounded-lg bg-white font-bold">
                                            {periodMode === "ytd" ? "YTD" : periodMode === "months" ? "Bulan" : "Semua"}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-full min-w-[200px]">
                                        <DropdownMenuLabel>Pilih mode periode</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {(["ytd", "months", "all"] as PeriodMode[]).map((mode) => (
                                            <DropdownMenuCheckboxItem key={mode} checked={periodMode === mode} onCheckedChange={() => setPeriodMode(mode)}>
                                                {mode === "ytd" ? "Year-to-Date (YTD)" : mode === "months" ? "Pilih Bulan" : "Semua Periode"}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500">Bulan</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button disabled={periodMode !== "months"} variant="outline" className="mt-2 h-10 w-full justify-between rounded-lg bg-white font-bold disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed">
                                            {periodMode === "ytd" ? "Otomatis (YTD)" : periodMode === "all" ? "Otomatis (Semua)" : monthLabel}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                                        <DropdownMenuLabel className="flex items-center justify-between">
                                            <span>Pilih bulan</span>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-bold text-slate-500" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>Selesai</Button>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {monthOptions.map((month) => (
                                            <DropdownMenuCheckboxItem key={month.value} checked={selectedMonths.has(month.value)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleSetValue(setSelectedMonths, month.value)}>
                                                {month.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-5 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500">Cabang</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="mt-2 h-10 w-full justify-between rounded-lg bg-white font-bold">
                                            {selectedBranches.size === 0 ? "Semua cabang akses" : selectedBranches.size === allowedBranches.length ? "Semua cabang akses" : `${selectedBranches.size} cabang`}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
                                        <DropdownMenuLabel className="sticky top-0 z-10 flex items-center justify-between bg-white py-2">
                                            <span>Cabang tersedia</span>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-bold text-slate-500" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>Selesai</Button>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="sticky top-8 z-10 bg-slate-100" />
                                        <div className="p-1">
                                            <DropdownMenuCheckboxItem
                                                checked={selectedBranches.size === allowedBranches.length && allowedBranches.length > 0}
                                                onSelect={(e) => e.preventDefault()}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedBranches(new Set(allowedBranches));
                                                    else setSelectedBranches(new Set());
                                                }}
                                                className="font-black text-slate-900"
                                            >
                                                Pilih Semua Cabang
                                            </DropdownMenuCheckboxItem>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {allowedBranches.map((branch) => (
                                            <DropdownMenuCheckboxItem key={branch} checked={selectedBranches.has(branch)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleSetValue(setSelectedBranches, branch)}>
                                                {branch}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-slate-500">Status SPK</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="mt-2 h-10 w-full justify-between rounded-lg bg-white font-bold">
                                            {spkStatus === "all" ? "Kedua Status" : spkStatus === "with_spk" ? "Sudah SPK" : "Belum SPK"}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-full min-w-[200px]">
                                        <DropdownMenuLabel>Status SPK</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {([
                                            ["all", "Kedua Status"],
                                            ["with_spk", "Sudah SPK"],
                                            ["without_spk", "Belum SPK"],
                                        ] as Array<[SpkStatus, string]>).map(([value, label]) => (
                                            <DropdownMenuCheckboxItem key={value} checked={spkStatus === value} onCheckedChange={() => setSpkStatus(value)}>
                                                {label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 lg:grid-cols-[360px_1fr]">
                        <aside className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900"><FileText className="h-4 w-4 text-red-600" />Jenis data</div>
                            <div className="mt-3 space-y-2">
                                {dataTypeOptions.map((item) => (
                                    <label key={item.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 hover:border-red-200 hover:bg-red-50/40">
                                        <Checkbox checked={selectedDataTypes.has(item.id)} onCheckedChange={() => toggleSetValue(setSelectedDataTypes, item.id)} />
                                        <span>
                                            <span className="block text-sm font-black text-slate-900">{item.label}</span>
                                            <span className="block text-xs font-medium text-slate-500">{item.desc}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-5 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><FileText className="h-4 w-4 text-red-600" />Item pekerjaan</div>
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <label className="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 hover:bg-red-50/40">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <Checkbox
                                                checked={selectedJobTypes.size === availableJobTypes.length && availableJobTypes.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedJobTypes(new Set(availableJobTypes));
                                                    else setSelectedJobTypes(new Set());
                                                }}
                                            />
                                            <span className="text-xs font-black uppercase text-slate-700">Pilih semua item</span>
                                        </span>
                                        <span className="shrink-0 text-[11px] font-bold text-slate-500">{selectedJobTypes.size}/{availableJobTypes.length}</span>
                                    </label>
                                    <div className="max-h-56 overflow-y-auto p-1.5">
                                        {availableJobTypes.length === 0 ? (
                                            <div className="px-2 py-4 text-center text-xs font-bold text-slate-400">Item pekerjaan belum tersedia.</div>
                                        ) : availableJobTypes.map((jobType) => (
                                            <label key={jobType} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-red-50/50">
                                                <Checkbox checked={selectedJobTypes.has(jobType)} onCheckedChange={() => toggleSetValue(setSelectedJobTypes, jobType)} className="mt-0.5" />
                                                <span className="min-w-0 text-xs font-bold leading-5 text-slate-700">{jobType}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-2 text-xs font-medium text-slate-500">Pilih item pekerjaan yang ingin ikut masuk ke file export.</p>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {formatOptions.map((format) => (
                                    <Button key={format.id} variant="outline" className="h-16 flex-col gap-1 rounded-lg" disabled={selectedIds.size === 0 || (selectedDataTypes.size === 0 && selectedJobTypes.size === 0) || Boolean(exporting)} onClick={() => handleExport(format.id)}>
                                        {exporting === format.id ? <Loader2 className="h-4 w-4 animate-spin" /> : format.id === "pdf" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                                        <span className="text-xs font-black">{format.label}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{format.helper}</span>
                                    </Button>
                                ))}
                            </div>
                            {notice && <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">{notice}</p>}
                        </aside>

                        <section className="rounded-lg border border-slate-200 bg-white">
                            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari toko, ULOK, kode toko, cabang..." className="h-10 rounded-lg border-slate-200 pl-9 font-semibold transition-all focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex min-h-80 items-center justify-center text-sm font-bold text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Mengambil data...</div>
                            ) : error ? (
                                <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle className="mr-2 inline h-4 w-4" />{error}</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                                        <label className="flex cursor-pointer items-center gap-2 text-xs font-black uppercase text-slate-600 hover:text-slate-900">
                                            <Checkbox 
                                                checked={selectedVisibleCount === filteredProjects.length && filteredProjects.length > 0} 
                                                onCheckedChange={(checked) => {
                                                    if (checked) selectVisible();
                                                    else clearSelection();
                                                }}
                                            />
                                            <span>Pilih Semua ({selectedVisibleCount}/{filteredProjects.length})</span>
                                        </label>
                                        <span className="text-xs font-bold text-slate-500">{periodMode === "ytd" ? "YTD" : periodMode === "all" ? "Semua Periode" : monthLabel}</span>
                                    </div>
                                    <div className="max-h-[560px] overflow-y-auto">
                                        {filteredProjects.length === 0 ? (
                                            <div className="p-8 text-center text-sm font-bold text-slate-500">Tidak ada data pada filter ini.</div>
                                        ) : filteredProjects.map((project) => {
                                            const id = projectId(project);
                                            const checked = selectedIds.has(id);
                                            return (
                                                <label key={id || `${project?.toko?.nomor_ulok}-${project?.toko?.lingkup_pekerjaan}`} className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-red-50/40 ${checked ? "bg-red-50/60" : "bg-white"}`}>
                                                    <Checkbox checked={checked} onCheckedChange={() => toggleSetValue(setSelectedIds, id)} className="mt-1" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate text-sm font-black text-slate-950">{project?.toko?.nama_toko || "-"}</p>
                                                            <Badge className="border-slate-200 bg-white font-bold text-slate-600">{project?.toko?.nomor_ulok || "-"}</Badge>
                                                            {hasSpk(project) ? <Badge className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />Sudah SPK</Badge> : <Badge className="bg-amber-50 text-amber-700">Belum SPK</Badge>}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                                                            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{project?.toko?.cabang || "-"}</span>
                                                            <span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" />{project?.toko?.kode_toko || "-"}</span>
                                                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{collectProjectDates(project)[0]?.toLocaleDateString("id-ID") || "Tanggal belum ada"}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
}
