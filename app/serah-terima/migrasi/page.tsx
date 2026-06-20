"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Database, FileSpreadsheet, Loader2, Search, Upload } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import {
    commitSerahTerimaMigration,
    previewSerahTerimaMigration,
    type SerahTerimaMigrationAction,
    type SerahTerimaMigrationCommitResult,
    type SerahTerimaMigrationPreviewDetail,
    type SerahTerimaMigrationPreviewResult
} from "@/lib/api";

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const formatDate = (value?: string | null) => value
    ? new Date(value.replace(" ", "T")).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : "-";
const defaultAction = (row: SerahTerimaMigrationPreviewDetail): SerahTerimaMigrationAction =>
    row.db_state === "ready" ? "insert" : "skip";

export default function SerahTerimaMigrationPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<SerahTerimaMigrationPreviewResult | null>(null);
    const [commitResult, setCommitResult] = useState<SerahTerimaMigrationCommitResult | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, SerahTerimaMigrationAction>>({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
    const actorRole = user?.roles?.length ? user.roles.join(",") : user?.role ?? "";
    const rows = preview?.details ?? [];
    const filtered = useMemo(() => rows.filter((row) => {
        if (filter !== "all" && row.db_state !== filter) return false;
        const query = search.trim().toLowerCase();
        return !query || [row.nomor_ulok, row.nama_toko, row.cabang, row.lingkup_pekerjaan]
            .some((value) => String(value ?? "").toLowerCase().includes(query));
    }), [rows, search, filter]);
    const selectedRows = rows.filter((row) => selected.has(row.source_candidate_id));
    const executable = selectedRows.filter((row) => (actions[row.source_candidate_id] ?? defaultAction(row)) !== "skip");

    const analyze = async () => {
        if (!file) return;
        setLoading("preview");
        setMessage(null);
        try {
            const response = await previewSerahTerimaMigration(file, actorRole, user?.email);
            setPreview(response.data);
            setCommitResult(null);
            setSelected(new Set(response.data.details.filter((row) => row.db_state === "ready").map((row) => row.source_candidate_id)));
            setActions(Object.fromEntries(response.data.details.map((row) => [row.source_candidate_id, defaultAction(row)])));
            setMessage({ type: "success", text: "Analisis selesai. Dokumen DITERIMA terbaru dipilih otomatis." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Analisis gagal" });
        } finally {
            setLoading(null);
        }
    };

    const commit = async () => {
        if (!file || executable.length === 0 || !window.confirm(`Proses ${formatNumber(executable.length)} dokumen Serah Terima?`)) return;
        setLoading("commit");
        setMessage(null);
        try {
            const response = await commitSerahTerimaMigration(file, actorRole, user?.email, selectedRows.map((row) => ({
                source_candidate_id: row.source_candidate_id,
                action: actions[row.source_candidate_id] ?? defaultAction(row)
            })));
            setCommitResult(response.data);
            setMessage({
                type: response.data.sync_warnings.length > 0 ? "warning" : "success",
                text: response.data.sync_warnings.length > 0
                    ? `Dokumen tersimpan, dengan ${response.data.sync_warnings.length} peringatan sinkronisasi denda.`
                    : "Migrasi Serah Terima berhasil."
            });
            await analyze();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Migrasi gagal" });
        } finally {
            setLoading(null);
        }
    };

    return <div className="min-h-screen bg-slate-50">
        <AppNavbar title="Migrasi Serah Terima" showBackButton backHref="/gantt"
            rightActions={<Badge className="border-none bg-red-700 text-white">SUPER HUMAN ONLY</Badge>} />
        <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
            <div className="flex items-end justify-between gap-4">
                <div><h1 className="text-2xl font-extrabold">Upload PENGAWASAN.xlsx</h1>
                    <p className="mt-1 text-sm text-slate-500">Mengambil pengajuan DITERIMA terakhir per ULOK dan memakai PDF historisnya.</p></div>
                <Link href="/gantt"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Kembali ke Gantt</Button></Link>
            </div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-5 w-5 text-red-700" />File Migrasi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <Input type="file" accept=".xlsx,.xls" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); }} />
                        <Button variant="outline" disabled={!file || loading !== null} onClick={analyze}>{loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}Analisis File</Button>
                        <Button className="bg-red-700 hover:bg-red-800" disabled={executable.length === 0 || loading !== null} onClick={commit}>{loading === "commit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Proses Migrasi</Button>
                    </div>
                    {message && <div className={`flex gap-2 rounded-md border p-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : message.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                        {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{message.text}</div>}
                </CardContent>
            </Card>
            {preview && <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
                    ["Total Target", preview.total_candidates], ["Total ULOK", preview.total_ulok], ["Siap Insert", preview.ready_count], ["Sudah Ada", preview.conflict_count], ["Invalid", preview.invalid_count]
                ].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><div className="text-xs font-bold uppercase text-slate-400">{label}</div><div className="mt-1 text-2xl font-extrabold">{formatNumber(Number(value))}</div></CardContent></Card>)}</div>
                {commitResult && <div className="text-sm font-medium text-emerald-700">Hasil: {commitResult.inserted} insert, {commitResult.replaced} replace, {commitResult.skipped} skip.</div>}
                <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Daftar Kandidat Serah Terima</CardTitle><div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Cari ULOK, toko..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                    <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem><SelectItem value="ready">Siap insert</SelectItem><SelectItem value="conflict">Sudah ada</SelectItem><SelectItem value="invalid">Invalid</SelectItem></SelectContent></Select>
                </div></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
                    <th className="p-3"><Checkbox checked={filtered.length > 0 && filtered.filter((row) => row.db_state !== "invalid").every((row) => selected.has(row.source_candidate_id))} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); filtered.forEach((row) => { if (row.db_state !== "invalid") checked ? next.add(row.source_candidate_id) : next.delete(row.source_candidate_id); }); return next; })} /></th>
                    <th>ULOK / Toko</th><th>Lingkup</th><th>Tanggal</th><th>PDF</th><th>Status DB</th><th>Aksi</th><th>Catatan</th>
                </tr></thead><tbody>{filtered.map((row) => <tr key={row.source_candidate_id} className="border-t align-top">
                    <td className="p-3"><Checkbox disabled={row.db_state === "invalid"} checked={selected.has(row.source_candidate_id)} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); checked ? next.add(row.source_candidate_id) : next.delete(row.source_candidate_id); return next; })} /></td>
                    <td className="py-3 font-semibold">{row.nomor_ulok}<div className="font-normal text-slate-500">{row.nama_toko ?? "-"}</div></td>
                    <td className="py-3">{row.lingkup_pekerjaan || "-"}<div className="text-slate-500">{row.cabang}</div></td>
                    <td className="py-3">{formatDate(row.created_at)}</td>
                    <td className="py-3">{row.link_pdf ? <a className="font-medium text-emerald-700 underline" href={row.link_pdf} target="_blank" rel="noreferrer">Tersedia</a> : "Kosong"}<div className="text-xs text-slate-500">{row.checklist_count} checklist</div></td>
                    <td className="py-3"><Badge variant="outline">{row.db_state === "ready" ? "Siap insert" : row.db_state === "conflict" ? "Sudah ada" : "Invalid"}</Badge></td>
                    <td className="py-3"><Select disabled={row.db_state === "invalid"} value={actions[row.source_candidate_id] ?? defaultAction(row)} onValueChange={(value) => setActions((current) => ({ ...current, [row.source_candidate_id]: value as SerahTerimaMigrationAction }))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{row.db_state === "ready" && <SelectItem value="insert">Insert baru</SelectItem>}{row.db_state === "conflict" && <SelectItem value="replace">Replace</SelectItem>}<SelectItem value="skip">Skip</SelectItem></SelectContent></Select></td>
                    <td className="max-w-xs py-3 text-xs"><div className="text-red-600">{row.issues.join(", ")}</div><div className="text-amber-700">{row.warnings.join(", ")}</div></td>
                </tr>)}</tbody></table></CardContent></Card>
            </>}
        </main>
    </div>;
}
