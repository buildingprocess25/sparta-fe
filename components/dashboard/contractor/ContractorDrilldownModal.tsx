import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Loader2, Building2, MapPin, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, TrendingDown, FileText, Search, Zap, PenTool, Award, FileCheck2, Clock, Activity, Store, Layout } from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import { formatRupiah, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { KpiTimeline } from '../v3/kpi-timeline';

type DrilldownLayer = 'RANKING' | 'SP_HISTORY' | 'SP_ACTIVE_ALL' | 'SP_SINGLE' | 'ULOK_LIST' | 'SCOPE' | 'DETAIL' | 'SEARCH_RESULTS';

interface HistoryState {
    layer: DrilldownLayer;
    metric?: string;
    kontraktor?: string;
    idToko: string | null;
    lingkup: string | null;
    data: any;
    searchQuery?: string;
}

interface ContractorDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLayer: DrilldownLayer;
    initialMetric?: string;
    initialKontraktor?: string;
    filters: any;
    initialData?: any;
    searchQuery?: string;
    availableKontraktors?: string[];
}

export function ContractorDrilldownModal({
    isOpen,
    onClose,
    initialLayer,
    initialMetric,
    initialKontraktor,
    filters,
    initialData,
    searchQuery,
    availableKontraktors
}: ContractorDrilldownModalProps) {
    const [layer, setLayer] = useState<DrilldownLayer>(initialLayer);
    const [history, setHistory] = useState<HistoryState[]>([]);

    // State Selections
    const [metric, setMetric] = useState(initialMetric);
    const [kontraktor, setKontraktor] = useState(initialKontraktor);
    const [idToko, setIdToko] = useState<string | null>(null);
    const [lingkup, setLingkup] = useState<string | null>(null);

    // Data States
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [localSearch, setLocalSearch] = useState("");

    // Reset search when layer changes
    useEffect(() => {
        setLocalSearch("");
    }, [layer]);

    useEffect(() => {
        if (isOpen) {
            setLayer(initialLayer);
            setMetric(initialMetric);
            setKontraktor(initialKontraktor);
            setIdToko(null);
            setLingkup(null);
            setHistory([]);
            if (initialLayer === 'SP_SINGLE' && initialData) {
                setData(initialData);
                setIsLoading(false);
            } else {
                fetchData(initialLayer, initialMetric, initialKontraktor, null, null);
            }
        }
    }, [isOpen, initialLayer, initialMetric, initialKontraktor, initialData]);

    const goForward = (nextLayer: DrilldownLayer, newParams: any = {}) => {
        setHistory(prev => [...prev, { layer, metric, kontraktor, idToko, lingkup, data }]);
        setLayer(nextLayer);

        let nextMetric = newParams.metric !== undefined ? newParams.metric : metric;
        let nextKontraktor = newParams.kontraktor !== undefined ? newParams.kontraktor : kontraktor;
        let nextIdToko = newParams.idToko !== undefined ? newParams.idToko : idToko;
        let nextLingkup = newParams.lingkup !== undefined ? newParams.lingkup : lingkup;

        if (nextLayer === 'ULOK_LIST' || nextLayer === 'SP_HISTORY') {
            nextIdToko = null;
            nextLingkup = null;
        } else if (nextLayer === 'RANKING') {
            nextKontraktor = undefined;
            nextIdToko = null;
            nextLingkup = null;
        }

        setMetric(nextMetric);
        setKontraktor(nextKontraktor);
        setIdToko(nextIdToko);
        setLingkup(nextLingkup);

        if (newParams._skipFetch) {
            setData(newParams._data);
        } else {
            fetchData(nextLayer, nextMetric, nextKontraktor, nextIdToko, nextLingkup);
        }
    };

    const goBack = () => {
        if (history.length === 0) {
            onClose();
            return;
        }
        const prevState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        setLayer(prevState.layer);
        setMetric(prevState.metric);
        setKontraktor(prevState.kontraktor);
        setIdToko(prevState.idToko);
        setLingkup(prevState.lingkup);
        setData(prevState.data);
    };


    const fetchData = async (
        currentLayer: DrilldownLayer,
        currentMetric: string | undefined,
        currentKontraktor: string | undefined,
        currentIdToko: string | null,
        currentLingkup: string | null
    ) => {
        if (currentLayer === 'SEARCH_RESULTS') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            let endpoint = '';
            const params = new URLSearchParams();

            // Append global filters to ALL drilldown requests
            if (filters.cabang) params.append('cabang', filters.cabang);
            if (filters.job_type) params.append('job_type', filters.job_type);
            if (filters.period) params.append('period', filters.period);
            if (filters.proyek) params.append('proyek', filters.proyek);
            if (filters.bangunan) params.append('bangunan', filters.bangunan);

            if (currentLayer === 'RANKING') {
                endpoint = '/api/dashboard/contractor/drilldown-ranking';
                params.append('metric', currentMetric || '');
            } else if (currentLayer === 'SP_HISTORY') {
                endpoint = '/api/dashboard/contractor/drilldown-sp-history';
                params.append('kontraktor', currentKontraktor || '');
            } else if (currentLayer === 'SP_ACTIVE_ALL') {
                endpoint = '/api/dashboard/contractor/drilldown-sp-active-all';
                if (currentKontraktor) params.append('kontraktor', currentKontraktor);
            } else if (currentLayer === 'ULOK_LIST') {
                endpoint = '/api/dashboard/contractor/drilldown-ulok';
                params.append('kontraktor', currentKontraktor || '');
                if (currentIdToko) params.append('id_toko', currentIdToko);
                if (currentMetric) params.append('metric', currentMetric);
            } else if (currentLayer === 'DETAIL') {
                endpoint = '/api/dashboard/contractor/drilldown-detail';
                params.append('id_toko', currentIdToko || '');
                params.append('lingkup', currentLingkup || '');
            } else if (currentLayer === 'SCOPE') {
                endpoint = '/api/dashboard/contractor/drilldown-ulok';
                params.append('kontraktor', currentKontraktor || '');
                if (currentIdToko) params.append('id_toko', currentIdToko);
            }

            const baseUrl = API_URL.replace(/\/$/, "");
            const res = await apiFetch(`${baseUrl}${endpoint}?${params.toString()}`);
            const result = await res.json();

            setDebugInfo({
                url: `${API_URL}${endpoint}?${params.toString()}`,
                status: res.status,
                result: result
            });

            if (res.ok) {
                if (currentLayer === 'SCOPE') {
                    setData(result.data?.[0] || null);
                } else {
                    setData(result.data);
                }
                setFetchError(null);
            } else {
                setFetchError(result.message || 'Gagal memuat data');
            }
        } catch (error: any) {
            console.error("Drilldown fetch error:", error);
            setFetchError(error.message || 'Terjadi kesalahan jaringan');
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeaderTitle = () => {
        switch (layer) {
            case 'RANKING': return `Ranking ${metric?.replace('_', ' ').toUpperCase()}`;
            case 'SP_HISTORY': return `Riwayat SP: ${kontraktor}`;
            case 'SP_ACTIVE_ALL': return `Semua Kontraktor SP Aktif`;
            case 'SP_SINGLE': return `Detail Surat Peringatan`;
            case 'ULOK_LIST': return `Daftar ULOK: ${kontraktor}`;
            case 'SCOPE': return `Pilih Lingkup Pekerjaan`;
            case 'DETAIL': return `Detail Evaluasi (Tamat)`;
            case 'SEARCH_RESULTS': return `Hasil Pencarian: ${searchQuery}`;
            default: return 'Drilldown';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-[900px] p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-3xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm flex flex-row items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        {history.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <DialogTitle className="text-[17px] font-bold tracking-tight text-slate-800">
                            {renderHeaderTitle()}
                        </DialogTitle>
                    </div>
                    {(layer === 'RANKING' || layer === 'ULOK_LIST') && (
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                placeholder={layer === 'RANKING' ? "Cari Kontraktor..." : "Cari Toko / ULOK..."} 
                                className="pl-9 pr-4 py-2 w-[220px] md:w-[280px] bg-slate-50/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full text-[13px] outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                    )}
                </DialogHeader>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat data drilldown...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <AlertCircle className="h-10 w-10 text-rose-500" />
                            <p className="text-sm font-medium text-slate-700">Error: {fetchError}</p>
                            <Button variant="outline" onClick={() => fetchData(layer, metric, kontraktor, idToko, lingkup)}>Coba Lagi</Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {layer === 'SEARCH_RESULTS' && <LayerSearchResults searchQuery={searchQuery} availableKontraktors={availableKontraktors} onSelect={(k) => goForward('ULOK_LIST', { kontraktor: k, metric: 'search_all' })} />}
                            {layer === 'RANKING' && <LayerRanking data={data} metric={metric} debugInfo={debugInfo} searchQuery={localSearch} onRowClick={(k) => goForward('ULOK_LIST', { kontraktor: k, metric })} />}
                            {layer === 'SP_HISTORY' && <LayerSpHistory data={data} onRowClick={(id) => goForward('ULOK_LIST', { idToko: id })} />}
                            {layer === 'SP_ACTIVE_ALL' && <LayerSpActiveAll data={data} onRowClick={(id) => goForward('ULOK_LIST', { idToko: id })} />}
                            {layer === 'SP_SINGLE' && <LayerSpActiveAll data={data ? [data] : []} onRowClick={() => { }} />}
                            {layer === 'ULOK_LIST' && <LayerUlokList data={data} metric={metric} searchQuery={localSearch} onRowClick={(item) => {
                                if (metric === 'avg_denda' || metric === 'total_denda') {
                                    goForward('DETAIL', { idToko: item.id_toko, lingkup: 'Sipil + ME' });
                                } else {
                                    goForward('SCOPE', { idToko: item.id_toko, _skipFetch: true, _data: item });
                                }
                            }} />}
                            {layer === 'SCOPE' && <LayerScope data={data} onScopeSelect={(lingkup, overrideIdToko) => goForward('DETAIL', { lingkup, idToko: overrideIdToko || idToko })} />}
                            {layer === 'DETAIL' && <LayerDetail data={data} metric={metric} />}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LayerRanking({ data, metric, onRowClick, debugInfo, searchQuery = "" }: { data: any[], metric?: string, onRowClick: (kontraktor: string) => void, debugInfo?: any, searchQuery?: string }) {
    if (!data?.length) return (
        <div className="flex flex-col gap-4">
            <EmptyState />
            <div className="p-4 bg-slate-100 rounded-lg text-xs font-mono overflow-auto max-h-64">
                <strong>DEBUG INFO:</strong>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
        </div>
    );

    const filteredData = data.filter(r => (r.nama_kontraktor || "").toLowerCase().includes(searchQuery.toLowerCase()));

    if (!filteredData.length) return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 font-medium">Tidak ada kontraktor yang cocok dengan pencarian.</p>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                    <tr className="border-b border-slate-200 bg-white">
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-center w-16">No</th>
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Nama Kontraktor</th>
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Toko Terkait</th>
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">Pencapaian</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.map((row, idx) => {
                        const isTop1 = idx === 0 && !searchQuery; // Only highlight rank 1-3 if not searching
                        const isTop2 = idx === 1 && !searchQuery;
                        const isTop3 = idx === 2 && !searchQuery;
                        return (
                            <tr 
                                key={idx} 
                                onClick={() => onRowClick(row.nama_kontraktor)} 
                                className="group hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <td className="py-4 px-5 text-center">
                                    <span className={cn(
                                        "font-bold text-[13px]", 
                                        isTop1 ? 'text-amber-500' : isTop2 ? 'text-slate-400' : isTop3 ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-600'
                                    )}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="py-4 px-5">
                                    <div className="font-bold text-slate-800 text-[13px] uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{row.nama_kontraktor}</div>
                                </td>
                                <td className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-bold text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {row.total_toko || 0} Toko
                                    </div>
                                </td>
                                <td className="py-4 px-5 text-right flex items-center justify-end gap-2">
                                    <div className={cn(
                                        "font-bold text-[13px]", 
                                        isTop1 ? 'text-amber-600' : 'text-slate-800 group-hover:text-emerald-600 transition-colors'
                                    )}>
                                        {metric === 'avg_denda' || metric === 'kerja_tambah' || metric === 'kerja_kurang' || metric === 'total_denda'
                                            ? formatRupiah(row.metric_value)
                                            : metric === 'avg_keterlambatan'
                                                ? `${Math.round(row.metric_value)} Hari`
                                                : metric === 'evaluasi_toko'
                                                    ? `${Number(row.metric_value).toFixed(1)}/100`
                                                    : `${row.metric_value} ${row.metric_label || ''}`}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

const getSpColorClasses = (level: string | number | undefined) => {
    const lvl = String(level);
    if (lvl === '1') return "border-l-[6px] border-l-amber-400";
    if (lvl === '2') return "border-l-[6px] border-l-orange-500";
    if (lvl === '3' || lvl === 'FINAL') return "border-l-[6px] border-l-rose-500";
    return "border-l-[6px] border-l-slate-300";
};

function LayerSpHistory({ data, onRowClick }: { data: any[], onRowClick: (idToko: string) => void }) {
    if (!data?.length) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 gap-4">
            {data.map((row, idx) => (
                <div
                    key={idx}
                    onClick={() => onRowClick(row.id_toko)}
                    className={cn(
                        "flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group",
                        getSpColorClasses(row.sp_level)
                    )}
                >
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-bold tracking-widest uppercase">
                            {row.action_type === 'SP' && row.sp_level ? `SP ${row.sp_level}` : row.action_type}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-400">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{row.alasan_sp}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <MapPin className="h-4 w-4" />
                                {row.nama_toko}
                            </div>
                        </div>
                        {(row.link_pdf || row.lampiran_1_url) && (
                            <a
                                href={row.link_pdf || row.lampiran_1_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 font-semibold rounded-lg transition-colors border border-slate-200 text-xs shrink-0 self-start md:self-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Lihat Dokumen</span>
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LayerSpActiveAll({ data, onRowClick }: { data: any[], onRowClick: (idToko: string) => void }) {
    if (!data?.length) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 gap-4">
            {data.map((row, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
                        getSpColorClasses(row.sp_level)
                    )}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent opacity-50 rounded-full -mr-10 -mt-10 pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-black tracking-widest uppercase shadow-sm">
                                {row.action_type === 'SP' && row.sp_level ? `SP ${row.sp_level}` : row.action_type}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold border-none">
                                {row.cabang}
                            </Badge>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masa Berlaku</span>
                            <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {row.expires_at ? new Date(row.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum Berakhir'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Building2 className="h-4 w-4 text-emerald-500" />
                                <h4 className="font-bold text-slate-900 text-lg line-clamp-1">{row.nama_kontraktor}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-3">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="line-clamp-1">{row.nama_toko}</span>
                            </div>
                            <div className="text-sm font-medium text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                <span className="text-slate-400 font-semibold block mb-1 text-xs">Alasan SP:</span>
                                {row.alasan_sp || 'Tidak ada alasan.'}
                            </div>
                        </div>

                        {(row.link_pdf || row.lampiran_1_url) && (
                            <div className="shrink-0 flex items-center justify-end">
                                <a
                                    href={row.link_pdf || row.lampiran_1_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold rounded-xl transition-colors shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Lihat Dokumen</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LayerUlokList({ data, onRowClick, metric, searchQuery = "" }: { data: any[], onRowClick: (item: any) => void, metric?: string, searchQuery?: string }) {
    if (!data?.length) return <EmptyState />;

    const rawFiltered = data.filter(r => 
        (r.nomor_ulok || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.nama_toko || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    let displayData = rawFiltered;
    if (metric === 'avg_denda' || metric === 'total_denda' || metric === 'avg_keterlambatan' || metric === 'kerja_tambah' || metric === 'kerja_kurang') {
        const aggregated = new Map();
        rawFiltered.forEach(item => {
            if (!aggregated.has(item.nomor_ulok)) {
                aggregated.set(item.nomor_ulok, { ...item, _count: 1 });
            } else {
                const existing = aggregated.get(item.nomor_ulok);
                existing.kerja_tambah = Number(existing.kerja_tambah || 0) + Number(item.kerja_tambah || 0);
                existing.kerja_kurang = Number(existing.kerja_kurang || 0) + Number(item.kerja_kurang || 0);
                existing.hari_denda = Math.max(Number(existing.hari_denda || 0), Number(item.hari_denda || 0));
                existing.nilai_denda = Number(existing.nilai_denda || 0) + Number(item.nilai_denda || 0);
                existing._count += 1;
            }
        });
        displayData = Array.from(aggregated.values()).map((item: any) => {
            if (metric === 'kerja_tambah' || metric === 'kerja_kurang') {
                item.kerja_tambah = item.kerja_tambah / item._count;
                item.kerja_kurang = item.kerja_kurang / item._count;
            }
            return item;
        });
    }

    const isDenda = metric === 'avg_denda' || metric === 'total_denda';
    const isKerjaTambahKurang = metric === 'kerja_tambah' || metric === 'kerja_kurang';
    const isEvaluasiOrKeterlambatan = !isDenda && !isKerjaTambahKurang;

    if (!displayData.length) return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 font-medium">Tidak ada toko/ULOK yang cocok dengan pencarian.</p>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-slate-200 bg-white">
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase w-[35%]">ULOK</th>
                        <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Cabang</th>
                        {isDenda && (
                            <>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-center">Akhir SPK</th>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-center">Serah Terima</th>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">Nilai Denda</th>
                            </>
                        )}
                        {isKerjaTambahKurang && (
                            <>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">Kerja Tambah</th>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">Kerja Kurang</th>
                            </>
                        )}
                        {isEvaluasiOrKeterlambatan && (
                            <>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-center">Nilai Toko</th>
                                <th className="py-4 px-5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">Keterlambatan</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {displayData.map((row, idx) => (
                        <tr
                            key={idx}
                            onClick={() => onRowClick(row)}
                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <td className="py-4 px-5">
                                <div className="font-bold text-slate-800 text-[13px] group-hover:text-emerald-600 transition-colors tracking-tight">
                                    {row.nomor_ulok}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 uppercase mt-0.5 tracking-wider">
                                    {row.nama_toko}
                                </div>
                                {row.lingkup_pekerjaan && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        {row.lingkup_pekerjaan.split('+').map((l: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-600">
                                                {l.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td className="py-4 px-5">
                                <span className="text-[12px] font-bold text-slate-700 uppercase">
                                    {row.cabang}
                                </span>
                            </td>
                            
                            {isDenda && (
                                <>
                                    <td className="py-4 px-5 text-center font-bold text-[12px] text-slate-600">
                                        {row.akhir_spk ? new Date(row.akhir_spk).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="py-4 px-5 text-center font-bold text-[12px] text-slate-600">
                                        {row.serah_terima_date ? new Date(row.serah_terima_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="py-4 px-5 text-right font-bold text-[13px] text-rose-600">
                                        {formatRupiah(row.nilai_denda)}
                                    </td>
                                </>
                            )}

                            {isKerjaTambahKurang && (
                                <>
                                    <td className="py-4 px-5 text-right font-bold text-[13px] text-emerald-600">
                                        {Number(row.kerja_tambah) > 0 ? `+${formatRupiah(row.kerja_tambah)}` : '-'}
                                    </td>
                                    <td className="py-4 px-5 text-right font-bold text-[13px] text-rose-600">
                                        {Number(row.kerja_kurang) > 0 ? `-${formatRupiah(row.kerja_kurang)}` : '-'}
                                    </td>
                                </>
                            )}

                            {isEvaluasiOrKeterlambatan && (
                                <>
                                    <td className="py-4 px-5 text-center">
                                        {row.nilai_toko > 0 ? (
                                            <span className={cn(
                                                "font-bold text-[13px]", 
                                                row.nilai_toko >= 80 ? "text-emerald-600" : row.nilai_toko >= 60 ? "text-amber-500" : "text-rose-500"
                                            )}>
                                                {row.nilai_toko}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-bold">-</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-5 text-right flex justify-end items-center gap-2">
                                        {Number(row.hari_denda) > 0 ? (
                                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md font-bold text-[12px]">
                                                {row.hari_denda} Hari
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-bold">-</span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0 ml-1" />
                                    </td>
                                </>
                            )}
                            
                            {(isDenda || isKerjaTambahKurang) && (
                                <td className="py-4 pl-0 pr-5 w-8">
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function LayerSearchResults({ searchQuery, availableKontraktors, onSelect }: { searchQuery?: string, availableKontraktors?: string[], onSelect: (kontraktor: string) => void }) {
    console.log("LayerSearchResults Rendered! Query:", searchQuery, "Available Kontraktors:", availableKontraktors?.length);
    const query = (searchQuery || '').toLowerCase();

    // Perform case-insensitive filter
    const filteredKontraktors = (availableKontraktors || []).filter(k =>
        k.toLowerCase().includes(query)
    );

    if (filteredKontraktors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-3xl">
                <Search className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Kontraktor Tidak Ditemukan</h3>
                <p className="text-slate-500">Tidak ada kontraktor yang cocok dengan kata kunci "{searchQuery}". Coba kata kunci lain.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredKontraktors.map((kontraktor, idx) => (
                <div
                    key={idx}
                    onClick={() => onSelect(kontraktor)}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-[0_8px_30px_rgb(52,211,153,0.15)] cursor-pointer transition-all group"
                >
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center mb-4 transition-colors">
                        <Building2 className="h-7 w-7 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-sm text-center text-slate-800 group-hover:text-emerald-600 transition-colors uppercase line-clamp-2">{kontraktor}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Lihat Proyek</p>
                </div>
            ))}
        </div>
    );
}

function LayerScope({ data, onScopeSelect }: { data: any, onScopeSelect: (lingkup: string, idToko?: string) => void }) {
    if (!data?.scopes?.length) return <EmptyState />;

    // Deduplicate scopes
    const uniqueScopesMap = new Map();
    data.scopes.forEach((s: any) => {
        if (!uniqueScopesMap.has(s.lingkup_pekerjaan)) {
            uniqueScopesMap.set(s.lingkup_pekerjaan, s);
        }
    });

    return (
        <div className="flex flex-col gap-6 p-2">
            <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-800">Pilih Lingkup Pekerjaan</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">{data?.scopes[0]?.nomor_ulok || data?.scopes[0]?.id_toko || 'Toko'} - {data?.scopes[0]?.nama_toko || 'Data Toko'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from(uniqueScopesMap.entries()).sort((a, b) => {
                    const scopeA = a[0].toUpperCase();
                    const scopeB = b[0].toUpperCase();
                    if (scopeA.includes('SIPIL') && !scopeB.includes('SIPIL')) return -1;
                    if (!scopeA.includes('SIPIL') && scopeB.includes('SIPIL')) return 1;
                    return scopeA.localeCompare(scopeB);
                }).map(([scope, scopeData], idx) => {
                    const isME = scope.toUpperCase().includes('ME') || scope.toUpperCase().includes('M.E');
                    
                    const cardTheme = isME 
                        ? {
                            borderAccent: "border-l-amber-500",
                            iconBg: "bg-amber-50",
                            iconColor: "text-amber-500",
                            hoverBorder: "hover:border-amber-200",
                            hoverShadow: "hover:shadow-[0_8px_30px_rgb(245,158,11,0.12)]",
                            icon: Zap,
                            checkColor: "text-amber-500",
                            lineColor: "bg-amber-200"
                        }
                        : {
                            borderAccent: "border-l-blue-500",
                            iconBg: "bg-blue-50",
                            iconColor: "text-blue-500",
                            hoverBorder: "hover:border-blue-200",
                            hoverShadow: "hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)]",
                            icon: Building2,
                            checkColor: "text-blue-500",
                            lineColor: "bg-blue-200"
                        };
                        
                    const Icon = cardTheme.icon;

                    return (
                        <div
                            key={idx}
                            onClick={() => onScopeSelect(scope, scopeData.id_toko)}
                            className={cn(
                                "relative flex flex-col p-6 rounded-2xl bg-white border border-slate-200 border-l-[6px] cursor-pointer transition-all duration-300 group",
                                cardTheme.borderAccent,
                                cardTheme.hoverBorder,
                                cardTheme.hoverShadow
                            )}
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cardTheme.iconBg)}>
                                        <Icon className={cn("w-6 h-6", cardTheme.iconColor)} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">{scope}</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">REGULER</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors mt-2" />
                            </div>

                            {/* Progress Tracker (Decorative) */}
                            <div className="flex items-center justify-between w-full px-1">
                                {['RAB', 'SPK', 'ST', 'KTK'].map((step, stepIdx) => (
                                    <React.Fragment key={step}>
                                        <div className="flex items-center gap-1.5 z-10 bg-white">
                                            <CheckCircle2 className={cn("w-4 h-4", cardTheme.checkColor)} />
                                            <span className="text-xs font-bold text-slate-800">{step}</span>
                                        </div>
                                        {stepIdx < 3 && (
                                            <div className={cn("flex-1 h-[2px] mx-2", cardTheme.lineColor)} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LayerDetail({ data, metric }: { data: any, metric?: string }) {
    if (!data) return <EmptyState />;

    const showEvaluasi = metric === 'evaluasi_toko' || metric === 'search_all';
    const showKeuangan = metric !== 'evaluasi_toko' || metric === 'search_all';

    // Evaluasi Calcs
    let nilaiAkhir = '0', desain = '0%', kualitas = '0%', spek = '0%';
    if (data.item_stats && data.item_stats.length > 0) {
        let k = 0, d = 0, s = 0, t = data.item_stats.length;
        data.item_stats.forEach((i: any) => { if (i.kualitas === 'Baik') k++; if (i.desain === 'Sesuai') d++; if (i.spesifikasi === 'Sesuai') s++; });
        nilaiAkhir = ((k / t * 35) + (d / t * 35) + (s / t * 30)).toFixed(1);
        desain = (d / t * 100).toFixed(0) + '%';
        kualitas = (k / t * 100).toFixed(0) + '%';
        spek = (s / t * 100).toFixed(0) + '%';
    }

    return (
        <div className="flex flex-col gap-6 pt-2">
            
            {/* 1. Header Profil */}
            <div className={cn(
                "bg-white rounded-3xl p-6 md:p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-200 border-l-[8px] relative overflow-hidden flex flex-col justify-center",
                (data.lingkup_pekerjaan?.toUpperCase().includes('ME') || data.lingkup_pekerjaan?.toUpperCase().includes('M.E')) && metric !== 'avg_denda' && metric !== 'total_denda' 
                    ? "border-l-amber-500" 
                    : "border-l-blue-500"
            )}>
                {/* Colorful blurs in header to make it pop */}
                <div className="absolute right-0 top-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
                <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/4" />
                
                {/* Background Store Icon watermark */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                    <Store className="w-48 h-48" />
                </div>

                <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider rounded-lg border border-slate-200/60">
                            {data.cabang}
                        </span>
                        <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                            {(metric === 'avg_denda' || metric === 'total_denda') && metric !== 'search_all' ? 'SIPIL + ME' : data.lingkup_pekerjaan}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-tight">
                        {data.nama_toko}
                    </h2>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mt-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>ULOK {data.nomor_ulok}</span>
                    </div>
                </div>
            </div>

            {/* 2. Evaluasi Toko Bento */}
            {showEvaluasi && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <BentoTile 
                        variant="primary" 
                        title="Nilai Toko" 
                        value={nilaiAkhir} 
                        icon={CheckCircle2} 
                        className={showKeuangan ? "" : "md:col-span-1"}
                    />
                    <BentoTile variant="blue" title="Desain" value={desain} icon={Layout} />
                    <BentoTile variant="indigo" title="Kualitas" value={kualitas} icon={Award} />
                    <BentoTile variant="cyan" title="Spesifikasi" value={spek} icon={FileCheck2} />
                </div>
            )}

            {/* 3. Keuangan Bento */}
            {showKeuangan && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {!['avg_keterlambatan', 'total_keterlambatan', 'kerja_tambah', 'kerja_kurang'].includes(metric || '') && (
                        <BentoTile variant={Number(data.nilai_denda) > 0 ? "danger" : "default"} title="Nilai Denda" value={formatRupiah(data.nilai_denda || 0)} icon={AlertTriangle} />
                    )}
                    {!['avg_denda', 'total_denda', 'kerja_tambah', 'kerja_kurang'].includes(metric || '') && (
                        <BentoTile variant={Number(data.true_late_days) > 0 ? "warning" : "default"} title="Keterlambatan" value={`${data.true_late_days || 0} Hari`} icon={Clock} />
                    )}
                    {(!metric || metric === 'kerja_tambah' || metric === 'kerja_kurang' || metric === 'sp_aktif') && (
                        <BentoTile variant="purple" title={Number(data.selisih_kerja) >= 0 ? "Kerja Tambah" : "Kerja Kurang"} value={formatRupiah(Math.abs(Number(data.selisih_kerja || 0)))} icon={Activity} />
                    )}
                </div>
            )}

            {/* 4. Timeline */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] border border-slate-100 mt-2">
                <h4 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider mb-8 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Timeline Proyek
                </h4>
                
                <div className="relative">
                    {(metric === 'avg_denda' || metric === 'total_denda') && (!data.available_scopes || data.available_scopes.length > 1) ? (
                        <div className="flex flex-col gap-10">
                            <div>
                                <h5 className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-6 text-center">Timeline Sipil</h5>
                                <KpiTimeline nomor_ulok={data.nomor_ulok} lingkup_pekerjaan="SIPIL" hideHeader />
                            </div>
                            <div className="border-t border-dashed border-slate-100" />
                            <div>
                                <h5 className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-6 text-center">Timeline Mekanikal Elektrikal</h5>
                                <KpiTimeline nomor_ulok={data.nomor_ulok} lingkup_pekerjaan="ME" hideHeader />
                            </div>
                        </div>
                    ) : (
                        <KpiTimeline
                            nomor_ulok={data.nomor_ulok}
                            lingkup_pekerjaan={
                                data.available_scopes?.length === 1
                                    ? data.available_scopes[0]
                                    : (data.lingkup_pekerjaan || data.jenis_pekerjaan)
                            }
                            hideHeader
                        />
                    )}
                </div>
            </div>

        </div>
    );
}

const BentoTile = ({ title, value, variant = "default", icon: Icon, className }: any) => {
    const themes: Record<string, any> = {
        primary: { border: "border-emerald-200/60 border-l-[6px] border-l-emerald-500", shadow: "shadow-[0_12px_40px_-12px_rgba(16,185,129,0.35)]", iconColor: "text-emerald-500", glow: "bg-emerald-400/20" },
        danger: { border: "border-rose-200/60 border-l-[6px] border-l-rose-500", shadow: "shadow-[0_12px_40px_-12px_rgba(244,63,94,0.35)]", iconColor: "text-rose-500", glow: "bg-rose-400/20" },
        warning: { border: "border-amber-200/60 border-l-[6px] border-l-amber-500", shadow: "shadow-[0_12px_40px_-12px_rgba(245,158,11,0.35)]", iconColor: "text-amber-500", glow: "bg-amber-400/20" },
        blue: { border: "border-blue-200/60 border-l-[6px] border-l-blue-500", shadow: "shadow-[0_12px_40px_-12px_rgba(59,130,246,0.35)]", iconColor: "text-blue-500", glow: "bg-blue-400/20" },
        indigo: { border: "border-indigo-200/60 border-l-[6px] border-l-indigo-500", shadow: "shadow-[0_12px_40px_-12px_rgba(99,102,241,0.35)]", iconColor: "text-indigo-500", glow: "bg-indigo-400/20" },
        cyan: { border: "border-cyan-200/60 border-l-[6px] border-l-cyan-500", shadow: "shadow-[0_12px_40px_-12px_rgba(6,182,212,0.35)]", iconColor: "text-cyan-500", glow: "bg-cyan-400/20" },
        purple: { border: "border-purple-200/60 border-l-[6px] border-l-purple-500", shadow: "shadow-[0_12px_40px_-12px_rgba(168,85,247,0.35)]", iconColor: "text-purple-500", glow: "bg-purple-400/20" },
        default: { border: "border-slate-200/80 border-l-[6px] border-l-slate-400", shadow: "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]", iconColor: "text-slate-400", glow: "bg-slate-300/20" },
    };

    const theme = themes[variant] || themes.default;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-[20px] p-5 bg-white border flex flex-col justify-center min-h-[96px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
            theme.border, theme.shadow,
            className
        )}>
            {/* Pronounced inner glow effect for color touch */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[32px] rounded-full mix-blend-multiply pointer-events-none -mr-8 -mt-8", theme.glow)} />
            {/* Secondary glow at bottom left for more color distribution */}
            <div className={cn("absolute bottom-0 left-0 w-24 h-24 blur-[32px] rounded-full mix-blend-multiply pointer-events-none -ml-8 -mb-8 opacity-50", theme.glow)} />

            {/* Icon Watermark */}
            {Icon && (
                <Icon className={cn("absolute right-0 bottom-0 w-20 h-20 -mr-4 -mb-4 opacity-[0.08] pointer-events-none", theme.iconColor)} />
            )}
            
            <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 relative z-10">
                {title}
            </h4>
            
            <p className={cn(
                "font-bold text-slate-900 tracking-tight relative z-10",
                variant === 'primary' ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
            )}>{value}</p>
        </div>
    );
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-slate-300" />
        </div>
        <h4 className="text-lg font-bold text-slate-800">Tidak ada data</h4>
        <p className="text-sm font-medium text-slate-500 mt-1">Data tidak ditemukan untuk pilihan ini.</p>
    </div>
);
