import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Download, FileText, Activity, HardHat, FileCheck, Search, ChevronLeft, ChevronRight, Layers, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { viewGeneratedPdfOnline } from '@/lib/api';
import { API_URL } from '@/lib/constants';

const formatDateIndo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    // Fix standard DB timestamp format
    const str = String(dateStr).replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/\+.*$/, '');
    const date = new Date(str.replace(/-/g, '/')); // For cross-browser compatibility
    if (isNaN(date.getTime())) return String(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    let res = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    const hasTime = String(dateStr).includes(':') || str.includes(':');
    
    if (hasTime && (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0 || String(dateStr).match(/\d{2}:\d{2}:\d{2}/))) {
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        const secs = String(date.getSeconds()).padStart(2, '0');
        res += ` pukul ${hours}:${mins}:${secs}`;
    }
    return res;
};

const isDashboardDateEffective = (dateStr: string | null | undefined, now: Date) => {
    return dateStr ? new Date(dateStr) <= now : false;
};

const getProjectStage = (project: any): string => {
    const now = new Date();
    const hasRAB = (project.rab || []).length > 0;
    const rabData = project.rab?.[0];
    const rabStatus = (rabData?.status || '').toUpperCase();
    const isRabMenungguGantt = rabStatus === 'MENUNGGU GANTT CHART';
    const isRabDisetujui = rabData && rabStatus === 'DISETUJUI';
    const spkArray = Array.isArray(project.spk) ? project.spk : (project.spk ? [project.spk] : []);
    const hasSPK = spkArray.some((s: any) => ['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes((s.status || '').toUpperCase()));
    const hasApprovalSPK = spkArray.some((s: any) => (s.status || '').toUpperCase() === 'WAITING_FOR_BM_APPROVAL');
    const stArray = Array.isArray(project.berkas_serah_terima) ? project.berkas_serah_terima : (project.berkas_serah_terima ? [project.berkas_serah_terima] : []);
    const hasST = stArray.some((st: any) => isDashboardDateEffective(st?.created_at, now));
    const opnameArr = Array.isArray(project.opname_final) ? project.opname_final : (project.opname_final ? [project.opname_final] : []);
    const opnameData = opnameArr.find((o: any) => String(o?.link_pdf_opname || '').trim() && isDashboardDateEffective(o?.created_at, now));
    const hasOpnamePdf = !!opnameData;
    const isOpnameDisetujui = opnameData && (opnameData.status_opname_final || '').toUpperCase() === 'DISETUJUI';
    const hasDirectorApproval = isDashboardDateEffective(opnameData?.waktu_persetujuan_direktur, now);

    if (hasOpnamePdf && isOpnameDisetujui && hasDirectorApproval) return 'Done';
    if (hasOpnamePdf && !isOpnameDisetujui) return 'Kerja Tambah Kurang';
    if (hasOpnamePdf && isOpnameDisetujui && !hasDirectorApproval) return 'Kerja Tambah Kurang';
    if (hasST) return 'Kerja Tambah Kurang';
    if (hasSPK) return 'Ongoing';
    if (hasApprovalSPK) return 'Approval SPK';
    if (isRabDisetujui) return 'Proses PJU';
    if (hasRAB && isRabMenungguGantt) return 'Proses Gantt';
    return 'Approval RAB';
};

type DrilldownView = 'stage_summary' | 'list_ulok' | 'timeline' | 'detail' | 'cost_m2';

interface DashboardDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCardType: string | null;
    projects: any[]; 
    searchQuery?: string;
    stats?: any;
    extraStats?: any;
}

export const DashboardDrilldownModal: React.FC<DashboardDrilldownModalProps> = ({
    isOpen,
    onClose,
    initialCardType,
    projects,
    searchQuery,
    stats,
    extraStats
}) => {
    const [view, setView] = useState<DrilldownView>('list_ulok');
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: any } | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [modalSearch, setModalSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [mounted, setMounted] = useState(false);
    const itemsPerPage = 8;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setModalSearch('');
            setSelectedStage(null);

            if (searchQuery && searchQuery.length > 5 && projects.length === 1) {
                // Exact search -> Tahap 3 (Timeline)
                setSelectedProject(projects[0]);
                setView('timeline');
            } else if (initialCardType === 'TOTAL_PROJECT' || initialCardType === 'SLA') {
                setView('stage_summary');
            } else if (initialCardType === 'COST_M2') {
                setView('cost_m2');
            } else {
                setView('list_ulok');
            }
        }
    }, [isOpen, initialCardType, searchQuery, projects]);

    const directToTahap4Types = ['PENAWARAN', 'SPK', 'IL', 'PENGAWASAN', 'JHK'];

    // --- DATA FILTERING ---
    const displayProjects = useMemo(() => {
        let filtered = projects;

        // 1. Filter by initial card type
        if (initialCardType === 'DENDA') {
            filtered = filtered.filter(p => p.opname_final?.some((o: any) => Number(o.hari_denda) > 0 || Number(o.nilai_denda) > 0));
        } else if (initialCardType === 'PENAWARAN') {
            filtered = filtered.filter(p => p.rab && p.rab.length > 0);
        } else if (initialCardType === 'SPK' || initialCardType === 'JHK') {
            filtered = filtered.filter(p => p.spk && p.spk.length > 0);
        } else if (initialCardType === 'IL') {
            filtered = filtered.filter(p => p.instruksi_lapangan && p.instruksi_lapangan.length > 0);
        } else if (initialCardType === 'PENGAWASAN') {
            filtered = filtered.filter(p => p.gantt && p.gantt.some((g: any) => g.pengawasan_gantt && g.pengawasan_gantt.length > 0));
        } else if (initialCardType === 'SLA') {
            // Include projects in SLA attention
            const att = stats?.tokoPerhatian || [];
            filtered = filtered.filter(p => att.includes(p.toko?.nomor_ulok));
        }

        // 2. Filter by stage (if came from Stage Summary)
        if (selectedStage) {
            filtered = filtered.filter(p => getProjectStage(p) === selectedStage);
        }

        // 3. Filter by modal search
        if (modalSearch) {
            const lowSearch = modalSearch.toLowerCase();
            filtered = filtered.filter(p => 
                p.toko?.nomor_ulok?.toLowerCase().includes(lowSearch) ||
                p.toko?.nama_toko?.toLowerCase().includes(lowSearch)
            );
        }

        return filtered;
    }, [projects, initialCardType, selectedStage, modalSearch, stats]);

    const totalPages = Math.ceil(displayProjects.length / itemsPerPage);
    const paginatedProjects = displayProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- STAGE SUMMARY LOGIC ---
    const stages = [
        { label: 'Approval RAB', desc: 'RAB sedang direview', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
        { label: 'Proses Gantt', desc: 'Pembuatan jadwal', icon: <Activity className="w-5 h-5 text-emerald-500" /> },
        { label: 'Proses PJU', desc: 'Persetujuan SPK', icon: <FileCheck className="w-5 h-5 text-amber-500" /> },
        { label: 'Approval SPK', desc: 'Tanda tangan SPK', icon: <FileCheck className="w-5 h-5 text-blue-500" /> },
        { label: 'Ongoing', desc: 'Pekerjaan berjalan', icon: <HardHat className="w-5 h-5 text-orange-500" /> },
        { label: 'Kerja Tambah Kurang', desc: 'Perubahan lingkup', icon: <Layers className="w-5 h-5 text-purple-500" /> },
        { label: 'Done', desc: 'Serah terima selesai', icon: <CheckCircle2 className="w-5 h-5 text-teal-500" /> }
    ];

    const handleProjectClick = (project: any) => {
        setSelectedProject(project);
        
        if (initialCardType && directToTahap4Types.includes(initialCardType)) {
            let docType = 'RAB';
            let docData = project.rab?.[0];

            if (initialCardType === 'SPK' || initialCardType === 'JHK') {
                docType = 'SPK';
                docData = project.spk?.[0];
            } else if (initialCardType === 'IL') {
                docType = 'Instruksi Lapangan';
                docData = project.instruksi_lapangan?.[0];
            } else if (initialCardType === 'PENGAWASAN') {
                docType = 'Pengawasan';
                const gantt = project.gantt?.find((g: any) => g.pengawasan_gantt && g.pengawasan_gantt.length > 0);
                docData = gantt?.pengawasan_gantt?.[0];
            }

            setSelectedDocument({ type: docType, data: docData });
            setView('timeline');
        } else {
            setSelectedDocument(null);
            setView('timeline');
        }
    };

    const handleBack = () => {
        if (view === 'timeline') {
            setView('list_ulok');
            setSelectedDocument(null);
        } else if (view === 'list_ulok' && (initialCardType === 'TOTAL_PROJECT' || initialCardType === 'SLA')) {
            setView('stage_summary');
            setSelectedStage(null);
        } else if (view === 'cost_m2') {
            onClose(); // Cost M2 only has one view in modal right now
        }
    };

    if (!isOpen || !mounted) return null;

    // --- RENDERERS ---
    const renderHeader = () => {
        let title = 'Daftar Proyek';
        let subtitle = 'Pilih proyek untuk melihat detail';

        if (view === 'timeline') {
            title = `Timeline Proyek: ${selectedProject?.toko?.nomor_ulok || 'Unknown'}`;
            subtitle = selectedProject?.toko?.nama_toko || '';
        } else if (view === 'stage_summary') {
            title = initialCardType === 'SLA' ? 'SLA Perhatian Proyek' : 'Ringkasan Tahapan Proyek';
            subtitle = 'Pilih tahapan untuk melihat daftar ULOK';
        } else if (view === 'cost_m2') {
            title = 'Rincian Cost / m²';
            subtitle = 'Data harga satuan per meter persegi tiap ULOK';
        } else {
            if (selectedStage) title = `Daftar ULOK: ${selectedStage}`;
            else if (initialCardType === 'DENDA') title = 'Daftar ULOK Kena Denda';
            else if (initialCardType === 'PENAWARAN') title = 'Daftar Nilai Penawaran (RAB)';
            else if (initialCardType === 'SPK') title = 'Daftar Nilai SPK';
            else if (initialCardType === 'JHK') title = 'Daftar Tambah Hari SPK';
            else if (initialCardType === 'IL') title = 'Daftar Instruksi Lapangan';
            else if (initialCardType === 'PENGAWASAN') title = 'Daftar Item Pengawasan';
        }

        return (
            <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-200 bg-white/95 backdrop-blur-sm text-slate-800 sticky top-0 z-20">
                <div className="flex items-center gap-4 md:gap-5">
                    {(view !== 'stage_summary' && view !== 'cost_m2' && !(view === 'list_ulok' && !['TOTAL_PROJECT', 'SLA'].includes(initialCardType || ''))) && (
                        <button onClick={handleBack} className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-colors border border-slate-200 shadow-sm group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-2 h-7 bg-red-600 rounded-full shadow-sm shadow-red-500/20"></div>
                            {title}
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1 pl-5">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Bar for lists */}
                    {(view === 'list_ulok' || view === 'cost_m2') && (
                        <div className="relative w-72 hidden md:block group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Cari Nama Toko / ULOK..."
                                value={modalSearch}
                                onChange={e => { setModalSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all font-semibold shadow-sm"
                            />
                        </div>
                    )}
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors ml-2">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    };

    const renderStageSummary = () => {
        let displayStages = stages;
        if (initialCardType === 'SLA') {
            displayStages = stages.filter(s => s.label !== 'Done');
        }

        return (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4">
                {displayStages.map((stage, idx) => {
                    let count = projects.filter(p => getProjectStage(p) === stage.label).length;
                    if (initialCardType === 'SLA') {
                        const att = stats?.tokoPerhatian || [];
                        count = projects.filter(p => getProjectStage(p) === stage.label && att.includes(p.toko?.nomor_ulok)).length;
                    }
                    
                    let bgGlow = 'group-hover:bg-indigo-50';
                    let iconColor = 'text-indigo-500';
                    let borderGlow = 'group-hover:border-indigo-200';
                    let iconBg = 'bg-indigo-50';
                    
                    if (stage.label.includes('RAB')) { bgGlow = 'group-hover:bg-blue-50'; iconColor = 'text-blue-500'; borderGlow = 'group-hover:border-blue-200'; iconBg = 'bg-blue-50'; }
                    else if (stage.label.includes('Gantt')) { bgGlow = 'group-hover:bg-emerald-50'; iconColor = 'text-emerald-500'; borderGlow = 'group-hover:border-emerald-200'; iconBg = 'bg-emerald-50'; }
                    else if (stage.label.includes('PJU')) { bgGlow = 'group-hover:bg-amber-50'; iconColor = 'text-amber-500'; borderGlow = 'group-hover:border-amber-200'; iconBg = 'bg-amber-50'; }
                    else if (stage.label.includes('SPK')) { bgGlow = 'group-hover:bg-cyan-50'; iconColor = 'text-cyan-500'; borderGlow = 'group-hover:border-cyan-200'; iconBg = 'bg-cyan-50'; }
                    else if (stage.label === 'Ongoing') { bgGlow = 'group-hover:bg-orange-50'; iconColor = 'text-orange-500'; borderGlow = 'group-hover:border-orange-200'; iconBg = 'bg-orange-50'; }
                    else if (stage.label.includes('Kurang')) { bgGlow = 'group-hover:bg-purple-50'; iconColor = 'text-purple-500'; borderGlow = 'group-hover:border-purple-200'; iconBg = 'bg-purple-50'; }
                    else if (stage.label === 'Done') { bgGlow = 'group-hover:bg-teal-50'; iconColor = 'text-teal-500'; borderGlow = 'group-hover:border-teal-200'; iconBg = 'bg-teal-50'; }

                    return (
                        <div 
                            key={idx} 
                            className={`relative bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between group overflow-hidden ${borderGlow} hover:-translate-y-1.5`}
                            onClick={() => { setSelectedStage(stage.label); setView('list_ulok'); }}
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl ${bgGlow}`}></div>

                            <div className="relative z-10 flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform shadow-sm`}>
                                    <div className={iconColor}>{stage.icon}</div>
                                </div>
                                <span className="text-4xl font-black text-slate-100 group-hover:text-slate-200 transition-colors tracking-tighter">{String(idx + 1).padStart(2, '0')}</span>
                            </div>

                            <div className="relative z-10 flex flex-col flex-grow">
                                <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-slate-950 tracking-tight">{stage.label}</h3>
                                <p className="text-sm text-slate-500 font-semibold mb-6 flex-grow">{stage.desc}</p>
                                
                                <div className="flex items-end justify-between pt-5 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Proyek</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{count}</p>
                                            <span className="text-xs font-bold text-slate-400">Toko</span>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-900 transition-colors shadow-sm`}>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-white transition-colors`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderListUlok = () => (
        <div className="h-full flex flex-col gap-4">
            {paginatedProjects.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center p-12 shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">Tidak ada data yang sesuai.</p>
                </div>
            ) : (
                <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {paginatedProjects.map((project, idx) => {
                        const statusTerkini = getProjectStage(project);
                        const nilaiSPK = formatRupiah(project.spk?.[0]?.grand_total || 0);
                        const nilaiRAB = formatRupiah(project.rab?.[0]?.grand_total_final || 0);
                        const denda = formatRupiah(project.opname_final?.[0]?.nilai_denda || 0);
                        
                        let tambahHari = 0;
                        project.spk?.forEach((s:any) => s.pertambahan_spk?.forEach((pt:any) => { if(pt.status_persetujuan === 'APPROVED') tambahHari += Number(pt.pertambahan_hari || 0); }));
                        
                        const il = project.instruksi_lapangan?.[0];
                        const statusIL = il?.status || 'ONGOING';
                        const nilaiIL = formatRupiah(il?.grand_total || 0);

                        return (
                            <div 
                                key={idx} 
                                className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden"
                                onClick={() => handleProjectClick(project)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-red-500 transition-colors"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-black text-slate-800 text-lg group-hover:text-red-700 truncate">{project.toko?.nama_toko || 'Unknown'}</h4>
                                        <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 text-[10px] tracking-widest">{project.toko?.nomor_ulok || 'Unknown'}</Badge>
                                    </div>
                                    <div className="text-sm font-bold text-slate-400 tracking-wide flex items-center gap-2">
                                        <span>{project.toko?.cabang || '-'}</span>
                                        {['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'SPK'].includes(initialCardType || '') && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-indigo-500 uppercase tracking-widest text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full">{statusTerkini}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                                    {initialCardType === 'DENDA' && (
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai Denda</span>
                                            <span className="text-base font-black text-rose-600">{denda}</span>
                                        </div>
                                    )}
                                    {initialCardType === 'JHK' && (
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tambah Hari</span>
                                            <span className="text-base font-black text-blue-600">{tambahHari > 0 ? `${tambahHari} Hari` : '-'}</span>
                                        </div>
                                    )}
                                    {initialCardType === 'IL' && (
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                                                <Badge variant="outline" className={`mt-1 ${statusIL === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{statusIL}</Badge>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai IL</span>
                                                <span className="text-base font-black text-orange-600">{nilaiIL}</span>
                                            </div>
                                        </div>
                                    )}
                                    {['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'SPK'].includes(initialCardType || '') && (
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai {initialCardType === 'PENAWARAN' ? 'RAB' : 'SPK'}</span>
                                            <span className="text-base font-black text-slate-700">{initialCardType === 'PENAWARAN' ? nilaiRAB : nilaiSPK}</span>
                                        </div>
                                    )}
                                    {initialCardType === 'PENGAWASAN' && (
                                        <Badge className="bg-purple-50 text-purple-700 border-none">Check Timeline</Badge>
                                    )}
                                    
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 group-hover:text-white text-slate-400 transition-all shrink-0">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <p className="text-sm font-semibold text-slate-500">
                        Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari <span className="text-slate-900 font-black">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-bold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-bold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCostM2Cards = () => (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-1 pb-4">
                {paginatedProjects.map((p, idx) => {
                    const rab = p.rab?.[0];
                    const luasTerbangun = Number(rab?.luas_terbangun || 1);
                    const costTerbangun = Number(rab?.grand_total_final || 0);
                    const avg = costTerbangun / luasTerbangun;
                    
                    const lingkup = (p.toko?.lingkup_pekerjaan || 'UNKNOWN').toUpperCase();
                    let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (lingkup.includes('ME') && lingkup.includes('SIPIL')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (lingkup.includes('ME')) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    else if (lingkup.includes('SIPIL')) badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';

                    return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer" onClick={() => handleProjectClick(p)}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Layers className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <Badge variant="outline" className={`${badgeColor} font-black text-[10px] tracking-widest`}>{lingkup}</Badge>
                                </div>
                                <h3 className="font-black text-slate-800 text-lg group-hover:text-red-600 transition-colors">{p.toko?.nama_toko}</h3>
                                <p className="text-xs font-semibold text-slate-400 mt-1">{luasTerbangun} m² · {formatRupiah(costTerbangun)}</p>
                            </div>
                            <div className="mt-6">
                                <p className="text-2xl font-black text-emerald-700">{formatRupiah(avg)} <span className="text-xs text-slate-400 font-semibold">/m²</span></p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <p className="text-sm font-semibold text-slate-500">
                        Halaman <span className="text-slate-900 font-black">{currentPage}</span> dari <span className="text-slate-900 font-black">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-bold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-bold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTimeline = () => {
        // Build timeline nodes
        const nodes = [];
        
        // Project Planning
        if (selectedProject?.project_planning) {
            const pp = Array.isArray(selectedProject.project_planning) ? selectedProject.project_planning[0] : selectedProject.project_planning;
            if (pp) nodes.push({ type: 'Project Planning', title: 'Project Planning', desc: 'Selesai', icon: <FileText className="w-5 h-5"/>, color: 'blue', data: pp });
        }
        
        // Penawaran
        if (selectedProject?.rab?.length > 0) {
            nodes.push({ type: 'PENAWARAN', title: 'Penawaran (RAB)', desc: formatRupiah(selectedProject.rab[0].grand_total_final), icon: <FileText className="w-5 h-5"/>, color: 'indigo', data: selectedProject.rab[0] });
        }
        
        // SPK
        if (selectedProject?.spk?.length > 0) {
            nodes.push({ type: 'SPK', title: 'Surat Perintah Kerja', desc: formatRupiah(selectedProject.spk[0].grand_total), icon: <HardHat className="w-5 h-5"/>, color: 'blue', data: selectedProject.spk[0] });
        }

        // Tambah SPK (Cross-Lingkup check)
        const idToko = selectedProject?.toko?.id_toko;
        let tsArray: any[] = [];
        
        if (projects && idToko) {
            projects.forEach((p: any) => {
                if (p.toko?.id_toko === idToko && p.spk && p.spk.length > 0) {
                    const spkTs = p.spk[0].pertambahan_spk;
                    if (spkTs && spkTs.length > 0) {
                        tsArray = [...tsArray, ...spkTs];
                    }
                }
            });
        } else if (selectedProject?.spk?.length > 0 && selectedProject.spk[0].pertambahan_spk?.length > 0) {
            tsArray = [...selectedProject.spk[0].pertambahan_spk];
        }

        // Deduplicate by ID
        tsArray = tsArray.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        
        if (tsArray.length > 0) {
            const t = tsArray[0]; // just take the first one since it's 1 per ulok
            nodes.push({ type: 'Tambah SPK', title: 'Tambah SPK', desc: `${t.pertambahan_hari} Hari`, icon: <Clock className="w-5 h-5"/>, color: 'cyan', data: t });
        }
        
        // Instruksi Lapangan
        if (selectedProject?.instruksi_lapangan?.length > 0) {
            selectedProject.instruksi_lapangan.forEach((il: any, idx: number) => {
                nodes.push({ type: 'IL', title: `Instruksi Lapangan ${idx + 1}`, desc: formatRupiah(il.grand_total), icon: <Activity className="w-5 h-5"/>, color: 'orange', data: il });
            });
        }
        
        // Pengawasan
        const ganttWithPw = selectedProject?.gantt?.find((g: any) => g.pengawasan_gantt && g.pengawasan_gantt.length > 0);
        if (ganttWithPw) {
            nodes.push({ type: 'PENGAWASAN', title: 'Item Pengawasan', desc: `${ganttWithPw.pengawasan_gantt.length} Item`, icon: <Search className="w-5 h-5"/>, color: 'purple', data: ganttWithPw.pengawasan_gantt });
        }
        
        // Opname Parsial & Final
        const allOpnames = selectedProject?.opname_final || [];
        const opnameParsial = allOpnames.filter((o: any) => o.tipe_opname === 'OPNAME');
        const opnameFinal = allOpnames.filter((o: any) => o.tipe_opname !== 'OPNAME');
        
        if (opnameParsial.length > 0) {
            opnameParsial.forEach((op: any, idx: number) => {
                nodes.push({ type: 'Opname Parsial', title: opnameParsial.length > 1 ? `Opname Parsial ${idx + 1}` : 'Opname Parsial', desc: formatRupiah(op.grand_total_opname || op.nilai_opname || 0), icon: <Activity className="w-5 h-5"/>, color: 'sky', data: op });
            });
        }

        if (opnameFinal.length > 0) {
            const opname = opnameFinal[0];
            const rab = selectedProject?.rab?.[0];
            const grandFinal = Number(opname.grand_total_final || opname.grand_total_opname || opname.nilai_opname || 0);
            const grandRab = Number(rab?.grand_total_final || 0);
            const opnameStatus = grandFinal > grandRab ? 'Kerja Tambah' : (grandFinal < grandRab ? 'Kerja Kurang' : 'Sesuai');
            nodes.push({ type: 'Opname Final', title: 'Opname Final', desc: `${formatRupiah(grandFinal)} (${opnameStatus})`, icon: <CheckCircle2 className="w-5 h-5"/>, color: 'teal', data: opname });
        }
        
        // KTK
        if (selectedProject?.ktk?.length > 0) {
            nodes.push({ type: 'KTK', title: 'Kerja Tambah Kurang', desc: 'Perubahan', icon: <Layers className="w-5 h-5"/>, color: 'rose', data: selectedProject.ktk[0] });
        }

        // Serah Terima
        if (selectedProject?.berkas_serah_terima?.length > 0) {
            nodes.push({ type: 'ST', title: 'Serah Terima Selesai', desc: 'DONE', icon: <FileCheck className="w-5 h-5"/>, color: 'emerald', data: selectedProject.berkas_serah_terima[0] });
        }

        // Dok Bangunan Toko Baru
        if (selectedProject?.dokumentasi_bangunan_toko_baru) {
            const dok = Array.isArray(selectedProject.dokumentasi_bangunan_toko_baru) ? selectedProject.dokumentasi_bangunan_toko_baru[0] : selectedProject.dokumentasi_bangunan_toko_baru;
            if (dok) nodes.push({ type: 'Dok. Bangunan', title: 'Dokumentasi Bangunan', desc: 'Foto & Berkas', icon: <Layers className="w-5 h-5"/>, color: 'pink', data: dok });
        }

        return (
            <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Left Timeline Sidebar */}
                <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col relative shadow-sm h-fit max-h-full overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Timeline Dokumen Proyek</h3>
                    
                    {nodes.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">Belum ada dokumen</div>
                    ) : (
                        <div className="relative flex flex-col gap-8">
                            <div className="absolute left-[24px] top-[10px] bottom-[10px] w-[2px] bg-slate-100 z-0"></div>
                            
                            {nodes.map((node, i) => (
                                <div 
                                    key={i}
                                    className="relative z-10 flex gap-5 cursor-pointer group"
                                    onClick={() => { setSelectedDocument({ type: node.type, data: node.data }); }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 text-${node.color}-500 flex items-center justify-center shrink-0 group-hover:bg-${node.color}-500 group-hover:border-${node.color}-500 group-hover:text-white transition-all shadow-sm z-10 relative group-hover:scale-110`}>
                                        {node.icon}
                                    </div>
                                    <div className="pt-1">
                                        <h4 className={`font-black text-slate-800 text-base group-hover:text-${node.color}-600 transition-colors`}>{node.title}</h4>
                                        <p className="text-sm font-bold text-slate-500 mt-1">{node.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Right Content Area */}
                <div className="flex-1 flex flex-col min-h-0 relative h-full">
                    {selectedDocument ? (
                        <div className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {renderDocumentDetail()}
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12 shadow-sm text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="relative z-10 w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-all duration-500 group-hover:scale-110">
                                <Layers className="w-10 h-10 text-slate-300 group-hover:text-red-400 transition-colors duration-500" />
                            </div>
                            <h3 className="relative z-10 text-2xl font-black text-slate-700 mb-3 tracking-tight">Pilih Dokumen</h3>
                            <p className="relative z-10 text-sm font-bold text-slate-500 max-w-sm leading-relaxed">Silakan pilih salah satu dokumen pada timeline di sebelah kiri untuk melihat rincian datanya secara lengkap.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDocumentDetail = () => {
        if (!selectedDocument || !selectedDocument.data) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-200">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-semibold text-lg">Dokumen tidak ditemukan</p>
                </div>
            );
        }

        const type = selectedDocument.type;
        const data = selectedDocument.data;

        const fR = (val: any) => {
            if (!val || isNaN(Number(val))) return 'Rp 0';
            return formatRupiah(Number(val));
        };

        const renderPdfButton = (url: string, label: string) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
            return (
                <Button 
                    key={label}
                    className="bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-xl shrink-0 shadow-sm border border-slate-200 transition-all h-10 px-4 group"
                    onClick={(e) => {
                        e.preventDefault();
                        const genericProxyUrl = `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
                        window.open(genericProxyUrl, '_blank', 'noopener,noreferrer');
                    }}
                >
                    <FileText className="w-4 h-4 mr-2 text-red-500 group-hover:scale-110 transition-transform" /> {label}
                </Button>
            );
        };

        const renderMainPdfButton = (url: string, documentId?: number, pdfType?: string) => {
            if (!url) return null;
            return (
                <Button 
                    className="bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl shrink-0 shadow-md shadow-red-500/20 hover:scale-105 transition-all h-11 px-6"
                    onClick={async () => {
                        try {
                            if (pdfType && documentId) {
                                await viewGeneratedPdfOnline(documentId, pdfType as any);
                            } else {
                                const genericProxyUrl = `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
                                window.open(genericProxyUrl, '_blank', 'noopener,noreferrer');
                            }
                        } catch (err) {
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }
                    }}
                >
                    <Download className="w-4 h-4 mr-2" /> Lihat / Unduh Dokumen
                </Button>
            );
        };

        // Render khusus untuk masing-masing tipe dokumen
        if (type === 'PENAWARAN') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'pemberi_persetujuan', 'waktu_persetujuan'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            const wPersetujuan = data.waktu_persetujuan ? String(data.waktu_persetujuan).replace(/\.\d+\+.*$/, '') : '';
            const mergedPersetujuan = (data.pemberi_persetujuan || wPersetujuan) ? `${data.pemberi_persetujuan || '-'} / ${wPersetujuan}` : null;

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="text-lg font-black text-slate-800 tracking-tight mb-4">Dokumen RAB Tersedia</h4>
                            <div className="flex flex-wrap gap-3">
                                {renderPdfButton(data.link_pdf_gabungan, 'PDF Gabungan')}
                                {renderPdfButton(data.link_pdf_non_sbo, 'PDF Non-SBO')}
                                {renderPdfButton(data.link_pdf_rekapitulasi, 'PDF Rekapitulasi')}
                                {renderPdfButton(data.link_pdf_sph, 'PDF SPH')}
                                {renderPdfButton(data.logo, 'Logo')}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {mergedPersetujuan && (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Persetujuan</th>
                                            <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">{mergedPersetujuan}</td>
                                        </tr>
                                    )}
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                                        const displayVal = isCurrency ? fR(data[k]) : valStr;
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'SPK') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'nomor_ulok', 'terbilang', 'waktu_selesai', 'waktu_persetujuan', 'link_pdf', 'durasi', 'spk_manual_1', 'spk_manual_2', 'pertambahan_spk'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            const wSelesai = data.waktu_selesai ? String(data.waktu_selesai).replace(/T?\d{2}:\d{2}:\d{2}.*$/, '') : '';
            const wPersetujuan = data.waktu_persetujuan ? String(data.waktu_persetujuan).replace(/\.\d+\+.*$/, '') : '';

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    {data.link_pdf && (
                        <div className="px-8 pt-8 pb-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen SPK</h4>
                                    <p className="text-sm text-slate-500 font-medium">Lihat atau unduh dokumen SPK resmi.</p>
                                </div>
                                {renderMainPdfButton(data.link_pdf, data.id, 'SPK')}
                            </div>
                        </div>
                    )}
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Durasi</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.durasi || 0} Hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Selesai</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{wSelesai ? formatDateIndo(wSelesai) : '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Persetujuan</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{wPersetujuan || '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                                        const displayVal = isCurrency ? fR(data[k]) : valStr;
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'Tambah SPK') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'dokumen_tambahan', 'pertambahan_hari', 'waktu_persetujuan', 'waktu_selesai', 'tanggal_akhir_setelah_perpanjangan', 'target_st_setelah_perpanjangan', 'alasan_perpanjangan', 'disetujui_oleh', 'link_lampiran_pendukung'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            const pdfUrl = data.dokumen_tambahan || data.link_pdf;
            
            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    {pdfUrl && (
                        <div className="px-8 pt-8 pb-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen Tambah SPK</h4>
                                    <p className="text-sm text-slate-500 font-medium">Lihat lampiran Tambah SPK resmi.</p>
                                </div>
                                {renderMainPdfButton(pdfUrl)}
                            </div>
                        </div>
                    )}
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Pertambahan Hari</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">+{data.pertambahan_hari || 0} Hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Target ST</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">
                                            {data.target_st_setelah_perpanjangan ? formatDateIndo(data.target_st_setelah_perpanjangan) : '-'} <span className="text-slate-400 font-semibold text-sm ml-2">&middot; SPK +{data.pertambahan_hari || 0} hari</span>
                                        </td>
                                    </tr>
                                    {data.alasan_perpanjangan && (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Alasan Perpanjangan</th>
                                            <td className="py-5 px-8 text-sm font-semibold text-slate-900 align-top whitespace-pre-wrap">{data.alasan_perpanjangan}</td>
                                        </tr>
                                    )}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Persetujuan</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.waktu_persetujuan ? formatDateIndo(data.waktu_persetujuan) : '-'}</td>
                                    </tr>
                                    {data.disetujui_oleh && (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Disetujui Oleh</th>
                                            <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.disetujui_oleh}</td>
                                        </tr>
                                    )}
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                                        const displayVal = isCurrency ? fR(data[k]) : valStr;
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'IL') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_lampiran', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Instruksi Lapangan</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {renderMainPdfButton(data.link_pdf, data.id, 'INSTRUKSI_LAPANGAN')}
                                {data.link_lampiran && !data.link_lampiran.startsWith('/app/tmp') && renderPdfButton(data.link_lampiran, 'Lampiran')}
                                {renderPdfButton(data.link_pdf_gabungan, 'PDF Gabungan')}
                                {renderPdfButton(data.link_pdf_non_sbo, 'PDF Non-SBO')}
                                {renderPdfButton(data.link_pdf_rekapitulasi, 'PDF Rekapitulasi')}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Dibuat</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.created_at ? String(data.created_at).replace(/\.\d+Z?$/, '').replace('T', ' ') : '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                                        const displayVal = isCurrency ? fR(data[k]) : valStr;
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'PENGAWASAN') {
            const arr = Array.isArray(data) ? data : [data];
            const allItems = arr.reduce((acc: any[], curr: any) => {
                if (curr.pengawasan && Array.isArray(curr.pengawasan)) return [...acc, ...curr.pengawasan];
                if (curr.grouped_items && Array.isArray(curr.grouped_items)) return [...acc, ...curr.grouped_items];
                if (curr.items && Array.isArray(curr.items)) return [...acc, ...curr.items];
                return [...acc, curr];
            }, []);
            
            const firstItem = arr[0] || {};
            const pdfUrl = firstItem.link_pdf_pengawasan || firstItem.link_pdf || firstItem.berkas_pengawasan?.link_pdf_pengawasan;
            const tgl = firstItem.tanggal_pengawasan || firstItem.created_at;

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Item Pengawasan</h4>
                                <p className="text-sm text-slate-500 font-medium">Tanggal Pengawasan: <span className="font-bold text-slate-700">{tgl ? formatDateIndo(tgl) : '-'}</span></p>
                            </div>
                            {renderMainPdfButton(pdfUrl, firstItem.id, 'PENGAWASAN')}
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allItems.length > 0 ? allItems.map((item: any, idx: number) => {
                                const photoUrl = item.gambar || item.foto_pengawasan || item.link_foto || item.link_lampiran;
                                return (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-purple-200 hover:shadow-md transition-all cursor-pointer" onClick={() => photoUrl ? window.open(photoUrl, '_blank') : null}>
                                        <div className="flex items-start justify-between">
                                            <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100">{item.kategori_pekerjaan || item.kategori || 'UMUM'}</Badge>
                                            <Badge className={item.status === 'Sesuai' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                                                {item.status || 'Pending'}
                                            </Badge>
                                        </div>
                                        <h5 className="font-bold text-slate-800 line-clamp-2">{item.nama_pekerjaan || item.pekerjaan || item.item_pekerjaan || '-'}</h5>
                                        {item.keterangan && <p className="text-xs text-slate-500 italic">{item.keterangan}</p>}
                                        {photoUrl && (
                                            <div className="text-sm text-blue-600 group-hover:underline mt-2 font-semibold">
                                                Lihat Foto / Lampiran &rarr;
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="col-span-2 text-center text-slate-400 py-8">Tidak ada item detail pengawasan</div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'Opname' || type === 'Opname Final' || type === 'Opname Parsial') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_pdf_opname', 'items', 'hari_denda', 'nilai_denda', 'tipe_opname'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            const docTitle = type === 'Opname Parsial' ? 'Opname Parsial' : 'Opname Final';
            
            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    {(data.link_pdf || data.link_pdf_opname) && (
                        <div className="px-8 pt-8 pb-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">{docTitle}</h4>
                                </div>
                                {renderMainPdfButton(data.link_pdf || data.link_pdf_opname)}
                            </div>
                        </div>
                    )}
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Hari Denda</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.hari_denda || 0} hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Nilai Denda</th>
                                        <td className="py-5 px-8 text-base font-bold text-rose-600 align-top">{fR(data.nilai_denda || 0)}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                                        const displayVal = isCurrency ? fR(data[k]) : valStr;
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'ST') {
            const rab = selectedProject?.rab?.[0];
            const spk = selectedProject?.spk?.[0];
            const opname = selectedProject?.opname_final?.[0];

            const dendaRp = opname?.nilai_denda || 0;
            const dendaHari = opname?.hari_denda || 0;
            const spkAkhir = spk?.waktu_selesai ? formatDateIndo(spk.waktu_selesai) : '-';
            const stDibuat = data.created_at ? formatDateIndo(data.created_at) : '-';

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Serah Terima Selesai</h4>
                                <p className="text-sm text-slate-500 font-medium">Ringkasan final proyek & serah terima</p>
                            </div>
                            {renderMainPdfButton(data.link_pdf, data.id, 'BERKAS_SERAH_TERIMA')}
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tanggal Dibuat</p>
                                <p className="text-lg font-bold text-slate-800">{stDibuat}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nomor SPK</p>
                                <p className="text-lg font-bold text-slate-800">{spk?.nomor_spk || '-'}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nilai Penawaran</p>
                                <p className="text-lg font-black text-slate-800">{fR(rab?.grand_total_final)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nilai SPK</p>
                                <p className="text-lg font-black text-slate-800">{fR(spk?.grand_total)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nilai Opname / ST</p>
                                <p className="text-lg font-black text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-lg -ml-3">{fR(opname?.nilai_opname || data.nilai_opname)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Keterlambatan</p>
                                <p className="text-lg font-bold text-slate-800">{dendaHari} hari</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Denda</p>
                                <p className="text-lg font-black text-rose-600">{fR(dendaRp)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Periode Denda</p>
                                <p className="text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                                    Akhir SPK: <span className="text-slate-900">{spkAkhir}</span> <br/> 
                                    ST: <span className="text-slate-900">{stDibuat}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Fallback for other document types (e.g. Dok. Bangunan, KTK)
        const keys = Object.keys(data).filter(k => 
            !k.includes('id') && 
            !k.includes('_at') && 
            data[k] !== null && 
            data[k] !== '' &&
            String(data[k]).toUpperCase() !== 'NULL' &&
            typeof data[k] !== 'object'
        );

        return (
            <div className="w-full h-full flex flex-col bg-slate-50/20">
                {data.link_pdf && (
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen Tersedia</h4>
                            </div>
                            {renderMainPdfButton(data.link_pdf)}
                        </div>
                    </div>
                )}
                
                <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                        {keys.map((k, i) => {
                            const valStr = String(data[k]);
                            const isLink = valStr.startsWith('http://') || valStr.startsWith('https://');
                            const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi'));
                            
                            const displayVal = isCurrency ? fR(data[k]) : valStr;

                            return (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                    <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">
                                        {k.replace(/_/g, ' ')}
                                    </th>
                                    <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                        {isLink ? (
                                        <a 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const genericProxyUrl = `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(valStr)}`;
                                                window.open(genericProxyUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                            className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 -ml-3 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 shrink-0" /> Lihat Dokumen
                                        </a>
                                    ) : (
                                        <span className={`text-base font-bold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>
                                            {displayVal}
                                        </span>
                                    )}
                                    </td>
                                </tr>
                            );
                        })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative bg-slate-50 rounded-3xl shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 elegant-shadow">
                {renderHeader()}
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
                    {view === 'stage_summary' && renderStageSummary()}
                    {view === 'list_ulok' && renderListUlok()}
                    {view === 'cost_m2' && renderCostM2Cards()}
                    {view === 'timeline' && renderTimeline()}
                </div>
            </div>
        </div>,
        document.body
    );
};
