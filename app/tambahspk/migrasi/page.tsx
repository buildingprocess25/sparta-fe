"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
    commitPertambahanSpkMigration,
    previewPertambahanSpkMigration,
    type PertambahanSpkMigrationAction,
    type PertambahanSpkMigrationCommitResult,
    type PertambahanSpkMigrationPreviewDetail,
    type PertambahanSpkMigrationPreviewResult,
} from "@/lib/api";

const formatNumber = (value?: number | string | null) =>
    new Intl.NumberFormat("id-ID").format(Number(value ?? 0) || 0);

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const [year, month, day] = value.slice(0, 10).split("-");
    return year && month && day ? `${day}/${month}/${year}` : value;
};

const getActorRole = (user: ReturnType<typeof useSession>["user"]) =>
    user?.roles?.length ? user.roles.join(",") : user?.role ?? "";

const getDefaultAction = (
    row: PertambahanSpkMigrationPreviewDetail
): PertambahanSpkMigrationAction => row.db_state === "ready" ? "insert" : "skip";

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export default function PertambahanSpkMigrationPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PertambahanSpkMigrationPreviewResult | null>(null);
    const [commitResult, setCommitResult] = useState<PertambahanSpkMigrationCommitResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, PertambahanSpkMigrationAction>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [stateFilter, setStateFilter] = useState<"all" | "ready" | "conflict" | "invalid">("all");
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error" | "warning";
        text: string;
    } | null>(null);

    const actorRole = useMemo(() => getActorRole(user), [user]);
    const rows = preview?.details ?? [];

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            if (stateFilter !== "all" && row.db_state !== stateFilter) return false;
            if (!query) return true;
            return [
                row.nomor_ulok,
                row.nomor_spk,
                row.lingkup_pekerjaan,
                row.dibuat_oleh,
                row.source_status,
                row.alasan_perpanjangan,
                String(row.source_row),
            ].some((value) => String(value ?? "").toLowerCase().includes(query));
        });
    }, [rows, searchQuery, stateFilter]);

    const filteredGroups = useMemo(() => {
        const groups = new Map<number, PertambahanSpkMigrationPreviewDetail[]>();
        for (const row of filteredRows) {
            groups.set(row.source_row, [...(groups.get(row.source_row) ?? []), row]);
        }
        return [...groups.entries()].map(([sourceRow, groupRows]) => ({ sourceRow, rows: groupRows }));
    }, [filteredRows]);

    const selectedRows = useMemo(
        () => rows.filter((row) => selectedIds.has(row.source_candidate_id)),
        [rows, selectedIds]
    );
    const selectedExecutableRows = useMemo(
        () => selectedRows.filter((row) => (actions[row.source_candidate_id] ?? getDefaultAction(row)) !== "skip"),
        [selectedRows, actions]
    );

    const resetPreview = () => {
        setPreview(null);
        setCommitResult(null);
        setSelectedIds(new Set());
        setActions({});
        setMessage(null);
    };

    if (user && !user.isSuperHuman) {
        return (
            <div className="min-h-screen bg-slate-50">
                <AppNavbar title="Migrasi Pertambahan SPK" showBackButton backHref="/tambahspk" />
                <main className="mx-auto max-w-2xl p-6">
                    <Card className="border-red-200 shadow-sm">
                        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                            <ShieldAlert className="h-12 w-12 text-red-500" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-950">Akses ditolak</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Fitur migrasi Pertambahan SPK hanya untuk Super Human.
                                </p>
                            </div>
                            <Link href="/tambahspk">
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
        resetPreview();
        try {
            const result = await previewPertambahanSpkMigration(file, actorRole, user?.email);
            const details = result.data.details;
            setPreview(result.data);
            setSelectedIds(new Set(
                details.filter((row) => row.db_state === "ready").map((row) => row.source_candidate_id)
            ));
            setActions(Object.fromEntries(
                details.map((row) => [row.source_candidate_id, getDefaultAction(row)])
            ));
            setMessage({
                type: "success",
                text: "Analisis selesai. Data baru otomatis dicentang, sedangkan data existing default Skip.",
            });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal menganalisis file.") });
        } finally {
            setIsPreviewing(false);
        }
    };

    const setRowsSelected = (
        targetRows: PertambahanSpkMigrationPreviewDetail[],
        checked: boolean
    ) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            for (const row of targetRows) {
                if (row.db_state === "invalid") continue;
                if (checked) next.add(row.source_candidate_id);
                else next.delete(row.source_candidate_id);
            }
            return next;
        });
    };

    const handleCommit = async () => {
        if (!file || !preview) return;
        const selections = selectedRows.map((row) => ({
            source_candidate_id: row.source_candidate_id,
            action: actions[row.source_candidate_id] ?? getDefaultAction(row),
        }));
        if (selectedExecutableRows.length === 0) {
            setMessage({ type: "warning", text: "Pilih minimal satu target dengan aksi Insert atau Replace." });
            return;
        }
        if (!window.confirm(
            `Proses ${formatNumber(selectedExecutableRows.length)} target Pertambahan SPK? Seluruh proses database dijalankan dalam satu transaksi.`
        )) return;

        setIsCommitting(true);
        setMessage(null);
        try {
            const result = await commitPertambahanSpkMigration(
                file,
                actorRole,
                user?.email,
                selections
            );
            setCommitResult(result.data);
            setMessage({
                type: result.data.sync_warnings.length > 0 ? "warning" : "success",
                text: result.data.sync_warnings.length > 0
                    ? `Migrasi tersimpan, tetapi ada ${result.data.sync_warnings.length} peringatan sinkronisasi turunan.`
                    : "Migrasi Pertambahan SPK selesai.",
            });
        } catch (error) {
            setMessage({ type: "error", text: getErrorMessage(error, "Gagal memproses migrasi.") });
        } finally {
            setIsCommitting(false);
        }
    };

    const selectableFiltered = filteredRows.filter((row) => row.db_state !== "invalid");
    const allFilteredSelected = selectableFiltered.length > 0
        && selectableFiltered.every((row) => selectedIds.has(row.source_candidate_id));

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar
                title="Migrasi Pertambahan SPK"
                showBackButton
                backHref="/tambahspk"
                rightActions={
                    <Badge className="border-none bg-red-700 px-3 py-1 text-xs font-bold text-white">
                        SUPER HUMAN ONLY
                    </Badge>
                }
            />

            <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-950">Upload DATA FORM</h1>
                        <p className="mt-1 max-w-3xl text-sm text-slate-500">
                            Membaca sheet Perpanjangan SPK dan SPK_Data, lalu mencocokkan setiap riwayat ke SPK Sipil atau ME di database.
                        </p>
                    </div>
                    <Link href="/tambahspk">
                        <Button variant="outline" className="w-fit gap-2 rounded-xl">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Pertambahan SPK
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
                                <span className="text-xs font-bold uppercase text-slate-500">
                                    DATA FORM: Perpanjangan SPK + SPK_Data
                                </span>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="h-11 rounded-xl bg-white"
                                    onChange={(event) => {
                                        setFile(event.target.files?.[0] ?? null);
                                        resetPreview();
                                    }}
                                />
                            </label>
                            <Button
                                variant="outline"
                                className="h-11 rounded-xl"
                                disabled={!file || isPreviewing || isCommitting}
                                onClick={handlePreview}
                            >
                                {isPreviewing
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Database className="mr-2 h-4 w-4" />}
                                Analisis File
                            </Button>
                            <Button
                                className="h-11 rounded-xl bg-red-700 text-white hover:bg-red-800"
                                disabled={!preview || selectedExecutableRows.length === 0 || isPreviewing || isCommitting}
                                onClick={handleCommit}
                            >
                                {isCommitting
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Upload className="mr-2 h-4 w-4" />}
                                Proses Migrasi
                            </Button>
                        </div>

                        {message && (
                            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                                message.type === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : message.type === "error"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
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
                                ["Baris Sumber", preview.total_source_rows, "text-slate-950"],
                                ["Target SPK", preview.total_targets, "text-slate-950"],
                                ["Siap Insert", preview.ready_count, "text-emerald-700"],
                                ["Sudah Ada", preview.conflict_count, "text-amber-700"],
                                ["Invalid", preview.invalid_count, "text-red-700"],
                            ].map(([label, value, color]) => (
                                <Card key={String(label)} className="border-slate-200 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
                                        <div className={`mt-1 text-2xl font-extrabold ${color}`}>{formatNumber(value)}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {commitResult && (
                            <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-4">
                                {[
                                    ["Dipilih", commitResult.total_selected],
                                    ["Insert", commitResult.inserted],
                                    ["Replace", commitResult.replaced],
                                    ["Skip", commitResult.skipped],
                                ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded-lg border border-emerald-100 bg-white p-3">
                                        <div className="text-xs font-bold uppercase text-emerald-500">{label}</div>
                                        <div className="text-2xl font-extrabold text-emerald-800">{formatNumber(value)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <CardTitle className="text-base">Daftar Kandidat Pertambahan SPK</CardTitle>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative w-full sm:w-80">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(event) => setSearchQuery(event.target.value)}
                                                placeholder="Cari ULOK, SPK, pembuat, alasan..."
                                                className="h-9 rounded-xl pl-9 text-sm"
                                            />
                                        </div>
                                        <Select
                                            value={stateFilter}
                                            onValueChange={(value) => setStateFilter(value as typeof stateFilter)}
                                        >
                                            <SelectTrigger className="h-9 w-full rounded-xl bg-white sm:w-44">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua status</SelectItem>
                                                <SelectItem value="ready">Siap insert</SelectItem>
                                                <SelectItem value="conflict">Sudah ada</SelectItem>
                                                <SelectItem value="invalid">Invalid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1380px] text-left text-sm">
                                        <thead className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    <Checkbox
                                                        checked={allFilteredSelected}
                                                        onCheckedChange={(value) => setRowsSelected(filteredRows, Boolean(value))}
                                                        aria-label="Pilih semua hasil filter"
                                                    />
                                                </th>
                                                <th className="px-4 py-3">ULOK / SPK</th>
                                                <th className="px-4 py-3">Perpanjangan</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Dokumen</th>
                                                <th className="px-4 py-3">Status DB</th>
                                                <th className="px-4 py-3">Aksi</th>
                                                <th className="px-4 py-3">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredGroups.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                                        Tidak ada data yang cocok.
                                                    </td>
                                                </tr>
                                            ) : filteredGroups.flatMap((group) => {
                                                const selectable = group.rows.filter((row) => row.db_state !== "invalid");
                                                const groupSelected = selectable.length > 0
                                                    && selectable.every((row) => selectedIds.has(row.source_candidate_id));
                                                const first = group.rows[0];
                                                return [
                                                    <tr key={`group-${group.sourceRow}`} className="border-t bg-slate-100/80">
                                                        <td className="px-4 py-2">
                                                            <Checkbox
                                                                checked={groupSelected}
                                                                disabled={selectable.length === 0}
                                                                onCheckedChange={(value) => setRowsSelected(group.rows, Boolean(value))}
                                                                aria-label={`Pilih semua target baris ${group.sourceRow}`}
                                                            />
                                                        </td>
                                                        <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-slate-600">
                                                            Baris Excel {group.sourceRow} · {first.nomor_ulok} · {group.rows.length} target SPK
                                                        </td>
                                                    </tr>,
                                                    ...group.rows.map((row) => {
                                                        const selected = selectedIds.has(row.source_candidate_id);
                                                        const action = actions[row.source_candidate_id] ?? getDefaultAction(row);
                                                        const isInvalid = row.db_state === "invalid";
                                                        return (
                                                            <tr
                                                                key={row.source_candidate_id}
                                                                className={selected ? "bg-red-50/30" : "hover:bg-slate-50"}
                                                            >
                                                                <td className="px-4 py-3 align-top">
                                                                    <Checkbox
                                                                        checked={selected}
                                                                        disabled={isInvalid}
                                                                        onCheckedChange={(value) => setRowsSelected([row], Boolean(value))}
                                                                        aria-label={`Pilih target ${row.source_candidate_id}`}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="font-mono text-xs font-bold text-slate-900">{row.nomor_ulok}</div>
                                                                    <div className="mt-1 max-w-72 font-mono text-xs text-slate-600">{row.nomor_spk || "-"}</div>
                                                                    <Badge className="mt-2 border-none bg-slate-100 text-slate-700">
                                                                        {row.lingkup_pekerjaan || "-"}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="font-bold text-slate-900">+{row.pertambahan_hari} hari</div>
                                                                    <div className="mt-1 text-xs text-slate-500">
                                                                        {formatDate(row.tanggal_spk_akhir)} → {formatDate(row.tanggal_spk_akhir_setelah_perpanjangan)}
                                                                    </div>
                                                                    <div className="mt-2 max-w-80 text-xs text-slate-600">{row.alasan_perpanjangan}</div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <Badge className={`border-none ${
                                                                        row.status_persetujuan === "Disetujui BM"
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : row.status_persetujuan === "Ditolak BM"
                                                                                ? "bg-red-100 text-red-700"
                                                                                : "bg-amber-100 text-amber-700"
                                                                    }`}>
                                                                        {row.status_persetujuan}
                                                                    </Badge>
                                                                    <div className="mt-2 text-xs text-slate-500">{row.dibuat_oleh || "-"}</div>
                                                                    <div className="mt-1 text-xs text-slate-400">{row.source_status || "-"}</div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-xs">
                                                                    <div className={row.link_pdf ? "text-emerald-700" : "text-slate-400"}>
                                                                        PDF {row.link_pdf ? "tersedia" : "kosong"}
                                                                    </div>
                                                                    <div className={`mt-1 ${row.link_lampiran_pendukung ? "text-emerald-700" : "text-slate-400"}`}>
                                                                        Lampiran {row.link_lampiran_pendukung ? "tersedia" : "kosong"}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <Badge className={`border-none ${
                                                                        row.db_state === "ready"
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : row.db_state === "conflict"
                                                                                ? "bg-amber-100 text-amber-700"
                                                                                : "bg-red-100 text-red-700"
                                                                    }`}>
                                                                        {row.db_state === "ready"
                                                                            ? "Siap insert"
                                                                            : row.db_state === "conflict"
                                                                                ? "Sudah ada"
                                                                                : "Invalid"}
                                                                    </Badge>
                                                                    {row.existing_id && (
                                                                        <div className="mt-2 text-xs text-slate-400">
                                                                            Data #{row.existing_id}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <Select
                                                                        value={action}
                                                                        disabled={isInvalid || !selected}
                                                                        onValueChange={(value) => setActions((current) => ({
                                                                            ...current,
                                                                            [row.source_candidate_id]: value as PertambahanSpkMigrationAction,
                                                                        }))}
                                                                    >
                                                                        <SelectTrigger className="h-9 w-40 rounded-xl bg-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {row.db_state === "ready" && <SelectItem value="insert">Insert baru</SelectItem>}
                                                                            {row.db_state === "conflict" && <SelectItem value="replace">Replace</SelectItem>}
                                                                            <SelectItem value="skip">Skip</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-xs text-slate-500">
                                                                    {row.issues.length > 0 ? row.issues.join(", ") : `Target SPK #${row.target_spk_id}`}
                                                                    {row.warnings.length > 0 && (
                                                                        <div className="mt-1 font-medium text-amber-600">
                                                                            {row.warnings.join(", ")}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }),
                                                ];
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col gap-2 border-t bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between">
                                    <span>
                                        Menampilkan {formatNumber(filteredRows.length)} dari {formatNumber(rows.length)} target.
                                        Dipilih {formatNumber(selectedRows.length)}, eksekusi {formatNumber(selectedExecutableRows.length)}.
                                    </span>
                                    <span>Satu baris sumber dapat menghasilkan target Sipil dan ME.</span>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
