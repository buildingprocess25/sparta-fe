"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Database,
    FileSpreadsheet,
    Info,
    Loader2,
    Search,
    ShieldAlert,
    Upload,
    XCircle,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { useSession } from "@/context/SessionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    commitGanttMigration,
    previewGanttMigration,
    type GanttMigrationAction,
    type GanttMigrationSelection,
} from "@/lib/api";

type DbState =
    | "ready_insert"
    | "existing_source_match"
    | "existing_changed"
    | "invalid";

type DurationStatus = "short" | "exact" | "exceeds" | "spk_missing";

type PreviewDetail = {
    nomor_ulok: string;
    lingkup_pekerjaan: string;
    nama_toko: string;
    cabang: string;
    sheet_count: number;
    source_max_h: number;
    spk_duration: number | null;
    duration_status: DurationStatus;
    db_state: DbState;
    existing_gantt_id: number | null;
    existing_gantt_status: string | null;
    existing_matches_source: boolean;
    pengawasan_count: number;
    issues: string[];
    warnings: string[];
    allowed_actions: GanttMigrationAction[];
};

type PreviewResult = {
    total_rows: number;
    total_groups: number;
    ready_insert_count: number;
    existing_source_match_count: number;
    existing_changed_count: number;
    invalid_count: number;
    short_count: number;
    details: PreviewDetail[];
};

type CommitResult = {
    total_selected: number;
    inserted: number;
    inserted_scaled: number;
    replaced: number;
    scaled: number;
    skipped: number;
};

type Message = {
    type: "success" | "error" | "info" | "warning";
    text: string;
};

const formatNumber = (value?: number | null) =>
    new Intl.NumberFormat("id-ID").format(value ?? 0);

const detailKey = (detail: Pick<PreviewDetail, "nomor_ulok" | "lingkup_pekerjaan">) =>
    `${detail.nomor_ulok}\u0000${detail.lingkup_pekerjaan}`;

const defaultAction = (detail: PreviewDetail): GanttMigrationAction =>
    detail.db_state === "ready_insert" ? "insert_source" : "skip";

const actionLabel: Record<GanttMigrationAction, string> = {
    insert_source: "Insert sesuai sumber",
    replace_source: "Replace sesuai sumber",
    skip: "Skip",
};

const stateLabel: Record<DbState, string> = {
    ready_insert: "Siap insert",
    existing_source_match: "Existing cocok sumber",
    existing_changed: "Existing sudah berubah",
    invalid: "Invalid",
};

const stateClass: Record<DbState, string> = {
    ready_insert: "border-emerald-200 bg-emerald-50 text-emerald-700",
    existing_source_match: "border-sky-200 bg-sky-50 text-sky-700",
    existing_changed: "border-amber-200 bg-amber-50 text-amber-800",
    invalid: "border-red-200 bg-red-50 text-red-700",
};

const durationLabel: Record<DurationStatus, string> = {
    short: "Jadwal lebih pendek",
    exact: "Sesuai",
    exceeds: "Melewati SPK",
    spk_missing: "SPK tidak ada",
};

export default function GanttMigrasiPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [actions, setActions] = useState<Record<string, GanttMigrationAction>>({});
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | DbState | "short">("all");
    const [message, setMessage] = useState<Message | null>(null);

    const filteredDetails = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return (preview?.details ?? []).filter((detail) => {
            const matchesQuery = !query || [
                detail.nomor_ulok,
                detail.lingkup_pekerjaan,
                detail.nama_toko,
                detail.cabang,
            ].some((value) => value.toLowerCase().includes(query));
            const matchesStatus = statusFilter === "all"
                || (statusFilter === "short"
                    ? detail.duration_status === "short"
                    : detail.db_state === statusFilter);
            return matchesQuery && matchesStatus;
        });
    }, [preview, searchQuery, statusFilter]);

    const selectedDetails = useMemo(
        () => (preview?.details ?? []).filter((detail) => selectedKeys.has(detailKey(detail))),
        [preview, selectedKeys]
    );

    const executableCount = useMemo(
        () => selectedDetails.filter(
            (detail) => (actions[detailKey(detail)] ?? defaultAction(detail)) !== "skip"
        ).length,
        [actions, selectedDetails]
    );

    const filteredSelectableDetails = useMemo(
        () => filteredDetails.filter((detail) => detail.db_state !== "invalid"),
        [filteredDetails]
    );

    const allFilteredSelectableSelected = filteredSelectableDetails.length > 0
        && filteredSelectableDetails.every((detail) => selectedKeys.has(detailKey(detail)));

    if (user && !user.isSuperHuman) {
        return (
            <div className="min-h-screen bg-slate-50">
                <AppNavbar title="Migrasi Gantt Chart" showBackButton backHref="/gantt" />
                <main className="mx-auto max-w-xl p-8">
                    <Card className="border-red-200 shadow-sm">
                        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                            <ShieldAlert className="h-14 w-14 text-red-400" />
                            <h1 className="text-xl font-bold text-slate-900">Akses Ditolak</h1>
                            <p className="text-sm text-slate-500">
                                Fitur Migrasi Gantt Chart hanya dapat diakses oleh Super Human.
                            </p>
                            <Link href="/gantt">
                                <Button variant="outline" className="mt-2 gap-2">
                                    <ArrowLeft className="h-4 w-4" /> Kembali ke Gantt
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFile(event.target.files?.[0] ?? null);
        setPreview(null);
        setActions({});
        setSelectedKeys(new Set());
        setCommitResult(null);
        setMessage(null);
    };

    const handlePreview = async () => {
        if (!file) {
            setMessage({ type: "error", text: "Pilih file Excel terlebih dahulu." });
            return;
        }

        setIsPreviewing(true);
        setPreview(null);
        setActions({});
        setSelectedKeys(new Set());
        setCommitResult(null);
        setMessage(null);
        try {
            const response = await previewGanttMigration(file);
            const nextPreview = response.data as PreviewResult;
            setPreview(nextPreview);
            setActions(Object.fromEntries(
                nextPreview.details.map((detail) => [detailKey(detail), defaultAction(detail)])
            ));
            setSelectedKeys(new Set(
                nextPreview.details
                    .filter((detail) => detail.db_state === "ready_insert")
                    .map(detailKey)
            ));
            setMessage({
                type: "info",
                text: "Analisis selesai. Gantt siap insert dicentang otomatis; existing tetap Skip sampai aksinya dipilih.",
            });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Gagal membuat analisis.",
            });
        } finally {
            setIsPreviewing(false);
        }
    };

    const setAction = (detail: PreviewDetail, action: GanttMigrationAction) => {
        setActions((current) => ({ ...current, [detailKey(detail)]: action }));
        setCommitResult(null);
    };

    const toggleRow = (detail: PreviewDetail, checked: boolean) => {
        if (detail.db_state === "invalid") return;
        setSelectedKeys((current) => {
            const next = new Set(current);
            const key = detailKey(detail);
            if (checked) next.add(key);
            else next.delete(key);
            return next;
        });
        setCommitResult(null);
    };

    const toggleAllFiltered = (checked: boolean) => {
        setSelectedKeys((current) => {
            const next = new Set(current);
            filteredSelectableDetails.forEach((detail) => {
                const key = detailKey(detail);
                if (checked) next.add(key);
                else next.delete(key);
            });
            return next;
        });
        setCommitResult(null);
    };

    const applyBulkAction = (
        predicate: (detail: PreviewDetail) => boolean,
        action: GanttMigrationAction
    ) => {
        if (!preview) return;
        const matchingDetails = preview.details.filter(
            (detail) => predicate(detail) && detail.allowed_actions.includes(action)
        );
        const matchingKeys = matchingDetails.map(detailKey);
        setActions((current) => {
            const next = { ...current };
            matchingDetails.forEach((detail) => {
                next[detailKey(detail)] = action;
            });
            return next;
        });
        setSelectedKeys((current) => new Set([...current, ...matchingKeys]));
        setCommitResult(null);
    };

    const handleCommit = async () => {
        if (!file || !preview) return;
        const selections: GanttMigrationSelection[] = selectedDetails.map((detail) => ({
            nomor_ulok: detail.nomor_ulok,
            lingkup_pekerjaan: detail.lingkup_pekerjaan,
            action: actions[detailKey(detail)] ?? defaultAction(detail),
        }));

        if (selections.length === 0) {
            setMessage({ type: "warning", text: "Pilih minimal satu Gantt untuk diproses." });
            return;
        }

        if (executableCount === 0) {
            setMessage({ type: "warning", text: "Semua Gantt yang dicentang masih Skip. Pilih minimal satu aksi migrasi." });
            return;
        }

        if (!window.confirm(
            `Proses ${formatNumber(executableCount)} dari ${formatNumber(selections.length)} Gantt yang dicentang? Pengawasan existing akan dipertahankan.`
        )) return;

        setIsCommitting(true);
        setMessage(null);
        try {
            const response = await commitGanttMigration(
                file,
                user?.email || "system@migrasi.com",
                user?.roles?.join(", ") || "SUPER HUMAN",
                selections
            );
            setCommitResult(response.data as CommitResult);
            setMessage({ type: "success", text: "Migrasi Gantt berhasil diproses." });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Gagal memproses migrasi.",
            });
        } finally {
            setIsCommitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar
                title="Migrasi Gantt Chart"
                showBackButton
                backHref="/gantt"
                rightActions={
                    <Badge className="border-none bg-red-700 px-3 py-1 text-xs font-bold text-white">
                        SUPER HUMAN ONLY
                    </Badge>
                }
            />

            <main className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-950">Rekonsiliasi Gantt Chart</h1>
                    <p className="mt-1 max-w-4xl text-sm text-slate-500">
                        Bandingkan file sumber dengan Gantt DB dan durasi SPK. Durasi SPK mengatur panjang
                        timeline, sedangkan rentang setiap pekerjaan tetap mengikuti day_gantt_chart.
                    </p>
                </div>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="h-5 w-5 text-red-700" />
                            File Migrasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="h-11 rounded-lg bg-white"
                            />
                            <Button
                                variant="outline"
                                className="h-11 rounded-lg"
                                disabled={!file || isPreviewing || isCommitting}
                                onClick={handlePreview}
                            >
                                {isPreviewing
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Database className="mr-2 h-4 w-4" />}
                                Analisis File
                            </Button>
                            <Button
                                className="h-11 rounded-lg bg-red-700 font-bold text-white hover:bg-red-800"
                                disabled={!file || !preview || executableCount === 0 || isPreviewing || isCommitting}
                                onClick={handleCommit}
                            >
                                {isCommitting
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Upload className="mr-2 h-4 w-4" />}
                                Proses {executableCount > 0 ? formatNumber(executableCount) : ""} Gantt
                            </Button>
                        </div>

                        {message ? (
                            <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
                                message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : message.type === "error" ? "border-red-200 bg-red-50 text-red-700"
                                        : message.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-800"
                                            : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}>
                                {message.type === "success" ? <CheckCircle2 className="h-4 w-4" />
                                    : message.type === "error" ? <XCircle className="h-4 w-4" />
                                        : message.type === "warning" ? <AlertTriangle className="h-4 w-4" />
                                            : <Info className="h-4 w-4" />}
                                {message.text}
                            </div>
                        ) : null}
                        {preview ? (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                Rekomendasi: proses hanya <strong>Siap insert</strong>. Biarkan <strong>Existing cocok sumber</strong> tetap Skip.
                                Data <strong>Existing berubah</strong> hanya di-replace setelah diperiksa karena dapat memiliki jadwal atau pengawasan existing.
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {preview ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            {[
                                ["Total Gantt", preview.total_groups, "text-slate-950"],
                                ["Siap Insert", preview.ready_insert_count, "text-emerald-700"],
                                ["Existing Cocok", preview.existing_source_match_count, "text-sky-700"],
                                ["Existing Berubah", preview.existing_changed_count, "text-amber-700"],
                                ["Jadwal < Durasi SPK", preview.short_count, "text-orange-700"],
                                ["Invalid", preview.invalid_count, "text-red-700"],
                            ].map(([label, value, color]) => (
                                <div key={String(label)} className="border-y border-slate-200 bg-white px-4 py-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
                                    <div className={`mt-1 text-2xl font-extrabold ${color}`}>
                                        {formatNumber(Number(value))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 bg-white px-4 py-3">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyBulkAction(
                                    (detail) => detail.db_state === "ready_insert",
                                    "insert_source"
                                )}
                            >
                                Pilih Semua Insert Baru
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setSelectedKeys(new Set());
                                    setCommitResult(null);
                                }}
                            >
                                Kosongkan Pilihan
                            </Button>
                            <span className="ml-auto text-sm font-semibold text-slate-600">
                                {formatNumber(selectedKeys.size)} dicentang
                                {selectedKeys.size > 0
                                    ? ` · ${formatNumber(executableCount)} akan diproses`
                                    : ""}
                            </span>
                        </div>

                        {commitResult ? (
                            <div className="grid gap-3 border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-5">
                                {[
                                    ["Insert", commitResult.inserted],
                                    ["Insert + Skala", commitResult.inserted_scaled],
                                    ["Replace", commitResult.replaced],
                                    ["Skala Existing", commitResult.scaled],
                                    ["Skip", commitResult.skipped],
                                ].map(([label, value]) => (
                                    <div key={String(label)}>
                                        <div className="text-xs font-bold uppercase text-emerald-600">{label}</div>
                                        <div className="text-xl font-extrabold text-emerald-900">
                                            {formatNumber(Number(value))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <CardTitle className="text-base">Kandidat Gantt</CardTitle>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative sm:w-80">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(event) => setSearchQuery(event.target.value)}
                                                placeholder="Cari ULOK, toko, cabang..."
                                                className="h-9 rounded-lg pl-9"
                                            />
                                        </div>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                                        >
                                            <SelectTrigger className="h-9 w-full rounded-lg sm:w-52">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua status</SelectItem>
                                                <SelectItem value="ready_insert">Siap insert</SelectItem>
                                                <SelectItem value="existing_source_match">Existing cocok</SelectItem>
                                                <SelectItem value="existing_changed">Existing berubah</SelectItem>
                                                <SelectItem value="short">Jadwal lebih pendek dari SPK</SelectItem>
                                                <SelectItem value="invalid">Invalid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1300px] text-left text-sm">
                                        <thead className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    <Checkbox
                                                        checked={allFilteredSelectableSelected}
                                                        onCheckedChange={(value) => toggleAllFiltered(Boolean(value))}
                                                        aria-label="Pilih semua hasil filter"
                                                    />
                                                </th>
                                                <th className="px-4 py-3">ULOK / Toko</th>
                                                <th className="px-4 py-3">Lingkup</th>
                                                <th className="px-4 py-3 text-center">H Sumber</th>
                                                <th className="px-4 py-3 text-center">Durasi SPK</th>
                                                <th className="px-4 py-3">Rentang</th>
                                                <th className="px-4 py-3">Status DB</th>
                                                <th className="px-4 py-3 text-center">Pengawasan</th>
                                                <th className="px-4 py-3">Aksi</th>
                                                <th className="px-4 py-3">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredDetails.map((detail) => {
                                                const key = detailKey(detail);
                                                const selected = selectedKeys.has(key);
                                                const isInvalid = detail.db_state === "invalid";
                                                const currentAction = actions[detailKey(detail)] ?? "skip";
                                                return (
                                                    <tr
                                                        key={key}
                                                        className={selected ? "bg-red-50/30" : "bg-white hover:bg-slate-50"}
                                                    >
                                                        <td className="px-4 py-3 align-top">
                                                            <Checkbox
                                                                checked={selected}
                                                                disabled={isInvalid}
                                                                onCheckedChange={(value) => toggleRow(detail, Boolean(value))}
                                                                aria-label={`Pilih Gantt ${detail.nomor_ulok} ${detail.lingkup_pekerjaan}`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-900">{detail.nomor_ulok}</div>
                                                            <div className="max-w-64 truncate text-xs text-slate-500">
                                                                {detail.nama_toko || "-"} · {detail.cabang || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-slate-700">
                                                            {detail.lingkup_pekerjaan || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-bold">
                                                            H{detail.source_max_h || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-bold">
                                                            {detail.spk_duration ? `H${detail.spk_duration}` : "-"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={detail.duration_status === "exact"
                                                                    ? "border-emerald-200 text-emerald-700"
                                                                    : detail.duration_status === "short"
                                                                        ? "border-orange-200 text-orange-700"
                                                                        : "border-slate-200 text-slate-600"}
                                                            >
                                                                {durationLabel[detail.duration_status]}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={stateClass[detail.db_state]}
                                                            >
                                                                {stateLabel[detail.db_state]}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={detail.pengawasan_count > 0
                                                                ? "font-bold text-sky-700"
                                                                : "text-slate-400"}>
                                                                {formatNumber(detail.pengawasan_count)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Select
                                                                value={currentAction}
                                                                disabled={isInvalid || !selected}
                                                                onValueChange={(value) =>
                                                                    setAction(detail, value as GanttMigrationAction)}
                                                            >
                                                                <SelectTrigger className="h-9 w-56 rounded-lg">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {detail.allowed_actions.map((action) => (
                                                                        <SelectItem key={action} value={action}>
                                                                            {actionLabel[action]}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            {detail.issues.length > 0 ? (
                                                                <div className="max-w-72 text-red-600">
                                                                    {detail.issues.join("; ")}
                                                                </div>
                                                            ) : detail.warnings.length > 0 ? (
                                                                <div className="max-w-72 text-amber-700">
                                                                    {detail.warnings.join("; ")}
                                                                </div>
                                                            ) : detail.db_state === "existing_changed" ? (
                                                                <div className="max-w-72 text-amber-700">
                                                                    Kategori/periode DB berbeda dari hasil migrasi lama. Review manual.
                                                                </div>
                                                            ) : detail.pengawasan_count > 0 ? (
                                                                <div className="max-w-72 text-sky-700">
                                                                    Pengawasan existing dipertahankan saat replace/skala.
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">
                                                                    {formatNumber(detail.sheet_count)} periode sumber
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredDetails.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                                                        Tidak ada kandidat yang cocok dengan filter.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </main>
        </div>
    );
}
