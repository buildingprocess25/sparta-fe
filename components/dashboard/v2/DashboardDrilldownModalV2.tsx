import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Download, FileText, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/constants';
import { fetchDashboardV2CardRows, fetchDashboardV2Timeline, fetchDashboardV2Detail } from '@/lib/api';
import { DashboardV2UiTable } from './DashboardV2UiTable';
import { DashboardV2Row, DashboardV2Timeline, DashboardV2Detail, DashboardV2TimelineNode } from 'sparta-be/src/modules/dashboard/dashboard-v2.types';
import { Badge } from '@/components/ui/badge';

type DrilldownView = 'list' | 'timeline' | 'detail';

interface DashboardDrilldownModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    initialCardType: string | null;
    searchQuery?: string;
    selectedBranch?: string;
    jobType?: string;
}

export const DashboardDrilldownModalV2: React.FC<DashboardDrilldownModalV2Props> = ({
    isOpen,
    onClose,
    initialCardType,
    searchQuery,
    selectedBranch,
    jobType
}) => {
    const [view, setView] = useState<DrilldownView>('list');
    const [rows, setRows] = useState<DashboardV2Row[]>([]);
    const [isLoadingRows, setIsLoadingRows] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    // Timeline state
    const [timelineData, setTimelineData] = useState<DashboardV2Timeline | null>(null);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
    
    // Detail state
    const [detailData, setDetailData] = useState<DashboardV2Detail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [selectedNode, setSelectedNode] = useState<DashboardV2TimelineNode | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setView('list');
        setCurrentPage(1);
        if (initialCardType) {
            loadRows(initialCardType);
        }
    }, [isOpen, initialCardType, searchQuery, selectedBranch, jobType]);

    const loadRows = async (cardType: string) => {
        setIsLoadingRows(true);
        try {
            const res = await fetchDashboardV2CardRows(cardType, {
                branch: selectedBranch !== 'ALL' ? selectedBranch : undefined,
                job_type: jobType !== 'ALL' ? jobType : undefined,
                search: searchQuery || undefined
            });
            if (res?.data?.rows) {
                setRows(res.data.rows);
            }
        } catch (err) {
            console.error("Failed to load v2 rows", err);
        } finally {
            setIsLoadingRows(false);
        }
    };

    const handleRowClick = async (row: DashboardV2Row) => {
        setView('timeline');
        setIsLoadingTimeline(true);
        setTimelineData(null);
        try {
            const res = await fetchDashboardV2Timeline(row.toko_id);
            if (res?.data) {
                setTimelineData(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch timeline v2", err);
        } finally {
            setIsLoadingTimeline(false);
        }
    };

    const handleNodeClick = async (node: DashboardV2TimelineNode) => {
        if (!timelineData) return;
        setSelectedNode(node);
        setView('detail');
        setIsLoadingDetail(true);
        setDetailData(null);
        try {
            const res = await fetchDashboardV2Detail(timelineData.toko_id, node.type, String(node.raw_id));
            if (res?.data) {
                setDetailData(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch detail v2", err);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const totalPages = Math.ceil(rows.length / itemsPerPage);
    const paginatedRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (!isOpen) return null;

    const renderHeader = () => (
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-white shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                {view !== 'list' && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                            if (view === 'detail') setView('timeline');
                            else setView('list');
                        }}
                        className="rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                )}
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Layers className="w-6 h-6 text-indigo-500" />
                        {view === 'list' ? 'Drilldown Data' : view === 'timeline' ? 'Timeline Proyek' : 'Detail Dokumen'}
                    </h2>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                <X className="w-6 h-6" />
            </Button>
        </div>
    );

    const renderTimelineView = () => {
        if (isLoadingTimeline) return <div className="p-8 text-center animate-pulse">Loading timeline...</div>;
        if (!timelineData) return null;

        return (
            <div className="p-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">{timelineData.nama_toko}</h3>
                        <p className="text-sm font-bold text-slate-500">{timelineData.nomor_ulok} • {timelineData.cabang}</p>
                    </div>
                    <Badge>{timelineData.lingkup_pekerjaan}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {timelineData.nodes.map((node, i) => (
                        <div key={i} onClick={() => handleNodeClick(node)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="outline">{node.type}</Badge>
                                <span className="text-xs font-bold text-slate-400">{node.date_label}</span>
                            </div>
                            <h4 className="font-black text-slate-800 mb-1">{node.title}</h4>
                            <p className="text-sm font-bold text-slate-500 truncate mb-4">{node.subtitle}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{node.status_label}</span>
                                <span className="text-sm font-black text-slate-700">{node.value_label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDetailView = () => {
        if (isLoadingDetail) return <div className="p-8 text-center animate-pulse">Loading detail...</div>;
        if (!detailData) return null;

        return (
            <div className="p-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">{detailData.title}</h3>
                        <p className="text-sm font-bold text-slate-500">{detailData.subtitle}</p>
                    </div>
                    {detailData.pdf_url && (
                        <Button onClick={() => window.open(detailData.pdf_url!, '_blank')} className="rounded-xl">
                            <FileText className="w-4 h-4 mr-2" /> Lihat PDF
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {detailData.fields.map((field, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{field.label}</p>
                            <p className="text-sm font-black text-slate-800">{field.value}</p>
                        </div>
                    ))}
                </div>
                
                {detailData.items && detailData.items.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {Object.keys(detailData.items[0]).map((key, i) => (
                                        <th key={i} className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">{key.replace(/_/g, ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {detailData.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        {Object.values(item).map((val, j) => (
                                            <td key={j} className="p-4 text-sm font-bold text-slate-800">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative bg-slate-50 rounded-3xl shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {renderHeader()}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {view === 'list' && (
                        <div className="h-full p-4 md:p-6">
                            {isLoadingRows ? (
                                <div className="h-full flex items-center justify-center animate-pulse text-slate-400 font-bold">Loading data...</div>
                            ) : (
                                <DashboardV2UiTable 
                                    rows={paginatedRows}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    onRowClick={handleRowClick}
                                    initialCardType={initialCardType}
                                />
                            )}
                        </div>
                    )}
                    {view === 'timeline' && renderTimelineView()}
                    {view === 'detail' && renderDetailView()}
                </div>
            </div>
        </div>,
        document.body
    );
};
