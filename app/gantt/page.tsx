"use client"

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import AppNavbar from '@/components/AppNavbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Lock, Send, Loader2, Info, Plus, Trash2, X, AlertTriangle, AlertCircle, Calendar, CheckCircle, Save, FileText, Search, Download, Clock, MessageSquare, Maximize, Minimize, Database, Building2, ClipboardCheck, Sparkles, ChevronDown, ChevronUp, SlidersHorizontal, RefreshCw } from 'lucide-react';
import {
    fetchGanttDetail, fetchGanttList, submitGanttChart,
    updateGanttChart, lockGanttChart, deleteGanttChart,
    updateGanttDelay, updateGanttSpeed, fetchGanttDetailByToko,
    fetchRABList, fetchRABDetail, fetchSPKList,
    fetchGanttNotes, createGanttNote, fetchInstruksiLapanganList,
    fetchSupervisionWorkspace, createPdfSerahTerimaUnified
} from '@/lib/api';
import type { SupervisionCheckpoint, SupervisionScope, SupervisionWorkspace } from '@/lib/api';
import GanttViewer from '@/components/GanttViewer';
import UnifiedSupervisionGantt from '@/components/UnifiedSupervisionGantt';

const mapInstruksiLapanganToWorkItems = (items: any[] = []) =>
    items.map((item) => ({
        id: -Number(item.id),
        id_rab: 0,
        source_type: 'IL',
        id_instruksi_lapangan_item: Number(item.id),
        kategori_pekerjaan: `[IL] ${String(item.kategori_pekerjaan || 'LAIN-LAIN').toUpperCase()}`,
        jenis_pekerjaan: item.jenis_pekerjaan || '-',
        satuan: item.satuan || '-',
        volume: Number(item.volume) || 0,
        harga_material: Number(item.harga_material) || 0,
        harga_upah: Number(item.harga_upah) || 0,
        total_material: Number(item.total_material) || 0,
        total_upah: Number(item.total_upah) || 0,
        total_harga: Number(item.total_harga) || 0,
    }));

const getWorkItemKey = (item: any) =>
    item?.source_type === 'IL'
        ? `il:${item.id_instruksi_lapangan_item ?? Math.abs(Number(item.id))}`
        : `rab:${item?.id}`;

const getOpnameItemKey = (item: any) =>
    item?.id_instruksi_lapangan_item
        ? `il:${item.id_instruksi_lapangan_item}`
        : `rab:${item?.id_rab_item}`;

const normalizeWorkText = (value: any) =>
    String(value || '')
        .trim()
        .replace(/\[IL\]\s*/gi, '')
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s+/g, ' ')
        .toUpperCase();

const isSameWorkText = (left: any, right: any) =>
    normalizeWorkText(left) === normalizeWorkText(right);

const isCategoryLevelPengawasan = (item: any) =>
    isSameWorkText(item?.kategori_pekerjaan, item?.jenis_pekerjaan);

const validateSequentialDependencies = (tasks: any[]) => {
    const namedTasks = tasks.filter((task) => String(task.name || '').trim());
    if (namedTasks.length <= 1) return null;

    const missingTasks = namedTasks
        .slice(0, -1)
        .filter((task) => !task.dependencies || task.dependencies.length === 0);

    if (missingTasks.length === 0) return null;

    return `Keterikatan wajib diisi untuk semua tahapan kecuali tahapan terakhir. Belum terisi: ${missingTasks
        .map((task) => task.name)
        .join(', ')}.`;
};

const mapApprovedInstruksiToTokoOptions = (items: any[] = []) => {
    const map = new Map<string, any>();
    items.forEach((item) => {
        const idToko = Number(item.id_toko);
        if (!idToko) return;
        const key = `${idToko}`;
        if (!map.has(key)) {
            map.set(key, {
                id: idToko,
                id_toko: idToko,
                nomor_ulok: item.nomor_ulok,
                nama_toko: item.nama_toko,
                cabang: item.cabang,
                lingkup_pekerjaan: item.lingkup_pekerjaan,
                proyek: item.proyek,
                source_type: 'IL'
            });
        }
    });
    return Array.from(map.values());
};

const mergeProjectOptions = (base: any[] = [], extra: any[] = []) => {
    const map = new Map<string, any>();
    [...base, ...extra].forEach((item) => {
        const idToko = item.id_toko || item.id;
        if (!idToko) return;
        const key = `${idToko}`;
        map.set(key, { ...(map.get(key) || {}), ...item, id_toko: idToko });
    });
    return Array.from(map.values());
};
import type { GanttListItem, GanttNoteItem } from '@/lib/api';
import { API_URL, BRANCH_GROUPS, canViewAllBranches, GLOBAL_VIEW_ONLY_ROLES, isViewOnlyUser, normalizeBranchValue } from '@/lib/constants';
import InstruksiLapanganModal from '@/components/InstruksiLapanganModal';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

type GanttDetailResponse = Awaited<ReturnType<typeof fetchGanttDetail>>;

const DAY_WIDTH = 40;
const ROW_HEIGHT = 50;
const PENGAWASAN_UPLOAD_BATCH_SIZE = 20;
const PENGAWASAN_MAX_FILE_SIZE = 10 * 1024 * 1024;

function parseCalendarDate(value?: string | null): Date | null {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.includes('/')) {
        const [dd, mm, yyyy] = raw.split('/');
        const fullYear = yyyy?.length === 2 ? `20${yyyy}` : yyyy;
        const parsed = new Date(Number(fullYear), Number(mm) - 1, Number(dd));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw.split('T')[0] + 'T00:00:00');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCalendarDate(value: Date): string {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatPengawasanDateKey(value?: string | null): string {
    const parsed = parseCalendarDate(value);
    if (!parsed) return String(value || '').trim();
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

type PengawasanFileMap = {
    index: number;
    file: File;
};

const createPengawasanUploadBatches = <T,>(
    items: T[],
    files: PengawasanFileMap[]
) => {
    const batches: Array<{ items: T[]; files: PengawasanFileMap[] }> = [];

    for (let start = 0; start < items.length; start += PENGAWASAN_UPLOAD_BATCH_SIZE) {
        const end = Math.min(start + PENGAWASAN_UPLOAD_BATCH_SIZE, items.length);
        batches.push({
            items: items.slice(start, end),
            files: files
                .filter(({ index }) => index >= start && index < end)
                .map(({ index, file }) => ({ index: index - start, file }))
        });
    }

    return batches;
};

const parseDecimalInput = (value: unknown): number => {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const normalized = raw.includes(",")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeVolumeInput = (value: string) => value.replace(/[^\d,.]/g, "");

function formatUlokWithDash(ulok: string) {
    if (!ulok) return "";
    if (ulok.includes("-")) return ulok;
    const clean = ulok.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length === 11 || clean.length === 12) {
        return `${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8)}`;
    }
    return ulok;
}

function parseDateDDMMYYYY(dateStr: string) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
}

function formatDateID(date: Date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function GanttBoard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showAlert } = useGlobalAlert();

    const urlUlok = searchParams.get('ulok');
    const urlIdToko = searchParams.get('id_toko');
    const urlIdRab = searchParams.get('id_rab');
    const urlLocked = searchParams.get('locked');

    const [appMode, setAppMode] = useState<'kontraktor' | 'pic' | null>(null);
    const [userRole, setUserRole] = useState('');
    const [labelColWidth, setLabelColWidth] = useState(250);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
                    await (window.screen.orientation as any).lock('landscape').catch(() => { });
                }
            } catch (err) {
                console.warn("Fullscreen failed:", err);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleResize = () => setLabelColWidth(window.innerWidth < 768 ? 140 : 250);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [selectedUlok, setSelectedUlok] = useState(formatUlokWithDash(urlUlok || ''));
    const [selectedGanttId, setSelectedGanttId] = useState<number | null>(null);
    const [spkTokoIds, setSpkTokoIds] = useState<Set<number>>(new Set());
    const [spkFilter, setSpkFilter] = useState<'all' | 'spk' | 'partial' | 'no_spk' | 'single'>('all');
    const [spkFilterOpen, setSpkFilterOpen] = useState(false);
    const [ganttNotes, setGanttNotes] = useState<GanttNoteItem[]>([]);
    const [ganttNoteInput, setGanttNoteInput] = useState('');
    const [isGanttNoteLoading, setIsGanttNoteLoading] = useState(false);
    const [isGanttNoteSending, setIsGanttNoteSending] = useState(false);

    const [projectData, setProjectData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProjectLocked, setIsProjectLocked] = useState(false);
    const [availableProjects, setAvailableProjects] = useState<GanttListItem[]>([]);
    const [allTokoList, setAllTokoList] = useState<any[]>([]);
    const [isDirectAccess, setIsDirectAccess] = useState(false);
    const [searchUlokInput, setSearchUlokInput] = useState("");

    const filteredTokoList = useMemo(() => {
        let list = allTokoList;
        if (searchUlokInput) {
            const lowerSearch = searchUlokInput.toLowerCase();
            list = list.filter((toko: any) => {
                const ulok = formatUlokWithDash(toko.nomor_ulok).toLowerCase();
                const nama = (toko.nama_toko || "").toLowerCase();
                const cabang = (toko.cabang || "").toLowerCase();
                return ulok.includes(lowerSearch) || nama.includes(lowerSearch) || cabang.includes(lowerSearch);
            });
        }

        if (spkFilter !== 'all') {
            list = list.filter((toko: any) => {
                const ulokTokos = allTokoList.filter(t => t.nomor_ulok === toko.nomor_ulok);
                const spkCount = ulokTokos.filter(t => spkTokoIds.has(Number(t.id_toko || t.id))).length;
                const totalCount = ulokTokos.length;
                
                // SPK Lengkap: ULOK punya 2+ scope DAN semua sudah SPK
                if (spkFilter === 'spk') return totalCount >= 2 && spkCount === totalCount;
                // SPK Tunggal: ULOK cuma punya 1 scope DAN sudah SPK
                if (spkFilter === 'single') return totalCount === 1 && spkCount === 1;
                // SPK Partial: ULOK punya 2+ scope DAN hanya sebagian yang SPK
                if (spkFilter === 'partial') return totalCount >= 2 && spkCount > 0 && spkCount < totalCount;
                // Belum SPK
                if (spkFilter === 'no_spk') return spkCount === 0;
                return true;
            });
        }
        return list;
    }, [allTokoList, searchUlokInput, spkFilter, spkTokoIds]);

    const [tasks, setTasks] = useState<any[]>([]);
    const [isApplying, setIsApplying] = useState(false);

    const [rawDayGanttData, setRawDayGanttData] = useState<any[]>([]);

    const [spkInfo, setSpkInfo] = useState<{ startDate: string; duration: number } | null>(null);
    const [pengawasanDates, setPengawasanDates] = useState<string[]>([]);
    const [pengawasanHistory, setPengawasanHistory] = useState<any[]>([]);

    const [rabItems, setRabItems] = useState<any[]>([]);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showOpnameModal, setShowOpnameModal] = useState(false);
    const [activeHeaderClick, setActiveHeaderClick] = useState<{ dayIndex: number, dateString: string, label: string } | null>(null);
    const [supervisionWorkspace, setSupervisionWorkspace] = useState<SupervisionWorkspace | null>(null);
    const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
    const [isGeneratingHandover, setIsGeneratingHandover] = useState(false);
    const [unifiedMemoFlow, setUnifiedMemoFlow] = useState<{
        scopes: Array<{ scope: SupervisionScope; checkpoint: SupervisionCheckpoint }>;
        index: number;
        dayIndex: number;
        dateString: string;
    } | null>(null);
    const [unifiedOpnameFlow, setUnifiedOpnameFlow] = useState<{
        scopes: Array<{ scope: SupervisionScope; checkpoint: SupervisionCheckpoint }>;
        index: number;
        dayIndex: number;
        dateString: string;
    } | null>(null);
    const [unifiedMemoDrafts, setUnifiedMemoDrafts] = useState<Record<string, any>>({});

    const { user } = useSession();
    
    const isScopeSpkApproved = useMemo(() => {
        if (!projectData?.id_toko) return false;
        return spkTokoIds.has(Number(projectData.id_toko));
    }, [projectData?.id_toko, spkTokoIds]);

    const isViewOnly = isViewOnlyUser(user?.roles, user?.isSuperHuman ?? false);
    const isReadOnly = isViewOnly;
    const unifiedTimeline = useMemo(() => {
        if (!supervisionWorkspace) return null;
        const starts: Date[] = [];
        const ends: Date[] = [];

        supervisionWorkspace.scopes.forEach((scope) => {
            const spkStart = parseCalendarDate(scope.spk_start_date);
            const duration = Number(scope.spk_effective_duration || scope.spk_duration || 0);
            if (spkStart) {
                starts.push(spkStart);
                const end = new Date(spkStart);
                end.setDate(end.getDate() + Math.max(duration, 1) - 1);
                ends.push(end);
            }

            (scope.checkpoints || []).forEach((checkpoint) => {
                const date = parseCalendarDate(checkpoint.tanggal_pengawasan);
                if (date) {
                    starts.push(date);
                    ends.push(date);
                }
            });
        });

        if (starts.length === 0 || ends.length === 0) return null;
        const min = new Date(Math.min(...starts.map((date) => date.getTime())));
        const max = new Date(Math.max(...ends.map((date) => date.getTime())));
        const duration = Math.max(1, Math.round((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return {
            startDate: formatCalendarDate(min),
            duration,
            syncGroup: `unified-${supervisionWorkspace.nomor_ulok}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
        };
    }, [supervisionWorkspace]);
    const canWriteGanttCommunication = appMode === 'pic' && !!selectedGanttId && !isReadOnly;

    const loadSupervisionWorkspace = useCallback(async (nomorUlok: string) => {
        if (!nomorUlok) return;
        setIsWorkspaceLoading(true);
        try {
            const response = await fetchSupervisionWorkspace(nomorUlok);
            setSupervisionWorkspace(response.data);
            setSelectedUlok(formatUlokWithDash(nomorUlok));
            // NOTE: spkTokoIds TIDAK dioverride di sini.
            // spkTokoIds sudah diisi dengan benar dari fetchSPKList({ status: 'SPK_APPROVED' })
            // saat halaman pertama kali dimuat. Mengoverride di sini dengan kondisi
            // (spk_start_date || spk_duration) akan membuat filter SPK error karena
            // scope yang WAITING_FOR_BM_APPROVAL pun bisa punya spk_start_date.
        } catch (error: any) {
            setSupervisionWorkspace(null);
            showAlert({ message: error?.message || "Gagal memuat workspace pengawasan.", type: "error" });
        } finally {
            setIsWorkspaceLoading(false);
        }
    }, [showAlert]);

    const openScopeCheckpoint = useCallback(async (
        scope: SupervisionScope,
        checkpoint: SupervisionCheckpoint,
        dayIndex: number
    ) => {
        if (!scope.gantt_id) return;
        await loadDataByToko(scope.id_toko);
        setActiveHeaderClick({
            dayIndex,
            dateString: checkpoint.tanggal_pengawasan,
            label: checkpoint.tanggal_pengawasan.slice(0, 5),
        });



        if (checkpoint.total_items > 0 && checkpoint.ready_opname_items === 0 && checkpoint.opname_items > 0) {
            showAlert({
                title: "Sudah masuk Opname",
                message: "Pekerjaan selesai pada checkpoint ini sudah diproses ke Opname dan dikunci. Tidak ada pekerjaan baru untuk diajukan.",
                type: "info",
            });
            return;
        }

        setShowMemoModal(true);
    }, [showAlert]);

    const openUnifiedCheckpoint = useCallback(async (
        checkpoint: SupervisionCheckpoint,
        dayIndex: number
    ) => {
        if (!supervisionWorkspace) return;

        const targetDateKey = formatPengawasanDateKey(checkpoint.tanggal_pengawasan);
        const flowScopes = (checkpoint as any).scopes
            ? (checkpoint as any).scopes
                .map((entry: any) => {
                    const scope = supervisionWorkspace.scopes.find((item) => Number(item.id_toko) === Number(entry.id_toko));
                    const scopeCheckpoint = entry.checkpoint
                        ?? scope?.checkpoints?.find((item) => formatPengawasanDateKey(item.tanggal_pengawasan) === targetDateKey)
                        ?? { tanggal_pengawasan: checkpoint.tanggal_pengawasan, total_items: 0, ready_opname_items: 0, opname_items: 0 };
                    return scope ? { scope, checkpoint: scopeCheckpoint } : null;
                })
                .filter(Boolean)
            : supervisionWorkspace.scopes
                .map((scope) => {
                    const scopeCheckpoint = scope.checkpoints?.find((item) => formatPengawasanDateKey(item.tanggal_pengawasan) === targetDateKey)
                        ?? { tanggal_pengawasan: targetDateKey, total_items: 0, ready_opname_items: 0, opname_items: 0 };
                    return { scope, checkpoint: scopeCheckpoint };
                })
                .filter(Boolean);

        if (flowScopes.length === 0) return;

        const first = flowScopes[0] as { scope: SupervisionScope; checkpoint: SupervisionCheckpoint };
        setUnifiedMemoFlow({
            scopes: flowScopes as Array<{ scope: SupervisionScope; checkpoint: SupervisionCheckpoint }>,
            index: 0,
            dayIndex,
            dateString: checkpoint.tanggal_pengawasan,
        });
        await loadDataByToko(first.scope.id_toko);
        setActiveHeaderClick({
            dayIndex,
            dateString: checkpoint.tanggal_pengawasan,
            label: checkpoint.tanggal_pengawasan.slice(0, 5),
        });
        setShowMemoModal(true);
    }, [supervisionWorkspace]);

    const isScopeReadyForSerahTerima = useCallback((scope: SupervisionScope) =>
        Boolean(scope.gantt_id)
        && Boolean(scope.opname_final_id)
        && (scope.checkpoints || []).reduce((sum, checkpoint) => sum + Number(checkpoint.opname_items || 0), 0) > 0
        && (scope.checkpoints || []).reduce((sum, checkpoint) => sum + Number(checkpoint.ready_opname_items || 0), 0) === 0,
        []);

    const handleGenerateUnifiedHandover = useCallback(async () => {
        if (!supervisionWorkspace?.unified_serah_terima_ready) return;
        setIsGeneratingHandover(true);
        try {
            await createPdfSerahTerimaUnified(supervisionWorkspace.nomor_ulok);
            await loadSupervisionWorkspace(supervisionWorkspace.nomor_ulok);
            showAlert({ message: "PDF Serah Terima SIPIL/ME berhasil diproses.", type: "success" });
        } catch (error: any) {
            showAlert({ message: error?.message || "Gagal generate Serah Terima.", type: "error" });
        } finally {
            setIsGeneratingHandover(false);
        }
    }, [loadSupervisionWorkspace, showAlert, supervisionWorkspace]);

    const loadGanttNotes = async (ganttId: number) => {
        setIsGanttNoteLoading(true);
        try {
            const res = await fetchGanttNotes(ganttId);
            setGanttNotes(res.data || []);
        } catch (err) {
            console.error("Gagal memuat catatan pengawasan Gantt:", err);
            setGanttNotes([]);
        } finally {
            setIsGanttNoteLoading(false);
        }
    };

    const handleSendGanttNote = async () => {
        if (!selectedGanttId || !user || !ganttNoteInput.trim()) return;
        setIsGanttNoteSending(true);
        try {
            const res = await createGanttNote(selectedGanttId, {
                author_email: user.email,
                author_name: user.namaLengkap || user.email,
                author_role: user.role,
                note: ganttNoteInput.trim(),
            });
            setGanttNotes(prev => [...prev, res.data]);
            setGanttNoteInput('');
        } catch (err: any) {
            showAlert({ message: err.message || "Gagal mengirim catatan pengawasan.", type: "error" });
        } finally {
            setIsGanttNoteSending(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        const { role, email, cabang } = user;
        const upperCabang = cabang.toUpperCase();
        let userGroup: string[] | null = null;
        if (upperCabang) {
            for (const grp of Object.values(BRANCH_GROUPS)) {
                if (grp.includes(upperCabang)) {
                    userGroup = grp;
                    break;
                }
            }
        }

        setUserRole(role);
        const roles = role.split(',').map(r => r.trim().toUpperCase());
        let currentAppMode: 'kontraktor' | 'pic' = 'kontraktor';
        const picRoles = ['BUILDING & MAINTENANCE SUPER HUMAN', ...GLOBAL_VIEW_ONLY_ROLES, 'BRANCH BUILDING & MAINTENANCE MANAGER', 'BRANCH BUILDING COORDINATOR', 'BRANCH BUILDING SUPPORT', 'DIREKTUR KONTRAKTOR', 'DIREKTUR'];
        const canSeeAllBranches = canViewAllBranches(roles, user.isSuperHuman ?? false);

        if (roles.includes('KONTRAKTOR')) {
            currentAppMode = 'kontraktor';
            setAppMode('kontraktor');
        } else if (roles.some(r => picRoles.includes(r))) {
            currentAppMode = 'pic';
            setAppMode('pic');
        } else {
            showAlert({ message: "Anda tidak memiliki akses.", type: "error", onConfirm: () => router.push('/dashboard') });
            return;
        }

        if (currentAppMode === 'pic' && urlUlok) {
            loadSupervisionWorkspace(urlUlok);
        } else if (urlIdToko) {
            loadDataByToko(parseInt(urlIdToko), urlIdRab ? parseInt(urlIdRab) : undefined);
        } else if (urlIdRab) {
            loadDataByRab(parseInt(urlIdRab));
        } else {
            const filters = currentAppMode === 'kontraktor'
                ? { email_pembuat: email || '' }
                : {};

            fetchGanttList(filters)
                .then(res => {
                    const data = res.data || [];
                    const filtered = upperCabang ? data.filter(item => {
                        const normalizedCabang = normalizeBranchValue(item.cabang);
                        if (canSeeAllBranches) return true;
                        if (userGroup) return userGroup.includes(normalizedCabang);
                        return normalizedCabang === upperCabang;
                    }) : data;
                    setAvailableProjects(filtered);
                })
                .catch(err => console.error("Gagal memuat list Gantt Chart:", err));
        }

        if (!urlLocked && !urlUlok) {
            setIsDirectAccess(true);
        }

        if (urlUlok) {
            return;
        }

        if (currentAppMode === 'pic') {
            Promise.all([
                fetchGanttList(),
                fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }),
                fetchSPKList({ status: 'SPK_APPROVED' }).catch(() => ({ data: [] }))
            ])
                .then(([res, instruksiRes, spkRes]) => {
                    const spkIds = new Set<number>();
                    if (spkRes && Array.isArray(spkRes.data)) {
                        spkRes.data.forEach((spk: any) => {
                            if (spk.id_toko) spkIds.add(Number(spk.id_toko));
                        });
                    }
                    setSpkTokoIds(spkIds);

                    const data = res.data || [];
                    const ilProjects = mapApprovedInstruksiToTokoOptions(instruksiRes.data || []);
                    const merged = mergeProjectOptions(data, ilProjects);
                    const filtered = upperCabang ? merged.filter(item => {
                        const normalizedCabang = normalizeBranchValue(item.cabang);
                        if (canSeeAllBranches) return true;
                        if (userGroup) return userGroup.includes(normalizedCabang);
                        return normalizedCabang === upperCabang;
                    }) : merged;
                    setAllTokoList(filtered);
                })
                .catch(err => console.error("Gagal memuat semua daftar Gantt:", err));
        } else {
            Promise.all([
                fetchRABList(),
                fetchInstruksiLapanganList({ status: 'Disetujui' }, { suppressGlobalError: true }),
                fetchSPKList({ status: 'SPK_APPROVED' }).catch(() => ({ data: [] }))
            ])
                .then(([res, instruksiRes, spkRes]) => {
                    const spkIds = new Set<number>();
                    if (spkRes && Array.isArray(spkRes.data)) {
                        spkRes.data.forEach((spk: any) => {
                            if (spk.id_toko) spkIds.add(Number(spk.id_toko));
                        });
                    }
                    setSpkTokoIds(spkIds);

                    const data = res.data || [];
                    const ilProjects = mapApprovedInstruksiToTokoOptions(instruksiRes.data || []);
                    const merged = mergeProjectOptions(data, ilProjects);
                    const filtered = upperCabang ? merged.filter(item => {
                        const normalizedCabang = normalizeBranchValue(item.cabang);
                        if (canSeeAllBranches) return true;
                        if (userGroup) return userGroup.includes(normalizedCabang);
                        return normalizedCabang === upperCabang;
                    }) : merged;
                    setAllTokoList(filtered);
                })
                .catch(err => console.error("Gagal memuat semua daftar RAB:", err));
        }

    }, [user, urlIdToko, urlIdRab, urlLocked, urlUlok, loadSupervisionWorkspace, router, showAlert]);

    const loadDataByRab = async (idRab: number, fallbackIdToko?: number) => {
        setIsLoading(true);
        try {
            const rabDetailRes = await fetchRABDetail(idRab);
            const { rab, toko, items } = rabDetailRes.data;
            if (items) setRabItems(items);

            setSelectedGanttId(null);
            setGanttNotes([]);
            setGanttNoteInput('');
            setIsProjectLocked(false);
            setSelectedUlok(formatUlokWithDash(toko.nomor_ulok));
            setSpkInfo(null);

            const rData: any = rab;
            const rDuration = rData?.durasi_pekerjaan ? parseInt(String(rData.durasi_pekerjaan).replace(/\D/g, '')) || 1 : 1;

            setProjectData({
                ganttId: null,
                id_toko: toko.id,
                ulokClean: formatUlokWithDash(toko.nomor_ulok),
                store: toko.nama_toko || "Data Toko",
                kode_toko: toko.kode_toko || "Belum diisi",
                work: toko.lingkup_pekerjaan || "SIPIL",
                cabang: toko.cabang || "-",
                kontraktor: toko.nama_kontraktor || "-",
                duration: rDuration,
                startDate: new Date().toISOString().split('T')[0],
            });

            const uniqueCats = new Set<string>();
            if (items) {
                items.forEach((item: any) => {
                    if (item.kategori_pekerjaan && item.volume > 0) {
                        uniqueCats.add(item.kategori_pekerjaan);
                    }
                });
            }

            let finalCategories = uniqueCats.size > 0 ? Array.from(uniqueCats) : ["PERSIAPAN"];

            const generatedTasks = finalCategories.map((kName: string, idx: number) => ({
                id: idx + 1,
                name: kName,
                dependencies: [],
                ranges: [{ start: '', end: '', keterlambatan: 0 }],
                keterlambatan: 0
            }));

            setTasks(generatedTasks);
            setRawDayGanttData([]);

        } catch (err: any) {
            console.error("loadDataByRab Error:", err);
            if (fallbackIdToko) {
                loadDataByToko(fallbackIdToko);
            } else {
                showAlert({ message: `Gagal memuat data RAB: ${err.message}`, type: "error" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadDataByToko = async (idToko: number, fallbackIdRab?: number) => {
        setIsLoading(true);
        try {
            const res = await fetchGanttDetailByToko(idToko);
            const { rab, filtered_categories, gantt_data, toko, instruksi_lapangan_items } = res;

            const validRabId = rab?.id || fallbackIdRab;

            if (gantt_data) {
                await loadGanttDetail(gantt_data.id, validRabId, instruksi_lapangan_items || [], {
                    status: "success",
                    data: {
                        gantt: gantt_data,
                        toko,
                        kategori_pekerjaan: res.kategori_pekerjaan || [],
                        day_items: res.day_gantt_data || [],
                        dependencies: res.dependency_data || [],
                        pengawasan: res.pengawasan_data || [],
                        instruksi_lapangan_items: instruksi_lapangan_items || []
                    }
                });
            } else {
                setSelectedGanttId(null);
                setGanttNotes([]);
                setGanttNoteInput('');
                setIsProjectLocked(false);
                setSelectedUlok(formatUlokWithDash(toko.nomor_ulok));
                setSpkInfo(null);

                if (!validRabId) {
                    showAlert({ message: "Info: RAB belum disetujui atau belum ada untuk toko ini.", type: "info" });
                }

                let finalCategories = filtered_categories || [];
                const instruksiItems = mapInstruksiLapanganToWorkItems(instruksi_lapangan_items || []);
                let rDuration = 1;

                if (validRabId) {
                    try {
                        const rabDetailRes = await fetchRABDetail(validRabId);
                        if (rabDetailRes?.data?.rab?.durasi_pekerjaan) {
                            rDuration = parseInt(String(rabDetailRes.data.rab.durasi_pekerjaan).replace(/\D/g, '')) || 1;
                        }

                        if (rabDetailRes?.data?.items) {
                            setRabItems([...(rabDetailRes.data.items || []), ...instruksiItems]);
                            const uniqueCats = new Set<string>();
                            rabDetailRes.data.items.forEach((item: any) => {
                                if (item.kategori_pekerjaan && item.volume > 0) {
                                    uniqueCats.add(item.kategori_pekerjaan);
                                }
                            });
                            if (uniqueCats.size > 0) {
                                finalCategories = Array.from(new Set([...Array.from(uniqueCats), ...finalCategories]));
                            }
                        }
                    } catch (e) {
                        console.error("Gagal mengambil kategori dari RAB Detail:", e);
                    }
                }

                setProjectData({
                    ganttId: null,
                    id_toko: toko.id,
                    ulokClean: formatUlokWithDash(toko.nomor_ulok),
                    store: toko.nama_toko || "Data Toko",
                    kode_toko: toko.kode_toko || "Belum diisi",
                    work: toko.lingkup_pekerjaan || "SIPIL",
                    cabang: toko.cabang || "-",
                    kontraktor: toko.nama_kontraktor || "-",
                    duration: rDuration,
                    startDate: new Date().toISOString().split('T')[0],
                });

                if (!validRabId) {
                    setRabItems(instruksiItems);
                }

                const generatedTasks = finalCategories.map((kName: string, idx: number) => ({
                    id: idx + 1,
                    name: kName,
                    dependencies: [],
                    ranges: [{ start: '', end: '', keterlambatan: 0 }],
                    keterlambatan: 0
                }));

                setTasks(generatedTasks);
                setRawDayGanttData([]);
            }
        } catch (err: any) {
            console.error(err);
            showAlert({ message: `Gagal memuat data Toko: ${err.message}`, type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const loadGanttDetail = async (
        ganttId: number,
        idRabFallback?: number,
        instruksiLapanganFallback: any[] = [],
        preloadedDetail?: GanttDetailResponse
    ) => {
        if (!ganttId) return;
        setIsLoading(true);
        setSelectedGanttId(ganttId);
        setGanttNoteInput('');
        loadGanttNotes(ganttId);

        try {
            const { data } = preloadedDetail ?? await fetchGanttDetail(ganttId);
            const { gantt, toko, kategori_pekerjaan, day_items, dependencies, pengawasan, instruksi_lapangan_items } = data;
            let baseCategories: string[] = [];
            const instruksiItems = mapInstruksiLapanganToWorkItems(
                (instruksi_lapangan_items && instruksi_lapangan_items.length > 0)
                    ? instruksi_lapangan_items
                    : instruksiLapanganFallback
            );
            const instruksiCategories = instruksiItems.map((item: any) => item.kategori_pekerjaan);
            let rabDurationFallback = 0;

            if (idRabFallback) {
                try {
                    const rabDetailRes = await fetchRABDetail(idRabFallback);
                    if (rabDetailRes?.data) {
                        const rData: any = rabDetailRes.data.rab;
                        if (rData?.durasi_pekerjaan) {
                            rabDurationFallback = parseInt(String(rData.durasi_pekerjaan).replace(/\D/g, '')) || 0;
                        }
                        if (rabDetailRes.data.items) {
                            setRabItems([...(rabDetailRes.data.items || []), ...instruksiItems]);
                            const uniqueCats = new Set<string>();
                            rabDetailRes.data.items.forEach((item: any) => {
                                if (item.kategori_pekerjaan && item.volume > 0) {
                                    uniqueCats.add(item.kategori_pekerjaan.toUpperCase());
                                }
                            });
                            baseCategories = Array.from(uniqueCats);
                        }
                    }
                } catch (e) {
                    console.error("Gagal get fallback RAB details:", e);
                }
            }
            if (!idRabFallback) {
                setRabItems(instruksiItems);
            }

            let projectStart = new Date();
            if (gantt.timestamp) {
                const parts = gantt.timestamp.split('T')[0].split('-');
                if (parts.length === 3) {
                    projectStart = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }
            }

            const msPerDay = 1000 * 60 * 60 * 24;
            const toDayNumber = (val: string): number => {
                if (!val) return NaN;
                const cleanVal = String(val).trim();
                if (cleanVal.includes('/')) {
                    const parsed = parseDateDDMMYYYY(cleanVal);
                    if (!parsed) return NaN;
                    const diff = Math.round((parsed.getTime() - projectStart.getTime()) / msPerDay);
                    return diff + 1;
                }
                return parseInt(cleanVal);
            };

            const startDaysRaw = day_items
                .map(entry => toDayNumber(entry.h_awal))
                .filter(d => !isNaN(d));

            const endDaysRaw = day_items
                .map(entry => toDayNumber(entry.h_akhir))
                .filter(d => !isNaN(d));

            const maxDay = endDaysRaw.length > 0 ? Math.max(...endDaysRaw) : 0;

            const ganttComputedDuration = maxDay;
            const duration = rabDurationFallback > 0 ? rabDurationFallback : ganttComputedDuration;

            setSelectedUlok(formatUlokWithDash(toko.nomor_ulok));
            setProjectData({
                ganttId: gantt.id,
                id_toko: toko.id,
                ulokClean: formatUlokWithDash(toko.nomor_ulok),
                store: toko.nama_toko || "Data Toko Ditemukan",
                kode_toko: toko.kode_toko || "Belum diisi",
                work: toko.lingkup_pekerjaan || "SIPIL",
                cabang: toko.cabang || "-",
                kontraktor: toko.nama_kontraktor || "-",
                duration,
                startDate: projectStart.toISOString().split('T')[0],
            });

            const pDates = (pengawasan || [])
                .map((p: any) => p.tanggal_pengawasan)
                .filter(Boolean);
            setPengawasanDates(pDates);
            setPengawasanHistory(pengawasan || []);

            setIsProjectLocked(['terkunci', 'locked', 'published'].includes(gantt.status.toLowerCase()));

            try {
                const spkRes = await fetchSPKList({ nomor_ulok: toko.nomor_ulok, status: 'SPK_APPROVED' });
                const approvedSpks = (spkRes.data || []).filter(s => s.status?.toUpperCase() === 'SPK_APPROVED');
                const currentLingkup = String(toko.lingkup_pekerjaan || '').trim().toUpperCase();
                const approvedSpk =
                    approvedSpks.find((s: any) => Number(s.id_toko) === Number(toko.id)) ||
                    approvedSpks.find((s: any) => String(s.lingkup_pekerjaan || '').trim().toUpperCase() === currentLingkup) ||
                    approvedSpks[0];
                const effectiveDuration = Number(approvedSpk?.effective_durasi ?? approvedSpk?.durasi ?? 0);
                if (approvedSpk && approvedSpk.waktu_mulai && effectiveDuration > 0) {
                    setSpkInfo({ startDate: approvedSpk.waktu_mulai, duration: effectiveDuration });
                } else {
                    setSpkInfo(null);
                }
            } catch {
                setSpkInfo(null);
            }

            const normalizedRaw = day_items.map(d => ({
                Kategori: d.kategori_pekerjaan,
                h_awal: d.h_awal,
                h_akhir: d.h_akhir,
                keterlambatan: d.keterlambatan ?? 0,
                kecepatan: d.kecepatan ?? "",
                _id: d.id,
                _id_gantt: d.id_gantt,
            }));
            setRawDayGanttData(normalizedRaw);

            const savedCategories = kategori_pekerjaan.map(k => k.kategori_pekerjaan.toUpperCase());
            const mergedCategoriesRaw = new Set([...baseCategories, ...savedCategories, ...instruksiCategories]);
            if (mergedCategoriesRaw.size === 0) mergedCategoriesRaw.add("PERSIAPAN");

            let generatedTasks: any[] = Array.from(mergedCategoriesRaw).map((catName, idx) => ({
                id: idx + 1, name: catName, dependencies: [], ranges: [], keterlambatan: 0
            }));

            const categoryRangesMap: Record<string, any[]> = {};
            day_items.forEach(entry => {
                const startDay = toDayNumber(entry.h_awal);
                const endDay = toDayNumber(entry.h_akhir);

                if (!isNaN(startDay) && !isNaN(endDay)) {
                    const key = entry.kategori_pekerjaan.toLowerCase().trim();
                    if (!categoryRangesMap[key]) categoryRangesMap[key] = [];
                    categoryRangesMap[key].push({
                        start: startDay,
                        end: endDay,
                        duration: endDay - startDay + 1,
                        keterlambatan: parseInt(String(entry.keterlambatan || 0)),
                    });
                }
            });

            // depMap: child → daftar nama parent-nya
            // (dep.kategori_pekerjaan = child, dep.kategori_pekerjaan_terikat = parent)
            const depMap: Record<string, string[]> = {};
            dependencies.forEach(dep => {
                const child = dep.kategori_pekerjaan.toLowerCase().trim();
                const parent = dep.kategori_pekerjaan_terikat.toLowerCase().trim();
                if (!depMap[child]) depMap[child] = [];
                depMap[child].push(parent);
            });

            generatedTasks = generatedTasks.map(task => {
                const tName = task.name.toLowerCase().trim();

                const matchedRanges = categoryRangesMap[tName]
                    ?? Object.entries(categoryRangesMap).find(([k]) => tName.includes(k) || k.includes(tName))?.[1]
                    ?? [];

                // Cari id task-task yang menjadi parent dari task ini
                const parentIds: number[] = [];
                (depMap[tName] || []).forEach(parentName => {
                    const parentObj = generatedTasks.find(t => t.name.toLowerCase().trim() === parentName);
                    if (parentObj) parentIds.push(parentObj.id);
                });

                return {
                    ...task,
                    ranges: matchedRanges.length > 0 ? matchedRanges : [{ start: '', end: '', keterlambatan: 0 }],
                    dependencies: parentIds,
                };
            });

            setTasks(generatedTasks);

        } catch (err: any) {
            console.error(err);
            showAlert({ message: `Sistem: ${err.message}`, type: "error" });
            setProjectData(null);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRangeChange = (taskId: number, rangeIdx: number, field: 'start' | 'end', value: string) => {
        let parsedVal = parseInt(value);
        if (!isNaN(parsedVal)) {
            const maxDuration = projectData?.duration || 99;
            if (parsedVal > maxDuration) {
                parsedVal = maxDuration;
            }
        }
        const finalValue = isNaN(parsedVal) && value !== '' ? '' : (value === '' ? '' : parsedVal.toString());

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newRanges = [...t.ranges];
                newRanges[rangeIdx][field] = finalValue;
                return { ...t, ranges: newRanges };
            }
            return t;
        }));
    };

    const handleDependencyChange = (taskId: number, parentIdStr: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, dependencies: parentIdStr ? [parseInt(parentIdStr)] : [] };
            }
            return t;
        }));
    };

    const addRange = (taskId: number) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, ranges: [...t.ranges, { start: '', end: '', keterlambatan: 0 }] };
            }
            return t;
        }));
    };

    const removeRange = async (taskId: number, rangeIdx: number) => {
        const taskObj = tasks.find(t => t.id === taskId);
        if (!taskObj) return;

        const rangeToRemove = taskObj.ranges[rangeIdx];

        if (rangeToRemove.start && rangeToRemove.end) {
            const isConfirmed = window.confirm("Hapus periode ini? Jangan lupa untuk klik 'Simpan Draft' agar penghapusan tersimpan di server.");
            if (!isConfirmed) return;
        }

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newRanges = t.ranges.filter((_: any, i: number) => i !== rangeIdx);
                if (newRanges.length === 0) newRanges.push({ start: '', end: '', keterlambatan: 0 });
                return { ...t, ranges: newRanges };
            }
            return t;
        }));
    };

    const handleSaveData = async (status: 'Active' | 'Terkunci') => {
        if (isReadOnly) {
            showAlert({ message: "Role ini hanya memiliki akses view.", type: "warning" });
            return;
        }
        setIsApplying(true);
        try {
            const email = sessionStorage.getItem('loggedInUserEmail') || "-";
            const cabang = sessionStorage.getItem('loggedInUserCabang') || "-";
            const namaKontraktor = sessionStorage.getItem('loggedInUserName') || sessionStorage.getItem('loggedInUserEmail') || "-";

            const kategori_pekerjaan: string[] = [];
            const day_items: any[] = [];
            const dependencies: any[] = [];
            const dependencyError = validateSequentialDependencies(tasks);
            if (dependencyError) {
                throw new Error(dependencyError);
            }

            const pengawasanSet = new Set<string>();
            (rawDayGanttData || []).forEach((d: any) => {
                const k = (d.Kategori || '').toUpperCase().trim();
                if (k) pengawasanSet.add(k);
            });
            const pengawasan = Array.from(pengawasanSet).map(k => ({ kategori_pekerjaan: k }));

            tasks.forEach(t => {
                const kategoriName = t.name?.toUpperCase().trim();
                if (!kategoriName) return;

                kategori_pekerjaan.push(kategoriName);

                if (t.ranges && t.ranges.length > 0) {
                    t.ranges.forEach((r: any) => {
                        if (!r.start || !r.end) return;

                        const dayItem: any = {
                            kategori_pekerjaan: kategoriName,
                            h_awal: String(r.start),
                            h_akhir: String(r.end),
                        };

                        dayItem.keterlambatan = r.keterlambatan ? String(r.keterlambatan) : "";
                        dayItem.kecepatan = "";

                        day_items.push(dayItem);
                    });
                }

                if (t.dependencies && t.dependencies.length > 0) {
                    t.dependencies.forEach((childId: number) => {
                        const cTask = tasks.find(ct => ct.id === childId);
                        if (cTask && cTask.name?.trim()) {
                            dependencies.push({
                                kategori_pekerjaan: cTask.name.toUpperCase().trim(),
                                kategori_pekerjaan_terikat: kategoriName
                            });
                        }
                    });
                }
            });

            if (day_items.length === 0) {
                throw new Error("Harap isi tanggal mulai dan selesai minimal satu tahapan.");
            }

            let submitRes: any = null;

            if (selectedGanttId) {
                const updatePayload = {
                    day_items: day_items,
                    kategori_pekerjaan: [],
                    pengawasan: [],
                    dependencies: dependencies
                };

                await updateGanttChart(selectedGanttId, updatePayload);

                if (status === 'Terkunci') {
                    await lockGanttChart(selectedGanttId, email);
                }
            } else {
                const isRenovasiUlok = /-R$/i.test(String(projectData.ulokClean || '').trim());
                const payload: any = {
                    nomor_ulok: projectData.ulokClean,
                    nama_toko: projectData.store,
                    kode_toko: projectData.kode_toko,
                    proyek: isRenovasiUlok ? "Renovasi" : "Reguler",
                    cabang: cabang,
                    alamat: "-",
                    nama_kontraktor: namaKontraktor,
                    lingkup_pekerjaan: projectData.work.toUpperCase(),
                    email_pembuat: email,
                    kategori_pekerjaan,
                    day_items,
                    pengawasan,
                    dependencies
                };

                submitRes = await submitGanttChart(payload);

                if (status === 'Terkunci' && submitRes.data?.id) {
                    await lockGanttChart(submitRes.data.id, email);
                }
            }

            if (status === 'Terkunci') {
                showAlert({ message: "Berhasil! Jadwal telah dikunci dan RAB masuk proses approval.", type: "success" });
                router.push('/dashboard');
            } else {
                showAlert({ message: "Draft Gantt berhasil disimpan. RAB masuk proses approval.", type: "success" });
                const newGanttId = selectedGanttId || submitRes?.data?.id;
                if (newGanttId) loadGanttDetail(newGanttId);
            }
        } catch (e: any) {
            showAlert({ message: `Gagal menyimpan data: ${e.message}`, type: "error" });
            console.error(e);
        } finally {
            setIsApplying(false);
        }
    };

    const handleDeleteGantt = async () => {
        if (isReadOnly) {
            showAlert({ message: "Role ini hanya memiliki akses view.", type: "warning" });
            return;
        }
        if (!selectedGanttId) return;

        const isConfirmed = window.confirm("Hapus draft jadwal ini? Semua data periode dan keterikatan di dalamnya akan terhapus permanen.");
        if (!isConfirmed) return;

        setIsApplying(true);
        try {
            await deleteGanttChart(selectedGanttId);
            showAlert({ message: "Draft jadwal berhasil dihapus.", type: "success" });

            setSelectedGanttId(null);
            setProjectData(null);
            setTasks([]);

            window.location.reload();
        } catch (error: any) {
            showAlert({ message: `Gagal menghapus: ${error.message}`, type: "error" });
        } finally {
            setIsApplying(false);
        }
    };

    const chartData = useMemo(() => {
        if (!projectData || tasks.length === 0) return null;

        let processedTasks = [...tasks];
        let maxTaskEndDay = 0;
        let effectiveEndDates: Record<number, number> = {};

        processedTasks.forEach(task => {
            let maxShift = 0;
            const myParents = processedTasks.filter(pt => pt.dependencies && pt.dependencies.includes(task.id));
            if (myParents.length > 0) {
                myParents.forEach(parentTask => {
                    const parentShift = parentTask.computed?.shift || 0;
                    const pRanges = parentTask.ranges || [];
                    const parentDelay = pRanges.length > 0 ? (parseInt(pRanges[pRanges.length - 1].keterlambatan) || 0) : 0;
                    const potentialShift = parentShift + parentDelay;
                    if (potentialShift > maxShift) maxShift = potentialShift;
                });
            }

            task.computed = { shift: maxShift };

            const ranges = task.ranges || [];
            if (ranges.length > 0 && ranges[0].start) {
                const lastRange = ranges[ranges.length - 1];
                effectiveEndDates[task.id] = parseInt(lastRange.end) + maxShift + (parseInt(lastRange.keterlambatan) || 0);

                ranges.forEach((r: any) => {
                    const endVal = parseInt(r.end) + maxShift + (parseInt(r.keterlambatan) || 0);
                    if (endVal > maxTaskEndDay) maxTaskEndDay = endVal;
                });
            }
        });
        const supervisionDays: Record<number, boolean> = {};
        const effectiveStartDate = (spkInfo && spkInfo.startDate) ? spkInfo.startDate : (projectData && projectData.startDate ? projectData.startDate : null);
        let maxSupervisionDay = 0;
        if (effectiveStartDate && pengawasanDates.length > 0) {
            const startD = new Date(effectiveStartDate.split('T')[0] + 'T00:00:00');
            pengawasanDates.forEach(pd => {
                // Support both DD/MM/YYYY (from DB) and ISO YYYY-MM-DD formats
                let pD: Date;
                const ddmmyyyy = pd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (ddmmyyyy) {
                    pD = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00`);
                } else {
                    pD = new Date(pd.split('T')[0] + 'T00:00:00');
                }
                if (isNaN(pD.getTime())) return;
                const diffTime = pD.getTime() - startD.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
                if (diffDays > 0) {
                    supervisionDays[diffDays] = true;
                    if (diffDays > maxSupervisionDay) maxSupervisionDay = diffDays;
                }
            });
        }
        const baseDuration = (spkInfo ? spkInfo.duration : projectData.duration) || 0;
        let totalDaysToRender = Math.max(baseDuration, maxTaskEndDay, maxSupervisionDay) || 0;
        if (totalDaysToRender > 2000) totalDaysToRender = 2000; // SAFETY CAP to prevent browser crash
        if (totalDaysToRender < 0) totalDaysToRender = 0;
        const totalChartWidth = totalDaysToRender * DAY_WIDTH;
        const svgHeight = processedTasks.length * ROW_HEIGHT;

        let taskCoordinates: Record<number, any> = {};
        processedTasks.forEach((task, idx) => {
            const shift = task.computed.shift || 0;
            const ranges = task.ranges || [];
            if (ranges.length > 0 && ranges[0].start) {
                const maxEnd = Math.max(...ranges.map((r: any) => parseInt(r.end || 0) + shift + (parseInt(r.keterlambatan) || 0)));
                const minStart = Math.min(...ranges.map((r: any) => parseInt(r.start || 0) + shift));

                let firstPeriodEnd = maxEnd;
                let lowestStart = Infinity;
                ranges.forEach((r: any) => {
                    const s = parseInt(r.start || 0) + shift;
                    if (s < lowestStart) {
                        lowestStart = s;
                        firstPeriodEnd = parseInt(r.end || 0) + shift + (parseInt(r.keterlambatan) || 0);
                    }
                });

                taskCoordinates[task.id] = {
                    centerY: (idx * ROW_HEIGHT) + (ROW_HEIGHT / 2),
                    endX: maxEnd * DAY_WIDTH,
                    startX: (minStart - 1) * DAY_WIDTH,
                    firstEndX: firstPeriodEnd * DAY_WIDTH
                };
            }
        });
        let svgLines = [];
        for (let i = 0; i < processedTasks.length; i++) {
            const task = processedTasks[i];
            if (task.dependencies && task.dependencies.length > 0) {
                for (let cId of task.dependencies) {
                    const parentCoordinates = taskCoordinates[task.id];
                    const childCoordinates = taskCoordinates[cId];
                    if (parentCoordinates && childCoordinates && parentCoordinates.firstEndX !== undefined && childCoordinates.startX !== undefined) {
                        const startX = parentCoordinates.firstEndX, startY = parentCoordinates.centerY;
                        const endX = childCoordinates.startX, endY = childCoordinates.centerY;
                        let tension = (endX - startX) < 40 ? 60 : 40;
                        if ((endX - startX) < 0) tension = 100;
                        const path = `M ${startX} ${startY} C ${startX + tension} ${startY}, ${endX - tension} ${endY}, ${endX} ${endY}`;
                        svgLines.push(
                            <g key={`${task.id}-${cId}`}>
                                <path d={path} className="dependency-line stroke-blue-500 fill-transparent stroke-2" markerEnd="url(#depArrow)" opacity="0.95" />
                                <circle cx={startX} cy={startY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                                <circle cx={endX} cy={endY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                            </g>
                        );
                    }
                }
            }
        }
        let liveDayIndex = -1;
        if (spkInfo) {
            const today = new Date();
            const td = String(today.getDate()).padStart(2, '0');
            const tm = String(today.getMonth() + 1).padStart(2, '0');
            const ty = today.getFullYear();

            for (let i = 0; i < totalDaysToRender; i++) {
                const d = new Date(spkInfo.startDate.split('T')[0] + 'T00:00:00');
                d.setDate(d.getDate() + i);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                if (dd === td && mm === tm && yyyy === ty) {
                    liveDayIndex = i;
                    break;
                }
            }
        }

        return { processedTasks, totalDaysToRender, totalChartWidth, svgHeight, supervisionDays, svgLines, liveDayIndex };
    }, [tasks, projectData, spkInfo, pengawasanDates]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">

            <AppNavbar
                title="Gantt Chart"
                showBackButton={true}
                backHref="/dashboard"
                rightActions={
                    <div className="flex items-center gap-2">
                        {user?.isSuperHuman && <Link href="/serah-terima/migrasi"><Button variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Database className="h-4 w-4" /><span className="hidden md:inline">Migrasi ST</span></Button></Link>}
                        <Badge variant="outline" className="bg-black/20 text-white border-white/30 px-3 py-1 shadow-sm whitespace-nowrap font-bold">
                            {appMode === 'kontraktor' ? 'MODE KONTRAKTOR' : 'MODE PENGAWASAN'}
                            {(() => {
                                const scopeSuffix = supervisionWorkspace
                                    ? supervisionWorkspace.scopes.map(s => String(s.lingkup_pekerjaan || '').toUpperCase()).sort().join(' + ')
                                    : (projectData?.work ? String(projectData.work).toUpperCase() : '');
                                return scopeSuffix ? ` · ${scopeSuffix}` : '';
                            })()}
                        </Badge>
                    </div>
                }
            />

            <main className="p-4 md:p-8 max-w-[1600px] mx-auto mt-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
                    <Card className={`col-span-1 lg:col-span-4 ${projectData && selectedGanttId && appMode === 'pic' ? 'xl:col-span-3' : 'xl:col-span-4'} shadow-sm border-slate-200 bg-white`}>
                        <CardContent className="p-5 flex flex-col justify-center h-full">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Pilih / Input No. Ulok</label>
                                {(urlIdToko || urlUlok) && !isDirectAccess ? (
                                    <div className="p-3 bg-slate-100 border rounded-md font-bold text-slate-600 flex justify-between items-center shadow-inner">
                                        <span>{selectedUlok || projectData?.ulokClean || "Memuat..."}</span><Lock className="w-5 h-5 text-slate-400" />
                                    </div>
                                ) : (
                                    <>
                                        {!((urlIdToko || urlUlok) && !isDirectAccess) && (
                                            <>
                                                {/* Search */}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                                    <Input
                                                        placeholder="Cari Nomor / Toko / Cabang..."
                                                        className="pl-9 h-11 text-sm focus-visible:ring-blue-500 bg-white"
                                                        value={searchUlokInput}
                                                        onChange={(e) => setSearchUlokInput(e.target.value)}
                                                    />
                                                </div>
                                                {/* Filter SPK - Always visible */}
                                                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                                                    <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                                                        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter Status SPK</span>
                                                    </div>
                                                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {(() => {
                                                            // Deduplicate per ULOK untuk hitungan yang benar
                                                            const uniqueUloks = [...new Map(allTokoList.map(t => [t.nomor_ulok, t])).keys()];
                                                            const countAll = uniqueUloks.length;
                                                            
                                                            // SPK Lengkap: ULOK punya 2+ scope DAN semua scope sudah SPK
                                                            const countSpk = uniqueUloks.filter(ulok => {
                                                                const ulokTokos = allTokoList.filter(t => t.nomor_ulok === ulok);
                                                                return ulokTokos.length >= 2 && ulokTokos.every(t => spkTokoIds.has(Number(t.id_toko || t.id)));
                                                            }).length;
                                                            
                                                            // SPK Tunggal: ULOK cuma punya 1 scope DAN sudah SPK
                                                            const countSingle = uniqueUloks.filter(ulok => {
                                                                const ulokTokos = allTokoList.filter(t => t.nomor_ulok === ulok);
                                                                return ulokTokos.length === 1 && ulokTokos.every(t => spkTokoIds.has(Number(t.id_toko || t.id)));
                                                            }).length;
                                                            
                                                            // SPK Partial: ULOK punya 2+ scope DAN ada yang belum SPK
                                                            const countPartial = uniqueUloks.filter(ulok => {
                                                                const ulokTokos = allTokoList.filter(t => t.nomor_ulok === ulok);
                                                                const spkC = ulokTokos.filter(t => spkTokoIds.has(Number(t.id_toko || t.id))).length;
                                                                return ulokTokos.length >= 2 && spkC > 0 && spkC < ulokTokos.length;
                                                            }).length;
                                                            
                                                            const countNoSpk = uniqueUloks.filter(ulok => {
                                                                const ulokTokos = allTokoList.filter(t => t.nomor_ulok === ulok);
                                                                return ulokTokos.every(t => !spkTokoIds.has(Number(t.id_toko || t.id)));
                                                            }).length;
                                                            
                                                            const filters: { key: 'all' | 'spk' | 'partial' | 'no_spk' | 'single'; label: string; count: number; activeClass: string; hoverClass: string; icon: string }[] = [
                                                                { key: 'all', label: 'Semua', count: countAll, activeClass: 'bg-slate-900 text-white shadow-md', hoverClass: 'text-slate-700 hover:bg-slate-50 border-slate-300 border', icon: '📋' },
                                                                { key: 'spk', label: 'SPK Lengkap', count: countSpk, activeClass: 'bg-emerald-600 text-white shadow-md', hoverClass: 'text-emerald-700 hover:bg-emerald-50 border-emerald-300 border', icon: '✓✓' },
                                                                { key: 'single' as any, label: 'SPK Tunggal', count: countSingle, activeClass: 'bg-blue-600 text-white shadow-md', hoverClass: 'text-blue-700 hover:bg-blue-50 border-blue-300 border', icon: '✓' },
                                                                { key: 'partial', label: 'SPK Partial', count: countPartial, activeClass: 'bg-amber-500 text-white shadow-md', hoverClass: 'text-amber-700 hover:bg-amber-50 border-amber-300 border', icon: '½' },
                                                                { key: 'no_spk', label: 'Belum SPK', count: countNoSpk, activeClass: 'bg-slate-500 text-white shadow-md', hoverClass: 'text-slate-700 hover:bg-slate-50 border-slate-300 border', icon: '○' },
                                                            ];
                                                            return filters.map(f => (
                                                                <button
                                                                    key={f.key}
                                                                    type="button"
                                                                    onClick={() => setSpkFilter(f.key as any)}
                                                                    className={`py-3 px-3 text-xs font-bold rounded-lg transition-all text-left flex items-center justify-between gap-2 ${
                                                                        spkFilter === f.key ? f.activeClass : f.hoverClass
                                                                    }`}
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-lg">{f.icon}</span>
                                                                            <span>{f.label}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-normal ${spkFilter === f.key ? 'opacity-90' : 'opacity-60'}`}>
                                                                            {f.count} proyek
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {/* Dropdown Pilih Proyek */}
                                        <Select
                                            value={(() => {
                                                if (appMode === 'pic' && supervisionWorkspace?.nomor_ulok) {
                                                    return `ulok-${encodeURIComponent(supervisionWorkspace.nomor_ulok)}`;
                                                }
                                                const targetTokoId = projectData?.id_toko ? projectData.id_toko : (urlIdToko ? parseInt(urlIdToko) : null);
                                                if (!targetTokoId) return '';

                                                const ganttMatch = availableProjects.find((p: any) => {
                                                    if (p.id_toko && targetTokoId) return p.id_toko === targetTokoId;
                                                    if (p.id === selectedGanttId) return true;
                                                    return false;
                                                });
                                                return ganttMatch ? `gantt-${ganttMatch.id}` : `toko-${targetTokoId}`;
                                            })()}
                                            onValueChange={(val) => {
                                                if (!val) return;

                                                if (val.startsWith('ulok-')) {
                                                    const nomorUlok = decodeURIComponent(val.slice(5));
                                                    const newUrl = new URL(window.location.href);
                                                    newUrl.searchParams.set('ulok', nomorUlok);
                                                    newUrl.searchParams.delete('id_toko');
                                                    window.history.pushState({}, '', newUrl.toString());
                                                    loadSupervisionWorkspace(nomorUlok);
                                                } else if (val.startsWith('gantt-')) {
                                                    const gId = parseInt(val.replace('gantt-', ''));
                                                    const proj = availableProjects.find(p => p.id === gId);
                                                    if (proj?.id_toko) {
                                                        const newUrl = new URL(window.location.href);
                                                        newUrl.searchParams.set('id_toko', proj.id_toko.toString());
                                                        window.history.pushState({}, '', newUrl.toString());
                                                        loadDataByToko(proj.id_toko);
                                                    } else {
                                                        loadGanttDetail(gId);
                                                    }
                                                } else if (val.startsWith('toko-')) {
                                                    const tId = parseInt(val.replace('toko-', ''));
                                                    const newUrl = new URL(window.location.href);
                                                    newUrl.searchParams.set('id_toko', tId.toString());
                                                    window.history.pushState({}, '', newUrl.toString());
                                                    loadDataByToko(tId);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 w-full text-base focus:ring-blue-500 font-medium text-slate-700 bg-white">
                                                <SelectValue placeholder="-- Pilih Proyek / RAB Anda --" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" className="w-(--radix-select-trigger-width) max-h-75">
                                                {(() => {
                                                    const uniqueMap = new Map();
                                                    filteredTokoList.forEach((toko) => {
                                                        const tID = toko.id_toko || toko.id;
                                                        if (appMode === 'pic') {
                                                            const val = `ulok-${encodeURIComponent(toko.nomor_ulok)}`;
                                                            const existing = uniqueMap.get(val);
                                                            const scopes = new Set<string>(existing?.scopes || []);
                                                            if (toko.lingkup_pekerjaan) scopes.add(String(toko.lingkup_pekerjaan).toUpperCase());
                                                            uniqueMap.set(val, {
                                                                toko: existing?.toko || toko,
                                                                val,
                                                                scopes: Array.from(scopes),
                                                            });
                                                            return;
                                                        }
                                                        const ganttMatch = availableProjects.find((p: any) => {
                                                            if (p.id_toko && tID) return p.id_toko === tID;
                                                            const matchUlok = p.nomor_ulok === toko.nomor_ulok;
                                                            const matchLingkup = !p.lingkup_pekerjaan || !toko.lingkup_pekerjaan || (p.lingkup_pekerjaan?.toUpperCase() === toko.lingkup_pekerjaan?.toUpperCase());
                                                            return matchUlok && matchLingkup;
                                                        });
                                                        const val = ganttMatch ? `gantt-${ganttMatch.id}` : `toko-${tID}`;

                                                        if (!uniqueMap.has(val)) {
                                                            uniqueMap.set(val, { toko, ganttMatch, val });
                                                        }
                                                    });

                                                    const dedupedList = Array.from(uniqueMap.values());

                                                    if (dedupedList.length === 0) {
                                                        return (
                                                            <div className="px-2 py-4 text-center text-sm text-slate-500">
                                                                Pencarian tidak ditemukan
                                                            </div>
                                                        );
                                                    }

                                                    return dedupedList.map(({ toko, ganttMatch, val, scopes }) => {
                                                        const ulok = formatUlokWithDash(toko.nomor_ulok);
                                                        const scopeLabel = appMode === 'pic'
                                                            ? (scopes || []).sort((a: string, b: string) => a === 'SIPIL' ? -1 : b === 'SIPIL' ? 1 : a.localeCompare(b)).join(' + ')
                                                            : toko.lingkup_pekerjaan;
                                                        const allTokoForUlok = appMode === 'pic' 
                                                            ? filteredTokoList.filter(t => t.nomor_ulok === toko.nomor_ulok)
                                                            : [toko]; // For non-pic, it's one item per option
                                                        const spkScopes = allTokoForUlok.filter(t => spkTokoIds.has(Number(t.id_toko || t.id)));
                                                        const spkCount = spkScopes.length;
                                                        const totalScopes = allTokoForUlok.length;

                                                        let spkLabel = '○ Belum SPK';
                                                        let spkDotClass = 'bg-slate-300';
                                                        let spkTextClass = 'text-slate-400';
                                                        
                                                        if (spkCount > 0 && spkCount === totalScopes) {
                                                            spkLabel = totalScopes > 1 ? '✓ Semua SPK' : '✓ SPK';
                                                            spkDotClass = 'bg-emerald-500';
                                                            spkTextClass = 'text-emerald-600';
                                                        } else if (spkCount > 0) {
                                                            const spkLingkup = spkScopes.map(t => t.lingkup_pekerjaan).join(', ');
                                                            spkLabel = `⚡ Partial SPK (${spkLingkup})`;
                                                            spkDotClass = 'bg-amber-500';
                                                            spkTextClass = 'text-amber-600';
                                                        }

                                                        const ganttStatusLabel = ganttMatch?.status === 'terkunci' ? ' · Terkunci' : ganttMatch?.status === 'active' ? ' · Aktif' : '';
                                                        const label = [ulok, toko.nama_toko, toko.cabang, scopeLabel]
                                                            .filter(Boolean).join(' · ');

                                                        return (
                                                            <SelectItem key={val} value={val}>
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${spkDotClass}`} />
                                                                    <span>{label || ulok}{ganttStatusLabel}</span>
                                                                    <span className={`text-[10px] font-bold ${spkTextClass}`}>{spkLabel}</span>
                                                                </span>
                                                            </SelectItem>
                                                        );
                                                    });
                                                })()}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {projectData && (
                        <Card className={`col-span-1 ${appMode === 'pic' && selectedGanttId ? 'lg:col-span-8 xl:col-span-5' : 'lg:col-span-8 xl:col-span-8'} border border-slate-200 bg-white text-slate-900 shadow-sm transition-all`}>
                            <CardContent className="p-5 flex flex-col justify-center h-full">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                                    <div>
                                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Toko</p>
                                        <p className="text-sm md:text-base font-extrabold leading-tight text-slate-900">{projectData.store}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Lingkup</p>
                                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${String(projectData.work).toUpperCase() === 'ME'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {projectData.work}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status SPK</p>
                                        {(() => {
                                            const allTokoForUlok = allTokoList.filter(t => t.nomor_ulok === projectData.ulokClean);
                                            const spkScopes = allTokoForUlok.filter(t => spkTokoIds.has(Number(t.id_toko || t.id)));
                                            const spkCount = spkScopes.length;
                                            const totalScopes = allTokoForUlok.length;

                                            let spkLabel = 'BELUM SPK';
                                            let badgeClass = 'border-slate-200 bg-slate-50 text-slate-600';
                                            let dotClass = 'bg-slate-400';

                                            if (spkCount > 0 && spkCount === totalScopes) {
                                                spkLabel = totalScopes > 1 ? 'SEMUA SPK' : 'SUDAH SPK';
                                                badgeClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
                                                dotClass = 'bg-emerald-500';
                                            } else if (spkCount > 0) {
                                                const spkLingkup = spkScopes.map(t => t.lingkup_pekerjaan).join(', ');
                                                spkLabel = `PARTIAL SPK (${spkLingkup})`;
                                                badgeClass = 'border-amber-200 bg-amber-50 text-amber-700';
                                                dotClass = 'bg-amber-500';
                                            }

                                            return (
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${badgeClass}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                                                    {spkLabel}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {spkInfo && (
                                        <>
                                            <div>
                                                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Durasi (SPK)</p>
                                                <p className="text-sm md:text-base font-bold text-slate-800">{spkInfo.duration} Hari</p>
                                            </div>
                                            <div>
                                                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tgl Mulai SPK</p>
                                                <p className="text-sm md:text-base font-bold text-emerald-600">{new Date(spkInfo.startDate.split('T')[0]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {projectData && selectedGanttId && appMode === 'pic' && (
                        <Card className="col-span-1 lg:col-span-12 xl:col-span-4 border-slate-200 bg-white shadow-sm h-full flex flex-col">
                            <CardContent className="p-4 flex flex-col h-full">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Catatan Pengawasan</h3>
                                                <p className="text-xs text-slate-500">Komunikasi antar role selama mode pengawasan.</p>
                                            </div>
                                            <Badge className="border border-blue-200 bg-blue-50 text-blue-700">{ganttNotes.length} Catatan</Badge>
                                        </div>

                                        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 min-h-[140px] max-h-64 xl:max-h-full">
                                            {isGanttNoteLoading ? (
                                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...
                                                </div>
                                            ) : ganttNotes.length === 0 ? (
                                                <div className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada catatan.</div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {ganttNotes.map(note => (
                                                        <div key={note.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-xs font-bold text-slate-800">{note.author_name}</p>
                                                                    <p className="truncate text-[10px] text-slate-500">{note.author_role}</p>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(note.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                                                </span>
                                                            </div>
                                                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{note.note}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {canWriteGanttCommunication && (
                                            <div className="mt-3 flex items-end gap-2 shrink-0">
                                                <textarea
                                                    value={ganttNoteInput}
                                                    onChange={(e) => setGanttNoteInput(e.target.value)}
                                                    rows={1}
                                                    className="min-h-10 max-h-24 flex-1 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    placeholder="Tulis catatan..."
                                                />
                                                <Button
                                                    type="button"
                                                    className="h-10 bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 shrink-0"
                                                    disabled={isGanttNoteSending || !ganttNoteInput.trim()}
                                                    onClick={handleSendGanttNote}
                                                >
                                                    {isGanttNoteSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {appMode === 'pic' && (isWorkspaceLoading || supervisionWorkspace) && (
                    <section className="mb-8 space-y-5">
                        {isWorkspaceLoading ? (
                            <Card className="border-slate-200 bg-white shadow-sm">
                                <CardContent className="flex min-h-52 items-center justify-center">
                                    <Loader2 className="mr-3 h-7 w-7 animate-spin text-red-600" />
                                    <span className="font-semibold text-slate-600">Menyiapkan workspace SIPIL &amp; ME...</span>
                                </CardContent>
                            </Card>
                        ) : supervisionWorkspace ? (
                            <>
                                <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                                    <div className="relative p-6 md:p-7 text-slate-900">
                                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    <Badge className="border border-red-200 bg-red-50 text-red-700 font-bold">WORKSPACE PENGAWASAN</Badge>
                                                    <Badge className="border border-red-200 bg-red-600 text-white font-bold">
                                                        {supervisionWorkspace.scopes.filter(scope => scope.gantt_id).length} Lingkup Aktif
                                                    </Badge>
                                                    {(() => {
                                                        const spkScopes = supervisionWorkspace.scopes.filter(scope => spkTokoIds.has(Number(scope.id_toko)));
                                                        const spkCount = spkScopes.length;
                                                        const totalScopes = supervisionWorkspace.scopes.length;

                                                        let spkLabel = '○ BELUM SPK';
                                                        let badgeClass = 'border-amber-200 bg-amber-50 text-amber-700';

                                                        if (spkCount > 0 && spkCount === totalScopes) {
                                                            spkLabel = totalScopes > 1 ? '✓ SEMUA SPK' : '✓ SUDAH SPK';
                                                            badgeClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
                                                        } else if (spkCount > 0) {
                                                            const spkLingkup = spkScopes.map(s => s.lingkup_pekerjaan).join(', ');
                                                            spkLabel = `⚡ PARTIAL SPK (${spkLingkup})`;
                                                            badgeClass = 'border-amber-200 bg-amber-50 text-amber-700';
                                                        }

                                                        return (
                                                            <Badge className={`border font-bold shadow-xs ${badgeClass}`}>
                                                                {spkLabel}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </div>
                                                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                                                    {formatUlokWithDash(supervisionWorkspace.nomor_ulok)}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {supervisionWorkspace.nama_toko || '-'} · {supervisionWorkspace.cabang || '-'}
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                                        PIC: {supervisionWorkspace.pic_bersama || 'Belum ditentukan'}
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                                        SIPIL di atas · ME di bawah
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-auto lg:min-w-96">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Serah Terima</p>
                                                        <p className="mt-1 text-sm font-semibold">
                                                            {supervisionWorkspace.unified_serah_terima_generated
                                                                ? 'PDF sudah tersedia'
                                                                : supervisionWorkspace.unified_serah_terima_ready
                                                                    ? 'Siap diproses'
                                                                    : 'Menunggu pekerjaan selesai masuk Opname'}
                                                        </p>
                                                    </div>
                                                    {supervisionWorkspace.unified_serah_terima_generated
                                                        ? <CheckCircle className="h-7 w-7 text-emerald-400" />
                                                        : <ClipboardCheck className="h-7 w-7 text-red-300" />}
                                                </div>
                                                {supervisionWorkspace.unified_serah_terima_generated ? (
                                                    <div className="flex flex-col gap-2">
                                                        {(() => {
                                                            const masterScope = supervisionWorkspace.scopes.find(
                                                                (s) => Number(s.id_toko) === supervisionWorkspace.master_scope_id_toko
                                                            ) ?? supervisionWorkspace.scopes.find((s) => s.link_pdf_serah_terima);
                                                            const pdfLink = masterScope?.link_pdf_serah_terima ?? null;
                                                            return (
                                                                <a
                                                                    href={pdfLink ?? '#'}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-500 transition-colors ${!pdfLink ? 'pointer-events-none opacity-50' : ''}`}
                                                                >
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Buka PDF Serah Terima
                                                                </a>
                                                            );
                                                        })()}
                                                        <Button
                                                            type="button"
                                                            onClick={handleGenerateUnifiedHandover}
                                                            disabled={!supervisionWorkspace.unified_serah_terima_ready || isGeneratingHandover}
                                                            className="h-9 w-full bg-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-300 disabled:opacity-50"
                                                        >
                                                            {isGeneratingHandover
                                                                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                                : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                                                            Generate Ulang
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={handleGenerateUnifiedHandover}
                                                        disabled={!supervisionWorkspace.unified_serah_terima_ready || isGeneratingHandover}
                                                        className="h-11 w-full bg-red-600 font-bold text-white hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400"
                                                    >
                                                        {isGeneratingHandover
                                                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            : <FileText className="mr-2 h-4 w-4" />}
                                                        Generate Serah Terima
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <span className="relative mt-1 flex h-3 w-3 shrink-0">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                                        </span>
                                        <div>
                                            <p className="font-extrabold">Petunjuk Opname</p>
                                            <p className="mt-0.5 text-xs leading-relaxed text-red-700">
                                                Titik merah berkedip hanya muncul ketika ada pekerjaan selesai yang belum masuk Opname.
                                                Checkpoint sesudahnya tidak akan memunculkan form kosong.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {supervisionWorkspace.has_date_mismatch && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <div>
                                                <p className="font-extrabold">Tanggal ME belum sama dengan SIPIL</p>
                                                <p className="mt-0.5 text-xs leading-relaxed">
                                                    Header memakai tanggal {supervisionWorkspace.master_scope || 'master'} sebagai acuan.
                                                    Jalankan backup CSV dan sinkronisasi DB sebelum cleanup data lama.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                                    <h3 className="font-bold text-slate-800 hidden sm:block"></h3>
                                    <Button variant="outline" size="sm" onClick={toggleFullscreen} className="flex gap-2 w-full sm:w-auto font-bold border-slate-300 shadow-sm hover:bg-slate-100 bg-white">
                                        {isFullscreen ? <><Minimize className="w-4 h-4" /> Keluar Mode Landscape</> : <><Maximize className="w-4 h-4" /> Mode Landscape</>}
                                    </Button>
                                </div>
                                <div className="overflow-x-auto border border-slate-300 bg-white shadow-sm">
                                    <UnifiedSupervisionGantt
                                        workspace={supervisionWorkspace}
                                        onCheckpointClick={(checkpoint, dayIndex) => openUnifiedCheckpoint(checkpoint as any, dayIndex)}
                                    />
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
                                        {supervisionWorkspace.scopes.map((scope, index) => {
                                            const readyCount = scope.checkpoints.reduce((sum, checkpoint) => sum + Number(checkpoint.ready_opname_items || 0), 0);
                                            const opnameCount = scope.checkpoints.reduce((sum, checkpoint) => sum + Number(checkpoint.opname_items || 0), 0);
                                            const scopeName = String(scope.lingkup_pekerjaan || `LINGKUP ${index + 1}`).toUpperCase();
                                            return (
                                                <span key={scope.id_toko} className="inline-flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${scopeName === 'SIPIL' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                    {scopeName}: {readyCount} siap opname, {opnameCount} sudah opname
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {false && unifiedTimeline && (
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                                        <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-200">Timeline ULOK Terpadu</p>
                                                    <h3 className="mt-1 text-lg font-black">SIPIL + ME dalam satu kalender kerja</h3>
                                                </div>
                                                <Badge className="border border-white/20 bg-white/10 text-white">
                                                    {unifiedTimeline!.duration} hari kalender
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
                                            <div className="w-1/3 min-w-50 border-r border-slate-300 px-4 py-3">
                                                Lingkup / Tahapan
                                            </div>
                                            <div
                                                className="flex-1 overflow-x-auto"
                                                data-gantt-sync={unifiedTimeline!.syncGroup}
                                                onScroll={(e) => {
                                                    document.querySelectorAll<HTMLElement>(`[data-gantt-sync="${unifiedTimeline!.syncGroup}"]`).forEach((el) => {
                                                        if (el !== e.currentTarget && el.scrollLeft !== e.currentTarget.scrollLeft) {
                                                            el.scrollLeft = e.currentTarget.scrollLeft;
                                                        }
                                                    });
                                                }}
                                            >
                                                <div className="flex" style={{ minWidth: unifiedTimeline!.duration * DAY_WIDTH }}>
                                                    {Array.from({ length: unifiedTimeline!.duration }).map((_, dayIndex) => {
                                                        const current = parseCalendarDate(unifiedTimeline!.startDate) || new Date();
                                                        current.setDate(current.getDate() + dayIndex);
                                                        const dd = String(current.getDate()).padStart(2, '0');
                                                        const mm = String(current.getMonth() + 1).padStart(2, '0');
                                                        const yyyy = current.getFullYear();
                                                        const fullDate = `${dd}/${mm}/${yyyy}`;
                                                        const checkpoint = (supervisionWorkspace!.unified_checkpoints || []).find((item) => item.tanggal_pengawasan === fullDate);
                                                        const readyCount = Number(checkpoint?.ready_opname_items || 0);
                                                        const opnameCount = Number(checkpoint?.opname_items || 0);
                                                        const isReady = readyCount > 0;
                                                        const isOpname = !isReady && opnameCount > 0;
                                                        const hasAnyScopeCheckpoint = Boolean(checkpoint?.scopes?.some((entry) => Boolean(entry.checkpoint)));
                                                        return (
                                                            <button
                                                                key={fullDate}
                                                                type="button"
                                                                disabled={!hasAnyScopeCheckpoint}
                                                                onClick={() => checkpoint && openUnifiedCheckpoint(checkpoint as any, dayIndex)}
                                                                className={`flex h-13 shrink-0 flex-col items-center justify-center border-r border-slate-300 font-bold ${isReady
                                                                        ? 'bg-red-50 text-red-700 ring-2 ring-inset ring-red-400 hover:bg-red-100'
                                                                        : isOpname
                                                                            ? 'bg-emerald-50 text-emerald-700'
                                                                            : hasAnyScopeCheckpoint
                                                                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                                                : 'bg-white text-slate-400'
                                                                    }`}
                                                                style={{ width: DAY_WIDTH, fontSize: '9px' }}
                                                                title={`${fullDate} - ${readyCount} siap opname, ${opnameCount} sudah opname`}
                                                            >
                                                                <span>{dd}/{mm}</span>
                                                                {isReady ? (
                                                                    <AlertCircle className="mt-0.5 h-3 w-3 text-red-600" />
                                                                ) : isOpname ? (
                                                                    <CheckCircle className="mt-0.5 h-3 w-3 text-emerald-600" />
                                                                ) : hasAnyScopeCheckpoint ? (
                                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="hidden">
                                    {supervisionWorkspace.scopes.map((scope, index) => {
                                        const readyCount = scope.checkpoints.reduce((sum, checkpoint) => sum + Number(checkpoint.ready_opname_items || 0), 0);
                                        const opnameCount = scope.checkpoints.reduce((sum, checkpoint) => sum + Number(checkpoint.opname_items || 0), 0);
                                        const scopeName = String(scope.lingkup_pekerjaan || `LINGKUP ${index + 1}`).toUpperCase();
                                        return (
                                            <div key={scope.id_toko} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                                                <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${scopeName === 'SIPIL' ? 'bg-red-700 text-white' : 'bg-slate-800 text-white'
                                                    }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white`}>
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black">{scopeName}</h3>
                                                            <p className="text-xs text-white/65">
                                                                Gantt #{scope.gantt_id || '-'} · {scope.gantt_status || 'Belum tersedia'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {readyCount > 0 && (
                                                            <Badge className="border border-red-300/40 bg-red-500 text-white">
                                                                <Sparkles className="mr-1 h-3 w-3" /> {readyCount} siap Opname
                                                            </Badge>
                                                        )}
                                                        {opnameCount > 0 && (
                                                            <Badge className="border border-emerald-300/30 bg-emerald-500/20 text-emerald-100">
                                                                {opnameCount} sudah Opname
                                                            </Badge>
                                                        )}
                                                        <Badge className="border border-white/20 bg-white/10 text-white">
                                                            {scope.status_opname_final || 'Opname belum dibuat'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {scope.gantt_id ? (
                                                    <div className="p-4">
                                                        <GanttViewer
                                                            nomorUlok={scope.nomor_ulok}
                                                            idToko={scope.id_toko}
                                                            spkStartDate={scope.spk_start_date || undefined}
                                                            spkDuration={scope.spk_effective_duration || scope.spk_duration || undefined}
                                                            spkEffectiveDuration={scope.spk_effective_duration || undefined}
                                                            spkOriginalDuration={scope.spk_duration || undefined}
                                                            title={`Timeline ${scopeName}`}
                                                            checkpoints={scope.checkpoints}
                                                            onCheckpointClick={(checkpoint, dayIndex) => openScopeCheckpoint(scope, checkpoint, dayIndex)}
                                                            hideChartTitle
                                                            hideDateHeader
                                                            timelineStartDate={unifiedTimeline?.startDate}
                                                            timelineDuration={unifiedTimeline?.duration}
                                                            syncScrollGroup={unifiedTimeline?.syncGroup}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="m-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center">
                                                        <AlertCircle className="mx-auto mb-2 h-7 w-7 text-amber-500" />
                                                        <p className="font-bold text-amber-800">Gantt {scopeName} belum tersedia</p>
                                                        <p className="mt-1 text-xs text-amber-700">Lingkup lain tetap dapat digunakan.</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : null}
                    </section>
                )}

                {!isLoading && selectedUlok && appMode === 'kontraktor' && !isProjectLocked && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                        {!isScopeSpkApproved && projectData && (
                            <div className="bg-amber-50 border-b border-amber-200 p-4">
                                <div className="flex items-start gap-3 text-amber-800">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                    <div>
                                        <p className="font-bold">SPK Belum Disetujui</p>
                                        <p className="text-sm mt-1">Anda dapat membuat dan menyimpan jadwal, namun belum dapat mengisi form pengawasan fisik atau memproses Serah Terima karena SPK belum disetujui (Approved).</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-slate-800 text-lg">Input Jadwal & Keterikatan (Dependencies)</h2>
                                <p className="text-sm text-slate-500">Item pekerjaan ditarik otomatis dari form RAB yang telah disubmit.</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{tasks.length} Item Pekerjaan</Badge>
                        </div>

                        {tasks.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse" style={{ minWidth: '900px' }}>
                                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                                        <tr>
                                            <th className="p-4 w-12 text-center border-r">No</th>
                                            <th className="p-4 w-[30%] border-r">Tahapan Pekerjaan</th>
                                            <th className="p-4 w-[25%] border-r">Keterikatan (Dilanjutkan ke..)</th>
                                            <th className="p-4">Durasi (Hari Ke-)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map(task => (
                                            <tr key={task.id} className="border-b hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-center font-bold text-slate-500 border-r">{task.id}</td>
                                                <td className="p-4 font-semibold text-slate-800 border-r">{task.name}</td>

                                                <td className="p-4 border-r">
                                                    <select
                                                        disabled={isReadOnly}
                                                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                                        value={task.dependencies[0] || ''}
                                                        onChange={(e) => handleDependencyChange(task.id, e.target.value)}
                                                    >
                                                        <option value="">- Tidak Ada -</option>
                                                        {tasks.filter(t => t.id > task.id).map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.id}. {opt.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4 space-y-2">
                                                    {task.ranges.map((r: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2 mb-2">
                                                            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                                <span className="bg-slate-100 text-slate-500 px-2 py-1.5 text-xs font-bold border-r">H</span>
                                                                <input
                                                                    readOnly={isReadOnly}
                                                                    type="number" className="w-16 p-1.5 text-center outline-none focus:bg-blue-50 text-sm font-semibold text-slate-800"
                                                                    value={r.start} onChange={(e) => handleRangeChange(task.id, idx, 'start', e.target.value)}
                                                                    placeholder="Start" min="1" max={projectData?.duration || 99}
                                                                />
                                                            </div>
                                                            <span className="text-slate-400 text-xs">➜</span>
                                                            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                                <span className="bg-slate-100 text-slate-500 px-2 py-1.5 text-xs font-bold border-r">H</span>
                                                                <input
                                                                    readOnly={isReadOnly}
                                                                    type="number" className="w-16 p-1.5 text-center outline-none focus:bg-blue-50 text-sm font-semibold text-slate-800"
                                                                    value={r.end} onChange={(e) => handleRangeChange(task.id, idx, 'end', e.target.value)}
                                                                    placeholder="End" min="1" max={projectData?.duration || 99}
                                                                />
                                                            </div>

                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeRange(task.id, idx)}
                                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded border border-transparent hover:border-red-200 transition-colors"
                                                                    title="Hapus Periode"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {!isReadOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addRange(task.id)}
                                                            className="text-xs text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition-colors mt-1 flex items-center"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> Tambah Periode Terputus
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                <p className="font-semibold mb-1">Data Pekerjaan Kosong</p>
                            </div>
                        )}
                    </div>
                )}
                {!(appMode === 'pic' && supervisionWorkspace) && (
                    <Card className="overflow-hidden shadow-md mb-8 border-slate-200">
                        <div className="p-4 bg-slate-100 border-b flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium">
                            <div className="flex justify-center gap-6">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded shadow-inner"></div> Progress</div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-linear-to-r from-pink-500 to-orange-500 rounded shadow-inner"></div> Terlambat</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="flex gap-2 w-full sm:w-auto font-bold border-slate-300 shadow-sm hover:bg-slate-200">
                                {isFullscreen ? <><Minimize className="w-4 h-4" /> Keluar Mode Landscape</> : <><Maximize className="w-4 h-4" /> Mode Landscape</>}
                            </Button>
                        </div>

                        <div className="p-0 overflow-x-auto min-h-100 relative bg-white pb-10" id="ganttChartContainer">
                            {isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                                    <p className="font-semibold text-slate-700">Mempersiapkan Jadwal Proyek...</p>
                                </div>
                            ) : chartData ? (
                                <div style={{ width: 'max-content', minWidth: '100%' }}>
                                    <div className="flex sticky top-0 bg-white z-20 border-b-2 border-slate-300 shadow-sm" style={{ width: labelColWidth + chartData.totalChartWidth }}>
                                        <div className="shrink-0 font-bold text-slate-600 p-2.5 bg-white border-r-[3px] border-slate-400 sticky left-0 z-30 shadow-[2px_0_10px_rgba(0,0,0,0.1)]" style={{ width: labelColWidth, minWidth: labelColWidth, maxWidth: labelColWidth }}>Tahapan</div>
                                        <div className="flex" style={{ width: chartData.totalChartWidth }}>
                                            {Array.from({ length: chartData.totalDaysToRender }).map((_, i) => {
                                                let label: string = String(i + 1);
                                                let isPengawasan = false;
                                                let isLiveDay = false;
                                                let fullDateString = '';

                                                const effectiveStartDate = (spkInfo && spkInfo.startDate) ? spkInfo.startDate : (projectData && projectData.startDate ? projectData.startDate : null);
                                                if (effectiveStartDate) {
                                                    const d = new Date(effectiveStartDate.split('T')[0] + 'T00:00:00');
                                                    d.setDate(d.getDate() + i);
                                                    const dd = String(d.getDate()).padStart(2, '0');
                                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                    const yyyy = d.getFullYear();

                                                    if (spkInfo) {
                                                        label = `${dd}/${mm}`;
                                                    }

                                                    fullDateString = `${dd}/${mm}/${yyyy}`;

                                                    const today = new Date();
                                                    const td = String(today.getDate()).padStart(2, '0');
                                                    const tm = String(today.getMonth() + 1).padStart(2, '0');
                                                    const ty = today.getFullYear();

                                                    if (dd === td && mm === tm && yyyy === ty) {
                                                        isLiveDay = true;
                                                    }
                                                    if (pengawasanDates.includes(fullDateString)) {
                                                        isPengawasan = true;
                                                    }
                                                }
                                                const isClickable = appMode === 'pic' && isPengawasan && !isReadOnly && isScopeSpkApproved;
                                                
                                                return (
                                                    <div key={i} className={`shrink-0 flex flex-col items-center border-r-2 border-slate-300 py-1 font-bold ${isLiveDay ? 'bg-green-50 text-green-700' : isPengawasan ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'} ${isClickable ? 'cursor-pointer hover:bg-blue-100 ring-inset hover:ring-2 hover:ring-blue-500 transition-all' : ''}`} style={{ width: DAY_WIDTH, fontSize: spkInfo ? '9px' : '12px' }}
                                                        onClick={() => {
                                                            if (isClickable) {
                                                                setActiveHeaderClick({ dayIndex: i, dateString: fullDateString, label });
                                                                setShowMemoModal(true);
                                                            }
                                                        }}>
                                                        <span>{label}</span>
                                                        {isPengawasan && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" title="Hari Pengawasan" />}
                                                        {isLiveDay && !isPengawasan && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" title="Hari Ini" />}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="relative" style={{ width: labelColWidth + chartData.totalChartWidth }}>
                                        {/* Garis Live Day - kolom hijau samar full height */}
                                        {chartData.liveDayIndex !== -1 && (
                                            <div
                                                className="absolute top-0 bottom-0 pointer-events-none"
                                                style={{ left: labelColWidth + (chartData.liveDayIndex * DAY_WIDTH), width: DAY_WIDTH, zIndex: 5, backgroundColor: 'rgba(34, 197, 94, 0.08)' }}
                                            />
                                        )}
                                        {chartData.liveDayIndex !== -1 && (
                                            <div
                                                className="absolute top-0 bottom-0 pointer-events-none"
                                                style={{ left: labelColWidth + (chartData.liveDayIndex * DAY_WIDTH) + (DAY_WIDTH / 2), width: 2, zIndex: 16, backgroundColor: 'rgba(34, 197, 94, 0.7)' }}
                                            />
                                        )}

                                        {/* Garis pemisah tegas antara Tahapan Pekerjaan dan Hari */}
                                        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: labelColWidth, borderRight: '3px solid #94a3b8', zIndex: 18, boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }} />

                                        {/* Garis vertikal pembatas kolom - full height */}
                                        {Array.from({ length: chartData.totalDaysToRender }).map((_, ci) => (
                                            <div key={`vl-${ci}`} className="absolute top-0 bottom-0 pointer-events-none z-0" style={{ left: labelColWidth + ((ci + 1) * DAY_WIDTH), borderRight: '1px solid #e2e8f0' }} />
                                        ))}

                                        {chartData.processedTasks.map((task: any, idx: number) => {
                                            const shift = task.computed.shift || 0;
                                            const isIlTask = String(task.name || '').startsWith('[IL]');
                                            return (
                                                <div key={task.id} className="flex hover:bg-slate-50/50" style={{ height: ROW_HEIGHT, borderBottom: '1px solid #cbd5e1', width: labelColWidth + chartData.totalChartWidth }}>
                                                    <div className={`shrink-0 px-2.5 py-1 border-r-[3px] sticky left-0 z-30 flex flex-col justify-center shadow-[2px_0_10px_rgba(0,0,0,0.1)] ${isIlTask ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-400'}`} style={{ width: labelColWidth, minWidth: labelColWidth, maxWidth: labelColWidth }}>
                                                        <span className="text-[13px] font-semibold text-slate-800 leading-tight flex items-center gap-1.5 truncate">
                                                            {isIlTask && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">IL</span>}
                                                            <span className="truncate" title={task.name}>{task.name}</span>
                                                        </span>
                                                    </div>
                                                    <div className="relative" style={{ width: chartData.totalChartWidth }}>
                                                        {task.ranges && task.ranges.map((r: any, rIdx: number) => {
                                                            if (!r.start || !r.end) return null;
                                                            const s = parseInt(r.start) + shift;
                                                            const e = parseInt(r.end) + shift;
                                                            const dur = e - s + 1;
                                                            const delay = parseInt(r.keterlambatan) || 0;
                                                            return (
                                                                <React.Fragment key={rIdx}>
                                                                    <div
                                                                        className={`absolute top-3.25 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-sm z-10 ${shift > 0 ? 'bg-linear-to-r from-orange-400 to-orange-500' : 'bg-linear-to-r from-green-500 to-green-600'}`}
                                                                        style={{ left: (s - 1) * DAY_WIDTH, width: dur * DAY_WIDTH - 1 }}
                                                                    >
                                                                        {dur} Hari
                                                                    </div>
                                                                    {delay > 0 && (
                                                                        <div
                                                                            className="absolute top-3.25 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white bg-linear-to-r from-red-500 to-red-600 shadow-sm z-10 opacity-90"
                                                                            style={{ left: e * DAY_WIDTH, width: delay * DAY_WIDTH - 1 }}
                                                                        >
                                                                            +{delay}
                                                                        </div>
                                                                    )}
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        <svg className="absolute top-0 pointer-events-none z-20 overflow-visible" style={{ left: labelColWidth, width: chartData.totalChartWidth, height: chartData.svgHeight }}>
                                            <defs>
                                                <marker id="depArrow" viewBox="0 0 10 6" refX="7" refY="3" markerWidth="8" markerHeight="6" orient="auto">
                                                    <path d="M0,0 L10,3 L0,6 Z" fill="#3b82f6" />
                                                </marker>
                                            </defs>
                                            {chartData.svgLines}
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                    <p>Silakan pilih proyek / ulok di atas untuk mulai</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {projectData && !isLoading && tasks.length > 0 && appMode === 'kontraktor' && !isProjectLocked && !isReadOnly && (
                    <div className="sticky bottom-4 z-50 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-4 justify-end">
                        <>
                            {/* Tombol Hapus Draft */}
                            {selectedGanttId && (
                                <Button variant="outline" onClick={handleDeleteGantt} disabled={isApplying} className="h-12 border-red-200 text-red-600 hover:bg-red-50 font-semibold px-6 w-full md:w-auto mr-auto">
                                    <Trash2 className="w-5 h-5 mr-2" /> {isApplying ? "Loading..." : "Hapus Draft"}
                                </Button>
                            )}

                            {/* Tombol Simpan & Kunci (Bawaan Lama) */}
                            <Button variant="outline" onClick={() => handleSaveData('Active')} disabled={isApplying} className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 w-full md:w-auto">
                                {isApplying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Simpan Draft"}
                            </Button>
                            <Button onClick={() => handleSaveData('Terkunci')} disabled={isApplying} className="h-12 bg-red-600 hover:bg-red-700 shadow-md font-bold px-8 text-[15px] w-full md:w-auto">
                                <Lock className="w-5 h-5 mr-2" /> {isApplying ? "Menyimpan..." : "Kunci & Publish Jadwal"}
                            </Button>
                        </>
                    </div>
                )}
            </main>

            {/* MODAL 2: Memo Pengawasan Detail */}
            {showMemoModal && (
                <MemoPengawasanModal
                    activeHeaderClick={activeHeaderClick}
                    chartData={chartData}
                    rabItems={rabItems}
                    pengawasanHistory={pengawasanHistory}
                    onClose={() => {
                        setShowMemoModal(false);
                        setUnifiedMemoFlow(null);
                    }}
                    selectedGanttId={selectedGanttId}
                    spkInfo={spkInfo}
                    projectData={projectData}
                    id_toko={projectData?.id_toko}
                    scopeLabel={unifiedMemoFlow?.scopes?.[unifiedMemoFlow.index]?.scope?.lingkup_pekerjaan}
                    nextScopeLabel={unifiedMemoFlow && unifiedMemoFlow.index + 1 < unifiedMemoFlow.scopes.length ? unifiedMemoFlow.scopes[unifiedMemoFlow.index + 1]?.scope?.lingkup_pekerjaan : null}
                    flowStep={unifiedMemoFlow ? { current: unifiedMemoFlow.index + 1, total: unifiedMemoFlow.scopes.length } : null}
                    draft={selectedGanttId && activeHeaderClick ? unifiedMemoDrafts[`${selectedGanttId}|${formatPengawasanDateKey(activeHeaderClick.dateString)}`] : undefined}
                    onDraftChange={(draft: any) => {
                        if (!selectedGanttId || !activeHeaderClick) return;
                        const key = `${selectedGanttId}|${formatPengawasanDateKey(activeHeaderClick.dateString)}`;
                        setUnifiedMemoDrafts((prev) => ({ ...prev, [key]: draft }));
                    }}
                    onNavigateScope={async (targetIndex: number) => {
                        if (!unifiedMemoFlow) return;
                        const next = unifiedMemoFlow.scopes[targetIndex];
                        if (!next) return;
                        setShowMemoModal(false);
                        setUnifiedMemoFlow({ ...unifiedMemoFlow, index: targetIndex });
                        await loadDataByToko(next.scope.id_toko);
                        setActiveHeaderClick({
                            dayIndex: unifiedMemoFlow.dayIndex,
                            dateString: unifiedMemoFlow.dateString,
                            label: unifiedMemoFlow.dateString.slice(0, 5),
                        });
                        setShowMemoModal(true);
                    }}
                    onSuccess={async (options?: { openOpname?: boolean }) => {
                        setShowMemoModal(false);
                        // Selalu reload gantt data untuk refresh pengawasanDates, walaupun lanjut ke Opname
                        if (selectedGanttId) loadGanttDetail(selectedGanttId);
                        if (supervisionWorkspace?.nomor_ulok) {
                            loadSupervisionWorkspace(supervisionWorkspace.nomor_ulok);
                        }

                        if (unifiedMemoFlow && unifiedMemoFlow.index + 1 < unifiedMemoFlow.scopes.length) {
                            const nextIndex = unifiedMemoFlow.index + 1;
                            const next = unifiedMemoFlow.scopes[nextIndex];
                            setUnifiedMemoFlow({ ...unifiedMemoFlow, index: nextIndex });
                            await loadDataByToko(next.scope.id_toko);
                            setActiveHeaderClick({
                                dayIndex: unifiedMemoFlow.dayIndex,
                                dateString: unifiedMemoFlow.dateString,
                                label: unifiedMemoFlow.dateString.slice(0, 5),
                            });
                            setShowMemoModal(true);
                            return;
                        }
                        const completedFlow = unifiedMemoFlow;
                        setUnifiedMemoFlow(null);

                        if (options?.openOpname === false) {
                            return;
                        }
                        if (completedFlow && completedFlow.scopes.length > 1) {
                            const first = completedFlow.scopes[0];
                            setUnifiedOpnameFlow({
                                scopes: completedFlow.scopes,
                                index: 0,
                                dayIndex: completedFlow.dayIndex,
                                dateString: completedFlow.dateString,
                            });
                            await loadDataByToko(first.scope.id_toko);
                            setActiveHeaderClick({
                                dayIndex: completedFlow.dayIndex,
                                dateString: completedFlow.dateString,
                                label: completedFlow.dateString.slice(0, 5),
                            });
                            setShowOpnameModal(true);
                            return;
                        }
                        setShowOpnameModal(true);
                    }}
                />
            )}

            {/* MODAL 3: Opname Hasil Evaluasi */}
            {showOpnameModal && (
                <OpnameModal
                    activeHeaderClick={activeHeaderClick}
                    rabItems={rabItems}
                    id_toko={projectData?.id_toko}
                    onClose={() => {
                        setShowOpnameModal(false);
                        setUnifiedOpnameFlow(null);
                        if (!unifiedOpnameFlow) setShowMemoModal(true);
                    }}
                    selectedGanttId={selectedGanttId}
                    spkInfo={spkInfo}
                    nomorUlok={projectData?.ulokClean}
                    scopeLabel={unifiedOpnameFlow?.scopes?.[unifiedOpnameFlow.index]?.scope?.lingkup_pekerjaan}
                    nextScopeLabel={unifiedOpnameFlow && unifiedOpnameFlow.index + 1 < unifiedOpnameFlow.scopes.length ? unifiedOpnameFlow.scopes[unifiedOpnameFlow.index + 1]?.scope?.lingkup_pekerjaan : null}
                    flowStep={unifiedOpnameFlow ? { current: unifiedOpnameFlow.index + 1, total: unifiedOpnameFlow.scopes.length } : null}
                    onNavigateScope={async (targetIndex: number) => {
                        if (!unifiedOpnameFlow) return;
                        const next = unifiedOpnameFlow.scopes[targetIndex];
                        if (!next) return;
                        setShowOpnameModal(false);
                        setUnifiedOpnameFlow({ ...unifiedOpnameFlow, index: targetIndex });
                        await loadDataByToko(next.scope.id_toko);
                        setActiveHeaderClick({
                            dayIndex: unifiedOpnameFlow.dayIndex,
                            dateString: unifiedOpnameFlow.dateString,
                            label: unifiedOpnameFlow.dateString.slice(0, 5),
                        });
                        setShowOpnameModal(true);
                    }}
                    onSuccess={async () => {
                        setShowOpnameModal(false);
                        if (selectedGanttId) loadGanttDetail(selectedGanttId);
                        if (supervisionWorkspace?.nomor_ulok) {
                            loadSupervisionWorkspace(supervisionWorkspace.nomor_ulok);
                        }
                        if (unifiedOpnameFlow && unifiedOpnameFlow.index + 1 < unifiedOpnameFlow.scopes.length) {
                            const nextIndex = unifiedOpnameFlow.index + 1;
                            const next = unifiedOpnameFlow.scopes[nextIndex];
                            setUnifiedOpnameFlow({ ...unifiedOpnameFlow, index: nextIndex });
                            await loadDataByToko(next.scope.id_toko);
                            setActiveHeaderClick({
                                dayIndex: unifiedOpnameFlow.dayIndex,
                                dateString: unifiedOpnameFlow.dateString,
                                label: unifiedOpnameFlow.dateString.slice(0, 5),
                            });
                            setShowOpnameModal(true);
                            return;
                        }
                        setUnifiedOpnameFlow(null);
                    }}
                />
            )}
        </div>
    );
}

function parseDateAny(dateStr: string) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }
    return new Date(dateStr);
}

function formatDateForInput(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateForPengawasan(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function isReasonableWorkStartDate(date: Date | null): date is Date {
    if (!date || Number.isNaN(date.getTime())) return false;
    const year = date.getFullYear();
    return year >= 2024 && year <= new Date().getFullYear() + 1;
}

// Komponen Modal Diekstraksi untuk memisahkan state/kalkulasi
function MemoPengawasanModal({ activeHeaderClick, chartData, rabItems, pengawasanHistory, onClose, selectedGanttId, spkInfo, projectData, id_toko, onSuccess, scopeLabel, nextScopeLabel, flowStep, onNavigateScope, draft, onDraftChange }: any) {
    const { showAlert } = useGlobalAlert();
    const router = useRouter();
    const { user } = useSession();
    const canCreateInstruksiLapangan = (user?.isSuperHuman ?? false) || (user?.roles ?? []).includes('BRANCH BUILDING SUPPORT');
    const [liveHistory, setLiveHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [memoInputs, setMemoInputs] = useState<Record<string, { status: string, lateDays: number, catatan: string, file: File | null, dokumentasiUrl: string | null, isSaved?: boolean }>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
    const [showInstruksiModal, setShowInstruksiModal] = useState(false);
    const [instruksiToast, setInstruksiToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [nextHandoverDate, setNextHandoverDate] = useState('');
    const [blockedOpnameItemKeys, setBlockedOpnameItemKeys] = useState<Set<string>>(new Set());
    const [currentPengawasanGanttId, setCurrentPengawasanGanttId] = useState<number | null>(null);
    const [currentPengawasanPdfLink, setCurrentPengawasanPdfLink] = useState<string | null>(null);

    const getEffectiveWorkStart = useCallback(() => {
        const spkStart = parseDateAny(spkInfo?.startDate || '');
        if (isReasonableWorkStartDate(spkStart)) {
            return formatDateForInput(spkStart);
        }

        const projectStart = parseDateAny(projectData?.startDate || '');
        if (projectStart && !Number.isNaN(projectStart.getTime())) {
            return formatDateForInput(projectStart);
        }

        return new Date().toISOString().split('T')[0];
    }, [spkInfo?.startDate, projectData?.startDate]);

    const showInstruksiToast = useCallback((message: string, type: 'success' | 'error') => {
        setInstruksiToast({ message, type });
        window.setTimeout(() => setInstruksiToast(null), 4000);
    }, []);

    useEffect(() => {
        if (!hasLoadedInitial) return;
        onDraftChange?.(memoInputs);
    }, [hasLoadedInitial, memoInputs]);

    useEffect(() => {
        if (!selectedGanttId || (!spkInfo && !projectData) || !activeHeaderClick) {
            setIsLoadingHistory(false);
            return;
        }

        setHasLoadedInitial(false);
        setIsLoadingHistory(true);
        const clickedDate = parseDateAny(activeHeaderClick.dateString);
        const fallbackStart = getEffectiveWorkStart();
        const fallbackDate = new Date(fallbackStart.split('T')[0] + 'T00:00:00');
        fallbackDate.setDate(fallbackDate.getDate() + (activeHeaderClick?.dayIndex || 0));
        const dDate = clickedDate && !Number.isNaN(clickedDate.getTime()) ? clickedDate : fallbackDate;
        const formattedDate = formatDateForInput(dDate);
        const currentDateNumeric = parseInt(formattedDate.replace(/-/g, ''), 10);

        const parseDateNumeric = (value: any): number | null => {
            if (!value) return null;
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                const y = value.getFullYear();
                const m = String(value.getMonth() + 1).padStart(2, '0');
                const d = String(value.getDate()).padStart(2, '0');
                return parseInt(`${y}${m}${d}`, 10);
            }

            const raw = String(value).trim();
            const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoMatch) return parseInt(`${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`, 10);

            const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (slashMatch) return parseInt(`${slashMatch[3]}${slashMatch[2]}${slashMatch[1]}`, 10);

            return null;
        };

        const isPreviousPengawasanBeforeCurrent = (sourceDate: any): boolean => {
            const sourceNumeric = parseDateNumeric(sourceDate);
            if (!sourceNumeric) return false;
            return sourceNumeric < currentDateNumeric;
        };

        const getPengawasanDateById = (idPengawasanGantt: any): any => {
            if (!idPengawasanGantt) return null;
            const matched = (pengawasanHistory || []).find((p: any) => Number(p.id) === Number(idPengawasanGantt));
            return matched?.tanggal_pengawasan ?? null;
        };

        import('@/lib/api').then(({ fetchPengawasanList, fetchOpnameList }) => {
            Promise.all([
                fetchPengawasanList({ id_gantt: selectedGanttId, tanggal: formattedDate }),
                fetchPengawasanList({ id_gantt: selectedGanttId }),
                id_toko ? fetchOpnameList({ id_toko }) : Promise.resolve({ data: [] })
            ])
                .then(([resLive, resAll, resOpname]) => {
                    const dataLive = resLive.data || [];
                    if (dataLive.length > 0) {
                        setCurrentPengawasanGanttId(dataLive[0].id_pengawasan_gantt);
                        setCurrentPengawasanPdfLink(
                            dataLive.find((item: any) => item.berkas_pengawasan?.link_pdf_pengawasan)
                                ?.berkas_pengawasan?.link_pdf_pengawasan ?? null
                        );
                    } else {
                        setCurrentPengawasanGanttId(null);
                        setCurrentPengawasanPdfLink(null);
                    }
                    const dataAll = resAll.data || [];
                    const dataOpname = resOpname.data || [];

                    const blockedOpnameIds = new Set<string>();
                    dataOpname.forEach((op: any) => {
                        const status = (op.status || '').toLowerCase();
                        if (['pending', 'disetujui', 'selesai', 'progress'].includes(status)) {
                            blockedOpnameIds.add(getOpnameItemKey(op));
                        }
                    });
                    setBlockedOpnameItemKeys(blockedOpnameIds);

                    setLiveHistory(dataLive);

                    const initial: Record<string, any> = {};
                    const map = new Map<string, string>();
                    const idMap = new Map<string, number>();
                    const getCategoryLateDays = (kategoriPekerjaan: string) => {
                        const matchedTask = chartData?.processedTasks?.find((t: any) => t.name.toUpperCase() === kategoriPekerjaan.toUpperCase());
                        let categoryLateDays = 0;
                        if (matchedTask && matchedTask.ranges) {
                            matchedTask.ranges.forEach((r: any) => {
                                if (r.keterlambatan) {
                                    categoryLateDays += parseInt(r.keterlambatan) || 0;
                                }
                            });
                        }
                        return categoryLateDays;
                    };

                    dataLive.forEach((p: any) => {
                        if (p.kategori_pekerjaan && p.jenis_pekerjaan && p.status) {
                            const key = `${p.kategori_pekerjaan.toUpperCase()}|${p.jenis_pekerjaan.toUpperCase()}`;
                            if (p.id) idMap.set(key, p.id);
                            if (p.status.toLowerCase() !== 'selesai') {
                                initial[key] = {
                                    status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
                                    lateDays: getCategoryLateDays(p.kategori_pekerjaan),
                                    catatan: p.catatan || '',
                                    file: null,
                                    dokumentasiUrl: p.dokumentasi || null,
                                    isSaved: true
                                };
                            }
                        }
                    });

                    dataAll.forEach((p: any) => {
                        if (p.kategori_pekerjaan && p.jenis_pekerjaan && p.status) {
                            const key = `${p.kategori_pekerjaan.toUpperCase()}|${p.jenis_pekerjaan.toUpperCase()}`;
                            const normalizedStatus = p.status.charAt(0).toUpperCase() + p.status.slice(1);

                            // dataAll sudah diurutkan terbaru lebih dulu dari backend.
                            // Jangan biarkan record lama menimpa status terbaru.
                            if (!map.has(key)) {
                                map.set(key, normalizedStatus);
                            }

                            // Jika item Progress/Terlambat dari hari sebelumnya belum punya record hari ini,
                            // tetap masukkan ke form tanggal pengawasan berikutnya agar bisa diupdate.
                            if (
                                !initial[key] &&
                                map.get(key) === normalizedStatus &&
                                p.status.toLowerCase() !== 'selesai' &&
                                isPreviousPengawasanBeforeCurrent(getPengawasanDateById(p.id_pengawasan_gantt))
                            ) {
                                initial[key] = {
                                    status: '',
                                    lateDays: 0,
                                    catatan: '',
                                    file: null,
                                    dokumentasiUrl: null,
                                    isSaved: false,
                                    previousStatus: normalizedStatus,
                                    previousLateDays: getCategoryLateDays(p.kategori_pekerjaan),
                                    previousPengawasanDate: getPengawasanDateById(p.id_pengawasan_gantt)
                                };
                            }
                        }
                    });
                    const mergedInitial = { ...initial, ...(draft || {}) };
                    setMemoInputs(mergedInitial);
                    // Jika sudah ada data hari ini atau item Progress/Terlambat dari hari sebelumnya,
                    // set isDirty agar form bisa disubmit setelah user mengupdate statusnya.
                    if (Object.keys(mergedInitial).length > 0) {
                        setIsDirty(true);
                    }
                    setLatestStatusMapState(map);
                    setLatestIdMapState(idMap);
                })
                .catch(err => console.error("Gagal mendapatkan pengawasan history:", err))
                .finally(() => {
                    setHasLoadedInitial(true);
                    setIsLoadingHistory(false);
                });
        });
    }, [selectedGanttId, spkInfo, projectData, activeHeaderClick, getEffectiveWorkStart]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [latestStatusMapState, setLatestStatusMapState] = useState<Map<string, string>>(new Map());
    const [latestIdMapState, setLatestIdMapState] = useState<Map<string, number>>(new Map());

    const hasCurrentDateSelesaiItems = liveHistory.some((p: any) => String(p.status || '').toLowerCase() === 'selesai');
    const hasLateItems = Object.values(memoInputs).some((val: any) => val.status === 'Terlambat');
    const memoConfig = useMemo(() => {
        if (!chartData || !activeHeaderClick) return [];
        const effectiveStart = getEffectiveWorkStart();
        const startD = new Date(effectiveStart.split('T')[0] + 'T00:00:00');
        const checkpointDate = parseDateAny(activeHeaderClick.dateString);
        let day = activeHeaderClick.dayIndex;
        if (checkpointDate && !isNaN(checkpointDate.getTime())) {
            const diffTime = checkpointDate.getTime() - startD.getTime();
            day = Math.round(diffTime / (1000 * 3600 * 24));
        }

        const pastPengawasanDays = (pengawasanHistory || [])
            .map((p: any) => p.tanggal_pengawasan)
            .map((dateString: string) => {
                const parsed = parseDateAny(dateString);
                if (!parsed || isNaN(parsed.getTime())) return null;
                const diffTime = parsed.getTime() - startD.getTime();
                return Math.round(diffTime / (1000 * 3600 * 24));
            })
            .filter((d: number | null) => d !== null && d < day);

        // Peta semua tugas dan cek apakah items-nya valid (belum selesai/harus tampil)
        return chartData.processedTasks.map((task: any) => {
            const shift = task.computed.shift || 0;
            let isScheduledToday = false;
            let isSkippedCompletely = false;
            let isLastDay = false;
            let hideOnProgress = true; // default hidden
            let rawRangeMatch: any = null;

            task.ranges?.forEach((r: any) => {
                if (!r.start || !r.end) return;
                const s = parseInt(r.start) + shift - 1;
                const e = parseInt(r.end) + shift - 1 + (parseInt(r.keterlambatan) || 0);

                if (s <= day && day <= e) isScheduledToday = true;

                if (e < day) {
                    let hitDuringActive = false;
                    let hitAfterActiveButBeforeToday = false;

                    pastPengawasanDays.forEach((pDay: number) => {
                        if (s <= pDay && pDay <= e) {
                            hitDuringActive = true;
                        }
                        if (pDay > e && pDay < day) {
                            hitAfterActiveButBeforeToday = true;
                        }
                    });

                    if (!hitDuringActive && !hitAfterActiveButBeforeToday) {
                        isSkippedCompletely = true;
                    }
                }

                // Cek apakah hari terakhir kategori ini bertepatan dengan hari pengawasan
                if (day === e) {
                    isLastDay = true;
                }

                // Progress harus muncul HANYA jika hari ini berjalan di dalam rentang waktu (day >= s) 
                // TETAPI belum mencapai hari terakhir (day < e).
                if (day >= s && day < e) {
                    hideOnProgress = false;
                }

                // Kita prioritaskan rawRangeMatch untuk rentang yang benar-benar aktif atau yang sudah terlewati
                if (day >= s && day <= e) {
                    rawRangeMatch = r;
                } else if (!rawRangeMatch && day > e) {
                    rawRangeMatch = r;
                }
            });

            if (!rawRangeMatch && task.ranges?.length > 0) {
                rawRangeMatch = task.ranges[0];
            }

            const catItems = rabItems.filter((item: any) => item.kategori_pekerjaan.toUpperCase() === task.name.toUpperCase());

            // Juga ambil item dari liveHistory yang kategorinya cocok (untuk proyek migrasi)
            const historyItemsForCat = liveHistory
                .filter((lh: any) => lh.kategori_pekerjaan?.toUpperCase() === task.name.toUpperCase())
                .filter((lh: any) => !catItems.some((ci: any) => ci.jenis_pekerjaan?.toUpperCase() === lh.jenis_pekerjaan?.toUpperCase()));

            // Bangun list akhir: gabungkan catItems + item baru dari history
            const historyDerivedItems = historyItemsForCat.map((lh: any) => ({
                id: `hist-${lh.id || lh.jenis_pekerjaan}`,
                id_rab: 0,
                source_type: 'HISTORY',
                kategori_pekerjaan: lh.kategori_pekerjaan,
                jenis_pekerjaan: lh.jenis_pekerjaan || task.name,
                satuan: lh.satuan || '-',
                volume: 0,
                harga_material: 0,
                harga_upah: 0,
                total_material: 0,
                total_upah: 0,
                total_harga: 0,
            }));

            const allCatItems = [...catItems, ...historyDerivedItems];

            // Fallback: jika masih kosong DAN hari ini dijadwalkan → buat 1 placeholder
            const effectiveItems = allCatItems.length > 0 ? allCatItems : (isScheduledToday ? [{
                id: `placeholder-${task.name}`,
                id_rab: 0,
                source_type: 'PLACEHOLDER',
                kategori_pekerjaan: task.name,
                jenis_pekerjaan: task.name,
                satuan: '-',
                volume: 0,
                harga_material: 0,
                harga_upah: 0,
                total_material: 0,
                total_upah: 0,
                total_harga: 0,
            }] : []);

            const filteredItems = effectiveItems.filter((item: any) => {
                if (item.source_type !== 'PLACEHOLDER' && item.source_type !== 'HISTORY' && blockedOpnameItemKeys.has(getWorkItemKey(item))) return false;

                const key = `${task.name.toUpperCase()}|${(item.jenis_pekerjaan || task.name).toUpperCase()}`;
                const latestStatus = latestStatusMapState.get(key);
                const latestStatusLower = String(latestStatus || '').toLowerCase();
                const memoInput = memoInputs[key] as any;
                
                let isUnfinishedFromPreviousPengawasan = false;
                if (['progress', 'terlambat'].includes(latestStatusLower) && !!memoInput?.previousStatus) {
                    if (memoInput.previousPengawasanDate) {
                        const parsedPrev = parseDateAny(memoInput.previousPengawasanDate);
                        if (parsedPrev && !isNaN(parsedPrev.getTime())) {
                            const diffTime = parsedPrev.getTime() - startD.getTime();
                            const recordDay = Math.round(diffTime / (1000 * 3600 * 24));
                            const lastPengawasanDay = pastPengawasanDays.length > 0 ? Math.max(...pastPengawasanDays) : -1;
                            if (recordDay >= lastPengawasanDay) {
                                isUnfinishedFromPreviousPengawasan = true;
                            }
                        }
                    } else {
                        isUnfinishedFromPreviousPengawasan = true;
                    }
                }

                // Tampilkan item jika jadwalnya aktif hari ini, atau
                // terlewat sepenuhnya di masa lalu tanpa pernah ada pengawasan yg meng-hit, atau
                // masih Progress/Terlambat dari tanggal pengawasan sebelumnya.
                if (!isScheduledToday && !isSkippedCompletely && !isUnfinishedFromPreviousPengawasan) return false;

                // Jika Selesai, tampilkan HANYA JIKA diselesaikan pada tanggal ini (hari yang diklik)
                const jenisPekerjaan = item.jenis_pekerjaan || task.name;
                const wasFinishedToday = liveHistory.some((lh: any) => lh.kategori_pekerjaan.toUpperCase() === task.name.toUpperCase() && (lh.jenis_pekerjaan || '').toUpperCase() === jenisPekerjaan.toUpperCase() && lh.status.toLowerCase() === 'selesai');
                if (latestStatus === 'Selesai' && !wasFinishedToday) return false;

                return true;
            });

            return {
                category: { ...task, isLastDay, hideOnProgress, rawRangeMatch },
                items: filteredItems
            };
        }).filter((d: any) => d.items.length > 0);
    }, [chartData, activeHeaderClick, rabItems, latestStatusMapState, memoInputs, liveHistory, blockedOpnameItemKeys, getEffectiveWorkStart]);
    const handleSetStatus = (catName: string, itemJenis: string, status: string) => {
        setIsDirty(true);
        const key = `${catName.toUpperCase()}|${itemJenis.toUpperCase()}`;
        setMemoInputs(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                status,
                lateDays: prev[key]?.lateDays || 0,
                catatan: prev[key]?.catatan || '',
                file: prev[key]?.file || null,
                dokumentasiUrl: prev[key]?.dokumentasiUrl || null
            }
        }));
    };

    const handleSetLateDays = (catName: string, itemJenis: string, lateDays: number) => {
        setIsDirty(true);
        const key = `${catName.toUpperCase()}|${itemJenis.toUpperCase()}`;
        setMemoInputs(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                status: prev[key]?.status || 'Terlambat',
                lateDays: Math.max(0, lateDays),
                catatan: prev[key]?.catatan || '',
                file: prev[key]?.file || null,
                dokumentasiUrl: prev[key]?.dokumentasiUrl || null
            }
        }));
    };

    const handleSetField = async (catName: string, itemJenis: string, field: 'catatan' | 'file', value: any) => {
        let finalValue = value;

        // Kompresi otomatis untuk foto sebelum dimasukkan ke state
        if (field === 'file' && value instanceof File) {
            const { compressImage } = await import('@/lib/utils');
            finalValue = await compressImage(value);

            if (finalValue.size > PENGAWASAN_MAX_FILE_SIZE) {
                showAlert({
                    message: `File "${finalValue.name}" masih lebih besar dari 10MB setelah proses kompresi. Pilih file yang lebih kecil.`,
                    type: 'warning'
                });
                return;
            }
        }

        setIsDirty(true);
        const key = `${catName.toUpperCase()}|${itemJenis.toUpperCase()}`;
        setMemoInputs(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                status: prev[key]?.status || '',
                lateDays: prev[key]?.lateDays || 0,
                catatan: prev[key]?.catatan || '',
                file: prev[key]?.file || null,
                dokumentasiUrl: prev[key]?.dokumentasiUrl || null,
                [field]: finalValue
            }
        }));
    };

    const isLastSupervisionDay = useMemo(() => {
        if (!pengawasanHistory || pengawasanHistory.length === 0 || (!spkInfo && !projectData) || !activeHeaderClick) return false;

        const datesInNumeric = pengawasanHistory
            .map((p: any) => p.tanggal_pengawasan)
            .filter(Boolean)
            .map((dStr: string) => {
                const parts = dStr.split('/');
                if (parts.length === 3) {
                    return parseInt(`${parts[2]}${parts[1]}${parts[0]}`, 10);
                }
                return 0;
            })
            .filter((val: number) => val > 0)
            .sort((a: number, b: number) => a - b);

        if (datesInNumeric.length === 0) return false;
        const maxDate = datesInNumeric[datesInNumeric.length - 1];

        const effectiveStart = getEffectiveWorkStart();
        const startD = new Date(effectiveStart.split('T')[0] + 'T00:00:00');
        const checkpointDate = parseDateAny(activeHeaderClick.dateString);
        let offset = activeHeaderClick.dayIndex || 0;
        if (checkpointDate && !isNaN(checkpointDate.getTime())) {
            const diffTime = checkpointDate.getTime() - startD.getTime();
            offset = Math.round(diffTime / (1000 * 3600 * 24));
        }

        const dDate = new Date(effectiveStart.split('T')[0] + 'T00:00:00');
        dDate.setDate(dDate.getDate() + offset);
        const yyyy = dDate.getFullYear();
        const mm = String(dDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dDate.getDate()).padStart(2, '0');
        const currentNumeric = parseInt(`${yyyy}${mm}${dd}`, 10);

        return maxDate === currentNumeric;
    }, [pengawasanHistory, spkInfo, projectData, activeHeaderClick, getEffectiveWorkStart]);

    const isSubmitValid = useMemo(() => {
        // Kasus khusus: semua pekerjaan sudah Selesai (memoConfig kosong), 
        // tapi ada item terlambat yang perlu dijadwalkan ulang.
        // User hanya perlu mengisi tanggal serah terima berikutnya lalu Simpan.
        if (memoConfig.length === 0 && isLastSupervisionDay && hasLateItems) {
            return !!nextHandoverDate;
        }

        if (memoConfig.length === 0) return false;
        if (!isDirty) return false;

        let editableItemCount = 0;

        for (const cat of memoConfig) {
            if (!cat.items) continue;
            for (const item of cat.items) {
                const key = `${cat.category.name.toUpperCase()}|${item.jenis_pekerjaan.toUpperCase()}`;
                const isAlreadySelesai = latestStatusMapState.get(key) === 'Selesai';
                if (isAlreadySelesai) continue;

                const isSavedOnCurrentDate = !!(memoInputs[key] as any)?.isSaved && latestIdMapState.has(key);
                if (isSavedOnCurrentDate) continue;

                editableItemCount += 1;

                const input = memoInputs[key];

                if (!input || !input.status) {
                    return false;
                }

                if (input.status === 'Terlambat') {
                    if (input.lateDays === undefined || input.lateDays === null || input.lateDays <= 0) {
                        return false;
                    }
                }

                // Foto/dokumentasi wajib diisi, KECUALI item sudah punya dokumentasiUrl dari history
                // (item Progress/Terlambat dari hari sebelumnya yang sedang diupdate statusnya)
                const hasFotoLama = !!(input.dokumentasiUrl);
                const hasFotoBaru = !!(input.file);
                if (!hasFotoBaru && !hasFotoLama) {
                    return false;
                }
            }
        }

        if (editableItemCount === 0) return false;

        // Wajib mengisi tanggal serah terima berikutnya jika ini hari terakhir dan ada yg terlambat
        if (isLastSupervisionDay && hasLateItems && !nextHandoverDate) {
            return false;
        }

        return true;
    }, [memoConfig, memoInputs, latestStatusMapState, latestIdMapState, isDirty, isLastSupervisionDay, hasLateItems, nextHandoverDate]);

    const getDateStr = (dayIndexOffset: number) => {
        if (!spkInfo) return '';
        const d = new Date(spkInfo.startDate.split('T')[0] + 'T00:00:00');
        d.setDate(d.getDate() + dayIndexOffset);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const handleSubmit = async () => {
        if (!selectedGanttId) {
            showAlert({ message: 'Draft belum disimpan permanen. Simpan Gantt Chart terlebih dahulu.', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const itemsArrayInsert: any[] = [];
            const filesMapInsert: { index: number, file: File }[] = [];

            const itemsArrayUpdate: any[] = [];
            const filesMapUpdate: { index: number, file: File }[] = [];

            let catsLate = new Map<string, number>();

            const entriesToSubmit = Object.entries(memoInputs).filter(([key, val]) => {
                if (!val.status) return false;
                const isSavedOnCurrentDate = !!(val as any)?.isSaved && latestIdMapState.has(key);
                return !isSavedOnCurrentDate;
            });
            const shouldOpenOpname = entriesToSubmit.some(([, val]) =>
                String(val.status || '').toLowerCase() === 'selesai'
            );
            const hasNextHandoverAction = isLastSupervisionDay && hasLateItems && !!nextHandoverDate;

            const clickedDate = parseDateAny(activeHeaderClick?.dateString || '');
            const effectiveStartForSubmit = getEffectiveWorkStart();
            const fallbackSubmitDate = new Date(effectiveStartForSubmit.split('T')[0] + 'T00:00:00');
            fallbackSubmitDate.setDate(fallbackSubmitDate.getDate() + (activeHeaderClick?.dayIndex || 0));
            const submitDate = clickedDate && !Number.isNaN(clickedDate.getTime()) ? clickedDate : fallbackSubmitDate;
            const formattedDate = formatDateForPengawasan(submitDate);

            entriesToSubmit.forEach(([key, val]) => {
                const pipeIdx = key.indexOf('|');
                if (pipeIdx === -1) return; // malformed key, skip
                const catName = key.substring(0, pipeIdx);       // already UPPERCASE
                const itemJenis = key.substring(pipeIdx + 1);    // already UPPERCASE
                const upperKey = key; // already normalized
                const existingId = latestIdMapState.get(upperKey);

                // [PERBAIKAN 1]: Mengubah status menjadi lowercase utuh agar lolos validasi strict enum backend
                const statusLower = typeof val.status === 'string' ? val.status.toLowerCase() : '';
                const validStatuses = ['progress', 'selesai', 'terlambat'];
                if (!validStatuses.includes(statusLower)) return; // skip jika status tidak valid
                const statusSafe = statusLower;
                const lateDaysSafe = Number(val.lateDays) || 0;

                if (existingId) {
                    // [PERBAIKAN 2]: DILARANG mengirim keterlambatan, id_gantt, & tanggal_pengawasan pada API PUT
                    // [PERBAIKAN 3]: Hanya kirim catatan jika user mengisinya, hindari duplicate ID
                    const alreadyQueued = itemsArrayUpdate.some(i => i.id === Number(existingId));
                    if (alreadyQueued) return; // skip duplicate ID
                    const updateItem: any = { id: Number(existingId), status: statusSafe };
                    if (val.catatan && String(val.catatan).trim()) updateItem.catatan = String(val.catatan).trim();
                    itemsArrayUpdate.push(updateItem);
                    if (val.file) {
                        filesMapUpdate.push({ index: itemsArrayUpdate.length - 1, file: val.file });
                    }
                } else {
                    const insertItem: any = {
                        id_gantt: Number(selectedGanttId),
                        tanggal_pengawasan: formattedDate,
                        kategori_pekerjaan: catName,
                        jenis_pekerjaan: itemJenis,
                        status: statusSafe,
                        // [PERBAIKAN 4]: DILARANG mengirim keterlambatan pada payload POST bulk
                    };
                    if (val.catatan && String(val.catatan).trim()) insertItem.catatan = String(val.catatan).trim();
                    itemsArrayInsert.push(insertItem);
                    if (val.file) {
                        filesMapInsert.push({ index: itemsArrayInsert.length - 1, file: val.file });
                    }
                }

                if (val.status === 'Terlambat' && Number(val.lateDays) > 0) {
                    catsLate.set(catName, Math.max(catsLate.get(catName) || 0, Number(val.lateDays)));
                }
            });

            if (itemsArrayInsert.length === 0 && itemsArrayUpdate.length === 0 && !hasNextHandoverAction) {
                throw new Error(
                    "Tidak ada perubahan pengawasan yang dikirim. Ubah minimal satu status/catatan/foto lalu coba lagi."
                );
            }

            const { submitPengawasanBulk, updatePengawasanBulk } = await import('@/lib/api');
            const { submitGanttPengawasan } = await import('@/lib/api');

            // --- A. Eksekusi INSERT (POST) ---
            if (itemsArrayInsert.length > 0) {
                // Tanggal sibling Sipil/ME ikut ditampilkan pada kedua Gantt.
                // Pastikan tanggal yang diklik juga benar-benar tersedia pada Gantt aktif
                // sebelum item pengawasan mereferensikannya.
                await submitGanttPengawasan(Number(selectedGanttId), [formattedDate]);

                const insertBatches = createPengawasanUploadBatches(itemsArrayInsert, filesMapInsert);
                let insertedCount = 0;

                for (let batchIndex = 0; batchIndex < insertBatches.length; batchIndex++) {
                    const batch = insertBatches[batchIndex];
                    let insertResult: any;

                    try {
                        if (batch.files.length > 0) {
                            const formData = new FormData();
                            formData.append('items', JSON.stringify(batch.items));
                            batch.files.forEach(({ file }) => formData.append('file_dokumentasi', file));
                            formData.append(
                                'file_dokumentasi_indexes',
                                JSON.stringify(batch.files.map(({ index }) => index))
                            );
                            insertResult = await submitPengawasanBulk(formData);
                        } else {
                            insertResult = await submitPengawasanBulk({ items: batch.items });
                        }
                    } catch (error: any) {
                        throw new Error(
                            `Batch data baru ${batchIndex + 1}/${insertBatches.length} gagal setelah ${insertedCount} item tersimpan: ${error?.message || 'Upload gagal'}`
                        );
                    }

                    if (!Array.isArray(insertResult?.data) || insertResult.data.length !== batch.items.length) {
                        throw new Error(
                            `Penyimpanan batch ${batchIndex + 1}/${insertBatches.length} tidak lengkap (${insertResult?.data?.length ?? 0}/${batch.items.length} item).`
                        );
                    }
                    insertedCount += insertResult.data.length;
                }
            }

            // --- B. Eksekusi UPDATE (PUT) ---
            if (itemsArrayUpdate.length > 0) {
                const updateBatches = createPengawasanUploadBatches(itemsArrayUpdate, filesMapUpdate);
                let updatedCount = 0;

                for (let batchIndex = 0; batchIndex < updateBatches.length; batchIndex++) {
                    const batch = updateBatches[batchIndex];
                    let updateResult: any;

                    try {
                        if (batch.files.length > 0) {
                            const formData = new FormData();
                            formData.append('items', JSON.stringify(batch.items));
                            batch.files.forEach(({ file }) => formData.append('rev_file_dokumentasi', file));
                            formData.append(
                                'rev_file_dokumentasi_indexes',
                                JSON.stringify(batch.files.map(({ index }) => index))
                            );
                            updateResult = await updatePengawasanBulk(formData);
                        } else {
                            updateResult = await updatePengawasanBulk({ items: batch.items });
                        }
                    } catch (error: any) {
                        throw new Error(
                            `Batch revisi ${batchIndex + 1}/${updateBatches.length} gagal setelah ${updatedCount} item diperbarui: ${error?.message || 'Upload gagal'}`
                        );
                    }

                    if (!Array.isArray(updateResult?.data) || updateResult.data.length !== batch.items.length) {
                        throw new Error(
                            `Pembaruan batch ${batchIndex + 1}/${updateBatches.length} tidak lengkap (${updateResult?.data?.length ?? 0}/${batch.items.length} item).`
                        );
                    }
                    updatedCount += updateResult.data.length;
                }
            }

            // 2. Submit Keterlambatan (API Terpisah sesuai dokumentasi gantt delay)
            if (catsLate.size > 0) {
                const { updateGanttDelay } = await import('@/lib/api');
                const updates = Array.from(catsLate.entries()).map(([catName, totalLate]) => ({
                    kategori_pekerjaan: catName.toUpperCase(),
                    keterlambatan: String(totalLate)
                }));

                try {
                    await updateGanttDelay(selectedGanttId, { updates });
                } catch (e: any) {
                    console.warn("Update delay bulk error:", e);
                }
            }

            // 3. Tambahkan Tanggal Serah Terima Berikutnya jika ada item terlambat di hari terakhir
            if (hasNextHandoverAction) {
                try {
                    // Convert YYYY-MM-DD to DD/MM/YYYY
                    const parts = nextHandoverDate.split('-');
                    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : nextHandoverDate;
                    await submitGanttPengawasan(Number(selectedGanttId), [formattedDate]);
                } catch (e: any) {
                    console.warn("Update next handover date error:", e);
                }
            }

            showAlert({
                message: shouldOpenOpname
                    ? 'Memo pengawasan berhasil disimpan! Lanjutkan ke form Opname.'
                    : 'Memo pengawasan berhasil disimpan.',
                type: 'success',
                onConfirm: () => onSuccess({ openOpname: shouldOpenOpname })
            });
        } catch (err: any) {
            const debugMessage = (() => {
                if (!err) return "Unknown error";
                if (typeof err === "string") return err;
                if (err instanceof Error) return err.message || "Unknown error";
                if (typeof err.message === "string") return err.message;
                try {
                    return JSON.stringify(err);
                } catch {
                    return "Unknown error";
                }
            })();

            showAlert({ message: `Gagal menyimpan: ${debugMessage}`, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-slate-50 flex flex-col rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                    <div className="p-5 border-b flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl text-slate-800 leading-tight">
                                    {isLastSupervisionDay ? "Serah Terima" : "Memo Pengawasan"}
                                </h2>
                                <p className="text-sm text-slate-500 font-medium">{activeHeaderClick.dateString}</p>
                                {(scopeLabel || flowStep) && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        {scopeLabel && (
                                            <Badge className="border-none bg-slate-800 text-white">
                                                {String(scopeLabel).toUpperCase()}
                                            </Badge>
                                        )}
                                        {flowStep && (
                                            <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
                                                Langkah {flowStep.current} dari {flowStep.total}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentPengawasanGanttId && (
                                <button
                                    onClick={() => window.open(
                                        currentPengawasanPdfLink
                                        || `${API_URL.replace(/\/$/, "")}/api/pengawasan/${currentPengawasanGanttId}/pdf`,
                                        "_blank"
                                    )}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold border border-red-200 transition-colors shadow-sm"
                                    title="Download PDF Pengawasan"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download PDF
                                </button>
                            )}
                            {canCreateInstruksiLapangan && (
                                <button
                                    onClick={() => setShowInstruksiModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold border border-indigo-200 transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Instruksi Lapangan
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                                <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                                <p className="font-medium text-slate-500">Memuat data pengawasan terakhir...</p>
                            </div>
                        ) : memoConfig.length === 0 ? (
                            hasCurrentDateSelesaiItems ? (
                                <div className="flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">Semua Pekerjaan Selesai</h3>
                                    <p className="font-medium mb-6">Pekerjaan pada hari ini telah memiliki memo Selesai.</p>
                                    <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 h-auto text-sm shadow-md transition-transform hover:scale-105">
                                        Lanjut ke Form Opname &rarr;
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                                    <Info className="w-12 h-12 mb-3 text-slate-300" />
                                    <p className="font-medium">Tidak ada kategori pekerjaan yang sedang aktif pada hari ini.</p>
                                </div>
                            )
                        ) : (
                            memoConfig.map((d: any, i: number) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="bg-slate-100 px-5 py-3 border-b flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">{d.category.name}</h3>
                                        {d.category.isLastDay && <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Hari Terakhir Target!</Badge>}
                                    </div>
                                    <div className="p-2 overflow-x-auto">
                                        {d.items && d.items.length > 0 ? (
                                            <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                                                <tbody>
                                                    {d.items.map((item: any, j: number) => {
                                                        const key = `${d.category.name.toUpperCase()}|${item.jenis_pekerjaan.toUpperCase()}`;
                                                        const currentStatus = memoInputs[key]?.status;
                                                        const lateDays = memoInputs[key]?.lateDays || 0;
                                                        const latestStatusKey = latestStatusMapState.get(`${d.category.name.toUpperCase()}|${item.jenis_pekerjaan.toUpperCase()}`);
                                                        return (
                                                            <tr key={j} className="border-b last:border-b-0 hover:bg-slate-50/50">
                                                                <td className="p-4 align-middle w-1/3">
                                                                    <p className="font-semibold text-slate-700">{item.jenis_pekerjaan}</p>
                                                                    {item.source_type === 'PLACEHOLDER' && (
                                                                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Data Migrasi</span>
                                                                    )}
                                                                    {item.source_type === 'HISTORY' && (
                                                                        <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Dari Riwayat</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 align-middle w-2/3">
                                                                    {latestStatusKey === 'Selesai' ? (
                                                                        <div className="flex items-center justify-center p-2.5 rounded-lg bg-green-50 border border-green-200/60 shadow-sm w-full">
                                                                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                                            <span className="font-bold text-green-700 text-sm">Telah Selesai</span>
                                                                        </div>
                                                                    ) : (memoInputs[key] as any)?.isSaved && latestIdMapState.has(key) ? (
                                                                        <div className={`flex items-center justify-between p-3 rounded-xl border shadow-sm w-full ${currentStatus === 'Terlambat' ? 'bg-red-50 border-red-200/60' : 'bg-blue-50 border-blue-200/60'}`}>
                                                                            <div className="flex items-center gap-2.5">
                                                                                {currentStatus === 'Terlambat' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-blue-500" />}
                                                                                <span className={`font-bold text-sm ${currentStatus === 'Terlambat' ? 'text-red-700' : 'text-blue-700'}`}>{currentStatus}</span>
                                                                                {currentStatus === 'Terlambat' && lateDays > 0 && (
                                                                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full shadow-sm">{lateDays} Hari</span>
                                                                                )}
                                                                            </div>
                                                                            {memoInputs[key]?.dokumentasiUrl && (
                                                                                <a href={memoInputs[key].dokumentasiUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors shrink-0">
                                                                                    <FileText className="w-3.5 h-3.5" /> Lihat Dokumen
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-2">
                                                                            {latestStatusKey && ['Terlambat', 'Progress'].includes(latestStatusKey) && !latestIdMapState.has(key) && (
                                                                                <div className={`rounded-lg border px-3 py-2 text-xs ${latestStatusKey === 'Terlambat' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <div className="flex items-center gap-2 font-bold">
                                                                                            {latestStatusKey === 'Terlambat' ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                                                            <span>
                                                                                                Sebelumnya: {latestStatusKey}
                                                                                                {latestStatusKey === 'Terlambat' && (memoInputs[key] as any)?.previousLateDays > 0 ? ` ${(memoInputs[key] as any).previousLateDays} Hari` : ''}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSetStatus(d.category.name, item.jenis_pekerjaan, 'Selesai')}
                                                                                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all ${currentStatus === 'Selesai' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                                >
                                                                                    Selesai
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSetStatus(d.category.name, item.jenis_pekerjaan, 'Terlambat')}
                                                                                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all ${currentStatus === 'Terlambat' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                                >
                                                                                    Terlambat
                                                                                </button>

                                                                                {!d.category.hideOnProgress && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetStatus(d.category.name, item.jenis_pekerjaan, 'Progress')}
                                                                                        className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all ${currentStatus === 'Progress' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                                    >
                                                                                        Progress
                                                                                    </button>
                                                                                )}
                                                                            </div>

                                                                            {/* Input Hari Keterlambatan jika status Terlambat */}
                                                                            {currentStatus === 'Terlambat' && (
                                                                                <div className="flex items-center gap-2 mt-1 animate-in slide-in-from-top-1">
                                                                                    <span className="text-xs font-semibold text-red-600">Terlambat:</span>
                                                                                    <input
                                                                                        type="number" min="0"
                                                                                        className="w-20 p-1 text-sm border-2 border-red-300 rounded focus:border-red-500 focus:outline-none"
                                                                                        value={lateDays === 0 ? '' : lateDays}
                                                                                        onChange={(e) => handleSetLateDays(d.category.name, item.jenis_pekerjaan, parseInt(e.target.value) || 0)}
                                                                                        placeholder="Hari"
                                                                                    />
                                                                                    <span className="text-xs text-slate-500">hari</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Input Catatan & Dokumentasi ketika sudah di-set status */}
                                                                            {currentStatus && (
                                                                                <div className="mt-2 flex flex-col gap-2 rounded bg-slate-50 p-2 border border-slate-200">
                                                                                    <textarea
                                                                                        className="w-full p-2 text-xs border border-slate-300 rounded focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
                                                                                        placeholder="Tambahkan catatan/keterangan (opsional)..."
                                                                                        value={memoInputs[key]?.catatan || ''}
                                                                                        onChange={(e) => handleSetField(d.category.name, item.jenis_pekerjaan, 'catatan', e.target.value)}
                                                                                        rows={2}
                                                                                    />
                                                                                    <div className="flex items-center text-xs">
                                                                                        <span className="text-slate-600 font-medium w-16">Foto/Dok<span className="text-red-500">*</span>:</span>
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,.pdf,application/pdf"
                                                                                            onChange={(e) => handleSetField(d.category.name, item.jenis_pekerjaan, 'file', e.target.files?.[0] || null)}
                                                                                            className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-500 italic">Data item jenis pekerjaan tidak tersedia.</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {isLastSupervisionDay && hasLateItems && (
                        <div className="px-6 pb-4">
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Tindak Lanjut Item Terlambat
                                </h4>
                                <p className="text-xs text-orange-700 mb-3">
                                    Terdapat item pekerjaan yang masih <strong>Terlambat</strong> pada hari serah terima. Anda wajib menentukan jadwal serah terima berikutnya.
                                </p>
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Tanggal Serah Terima Berikutnya *</label>
                                    <input
                                        type="date"
                                        value={nextHandoverDate}
                                        onChange={(e) => {
                                            setNextHandoverDate(e.target.value);
                                            setIsDirty(true);
                                        }}
                                        className="block w-full max-w-xs p-2 mt-1 border border-orange-300 rounded focus:ring-orange-500 focus:border-orange-500 text-sm text-slate-800 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-5 border-t bg-white flex justify-between items-center shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-10">
                        <div>
                            {hasCurrentDateSelesaiItems && (
                                <Button variant="outline" onClick={onSuccess} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 font-semibold transition-colors">
                                    Lanjut ke Opname &rarr;
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="font-semibold" onClick={onClose}>Batal</Button>
                            {flowStep && flowStep.total > 1 && (
                                <Button
                                    variant="outline"
                                    className="font-semibold text-slate-600"
                                    onClick={() => onNavigateScope?.(nextScopeLabel ? flowStep.current : 0)}
                                    disabled={isSubmitting}
                                >
                                    {nextScopeLabel ? `Lanjut ke ${String(nextScopeLabel).toUpperCase()}` : 'Kembali ke SIPIL'}
                                </Button>
                            )}
                            <Button onClick={handleSubmit} disabled={isSubmitting || (!isSubmitValid && !(memoConfig.length === 0 && isLastSupervisionDay && hasLateItems && nextHandoverDate))} className="bg-blue-600 hover:bg-blue-700 px-8 font-bold shadow-md">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {instruksiToast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed left-1/2 top-4 z-[10000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 md:left-auto md:right-5 md:translate-x-0 ${instruksiToast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                >
                    {instruksiToast.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    <span>{instruksiToast.message}</span>
                </div>
            )}

            {showInstruksiModal && (
                <InstruksiLapanganModal
                    onClose={() => setShowInstruksiModal(false)}
                    onSuccess={() => {
                        setShowInstruksiModal(false);
                        showInstruksiToast("Instruksi Lapangan berhasil disimpan dan dikirim untuk approval.", "success");
                    }}
                    onError={(message) => {
                        showInstruksiToast(message || "Gagal menyimpan Instruksi Lapangan.", "error");
                    }}
                    initialTokoId={id_toko}
                />
            )}
        </>
    );
}

// Komponen OpnameModal
function OpnameModal({ activeHeaderClick, rabItems, id_toko, nomorUlok, onClose, selectedGanttId, onSuccess, spkInfo, scopeLabel, nextScopeLabel, flowStep, onNavigateScope }: any) {
    const { showAlert } = useGlobalAlert();
    const [completedItems, setCompletedItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [opnameInputs, setOpnameInputs] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasOpnameFinal, setHasOpnameFinal] = useState(false);
    const [completedPengawasanCount, setCompletedPengawasanCount] = useState(0);
    const isLastDay = spkInfo && activeHeaderClick && (activeHeaderClick.dayIndex + 1 >= spkInfo.duration);
    const canGenerateSerahTerima = hasOpnameFinal && completedItems.length === 0;

    useEffect(() => {
        setIsLoading(true);
        import('@/lib/api').then(({ fetchPengawasanList, fetchRABDetail, fetchRABList, fetchOpnameList, fetchOpnameFinalList }) => {
            fetchPengawasanList({ id_gantt: selectedGanttId })
                .then(async res => {
                    const allData = res.data || [];
                    // Case-insensitive filtering in frontend to bypass strict backend endpoints
                    const data = allData.filter((p: any) => p.status?.toLowerCase() === 'selesai');
                    setCompletedPengawasanCount(data.length);

                    let latestRabItems = rabItems;
                    let existingOpnameItems: any[] = [];
                    let existingFinalFound = false;

                    // Ambil daftar opname yg sudah ada untuk toko ini
                    if (id_toko) {
                        try {
                            const [opnames, finalRes] = await Promise.all([
                                fetchOpnameList({ id_toko }),
                                fetchOpnameFinalList({ id_toko })
                            ]);
                            existingOpnameItems = opnames.data || [];
                            const finalData: any = finalRes.data;
                            const finalRows = Array.isArray(finalData)
                                ? finalData
                                : Array.isArray(finalData?.opname_final)
                                    ? finalData.opname_final
                                    : [];
                            existingFinalFound = finalRows.length > 0;
                        } catch (e) {
                            console.warn("Gagal mendapatkan status opname existing:", e);
                        }
                    }
                    setHasOpnameFinal(existingFinalFound);

                    // Build maps from existing opname items
                    // Menggunakan Number() untuk menghindari type mismatch string vs number
                    const blockedItemKeys = new Set<string>();
                    const existingOpnameMap = new Map<string, any>();
                    existingOpnameItems.forEach((op: any) => {
                        const sourceKey = getOpnameItemKey(op);
                        const status = (op.status || '').toLowerCase();
                        if (['pending', 'disetujui'].includes(status)) {
                            blockedItemKeys.add(sourceKey);
                        }
                        // Track latest opname record per source item for upsert (including ditolak)
                        if (!existingOpnameMap.has(sourceKey) || Number(op.id) > Number(existingOpnameMap.get(sourceKey).id)) {
                            existingOpnameMap.set(sourceKey, op);
                        }
                    });

                    // Fetch fresh RAB data directly from GET api/rab/:id to guarantee satuan exists.
                    // Some migrated projects have an approved RAB header with no items, so try
                    // toko-matching RAB candidates until one provides detail rows.
                    const candidateRabIds = new Set<number>();
                    if (rabItems?.[0]?.id_rab) candidateRabIds.add(Number(rabItems[0].id_rab));
                    if (nomorUlok && id_toko) {
                        try {
                            const rabListRes = await fetchRABList({ nomor_ulok: nomorUlok });
                            (rabListRes.data || [])
                                .filter((rab: any) => Number(rab.id_toko) === Number(id_toko))
                                .forEach((rab: any) => {
                                    if (rab?.id) candidateRabIds.add(Number(rab.id));
                                });
                        } catch (e) {
                            console.warn("Gagal mendapatkan RAB fallback untuk opname:", e);
                        }
                    }

                    for (const idRab of candidateRabIds) {
                        try {
                            const rabRes = await fetchRABDetail(idRab);
                            if (rabRes?.data?.items?.length) {
                                const ilItems = (rabItems || []).filter((item: any) => item.source_type === 'IL');
                                latestRabItems = [...rabRes.data.items, ...ilItems];
                                break;
                            }
                        } catch (e) {
                            console.error("Gagal get RAB detail fallback", e);
                        }
                    }

                    const buildOpnameSourceItem = (p: any, rItem: any, matchedRabItemId: number | null) => {
                        const sourceKey = rItem ? getWorkItemKey(rItem) : null;
                        const existingOp = sourceKey ? existingOpnameMap.get(sourceKey) : null;

                        return {
                            ...p,
                            id_rab_item: rItem?.source_type === 'IL' ? null : (matchedRabItemId || rItem?.id),
                            id_instruksi_lapangan_item: rItem?.source_type === 'IL' ? rItem.id_instruksi_lapangan_item : null,
                            source_type: rItem?.source_type || 'RAB',
                            source_key: sourceKey,
                            kategori_pekerjaan: rItem?.kategori_pekerjaan || p.kategori_pekerjaan,
                            jenis_pekerjaan: rItem?.jenis_pekerjaan || p.jenis_pekerjaan,
                            volume_rab: parseFloat(rItem?.volume) || 0,
                            harga_material: parseFloat(rItem?.harga_material) || 0,
                            harga_upah: parseFloat(rItem?.harga_upah) || 0,
                            satuan: rItem?.satuan || '',
                            existing_opname_id: existingOp?.id || null,
                            existing_opname: existingOp || null,
                        };
                    };

                    const merged = data.flatMap((p: any) => {
                        let matchedRabItemId = p.id_rab_item ? Number(p.id_rab_item) : null;
                        let rItem: any = null;

                        if (matchedRabItemId) {
                            rItem = latestRabItems.find((r: any) => Number(r.id) === matchedRabItemId);
                        }

                        if (!rItem) {
                            rItem = latestRabItems.find((r: any) =>
                                isSameWorkText(r.kategori_pekerjaan, p.kategori_pekerjaan) &&
                                isSameWorkText(r.jenis_pekerjaan, p.jenis_pekerjaan)
                            );
                            if (rItem) matchedRabItemId = Number(rItem.id);
                        }

                        if (rItem) return [buildOpnameSourceItem(p, rItem, matchedRabItemId)];

                        if (isCategoryLevelPengawasan(p)) {
                            return latestRabItems
                                .filter((item: any) => isSameWorkText(item.kategori_pekerjaan, p.kategori_pekerjaan))
                                .map((item: any) => buildOpnameSourceItem(p, item, Number(item.id)));
                        }

                        return [buildOpnameSourceItem(p, null, null)];
                    }).filter((item: any) => {
                        if (!item.source_key) return false;

                        // Filter: item yg sudah diajukan opname (pending/disetujui) tidak muncul lagi
                        if (blockedItemKeys.has(item.source_key)) return false;
                        return true;
                    });

                    const deduped = new Map<string, any>();
                    merged.forEach((item: any) => {
                        const key = item.source_key;
                        if (!deduped.has(key) || Number(item.id) > Number(deduped.get(key).id)) {
                            deduped.set(key, item);
                        }
                    });
                    const dedupedItems = Array.from(deduped.values());

                    setCompletedItems(dedupedItems);

                    const inputs: any = {};
                    dedupedItems.forEach((item: any) => {
                        const key = item.source_key || item.id;
                        const ex = item.existing_opname;
                        inputs[key] = {
                            volume_akhir: ex ? String(ex.volume_akhir) : String(item.volume_rab),
                            desain: ex?.desain || '',
                            kualitas: ex?.kualitas || '',
                            spesifikasi: ex?.spesifikasi || '',
                            catatan: ex?.catatan || '',
                            file: null,
                            existing_foto: ex?.foto || null,
                        };
                    });
                    setOpnameInputs(inputs);
                })
                .catch(err => {
                    console.error(err);
                    showAlert({ message: "Gagal memuat list pengawasan selesai.", type: "error" });
                })
                .finally(() => setIsLoading(false));
        });
    }, [selectedGanttId, rabItems, id_toko, nomorUlok]);

    const handleSetOpname = (id: string | number, field: string, value: any) => {
        setOpnameInputs(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const groupedByCategory = useMemo(() => {
        const map = new Map<string, any[]>();
        completedItems.forEach(item => {
            const cat = item.kategori_pekerjaan;
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(item);
        });
        return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
    }, [completedItems]);

    // Tambahan Validasi isSubmitValid
    const isSubmitValid = useMemo(() => {
        if (completedItems.length === 0) return false;

        for (const item of completedItems) {
            const itemKey = item.source_key || item.id;
            const input = opnameInputs[itemKey];
            if (!input) return false;

            // 1. Validasi volume akhir tidak boleh kosong
            if (input.volume_akhir === undefined || input.volume_akhir === null || input.volume_akhir === '') return false;

            // 2. Validasi verifikasi pekerjaan (semua dropdown wajib diisi)
            if (!input.desain || input.desain === '') return false;
            if (!input.kualitas || input.kualitas === '') return false;
            if (!input.spesifikasi || input.spesifikasi === '') return false;

            // 3. Validasi foto bukti wajib diisi (boleh foto lama jika ada)
            if (!input.file && !input.existing_foto) return false;
        }

        return true;
    }, [completedItems, opnameInputs]);

    // Refactor handleSubmit dengan parsing tipe data untuk menghindari API Rejection
    const handleSubmit = async () => {
        if (completedItems.length === 0) {
            showAlert({
                message: canGenerateSerahTerima
                    ? "Semua Opname sudah selesai. Gunakan tombol Generate Serah Terima pada panel utama ULOK."
                    : "Tidak ada pekerjaan baru yang siap diajukan ke Opname.",
                type: "info"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const emailPembuat = sessionStorage.getItem('loggedInUserEmail') || '';
            if (!id_toko || !emailPembuat) {
                showAlert({ message: "Data toko atau email user tidak ditemukan. Silakan login ulang lalu coba lagi.", type: "error" });
                setIsSubmitting(false);
                return;
            }

            const itemsArray: any[] = [];
            const filesMap: { index: number, file: File }[] = [];

            let currentIndex = 0;
            completedItems.forEach(item => {
                const itemKey = item.source_key || item.id;
                const input = opnameInputs[itemKey];
                const volAkhir = parseDecimalInput(input.volume_akhir);
                const selisihVol = volAkhir - item.volume_rab;
                const hargaSatuan = Number(item.harga_material || 0) + Number(item.harga_upah || 0);
                const totalSelisih = Math.round(selisihVol * hargaSatuan);
                const totalHargaOpname = Math.round(volAkhir * hargaSatuan);

                const itemData: any = {
                    id_toko: Number(id_toko),
                    id_rab_item: item.source_type === 'IL' ? undefined : Number(item.id_rab_item),
                    id_instruksi_lapangan_item: item.source_type === 'IL' ? Number(item.id_instruksi_lapangan_item) : undefined,
                    status: 'pending',
                    volume_akhir: volAkhir,
                    selisih_volume: selisihVol,
                    total_selisih: totalSelisih,
                    total_harga_opname: totalHargaOpname,
                    desain: input.desain?.trim(),
                    kualitas: input.kualitas?.trim(),
                    spesifikasi: input.spesifikasi?.trim(),
                    catatan: input.catatan?.trim() || undefined,
                };

                // Include existing opname id for upsert if available
                if (item.existing_opname_id) {
                    itemData.id = Number(item.existing_opname_id);
                }

                // Preserve existing photo URL if no new file is selected
                if (!input.file && input.existing_foto) {
                    itemData.foto = input.existing_foto;
                }

                itemsArray.push(itemData);

                if (input.file) {
                    filesMap.push({ index: currentIndex, file: input.file });
                }
                currentIndex++;
            });

            if (itemsArray.length === 0) {
                showAlert({ message: "Tidak ada item baru untuk di-opname.", type: "info" });
                setIsSubmitting(false);
                return;
            }

            const grandTotalOpname = itemsArray.reduce((acc, item) => {
                const sourceKey = item.id_instruksi_lapangan_item ? `il:${item.id_instruksi_lapangan_item}` : `rab:${item.id_rab_item}`;
                const rabRef = completedItems.find((completed) => completed.source_key === sourceKey);
                const hargaSatuan = Number(rabRef?.harga_material || 0) + Number(rabRef?.harga_upah || 0);
                return acc + Math.round(Number(item.volume_akhir) * hargaSatuan);
            }, 0);

            const grandTotalRab = completedItems.reduce((acc, item) => {
                const hargaSatuan = Number(item.harga_material || 0) + Number(item.harga_upah || 0);
                return acc + Math.round(Number(item.volume_rab || 0) * hargaSatuan);
            }, 0);

            const { submitOpnameBulk } = await import('@/lib/api');
            if (filesMap.length > 0) {
                const formData = new FormData();
                formData.append('id_toko', String(id_toko));
                formData.append('email_pembuat', emailPembuat);
                formData.append('grand_total_opname', String(Math.round(grandTotalOpname)));
                formData.append('grand_total_rab', String(Math.round(grandTotalRab)));
                formData.append('items', JSON.stringify(itemsArray));
                filesMap.forEach(f => {
                    formData.append('file_foto_opname', f.file);
                });
                // Mapping file index - hanya kirim indeks untuk item yang memang punya file baru
                formData.append('file_foto_opname_indexes', JSON.stringify(filesMap.map(f => f.index)));

                await submitOpnameBulk(formData);
            } else {
                await submitOpnameBulk({
                    id_toko: Number(id_toko),
                    email_pembuat: emailPembuat,
                    grand_total_opname: String(Math.round(grandTotalOpname)),
                    grand_total_rab: String(Math.round(grandTotalRab)),
                    items: itemsArray
                });
            }

            // Trigger API Berkas Serah Terima — HANYA jika ini hari terakhir (serah terima)

            showAlert({
                message: isLastDay
                    ? 'Data Opname berhasil disimpan. PDF Serah Terima akan dibuat otomatis.'
                    : 'Data Opname berhasil disimpan!',
                type: 'success',
                onConfirm: () => onSuccess()
            });
        } catch (e: any) {
            showAlert({ message: `Gagal menyimpan: ${e.message}`, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-50 flex flex-col rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <span className="font-bold">OP</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-slate-800 leading-tight">Opname Pekerjaan Selesai</h2>
                            <p className="text-sm text-slate-500 font-medium">Isi detail opname untuk pekerjaan yang telah diverifikasi selesai</p>
                            {(scopeLabel || flowStep) && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {scopeLabel && (
                                        <Badge className="border-none bg-slate-800 text-white">
                                            {String(scopeLabel).toUpperCase()}
                                        </Badge>
                                    )}
                                    {flowStep && (
                                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                            Langkah {flowStep.current} dari {flowStep.total}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-2" />
                            <p>Memuat data pekerjaan...</p>
                        </div>
                    ) : groupedByCategory.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-200 p-8 text-center">
                            {canGenerateSerahTerima ? (
                                <>
                                    <CheckCircle className="w-12 h-12 mb-3 text-green-500" />
                                    <p className="font-semibold text-lg text-slate-800">Semua Opname Selesai</p>
                                    <p className="text-sm mt-2">Seluruh item pekerjaan telah melalui proses opname. Tutup modal ini dan gunakan tombol <strong>Generate Serah Terima</strong> pada panel utama ULOK.</p>
                                </>
                            ) : completedPengawasanCount > 0 ? (
                                <>
                                    <AlertCircle className="w-12 h-12 mb-3 text-amber-500" />
                                    <p className="font-semibold text-lg text-slate-800">Opname Belum Terbentuk</p>
                                    <p className="text-sm mt-2">
                                        Terdapat {completedPengawasanCount} pekerjaan selesai, tetapi data opname belum berhasil dimuat.
                                        Muat ulang halaman lalu buka kembali form ini sebelum membuat PDF Serah Terima.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Info className="w-12 h-12 mb-3 text-slate-300" />
                                    <p className="font-semibold text-lg">Tidak ada pekerjaan yang selesai</p>
                                    <p className="text-sm">Belum ada item pekerjaan yang telah disubmit sebagai Selesai.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        groupedByCategory.map((category, i) => {
                            const isIlCategory = String(category.name || '').startsWith('[IL]');
                            return (
                                <div key={i} className={`bg-white border rounded-xl shadow-sm overflow-hidden mb-6 ${isIlCategory ? 'border-indigo-200' : 'border-slate-200'}`}>
                                    <div className={`px-5 py-3 border-b flex justify-between items-center ${isIlCategory ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                                        <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                                            {isIlCategory && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">IL</span>}
                                            {category.name}
                                        </h3>
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">{category.items.length} Item</Badge>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {category.items.map((item, j) => {
                                            const isIlItem = item.source_type === 'IL';
                                            const itemKey = item.source_key || item.id;
                                            const input = opnameInputs[itemKey] || {};
                                            const volAkhir = parseDecimalInput(input.volume_akhir);
                                            const selisih = volAkhir - item.volume_rab;
                                            const hargaSatuan = item.harga_material + item.harga_upah;
                                            const totalHargaRAB = item.volume_rab * hargaSatuan;
                                            const totalHargaBaru = volAkhir * hargaSatuan;
                                            const selisihHarga = totalHargaBaru - totalHargaRAB;

                                            const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

                                            return (
                                                <div key={j} className={`border p-4 rounded-lg flex flex-col gap-4 ${isIlItem ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50'}`}>
                                                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex justify-between items-center">
                                                        <span className="flex items-center gap-2">
                                                            {isIlItem && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Instruksi Lapangan</span>}
                                                            {item.jenis_pekerjaan}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-1 rounded">Material: {formatRp(item.harga_material)}</span>
                                                            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-1 rounded">Upah: {formatRp(item.harga_upah)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">

                                                        {/* Kolom 1: Info RAB, Input Volume, dan Kalkulasi Harga */}
                                                        <div className="space-y-3 bg-white p-3 rounded border border-slate-200 shadow-sm col-span-1">
                                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b pb-1 mb-2">Volume & Biaya</h4>
                                                            <div className="flex justify-between items-center text-xs text-slate-600">
                                                                <span>Vol Awal (RAB):</span>
                                                                <span className="font-bold">{item.volume_rab} <span className="text-[10px] text-slate-400 font-normal ml-0.5">{item.satuan}</span></span>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Volume Akhir Opname</label>
                                                                <div className="relative mt-1">
                                                                    <input type="text" inputMode="decimal" className="w-full p-1.5 border border-slate-300 rounded text-sm bg-blue-50 focus:bg-white focus:border-blue-500 focus:outline-none font-bold pr-12"
                                                                        value={input.volume_akhir ?? ''}
                                                                        onChange={(e) => handleSetOpname(itemKey, 'volume_akhir', normalizeVolumeInput(e.target.value))} />
                                                                    {item.satuan && <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold uppercase">{item.satuan}</span>}
                                                                </div>
                                                                <div className="text-[10px] text-right mt-1 text-slate-500">
                                                                    Selisih Vol: <span className={`font-bold ${selisih > 0 ? 'text-blue-600' : (selisih < 0 ? 'text-red-600' : '')}`}>{selisih > 0 ? '+' + selisih : selisih} <span className="font-normal text-slate-400 ml-0.5">{item.satuan}</span></span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] space-y-1.5 mt-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Total Harga RAB:</span>
                                                                    <span className="font-medium">{formatRp(totalHargaRAB)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-700 font-semibold">Total Harga Opname:</span>
                                                                    <span className="font-bold text-slate-800">{formatRp(totalHargaBaru)}</span>
                                                                </div>
                                                                <div className="flex justify-between border-t pt-1 border-slate-200">
                                                                    <span className="text-slate-600">Selisih Biaya:</span>
                                                                    <span className={`font-bold ${selisihHarga > 0 ? 'text-blue-600' : (selisihHarga < 0 ? 'text-red-600' : 'text-slate-500')}`}>
                                                                        {selisihHarga > 0 ? '+' : ''}{formatRp(selisihHarga)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Kolom 2: Verifikasi Mutu */}
                                                        <div className="space-y-3 bg-white p-3 rounded border border-slate-200 shadow-sm col-span-1">
                                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b pb-1 mb-2">Verifikasi Pekerjaan</h4>
                                                            <div>
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Desain</label>
                                                                <select className="w-full p-1.5 border border-slate-300 rounded mt-1 text-xs focus:border-blue-500 focus:outline-none bg-slate-50" value={input.desain || ''} onChange={(e) => handleSetOpname(itemKey, 'desain', e.target.value)}>
                                                                    <option value="">-- Pilih --</option>
                                                                    <option value="Sesuai">Sesuai</option>
                                                                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Kualitas</label>
                                                                <select className="w-full p-1.5 border border-slate-300 rounded mt-1 text-xs focus:border-blue-500 focus:outline-none bg-slate-50" value={input.kualitas || ''} onChange={(e) => handleSetOpname(itemKey, 'kualitas', e.target.value)}>
                                                                    <option value="">-- Pilih --</option>
                                                                    <option value="Baik">Baik</option>
                                                                    <option value="Tidak Baik">Tidak Baik</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Spesifikasi</label>
                                                                <select className="w-full p-1.5 border border-slate-300 rounded mt-1 text-xs focus:border-blue-500 focus:outline-none bg-slate-50" value={input.spesifikasi || ''} onChange={(e) => handleSetOpname(itemKey, 'spesifikasi', e.target.value)}>
                                                                    <option value="">-- Pilih --</option>
                                                                    <option value="Sesuai">Sesuai</option>
                                                                    <option value="Tidak Sesuai">Tidak Sesuai</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Kolom 3: Catatan & Foto Dokumentasi */}
                                                        <div className="space-y-3 bg-white p-3 rounded border border-slate-200 shadow-sm col-span-1 flex flex-col">
                                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b pb-1 mb-2">Catatan & Dokumentasi</h4>
                                                            <div className="flex-1 flex flex-col">
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Catatan Opname</label>
                                                                <textarea className="w-full p-2 border border-slate-300 rounded mt-1 text-xs focus:border-blue-500 focus:outline-none placeholder:text-slate-300 bg-slate-50 flex-1 resize-none min-h-15" placeholder="Masukkan keterangan selisih atau masalah kualitas..." value={input.catatan || ''} onChange={(e) => handleSetOpname(itemKey, 'catatan', e.target.value)}></textarea>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Foto Bukti (Drive)</label>
                                                                <input type="file" className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1 cursor-pointer border border-slate-200 rounded p-1"
                                                                    accept="image/*" onChange={(e) => handleSetOpname(itemKey, 'file', e.target.files?.[0] || null)} />
                                                                {!input.file && input.existing_foto && (
                                                                    <div className="mt-2 flex items-center gap-2 p-1.5 bg-blue-50 border border-blue-100 rounded">
                                                                        <div className="w-8 h-8 rounded overflow-hidden border border-blue-200 bg-white shrink-0">
                                                                            <img src={input.existing_foto} alt="Existing" className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[9px] font-bold text-blue-700 uppercase">Foto lama tersedia</p>
                                                                            <a href={input.existing_foto} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 hover:underline truncate block">Lihat full size</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-5 border-t bg-white flex justify-end gap-3 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-10">
                    <Button variant="outline" className="font-semibold" onClick={onClose}>Kembali</Button>
                    {flowStep && (
                        <Button
                            variant="outline"
                            className="font-semibold text-slate-600"
                            onClick={() => onNavigateScope?.(nextScopeLabel ? flowStep.current : 0)}
                            disabled={isSubmitting}
                        >
                            {nextScopeLabel ? `Lanjut ke ${String(nextScopeLabel).toUpperCase()}` : 'Kembali ke SIPIL'}
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting
                            || (groupedByCategory.length > 0 && !isSubmitValid)
                            || groupedByCategory.length === 0
                        }
                        className="bg-blue-600 hover:bg-blue-700 px-8 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            : <Send className="w-4 h-4 mr-2" />}
                        {groupedByCategory.length === 0
                            ? "Tidak Ada Item Opname"
                            : "Submit Opname"}
                    </Button>
                </div>
            </div>
        </div>
    );
}


export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                <p className="font-semibold text-slate-600">Memuat Gantt Chart Workspace...</p>
            </div>
        }>
            <GanttBoard />
        </Suspense>
    );
}
