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
    commitSpkMigration,
    previewSpkMigration,
    type SpkMigrationAction,
    type SpkMigrationCommitResult,
    type SpkMigrationPreviewDetail,
    type SpkMigrationPreviewResult,
} from "@/lib/api";

const formatNumber = (value?: number | string | null) =>
    new Intl.NumberFormat("id-ID").format(Number(value ?? 0) || 0);

const ACTION_LABELS: Record<SpkMigrationAction, string> = {
    insert: "Insert baru",
    skip: "Skip",
    replace_spk: "Replace SPK",
    update_status_pdf: "Update status + PDF",
};

const getDefaultAction = (row: SpkMigrationPreviewDetail): SpkMigrationAction => {
    if (row.db_state === "ready") return "insert";
    return "skip";
};

const getActorRole = (user: ReturnType<typeof useSession>["user"]) =>
    user?.roles?.length ? user.roles.join(",") : user?.role ?? "";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export default function SpkMigrasiPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<SpkMigrationPreviewResult | null>(null);
    const [commitResult, setCommitResult] = useState<SpkMigrationCommitResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, SpkMigrationAction>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [stateFilter, setStateFilter] = useState<"all" | "ready" | "conflict" | "invalid">("all");
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info" | "warning"; text: string } | null>(null);

    const actorRole = useMemo(() => getActorRole(user), [user]);
    const rows = preview?.details ?? [];

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const matchesState = stateFilter === "all" || row.db_state === stateFilter;
            if (!matchesState) return false;
            if (!query) return true;
            return [
                row.nomor_spk,
                row.par,
                row.nomor_ulok,
                row.lingkup_pekerjaan,
                row.nama_toko,
                row.cabang,
                row.nama_kontraktor,
                row.status_spk,
                String(row.source_spk_id),
            ].some((value) => String(value ?? "").toLowerCase().includes(query));
        });
    }, [rows, searchQuery, stateFilter]);

    const selectedRows = useMemo(
        () => rows.filter((row) => selectedIds.has(row.source_spk_id)),
        [rows, selectedIds]
    );

    const selectedExecutableRows = useMemo(
        () => selectedRows.filter((row) => (actions[row.source_spk_id] ?? getDefaultAction(row)) !== "skip"),
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
                <AppNavbar title="Migrasi SPK" showBackButton backHref="/spk" />
                <main className="mx-auto max-w-2xl p-6">
                    <Card className="border-red-200 shadow-sm">
                        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                            <ShieldAlert className="h-12 w-12 text-red-500" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-950">Akses ditolak</h1>
                                <p className="mt-1 text-sm text-slate-500">Fitur migrasi SPK hanya untuk Super Human.</p>
                            </div>
                            <Link href="/spk">
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
            setMessage({ type: "error", text: "Pilih file DATA FORM terlebih dahulu." });
            return;
        }

        setIsPreviewing(true);
        resetPreviewState();
        try {
            const result = await previewSpkMigration(file, actorRole, user?.email);
            const details = result.data.details;
            setPreview(result.data);
            setSelectedIds(new Set(details.filter((row) => row.db_state === "ready").map((row) => row.source_spk_id)));
            setActions(Object.fromEntries(details.map((row) => [row.source_spk_id, getDefaultAction(row)])));
            setMessage({ type: "success", text: "Analisis selesai. Data existing default Skip, ubah aksi jika ingin menimpa." });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal menganalisis file.") });
        } finally {
            setIsPreviewing(false);
        }
    };

    const toggleRow = (row: SpkMigrationPreviewDetail, checked: boolean) => {
        if (row.db_state === "invalid") return;
        setSelectedIds((current) => {
            const next = new Set(current);
            if (checked) next.add(row.source_spk_id);
            else next.delete(row.source_spk_id);
            return next;
        });
    };

    const toggleAllFiltered = (checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            for (const row of filteredRows) {
                if (row.db_state === "invalid") continue;
                if (checked) next.add(row.source_spk_id);
                else next.delete(row.source_spk_id);
            }
            return next;
        });
    };

    const handleCommit = async () => {
        if (!file || !preview) return;

        const selections = selectedRows.map((row) => ({
            source_spk_id: row.source_spk_id,
            action: actions[row.source_spk_id] ?? getDefaultAction(row),
        }));

        if (selections.length === 0) {
            setMessage({ type: "warning", text: "Pilih minimal satu SPK untuk diproses." });
            return;
        }

        if (selectedExecutableRows.length === 0) {
            setMessage({ type: "warning", text: "Semua pilihan masih Skip. Ubah minimal satu aksi migrasi." });
            return;
        }

        const confirmed = window.confirm(
            `Proses ${formatNumber(selectedExecutableRows.length)} SPK terpilih? Mode replace akan mengubah data SPK di database.`
        );
        if (!confirmed) return;

        setIsCommitting(true);
        setMessage(null);
        try {
            const result = await commitSpkMigration(file, actorRole, user?.email, selections);
            setCommitResult(result.data);
            setMessage({ type: "success", text: "Migrasi SPK selesai diproses." });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal memproses migrasi SPK.") });
        } finally {
            setIsCommitting(false);
        }
    };

    const allFilteredSelectableSelected = filteredRows
        .filter((row) => row.db_state !== "invalid")
        .every((row) => selectedIds.has(row.source_spk_id));

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar
                title="Migrasi SPK"
                showBackButton
                backHref="/spk"
                rightActions={
                    <Badge className="border-none bg-red-700 px-3 py-1 text-xs font-bold text-white">
                        SUPER HUMAN ONLY
                    </Badge>
                }
            />

            <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-950">Upload DATA FORM SPK</h1>
                        <p className="mt-1 max-w-3xl text-sm text-slate-500">
                            Membaca sheet SPK_Data, membandingkan dengan toko dan SPK existing di database, lalu operator memilih mana yang diproses.
                        </p>
                    </div>
                    <Link href="/spk">
                        <Button variant="outline" className="w-fit gap-2 rounded-xl">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke SPK
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
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">File DATA FORM sheet SPK_Data</span>
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
                            <Button
                                variant="outline"
                                className="h-11 rounded-xl"
                                disabled={!file || isPreviewing || isCommitting}
                                onClick={handlePreview}
                            >
                                {isPreviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                Analisis File
                            </Button>
                            <Button
                                className="h-11 rounded-xl bg-red-700 text-white hover:bg-red-800"
                                disabled={!file || !preview || isPreviewing || isCommitting || selectedExecutableRows.length === 0}
                                onClick={handleCommit}
                            >
                                {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Proses Migrasi
                            </Button>
                        </div>

                        {message && (
                            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                                message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                message.type === "error" ? "border-red-200 bg-red-50 text-red-700" :
                                message.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" :
                                "border-blue-200 bg-blue-50 text-blue-700"
                            }`}>
                                {message.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                {message.type === "error" && <XCircle className="h-4 w-4 shrink-0" />}
                                {message.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0" />}
                                {message.text}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {preview && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                ["Total SPK", preview.total_spk, "text-slate-950"],
                                ["Siap Insert", preview.ready_count, "text-emerald-700"],
                                ["Konflik DB", preview.conflict_count, "text-amber-700"],
                                ["Toko Tidak Ada", preview.missing_toko_count, "text-orange-700"],
                                ["Invalid", preview.invalid_count, "text-red-700"],
                            ].map(([label, value, color]) => (
                                <Card key={String(label)} className="border-slate-200 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
                                        <div className={`mt-1 text-2xl font-extrabold ${color}`}>{formatNumber(value)}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {commitResult && (
                            <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
                                <CardContent className="grid gap-3 p-5 sm:grid-cols-5">
                                    {[
                                        ["Dipilih", commitResult.total_selected],
                                        ["Insert", commitResult.inserted],
                                        ["Replace", commitResult.replaced],
                                        ["Update Status/PDF", commitResult.updated_status_pdf],
                                        ["Skip", commitResult.skipped],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="rounded-lg border border-emerald-100 bg-white p-3">
                                            <div className="text-xs font-bold uppercase text-emerald-500">{label}</div>
                                            <div className="text-2xl font-extrabold text-emerald-800">{formatNumber(value)}</div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <CardTitle className="text-base">Daftar Kandidat SPK</CardTitle>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative w-full sm:w-80">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(event) => setSearchQuery(event.target.value)}
                                                placeholder="Cari ULOK, SPK, kontraktor..."
                                                className="h-9 rounded-xl pl-9 text-sm"
                                            />
                                        </div>
                                        <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as typeof stateFilter)}>
                                            <SelectTrigger className="h-9 w-full rounded-xl bg-white sm:w-44">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua status</SelectItem>
                                                <SelectItem value="ready">Siap insert</SelectItem>
                                                <SelectItem value="conflict">Konflik DB</SelectItem>
                                                <SelectItem value="invalid">Invalid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1240px] text-left text-sm">
                                        <thead className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    <Checkbox
                                                        checked={filteredRows.length > 0 && allFilteredSelectableSelected}
                                                        onCheckedChange={(value) => toggleAllFiltered(Boolean(value))}
                                                        aria-label="Pilih semua hasil filter"
                                                    />
                                                </th>
                                                <th className="px-4 py-3">SPK / ULOK</th>
                                                <th className="px-4 py-3">Lingkup</th>
                                                <th className="px-4 py-3">Kontraktor</th>
                                                <th className="px-4 py-3 text-right">Nilai</th>
                                                <th className="px-4 py-3">Status DB</th>
                                                <th className="px-4 py-3">Aksi</th>
                                                <th className="px-4 py-3">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                                        Tidak ada data yang cocok.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRows.map((row) => {
                                                    const selected = selectedIds.has(row.source_spk_id);
                                                    const action = actions[row.source_spk_id] ?? getDefaultAction(row);
                                                    const isInvalid = row.db_state === "invalid";
                                                    return (
                                                        <tr key={row.source_spk_id} className={selected ? "bg-red-50/30" : "hover:bg-slate-50"}>
                                                            <td className="px-4 py-3 align-top">
                                                                <Checkbox
                                                                    checked={selected}
                                                                    disabled={isInvalid}
                                                                    onCheckedChange={(value) => toggleRow(row, Boolean(value))}
                                                                    aria-label={`Pilih SPK ${row.source_spk_id}`}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <div className="font-mono text-xs font-bold text-slate-900">{row.nomor_spk || "-"}</div>
                                                                <div className="mt-1 font-mono text-xs text-slate-600">{row.nomor_ulok || "-"}</div>
                                                                <div className="mt-1 max-w-72 truncate text-sm font-semibold text-slate-700">{row.nama_toko || "-"}</div>
                                                                <div className="mt-1 text-xs text-slate-400">Source SPK #{row.source_spk_id}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <Badge className="border-none bg-slate-100 text-slate-700">{row.lingkup_pekerjaan || "-"}</Badge>
                                                                <div className="mt-2 text-xs text-slate-500">{row.cabang || "-"}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-xs text-slate-700">
                                                                <div className="max-w-64 truncate font-semibold">{row.nama_kontraktor || "-"}</div>
                                                                <div className="mt-1 text-slate-400">{row.status_spk}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right align-top font-mono text-xs font-bold text-slate-700">
                                                                {formatNumber(row.grand_total)}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <Badge className={`border-none ${
                                                                    row.db_state === "ready" ? "bg-emerald-100 text-emerald-700" :
                                                                    row.db_state === "conflict" ? "bg-amber-100 text-amber-700" :
                                                                    "bg-red-100 text-red-700"
                                                                }`}>
                                                                    {row.db_state === "ready" ? "Siap insert" : row.db_state === "conflict" ? "Sudah ada" : "Invalid"}
                                                                </Badge>
                                                                {row.existing_spk_id && (
                                                                    <div className="mt-2 text-xs text-slate-400">
                                                                        DB SPK #{row.existing_spk_id}, {row.existing_spk_status}
                                                                        {row.existing_spk_created_at ? `, ${row.existing_spk_created_at}` : ""}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <Select
                                                                    value={action}
                                                                    disabled={isInvalid || !selected}
                                                                    onValueChange={(value) => setActions((current) => ({
                                                                        ...current,
                                                                        [row.source_spk_id]: value as SpkMigrationAction,
                                                                    }))}
                                                                >
                                                                    <SelectTrigger className="h-9 w-52 rounded-xl bg-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {row.db_state === "ready" && <SelectItem value="insert">{ACTION_LABELS.insert}</SelectItem>}
                                                                        <SelectItem value="skip">{ACTION_LABELS.skip}</SelectItem>
                                                                        {row.db_state === "conflict" && (
                                                                            <>
                                                                                <SelectItem value="replace_spk">{ACTION_LABELS.replace_spk}</SelectItem>
                                                                                <SelectItem value="update_status_pdf">{ACTION_LABELS.update_status_pdf}</SelectItem>
                                                                            </>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-xs text-slate-500">
                                                                {row.issues.length > 0 ? row.issues.join(", ") : `Mulai ${row.waktu_mulai}, selesai ${row.waktu_selesai}`}
                                                                {row.warnings.length > 0 && (
                                                                    <div className="mt-1 font-medium text-amber-600">
                                                                        {row.warnings.join(", ")}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col gap-2 border-t bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Menampilkan {formatNumber(filteredRows.length)} dari {formatNumber(rows.length)} SPK. Dipilih {formatNumber(selectedRows.length)} SPK, eksekusi {formatNumber(selectedExecutableRows.length)} SPK.
                                    </span>
                                    <span>
                                        Perbandingan DB memakai Nomor ULOK + Lingkup Pekerjaan.
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
