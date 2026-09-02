import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Loader2, Building2, MapPin, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import { formatRupiah, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type DrilldownLayer = 'RANKING' | 'SP_HISTORY' | 'ULOK_LIST' | 'SCOPE' | 'DETAIL';

interface ContractorDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
    initialLayer: DrilldownLayer;
    initialMetric?: string;
    initialKontraktor?: string;
    filters: any;
}

export function ContractorDrilldownModal({ 
    isOpen, 
    onClose, 
    token, 
    initialLayer, 
    initialMetric, 
    initialKontraktor,
    filters 
}: ContractorDrilldownModalProps) {
    const [layer, setLayer] = useState<DrilldownLayer>(initialLayer);
    const [history, setHistory] = useState<DrilldownLayer[]>([]);
    
    // State Selections
    const [metric, setMetric] = useState(initialMetric);
    const [kontraktor, setKontraktor] = useState(initialKontraktor);
    const [idToko, setIdToko] = useState<string | null>(null);
    const [lingkup, setLingkup] = useState<string | null>(null);
    
    // Data States
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLayer(initialLayer);
            setMetric(initialMetric);
            setKontraktor(initialKontraktor);
            setHistory([]);
            fetchData(initialLayer, initialMetric, initialKontraktor, null, null);
        }
    }, [isOpen, initialLayer, initialMetric, initialKontraktor]);

    const goForward = (nextLayer: DrilldownLayer, newParams: any = {}) => {
        setHistory(prev => [...prev, layer]);
        setLayer(nextLayer);
        
        const nextMetric = newParams.metric !== undefined ? newParams.metric : metric;
        const nextKontraktor = newParams.kontraktor !== undefined ? newParams.kontraktor : kontraktor;
        const nextIdToko = newParams.idToko !== undefined ? newParams.idToko : idToko;
        const nextLingkup = newParams.lingkup !== undefined ? newParams.lingkup : lingkup;
        
        if (newParams.metric !== undefined) setMetric(newParams.metric);
        if (newParams.kontraktor !== undefined) setKontraktor(newParams.kontraktor);
        if (newParams.idToko !== undefined) setIdToko(newParams.idToko);
        if (newParams.lingkup !== undefined) setLingkup(newParams.lingkup);

        fetchData(nextLayer, nextMetric, nextKontraktor, nextIdToko, nextLingkup);
    };

    const goBack = () => {
        if (history.length === 0) {
            onClose();
            return;
        }
        const prevLayer = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setLayer(prevLayer);
        fetchData(prevLayer, metric, kontraktor, idToko, lingkup);
    };

    const fetchData = async (
        currentLayer: DrilldownLayer, 
        currentMetric: string | undefined, 
        currentKontraktor: string | undefined,
        currentIdToko: string | null,
        currentLingkup: string | null
    ) => {
        if (!token) return;
        setIsLoading(true);
        try {
            let endpoint = '';
            const params = new URLSearchParams();
            
            if (currentLayer === 'RANKING') {
                endpoint = '/api/dashboard/contractor/drilldown-ranking';
                params.append('metric', currentMetric || '');
                params.append('cabang', filters.cabang || 'ALL');
                params.append('job_type', filters.job_type || 'ALL');
                params.append('period', filters.period || 'THIS_YEAR');
            } else if (currentLayer === 'SP_HISTORY') {
                endpoint = '/api/dashboard/contractor/drilldown-sp-history';
                params.append('kontraktor', currentKontraktor || '');
            } else if (currentLayer === 'ULOK_LIST') {
                endpoint = '/api/dashboard/contractor/drilldown-ulok';
                params.append('kontraktor', currentKontraktor || '');
                if (currentIdToko) params.append('id_toko', currentIdToko);
            } else if (currentLayer === 'DETAIL') {
                endpoint = '/api/dashboard/contractor/drilldown-detail';
                params.append('id_toko', currentIdToko || '');
                params.append('lingkup', currentLingkup || '');
            } else if (currentLayer === 'SCOPE') {
                // Not fetching from API, using the previously fetched ULOK scopes
                setIsLoading(false);
                return;
            }

            const res = await apiFetch(`${API_URL}${endpoint}?${params.toString()}`);
            const result = await res.json();
            if (res.ok) setData(result.data);
        } catch (error) {
            console.error("Drilldown fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeaderTitle = () => {
        switch (layer) {
            case 'RANKING': return `Ranking ${metric?.replace('_', ' ').toUpperCase()}`;
            case 'SP_HISTORY': return `Riwayat SP: ${kontraktor}`;
            case 'ULOK_LIST': return `Daftar ULOK: ${kontraktor}`;
            case 'SCOPE': return `Pilih Lingkup Pekerjaan`;
            case 'DETAIL': return `Detail Evaluasi (Tamat)`;
            default: return 'Drilldown';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-3xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white/80 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        {history.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogTitle className="text-lg font-bold tracking-tight text-slate-800">
                            {renderHeaderTitle()}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat data drilldown...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {layer === 'RANKING' && <LayerRanking data={data} metric={metric} onRowClick={(k) => goForward('ULOK_LIST', { kontraktor: k })} />}
                            {layer === 'SP_HISTORY' && <LayerSpHistory data={data} onRowClick={(id) => goForward('ULOK_LIST', { idToko: id })} />}
                            {layer === 'ULOK_LIST' && <LayerUlokList data={data} onRowClick={(item) => {
                                setData(item); // Pass full item to SCOPE layer
                                goForward('SCOPE', { idToko: item.id_toko });
                            }} />}
                            {layer === 'SCOPE' && <LayerScope data={data} onScopeSelect={(lingkup) => goForward('DETAIL', { lingkup })} />}
                            {layer === 'DETAIL' && <LayerDetail data={data} />}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LayerRanking({ data, metric, onRowClick }: { data: any[], metric?: string, onRowClick: (kontraktor: string) => void }) {
    if (!data?.length) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 gap-3">
            {data.map((row, idx) => (
                <div 
                    key={idx} 
                    onClick={() => onRowClick(row.nama_kontraktor)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            #{idx + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{row.nama_kontraktor}</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-black text-lg text-emerald-600">
                                {metric === 'avg_denda' || metric === 'kerja_tambah' || metric === 'kerja_kurang' 
                                    ? formatRupiah(row.metric_value)
                                    : metric === 'avg_keterlambatan' 
                                        ? `${Math.round(row.metric_value)} Hari`
                                        : `${row.metric_value} ${row.metric_label}`}
                            </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function LayerSpHistory({ data, onRowClick }: { data: any[], onRowClick: (idToko: string) => void }) {
    if (!data?.length) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 gap-4">
            {data.map((row, idx) => (
                <div 
                    key={idx} 
                    onClick={() => onRowClick(row.id_toko)}
                    className="flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group"
                >
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-bold tracking-widest uppercase">
                            {row.action_type}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-400">{new Date(row.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{row.alasan_sp}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <MapPin className="h-4 w-4" />
                            {row.nama_toko}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function LayerUlokList({ data, onRowClick }: { data: any[], onRowClick: (item: any) => void }) {
    if (!data?.length) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 gap-4">
            {data.map((row, idx) => (
                <div 
                    key={idx} 
                    onClick={() => onRowClick(row)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all group gap-4"
                >
                    <div>
                        <Badge variant="outline" className="mb-2 bg-slate-50 text-slate-500 border-slate-200 font-bold">{row.cabang}</Badge>
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{row.nama_toko}</h4>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <span className="text-slate-400">ULOK:</span> {row.nomor_ulok}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {row.nilai_toko > 0 && (
                            <div className="px-4 py-2 rounded-xl bg-slate-50 text-center border border-slate-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Nilai Toko</p>
                                <p className={cn("font-black text-lg", row.nilai_toko >= 80 ? "text-emerald-600" : row.nilai_toko >= 60 ? "text-amber-500" : "text-rose-500")}>
                                    {row.nilai_toko}
                                </p>
                            </div>
                        )}
                        {Number(row.hari_denda) > 0 && (
                            <div className="px-4 py-2 rounded-xl bg-rose-50 text-center border border-rose-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-0.5">Keterlambatan</p>
                                <p className="font-black text-lg text-rose-600">{row.hari_denda} Hr</p>
                            </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function LayerScope({ data, onScopeSelect }: { data: any, onScopeSelect: (lingkup: string) => void }) {
    if (!data?.scopes?.length) return <EmptyState />;
    
    // Deduplicate scopes
    const uniqueScopes = Array.from(new Set(data.scopes.map((s: any) => s.lingkup_pekerjaan)));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uniqueScopes.map((scope: any, idx) => (
                <div 
                    key={idx} 
                    onClick={() => onScopeSelect(scope)}
                    className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-[0_8px_30px_rgb(52,211,153,0.15)] cursor-pointer transition-all group"
                >
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center mb-4 transition-colors">
                        <FileText className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h3 className="font-black text-xl text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{scope}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Pilih Lingkup</p>
                </div>
            ))}
        </div>
    );
}

function LayerDetail({ data }: { data: any }) {
    if (!data) return <EmptyState />;
    return (
        <div className="flex flex-col gap-8">
            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <h4 className="text-xl font-bold tracking-tight text-slate-900">Identitas Proyek</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Cabang" value={data.cabang} />
                    <Field label="Nomor ULOK" value={data.nomor_toko} highlight />
                    <Field label="Toko" value={data.nama_toko} />
                    <Field label="Lingkup Pekerjaan" value={data.lingkup_pekerjaan} />
                </div>
            </section>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <h4 className="text-xl font-bold tracking-tight text-slate-900">Evaluasi Pekerjaan</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field 
                        label="Hari Keterlambatan" 
                        value={`${data.hari_denda || 0} Hari`} 
                        highlight={Number(data.hari_denda) > 0} 
                        alert={Number(data.hari_denda) > 0}
                    />
                    <Field 
                        label="Nilai Denda" 
                        value={formatRupiah(data.nilai_denda || 0)} 
                        highlight={Number(data.nilai_denda) > 0} 
                        alert={Number(data.nilai_denda) > 0}
                    />
                    <Field 
                        label={Number(data.selisih_kerja) >= 0 ? "Kerja Tambah" : "Kerja Kurang"} 
                        value={formatRupiah(Math.abs(Number(data.selisih_kerja || 0)))} 
                    />
                    <Field label="Grand Total Opname" value={formatRupiah(data.grand_total_opname || 0)} />
                </div>
            </section>

            {data.item_stats && data.item_stats.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <h4 className="text-xl font-bold tracking-tight text-slate-900">Sampel Kualitas</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {data.item_stats.slice(0, 5).map((stat: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                                <span className="text-sm font-bold text-slate-500">Item #{idx + 1}</span>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", stat.kualitas === 'Baik' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                        K: {stat.kualitas}
                                    </Badge>
                                    <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", stat.desain === 'Sesuai' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                        D: {stat.desain}
                                    </Badge>
                                    <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", stat.spesifikasi === 'Sesuai' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                        S: {stat.spesifikasi}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

const Field = ({ label, value, highlight, alert }: { label: string; value: string; highlight?: boolean; alert?: boolean }) => (
    <div className={cn(
        "relative flex flex-col justify-center overflow-hidden rounded-[20px] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        alert
            ? "bg-gradient-to-br from-rose-50/80 to-white/90 border border-rose-200/60 shadow-[0_8px_30px_rgb(225,29,72,0.06)]"
        : highlight
            ? "bg-gradient-to-br from-emerald-50/80 to-white/90 border border-emerald-200/60 shadow-[0_8px_30px_rgb(16,185,129,0.06)]"
            : "bg-white/80 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-slate-300/60"
    )}>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest", alert ? "text-rose-600/80" : highlight ? "text-emerald-600/80" : "text-slate-400")}>{label}</p>
        <p className={cn("mt-1 text-lg font-bold tracking-tight", alert ? "text-rose-700" : highlight ? "text-emerald-700" : "text-slate-900")}>{value}</p>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-slate-300" />
        </div>
        <h4 className="text-lg font-bold text-slate-800">Tidak ada data</h4>
        <p className="text-sm font-medium text-slate-500 mt-1">Data tidak ditemukan untuk pilihan ini.</p>
    </div>
);
