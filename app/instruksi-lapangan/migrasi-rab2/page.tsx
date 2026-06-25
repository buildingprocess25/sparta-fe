"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    AlertTriangle, ArrowLeft, CheckCircle2, Database,
    FileSpreadsheet, Loader2, Search, Upload, Info
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
    commitInstruksiLapanganMigrationRab2,
    previewInstruksiLapanganMigrationRab2,
    type InstruksiLapanganMigrationAction,
    type InstruksiLapanganMigrationRab2CommitResult,
    type InstruksiLapanganMigrationRab2PreviewDetail,
    type InstruksiLapanganMigrationRab2PreviewResult
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const rupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

// Default action berdasarkan db_state + conflict_reason
const defaultAction = (row: InstruksiLapanganMigrationRab2PreviewDetail): InstruksiLapanganMigrationAction => {
    if (row.db_state === "ready") return "insert";
    if (row.db_state === "conflict") {
        // Hanya auto-replace kalau safe
        return row.safe_to_replace ? "replace" : "skip";
    }
    return "skip";
};

// Label + warna untuk conflict_reason
const conflictReasonConfig: Record<string, { label: string; badge: string; desc: string }> = {
    from_v1_migration: {
        label: "Dari migrasi v1",
        badge: "bg-blue-100 text-blue-800",
        desc: "Data DB berasal dari migrasi OPNAME_v1. Aman di-replace dengan rab_kedua yang lebih akurat."
    },
    status_only: {
        label: "Beda status saja",
        badge: "bg-amber-100 text-amber-800",
        desc: "Item & total identik, hanya status berbeda. Status DB lebih maju — skip direkomendasikan."
    },
    db_more_complete: {
        label: "DB lebih lengkap",
        badge: "bg-orange-100 text-orange-800",
        desc: "DB memiliki lebih banyak item atau nilai lebih besar. Kemungkinan sudah diperbarui manual di v2 — skip direkomendasikan."
    },
    data_differs: {
        label: "Data berbeda",
        badge: "bg-red-100 text-red-800",
        desc: "Item atau total berbeda signifikan. Perlu review manual sebelum memutuskan replace atau skip."
    },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstruksiLapanganMigrationRab2Page() {
    const { user } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<InstruksiLapanganMigrationRab2PreviewResult | null>(null);
    const [result, setResult] = useState<InstruksiLapanganMigrationRab2CommitResult | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [actions, setActions] = useState<Record<number, InstruksiLapanganMigrationAction>>({});
    const [search, setSearch] = useState("");
    const [filterState, setFilterState] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterConflict, setFilterConflict] = useState("all");
    const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const actorRole = user?.roles?.length ? user.roles.join(",") : user?.role ?? "";
    const rows = preview?.details ?? [];

    const filtered = useMemo(() => rows.filter((row) => {
        if (filterState !== "all" && row.db_state !== filterState) return false;
        if (filterStatus === "disetujui" && row.status !== "Disetujui") return false;
        if (filterStatus === "pending" && row.status === "Disetujui") return false;
        if (filterConflict !== "all") {
            if (filterConflict === "ready" && row.db_state !== "ready") return false;
            if (filterConflict === "safe_replace" && !(row.db_state === "conflict" && row.safe_to_replace)) return false;
            if (filterConflict === "need_review" && !(row.db_state === "conflict" && !row.safe_to_replace)) return false;
        }
        const query = search.trim().toLowerCase();
        return !query || [row.nomor_ulok, row.nama_toko, row.cabang, row.lingkup_pekerjaan]
            .some((v) => String(v ?? "").toLowerCase().includes(query));
    }), [rows, filterState, filterStatus, filterConflict, search]);

    const selectedRows = rows.filter((row) => selected.has(row.source_candidate_id));
    const executable = selectedRows.filter(
        (row) => (actions[row.source_candidate_id] ?? defaultAction(row)) !== "skip"
    );

    const analyze = async () => {
        if (!file) return;
        setLoading("preview");
        setMessage(null);
        try {
            console.log("[DEBUG FE] Analyzing file:", file.name, "size:", file.size);
            const response = await previewInstruksiLapanganMigrationRab2(file, actorRole, user?.email);
            const data = response.data;
            console.log("[DEBUG FE] Preview result:", {
                total_candidates: data.total_candidates,
                ready_count: data.ready_count,
                conflict_count: data.conflict_count,
                invalid_count: data.invalid_count
            });
            setPreview(data);
            setResult(null);

            // Auto-select:
            // - semua "ready" → insert
            // - conflict dengan safe_to_replace → replace
            // - conflict tanpa safe_to_replace → TIDAK diselect (skip default)
            const autoSelected = new Set(
                data.details
                    .filter((row) => row.db_state === "ready" || (row.db_state === "conflict" && row.safe_to_replace))
                    .map((row) => row.source_candidate_id)
            );
            setSelected(autoSelected);
            setActions(Object.fromEntries(data.details.map((row) => [row.source_candidate_id, defaultAction(row)])));

            const safeReplace = data.conflict_summary.safe_to_replace;
            const needReview = data.conflict_count - safeReplace;
            setMessage({
                type: "success",
                text: `Analisis selesai. ${data.ready_count} baru, ${safeReplace} conflict aman di-replace, ${needReview} conflict perlu review manual.`
            });
        } catch (error) {
            console.error("[DEBUG FE] Preview error:", error);
            const errorMsg = error instanceof Error ? error.message : "Analisis gagal";
            console.error("[DEBUG FE] Error message:", errorMsg);
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setLoading(null);
        }
    };

    const commit = async () => {
        if (!file || executable.length === 0) return;
        if (!window.confirm(`Proses ${number(executable.length)} Instruksi Lapangan dari rab_kedua?`)) return;
        setLoading("commit");
        setMessage(null);
        try {
            const response = await commitInstruksiLapanganMigrationRab2(
                file, actorRole, user?.email,
                selectedRows.map((row) => ({
                    source_candidate_id: row.source_candidate_id,
                    action: actions[row.source_candidate_id] ?? defaultAction(row)
                }))
            );
            setResult(response.data);
            setMessage({
                type: "success",
                text: `Migrasi selesai: ${response.data.inserted} insert, ${response.data.replaced} replace, ${response.data.skipped} skip.`
            });
            await analyze();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Migrasi gagal" });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar
                title="Migrasi IL — rab_kedua"
                showBackButton backHref="/instruksi-lapangan"
                rightActions={<Badge className="border-none bg-red-700 text-white">SUPER HUMAN ONLY</Badge>}
            />
            <main className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-8">

                {/* Header */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">Upload rab_kedua.xlsx</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Membaca IL dari sheet <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">Form3</code> dan{" "}
                            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">Form2</code>.
                            Conflict dibagi menjadi 4 kategori — sistem otomatis merekomendasikan action yang aman.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/instruksi-lapangan/migrasi">
                            <Button variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Migrasi OPNAME_v1</Button>
                        </Link>
                        <Link href="/instruksi-lapangan">
                            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Kembali</Button>
                        </Link>
                    </div>
                </div>

                {/* Upload */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-5 w-5 text-red-700" />File rab_kedua</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                            <Input type="file" accept=".xlsx,.xls" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }} />
                            <Button variant="outline" onClick={analyze} disabled={!file || loading !== null}>
                                {loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}Analisis File
                            </Button>
                            <Button className="bg-red-700 hover:bg-red-800" onClick={commit} disabled={executable.length === 0 || loading !== null}>
                                {loading === "commit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Proses Migrasi ({number(executable.length)})
                            </Button>
                        </div>
                        {message && (
                            <div className={`flex gap-2 rounded-md border p-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                                {message.text}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {preview && <>
                    {/* Debug info jika kandidat 0 */}
                    {preview.total_candidates === 0 && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4 text-sm text-red-800">
                                <div className="font-semibold mb-2">⚠️ Tidak ada data IL yang valid ditemukan</div>
                                <div className="text-xs text-red-700 space-y-1">
                                    <div>Kemungkinan penyebab:</div>
                                    <ul className="list-disc list-inside ml-2">
                                        <li>Kolom "Nomor Ulok" kosong atau tidak ada</li>
                                        <li>Kolom "Lingkup_Pekerjaan" kosong atau tidak valid (harus Sipil/ME)</li>
                                        <li>Kolom "Status" tidak valid (harus Disetujui/Menunggu Persetujuan)</li>
                                        <li>Format file Excel tidak sesuai (harus memiliki sheet Form2 atau Form3)</li>
                                    </ul>
                                    <div className="mt-2">Buka Console Browser (F12) untuk detail debug log.</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {preview.total_candidates > 0 && <>
                    {/* Stats */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                        {([
                            ["Total IL", preview.total_candidates, "slate"],
                            ["Total Item", preview.total_items, "slate"],
                            ["Dari Form3", preview.source_breakdown?.from_form3 ?? 0, "blue"],
                            ["Dari Form2", preview.source_breakdown?.from_form2 ?? 0, "indigo"],
                            ["Siap Insert", preview.ready_count, "emerald"],
                            ["Conflict", preview.conflict_count, "amber"],
                            ["Aman Replace", preview.conflict_summary.safe_to_replace, "teal"],
                            ["Perlu Review", preview.conflict_count - preview.conflict_summary.safe_to_replace, "orange"],
                        ] as [string, number, string][]).map(([label, value, color]) => (
                            <Card key={label} className={color === "red" && value > 0 ? "border-red-200" : color === "orange" && value > 0 ? "border-orange-200" : ""}>
                                <CardContent className="p-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
                                    <div className={`mt-1 text-2xl font-extrabold ${
                                        color === "emerald" ? "text-emerald-700" :
                                        color === "red" ? "text-red-700" :
                                        color === "amber" ? "text-amber-700" :
                                        color === "teal" ? "text-teal-700" :
                                        color === "orange" ? "text-orange-700" :
                                        color === "blue" ? "text-blue-700" :
                                        color === "indigo" ? "text-indigo-700" : ""
                                    }`}>{number(value)}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Legenda conflict */}
                    {preview.conflict_count > 0 && (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3 font-semibold text-amber-800 text-sm">
                                    <Info className="h-4 w-4" />Panduan Conflict — Sistem sudah auto-set action yang direkomendasikan
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-xs">
                                    {Object.entries(conflictReasonConfig).map(([k, v]) => (
                                        <div key={k} className="rounded-md border bg-white p-3">
                                            <Badge className={`${v.badge} mb-1 border-none text-xs`}>{v.label}</Badge>
                                            <p className="text-slate-600 mt-1">{v.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {result && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            Hasil terakhir: {result.inserted} insert, {result.replaced} replace, {result.skipped} skip.
                        </div>
                    )}

                    {/* Tabel */}
                    <Card>
                        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                            <CardTitle className="text-base">Daftar Kandidat IL</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input className="pl-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ULOK, toko..." />
                                </div>
                                <Select value={filterConflict} onValueChange={setFilterConflict}>
                                    <SelectTrigger className="w-44"><SelectValue placeholder="Filter conflict" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="ready">Siap insert</SelectItem>
                                        <SelectItem value="safe_replace">Conflict aman replace</SelectItem>
                                        <SelectItem value="need_review">Conflict perlu review</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-36"><SelectValue placeholder="Status IL" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua status</SelectItem>
                                        <SelectItem value="disetujui">Disetujui</SelectItem>
                                        <SelectItem value="pending">Pending/Proses</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-[1400px] text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="p-3">
                                            <Checkbox
                                                checked={filtered.length > 0 && filtered.filter(r => r.db_state !== "invalid").every(r => selected.has(r.source_candidate_id))}
                                                onCheckedChange={(checked) => setSelected((cur) => {
                                                    const next = new Set(cur);
                                                    filtered.forEach(r => { if (r.db_state !== "invalid") checked ? next.add(r.source_candidate_id) : next.delete(r.source_candidate_id); });
                                                    return next;
                                                })}
                                            />
                                        </th>
                                        <th className="p-3">ULOK / Toko</th>
                                        <th className="p-3">Lingkup</th>
                                        <th className="p-3">Sheet</th>
                                        <th className="p-3">Status IL</th>
                                        <th className="p-3">Item</th>
                                        <th className="p-3">Total (Kalkulasi)</th>
                                        <th className="p-3">Status DB</th>
                                        <th className="p-3">Conflict</th>
                                        <th className="p-3">Data DB saat ini</th>
                                        <th className="p-3">Aksi</th>
                                        <th className="p-3">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => {
                                        const action = actions[row.source_candidate_id] ?? defaultAction(row);
                                        const conflictCfg = row.conflict_reason ? conflictReasonConfig[row.conflict_reason] : null;
                                        const rowBg =
                                            row.db_state === "ready" ? "" :
                                            row.db_state === "conflict" && row.safe_to_replace ? "bg-blue-50/30" :
                                            row.db_state === "conflict" ? "bg-amber-50/40" : "bg-red-50/30";

                                        return (
                                            <tr key={row.source_candidate_id} className={`border-t align-top ${rowBg}`}>
                                                <td className="p-3">
                                                    <Checkbox
                                                        disabled={row.db_state === "invalid"}
                                                        checked={selected.has(row.source_candidate_id)}
                                                        onCheckedChange={(checked) => setSelected((cur) => {
                                                            const next = new Set(cur); checked ? next.add(row.source_candidate_id) : next.delete(row.source_candidate_id); return next;
                                                        })}
                                                    />
                                                </td>
                                                <td className="py-3 font-semibold">{row.nomor_ulok}<div className="font-normal text-slate-500">{row.nama_toko ?? "-"}</div></td>
                                                <td className="py-3">{row.lingkup_pekerjaan}<div className="text-slate-500 text-xs">{row.cabang ?? "-"}</div></td>
                                                <td className="py-3">
                                                    <Badge className={row.source_sheet === "Form3" ? "bg-blue-100 text-blue-800 hover:bg-blue-100 border-none" : "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none"}>
                                                        {row.source_sheet}
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <Badge className={row.status === "Disetujui" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none" : "bg-amber-100 text-amber-800 hover:bg-amber-100 border-none"}>
                                                        {row.status === "Disetujui" ? "Disetujui" : "Pending"}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 font-semibold">{row.item_count} item</td>
                                                <td className="py-3">
                                                    {rupiah(row.grand_total)}
                                                    {Math.abs(row.grand_total - row.grand_total_excel) > 100 && (
                                                        <div className="text-xs text-amber-600">Excel: {rupiah(row.grand_total_excel)}</div>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="outline" className={
                                                        row.db_state === "ready" ? "border-emerald-300 text-emerald-700" :
                                                        row.db_state === "conflict" && row.safe_to_replace ? "border-blue-300 text-blue-700" :
                                                        row.db_state === "conflict" ? "border-amber-300 text-amber-700" :
                                                        "border-red-300 text-red-700"
                                                    }>
                                                        {row.db_state === "ready" ? "Siap insert" :
                                                         row.db_state === "conflict" && row.safe_to_replace ? "Conflict (aman)" :
                                                         row.db_state === "conflict" ? "Conflict (review)" : "Invalid"}
                                                    </Badge>
                                                </td>
                                                {/* Kolom conflict reason */}
                                                <td className="py-3">
                                                    {conflictCfg ? (
                                                        <div>
                                                            <Badge className={`${conflictCfg.badge} border-none text-xs`}>{conflictCfg.label}</Badge>
                                                        </div>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                {/* Data DB saat ini */}
                                                <td className="py-3 text-xs text-slate-500">
                                                    {row.existing_id ? (
                                                        <div className="space-y-0.5">
                                                            <div>Status: <span className="font-medium text-slate-700">{row.existing_status}</span></div>
                                                            <div>Items: <span className="font-medium text-slate-700">{row.existing_item_count}</span></div>
                                                            <div>Total: <span className="font-medium text-slate-700">{rupiah(row.existing_grand_total)}</span></div>
                                                            {row.existing_email && <div className="truncate max-w-[160px]" title={row.existing_email}>{row.existing_email}</div>}
                                                        </div>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="py-3">
                                                    <Select
                                                        disabled={row.db_state === "invalid"}
                                                        value={action}
                                                        onValueChange={(v) => setActions((cur) => ({ ...cur, [row.source_candidate_id]: v as InstruksiLapanganMigrationAction }))}
                                                    >
                                                        <SelectTrigger className={`w-36 ${action === "skip" ? "border-slate-200 text-slate-400" : action === "replace" ? "border-blue-300 text-blue-700" : "border-emerald-300 text-emerald-700"}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {row.db_state === "ready" && <SelectItem value="insert">✅ Insert baru</SelectItem>}
                                                            {row.db_state === "conflict" && <SelectItem value="replace">🔄 Replace</SelectItem>}
                                                            <SelectItem value="skip">⏭️ Skip</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="max-w-xs py-3 pr-3 text-xs">
                                                    {row.issues.map((issue) => <div key={issue} className="text-red-600">{issue}</div>)}
                                                    {row.warnings.slice(0, 2).map((w) => <div key={w} className="text-amber-600">{w}</div>)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={12} className="py-10 text-center text-sm text-slate-400">Tidak ada kandidat yang cocok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    </>}
                </>}
            </main>
        </div>
    );
}
