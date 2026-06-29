"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import {
    fetchApprovalNotificationItems,
    type ApprovalNotificationItem,
} from "@/lib/approval-notifications";
import {
    checkRevisionStatus,
    fetchInstruksiLapanganList,
    fetchOpnameFinalList,
    fetchPICPengawasanList,
    fetchPertambahanSPKList,
    fetchRabProjectPlanningRequests,
    fetchSPKList,
    fetchTaskNotifications,
    type TaskNotificationGroup,
    type TaskNotificationItem,
} from "@/lib/api";
import { Bell, ArrowLeft, ChevronRight, ClipboardCheck, FileCheck2, Loader2 } from "lucide-react";

type PanelGroup = {
    key: string;
    title: string;
    description: string;
    count: number;
    items: TaskNotificationItem[];
    accent: string;
};

const APPROVAL_LABELS: Record<string, string> = {
    RAB: "Approval RAB",
    SPK: "Approval SPK",
    PERTAMBAHAN_SPK: "Approval Pertambahan SPK",
    OPNAME: "Approval KTK",
    INSTRUKSI_LAPANGAN: "Approval Instruksi Lapangan",
    PROJECT_PLANNING: "Approval Project Planning",
};

const buildApprovalGroup = (approvalItems: ApprovalNotificationItem[]): PanelGroup => {
    const items = approvalItems.map((item) => ({
            id: item.id,
            entity_type: item.tipe,
            entity_id: Number(item.entity_id) || 0,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description,
            action_label: APPROVAL_LABELS[item.tipe] ?? "Buka Approval",
            action_url: item.action_url,
        }));

    return {
        key: "approval_pending",
        title: "Approval Menunggu",
        description: "Dokumen yang menunggu persetujuan role Anda.",
        count: approvalItems.length,
        items,
        accent: "bg-sky-50 text-sky-700 border-sky-200",
    };
};

const isContractorUser = (user: NonNullable<ReturnType<typeof useSession>["user"]>) =>
    user.roles.some(role => role.includes("KONTRAKTOR"));

const normalizeBranch = (value?: string | null) =>
    String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();

const isSameBranchScope = (itemCabang: string | null | undefined, userCabang: string) => {
    const item = normalizeBranch(itemCabang);
    const user = normalizeBranch(userCabang);
    if (!item || !user || item === "-") return true;
    const groups = [
        ["LOMBOK", "SUMBAWA"],
        ["CIKOKOL", "BINTAN"],
        ["MEDAN", "ACEH"],
        ["LAMPUNG", "KOTABUMI"],
        ["PALEMBANG", "BENGKULU", "BANGKA", "BELITUNG"],
        ["SIDOARJO", "SIDOARJO BPN_SMD", "MANOKWARI", "NTT", "SORONG"],
    ];
    const group = groups.find(items => items.includes(user));
    return group ? group.includes(item) : item === user;
};

const canSeeBranchItem = (user: NonNullable<ReturnType<typeof useSession>["user"]>, cabang?: string | null) =>
    user.isHO || user.isSuperHuman || user.isRegionalManager || isSameBranchScope(cabang, user.cabang);

const canReceivePicTask = (user: NonNullable<ReturnType<typeof useSession>["user"]>) =>
    user.isSuperHuman
    || user.roles.some(role =>
        role.includes("BRANCH BUILDING COORDINATOR")
        || role.includes("BRANCH BUILDING & MAINTENANCE MANAGER")
    );

const canReceiveRevisionTask = (user: NonNullable<ReturnType<typeof useSession>["user"]>) =>
    user.isSuperHuman
    || user.roles.some(role =>
        role.includes("KONTRAKTOR")
        || role.includes("BRANCH BUILDING COORDINATOR")
        || role.includes("BRANCH BUILDING & MAINTENANCE MANAGER")
        || role.includes("BRANCH MANAGER")
        || role.includes("SUPPORT")
    );

const mapBackendGroup = (group: TaskNotificationGroup): PanelGroup => ({
    ...group,
    accent: group.key === "support_ktk_ready"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : group.key === "revision_rejected"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : group.key === "rab_project_planning_request"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-700 border-slate-200",
});

export default function TaskNotificationBell({ variant = "brand" }: { variant?: "brand" | "clean" }) {
    const router = useRouter();
    const { user, isLoading } = useSession();
    const [open, setOpen] = useState(false);
    const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [approvalItems, setApprovalItems] = useState<ApprovalNotificationItem[]>([]);
    const [backendGroups, setBackendGroups] = useState<PanelGroup[]>([]);
    const [localGroups, setLocalGroups] = useState<PanelGroup[]>([]);
    const [autoPopupDone, setAutoPopupDone] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [approvalItemsResult, taskResult, revisionResult, planningResult, spkRejectedResult, pspkRejectedResult, ilRejectedResult, ktkRejectedResult, spkApprovedResult] = await Promise.allSettled([
                fetchApprovalNotificationItems(user),
                fetchTaskNotifications({ suppressGlobalError: true }),
                checkRevisionStatus(user.email, user.cabang),
                isContractorUser(user)
                    ? fetchRabProjectPlanningRequests(user.email, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", count: 0, data: [] }),
                canReceiveRevisionTask(user)
                    ? fetchSPKList({ status: "SPK_REJECTED" }, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", data: [] }),
                canReceiveRevisionTask(user)
                    ? fetchPertambahanSPKList({ status_persetujuan: "Ditolak BM" }, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", data: [] }),
                canReceiveRevisionTask(user)
                    ? fetchInstruksiLapanganList({ status: "Ditolak" }, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", data: [] }),
                canReceiveRevisionTask(user)
                    ? fetchOpnameFinalList({ aksi: "terkunci", tipe_opname: "OPNAME_FINAL" }, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", data: [] }),
                canReceivePicTask(user)
                    ? fetchSPKList({ status: "SPK_APPROVED" }, { suppressGlobalError: true })
                    : Promise.resolve({ status: "success", data: [] }),
            ]);

            if (approvalItemsResult.status === "fulfilled") setApprovalItems(approvalItemsResult.value);
            else setApprovalItems([]);

            if (taskResult.status === "fulfilled") {
                setBackendGroups((taskResult.value.data?.groups ?? []).map(mapBackendGroup));
            } else {
                setBackendGroups([]);
            }

            const nextLocalGroups: PanelGroup[] = [];
            if (revisionResult.status === "fulfilled") {
                const revisions = revisionResult.value.rejected_submissions ?? [];
                nextLocalGroups.push(mapBackendGroup({
                    key: "revision_rejected",
                    title: "Revisi / Ditolak",
                    description: "Dokumen yang dikembalikan dan perlu diperbaiki.",
                    count: revisions.length,
                    items: revisions.map((item: any) => ({
                        id: `rab-revision-${item.id ?? item["Nomor Ulok"]}`,
                        entity_type: "RAB_REJECTED",
                        entity_id: Number(item.id || 0),
                        title: item.nama_toko || item["Nomor Ulok"] || "RAB Ditolak",
                        subtitle: [item["Nomor Ulok"], item.lingkup_pekerjaan || item["Lingkup Pekerjaan"], item.Proyek || item["Proyek"]].filter(Boolean).join(" | "),
                        description: item.alasan_penolakan ? `Alasan: ${item.alasan_penolakan}` : "RAB perlu direvisi dan diajukan ulang.",
                        action_label: "Revisi RAB",
                        action_url: item.id ? `/rab?revision_id=${item.id}` : "/rab",
                        metadata: item,
                    })),
                }));
            }

            const rejectedItems: TaskNotificationItem[] = [];
            if (spkRejectedResult.status === "fulfilled") {
                rejectedItems.push(...(spkRejectedResult.value.data ?? [])
                    .filter((item: any) => canSeeBranchItem(user, item.toko?.cabang))
                    .map((item: any) => ({
                        id: `spk-rejected-${item.id}`,
                        entity_type: "SPK_REJECTED",
                        entity_id: Number(item.id || 0),
                        id_toko: item.id_toko,
                        title: item.toko?.nama_toko || item.nomor_ulok || "SPK Ditolak",
                        subtitle: [item.nomor_ulok, item.lingkup_pekerjaan, item.toko?.cabang].filter(Boolean).join(" | "),
                        description: item.alasan_penolakan ? `Alasan: ${item.alasan_penolakan}` : "SPK perlu diperbaiki/diajukan ulang.",
                        action_label: "Buka SPK",
                        action_url: `/spk?nomor_ulok=${encodeURIComponent(item.nomor_ulok || '')}&lingkup=${encodeURIComponent(item.lingkup_pekerjaan || '')}&id_toko=${encodeURIComponent(String(item.id_toko || ''))}`,
                        metadata: item,
                    })));
            }
            if (pspkRejectedResult.status === "fulfilled") {
                rejectedItems.push(...(pspkRejectedResult.value.data ?? [])
                    .filter((item: any) => canSeeBranchItem(user, item.toko?.cabang ?? item.spk?.cabang))
                    .map((item: any) => ({
                        id: `pspk-rejected-${item.id}`,
                        entity_type: "PERTAMBAHAN_SPK_REJECTED",
                        entity_id: Number(item.id || 0),
                        title: item.toko?.nama_toko || item.spk?.nama_toko || item.nomor_spk || "Pertambahan SPK Ditolak",
                        subtitle: [item.toko?.nomor_ulok || item.spk?.nomor_ulok, item.nomor_spk, item.toko?.cabang || item.spk?.cabang].filter(Boolean).join(" | "),
                        description: item.alasan_penolakan ? `Alasan: ${item.alasan_penolakan}` : "Pertambahan SPK perlu diperbaiki.",
                        action_label: "Buka Pertambahan SPK",
                        action_url: item.id_spk || item.spk?.id ? `/tambahspk?spk_id=${encodeURIComponent(String(item.id_spk || item.spk?.id))}&pertambahan_id=${encodeURIComponent(String(item.id || ''))}` : "/tambahspk",
                        metadata: item,
                    })));
            }
            if (ilRejectedResult.status === "fulfilled") {
                rejectedItems.push(...(ilRejectedResult.value.data ?? [])
                    .filter((item: any) => canSeeBranchItem(user, item.cabang))
                    .map((item: any) => ({
                        id: `il-rejected-${item.id}`,
                        entity_type: "INSTRUKSI_LAPANGAN_REJECTED",
                        entity_id: Number(item.id || 0),
                        id_toko: item.id_toko,
                        title: item.nama_toko || item.nomor_ulok || "Instruksi Lapangan Ditolak",
                        subtitle: [item.nomor_ulok, item.lingkup_pekerjaan, item.cabang].filter(Boolean).join(" | "),
                        description: item.alasan_penolakan ? `Alasan: ${item.alasan_penolakan}` : "Instruksi Lapangan perlu diperbaiki.",
                        action_label: "Buka Instruksi Lapangan",
                        action_url: `/instruksi-lapangan?revision_id=${encodeURIComponent(String(item.id || ''))}&id_toko=${encodeURIComponent(String(item.id_toko || ''))}`,
                        metadata: item,
                    })));
            }
            if (ktkRejectedResult.status === "fulfilled") {
                const rows = Array.isArray(ktkRejectedResult.value.data)
                    ? ktkRejectedResult.value.data
                    : Array.isArray((ktkRejectedResult.value.data as any)?.opname_final)
                        ? (ktkRejectedResult.value.data as any).opname_final
                        : [];
                rejectedItems.push(...rows
                    .filter((item: any) => String(item.status_opname_final || "").toUpperCase().includes("DITOLAK"))
                    .filter((item: any) => canSeeBranchItem(user, item.cabang))
                    .map((item: any) => ({
                        id: `ktk-rejected-${item.id}`,
                        entity_type: "OPNAME_FINAL_REJECTED",
                        entity_id: Number(item.id || 0),
                        id_toko: item.id_toko,
                        title: item.nama_toko || item.nomor_ulok || "KTK Ditolak",
                        subtitle: [item.nomor_ulok, item.lingkup_pekerjaan, item.cabang].filter(Boolean).join(" | "),
                        description: item.alasan_penolakan ? `Alasan: ${item.alasan_penolakan}` : item.status_opname_final || "KTK perlu diperbaiki.",
                        action_label: "Buka Opname",
                        action_url: item.id_toko ? `/opname?id_toko=${item.id_toko}` : "/opname",
                        metadata: item,
                    })));
            }

            if (rejectedItems.length > 0) {
                const existingRevisionGroup = nextLocalGroups.find(group => group.key === "revision_rejected");
                if (existingRevisionGroup) {
                    existingRevisionGroup.items.push(...rejectedItems);
                    existingRevisionGroup.count = existingRevisionGroup.items.length;
                } else {
                    nextLocalGroups.push(mapBackendGroup({
                        key: "revision_rejected",
                        title: "Revisi / Ditolak",
                        description: "Dokumen yang dikembalikan dan perlu diperbaiki.",
                        count: rejectedItems.length,
                        items: rejectedItems,
                    }));
                }
            }

            if (planningResult.status === "fulfilled") {
                const requests = planningResult.value.data ?? [];
                nextLocalGroups.push(mapBackendGroup({
                    key: "rab_project_planning_request",
                    title: "Permintaan RAB Project Planning",
                    description: "ULOK dari FPD yang membutuhkan penawaran RAB.",
                    count: requests.length,
                    items: requests.map((request: any) => ({
                        id: `rab-planning-${request.projek_planning_id}-${request.lingkup_pekerjaan}`,
                        entity_type: "RAB_PROJECT_PLANNING_REQUEST",
                        entity_id: Number(request.projek_planning_id || 0),
                        id_toko: request.id_toko ?? undefined,
                        title: request.nama_toko || request.nama_lokasi || request.nomor_ulok || "Permintaan RAB",
                        subtitle: [request.nomor_ulok, request.lingkup_pekerjaan, request.cabang].filter(Boolean).join(" | "),
                        description: "Project Planning membutuhkan penawaran untuk melanjutkan proses.",
                        action_label: "Buat Penawaran",
                        action_url: `/rab?projek_planning_id=${request.projek_planning_id}&lingkup=${request.lingkup_pekerjaan}`,
                        metadata: request,
                    })),
                }));
            }

            if (spkApprovedResult.status === "fulfilled" && canReceivePicTask(user)) {
                const approvedSpks = (spkApprovedResult.value.data ?? [])
                    .filter((item: any) => canSeeBranchItem(user, item.toko?.cabang));
                const picChecks = await Promise.allSettled(
                    approvedSpks.map((item: any) => fetchPICPengawasanList({ id_toko: Number(item.id_toko) }))
                );
                const missingPicItems = approvedSpks.filter((item: any, index: number) => {
                    const result = picChecks[index];
                    if (result.status !== "fulfilled") return false;
                    return (result.value.data ?? []).length === 0;
                }).map((item: any) => ({
                    id: `pic-missing-${item.id_toko}`,
                    entity_type: "PIC_PENGAWASAN_MISSING",
                    entity_id: Number(item.id_toko || 0),
                    id_toko: item.id_toko,
                    title: item.toko?.nama_toko || item.nomor_ulok || "PIC Pengawasan Belum Dibuat",
                    subtitle: [item.nomor_ulok, item.lingkup_pekerjaan, item.toko?.cabang].filter(Boolean).join(" | "),
                    description: "SPK sudah approved, tetapi PIC pengawasan belum ditentukan.",
                    action_label: "Input PIC",
                    action_url: item.id_toko ? `/inputpic?id_toko=${item.id_toko}` : "/inputpic",
                    metadata: item,
                }));

                if (missingPicItems.length > 0) {
                    nextLocalGroups.push(mapBackendGroup({
                        key: "pic_pengawasan_missing",
                        title: "PIC Pengawasan",
                        description: "Proyek yang perlu penentuan PIC pengawasan.",
                        count: missingPicItems.length,
                        items: missingPicItems,
                    }));
                }
            }

            setLocalGroups(nextLocalGroups);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refresh();
        const timer = window.setInterval(refresh, 300_000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const groups = useMemo(() => {
        if (!user) return [];
        const approvalGroup = buildApprovalGroup(approvalItems);
        return [approvalGroup, ...backendGroups, ...localGroups].filter((group) => group.count > 0);
    }, [approvalItems, backendGroups, localGroups, user]);

    const total = groups.reduce((sum, group) => sum + group.count, 0);
    const activeGroup = groups.find((group) => group.key === activeGroupKey) ?? null;
    const isClean = variant === "clean";

    useEffect(() => {
        if (!user || autoPopupDone || total <= 0 || loading) return;
        const key = `sparta_task_notification_popup_${user.email}`;
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
        setAutoPopupDone(true);
        setOpen(true);
        setActiveGroupKey(null);
    }, [autoPopupDone, loading, total, user]);

    if (isLoading || !user) return null;

    const goToItem = (item: TaskNotificationItem) => {
        setOpen(false);
        setActiveGroupKey(null);
        router.push(item.action_url);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((value) => !value);
                    if (!open) refresh();
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    isClean
                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                }`}
                aria-label="Buka notifikasi"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {total > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-5 text-white shadow-md ring-2 ring-white">
                        {total > 99 ? "99+" : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                    {!activeGroup ? (
                        <>
                            <div className="border-b border-slate-100 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black">Notifikasi</p>
                                        <p className="text-xs text-slate-500">{total} perlu tindakan</p>
                                    </div>
                                    <button type="button" onClick={refresh} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200">
                                        Refresh
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-[65vh] overflow-y-auto p-2">
                                {groups.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <FileCheck2 className="mx-auto h-8 w-8 text-emerald-500" />
                                        <p className="mt-3 text-sm font-bold text-slate-800">Tidak ada tugas aktif</p>
                                        <p className="mt-1 text-xs text-slate-500">Semua notifikasi status-based sudah bersih.</p>
                                    </div>
                                ) : groups.map((group) => (
                                    <button
                                        key={group.key}
                                        type="button"
                                        onClick={() => setActiveGroupKey(group.key)}
                                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${group.accent}`}>
                                            <ClipboardCheck className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-black">{group.title}</p>
                                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">{group.count}</span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{group.description}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="border-b border-slate-100 px-4 py-3">
                                <button type="button" onClick={() => setActiveGroupKey(null)} className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Kembali
                                </button>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black">{activeGroup.title}</p>
                                        <p className="text-xs text-slate-500">{activeGroup.count} item</p>
                                    </div>
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${activeGroup.accent}`}>
                                        {activeGroup.count}
                                    </span>
                                </div>
                            </div>
                            <div className="max-h-[65vh] overflow-y-auto p-2">
                                {activeGroup.items.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => goToItem(item)}
                                        className="w-full rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-red-200 hover:bg-red-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-slate-900">{item.title}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">{item.subtitle}</p>
                                                <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                                            </div>
                                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-red-500" />
                                        </div>
                                        <p className="mt-3 text-xs font-black text-red-700">{item.action_label}</p>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
