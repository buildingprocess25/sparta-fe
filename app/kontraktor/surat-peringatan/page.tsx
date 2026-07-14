"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileDown, FileText, Clock, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/constants";

type SpStatus = "SENT_TO_CONTRACTOR" | "VIEWED_BY_CONTRACTOR" | "ACKNOWLEDGED_BY_CONTRACTOR" | "APPROVED";

type SuratPeringatanData = {
    id: number;
    nomor_surat: string | null;
    nomor_ulok: string | null;
    cabang: string | null;
    nomor_spk: string | null;
    sp_level: number | null;
    alasan_sp: string | null;
    catatan: string | null;
    lampiran_1_url: string | null;
    link_pdf: string | null;
    status: SpStatus;
    manager_approved_at: string | null;
    sent_to_contractor_at: string | null;
    viewed_by_contractor_at: string | null;
    acknowledged_by_contractor_at: string | null;
    acknowledged_by_email: string | null;
    catatan_acknowledge: string | null;
    expires_at: string | null;
    created_at: string;
    is_expired: boolean;
    is_active: boolean;
};

type KontraktorStats = {
    total_sp: number;
    active_sp: number;
    acknowledged_sp: number;
    pending_acknowledge: number;
};

export default function KontraktorSuratPeringatanPage() {
    const searchParams = useSearchParams();
    const idParam = searchParams?.get("id");
    const kontraktorParam = searchParams?.get("kontraktor");

    const [namaKontraktor, setNamaKontraktor] = useState(kontraktorParam || "");
    const [stats, setStats] = useState<KontraktorStats | null>(null);
    const [spList, setSpList] = useState<SuratPeringatanData[]>([]);
    const [selectedSp, setSelectedSp] = useState<SuratPeringatanData | null>(null);
    const [catatanAcknowledge, setCatatanAcknowledge] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (idParam && kontraktorParam) {
            // Deep link: auto-load specific SP
            setNamaKontraktor(kontraktorParam);
            loadSpDetail(parseInt(idParam), kontraktorParam);
        }
    }, [idParam, kontraktorParam]);

    const loadSpList = async () => {
        if (!namaKontraktor.trim()) {
            setError("Nama kontraktor wajib diisi");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/api/denda/actions/kontraktor/list?nama_kontraktor=${encodeURIComponent(namaKontraktor)}`,
                { credentials: "include" }
            );
            const json = await res.json();
            if (json.status === "success") {
                setStats(json.data.stats);
                setSpList(json.data.actions);
                if (json.data.actions.length === 0) {
                    setError("Tidak ada Surat Peringatan untuk kontraktor ini");
                }
            } else {
                setError(json.message || "Gagal memuat data");
            }
        } catch (err: any) {
            setError("Terjadi kesalahan saat memuat data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSpDetail = async (id: number, kontraktor: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/api/denda/actions/kontraktor/${id}?nama_kontraktor=${encodeURIComponent(kontraktor)}`,
                { credentials: "include" }
            );
            const json = await res.json();
            if (json.status === "success") {
                setSelectedSp(json.data);
                setNamaKontraktor(kontraktor);
                // Also load list for stats
                loadSpList();
            } else {
                setError(json.message || "Gagal memuat detail SP");
            }
        } catch (err: any) {
            setError("Terjadi kesalahan: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async () => {
        if (!selectedSp) return;
        
        setLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            const res = await fetch(
                `${API_URL}/api/denda/actions/kontraktor/${selectedSp.id}/acknowledge?nama_kontraktor=${encodeURIComponent(namaKontraktor)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ catatan_acknowledge: catatanAcknowledge }),
                }
            );
            const json = await res.json();
            if (json.status === "success") {
                setSuccessMessage("✅ Surat Peringatan berhasil di-acknowledge!");
                setSelectedSp(json.data);
                setCatatanAcknowledge("");
                // Reload list
                loadSpList();
            } else {
                setError(json.message || "Gagal acknowledge SP");
            }
        } catch (err: any) {
            setError("Terjadi kesalahan: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTanggal = (isoString?: string | null) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getSpLevelBadge = (level?: number | null) => {
        if (level === 1) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">SP I</Badge>;
        if (level === 2) return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">SP II</Badge>;
        if (level === 3) return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">SP III</Badge>;
        return <Badge variant="outline">SP</Badge>;
    };

    const getStatusBadge = (status: SpStatus, isExpired: boolean) => {
        if (isExpired) return <Badge variant="outline" className="bg-gray-100 text-gray-600">Expired</Badge>;
        if (status === "ACKNOWLEDGED_BY_CONTRACTOR") return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Acknowledged</Badge>;
        if (status === "VIEWED_BY_CONTRACTOR") return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><FileText className="w-3 h-3 mr-1" />Dilihat</Badge>;
        if (status === "SENT_TO_CONTRACTOR") return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300"><AlertTriangle className="w-3 h-3 mr-1" />Belum Dilihat</Badge>;
        return <Badge variant="outline">{status}</Badge>;
    };

    const getAlasanText = (alasan?: string | null) => {
        if (alasan === "KETERLAMBATAN") return "Keterlambatan Pekerjaan";
        if (alasan === "MENOLAK_SPK") return "Menolak SPK / Pekerjaan";
        if (alasan === "MANIPULASI") return "Tindakan Manipulasi / Pelanggaran Berat";
        return alasan || "-";
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">📋 Surat Peringatan Kontraktor</h1>
                <p className="text-slate-600">Dashboard untuk melihat dan mengakui penerimaan Surat Peringatan</p>
            </div>

            {/* Search/Login Section */}
            {!idParam && (
                <Card className="p-6 mb-6">
                    <Label className="block mb-2 font-semibold">Nama Kontraktor</Label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={namaKontraktor}
                            onChange={(e) => setNamaKontraktor(e.target.value)}
                            placeholder="Masukkan nama kontraktor Anda"
                            className="flex-1 px-4 py-2 border rounded-lg"
                            onKeyDown={(e) => e.key === "Enter" && loadSpList()}
                        />
                        <Button onClick={loadSpList} disabled={loading}>
                            {loading ? "Loading..." : "Lihat Surat Peringatan"}
                        </Button>
                    </div>
                </Card>
            )}

            {error && (
                <Card className="p-4 mb-6 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </Card>
            )}

            {successMessage && (
                <Card className="p-4 mb-6 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{successMessage}</span>
                    </div>
                </Card>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="text-sm text-slate-600 mb-1">Total SP</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.total_sp}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-600 mb-1">SP Aktif</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.active_sp}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-600 mb-1">Pending Acknowledge</div>
                        <div className="text-2xl font-bold text-amber-600">{stats.pending_acknowledge}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-600 mb-1">Acknowledged</div>
                        <div className="text-2xl font-bold text-green-600">{stats.acknowledged_sp}</div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SP List */}
                <Card className="p-6 lg:col-span-1">
                    <h2 className="font-bold text-lg mb-4">Daftar Surat Peringatan</h2>
                    {spList.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Belum ada Surat Peringatan</p>
                    ) : (
                        <div className="space-y-3">
                            {spList.map((sp) => (
                                <div
                                    key={sp.id}
                                    onClick={() => setSelectedSp(sp)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedSp?.id === sp.id
                                            ? "border-red-500 bg-red-50"
                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        {getSpLevelBadge(sp.sp_level)}
                                        {getStatusBadge(sp.status, sp.is_expired)}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-800 mb-1">
                                        {sp.nomor_surat || `SP #${sp.id}`}
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        {sp.cabang} • {sp.nomor_ulok || "-"}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {formatTanggal(sp.manager_approved_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* SP Detail */}
                <Card className="p-6 lg:col-span-2">
                    {!selectedSp ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Pilih Surat Peringatan dari daftar untuk melihat detail</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                        {selectedSp.nomor_surat || `Surat Peringatan #${selectedSp.id}`}
                                    </h2>
                                    <div className="flex gap-2">
                                        {getSpLevelBadge(selectedSp.sp_level)}
                                        {getStatusBadge(selectedSp.status, selectedSp.is_expired)}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                                <div>
                                    <Label className="text-xs text-slate-500">Nomor ULOK</Label>
                                    <div className="font-semibold">{selectedSp.nomor_ulok || "-"}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Cabang</Label>
                                    <div className="font-semibold">{selectedSp.cabang || "-"}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Nomor SPK</Label>
                                    <div className="font-semibold">{selectedSp.nomor_spk || "-"}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Alasan SP</Label>
                                    <div className="font-semibold text-red-600">{getAlasanText(selectedSp.alasan_sp)}</div>
                                </div>
                            </div>

                            {/* Catatan */}
                            {selectedSp.catatan && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Label className="text-xs font-bold text-yellow-800 mb-2 block">CATATAN MANAGER</Label>
                                    <p className="text-sm text-yellow-900">{selectedSp.catatan}</p>
                                </div>
                            )}

                            {/* Masa Berlaku */}
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                                <Label className="text-xs text-slate-500 block mb-1">Masa Berlaku (6 Bulan)</Label>
                                <div className="font-semibold text-slate-800">
                                    s/d {formatTanggal(selectedSp.expires_at)}
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="mb-6 flex gap-3">
                                {selectedSp.link_pdf && (
                                    <a
                                        href={`${API_URL}/api/denda/actions/proxy-file?url=${encodeURIComponent(selectedSp.link_pdf)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Download PDF SP
                                    </a>
                                )}
                                {selectedSp.lampiran_1_url && (
                                    <a
                                        href={`${API_URL}/api/denda/actions/proxy-file?url=${encodeURIComponent(selectedSp.lampiran_1_url)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Lihat Lampiran
                                    </a>
                                )}
                            </div>

                            {/* Acknowledgement Section */}
                            {selectedSp.status === "ACKNOWLEDGED_BY_CONTRACTOR" ? (
                                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        <h3 className="font-bold text-green-800">Sudah Di-acknowledge</h3>
                                    </div>
                                    <div className="text-sm text-green-700 space-y-1">
                                        <div>Oleh: {selectedSp.acknowledged_by_email || "-"}</div>
                                        <div>Pada: {formatTanggal(selectedSp.acknowledged_by_contractor_at)}</div>
                                        {selectedSp.catatan_acknowledge && (
                                            <div className="mt-3 p-3 bg-white rounded">
                                                <Label className="text-xs block mb-1">Catatan:</Label>
                                                <p>{selectedSp.catatan_acknowledge}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : selectedSp.is_expired ? (
                                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">Surat Peringatan ini sudah expired</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Action Required: Acknowledge Surat Peringatan
                                    </h3>
                                    <p className="text-sm text-amber-700 mb-4">
                                        Anda diwajibkan untuk mengakui bahwa telah menerima dan membaca surat peringatan ini.
                                        Silakan tambahkan catatan jika diperlukan.
                                    </p>
                                    <Label className="block mb-2">Catatan (Opsional)</Label>
                                    <Textarea
                                        value={catatanAcknowledge}
                                        onChange={(e) => setCatatanAcknowledge(e.target.value)}
                                        placeholder="Tambahkan catatan tanggapan Anda..."
                                        rows={3}
                                        className="mb-4"
                                    />
                                    <Button
                                        onClick={handleAcknowledge}
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-700"
                                    >
                                        {loading ? "Processing..." : "✓ Acknowledge Surat Peringatan"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
