"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import {
    approveDendaAction,
    createSpAction,
    fetchDendaActionCandidates,
    fetchDendaActionKontraktor,
    fetchDendaActions,
    rejectDendaAction,
    type DendaAction,
    type DendaActionCandidate,
    type SpReason,
} from "@/lib/denda-actions-api";
import { formatRupiah, parseCurrency } from "@/lib/utils";
import { canAccessBranchForUser, getSessionBranchCoverage } from "@/lib/constants";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, FileText, Loader2, RefreshCw, Search, Upload, XCircle } from "lucide-react";

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
const canSubmit = (roles: string[], _isHO: boolean) => roles.some((role) => role.includes("KOORDINATOR") || role.includes("COORDINATOR") || role.includes("SUPER HUMAN") || role.includes("HEAD OFFICE"));

export default function SuratPeringatanPage() {
    const { user } = useSession();
    const [candidates, setCandidates] = useState<DendaActionCandidate[]>([]);
    const [contractors, setContractors] = useState<string[]>([]);
    const [actions, setActions] = useState<DendaAction[]>([]);
    const [selectedContractor, setSelectedContractor] = useState<string>("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [reason, setReason] = useState<SpReason>("KETERLAMBATAN");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [spLevel, setSpLevel] = useState<1 | 2 | 3>(1);

    const selected = useMemo(
        () => candidates.find((candidate) => candidate.id_toko === selectedId) ?? null,
        [candidates, selectedId]
    );

    const filteredCandidates = useMemo(() => {
        let base = candidates;
        
        if (user && !user.roles.includes("SUPER HUMAN")) {
            if (user.isHO) {
                base = base.filter((c) => normalize(c.cabang) === "HEAD OFFICE");
            } else {
                base = base.filter((c) => canAccessBranchForUser(c.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage()));
            }
        }
        
        if (selectedContractor) {
            base = base.filter(c => normalize(c.nama_kontraktor) === normalize(selectedContractor));
        }

        if (reason === "KETERLAMBATAN") {
            base = base.filter((c) => Number(c.hari_denda) > 0);
        }

        const q = normalize(search);
        if (!q) return base;
        return base.filter((candidate) => [
            candidate.nomor_ulok,
            candidate.nama_toko,
            candidate.kode_toko,
            candidate.cabang,
            candidate.nomor_spk,
        ].some((value) => normalize(value).includes(q)));
    }, [candidates, search, reason, selectedContractor, user]);

    const availableContractors = useMemo(() => {
        if (!user || user.roles.includes("SUPER HUMAN")) {
            return contractors;
        }
        
        let branchCandidates = candidates;
        if (user.isHO) {
            branchCandidates = candidates.filter((c) => normalize(c.cabang) === "HEAD OFFICE");
        } else {
            branchCandidates = candidates.filter((c) => canAccessBranchForUser(c.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage()));
        }
        
        const validContractors = new Set(branchCandidates.map((c) => normalize(c.nama_kontraktor)));
        
        return contractors.filter((c) => validContractors.has(normalize(c)));
    }, [contractors, candidates, user]);

    useEffect(() => {
        if (reason === "MANIPULASI") {
            setSelectedId(null);
        } else if (reason === "KETERLAMBATAN" && selected && selected.hari_denda <= 0) {
            setSelectedId(null);
        }
    }, [reason, selected]);

    const pendingActions = actions.filter((action) => {
        if (action.action_type !== "SP" || action.status !== "WAITING_MANAGER") return false;
        if (!user || user.roles.includes("SUPER HUMAN")) return true;
        if (user.isHO) return normalize(action.cabang) === "HEAD OFFICE";
        return canAccessBranchForUser(action.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage());
    });
    
    const approvedActions = actions.filter((action) => {
        if (action.action_type !== "SP" || action.status === "WAITING_MANAGER") return false;
        if (!user || user.roles.includes("SUPER HUMAN")) return true;
        if (user.isHO) return normalize(action.cabang) === "HEAD OFFICE";
        return canAccessBranchForUser(action.cabang ?? "", user.roles ?? [], user.cabang ?? null, getSessionBranchCoverage());
    });
    const userCanApprove = canApprove(user?.roles ?? [], Boolean(user?.isHO));
    const userCanSubmit = canSubmit(user?.roles ?? [], Boolean(user?.isHO));

    const loadData = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const [candidateResult, actionResult, kontraktorResult] = await Promise.all([
                fetchDendaActionCandidates(),
                fetchDendaActions(),
                fetchDendaActionKontraktor(),
            ]);
            const nextCandidates = candidateResult.data.filter((candidate) => candidate.next_sp_level !== null || candidate.has_pending_approval);
            setCandidates(nextCandidates);
            setContractors(kontraktorResult.data);
            setActions(actionResult.data.filter((action) => action.action_type === "SP"));
            
            if (!selectedContractor && kontraktorResult.data.length > 0) {
                setSelectedContractor(kontraktorResult.data[0]);
            }
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
        if (submitting || !selectedContractor) return;
        
        const isManipulasi = reason === "MANIPULASI";
        
        if (!isManipulasi && !selected) {
            setMessage({ type: "error", text: "Pilih kandidat ULOK untuk alasan selain Manipulasi." });
            return;
        }
        
        if (!file) {
            setMessage({ type: "error", text: "Lampiran pendukung wajib diupload." });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            const payload: any = {
                sp_level: reason === "MANIPULASI" ? spLevel : spLevel,
                alasan_sp: reason,
                catatan: note,
                lampiran: file,
            };
            
            if (isManipulasi) {
                payload.nama_kontraktor = selectedContractor;
            } else {
                payload.id_toko = selected!.id_toko;
                payload.id_opname_final = selected!.opname_final_id;
            }

            const result = await createSpAction(payload);
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
        <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
            <AppNavbar title="SURAT PERINGATAN" showBackButton backHref="/dashboard" />

            <main className="max-w-5xl mx-auto p-4 md:p-8 mt-4">
                <Card className="shadow-sm border-slate-200 relative z-10">
                    <div className="p-6 border-b border-slate-100 bg-white rounded-t-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-6 h-6"/></div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Pengajuan Surat Peringatan</h2>
                                <p className="text-sm text-slate-500">Pilih kandidat dan alasan untuk mengajukan Surat Peringatan.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selected?.has_pending_approval ? <Badge className="border-amber-200 bg-amber-50 text-amber-700 hidden sm:inline-flex">Pending</Badge> : null}
                            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>

                    <CardContent className="p-6 md:p-8 bg-slate-50/50">
                        {message ? (
                            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 font-medium text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                                <p>{message.text}</p>
                            </div>
                        ) : null}

                        <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                            <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">1. Data Kandidat &amp; Alasan SP</h3>
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Kontraktor Dropdown */}
                                <div>
                                    <Label className="text-sm font-bold text-slate-700 mb-2 block">Pilih Kontraktor *</Label>
                                    <Select value={selectedContractor} onValueChange={(val) => { setSelectedContractor(val); setSelectedId(null); }}>
                                        <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11"><SelectValue placeholder="Pilih kontraktor..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableContractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Alasan SP */}
                                <div>
                                    <Label className="text-sm font-bold text-slate-700 mb-2 block">Alasan Surat Peringatan *</Label>
                                    <Select value={reason} onValueChange={(value) => setReason(value as SpReason)}>
                                        <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(SP_REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Kandidat SP Dropdown */}
                            {reason !== "MANIPULASI" && (
                                <div className="mt-6">
                                    <Label className="text-sm font-bold text-slate-700 mb-2 block">Pilih Kandidat (ULOK) *</Label>
                                    <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between h-auto min-h-11 py-2.5 px-3.5 text-left font-normal border-slate-300 hover:bg-slate-50" disabled={!selectedContractor}>
                                                {selected ? (
                                                    <div className="flex flex-col gap-0.5 items-start">
                                                        <span className="font-bold text-slate-950 text-sm line-clamp-1">{selected.nomor_ulok || "-"} · {selected.nama_toko || "-"}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500">{!selectedContractor ? "Pilih kontraktor terlebih dahulu..." : "Klik untuk memilih kandidat..."}</span>
                                                )}
                                                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
                                            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 bg-slate-50/50 rounded-t-xl">
                                                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ULOK, toko" className="border-0 px-0 shadow-none focus-visible:ring-0 h-8 bg-transparent" />
                                            </div>
                                            <div className="max-h-72 overflow-y-auto p-1.5 grid gap-1">
                                                {loading ? (
                                                    <div className="p-4 text-center text-sm font-medium text-slate-500">Memuat data...</div>
                                                ) : filteredCandidates.length === 0 ? (
                                                    <div className="p-4 text-center text-sm font-medium text-slate-500">
                                                        {reason === "KETERLAMBATAN" ? "Tidak ada kandidat yang terlambat saat ini untuk kontraktor ini." : "Tidak ada kandidat ditemukan untuk kontraktor ini."}
                                                    </div>
                                                ) : (
                                                    filteredCandidates.map((candidate) => (
                                                        <button
                                                            key={candidate.id_toko}
                                                            type="button"
                                                            onClick={() => { setSelectedId(candidate.id_toko); setOpenDropdown(false); }}
                                                            className={`w-full flex flex-col gap-1 rounded-md p-2.5 text-left transition hover:bg-slate-100 ${selectedId === candidate.id_toko ? "bg-red-50 border border-red-200 text-red-950 hover:bg-red-100" : "text-slate-700"}`}
                                                        >
                                                            <div className="flex justify-between items-start gap-2 w-full">
                                                                <span className="font-bold text-sm text-slate-950 line-clamp-1">{candidate.nomor_ulok} · {candidate.nama_toko}</span>
                                                                <div className="flex gap-1 shrink-0">
                                                                    {candidate.hari_denda > 0 ? <Badge className="border-red-200 bg-red-50 text-red-700 text-[10px] px-1.5 py-0">Late {candidate.hari_denda}d</Badge> : null}
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
                                                                <span>{candidate.cabang || "-"}</span>
                                                                <span>{candidate.lingkup_pekerjaan || "-"}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>

                        {selectedContractor && (reason === "MANIPULASI" || selected) ? (
                            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                                <h3 className="font-bold text-slate-700 border-b pb-2 mb-4">2. Detail SP &amp; Lampiran</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Tingkat SP</Label>
                                        {(() => {
                                            // Tentukan level yang sudah ada untuk toko/kontraktor ini
                                            const existingLevels = new Set(
                                                actions
                                                    .filter((a) => a.action_type === "SP" &&
                                                        (reason === "MANIPULASI"
                                                            ? normalize(a.nama_kontraktor) === normalize(selectedContractor)
                                                            : a.id_toko === selected?.id_toko) &&
                                                        ["APPROVED", "SENT_TO_CONTRACTOR", "VIEWED_BY_CONTRACTOR", "ACKNOWLEDGED_BY_CONTRACTOR"].includes(a.status))
                                                    .map((a) => a.sp_level)
                                            );
                                            const allLevels = [1, 2, 3] as const;
                                            return (
                                                <Select value={String(spLevel)} onValueChange={(v) => setSpLevel(Number(v) as 1 | 2 | 3)}>
                                                    <SelectTrigger className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 h-11">
                                                        <SelectValue placeholder="Pilih tingkat SP..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allLevels.map((lvl) => (
                                                            <SelectItem key={lvl} value={String(lvl)} disabled={existingLevels.has(lvl)}>
                                                                Surat Peringatan Ke-{lvl}{existingLevels.has(lvl) ? " (sudah ada)" : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        })()}
                                    </div>
                                    {reason === "KETERLAMBATAN" && selected ? (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700">Total Denda Sementara</Label>
                                            <div className="flex h-11 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700">
                                                {formatRupiah(parseCurrency(selected.nilai_denda))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Catatan Tambahan</Label>
                                        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Masukkan instruksi tindak lanjut atau catatan tambahan..." className="min-h-[120px] resize-none border-slate-300 focus:ring-red-500 rounded-lg p-3" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Upload Lampiran Pendukung *</Label>
                                        <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 text-center transition hover:border-red-400 hover:bg-red-50/50 group">
                                            <Upload className="mb-2 h-6 w-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                                            <span className="text-sm font-semibold text-slate-600 group-hover:text-red-600">{file ? file.name : "Klik atau Drop file di sini"}</span>
                                            <span className="text-xs text-slate-400 mt-1">Maks. 5MB (PDF/JPG/PNG)</span>
                                            <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {selectedContractor && (reason === "MANIPULASI" || selected) ? (
                            <div className="pt-2">
                                <Button className="w-full h-14 text-lg font-bold shadow-lg transition-all bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={submitSp} disabled={!userCanSubmit || submitting || (reason !== "MANIPULASI" && selected?.has_pending_approval)}>
                                    {submitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <FileText className="mr-2 h-6 w-6" />}
                                    {reason !== "MANIPULASI" && selected?.has_pending_approval ? "SP Sedang Dalam Proses Approval" : "Ajukan Surat Peringatan"}
                                </Button>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* History & Approval Section */}
                <div className="grid gap-6 lg:grid-cols-2 mt-8">
                    <Card className="rounded-xl border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-white rounded-t-xl flex items-center gap-2">
                            <Clock3 className="h-5 w-5 text-amber-600" />
                            <h2 className="font-bold text-slate-800">Menunggu Approval</h2>
                        </div>
                        <CardContent className="p-4 bg-slate-50/50">
                            <div className="grid gap-3">
                                {pendingActions.length === 0 ? <p className="text-sm font-semibold text-slate-500 text-center py-4">Tidak ada pengajuan pending.</p> : pendingActions.map((action) => (
                                    <div key={action.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">SP {action.sp_level} · {action.nama_kontraktor || "-"}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} · {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                            </div>
                                            <Badge className="border-amber-200 bg-amber-50 text-amber-700 shadow-none">{statusLabel(action.status)}</Badge>
                                        </div>
                                        {userCanApprove ? (
                                            <div className="mt-4 pt-3 border-t border-slate-100 grid gap-2">
                                                <Textarea value={rejectNote[action.id] ?? ""} onChange={(event) => setRejectNote((prev) => ({ ...prev, [action.id]: event.target.value }))} placeholder="Isi alasan jika ingin menolak..." className="min-h-20 text-sm resize-none rounded-lg" />
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => handleApprove(action.id)} disabled={submitting}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                                                    <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm" onClick={() => handleReject(action.id)} disabled={submitting}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-white rounded-t-xl flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h2 className="font-bold text-slate-800">Riwayat Surat Peringatan</h2>
                        </div>
                        <CardContent className="p-4 bg-slate-50/50">
                            <div className="grid gap-3">
                                {approvedActions.length === 0 ? <p className="text-sm font-semibold text-slate-500 text-center py-4">Riwayat SP belum ada.</p> : approvedActions.map((action) => (
                                    <div key={action.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">SP {action.sp_level} · {action.nama_kontraktor || "-"}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">{action.nomor_ulok || "-"} · {SP_REASON_LABELS[action.alasan_sp ?? "KETERLAMBATAN"]}</p>
                                            </div>
                                            <Badge className={action.status === "REJECTED_BY_MANAGER" ? "border-red-200 bg-red-50 text-red-700 shadow-none" : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"}>{statusLabel(action.status)}</Badge>
                                        </div>
                                        {action.catatan && <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">{action.catatan}</p>}
                                        {action.expires_at ? <p className="mt-2 text-[10px] font-bold text-slate-400">Expired: {new Date(action.expires_at).toLocaleDateString("id-ID")}</p> : null}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
