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
    commitInstruksiLapanganMigration,
    previewInstruksiLapanganMigration,
    type InstruksiLapanganMigrationAction,
    type InstruksiLapanganMigrationCommitResult,
    type InstruksiLapanganMigrationPreviewDetail,
    type InstruksiLapanganMigrationPreviewResult
} from "@/lib/api";

const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const defaultAction = (row: InstruksiLapanganMigrationPreviewDetail): InstruksiLapanganMigrationAction =>
    row.db_state === "ready" ? "insert" : "skip";

export default function InstruksiLapanganMigrationPage() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<InstruksiLapanganMigrationPreviewResult | null>(null);
    const [result, setResult] = useState<InstruksiLapanganMigrationCommitResult | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, InstruksiLapanganMigrationAction>>({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const actorRole = user?.roles?.length ? user.roles.join(",") : user?.role ?? "";
    const rows = preview?.details ?? [];
    const filtered = useMemo(() => rows.filter((row) => {
        if (filter !== "all" && row.db_state !== filter) return false;
        const query = search.trim().toLowerCase();
        return !query || [row.nomor_ulok, row.nama_toko, row.cabang, row.lingkup_pekerjaan, row.email_pembuat]
            .some((value) => String(value ?? "").toLowerCase().includes(query));
    }), [rows, filter, search]);
    const selectedRows = rows.filter((row) => selected.has(row.source_candidate_id));
    const executable = selectedRows.filter((row) => (actions[row.source_candidate_id] ?? defaultAction(row)) !== "skip");

    const analyze = async () => {
        if (!file) return;
        setLoading("preview");
        setMessage(null);
        try {
            const response = await previewInstruksiLapanganMigration(file, actorRole, user?.email);
            setPreview(response.data);
            setResult(null);
            setSelected(new Set(response.data.details.filter((row) => row.db_state === "ready").map((row) => row.source_candidate_id)));
            setActions(Object.fromEntries(response.data.details.map((row) => [row.source_candidate_id, defaultAction(row)])));
            setMessage({ type: "success", text: "Analisis selesai. Kandidat baru otomatis dicentang." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Analisis gagal" });
        } finally {
            setLoading(null);
        }
    };

    const commit = async () => {
        if (!file || executable.length === 0 || !window.confirm(`Proses ${number(executable.length)} Instruksi Lapangan?`)) return;
        setLoading("commit");
        setMessage(null);
        try {
            const response = await commitInstruksiLapanganMigration(file, actorRole, user?.email, selectedRows.map((row) => ({
                source_candidate_id: row.source_candidate_id,
                action: actions[row.source_candidate_id] ?? defaultAction(row)
            })));
            setResult(response.data);
            setMessage({ type: "success", text: `Migrasi selesai: ${response.data.inserted} insert, ${response.data.replaced} replace.` });
            await analyze();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Migrasi gagal" });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar title="Migrasi Instruksi Lapangan" showBackButton backHref="/instruksi-lapangan"
                rightActions={<Badge className="border-none bg-red-700 text-white">SUPER HUMAN ONLY</Badge>} />
            <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Upload OPNAME_v1</h1>
                        <p className="mt-1 text-sm text-slate-500">Membaca item IL dari data_rab dan metadata status dari opname_final.</p>
                    </div>
                    <Link href="/instruksi-lapangan"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Kembali</Button></Link>
                </div>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-5 w-5 text-red-700" />File Migrasi</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                            <div className="font-semibold mb-1">ℹ️ File yang harus diupload:</div>
                            <ul className="list-disc list-inside ml-2 space-y-0.5">
                                <li><strong>Nama file</strong>: OPNAME_v1.xlsx (file migrasi versi lama)</li>
                                <li><strong>Sheet yang dibaca</strong>: data_rab (items) dan opname_final (status)</li>
                                <li><strong>Jangan upload</strong>: rab_kedua.xlsx (gunakan halaman "Migrasi rab_kedua")</li>
                            </ul>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                            <Input type="file" accept=".xlsx,.xls" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); }} />
                            <Button variant="outline" onClick={analyze} disabled={!file || loading !== null}>
                                {loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}Analisis File
                            </Button>
                            <Button className="bg-red-700 hover:bg-red-800" onClick={commit} disabled={executable.length === 0 || loading !== null}>
                                {loading === "commit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Proses Migrasi
                            </Button>
                        </div>
                        {message && <div className={`flex gap-2 rounded-md border p-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{message.text}
                        </div>}
                    </CardContent>
                </Card>
                {preview && <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[["Total IL", preview.total_candidates], ["Total Item", preview.total_items], ["Siap Insert", preview.ready_count], ["Sudah Ada", preview.conflict_count], ["Invalid", preview.invalid_count]].map(([label, value]) =>
                            <Card key={String(label)}><CardContent className="p-4"><div className="text-xs font-bold uppercase text-slate-400">{label}</div><div className="mt-1 text-2xl font-extrabold">{number(Number(value))}</div></CardContent></Card>)}
                    </div>
                    {result && <div className="text-sm font-medium text-emerald-700">Hasil terakhir: {result.inserted} insert, {result.replaced} replace, {result.skipped} skip.</div>}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Daftar Kandidat IL</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ULOK, toko..." /></div>
                                <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>
                                    <SelectItem value="all">Semua status</SelectItem><SelectItem value="ready">Siap insert</SelectItem><SelectItem value="conflict">Sudah ada</SelectItem><SelectItem value="invalid">Invalid</SelectItem>
                                </SelectContent></Select>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-[1050px] text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
                                    <th className="p-3"><Checkbox checked={filtered.length > 0 && filtered.every((row) => selected.has(row.source_candidate_id))} onCheckedChange={(checked) => setSelected((current) => {
                                        const next = new Set(current); filtered.forEach((row) => { if (row.db_state !== "invalid") checked ? next.add(row.source_candidate_id) : next.delete(row.source_candidate_id); }); return next;
                                    })} /></th><th>ULOK / Toko</th><th>Lingkup</th><th>Item</th><th>Total</th><th>Status</th><th>Aksi</th><th>Catatan</th>
                                </tr></thead>
                                <tbody>{filtered.map((row) => <tr key={row.source_candidate_id} className="border-t align-top">
                                    <td className="p-3"><Checkbox disabled={row.db_state === "invalid"} checked={selected.has(row.source_candidate_id)} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); checked ? next.add(row.source_candidate_id) : next.delete(row.source_candidate_id); return next; })} /></td>
                                    <td className="py-3 font-semibold">{row.nomor_ulok}<div className="font-normal text-slate-500">{row.nama_toko ?? "-"}</div></td>
                                    <td className="py-3">{row.lingkup_pekerjaan}<div className="text-slate-500">{row.cabang}</div></td>
                                    <td className="py-3">{row.item_count}<div className="text-slate-500">{row.metadata_item_count} metadata</div></td>
                                    <td className="py-3 font-semibold">{rupiah(row.grand_total)}</td>
                                    <td className="py-3"><Badge variant="outline">{row.db_state === "ready" ? "Siap insert" : row.db_state === "conflict" ? "Sudah ada" : "Invalid"}</Badge><div className="mt-1 text-xs text-slate-500">{row.status}</div></td>
                                    <td className="py-3"><Select disabled={row.db_state === "invalid"} value={actions[row.source_candidate_id] ?? defaultAction(row)} onValueChange={(value) => setActions((current) => ({ ...current, [row.source_candidate_id]: value as InstruksiLapanganMigrationAction }))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
                                        {row.db_state === "ready" && <SelectItem value="insert">Insert baru</SelectItem>}{row.db_state === "conflict" && <SelectItem value="replace">Replace</SelectItem>}<SelectItem value="skip">Skip</SelectItem>
                                    </SelectContent></Select></td>
                                    <td className="max-w-xs py-3 text-xs"><div className="text-red-600">{row.issues.join(", ")}</div><div className="text-amber-700">{row.warnings.join(", ")}</div></td>
                                </tr>)}</tbody>
                            </table>
                        </CardContent>
                    </Card>
                </>}
            </main>
        </div>
    );
}
