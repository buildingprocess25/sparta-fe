import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronRight, ExternalLink, FileText, Loader2, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    fetchDashboardV2CardRows,
    fetchDashboardV2Detail,
    fetchDashboardV2Timeline,
    type DashboardV2CardType,
    type DashboardV2Detail,
    type DashboardV2DocumentType,
    type DashboardV2Pagination,
    type DashboardV2Row,
    type DashboardV2ScopeParams,
    type DashboardV2Timeline,
    type DashboardV2TimelineNode,
} from '@/lib/dashboard-v2-api';

type ModalView = 'stage' | 'list' | 'timeline' | 'detail';

interface DashboardDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCardType: DashboardV2CardType;
    scopeParams: DashboardV2ScopeParams;
}

const cardTitles: Record<DashboardV2CardType, string> = {
    TOTAL_TOKO: 'Daftar Proyek',
    SLA: 'SLA Perhatian',
    SPK_AKTIF: 'Daftar SPK Aktif',
    TOTAL_DENDA: 'Daftar Total Denda',
    NILAI_PENAWARAN: 'Daftar Nilai Penawaran',
    TAMBAH_HARI_SPK: 'Daftar Tambah Hari SPK',
    ITEM_PENGAWASAN: 'Daftar Item Pengawasan',
    INSTRUKSI_LAPANGAN: 'Daftar Instruksi Lapangan',
    KERJA_TAMBAH_KURANG: 'Daftar Kerja Tambah Kurang',
    SERAH_TERIMA: 'Daftar Serah Terima',
    COST_M2_BANGUNAN: 'Cost/m2 Bangunan',
    COST_M2_TERBUKA: 'Cost/m2 Area Terbuka',
};

const documentFilters: Partial<Record<DashboardV2CardType, DashboardV2DocumentType[]>> = {
    SPK_AKTIF: ['SPK'],
    NILAI_PENAWARAN: ['RAB'],
    TAMBAH_HARI_SPK: ['TAMBAH_HARI_SPK'],
    ITEM_PENGAWASAN: ['PENGAWASAN'],
    INSTRUKSI_LAPANGAN: ['INSTRUKSI_LAPANGAN'],
    KERJA_TAMBAH_KURANG: ['OPNAME_FINAL'],
    SERAH_TERIMA: ['SERAH_TERIMA'],
    COST_M2_BANGUNAN: ['RAB'],
    COST_M2_TERBUKA: ['RAB'],
};

const stageOrder = ['Approval RAB', 'Proses PJU', 'Approval SPK', 'Ongoing', 'Opname Parsial', 'Kerja Tambah Kurang', 'Serah Terima', 'Done'];

const shouldShowStage = (cardType: DashboardV2CardType) => cardType === 'TOTAL_TOKO' || cardType === 'SLA';

const getToneClass = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized.includes('TERLAMBAT') || normalized.includes('DENDA')) return 'border-red-200 bg-red-50 text-red-700';
    if (normalized.includes('SELESAI') || normalized.includes('APPROV') || normalized.includes('DISETUJUI')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (normalized.includes('PROGRESS') || normalized.includes('ONGOING')) return 'border-blue-200 bg-blue-50 text-blue-700';
    return 'border-slate-200 bg-slate-100 text-slate-700';
};

export const DashboardDrilldownModal: React.FC<DashboardDrilldownModalProps> = ({
    isOpen,
    onClose,
    initialCardType,
    scopeParams,
}) => {
    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<ModalView>('list');
    const [rows, setRows] = useState<DashboardV2Row[]>([]);
    const [pagination, setPagination] = useState<DashboardV2Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [modalSearch, setModalSearch] = useState('');
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<DashboardV2Timeline | null>(null);
    const [detail, setDetail] = useState<DashboardV2Detail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setPage(1);
        setRows([]);
        setTimeline(null);
        setDetail(null);
        setModalSearch('');
        setSelectedStage(null);
        setView(shouldShowStage(initialCardType) ? 'stage' : 'list');
    }, [initialCardType, isOpen]);

    useEffect(() => {
        if (!isOpen || view === 'timeline' || view === 'detail') return;
        let cancelled = false;
        const loadRows = async () => {
            setLoading(true);
            try {
                const response = await fetchDashboardV2CardRows(initialCardType, {
                    ...scopeParams,
                    search: modalSearch || scopeParams.search,
                    page,
                    limit: shouldShowStage(initialCardType) ? 500 : 8,
                });
                if (cancelled) return;
                setRows(response.data);
                setPagination(response.pagination);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadRows();
        return () => {
            cancelled = true;
        };
    }, [initialCardType, isOpen, modalSearch, page, scopeParams, view]);

    const stageCounts = useMemo(() => {
        const counts = new Map<string, number>();
        rows.forEach((row) => counts.set(row.stage, (counts.get(row.stage) ?? 0) + 1));
        return stageOrder
            .filter((stage) => counts.has(stage))
            .map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
    }, [rows]);

    const visibleRows = selectedStage ? rows.filter((row) => row.stage === selectedStage) : rows;
    const filteredTimelineNodes = useMemo(() => {
        if (!timeline) return [];
        const allowedTypes = documentFilters[initialCardType];
        if (!allowedTypes) return timeline.nodes;
        return timeline.nodes.filter((node) => allowedTypes.includes(node.type));
    }, [initialCardType, timeline]);

    const openRow = async (row: DashboardV2Row) => {
        setLoading(true);
        try {
            const nextTimeline = await fetchDashboardV2Timeline(row.toko_id);
            setTimeline(nextTimeline);
            setDetail(null);
            const allowedTypes = documentFilters[initialCardType];
            const relevantNodes = allowedTypes ? nextTimeline.nodes.filter((node) => allowedTypes.includes(node.type)) : nextTimeline.nodes;
            if (relevantNodes.length === 1 && relevantNodes[0].raw_id) {
                const nextDetail = await fetchDashboardV2Detail(row.toko_id, relevantNodes[0].type, relevantNodes[0].raw_id);
                setDetail(nextDetail);
                setView('detail');
            } else {
                setView('timeline');
            }
        } finally {
            setLoading(false);
        }
    };

    const openNode = async (node: DashboardV2TimelineNode) => {
        if (!timeline || !node.raw_id) return;
        setLoading(true);
        try {
            const nextDetail = await fetchDashboardV2Detail(timeline.toko_id, node.type, node.raw_id);
            setDetail(nextDetail);
            setView('detail');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (view === 'detail') {
            setView('timeline');
            setDetail(null);
            return;
        }
        if (view === 'timeline') {
            setView(shouldShowStage(initialCardType) ? 'stage' : 'list');
            setTimeline(null);
            return;
        }
        if (view === 'list' && shouldShowStage(initialCardType)) {
            setView('stage');
            setSelectedStage(null);
            return;
        }
        onClose();
    };

    if (!isOpen || !mounted) return null;

    const title = view === 'timeline'
        ? `Timeline Proyek: ${timeline?.nomor_ulok ?? '-'}`
        : view === 'detail'
            ? detail?.title ?? 'Detail Dokumen'
            : selectedStage
                ? `Daftar ULOK: ${selectedStage}`
                : cardTitles[initialCardType];

    const subtitle = view === 'timeline'
        ? `${timeline?.nama_toko ?? '-'} - ${timeline?.cabang ?? '-'}`
        : view === 'detail'
            ? detail?.subtitle ?? ''
            : 'Pilih proyek untuk melihat detail';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
            <div className="relative flex h-[90vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-8">
                    <div className="flex min-w-0 items-center gap-4 md:gap-5">
                        <button type="button" onClick={handleBack} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 border-l-[7px] border-red-600 pl-3">
                            <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">{title}</h2>
                            <p className="mt-1 truncate text-sm font-bold text-slate-500">{subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {(view === 'list' || view === 'stage') && (
                            <div className="relative hidden w-72 md:block">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={modalSearch}
                                    onChange={(event) => {
                                        setModalSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none shadow-sm transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
                                    placeholder="Cari Nama Toko / ULOK..."
                                />
                            </div>
                        )}
                        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="relative flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    )}

                    {view === 'stage' && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {stageCounts.map(({ stage, count }) => (
                                <button
                                    key={stage}
                                    type="button"
                                    className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl"
                                    onClick={() => {
                                        setSelectedStage(stage);
                                        setView('list');
                                    }}
                                >
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Tahapan</p>
                                    <p className="mt-2 text-lg font-black text-slate-900">{stage}</p>
                                    <p className="mt-4 text-3xl font-black text-red-600">{count}</p>
                                    <p className="text-xs font-bold text-slate-500">ULOK</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {visibleRows.length === 0 && !loading ? (
                                <div className="p-8 text-center text-sm font-bold text-slate-400">Tidak ada data pada filter ini.</div>
                            ) : visibleRows.map((row) => (
                                <button
                                    key={row.key}
                                    type="button"
                                    className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-5 text-left transition last:border-b-0 hover:bg-slate-50"
                                    onClick={() => openRow(row)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-black text-slate-900">{row.nama_toko}</p>
                                            <Badge className="bg-slate-100 font-mono text-slate-600 hover:bg-slate-100">{row.nomor_ulok}</Badge>
                                            <Badge className={getToneClass(row.status_label)}>{row.status_label}</Badge>
                                        </div>
                                        <p className="mt-2 text-xs font-black uppercase text-slate-400">{row.cabang} - {row.proyek} - {row.lingkup_pekerjaan}</p>
                                    </div>
                                    <div className="hidden min-w-[220px] grid-cols-3 gap-2 md:grid">
                                        {row.metrics.slice(0, 3).map((metric) => (
                                            <div key={`${row.key}-${metric.label}`} className="min-w-0">
                                                <p className="truncate text-[10px] font-black uppercase text-slate-400">{metric.label}</p>
                                                <p className="truncate text-sm font-black text-slate-800">{metric.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="min-w-[150px] text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Nilai</p>
                                        <p className="text-base font-black text-slate-900">{row.value_label}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'timeline' && (
                        <div className="space-y-4">
                            {filteredTimelineNodes.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">Dokumen belum tersedia.</div>
                            ) : filteredTimelineNodes.map((node) => (
                                <button
                                    key={node.id}
                                    type="button"
                                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200 hover:shadow-md"
                                    onClick={() => openNode(node)}
                                >
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                        <FileText className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-black text-slate-900">{node.title}</p>
                                            <Badge className={getToneClass(node.status_label)}>{node.status_label}</Badge>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-slate-500">{node.subtitle}</p>
                                    </div>
                                    <div className="hidden text-right md:block">
                                        <p className="text-xs font-black text-slate-500">{node.date_label}</p>
                                        <p className="text-sm font-black text-slate-900">{node.value_label}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'detail' && detail && (
                        <div className="space-y-4">
                            {detail.pdf_url && (
                                <div className="flex justify-end">
                                    <Button type="button" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => window.open(detail.pdf_url || '', '_blank', 'noopener,noreferrer')}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Buka Dokumen
                                    </Button>
                                </div>
                            )}
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                {detail.fields.map((field) => (
                                    <div key={field.label} className="grid grid-cols-1 border-b border-slate-100 px-6 py-5 last:border-b-0 md:grid-cols-[280px_1fr]">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                                        <p className="font-bold text-slate-900">{field.value}</p>
                                    </div>
                                ))}
                            </div>
                            {detail.items.length > 0 && (
                                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-100 px-6 py-4 text-sm font-black text-slate-900">Item Detail</div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-left text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                                                <tr>
                                                    {Object.keys(detail.items[0]).map((key) => (
                                                        <th key={key} className="px-5 py-4 font-black">{key.replace(/_/g, ' ')}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.items.map((item, index) => (
                                                    <tr key={index} className="border-t border-slate-100">
                                                        {Object.keys(detail.items[0]).map((key) => (
                                                            <td key={`${index}-${key}`} className="px-5 py-4 font-semibold text-slate-700">{String(item[key] ?? '-')}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {view === 'list' && pagination && !shouldShowStage(initialCardType) && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                        <p className="text-xs font-bold text-slate-500">Halaman {pagination.page} dari {pagination.total_pages || 1}</p>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</Button>
                            <Button type="button" variant="outline" size="sm" disabled={page >= (pagination.total_pages || 1)} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
