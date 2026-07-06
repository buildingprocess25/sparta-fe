"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import {
    approveDendaAction,
    createSpAction,
    fetchDendaActionCandidates,
    fetchDendaActions,
    rejectDendaAction,
    type DendaAction,
    type DendaActionCandidate,
    type SpReason,
} from "@/lib/denda-actions-api";
import { formatRupiah, parseCurrency } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock3, FileText, Loader2, RefreshCw, Search, Upload, XCircle } from "lucide-react";

const SP_REASON_LABELS: Record<SpReason, string> = {
    KETERLAMBATAN: "Keterlambatan",
    MENOLAK_SPK: "Menolak SPK",
    MANIPULASI: "Manipulasi",
};

const statusLabel = (status: string) => ({
    WAITING_MANAGER: "Menunggu Manager",
    REJECTED_BY_MANAGER: "Ditolak Manager",
    APPROVED: "Disetujui",
    SENT_TO_CONTRACTOR: "Dikirim Kontraktor",
    VIEWED_BY_CONTRACTOR: "Dilihat Kontraktor",
    ACKNOWLEDGED_BY_CONTRACTOR: "Diterima Kontraktor",
}[status] ?? status);

const normalize = (value?: string | null) => String(value ?? "").trim().toUpperCase();
const canApprove = (roles: string[], isHO: boolean) => isHO || roles.some((role) => role.includes("MANAGER") || role.includes("SUPER HUMAN"));
const canSubmit = (roles: string[], isHO: boolean) => isHO || roles.some((role) => role.includes("KOORDINATOR") || role.includes("COORDINATOR") || role.includes("SUPER HUMAN"));

export default function SuratPeringatanPage() {
    const { user, logout } = useSession();
    const [candidates, setCandidates] = useState<DendaActionCandidate[]>([]);
    const [actions, setActions] = useState<DendaAction[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [reason, setReason] = useState<SpReason>("KETERLAMBATAN");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const selected = useMemo(
        () => candidates.find((candidate) => candidate.opname_final_id === selectedId) ?? candidates[0] ?? null,
        [candidates, selectedId]
    );

    const filteredCandidates = useMemo(() => {
        const q = normalize(search);
        if (!q) return candidates;
        return candidates.filter((candidate) => [
            candidate.nomor_ulok,
            candidate.nama_toko,
            candidate.kode_toko,
            candidate.nama_kontraktor,
            candidate.cabang,
            candidate.nomor_spk,
        ].some((value) => normalize(value).includes(q)));
    }, [candidates, search]);

    const pendingActions = actions.filter((action) => action.action_type === "SP" && action.status === "WAITING_MANAGER");
    const approvedActions = actions.filter((action) => action.action_type === "SP" && action.status !== "WAITING_MANAGER");
    const userCanApprove = canApprove(user?.roles ?? [], Boolean(user?.isHO));
    const userCanSubmit = canSubmit(user?.roles ?? [], Boolean(user?.isHO));

    const loadData = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const [candidateResult, actionResult] = await Promise.all([
                fetchDendaActionCandidates(),
                fetchDendaActions(),
            ]);
            const nextCandidates = candidateResult.data.filter((candidate) => candidate.next_sp_level !== null || candidate.has_pending_approval);
            setCandidates(nextCandidates);
            setActions(actionResult.data.filter((action) => action.action_type === "SP"));
            setSelectedId((current) => current ?? nextCandidates[0]?.opname_final_id ?? null);
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal memuat Surat Peringatan." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const submitSp = async () => {
        if (!selected || !selected.next_sp_level || submitting) return;
        if (!file) {
            setMessage({ type: "error", text: "Lampiran pendukung wajib diupload." });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await createSpAction({
                id_opname_final: selected.opname_final_id,
                sp_level: selected.next_sp_level,
                alasan_sp: reason,
                catatan: note,
                lampiran: file,
            });
            setMessage({ type: "success", text: result.message });
            setNote("");
            setFile(null);
            await loadData();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal mengajukan SP." });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id: number) => {
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await approveDendaAction(id);
            setMessage({ type: "success", text: result.message });
            await loadData();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal approve SP." });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id: number) => {
        const alasan = rejectNote[id]?.trim();
        if (!alasan) {
            setMessage({ type: "error", text: "Alasan penolakan wajib diisi." });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await rejectDendaAction(id, alasan);
            setMessage({ type: "success", text: result.message });
            setRejectNote((prev) => ({ ...prev, [id]: "" }));
            await loadData();
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal reject SP." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <AppNavbar title="Surat Peringatan" showBackButton backHref="/dashboard" showLogout onLogout={logout} variant="clean" />

            <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-6">
                <section className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-lg border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Kandidat SP</p>
                                    <h1 className="text-xl font-black text-slate-950">Kontraktor Terlambat 11+ Hari</h1>
                                </div>
                                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>

                            <div className="mt-4 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                                <Search className="h-4 w-4 text-slate-400" />
                                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari ULOK, toko, kontraktor" className="border-0 px-0 shadow-none focus-visible:ring-0" />
                            </div>

                            <div className="mt-4 grid gap-2">
                                {loading ? (
                                    <div className="flex h-40 items-center justify-center text-sm font-semibold text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memuat data</div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">Tidak ada kandidat SP.</div>
                                ) : filteredCandidates.map((candidate) => {
                                    const active = candidate.opname_final_id === selected?.opname_final_id;
                                    return (
                                        <button
                                            key={candidate.opname_final_id}
                                            type="button"
                                            onClick={() => setSelectedId(candidate.opname_final_id)}
                                            className={`rounded-md border p-3 text-left transition ${active ? "border-red-300 bg-red-50" : "border-slate-200 bg-white hover:border-red-200"}`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-black text-slate-950">{candidate.nomor_ulok || "-"} · {candidate.nama_toko || "-"}</p>
                                                    <p className="mt-1 text-xs font-semibold text-slate-500">{candidate.nama_kontraktor || "Kontraktor belum terisi"}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge className="border-red-200 bg-red-50 text-red-700">{candidate.hari_denda} hari</Badge>
                                                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">SP ke-{candidate.next_sp_level ?? "-"}</Badge>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                                <span>{candidate.cabang || "-"}</span>
                                                <span>{candidate.lingkup_pekerjaan || "-"}</span>
                                                <span>{formatRupiah(parseCurrency(candidate.nilai_denda))}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Form SP</p>
                                    <h2 className="text-lg font-black text-slate-950">Pengajuan Surat Peringatan</h2>
                                </div>
                                {selected?.has_pending_approval ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Pending</Badge> : null}
                            </div>

                            {selected ? (
                                <div className="mt-4 space-y-4">
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-sm font-black text-slate-950">{selected.nama_kontraktor || "-"}</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">{selected.nomor_ulok || "-"} · {selected.nomor_spk || "SPK belum terisi"}</p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label>SP Ke</Label>
                                            <Input value={selected.next_sp_level ? `SP ${selected.next_sp_level}` : "Maksimal"} disabled className="mt-1" />
                                        </div>
                                        <div>
                                            <Label>Alasan SP</Label>
                                            <Select value={reason} onValueChange={(value) => setReason(value as SpReason)}>
                                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(SP_REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {reason === "KETERLAMBATAN" ? (
                                        <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                            {selected.hari_denda} hari keterlambatan · {formatRupiah(parseCurrency(selected.nilai_denda))}
                                        </div>
                                    ) : null}

                                    <div>
                                        <Label>Catatan</Label>
                                        <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-28" />
                                    </div>

                                    <div>
                                        <Label>Lampiran</Label>
                                        <label className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-sm font-semibold text-slate-500 hover:border-red-300 hover:bg-red-50">
                                            <Upload className="mb-2 h-5 w-5" />
                                            {file ? file.name : "Upload lampiran pendukung"}
                                            <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                                        </label>
                                    </div>

                                    <Button className="w-full bg-red-600 font-black hover:bg-red-700" onClick={submitSp} disabled={!userCanSubmit || submitting || selected.has_pending_approval || !selected.next_sp_level}>
                                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                        Ajukan SP
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">Pilih kandidat SP.</div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {message ? (
                    <div className={`rounded-md border px-4 py-3 text-sm font-bold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                        {message.text}
                    </div>
                ) : null}

                <section className="grid gap-3 lg:grid-cols-2">
                    <Card className="rounded-lg border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-600" /><h2 className="font-black text-slate-950">Menunggu Approval</h2></div>
                            <div className="mt-4 grid gap-3">
                                {pendingActions.length === 0 ? <p className="text-sm font-semibold text-slate-500">Tidak ada pengajuan pending.</p> : pendingActions.map((action) => (
                                    <div key={action.id} className="rounded-md border border-slate-200 bg-white p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-black text-slate-950">SP {action.sp_level} · {action.nama_kontraktor || "-"}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} · {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                            </div>
                                            <Badge className="border-amber-200 bg-amber-50 text-amber-700">{statusLabel(action.status)}</Badge>
                                        </div>
                                        {userCanApprove ? (
                                            <div className="mt-3 grid gap-2">
                                                <Textarea value={rejectNote[action.id] ?? ""} onChange={(event) => setRejectNote((prev) => ({ ...prev, [action.id]: event.target.value }))} placeholder="Alasan penolakan" className="min-h-20" />
                                                <div className="flex flex-wrap gap-2">
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(action.id)} disabled={submitting}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                                                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleReject(action.id)} disabled={submitting}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" /><h2 className="font-black text-slate-950">Riwayat SP</h2></div>
                            <div className="mt-4 grid gap-3">
                                {approvedActions.length === 0 ? <p className="text-sm font-semibold text-slate-500">Riwayat SP belum ada.</p> : approvedActions.map((action) => (
                                    <div key={action.id} className="rounded-md border border-slate-200 bg-white p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-black text-slate-950">SP {action.sp_level} · {action.nama_kontraktor || "-"}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} · {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                            </div>
                                            <Badge className={action.status === "REJECTED_BY_MANAGER" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{statusLabel(action.status)}</Badge>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{action.catatan || "-"}</p>
                                        {action.expires_at ? <p className="mt-2 text-[11px] font-bold text-slate-400">Expired: {new Date(action.expires_at).toLocaleDateString("id-ID")}</p> : null}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}
