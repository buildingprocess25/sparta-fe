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
    const [selectedMemoForDrawer, setSelectedMemoForDrawer] = useState<any | null>(null);
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
            setSelectedMemoForDrawer(null);

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

    const directToTahap4Types = ['PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'IL', 'INSTRUKSI_LAPANGAN', 'PENGAWASAN', 'ITEM_PENGAWASAN', 'JHK', 'TAMBAH_HARI_SPK', 'ST', 'SERAH_TERIMA', 'DENDA', 'TOTAL_DENDA'];

    // --- DATA FILTERING ---
    const displayProjects = useMemo(() => {
        let filtered = projects;

        // 1. Filter by initial card type
        if (initialCardType === 'DENDA' || initialCardType === 'TOTAL_DENDA') {
            filtered = filtered.filter(p => p.opname_final?.some((o: any) => Number(o.hari_denda) > 0 || Number(o.nilai_denda) > 0));
        } else if (initialCardType === 'PENAWARAN' || initialCardType === 'NILAI_PENAWARAN') {
            filtered = filtered.filter(p => p.rab && p.rab.length > 0);
        } else if (initialCardType === 'SPK' || initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') {
            filtered = filtered.filter(p => p.spk && p.spk.length > 0);
            if (initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') {
                filtered = filtered.filter(p => p.spk[0]?.pertambahan_spk && p.spk[0].pertambahan_spk.length > 0);
            }
        } else if (initialCardType === 'SPK_AKTIF') {
            filtered = filtered.filter(p => {
                const spkArray = Array.isArray(p.spk) ? p.spk : (p.spk ? [p.spk] : []);
                return spkArray.some((s: any) => ['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes((s.status || '').toUpperCase()));
            });
        } else if (initialCardType === 'IL' || initialCardType === 'INSTRUKSI_LAPANGAN') {
            filtered = filtered.filter(p => p.instruksi_lapangan && p.instruksi_lapangan.length > 0);
        } else if (initialCardType === 'PENGAWASAN' || initialCardType === 'ITEM_PENGAWASAN') {
            filtered = filtered.filter(p => p.gantt && p.gantt.some((g: any) => g.pengawasan && g.pengawasan.length > 0));
        } else if (initialCardType === 'KERJA_TAMBAH_KURANG') {
            filtered = filtered.filter(p => p.ktk && p.ktk.length > 0);
        } else if (initialCardType === 'SERAH_TERIMA' || initialCardType === 'ST') {
            filtered = filtered.filter(p => p.berkas_serah_terima && p.berkas_serah_terima.length > 0);
        } else if (initialCardType === 'SLA') {
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
    const renderStageSummary = () => {
        let stages = [
            { label: 'Approval RAB', desc: 'RAB sedang direview', icon: <FileText className="w-5 h-5 text-indigo-500" /> },
            { label: 'Proses Gantt', desc: 'Pembuatan jadwal', icon: <Activity className="w-5 h-5 text-emerald-500" /> },
            { label: 'Proses PJU', desc: 'Persetujuan SPK', icon: <FileCheck className="w-5 h-5 text-amber-500" /> },
            { label: 'Approval SPK', desc: 'Tanda tangan SPK', icon: <FileCheck className="w-5 h-5 text-blue-500" /> },
            { label: 'Ongoing', desc: 'Pekerjaan berjalan', icon: <HardHat className="w-5 h-5 text-orange-500" /> },
            { label: 'Kerja Tambah Kurang', desc: 'Perubahan lingkup', icon: <Layers className="w-5 h-5 text-purple-500" /> },
            { label: 'Done', desc: 'Serah terima selesai', icon: <CheckCircle2 className="w-5 h-5 text-teal-500" /> }
        ];

        if (initialCardType === 'SLA') {
            stages = stages.filter(s => s.label !== 'Proses Gantt' && s.label !== 'Done');
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-y-auto custom-scrollbar pb-4 pr-2">
                {stages.map((stage, idx) => {
                    const count = displayProjects.filter(p => getProjectStage(p) === stage.label).length;
                    
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

    const handleProjectClick = (project: any) => {
        setSelectedProject(project);
        
        if (initialCardType && directToTahap4Types.includes(initialCardType)) {
            let docType = 'PENAWARAN';
            let docData = project.rab?.[0];

            if (['SPK', 'SPK_AKTIF'].includes(initialCardType)) {
                docType = 'SPK';
                docData = project.spk?.[0];
            } else if (['JHK', 'TAMBAH_HARI_SPK'].includes(initialCardType)) {
                docType = 'Tambah SPK';
                docData = project.spk?.[0]?.pertambahan_spk?.[0];
            } else if (['IL', 'INSTRUKSI_LAPANGAN'].includes(initialCardType)) {
                docType = 'IL';
                docData = project.instruksi_lapangan?.[0];
            } else if (['PENGAWASAN', 'ITEM_PENGAWASAN'].includes(initialCardType)) {
                docType = 'PENGAWASAN';
                docData = {
                    isPengawasanRoot: true,
                    ganttData: project.gantt,
                    projectData: project
                };
            } else if (['ST', 'SERAH_TERIMA'].includes(initialCardType)) {
                docType = 'ST';
                docData = project.berkas_serah_terima?.[0];
            }

            setSelectedDocument({ type: docType, data: docData });
            setView('detail');
        } else {
            setSelectedDocument(null);
            setView('timeline');
        }
    };

    const handleBack = () => {
        if (view === 'timeline' || view === 'detail') {
            if (initialCardType === 'COST_M2') {
                setView('cost_m2');
            } else {
                setView('list_ulok');
            }
            setSelectedDocument(null);
        } else if (view === 'list_ulok' && initialCardType === 'TOTAL_PROJECT') {
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
            title = 'Ringkasan Tahapan Proyek';
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
                                        {['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'KERJA_TAMBAH_KURANG', 'SERAH_TERIMA', 'ST'].includes(initialCardType || '') && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-indigo-500 uppercase tracking-widest text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full">{statusTerkini}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                                    {initialCardType === 'DENDA' && (() => {
                                        const op = project.opname_final?.[0];
                                        const hDenda = op?.hari_denda || 0;
                                        const st = project.berkas_serah_terima?.[0]?.created_at;
                                        const tgt = project.spk?.[0]?.waktu_selesai; // Approx target ST
                                        return (
                                            <div className="flex items-center gap-4 text-right">
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terlambat</span><span className="text-sm font-black text-slate-700">{hDenda} Hari</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target ST</span><span className="text-sm font-black text-slate-700">{tgt ? formatDateIndo(tgt) : '-'}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tgl ST</span><span className="text-sm font-black text-emerald-600">{st ? formatDateIndo(st) : '-'}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai Denda</span><span className="text-base font-black text-rose-600">{denda}</span></div>
                                            </div>
                                        );
                                    })()}
                                    {initialCardType === 'JHK' && (() => {
                                        const spk = project.spk?.[0];
                                        const endDate = spk?.waktu_selesai;
                                        // find approved extension
                                        let ptAkhir = null;
                                        spk?.pertambahan_spk?.forEach((pt: any) => {
                                            if (pt.status_persetujuan === 'APPROVED') ptAkhir = pt.tanggal_akhir_setelah_perpanjangan;
                                        });
                                        return (
                                            <div className="flex items-center gap-4 text-right">
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Akhir SPK</span><span className="text-sm font-black text-slate-700">{endDate ? formatDateIndo(endDate) : '-'}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Akhir SPK Baru</span><span className="text-sm font-black text-blue-600">{ptAkhir ? formatDateIndo(ptAkhir) : '-'}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tambah Hari</span><span className="text-base font-black text-blue-600">{tambahHari > 0 ? `${tambahHari} Hari` : '-'}</span></div>
                                            </div>
                                        );
                                    })()}
                                    {initialCardType === 'SLA' && (
                                        <div className="flex items-center gap-6 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terlambat</span>
                                                <span className="text-sm font-black text-rose-600">{project._lateDays || 0} Hari melewati SLA</span>
                                            </div>
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
                                    {['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'KERJA_TAMBAH_KURANG', 'SERAH_TERIMA', 'ST'].includes(initialCardType || '') && (
                                        <div className="flex items-center gap-6">
                                            {initialCardType === 'PENAWARAN' && (
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status RAB</span>
                                                    <Badge variant="outline" className={`mt-1 border-slate-200`}>{project.rab?.[0]?.status || 'Menunggu Persetujuan'}</Badge>
                                                </div>
                                            )}
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai {(initialCardType === 'PENAWARAN' || statusTerkini === 'Approval RAB' || statusTerkini === 'Proses Gantt') ? 'RAB' : 'SPK'}</span>
                                                <span className="text-base font-black text-slate-700">{(initialCardType === 'PENAWARAN' || statusTerkini === 'Approval RAB' || statusTerkini === 'Proses Gantt') ? nilaiRAB : nilaiSPK}</span>
                                            </div>
                                        </div>
                                    )}
                                    {initialCardType === 'PENGAWASAN' && (() => {
                                        let sel = 0, prog = 0, ter = 0;
                                        project.gantt?.forEach((g: any) => {
                                            g.pengawasan?.forEach((p: any) => {
                                                const st = (p.status || '').toUpperCase();
                                                if (['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes(st)) sel++;
                                                else if (['TERLAMBAT', 'LATE'].includes(st)) ter++;
                                                else prog++;
                                            });
                                        });
                                        return (
                                            <div className="flex items-center gap-4 text-right">
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selesai</span><span className="text-sm font-black text-emerald-600">{sel}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</span><span className="text-sm font-black text-blue-600">{prog}</span></div>
                                                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terlambat</span><span className="text-sm font-black text-rose-600">{ter}</span></div>
                                            </div>
                                        );
                                    })()}
                                    
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

                    const costBangunan = Number(rab?.cost_bangunan || costTerbangun);
                    const luasBangunan = Number(rab?.luas_terbangun || rab?.luas_bangunan || luasTerbangun);
                    const avgBangunan = luasBangunan > 0 ? Math.round(costBangunan / luasBangunan) : 0;
                    
                    const costTerbuka = Number(rab?.cost_terbuka || 0);
                    const luasTerbuka = Number(rab?.luas_area_terbuka || 1);
                    const avgTerbuka = luasTerbuka > 0 && costTerbuka > 0 ? Math.round(costTerbuka / luasTerbuka) : 0;
                    
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
                            </div>
                            
                            <div className="mt-6 flex flex-col gap-4">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terbangun</p>
                                        <p className="text-xs font-semibold text-slate-400">{luasTerbangun} m²</p>
                                    </div>
                                    <p className="text-xl font-black text-emerald-700 text-right">{formatRupiah(Math.round(avg))} <span className="text-[10px] text-slate-400">/m²</span></p>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bangunan</p>
                                        <p className="text-xs font-semibold text-slate-400">{luasBangunan} m²</p>
                                    </div>
                                    <p className="text-xl font-black text-blue-600 text-right">{formatRupiah(avgBangunan)} <span className="text-[10px] text-slate-400">/m²</span></p>
                                </div>
                                
                                {costTerbuka > 0 && (
                                    <div className="flex justify-between items-end pb-1">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Area Terbuka</p>
                                            <p className="text-xs font-semibold text-slate-400">{luasTerbuka} m²</p>
                                        </div>
                                        <p className="text-xl font-black text-purple-600 text-right">{formatRupiah(avgTerbuka)} <span className="text-[10px] text-slate-400">/m²</span></p>
                                    </div>
                                )}
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
        const nodes: any[] = [];
        
        const idToko = selectedProject?.toko?.id_toko;
        const relatedProjects = (projects && idToko) ? projects.filter(p => p.toko?.id_toko === idToko) : [selectedProject];

        let tsArray: any[] = [];

        relatedProjects.forEach((proj: any) => {
            if (!proj) return;
            const scope = proj.toko?.lingkup_pekerjaan || '';
            const suffix = scope ? ` (${scope})` : '';

            // Project Planning
            if (proj.project_planning) {
                const pp = Array.isArray(proj.project_planning) ? proj.project_planning[0] : proj.project_planning;
                if (pp) nodes.push({ type: 'Project Planning', title: `Project Planning${suffix}`, desc: 'Selesai', icon: <FileText className="w-5 h-5"/>, color: 'blue', data: pp, scope });
            }
            
            // Penawaran
            if (proj.rab?.length > 0) {
                nodes.push({ type: 'PENAWARAN', title: `Penawaran RAB${suffix}`, desc: formatRupiah(proj.rab[0].grand_total_final), icon: <FileText className="w-5 h-5"/>, color: 'indigo', data: proj.rab[0], scope });
            }
            
            // SPK
            if (proj.spk?.length > 0) {
                nodes.push({ type: 'SPK', title: `Surat Perintah Kerja${suffix}`, desc: formatRupiah(proj.spk[0].grand_total), icon: <HardHat className="w-5 h-5"/>, color: 'blue', data: proj.spk[0], scope });
                
                // Collect Tambah SPK
                const spkTs = proj.spk[0].pertambahan_spk;
                if (spkTs && spkTs.length > 0) {
                    tsArray = [...tsArray, ...spkTs];
                }
            }

            // Instruksi Lapangan
            if (proj.instruksi_lapangan?.length > 0) {
                proj.instruksi_lapangan.forEach((il: any, idx: number) => {
                    nodes.push({ type: 'IL', title: `Instruksi Lapangan ${idx + 1}${suffix}`, desc: formatRupiah(il.grand_total), icon: <Activity className="w-5 h-5"/>, color: 'orange', data: il, scope });
                });
            }
            
            // Pengawasan
            let hasPengawasan = false;
            let pengawasanSelesai = 0, pengawasanTerlambat = 0, pengawasanProgress = 0;
            
            proj.gantt?.forEach((g: any) => {
                if (g.pengawasan && g.pengawasan.length > 0) {
                    hasPengawasan = true;
                    const isSelesai = g.pengawasan.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                    const isTerlambat = g.pengawasan.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));
                    if (isSelesai) pengawasanSelesai++;
                    else if (isTerlambat) pengawasanTerlambat++;
                    else pengawasanProgress++;
                }
            });

            if (hasPengawasan) {
                const isSelesai = pengawasanProgress === 0 && pengawasanTerlambat === 0;
                const statusDesc = isSelesai ? 'SELESAI' : pengawasanTerlambat > 0 ? 'TERLAMBAT' : 'PROGRESS';
                nodes.push({ 
                    type: 'PENGAWASAN', 
                    title: `Dokumen Pengawasan${suffix}`, 
                    desc: statusDesc, 
                    icon: <Search className="w-5 h-5"/>, 
                    color: 'purple', 
                    data: {
                        isPengawasanRoot: true,
                        ganttData: proj.gantt,
                        projectData: proj
                    }, 
                    scope 
                });
            }
            
            // Opname
            const allOpnames = proj.opname_final || [];
            const opnameParsial = allOpnames.filter((o: any) => o.tipe_opname === 'OPNAME');
            const opnameFinal = allOpnames.filter((o: any) => o.tipe_opname !== 'OPNAME');
            
            if (opnameParsial.length > 0) {
                opnameParsial.forEach((op: any, idx: number) => {
                    nodes.push({ type: 'Opname Parsial', title: (opnameParsial.length > 1 ? `Opname Parsial ${idx + 1}` : 'Opname Parsial') + suffix, desc: formatRupiah(op.grand_total_opname || op.nilai_opname || 0), icon: <Activity className="w-5 h-5"/>, color: 'sky', data: op, scope });
                });
            }

            if (opnameFinal.length > 0) {
                const opname = opnameFinal[0];
                const rab = proj.rab?.[0];
                const grandFinal = Number(opname.grand_total_final || opname.grand_total_opname || opname.nilai_opname || 0);
                const grandRab = Number(rab?.grand_total_final || 0);
                const opnameStatus = grandFinal > grandRab ? 'Kerja Tambah' : (grandFinal < grandRab ? 'Kerja Kurang' : 'Sesuai');
                nodes.push({ type: 'Opname Final', title: `Opname Final${suffix}`, desc: `${formatRupiah(grandFinal)} (${opnameStatus})`, icon: <CheckCircle2 className="w-5 h-5"/>, color: 'teal', data: opname, scope });
            }
            
            // KTK
            if (proj.ktk?.length > 0) {
                nodes.push({ type: 'KTK', title: `Kerja Tambah Kurang${suffix}`, desc: 'Perubahan', icon: <Layers className="w-5 h-5"/>, color: 'rose', data: proj.ktk[0], scope });
            }

            // Serah Terima
            if (proj.berkas_serah_terima?.length > 0) {
                nodes.push({ type: 'ST', title: `Serah Terima Selesai${suffix}`, desc: 'DONE', icon: <FileCheck className="w-5 h-5"/>, color: 'emerald', data: proj.berkas_serah_terima[0], scope });
            }

            // Dok Bangunan Toko Baru
            if (proj.dokumentasi_bangunan_toko_baru) {
                const dok = Array.isArray(proj.dokumentasi_bangunan_toko_baru) ? proj.dokumentasi_bangunan_toko_baru[0] : proj.dokumentasi_bangunan_toko_baru;
                if (dok) nodes.push({ type: 'Dok. Bangunan', title: `Dok. Bangunan${suffix}`, desc: 'Foto & Berkas', icon: <Layers className="w-5 h-5"/>, color: 'pink', data: dok, scope });
            }
        });

        // Deduplicate Tambah SPK by ID
        tsArray = tsArray.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        if (tsArray.length > 0) {
            const t = tsArray[0]; // 1 per ulok
            nodes.push({ type: 'Tambah SPK', title: 'Tambah SPK', desc: `${t.pertambahan_hari} Hari`, icon: <Clock className="w-5 h-5"/>, color: 'cyan', data: t });
        }

        let displayNodes = nodes;
        if (initialCardType && !['TOTAL_PROJECT', 'SLA', 'COST_M2'].includes(initialCardType)) {
            const allowedTypes: string[] = [];
            if (['PENAWARAN', 'NILAI_PENAWARAN'].includes(initialCardType)) allowedTypes.push('PENAWARAN');
            else if (['SPK', 'SPK_AKTIF'].includes(initialCardType)) allowedTypes.push('SPK');
            else if (['JHK', 'TAMBAH_HARI_SPK'].includes(initialCardType)) allowedTypes.push('Tambah SPK');
            else if (['IL', 'INSTRUKSI_LAPANGAN'].includes(initialCardType)) allowedTypes.push('IL');
            else if (['PENGAWASAN', 'ITEM_PENGAWASAN'].includes(initialCardType)) allowedTypes.push('PENGAWASAN');
            else if (['ST', 'SERAH_TERIMA'].includes(initialCardType)) allowedTypes.push('ST');
            
            if (allowedTypes.length > 0) {
                displayNodes = displayNodes.filter(n => allowedTypes.includes(n.type));
            }
        }

        return (
            <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Left Timeline Sidebar */}
                <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col relative shadow-sm h-fit max-h-full overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Timeline Dokumen Proyek</h3>
                    
                    {displayNodes.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">Belum ada dokumen</div>
                    ) : (
                        <div className="relative flex flex-col gap-8">
                            <div className="absolute left-[24px] top-[10px] bottom-[10px] w-[2px] bg-slate-100 z-0"></div>
                            
                            {displayNodes.map((node, i) => (
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

        const getProxyUrl = (url: string) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
            return `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
        };

        const renderPdfButton = (url: string, label: string) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
            return (
                <Button 
                    key={label}
                    className="bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-xl shrink-0 shadow-sm border border-slate-200 transition-all h-10 px-4 group"
                    onClick={(e) => {
                        e.preventDefault();
                        window.open(getProxyUrl(url), '_blank', 'noopener,noreferrer');
                    }}
                >
                    <FileText className="w-4 h-4 mr-2 text-red-500 group-hover:scale-110 transition-transform" /> {label}
                </Button>
            );
        };

        const renderMainPdfButton = (url: string | null | undefined, documentId?: number, pdfType?: string, label: string = 'Lihat / Unduh Dokumen') => {
            if (!url && (!documentId || !pdfType)) return null;
            return (
                <Button 
                    className="bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl shrink-0 shadow-md shadow-red-500/20 hover:scale-105 transition-all h-11 px-6"
                    onClick={async () => {
                        try {
                            if (pdfType && documentId) {
                                await viewGeneratedPdfOnline(documentId, pdfType as any);
                            } else if (url) {
                                window.open(getProxyUrl(url), '_blank', 'noopener,noreferrer');
                            }
                        } catch (err) {
                            if (url) {
                                window.open(getProxyUrl(url), '_blank', 'noopener,noreferrer');
                            } else {
                                alert('Gagal memuat atau menghasilkan dokumen PDF.');
                            }
                        }
                    }}
                >
                    <Download className="w-4 h-4 mr-2" /> {label}
                </Button>
            );
        };

        if (type === 'PENAWARAN') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'pemberi_persetujuan', 'waktu_persetujuan', 'file_asuransi'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            const wPersetujuan = data.waktu_persetujuan ? String(data.waktu_persetujuan).replace(/\.\d+\+.*$/, '') : '';
            const mergedPersetujuan = (data.pemberi_persetujuan || wPersetujuan) ? `${data.pemberi_persetujuan || '-'} / ${wPersetujuan}` : null;

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen RAB Tersedia</h4>
                            <div className="flex flex-wrap gap-3">
                                {renderMainPdfButton(data.link_pdf_gabungan, data.id, 'RAB_GABUNGAN', 'PDF Gabungan')}
                                {renderMainPdfButton(data.link_pdf_non_sbo, data.id, 'RAB_NONSBO', 'PDF Non-SBO')}
                                {renderMainPdfButton(data.link_pdf_rekapitulasi, data.id, 'RAB_REKAPITULASI', 'PDF Rekapitulasi')}
                                {renderMainPdfButton(data.link_pdf_sph, data.id, 'RAB_SPH', 'PDF SPH')}
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
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi'));
                                        
                                        let displayVal = isCurrency ? fR(data[k]) : valStr;
                                        
                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr);
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
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen SPK</h4>
                                </div>
                                {renderMainPdfButton(data.link_pdf, data.id, 'SPK')}
                            </div>
                        </div>
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
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{wPersetujuan ? formatDateIndo(wPersetujuan) : '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi'));
                                        
                                        let displayVal = isCurrency ? fR(data[k]) : valStr;
                                        
                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr);
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
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen Tambah SPK</h4>
                            </div>
                            {renderMainPdfButton(pdfUrl)}
                        </div>
                    </div>
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
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi'));
                                        
                                        let displayVal = isCurrency ? fR(data[k]) : valStr;
                                        
                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr);
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
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_lampiran', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'link_lampiran_pendukung'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            
            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">Instruksi Lapangan</h4>
                            <div className="flex flex-wrap gap-3">
                                {renderMainPdfButton(data.link_pdf, data.id, 'INSTRUKSI_LAPANGAN', 'PDF Instruksi Lapangan')}
                                {renderPdfButton(data.link_lampiran, 'Lampiran')}
                                {renderPdfButton(data.link_lampiran_pendukung, 'Lampiran Pendukung')}
                                {(!data.link_pdf && !data.link_lampiran && !data.link_lampiran_pendukung) && (
                                    <span className="text-sm text-slate-400 italic">Tidak ada dokumen lampiran</span>
                                )}
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
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi'));
                                        
                                        let displayVal = isCurrency ? fR(data[k]) : valStr;
                                        
                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr);
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
            const ganttData = data.ganttData || [];
            const projectData = data.projectData || {};
            
            // Group pengawasan items by date
            const grouped = ganttData.reduce((acc: any, g: any) => {
                if (g.pengawasan && Array.isArray(g.pengawasan)) {
                    g.pengawasan.forEach((curr: any) => {
                        curr.id_gantt = curr.id_gantt || g.id;
                        let dateKey = curr.tanggal_pengawasan || curr.created_at || 'unknown_date';
                        if (typeof dateKey === 'string') {
                            if (dateKey.includes('T')) dateKey = dateKey.split('T')[0];
                            else if (dateKey.includes(' ')) dateKey = dateKey.split(' ')[0];
                        }
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(curr);
                    });
                }
                return acc;
            }, {});

            const dateKeys = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20 relative">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Daftar Dokumen Pengawasan</h4>
                                <p className="text-sm text-slate-500 font-medium">Menampilkan {dateKeys.length} dokumen pengawasan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4">
                            {dateKeys.length > 0 ? dateKeys.map((dateKey: string, idx: number) => {
                                const items = grouped[dateKey];
                                const firstItem = items[0] || {};
                                const isSelesai = items.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                                const isTerlambat = items.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));
                                const statusDesc = isSelesai ? 'SELESAI' : isTerlambat ? 'TERLAMBAT' : 'PROGRESS';
                                const statusColor = isSelesai ? 'bg-emerald-50 text-emerald-700' : isTerlambat ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700';
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedMemoForDrawer({ project: projectData, items, dateKey })}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800">{projectData.nomor_ulok || '-'} <span className="font-normal text-slate-500 mx-2">&middot;</span> {items.length} Item Pekerjaan</h5>
                                                    <p className="text-sm text-slate-500 flex items-center mt-1">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Terakhir {firstItem.tanggal_pengawasan ? formatDateIndo(firstItem.tanggal_pengawasan) : formatDateIndo(dateKey)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-100 pt-4 sm:border-0 sm:pt-0 mt-2 sm:mt-0">
                                            <Badge className={statusColor}>{statusDesc}</Badge>
                                            <div className="flex items-center text-sm font-semibold text-slate-400 group-hover:text-purple-600 transition-colors">
                                                Klik untuk melihat detail <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Tidak ada dokumen pengawasan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'Opname Final' || type === 'Opname Parsial' || type === 'Opname') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_pdf_opname', 'items', 'hari_denda', 'nilai_denda', 'tipe_opname'];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            const docTitle = type === 'Opname Parsial' ? 'Opname Parsial' : 'Opname Final';
            
            // Per requirement: pake grand total final KTK opname bukan grand total opname
            let displayGrandTotal = data.grand_total_final || data.grand_total_ktk || data.grand_total_opname || data.nilai_opname || 0;
            
            let opnameStatus = '';
            if (selectedProject?.rab && selectedProject.rab.length > 0) {
                const rabTotal = selectedProject.rab[0].grand_total_final || 0;
                if (Number(displayGrandTotal) > Number(rabTotal)) opnameStatus = ' (Kerja Tambah)';
                else if (Number(displayGrandTotal) < Number(rabTotal)) opnameStatus = ' (Kerja Kurang)';
                else opnameStatus = ' (Sesuai)';
            }

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{docTitle}</h4>
                            </div>
                            {renderMainPdfButton(data.link_pdf || data.link_pdf_opname, data.id, 'OPNAME')}
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Grand Total {docTitle}</th>
                                        <td className="py-5 px-8 text-sm font-bold text-slate-900 break-words align-top">
                                            <span className="text-base font-bold break-words text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3">{fR(displayGrandTotal)}{opnameStatus}</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Hari Denda</th>
                                        <td className="py-5 px-8 text-base font-bold text-slate-800 align-top">{data.hari_denda || 0} hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-black uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Nilai Denda</th>
                                        <td className="py-5 px-8 text-base font-bold text-rose-600 align-top">{fR(data.nilai_denda || 0)}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        if (k === 'grand_total_opname' || k === 'grand_total_final' || k === 'nilai_opname' || k === 'grand_total_ktk') return null;

                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi'));
                                        
                                        let displayVal = isCurrency ? fR(data[k]) : valStr;
                                        
                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr);
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

        // Fallback for other document types
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
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">Dokumen Tersedia</h4>
                            </div>
                            {renderMainPdfButton(data.link_pdf)}
                        </div>
                    </div>
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
                                                window.open(getProxyUrl(valStr), '_blank', 'noopener,noreferrer');
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

    const renderMemoDrawer = () => {
        if (!selectedMemoForDrawer) return null;

        const { project, items, dateKey } = selectedMemoForDrawer;
        const firstItem = items[0] || {};
        const pdfUrl = firstItem.link_pdf_pengawasan || firstItem.link_pdf || firstItem.berkas_pengawasan?.link_pdf_pengawasan;
        const tgl = firstItem.tanggal_pengawasan || firstItem.created_at || dateKey;
        const idPengawasanGantt = firstItem.id_pengawasan_gantt || firstItem.id;
        const idGantt = firstItem.id_gantt || '-';

        const getProxyUrl = (url: string) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
            return `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
        };

        return (
            <>
                <div 
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[105] transition-opacity animate-in fade-in duration-300"
                    onClick={() => setSelectedMemoForDrawer(null)}
                />
                <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-[110] flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-purple-600" />
                            Detail Pengawasan
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMemoForDrawer(null)} className="rounded-full hover:bg-slate-200 text-slate-500">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="mb-8">
                            <Button 
                                className="w-full bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl shadow-md shadow-red-500/20 hover:scale-[1.02] transition-all h-12"
                                onClick={async () => {
                                    try {
                                        if (pdfUrl) {
                                            window.open(getProxyUrl(pdfUrl), '_blank', 'noopener,noreferrer');
                                        } else if (idPengawasanGantt) {
                                            await viewGeneratedPdfOnline(idPengawasanGantt, 'PENGAWASAN' as any);
                                        }
                                    } catch (err) {
                                        alert('Gagal memuat atau menghasilkan dokumen PDF.');
                                    }
                                }}
                            >
                                <Download className="w-5 h-5 mr-2" /> Lihat / Unduh Dokumen
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor ULOK</p>
                                <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.nomor_ulok || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Toko</p>
                                <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.nama_toko || '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cabang</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.cabang || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Proyek</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.proyek || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Dibuat</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.created_at ? formatDateIndo(project.created_at) : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Pengawasan</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{tgl ? formatDateIndo(tgl) : '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ID Gantt</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{idGantt}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ID Pengawasan Gantt</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{idPengawasanGantt || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
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
                    {view === 'detail' && (
                        <div className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {renderDocumentDetail()}
                        </div>
                    )}
                    {renderMemoDrawer()}
                </div>
            </div>
        </div>,
        document.body
    );
};
