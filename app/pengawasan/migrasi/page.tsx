"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Database,
    FileSpreadsheet,
    Loader2,
    Search,
    ShieldAlert,
    Upload,
    XCircle,
} from "lucide-react";

import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import {
    commitPengawasanMigration,
    previewPengawasanMigration,
    type PengawasanMigrationAction,
    type PengawasanMigrationCommitResult,
    type PengawasanMigrationPreviewDetail,
    type PengawasanMigrationPreviewResult,
} from "@/lib/api";

const ACTION_LABELS: Record<PengawasanMigrationAction, string> = {
    insert: "Insert baru",
    skip: "Skip",
    replace_pengawasan: "Replace pengawasan",
    update_pdf: "Update PDF",
    save_pdf_pending: "Simpan PDF pending",
};

const formatNumber = (value?: number | string | null) =>
    new Intl.NumberFormat("id-ID").format(Number(value ?? 0) || 0);

const getActorRole = (user: ReturnType<typeof useSession>["user"]) =>
    user?.roles?.length ? user.roles.join(",") : user?.role ?? "";

const getDefaultAction = (row: PengawasanMigrationPreviewDetail): PengawasanMigrationAction => {
    if (row.db_state === "ready") return "insert";
    if (row.db_state === "pdf_pending") return "save_pdf_pending";
    return "skip";
};

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export default function PengawasanMigrasiPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PengawasanMigrationPreviewResult | null>(null);
    const [commitResult, setCommitResult] = useState<PengawasanMigrationCommitResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, PengawasanMigrationAction>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [stateFilter, setStateFilter] = useState<"all" | "ready" | "conflict" | "invalid" | "missing_gantt" | "pdf_pending">("all");
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

    const actorRole = useMemo(() => getActorRole(user), [user]);
    const rows = preview?.details ?? [];

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const matchesState = stateFilter === "all"
                || (stateFilter === "missing_gantt" ? row.gantt_id === null : row.db_state === stateFilter);
            if (!matchesState) return false;
            if (!query) return true;
            return [
                row.nomor_ulok,
                row.lingkup_pekerjaan,
                row.nama_toko,
                row.cabang,
                row.pic_building_support,
                row.sheet_name,
                String(row.source_pengawasan_id),
            ].some((value) => String(value ?? "").toLowerCase().includes(query));
        });
    }, [rows, searchQuery, stateFilter]);

    const filteredGroups = useMemo(() => {
        const groups = new Map<string, PengawasanMigrationPreviewDetail[]>();
        for (const row of filteredRows) {
            const groupRows = groups.get(row.nomor_ulok) ?? [];
            groupRows.push(row);
            groups.set(row.nomor_ulok, groupRows);
        }
        return [...groups.entries()].map(([nomorUlok, groupRows]) => ({
            nomorUlok,
            rows: groupRows,
            namaToko: groupRows.find((row) => row.nama_toko)?.nama_toko ?? "",
            cabang: groupRows.find((row) => row.cabang)?.cabang ?? "",
        }));
    }, [filteredRows]);

    const selectedRows = useMemo(
        () => rows.filter((row) => selectedIds.has(row.source_pengawasan_id)),
        [rows, selectedIds]
    );

    const selectedExecutableRows = useMemo(
        () => selectedRows.filter((row) => (actions[row.source_pengawasan_id] ?? getDefaultAction(row)) !== "skip"),
        [selectedRows, actions]
    );

    const resetPreviewState = () => {
        setPreview(null);
        setCommitResult(null);
        setSelectedIds(new Set());
        setActions({});
        setMessage(null);
    };

    if (user && !user.isSuperHuman) {
        return (
            <div className="min-h-screen bg-slate-50">
                <AppNavbar title="Migrasi Pengawasan" showBackButton backHref="/gantt" />
                <main className="mx-auto max-w-2xl p-6">
                    <Card className="border-red-200 shadow-sm">
                        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                            <ShieldAlert className="h-12 w-12 text-red-500" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-950">Akses ditolak</h1>
                                <p className="mt-1 text-sm text-slate-500">Fitur migrasi Pengawasan hanya untuk Super Human.</p>
                            </div>
                            <Link href="/gantt">
                                <Button variant="outline" className="gap-2 rounded-xl">
                                    <ArrowLeft className="h-4 w-4" /> Kembali
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const handlePreview = async () => {
        if (!file) {
            setMessage({ type: "error", text: "Pilih file PENGAWASAN terlebih dahulu." });
            return;
        }

        setIsPreviewing(true);
        resetPreviewState();
        try {
            const result = await previewPengawasanMigration(file, actorRole, user?.email);
            const details = result.data.details;
            setPreview(result.data);
            setSelectedIds(new Set(
                details
                    .filter((row) => row.db_state === "ready" || row.db_state === "pdf_pending")
                    .map((row) => row.source_pengawasan_id)
            ));
            setActions(Object.fromEntries(details.map((row) => [row.source_pengawasan_id, getDefaultAction(row)])));
            setMessage({ type: "success", text: "Analisis selesai. Konflik DB default Skip, ubah aksi jika ingin menimpa." });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal menganalisis file.") });
        } finally {
            setIsPreviewing(false);
        }
    };

    const toggleRow = (row: PengawasanMigrationPreviewDetail, checked: boolean) => {
        if (row.db_state === "invalid") return;
        setSelectedIds((current) => {
            const next = new Set(current);
            if (checked) next.add(row.source_pengawasan_id);
            else next.delete(row.source_pengawasan_id);
            return next;
        });
    };

    const toggleGroup = (groupRows: PengawasanMigrationPreviewDetail[], checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            for (const row of groupRows) {
                if (row.db_state === "invalid") continue;
                if (checked) next.add(row.source_pengawasan_id);
                else next.delete(row.source_pengawasan_id);
            }
            return next;
        });
    };

    const toggleAllFiltered = (checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            for (const row of filteredRows) {
                if (row.db_state === "invalid") continue;
                if (checked) next.add(row.source_pengawasan_id);
                else next.delete(row.source_pengawasan_id);
            }
            return next;
        });
    };

    const handleCommit = async () => {
        if (!file || !preview) return;

        const selections = selectedRows.map((row) => ({
            source_pengawasan_id: row.source_pengawasan_id,
            action: actions[row.source_pengawasan_id] ?? getDefaultAction(row),
        }));

        if (selections.length === 0) {
            setMessage({ type: "warning", text: "Pilih minimal satu data pengawasan." });
            return;
        }
        if (selectedExecutableRows.length === 0) {
            setMessage({ type: "warning", text: "Semua pilihan masih Skip. Ubah minimal satu aksi migrasi." });
            return;
        }

        const confirmed = window.confirm(
            `Proses ${formatNumber(selectedExecutableRows.length)} data pengawasan? Replace akan menghapus item pengawasan lama pada tanggal target lalu mengisi ulang.`
        );
        if (!confirmed) return;

        setIsCommitting(true);
        setMessage(null);
        try {
            const result = await commitPengawasanMigration(file, actorRole, user?.email, selections);
            setCommitResult(result.data);
            setMessage({ type: "success", text: "Migrasi Pengawasan selesai diproses." });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal memproses migrasi Pengawasan.") });
        } finally {
            setIsCommitting(false);
        }
    };

    const allFilteredSelectableSelected = filteredRows
        .filter((row) => row.db_state !== "invalid")
        .every((row) => selectedIds.has(row.source_pengawasan_id));

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar
                title="Migrasi Pengawasan"
                showBackButton
                backHref="/gantt"
                rightActions={
                    <Badge className="border-none bg-red-700 px-3 py-1 text-xs font-bold text-white">
                        SUPER HUMAN ONLY
                    </Badge>
                }
            />

            <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-950">Upload Excel Pengawasan</h1>
                        <p className="mt-1 max-w-3xl text-sm text-slate-500">
                            Membaca sheet InputPIC dan DataH*. SerahTerima dan summary_serahterima tidak diproses pada migrasi ini.
                        </p>
                    </div>
                    <Link href="/gantt">
                        <Button variant="outline" className="w-fit gap-2 rounded-xl">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Gantt
                        </Button>
                    </Link>
                </div>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="h-5 w-5 text-red-700" /> File Migrasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                            <label className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">File PENGAWASAN .xlsx</span>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="h-11 rounded-xl bg-white"
                                    onChange={(event) => {
                                        setFile(event.target.files?.[0] ?? null);
                                        resetPreviewState();
                                    }}
                                />
                            </label>
                            <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={handlePreview} disabled={isPreviewing || !file}>
                                {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                                Analisis File
                            </Button>
                            <Button className="h-11 gap-2 rounded-xl bg-red-700 hover:bg-red-800" onClick={handleCommit} disabled={isCommitting || !preview}>
                                {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                Proses Migrasi
                            </Button>
                        </div>

                        {message && (
                            <div
                                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                                    message.type === "success"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : message.type === "warning"
                                            ? "border-amber-200 bg-amber-50 text-amber-700"
                                            : "border-red-200 bg-red-50 text-red-700"
                                }`}
                            >
                                {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />}
                                <span>{message.text}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {preview && (
                    <>
                        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
                            {[
                                ["Total Target", preview.total_pengawasan, "text-slate-950"],
                                ["Item Termapping", preview.total_item_pengawasan, "text-slate-950"],
                                ["Siap Insert", preview.ready_count, "text-emerald-700"],
                                ["Konflik DB", preview.conflict_count, "text-amber-700"],
                                ["Target Hilang", preview.missing_target_count, "text-orange-700"],
                                ["Tanpa Gantt", preview.missing_gantt_count, "text-orange-700"],
                                ["PDF Pending", preview.pdf_pending_count, "text-sky-700"],
                                ["Invalid", preview.invalid_count, "text-red-700"],
                            ].map(([label, value, color]) => (
                                <Card key={String(label)} className="border-slate-200 shadow-sm">
                                    <CardContent className="p-5">
                                        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                                        <p className={`mt-2 text-2xl font-extrabold ${color}`}>{formatNumber(value)}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                                <CardTitle className="text-base">Daftar Kandidat Pengawasan</CardTitle>
                                <div className="flex flex-col gap-3 md:flex-row">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            placeholder="Cari ULOK, toko, cabang..."
                                            className="h-10 w-full rounded-xl pl-9 md:w-80"
                                        />
                                    </div>
                                    <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as typeof stateFilter)}>
                                        <SelectTrigger className="h-10 rounded-xl md:w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua status</SelectItem>
                                            <SelectItem value="ready">Siap insert</SelectItem>
                                            <SelectItem value="conflict">Konflik DB</SelectItem>
                                            <SelectItem value="missing_gantt">Tanpa Gantt Chart</SelectItem>
                                            <SelectItem value="pdf_pending">Bisa simpan PDF pending</SelectItem>
                                            <SelectItem value="invalid">Invalid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1120px] text-left text-sm">
                                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                            <tr>
                                                <th className="w-12 px-4 py-3">
                                                    <Checkbox
                                                        checked={filteredRows.length > 0 && allFilteredSelectableSelected}
                                                        onCheckedChange={(checked) => toggleAllFiltered(Boolean(checked))}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">ULOK / Toko</th>
                                                <th className="px-4 py-3">H / Tanggal</th>
                                                <th className="px-4 py-3">PIC</th>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3">Status DB</th>
                                                <th className="px-4 py-3">Aksi</th>
                                                <th className="px-4 py-3">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredGroups.map((group) => {
                                                const selectableRows = group.rows.filter((row) => row.db_state !== "invalid");
                                                const groupSelected = selectableRows.length > 0
                                                    && selectableRows.every((row) => selectedIds.has(row.source_pengawasan_id));
                                                return (
                                                    <React.Fragment key={group.nomorUlok}>
                                                        <tr className="border-y border-slate-200 bg-slate-100">
                                                            <td className="px-4 py-3">
                                                                <Checkbox
                                                                    checked={groupSelected}
                                                                    disabled={selectableRows.length === 0}
                                                                    onCheckedChange={(checked) => toggleGroup(group.rows, Boolean(checked))}
                                                                />
                                                            </td>
                                                            <td colSpan={7} className="px-4 py-3">
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                                    <span className="font-extrabold text-slate-950">{group.nomorUlok}</span>
                                                                    <span className="font-semibold text-slate-700">{group.namaToko || "-"}</span>
                                                                    <span className="text-xs text-slate-500">{group.cabang || "-"}</span>
                                                                    <Badge variant="secondary">{group.rows.length} target</Badge>
                                                                    <span className="text-xs text-slate-500">
                                                                        {group.rows.filter((row) => row.gantt_id === null).length} tanpa Gantt
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {group.rows.map((row) => {
                                                            const action = actions[row.source_pengawasan_id] ?? getDefaultAction(row);
                                                            return (
                                                    <tr key={row.source_pengawasan_id} className={row.db_state === "invalid" ? "bg-red-50/30" : "bg-white"}>
                                                        <td className="px-4 py-4 align-top">
                                                            <Checkbox
                                                                checked={selectedIds.has(row.source_pengawasan_id)}
                                                                disabled={row.db_state === "invalid"}
                                                                onCheckedChange={(checked) => toggleRow(row, Boolean(checked))}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <p className="font-bold text-slate-950">{row.nomor_ulok}</p>
                                                            <p className="mt-1 text-sm font-semibold text-slate-700">{row.nama_toko || "-"}</p>
                                                            <p className="mt-1 text-xs text-slate-500">{row.lingkup_pekerjaan || "-"} · {row.cabang || "-"}</p>
                                                            <p className="mt-1 text-xs text-slate-400">{row.sheet_name} row {row.row_number}</p>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <Badge variant="secondary" className="rounded-lg">H{row.h_day}</Badge>
                                                            <p className="mt-2 font-semibold text-slate-700">{row.tanggal_pengawasan || "-"}</p>
                                                            <p className="mt-1 text-xs text-slate-400">Mulai {row.tanggal_mulai_spk || "-"}</p>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <p className="font-semibold text-slate-700">{row.pic_building_support || "-"}</p>
                                                            {row.existing_pic_id && <p className="mt-1 text-xs text-slate-400">PIC DB #{row.existing_pic_id}</p>}
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <p className="font-bold text-slate-950">{formatNumber(row.mapped_item_count)}</p>
                                                            <p className="mt-1 text-xs text-slate-400">item pengawasan</p>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <Badge
                                                                className={`border-none ${
                                                                    row.db_state === "ready"
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : row.db_state === "conflict"
                                                                            ? "bg-amber-100 text-amber-700"
                                                                            : row.db_state === "pdf_pending"
                                                                                ? "bg-sky-100 text-sky-700"
                                                                            : "bg-red-100 text-red-700"
                                                                }`}
                                                            >
                                                                {row.db_state === "ready"
                                                                    ? "Siap insert"
                                                                    : row.db_state === "conflict"
                                                                        ? "Konflik DB"
                                                                        : row.db_state === "pdf_pending"
                                                                            ? "PDF pending"
                                                                            : "Invalid"}
                                                            </Badge>
                                                            {row.existing_pengawasan_count > 0 && (
                                                                <p className="mt-2 text-xs text-slate-500">{row.existing_pengawasan_count} item existing</p>
                                                            )}
                                                            {!row.gantt_id && (
                                                                <p className="mt-2 text-xs font-semibold text-orange-600">Gantt belum ada</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <Select
                                                                value={action}
                                                                disabled={row.db_state === "invalid"}
                                                                onValueChange={(value) => {
                                                                    setActions((current) => ({
                                                                        ...current,
                                                                        [row.source_pengawasan_id]: value as PengawasanMigrationAction,
                                                                    }));
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-10 w-48 rounded-xl">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.entries(ACTION_LABELS)
                                                                        .filter(([value]) => value !== "save_pdf_pending" || row.can_save_pdf_pending)
                                                                        .map(([value, label]) => (
                                                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="max-w-xs space-y-1 text-xs">
                                                                {row.issues.map((issue) => (
                                                                    <p key={issue} className="flex gap-1 text-red-600">
                                                                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {issue}
                                                                    </p>
                                                                ))}
                                                                {row.warnings.map((warning) => (
                                                                    <p key={warning} className="text-amber-600">{warning}</p>
                                                                ))}
                                                                {row.link_pdf && <p className="text-emerald-700">PDF tersedia</p>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {commitResult && (
                    <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
                        <CardContent className="p-5 text-sm text-emerald-800">
                            <p className="font-bold">Hasil migrasi</p>
                            <p className="mt-1">
                                Insert {formatNumber(commitResult.inserted)}, replace {formatNumber(commitResult.replaced)}, update PDF {formatNumber(commitResult.updated_pdf)}, PDF pending {formatNumber(commitResult.saved_pdf_pending)}, skip {formatNumber(commitResult.skipped)}, item masuk {formatNumber(commitResult.inserted_items)}.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
