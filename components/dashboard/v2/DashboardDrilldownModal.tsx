import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Download, FileText, Activity, HardHat, FileCheck, Search, ChevronLeft, ChevronRight, Layers, Clock, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';
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

const formatStatusLabel = (status: string) => {
    if (!status || status === '-') return '-';

    const upper = String(status).toUpperCase().trim();

    if (upper === 'WAITING_FOR_BM_APPROVAL') return 'Menunggu Persetujuan BM';
    if (upper === 'SPK_APPROVED') return 'SPK Disetujui';
    if (upper === 'MENUNGGU PERSETUJUAN KOORDINATOR') return 'Menunggu Persetujuan Koord.';
    if (upper === 'MENUNGGU PERSETUJUAN MANAJER') return 'Menunggu Persetujuan Manajer';
    if (upper === 'DITOLAK OLEH KOORDINATOR') return 'Ditolak Koordinator';
    if (upper === 'PENDING') return 'Menunggu Persetujuan';
    if (upper === 'APPROVED') return 'Disetujui';
    if (upper === 'REJECTED' || upper === 'REJECT') return 'Ditolak';

    return String(status)
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

type DrilldownView = 'stage_summary' | 'list_ulok' | 'timeline' | 'detail' | 'cost_m2' | 'jhk_pekerjaan_list' | 'keterlambatan_list' | 'lingkup_selection' | 'il_list_view' | 'surat_peringatan_list';

interface DashboardDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCardType: string | null;
    projects: any[];
    allProjects?: any[];
    searchQuery?: string;
    stats?: any;
    extraStats?: any;
    extraData?: any;
}

export const DashboardDrilldownModal: React.FC<DashboardDrilldownModalProps> = ({
    isOpen,
    onClose,
    initialCardType,
    projects,
    allProjects,
    searchQuery,
    stats,
    extraStats,
    extraData
}) => {
    const [view, setView] = useState<DrilldownView>('list_ulok');
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: any } | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [selectedMemoForDrawer, setSelectedMemoForDrawer] = useState<any | null>(null);
    const [selectedILForDrawer, setSelectedILForDrawer] = useState<any | null>(null);
    const [selectedGroupedUlok, setSelectedGroupedUlok] = useState<string | null>(null);
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
            setSelectedILForDrawer(null);

            if (searchQuery && searchQuery.length > 5 && projects.length === 1) {
                // Exact search -> Tahap 3 (Timeline)
                setSelectedProject(projects[0]);
                setView('timeline');
            } else if (initialCardType === 'TOTAL_PROJECT' || initialCardType === 'SLA') {
                setView('stage_summary');
            } else if (initialCardType === 'COST_M2') {
                setView('cost_m2');
            } else if (initialCardType === 'JHK_PEKERJAAN') {
                setView('jhk_pekerjaan_list');
            } else if (initialCardType === 'KETERLAMBATAN') {
                setView('keterlambatan_list');
            } else if (initialCardType === 'SURAT_PERINGATAN_LIST') {
                setView('surat_peringatan_list');
            } else {
                setView('list_ulok');
            }
        }
    }, [isOpen, initialCardType, searchQuery, projects]);

    const directToTahap4Types = ['PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'IL', 'INSTRUKSI_LAPANGAN', 'PENGAWASAN', 'ITEM_PENGAWASAN', 'JHK', 'TAMBAH_HARI_SPK', 'ST', 'SERAH_TERIMA'];

    // --- DATA FILTERING ---
    const displayProjects = useMemo(() => {
        let filtered = projects;

        // 1. Filter by initial card type
        if (initialCardType === 'DENDA' || initialCardType === 'TOTAL_DENDA') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.opname_final?.some((o: any) => Number(o.hari_denda) > 0 || Number(o.nilai_denda) > 0);

                return projects.some(proj =>
                    proj.toko?.nomor_ulok === ulok &&
                    proj.opname_final?.some((o: any) => Number(o.hari_denda) > 0 || Number(o.nilai_denda) > 0)
                );
            });
        } else if (initialCardType === 'PENAWARAN' || initialCardType === 'NILAI_PENAWARAN') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.rab && p.rab.length > 0;
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj.rab && proj.rab.length > 0);
            });
        } else if (initialCardType === 'SPK' || initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                const checkSpk = (proj: any) => {
                    if (!proj.spk || proj.spk.length === 0) return false;
                    if (initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') {
                        return proj.spk[0]?.pertambahan_spk && proj.spk[0].pertambahan_spk.length > 0;
                    }
                    return true;
                };
                if (!ulok) return checkSpk(p);
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && checkSpk(proj));
            });
        } else if (initialCardType === 'SPK_AKTIF') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                const checkSpkAktif = (proj: any) => {
                    const spkArray = Array.isArray(proj.spk) ? proj.spk : (proj.spk ? [proj.spk] : []);
                    return spkArray.some((s: any) => ['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes((s.status || '').toUpperCase()));
                };
                if (!ulok) return checkSpkAktif(p);
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && checkSpkAktif(proj));
            });
        } else if (initialCardType === 'IL' || initialCardType === 'INSTRUKSI_LAPANGAN') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.instruksi_lapangan && p.instruksi_lapangan.length > 0;
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj.instruksi_lapangan && proj.instruksi_lapangan.length > 0);
            });
        } else if (initialCardType === 'PENGAWASAN' || initialCardType === 'ITEM_PENGAWASAN') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.gantt && p.gantt.some((g: any) => g.pengawasan && g.pengawasan.length > 0);
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj.gantt && proj.gantt.some((g: any) => g.pengawasan && g.pengawasan.length > 0));
            });
        } else if (initialCardType === 'KERJA_TAMBAH_KURANG') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.ktk && p.ktk.length > 0;
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj.ktk && proj.ktk.length > 0);
            });
        } else if (initialCardType === 'SERAH_TERIMA' || initialCardType === 'ST') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.berkas_serah_terima && p.berkas_serah_terima.length > 0;
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj.berkas_serah_terima && proj.berkas_serah_terima.length > 0);
            });
        } else if (initialCardType === 'JHK_PEKERJAAN') {
            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p.berkas_serah_terima && p.berkas_serah_terima.length > 0;

                return projects.some(proj =>
                    proj.toko?.nomor_ulok === ulok &&
                    proj.berkas_serah_terima && proj.berkas_serah_terima.length > 0
                );
            });
        } else if (initialCardType === 'KETERLAMBATAN') {
            const now = new Date();

            filtered.forEach(p => {
                p._is_late = false;
                if (p.berkas_serah_terima && p.berkas_serah_terima.length > 0) return;
                if (!p.spk || p.spk.length === 0) return;
                const spk = p.spk[0];
                const status = (spk.status || '').toUpperCase();
                if (!['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes(status)) return;

                const spkDateStr = spk.created_at || spk.waktu_persetujuan;
                if (!spkDateStr) return;

                const spkDate = new Date(spkDateStr);
                if (isNaN(spkDate.getTime())) return;

                const durasi = Number(spk.durasi) || 0;
                const tsArray = spk.pertambahan_spk || [];
                const tsDays = tsArray.reduce((acc: number, curr: any) => acc + (Number(curr.pertambahan_hari) || 0), 0);

                const targetDate = new Date(spkDate);
                targetDate.setDate(targetDate.getDate() + durasi + tsDays);

                if (now > targetDate) {
                    p._is_late = true;
                    p._keterlambatan_days = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));
                    p._keterlambatan_target_date = targetDate;
                }
            });

            filtered = filtered.filter(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) return p._is_late;
                return projects.some(proj => proj.toko?.nomor_ulok === ulok && proj._is_late);
            });
        } else if (initialCardType === 'SLA') {
            const att = stats?.tokoPerhatian || [];
            filtered = filtered.filter(p => att.includes(p.toko?.id));
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
        // 4. GROUP BY ULOK (Global)
        const isStageSummary = !selectedStage && (initialCardType === 'TOTAL_PROJECT' || initialCardType === 'SLA');
        if (!isStageSummary) {
            const grouped = new Map();
            filtered.forEach(p => {
                const ulok = p.toko?.nomor_ulok;
                if (!ulok) {
                    grouped.set(p.toko?.id || Math.random(), { ...p, _jhk_lingkup_gabungan: p._jhk_lingkup_gabungan || (p.toko?.lingkup_pekerjaan ? [p.toko.lingkup_pekerjaan] : []), _all_projects_for_ulok: [p] });
                    return;
                }
                if (!grouped.has(ulok)) {
                    grouped.set(ulok, { ...p, _jhk_lingkup_gabungan: p._jhk_lingkup_gabungan || (p.toko?.lingkup_pekerjaan ? [p.toko.lingkup_pekerjaan] : []), _all_projects_for_ulok: [p] });
                } else {
                    const existing = grouped.get(ulok);
                    existing._all_projects_for_ulok.push(p);
                    if (p.toko?.lingkup_pekerjaan && !existing._jhk_lingkup_gabungan.includes(p.toko.lingkup_pekerjaan)) {
                        existing._jhk_lingkup_gabungan.push(p.toko.lingkup_pekerjaan);
                        existing._jhk_lingkup_gabungan.sort((a: string, b: string) => a === 'SIPIL' ? -1 : 1);
                    }
                    // Keep the one with highest penalty for global lists (so ME gets SIPIL penalty if SIPIL is late)
                    const currDenda = Number(existing.opname_final?.[0]?.hari_denda || 0);
                    const newDenda = Number(p.opname_final?.[0]?.hari_denda || 0);
                    if (newDenda > currDenda && p.opname_final) {
                        existing.opname_final = p.opname_final;
                    }
                    // Keep the one with highest Keterlambatan
                    const currLate = existing._keterlambatan_days || 0;
                    const newLate = p._keterlambatan_days || 0;
                    if (newLate > currLate) {
                        existing._keterlambatan_days = newLate;
                        existing._keterlambatan_target_date = p._keterlambatan_target_date;
                    }
                }
            });
            filtered = Array.from(grouped.values());
        }

        if (initialCardType === 'KETERLAMBATAN') {
            filtered.sort((a, b) => (b._keterlambatan_days || 0) - (a._keterlambatan_days || 0));
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
                                <span className="text-4xl font-bold text-slate-100 group-hover:text-slate-200 transition-colors tracking-tighter">{String(idx + 1).padStart(2, '0')}</span>
                            </div>

                            <div className="relative z-10 flex flex-col flex-grow">
                                <h3 className="font-bold text-slate-800 text-xl mb-2 group-hover:text-slate-950 tracking-tight">{stage.label}</h3>
                                <p className="text-sm text-slate-500 font-semibold mb-6 flex-grow">{stage.desc}</p>

                                <div className="flex items-end justify-between pt-5 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Proyek</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-bold text-slate-800 tracking-tighter">{count}</p>
                                            <span className="text-xs font-semibold text-slate-400">Toko</span>
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

    const handleProjectClick = (project: any, skipLingkupCheck = false) => {
        const isJhkOrTambahHari = initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK';
        if (!skipLingkupCheck && !isJhkOrTambahHari && (view === 'list_ulok' || view === 'jhk_pekerjaan_list' || view === 'keterlambatan_list' || view === 'cost_m2')) {
            const scopes = project._jhk_lingkup_gabungan || [];
            if (scopes.length > 1) {
                setSelectedGroupedUlok(project.toko?.nomor_ulok);
                setView('lingkup_selection');
                return;
            }
        }

        setSelectedProject(project);

        if (initialCardType && directToTahap4Types.includes(initialCardType)) {
            let docType = 'PENAWARAN';
            let docData = project.rab?.[0];

            if (['SPK', 'SPK_AKTIF'].includes(initialCardType)) {
                docType = 'SPK';
                docData = project.spk?.[0];
            } else if (['JHK', 'TAMBAH_HARI_SPK'].includes(initialCardType)) {
                docType = 'Tambah SPK';
                let ptSpk = project.spk?.[0]?.pertambahan_spk?.[0];
                if (!ptSpk) {
                    const projectListToSearch = allProjects || projects;
                    const counterpart = projectListToSearch.find((p: any) => {
                        if (p.toko?.nomor_ulok !== project.toko?.nomor_ulok) return false;
                        const pSpk = Array.isArray(p.spk) ? p.spk : (p.spk ? [p.spk] : []);
                        if (pSpk.length === 0) return false;
                        const pPt = Array.isArray(pSpk[0].pertambahan_spk) ? pSpk[0].pertambahan_spk : (pSpk[0].pertambahan_spk ? [pSpk[0].pertambahan_spk] : []);
                        return pPt.length > 0;
                    });
                    if (counterpart) {
                        const pSpk = Array.isArray(counterpart.spk) ? counterpart.spk : [counterpart.spk];
                        const pPt = Array.isArray(pSpk[0]?.pertambahan_spk) ? pSpk[0].pertambahan_spk : (pSpk[0]?.pertambahan_spk ? [pSpk[0].pertambahan_spk] : []);
                        ptSpk = pPt[0];
                    }
                }
                docData = ptSpk;
            } else if (['IL', 'INSTRUKSI_LAPANGAN'].includes(initialCardType)) {
                setView('il_list_view');
                return;
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
            } else if (docType === 'IL_ROOT') {
                docType = 'IL';
                docData = { isILRoot: true, projectData: project };
            }

            setSelectedDocument({ type: docType, data: docData });
            setView('detail');
        } else {
            setSelectedDocument(null);
            setView('timeline');
        }
    };

    const handleBack = () => {
        if (view === 'timeline' || view === 'detail' || view === 'il_list_view') {
            if (selectedGroupedUlok) {
                setView('lingkup_selection');
                setSelectedDocument(null);
                return;
            }
            if (initialCardType === 'COST_M2') {
                setView('cost_m2');
            } else if (initialCardType === 'JHK_PEKERJAAN') {
                setView('jhk_pekerjaan_list');
            } else if (initialCardType === 'KETERLAMBATAN') {
                setView('keterlambatan_list');
            } else {
                setView('list_ulok');
            }
            setSelectedDocument(null);
        } else if (view === 'lingkup_selection') {
            if (initialCardType === 'JHK_PEKERJAAN') {
                setView('jhk_pekerjaan_list');
            } else if (initialCardType === 'KETERLAMBATAN') {
                setView('keterlambatan_list');
            } else {
                setView('list_ulok');
            }
            setSelectedGroupedUlok(null);
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
            else if (initialCardType === 'PENGAWASAN') title = 'Daftar Dokumen Pengawasan';
        }

        return (
            <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-200 bg-white/95 backdrop-blur-sm text-slate-800 sticky top-0 z-20">
                <div className="flex items-center gap-4 md:gap-5">
                    {(view !== 'stage_summary' && view !== 'cost_m2' && view !== 'jhk_pekerjaan_list' && view !== 'keterlambatan_list' && !(view === 'list_ulok' && !['TOTAL_PROJECT', 'SLA'].includes(initialCardType || ''))) && (
                        <button onClick={handleBack} className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-colors border border-slate-200 shadow-sm group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-2 h-7 bg-red-600 rounded-full shadow-sm shadow-red-500/20"></div>
                            {title}
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1 pl-5">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Bar for lists */}
                    {(view === 'list_ulok' || view === 'cost_m2' || view === 'jhk_pekerjaan_list' || view === 'keterlambatan_list') && (
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
                    <p className="text-slate-500 font-semibold">Tidak ada data yang sesuai.</p>
                </div>
            ) : (
                <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="hidden md:flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 md:px-6 py-4">
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Toko / ULOK</span>
                        </div>
                        <div className="flex items-stretch ml-4 mr-[60px]">
                            {initialCardType !== 'DENDA' && (
                                <>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[160px] lg:w-[170px] text-right shrink-0 items-end">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tahap Proyek</span>
                                    </div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[150px] md:w-[180px] lg:w-[210px] text-right shrink-0 items-end">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Approval</span>
                                    </div>
                                </>
                            )}
                            {initialCardType === 'DENDA' && (
                                <>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[100px] md:w-[120px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terlambat</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target ST</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tgl ST</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[150px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nilai Denda</span></div>
                                </>
                            )}
                            {initialCardType === 'JHK' && (
                                <>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[140px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Akhir SPK</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[140px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Akhir SPK Baru</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[100px] md:w-[120px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tambah Hari</span></div>
                                </>
                            )}
                            {initialCardType === 'SLA' && (
                                <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terlambat</span></div>
                            )}
                            {initialCardType === 'IL' && (
                                <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[160px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nilai IL</span></div>
                            )}
                            {(!initialCardType || ['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'KERJA_TAMBAH_KURANG', 'SERAH_TERIMA', 'ST'].includes(initialCardType)) && (
                                <div className="flex flex-col justify-center px-4 md:px-5 w-[150px] md:w-[180px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nilai {(initialCardType === 'PENAWARAN' || initialCardType === 'TOTAL_PROJECT') ? 'RAB/SPK' : 'SPK'}</span></div>
                            )}
                            {initialCardType === 'PENGAWASAN' && (
                                <>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selesai</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Progress</span></div>
                                    <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terlambat</span></div>
                                </>
                            )}
                        </div>
                    </div>
                    {paginatedProjects.map((project, idx) => {
                        const statusTerkini = getProjectStage(project);
                        const nilaiSPK = formatRupiah(project.spk?.[0]?.grand_total || 0);
                        const nilaiRAB = formatRupiah(project.rab?.[0]?.grand_total_final || 0);
                        const denda = formatRupiah(project.opname_final?.[0]?.nilai_denda || 0);

                        let tambahHari = 0;
                        project.spk?.forEach((s:any) => s.pertambahan_spk?.forEach((pt:any) => { if(['APPROVED', 'DISETUJUI', 'DISETUJUI BM'].includes(String(pt.status_persetujuan || '').toUpperCase())) tambahHari += Number(pt.pertambahan_hari || 0); }));

                        const il = project.instruksi_lapangan?.[0];
                        const statusIL = il?.status || 'ONGOING';

                        let rawNilaiIL = 0;
                        if (project._all_projects_for_ulok) {
                            project._all_projects_for_ulok.forEach((p: any) => {
                                if (p.instruksi_lapangan) p.instruksi_lapangan.forEach((ilItem: any) => rawNilaiIL += Number(ilItem.grand_total || 0));
                            });
                        } else {
                            if (project.instruksi_lapangan) project.instruksi_lapangan.forEach((ilItem: any) => rawNilaiIL += Number(ilItem.grand_total || 0));
                        }
                        const nilaiIL = formatRupiah(rawNilaiIL);

                        let statusApprovalLabel = '-';
                        if (initialCardType === 'JHK') {
                            const spk = project.spk?.[0];
                            let latestPt = null;
                            if (spk?.pertambahan_spk && spk.pertambahan_spk.length > 0) {
                                const sorted = [...spk.pertambahan_spk].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                latestPt = sorted[0];
                            }
                            statusApprovalLabel = latestPt?.status_persetujuan || 'PENDING';
                        } else if (initialCardType === 'IL') {
                            statusApprovalLabel = statusIL;
                        } else if (initialCardType === 'PENAWARAN' || statusTerkini === 'Approval RAB' || statusTerkini === 'Proses Gantt') {
                            statusApprovalLabel = project.rab?.[0]?.status || 'Menunggu Persetujuan';
                        } else if (statusTerkini === 'Approval SPK' || statusTerkini === 'Ongoing') {
                            statusApprovalLabel = project.spk?.[0]?.status || 'Menunggu Persetujuan';
                        } else if (statusTerkini === 'Kerja Tambah Kurang' || statusTerkini === 'Done') {
                            statusApprovalLabel = project.opname_final?.[0]?.status_opname_final || 'Menunggu Persetujuan';
                        } else {
                            statusApprovalLabel = project.spk?.[0]?.status || project.rab?.[0]?.status || '-';
                        }

                        let approvalBadgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
                        const upperStatus = String(statusApprovalLabel).toUpperCase();
                        if (['APPROVED', 'DISETUJUI', 'DISETUJUI BM', 'SELESAI', 'CLOSED', 'DONE', 'SPK_APPROVED'].includes(upperStatus)) {
                            approvalBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        } else if (['REJECTED', 'REJECT', 'DITOLAK'].includes(upperStatus)) {
                            approvalBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                        } else if (upperStatus !== '-') {
                            approvalBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        }

                        statusApprovalLabel = formatStatusLabel(statusApprovalLabel);

                        return (
                            <div
                                key={idx}
                                className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden"
                                onClick={() => handleProjectClick(project)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-red-500 transition-colors"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-red-700 truncate">{project.toko?.nama_toko || 'Unknown'}</h4>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 text-[10px] tracking-widest font-semibold">{project.toko?.nomor_ulok || 'Unknown'}</Badge>
                                            {(initialCardType !== 'JHK' && initialCardType !== 'TAMBAH_HARI_SPK') && (
                                                project._jhk_lingkup_gabungan && project._jhk_lingkup_gabungan.length > 0 ? (
                                                    <Badge className={`border-none px-2 py-0.5 text-[10px] font-semibold tracking-widest shadow-sm ${(project._jhk_lingkup_gabungan || []).length > 1 ? 'bg-indigo-50 text-indigo-700' : String(project._jhk_lingkup_gabungan[0]).toUpperCase() === 'ME' ? 'bg-cyan-50 text-cyan-700' : 'bg-orange-50 text-orange-700'}`}>
                                                        {project._jhk_lingkup_gabungan.join(' & ')}
                                                    </Badge>
                                                ) : project.toko?.lingkup_pekerjaan ? (
                                                    <Badge className={`border-none px-2 py-0.5 text-[10px] font-semibold tracking-widest shadow-sm ${(project._jhk_lingkup_gabungan || []).length > 1 ? 'bg-indigo-50 text-indigo-700' : String(project.toko?.lingkup_pekerjaan).toUpperCase() === 'ME' ? 'bg-cyan-50 text-cyan-700' : 'bg-orange-50 text-orange-700'}`}>
                                                        {project.toko?.lingkup_pekerjaan}
                                                    </Badge>
                                                ) : null
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-400 tracking-wide flex items-center gap-2">
                                        <span>{project.toko?.cabang || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-stretch divide-x divide-slate-100 border-l border-slate-100 ml-4">
                                    {initialCardType !== 'DENDA' && (
                                        <>
                                            <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[160px] lg:w-[170px] text-right shrink-0 items-end hidden sm:flex">
                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Tahap Proyek</span>
                                                <Badge variant="outline" className="mt-0.5 border-indigo-200 shadow-sm bg-indigo-50 text-indigo-700 text-center whitespace-normal h-auto py-1 leading-tight">{statusTerkini}</Badge>
                                            </div>
                                            <div className="flex flex-col justify-center px-4 md:px-5 w-[150px] md:w-[180px] lg:w-[210px] text-right shrink-0 items-end hidden sm:flex">
                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Status Approval</span>
                                                <Badge variant="outline" className={`mt-0.5 shadow-sm text-center whitespace-normal h-auto py-1 leading-tight ${approvalBadgeColor}`}>
                                                    {statusApprovalLabel}
                                                </Badge>
                                            </div>
                                        </>
                                    )}
                                    {initialCardType === 'DENDA' && (() => {
                                        const op = project.opname_final?.[0];
                                        const hDenda = op?.hari_denda || 0;
                                        const allP = project._all_projects_for_ulok || [project];
                                        
                                        // Cari project yang memiliki denda tersebut
                                        const matchingProject = allP.find((p: any) => (p.opname_final?.[0]?.hari_denda || 0) === hDenda);

                                        let st = '-';
                                        let tgt = '-';
                                        if (matchingProject) {
                                            st = matchingProject.berkas_serah_terima?.[0]?.created_at;
                                            tgt = matchingProject.spk?.[0]?.waktu_selesai;
                                        }
                                        
                                        // Jika lingkup yg kena denda blm ST, ambil dari lingkup lain (yg melakukan serah terima)
                                        if (!st) {
                                            const pWithSt = allP.find((p: any) => p.berkas_serah_terima?.[0]?.created_at);
                                            if (pWithSt) st = pWithSt.berkas_serah_terima[0].created_at;
                                        }
                                        if (!tgt) {
                                            const pWithTgt = allP.find((p: any) => p.spk?.[0]?.waktu_selesai);
                                            if (pWithTgt) tgt = pWithTgt.spk[0].waktu_selesai;
                                        }

                                        return (
                                            <>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[100px] md:w-[120px] text-right shrink-0"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Terlambat</span><span className="text-xs md:text-sm font-semibold text-slate-700">{hDenda} Hari</span></div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0 hidden md:flex"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Target ST</span><span className="text-xs md:text-sm font-semibold text-slate-700 leading-tight">{tgt ? formatDateIndo(tgt).replace(/ pukul.*$/, '') : '-'}</span></div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0 hidden md:flex"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Tgl ST</span><span className="text-xs md:text-sm font-semibold text-emerald-600 leading-tight">{st ? formatDateIndo(st).replace(/ pukul.*$/, '') : '-'}</span></div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[150px] text-right shrink-0"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Nilai Denda</span><span className="text-sm md:text-base font-bold text-rose-600">{denda}</span></div>
                                            </>
                                        );
                                    })()}
                                    {(initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') && (() => {
                                        let spk = project.spk?.[0];
                                        let endDate = spk?.waktu_selesai;

                                        // Find latest extension regardless of status
                                        let latestPt = null;
                                        let allPt = spk?.pertambahan_spk || [];

                                        if (allPt.length === 0) {
                                            const projectListToSearch = allProjects || projects;
                                            const counterpart = projectListToSearch.find((p: any) => {
                                                if (p.toko?.nomor_ulok !== project.toko?.nomor_ulok) return false;
                                                const pSpk = Array.isArray(p.spk) ? p.spk : (p.spk ? [p.spk] : []);
                                                if (pSpk.length === 0) return false;
                                                const pPt = Array.isArray(pSpk[0].pertambahan_spk) ? pSpk[0].pertambahan_spk : (pSpk[0].pertambahan_spk ? [pSpk[0].pertambahan_spk] : []);
                                                return pPt.length > 0;
                                            });
                                            if (counterpart) {
                                                const cSpk = Array.isArray(counterpart.spk) ? counterpart.spk[0] : counterpart.spk;
                                                if (!endDate) endDate = cSpk?.waktu_selesai;
                                                allPt = Array.isArray(cSpk?.pertambahan_spk) ? cSpk.pertambahan_spk : (cSpk?.pertambahan_spk ? [cSpk.pertambahan_spk] : []);
                                            }
                                        }

                                        if (allPt.length > 0) {
                                            const sorted = [...allPt].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                            latestPt = sorted[0];
                                        }

                                        const ptAkhir = latestPt?.tanggal_spk_akhir_setelah_perpanjangan;
                                        const tHari = latestPt?.pertambahan_hari;
                                        const statusVal = latestPt?.status_persetujuan || 'PENDING';

                                        let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                                        if (['APPROVED', 'DISETUJUI', 'DISETUJUI BM'].includes(String(statusVal).toUpperCase())) {
                                            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                        } else if (['REJECTED', 'REJECT', 'DITOLAK'].includes(String(statusVal).toUpperCase())) {
                                            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                        }

                                        return (
                                            <>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[140px] text-right shrink-0">
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Akhir SPK</span>
                                                    <span className="text-xs md:text-sm font-semibold text-slate-700 leading-tight">{endDate ? formatDateIndo(endDate).replace(/ pukul.*$/, '') : '-'}</span>
                                                </div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[120px] md:w-[140px] text-right shrink-0 hidden md:flex">
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Akhir SPK Baru</span>
                                                    <span className="text-xs md:text-sm font-semibold text-blue-600 leading-tight">{ptAkhir ? formatDateIndo(ptAkhir).replace(/ pukul.*$/, '') : '-'}</span>
                                                </div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[100px] md:w-[120px] text-right shrink-0">
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Tambah Hari</span>
                                                    <span className="text-sm md:text-base font-bold text-blue-600">{tHari ? `${tHari} Hari` : '-'}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                    {initialCardType === 'SLA' && (
                                        <>
                                            <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[180px] text-right shrink-0">
                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Terlambat</span>
                                                <span className="text-sm md:text-base font-semibold text-rose-600">Melewati SLA {project._lateDays || 0} Hari</span>
                                            </div>
                                        </>
                                    )}
                                    {initialCardType === 'IL' && (
                                        <>
                                            <div className="flex flex-col justify-center px-4 md:px-5 w-[140px] md:w-[160px] text-right shrink-0">
                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Nilai IL</span>
                                                <span className="text-sm md:text-base font-bold text-orange-600">{nilaiIL}</span>
                                            </div>
                                        </>
                                    )}
                                    {(!initialCardType || ['TOTAL_PROJECT', 'SLA', 'PENAWARAN', 'NILAI_PENAWARAN', 'SPK', 'SPK_AKTIF', 'KERJA_TAMBAH_KURANG', 'SERAH_TERIMA', 'ST'].includes(initialCardType)) && (
                                        <>
                                            <div className="flex flex-col justify-center px-4 md:px-5 w-[150px] md:w-[180px] text-right shrink-0">
                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Nilai {(initialCardType === 'PENAWARAN' || (initialCardType !== 'SPK' && initialCardType !== 'SPK_AKTIF' && (statusTerkini === 'Approval RAB' || statusTerkini === 'Proses Gantt' || statusTerkini === 'Proses PJU'))) ? 'RAB' : 'SPK'}</span>
                                                <span className="text-sm md:text-base font-bold text-slate-700">{(initialCardType === 'PENAWARAN' || (initialCardType !== 'SPK' && initialCardType !== 'SPK_AKTIF' && (statusTerkini === 'Approval RAB' || statusTerkini === 'Proses Gantt' || statusTerkini === 'Proses PJU'))) ? nilaiRAB : nilaiSPK}</span>
                                            </div>
                                        </>
                                    )}
                                    {initialCardType === 'PENGAWASAN' && (() => {
                                        let sel = 0, prog = 0, ter = 0;
                                        const grouped = (project.gantt || []).reduce((acc: any, g: any) => {
                                            if (g.pengawasan && Array.isArray(g.pengawasan)) {
                                                g.pengawasan.forEach((pw: any) => {
                                                    let dateKey = pw.tanggal_pengawasan || pw.created_at || 'unknown';
                                                    if (typeof dateKey === 'string') {
                                                        if (dateKey.includes('T')) dateKey = dateKey.split('T')[0];
                                                        else if (dateKey.includes(' ')) dateKey = dateKey.split(' ')[0];
                                                    }
                                                    if (!acc[dateKey]) acc[dateKey] = [];
                                                    acc[dateKey].push(pw);
                                                });
                                            }
                                            return acc;
                                        }, {});

                                        Object.values(grouped).forEach((groupItems: any) => {
                                            const isSelesai = groupItems.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                                            const isTerlambat = groupItems.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));

                                            if (isSelesai) sel++;
                                            else if (isTerlambat) ter++;
                                            else prog++;
                                        });
                                        return (
                                            <>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Selesai</span><span className="text-xs md:text-sm font-semibold text-emerald-600">{sel}</span></div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Progress</span><span className="text-xs md:text-sm font-semibold text-blue-600">{prog}</span></div>
                                                <div className="flex flex-col justify-center px-4 md:px-5 w-[90px] md:w-[110px] text-right shrink-0"><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:hidden">Terlambat</span><span className="text-xs md:text-sm font-semibold text-rose-600">{ter}</span></div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="pl-4 md:pl-5 flex items-center justify-center">
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
                        Halaman <span className="text-slate-900 font-bold">{currentPage}</span> dari <span className="text-slate-900 font-bold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-semibold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-semibold">
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
                    const projectsForUlok = p._all_projects_for_ulok || [p];
                    const isGabungan = projectsForUlok.length > 1;

                    let sumAvgTerbangun = 0;
                    let sumAvgBangunan = 0;
                    let sumAvgTerbuka = 0;

                    let countTerbangun = 0;
                    let countBangunan = 0;
                    let countTerbuka = 0;

                    let refLuasTerbangun = 0;
                    let refLuasBangunan = 0;
                    let refLuasTerbuka = 0;

                    projectsForUlok.forEach((proj: any) => {
                        const rab = proj.rab?.[0];
                        const luasTerbangun = Number(rab?.luas_terbangun || 1);
                        const costTerbangun = Number(rab?.grand_total_final || 0);
                        if (costTerbangun > 0) {
                            sumAvgTerbangun += (costTerbangun / luasTerbangun);
                            countTerbangun++;
                            if (luasTerbangun > refLuasTerbangun) refLuasTerbangun = luasTerbangun;
                        }

                        const costBangunan = Number(rab?.cost_bangunan || costTerbangun);
                        const luasBangunan = Number(rab?.luas_terbangun || rab?.luas_bangunan || luasTerbangun);
                        if (costBangunan > 0) {
                            sumAvgBangunan += (costBangunan / luasBangunan);
                            countBangunan++;
                            if (luasBangunan > refLuasBangunan) refLuasBangunan = luasBangunan;
                        }

                        const costTerbuka = Number(rab?.cost_terbuka || 0);
                        const luasTerbuka = Number(rab?.luas_area_terbuka || 1);
                        if (costTerbuka > 0) {
                            sumAvgTerbuka += (costTerbuka / luasTerbuka);
                            countTerbuka++;
                            if (luasTerbuka > refLuasTerbuka) refLuasTerbuka = luasTerbuka;
                        }
                    });

                    // "di jumlah bagi 2 kalau ada sipil + me kalau nggak ya data itu sendiri"
                    const avg = isGabungan ? (sumAvgTerbangun / 2) : (countTerbangun > 0 ? sumAvgTerbangun : 0);
                    const avgBangunan = isGabungan ? (sumAvgBangunan / 2) : (countBangunan > 0 ? sumAvgBangunan : 0);
                    const avgTerbuka = isGabungan ? (sumAvgTerbuka / 2) : (countTerbuka > 0 ? sumAvgTerbuka : 0);

                    const luasTerbangun = refLuasTerbangun || 1;
                    const luasBangunan = refLuasBangunan || 1;
                    const luasTerbuka = refLuasTerbuka || 1;
                    const costTerbukaExists = countTerbuka > 0;

                    const lingkupArray = p._jhk_lingkup_gabungan || [(p.toko?.lingkup_pekerjaan || 'UNKNOWN').toUpperCase()];
                    const lingkup = lingkupArray.join(' & ');

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
                                    <Badge variant="outline" className={`${badgeColor} font-bold text-[10px] tracking-widest`}>{lingkup}</Badge>
                                </div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-red-600 transition-colors">{p.toko?.nama_toko}</h3>
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 whitespace-nowrap">{p.toko?.nomor_ulok}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-4">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terbangun</p>
                                        <p className="text-xs font-semibold text-slate-400">{luasTerbangun} m²</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-700 text-right">{formatRupiah(Math.round(avg))} <span className="text-[10px] text-slate-400">/m²</span></p>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bangunan</p>
                                        <p className="text-xs font-semibold text-slate-400">{luasBangunan} m²</p>
                                    </div>
                                    <p className="text-xl font-bold text-blue-600 text-right">{formatRupiah(avgBangunan)} <span className="text-[10px] text-slate-400">/m²</span></p>
                                </div>

                                {costTerbukaExists && (
                                    <div className="flex justify-between items-end pb-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Area Terbuka</p>
                                            <p className="text-xs font-semibold text-slate-400">{luasTerbuka} m²</p>
                                        </div>
                                        <p className="text-xl font-bold text-purple-600 text-right">{formatRupiah(Math.round(avgTerbuka))} <span className="text-[10px] text-slate-400">/m²</span></p>
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
                        Halaman <span className="text-slate-900 font-bold">{currentPage}</span> dari <span className="text-slate-900 font-bold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-semibold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-semibold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderJhkPekerjaanList = () => (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div className="flex items-center justify-end gap-5 mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md bg-slate-600 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durasi SPK Asli</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md bg-amber-500 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tambah Hari</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md bg-rose-600 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keterlambatan</span>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    {paginatedProjects.map((p, idx) => {
                        const spk = p.spk?.[0];
                        const tsArray = p.spk?.[0]?.pertambahan_spk || [];
                        const st = p.berkas_serah_terima?.[0];
                        const opnameFinal = p.opname_final?.find((o: any) => o.tipe_opname !== 'OPNAME') || p.opname_final?.[0];

                        const spkDays = Number(spk?.durasi) || 0;
                        const tsDays = tsArray.reduce((acc: number, curr: any) => acc + (Number(curr.pertambahan_hari) || 0), 0);
                        const telatDays = Number(opnameFinal?.hari_denda) || 0;
                        const totalDays = spkDays + tsDays + telatDays || 1; // avoid divide by zero

                        const spkPct = (spkDays / totalDays) * 100;
                        const tsPct = (tsDays / totalDays) * 100;
                        const telatPct = (telatDays / totalDays) * 100;

                        const startDate = spk?.created_at ? formatDateIndo(spk.created_at).replace(/ pukul.*$/, '') : '-';
                        const endDate = st?.created_at ? formatDateIndo(st.created_at).replace(/ pukul.*$/, '') : '-';
                        const lingkup = p._jhk_lingkup_gabungan ? p._jhk_lingkup_gabungan.join(' & ') : p.toko?.lingkup_pekerjaan || '';

                        return (
                            <div
                                key={idx}
                                className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group flex flex-col lg:flex-row lg:items-center gap-6 relative overflow-hidden"
                                onClick={() => handleProjectClick(p)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 to-purple-50/0 group-hover:from-purple-50/50 transition-colors pointer-events-none" />
                                <div className="w-full lg:w-1/4 shrink-0 relative z-10">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase group-hover:text-purple-700 transition-colors truncate">{p.toko?.nama_toko}</h3>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">{p.toko?.nomor_ulok} {lingkup ? `· ${lingkup}` : ''}</p>
                                </div>

                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="h-8 w-full flex rounded-lg overflow-hidden shadow-sm">
                                            {spkPct > 0 && (
                                                <div
                                                    style={{ width: `${spkPct}%` }}
                                                    className="bg-slate-600 group-hover:bg-slate-700 h-full flex items-center justify-center border-r border-slate-800/30 transition-colors"
                                                >
                                                    {spkPct > 15 && <span className="text-[9px] font-semibold text-white/90">SPK {spkDays}</span>}
                                                </div>
                                            )}
                                            {tsPct > 0 && (
                                                <div
                                                    style={{ width: `${tsPct}%` }}
                                                    className="bg-amber-500 group-hover:bg-amber-500 h-full flex items-center justify-center border-r border-amber-700/30 transition-colors"
                                                >
                                                    {tsPct > 10 && <span className="text-[9px] font-semibold text-white/90">+{tsDays}</span>}
                                                </div>
                                            )}
                                            {telatPct > 0 && (
                                                <div
                                                    style={{ width: `${telatPct}%` }}
                                                    className="bg-rose-500 group-hover:bg-rose-600 h-full flex items-center justify-center transition-colors"
                                                >
                                                    {telatPct > 10 && <span className="text-[9px] font-semibold text-white/90">TELAT {telatDays}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5 px-1">
                                            <span className="text-[9px] font-semibold text-slate-400">{startDate}</span>
                                            <span className="text-[9px] font-semibold text-slate-400">{endDate}</span>
                                        </div>
                                    </div>
                                    <div className="w-16 shrink-0 text-right pt-2 lg:pt-0 relative z-10">
                                        <p className="text-2xl font-bold text-slate-800 leading-none group-hover:scale-110 transition-transform origin-right">{totalDays}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-purple-600 transition-colors">Hari</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <p className="text-sm font-semibold text-slate-500">
                        Halaman <span className="text-slate-900 font-bold">{currentPage}</span> dari <span className="text-slate-900 font-bold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-semibold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-semibold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderKeterlambatanList = () => (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div className="flex flex-col gap-4">
                    {paginatedProjects.map((p, idx) => {
                        const spk = p.spk?.[0];
                        const startDate = spk?.created_at || spk?.waktu_persetujuan ? formatDateIndo(spk.created_at || spk.waktu_persetujuan).replace(/ pukul.*$/, '') : '-';
                        const targetDate = p._keterlambatan_target_date ? formatDateIndo(p._keterlambatan_target_date.toISOString()).replace(/ pukul.*$/, '') : '-';
                        const keterlambatanDays = p._keterlambatan_days || 0;
                        const lingkup = p._jhk_lingkup_gabungan ? p._jhk_lingkup_gabungan.join(' & ') : p.toko?.lingkup_pekerjaan || '';

                        return (
                            <div
                                key={idx}
                                className="bg-white border border-rose-200/60 rounded-2xl p-5 shadow-sm hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 cursor-pointer group flex flex-col lg:flex-row lg:items-center gap-6 relative overflow-hidden"
                                onClick={() => handleProjectClick(p)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-50/0 to-rose-50/0 group-hover:from-rose-50/50 transition-colors pointer-events-none" />

                                <div className="w-full lg:w-1/3 shrink-0 relative z-10">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase group-hover:text-rose-700 transition-colors truncate">{p.toko?.nama_toko}</h3>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">{p.toko?.nomor_ulok} {lingkup ? `· ${lingkup}` : ''}</p>
                                </div>

                                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div>
                                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Tgl SPK</p>
                                                <p className="text-xs font-bold text-slate-700">{startDate}</p>
                                            </div>
                                            <div className="w-8 h-px bg-slate-200"></div>
                                            <div>
                                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Target ST</p>
                                                <p className="text-xs font-bold text-rose-600">{targetDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 group-hover:bg-rose-100 transition-colors">
                                        <Timer className="w-5 h-5 text-rose-500 group-hover:animate-pulse" />
                                        <div>
                                            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Terlambat</p>
                                            <p className="text-xl font-bold text-rose-700 leading-none">{keterlambatanDays} <span className="text-xs font-semibold text-rose-600">Hari</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    <p className="text-sm font-semibold text-slate-500">
                        Halaman <span className="text-slate-900 font-bold">{currentPage}</span> dari <span className="text-slate-900 font-bold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-semibold">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl font-semibold">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderLingkupSelection = () => {
        if (!selectedGroupedUlok) return null;

        let availableProjects = projects.filter(p => p.toko?.nomor_ulok === selectedGroupedUlok);
        // Sort so that SIPIL is always on the left
        availableProjects.sort((a, b) => {
            const scopeA = (a.toko?.lingkup_pekerjaan || '').toUpperCase();
            const scopeB = (b.toko?.lingkup_pekerjaan || '').toUpperCase();
            if (scopeA === 'SIPIL') return -1;
            if (scopeB === 'SIPIL') return 1;
            return 0;
        });

        return (
            <div className="h-full flex justify-center p-4 sm:p-8 pt-12 sm:pt-16">
                <div className="max-w-2xl w-full text-center">
                    <h3 className="text-3xl font-bold text-slate-900 mb-2">Pilih Lingkup Pekerjaan</h3>
                    <p className="text-slate-500 font-semibold mb-10">Toko ini memiliki beberapa lingkup pekerjaan. Silakan pilih salah satu untuk melihat Timeline-nya.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {availableProjects.map((p, idx) => {
                            const lingkup = p.toko?.lingkup_pekerjaan || 'UNKNOWN';
                            const isSipil = lingkup.toUpperCase() === 'SIPIL';
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleProjectClick(p)}
                                    className={`bg-white rounded-3xl p-8 border-2 cursor-pointer transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${isSipil ? 'border-amber-100 hover:border-amber-400 hover:shadow-amber-500/10' : 'border-blue-100 hover:border-blue-400 hover:shadow-blue-500/10'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110 ${isSipil ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {isSipil ? <HardHat className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                                    </div>
                                    <h4 className={`text-2xl font-bold uppercase mb-2 ${isSipil ? 'text-amber-600' : 'text-blue-600'}`}>{lingkup}</h4>
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{p.toko?.nomor_ulok}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderTimeline = () => {
        const nodes: any[] = [];
        const proj = selectedProject;
        if (!proj) return null;

        const scope = proj.toko?.lingkup_pekerjaan || '';
        const suffix = scope ? ` (${scope})` : '';

        // 1. RAB
        const hasRab = proj.rab && proj.rab.length > 0;
        nodes.push({
            type: 'PENAWARAN',
            title: `Penawaran RAB${suffix}`,
            desc: hasRab ? formatRupiah(proj.rab[0].grand_total_final) : 'Belum Tersedia',
            icon: <FileText className="w-5 h-5"/>,
            color: hasRab ? 'indigo' : 'slate',
            data: hasRab ? proj.rab[0] : null,
            isActive: hasRab,
            isCompleted: hasRab
        });

        // 2. SPK
        const hasSpk = proj.spk && proj.spk.length > 0;
        nodes.push({
            type: 'SPK',
            title: `Surat Perintah Kerja${suffix}`,
            desc: hasSpk ? formatRupiah(proj.spk[0].grand_total) : 'Belum Tersedia',
            icon: <HardHat className="w-5 h-5"/>,
            color: hasSpk ? 'blue' : 'slate',
            data: hasSpk ? proj.spk[0] : null,
            isActive: hasSpk,
            isCompleted: hasSpk
        });

        // 3. Tambah SPK (Only if exists)
        let spkTs = hasSpk ? proj.spk[0].pertambahan_spk : null;
        let tsSuffix = suffix;
        const projectListToSearch = allProjects || projects;
        if ((!spkTs || spkTs.length === 0) && projectListToSearch) {
            const counterpart = projectListToSearch.find((p: any) => {
                if (p.toko?.nomor_ulok !== proj.toko?.nomor_ulok || p.toko?.id === proj.toko?.id) return false;
                const pSpk = Array.isArray(p.spk) ? p.spk : (p.spk ? [p.spk] : []);
                if (pSpk.length === 0) return false;
                const pPt = Array.isArray(pSpk[0].pertambahan_spk) ? pSpk[0].pertambahan_spk : (pSpk[0].pertambahan_spk ? [pSpk[0].pertambahan_spk] : []);
                return pPt.length > 0;
            });
            if (counterpart) {
                const counterpartSpk = Array.isArray(counterpart.spk) ? counterpart.spk : [counterpart.spk];
                const counterpartPt = Array.isArray(counterpartSpk[0]?.pertambahan_spk) ? counterpartSpk[0].pertambahan_spk : (counterpartSpk[0]?.pertambahan_spk ? [counterpartSpk[0].pertambahan_spk] : []);
                spkTs = counterpartPt;
                const counterpartScope = counterpart.toko?.lingkup_pekerjaan || '';
                tsSuffix = counterpartScope ? ` (${counterpartScope})` : '';
            }
        }

        if (spkTs && spkTs.length > 0) {
            const t = spkTs[0];
            nodes.push({
                type: 'Tambah SPK',
                title: `Tambah SPK${tsSuffix}`,
                desc: `${t.pertambahan_hari} Hari`,
                icon: <Clock className="w-5 h-5"/>,
                color: 'cyan',
                data: t,
                isActive: true,
                isCompleted: true
            });
        }

        // 4. Instruksi Lapangan (Only if exists)
        const hasIL = proj.instruksi_lapangan && proj.instruksi_lapangan.length > 0;
        const totalIL = hasIL ? proj.instruksi_lapangan.reduce((sum: number, il: any) => sum + (Number(il.grand_total) || 0), 0) : 0;
        if (hasIL) {
            nodes.push({
                type: 'IL_ROOT',
                title: `Instruksi Lapangan${suffix}`,
                desc: formatRupiah(totalIL),
                icon: <Activity className="w-5 h-5"/>,
                color: 'orange',
                data: { isILRoot: true, projectData: proj },
                isActive: true,
                isCompleted: true
            });
        }

        // 5. Pengawasan
        let hasPengawasan = false;
        let pengawasanProgress = 0, pengawasanTerlambat = 0;
        const grouped = (proj.gantt || []).reduce((acc: any, g: any) => {
            if (g.pengawasan && Array.isArray(g.pengawasan) && g.pengawasan.length > 0) {
                hasPengawasan = true;
                g.pengawasan.forEach((pw: any) => {
                    let dateKey = pw.tanggal_pengawasan || pw.created_at || 'unknown';
                    if (typeof dateKey === 'string') dateKey = dateKey.split(/[T ]/)[0];
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(pw);
                });
            }
            return acc;
        }, {});
        if (hasPengawasan) {
            Object.values(grouped).forEach((groupItems: any) => {
                const isSelesai = groupItems.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                const isTerlambat = groupItems.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));
                if (!isSelesai && isTerlambat) pengawasanTerlambat++;
                else if (!isSelesai) pengawasanProgress++;
            });
        }
        const pSelesai = hasPengawasan && pengawasanProgress === 0 && pengawasanTerlambat === 0;
        nodes.push({
            type: 'PENGAWASAN',
            title: `Pengawasan${suffix}`,
            desc: hasPengawasan ? (pSelesai ? 'SELESAI' : pengawasanTerlambat > 0 ? 'TERLAMBAT' : 'PROGRESS') : 'Belum Tersedia',
            icon: <Search className="w-5 h-5"/>,
            color: hasPengawasan ? 'purple' : 'slate',
            data: hasPengawasan ? { isPengawasanRoot: true, ganttData: proj.gantt, projectData: proj } : null,
            isActive: hasPengawasan,
            isCompleted: pSelesai
        });

        // 6. Opname Parsial
        const allOpnames = proj.opname_final || [];
        const opnameParsial = allOpnames.filter((o: any) => o.tipe_opname === 'OPNAME' || o.tipe_opname === 'OPNAME_FINAL' || o.tipe_opname === 'KTK');
        const hasParsial = opnameParsial.length > 0;
        const parsialData = hasParsial ? opnameParsial[0] : null;
        const parsialTotal = parsialData ? (parsialData.grand_total_final || parsialData.grand_total_ktk || parsialData.grand_total_opname || parsialData.nilai_opname || 0) : 0;
        nodes.push({
            type: 'Opname Parsial',
            title: `Opname Parsial${suffix}`,
            desc: hasParsial ? formatRupiah(parsialTotal) : 'Belum Tersedia',
            icon: <Activity className="w-5 h-5"/>,
            color: hasParsial ? 'sky' : 'slate',
            data: parsialData,
            isActive: hasParsial,
            isCompleted: hasParsial
        });

        // 7. Serah Terima
        const hasST = proj.berkas_serah_terima && proj.berkas_serah_terima.length > 0;
        nodes.push({
            type: 'ST',
            title: `Serah Terima Selesai${suffix}`,
            desc: hasST ? 'Selesai' : 'Belum Tersedia',
            icon: <FileCheck className="w-5 h-5"/>,
            color: hasST ? 'emerald' : 'slate',
            data: hasST ? proj.berkas_serah_terima[0] : null,
            isActive: hasST,
            isCompleted: hasST
        });

        // 8. Opname Final / KTK
        const opnameFinal = allOpnames.filter((o: any) => o.tipe_opname !== 'OPNAME');
        const hasFinal = opnameFinal.length > 0;
        const opnameStatus = hasFinal ? (() => {
            const opname = opnameFinal[0];
            const rab = proj.rab?.[0];
            const grandFinal = Number(opname.grand_total_final || opname.grand_total_opname || opname.nilai_opname || 0);
            const grandRab = Number(rab?.grand_total_final || 0);
            return grandFinal > grandRab ? 'Kerja Tambah' : (grandFinal < grandRab ? 'Kerja Kurang' : 'Sesuai');
        })() : '';
        nodes.push({
            type: 'Opname Final',
            title: `Opname Final / KTK${suffix}`,
            desc: hasFinal ? `${formatRupiah(opnameFinal[0].grand_total_final || opnameFinal[0].nilai_opname || 0)} (${opnameStatus})` : 'Belum Tersedia',
            icon: <CheckCircle2 className="w-5 h-5"/>,
            color: hasFinal ? 'teal' : 'slate',
            data: hasFinal ? opnameFinal[0] : null,
            isActive: hasFinal,
            isCompleted: hasFinal
        });

        // 9. DONE
        const isFinalApproved = hasFinal && ['SELESAI', 'APPROVED', 'DONE', 'DISETUJUI'].includes(String(opnameFinal[0].status_opname_final || '').toUpperCase());
        const isProyekSelesai = hasST && hasFinal && isFinalApproved;

        nodes.push({
            type: 'DONE',
            title: `Proyek Selesai${suffix}`,
            desc: isProyekSelesai ? 'Tercapai' : 'Belum Tercapai',
            icon: <CheckCircle2 className="w-5 h-5"/>,
            color: isProyekSelesai ? 'emerald' : 'slate',
            data: null,
            isActive: isProyekSelesai,
            isCompleted: isProyekSelesai
        });

        let displayNodes = nodes;

        return (
            <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Left Timeline Sidebar */}
                <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col relative shadow-sm h-fit max-h-full overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8">Timeline Dokumen Proyek</h3>

                    {displayNodes.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">Belum ada dokumen</div>
                    ) : (
                        <div className="relative flex flex-col gap-8">
                            <div className="absolute left-[24px] top-[10px] bottom-[10px] w-[2px] bg-slate-100 z-0"></div>

                            {displayNodes.map((node, i) => (
                                <div
                                    key={i}
                                    className={`relative z-10 flex gap-5 ${node.isActive ? 'cursor-pointer group' : 'opacity-40 grayscale pointer-events-none'}`}
                                    onClick={() => { if (node.isActive && node.data) setSelectedDocument({ type: node.type, data: node.data }); }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-white border-2 border-${node.color}-100 text-${node.color}-500 flex items-center justify-center shrink-0 ${node.isActive ? `group-hover:bg-${node.color}-500 group-hover:border-${node.color}-500 group-hover:text-white group-hover:scale-110 shadow-sm` : ''} transition-all z-10 relative`}>
                                        {node.icon}
                                    </div>
                                    <div className="pt-1">
                                        <h4 className={`font-bold text-slate-800 text-base ${node.isActive ? `group-hover:text-${node.color}-600` : ''} transition-colors`}>{node.title}</h4>
                                        <p className={`text-sm font-semibold ${node.isActive ? `text-${node.color}-600` : 'text-slate-400'} mt-1`}>{node.desc}</p>
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
                            <h3 className="relative z-10 text-2xl font-bold text-slate-700 mb-3 tracking-tight">Pilih Dokumen</h3>
                            <p className="relative z-10 text-sm font-semibold text-slate-500 max-w-sm leading-relaxed">Silakan pilih salah satu dokumen pada timeline di sebelah kiri untuk melihat rincian datanya secara lengkap.</p>
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
                    className="bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-xl shrink-0 shadow-sm border border-slate-200 transition-all h-10 px-4 group"
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
                    className="bg-red-600 text-white hover:bg-red-700 font-semibold rounded-xl shrink-0 shadow-md shadow-red-500/20 hover:scale-105 transition-all h-11 px-6"
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

        const renderStandardTokoInfo = () => {
            const tk = data.toko || selectedProject?.toko || {};
            let lingkupGabungan = selectedProject?._jhk_lingkup_gabungan ? selectedProject._jhk_lingkup_gabungan.join(' & ') : tk.lingkup_pekerjaan || '-';
        if (initialCardType === 'JHK' || initialCardType === 'TAMBAH_HARI_SPK') {
            lingkupGabungan = 'SIPIL + ME';
        }

            return (
                <>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Nomor ULOK</th>
                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">{tk.nomor_ulok || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Nama Toko</th>
                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">{tk.nama_toko || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Lingkup Pekerjaan</th>
                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">{lingkupGabungan}</td>
                    </tr>
                </>
            );
        };

        const commonExcluded = ['id_toko', 'lingkup_pekerjaan', 'proyek', 'nomor_ulok', 'nama_toko', 'kode_toko'];

        if (type === 'PENAWARAN') {
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'pemberi_persetujuan', 'waktu_persetujuan', 'file_asuransi', 'pemberi_persetujuan_koordinator', 'waktu_persetujuan_koordinator', 'nama_persetujuan_koordinator', 'pemberi_persetujuan_manager', 'waktu_persetujuan_manager', 'nama_persetujuan_manager', 'pemberi_persetujuan_direktur', 'waktu_persetujuan_direktur', 'nama_persetujuan_direktur', 'waktu_penolakan', 'ditolak_oleh', 'durasi_pekerjaan', 'kategori_lokasi', 'no_polis', 'berlaku_polis', 'luas_bangunan', 'luas_terbangun', 'luas_area_terbuka', 'alasan_penolakan', 'catatan_penolakan', ...commonExcluded];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');

            const lowerData: any = {};
            Object.keys(data).forEach(k => { lowerData[k.toLowerCase()] = data[k]; });

            const renderPersetujuanRow = (label: string, namaField: string, emailField: string, waktuField: string) => {
                if (!lowerData[emailField] && !lowerData[namaField] && !lowerData[waktuField]) return null;

                let nama = lowerData[namaField];
                if (!nama && lowerData[emailField]) {
                    let emailName = String(lowerData[emailField]).split('@')[0];
                    emailName = emailName.replace(/\./g, ' ');
                    nama = emailName.replace(/\b\w/g, l => l.toUpperCase());
                }
                if (!nama) nama = '-';

                const w = lowerData[waktuField] ? String(lowerData[waktuField]).replace(/\.\d+\+.*$/, '') : '';
                if (!w && nama === '-') return null;

                return (
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{label}</th>
                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                            {w ? `Disetujui ${formatDateIndo(w).replace(/ pukul.*$/, '')} oleh ${nama}` : '-'}
                        </td>
                    </tr>
                );
            };

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Dokumen RAB Tersedia</h4>
                            <div className="flex flex-wrap gap-3">
                                {renderMainPdfButton(data.link_pdf_gabungan || data.link_pdf, undefined, undefined, 'Lihat PDF RAB')}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {renderStandardTokoInfo()}
                                    {renderPersetujuanRow('Persetujuan Koordinator', 'nama_persetujuan_koordinator', 'pemberi_persetujuan_koordinator', 'waktu_persetujuan_koordinator')}
                                    {renderPersetujuanRow('Persetujuan Manager', 'nama_persetujuan_manager', 'pemberi_persetujuan_manager', 'waktu_persetujuan_manager')}
                                    {renderPersetujuanRow('Persetujuan Direktur', 'nama_persetujuan_direktur', 'pemberi_persetujuan_direktur', 'waktu_persetujuan_direktur')}
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));

                                        let displayVal = isCurrency ? fR(data[k]) : valStr;

                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                        if (kl === 'status') displayVal = valStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
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
            const excludedKeys = ['id', 'created_at', 'updated_at', 'nomor_ulok', 'terbilang', 'waktu_selesai', 'waktu_mulai', 'waktu_persetujuan', 'email_pembuat', 'approve_email', 'approve_name', 'approver_email', 'approver_name', 'link_pdf', 'durasi', 'spk_manual_1', 'spk_manual_2', 'pertambahan_spk', ...commonExcluded];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');

            const wMulai = data.waktu_mulai ? String(data.waktu_mulai).replace(/T?\d{2}:\d{2}:\d{2}.*$/, '') : '';
            const wSelesai = data.waktu_selesai ? String(data.waktu_selesai).replace(/T?\d{2}:\d{2}:\d{2}.*$/, '') : '';
            const wPersetujuan = data.waktu_persetujuan ? String(data.waktu_persetujuan).replace(/\.\d+\+.*$/, '') : '';
            const namaPembuat = data.approver_name || data.approve_name || data.email_pembuat || data.approver_email || data.approve_email || '';

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight">Dokumen SPK</h4>
                                </div>
                                {renderMainPdfButton(data.link_pdf, undefined, undefined, 'Lihat PDF SPK')}
                            </div>
                        </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {renderStandardTokoInfo()}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Durasi</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{data.durasi || 0} Hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Mulai</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{wMulai ? formatDateIndo(wMulai).replace(/ pukul.*$/, '') : '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Selesai</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{wSelesai ? formatDateIndo(wSelesai).replace(/ pukul.*$/, '') : '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Persetujuan</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{wPersetujuan ? `${formatDateIndo(wPersetujuan).replace(/ pukul.*$/, '')}${namaPembuat ? ` oleh ${namaPembuat}` : ''}` : '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));

                                        let displayVal = isCurrency ? fR(data[k]) : valStr;

                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                        if (kl === 'status') displayVal = valStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
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
            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'dokumen_tambahan', 'pertambahan_hari', 'waktu_persetujuan', 'waktu_selesai', 'tanggal_akhir_setelah_perpanjangan', 'target_st_setelah_perpanjangan', 'alasan_perpanjangan', 'disetujui_oleh', 'approver_email', 'approver_name', 'link_lampiran_pendukung', ...commonExcluded];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');

            const pdfUrl = data.dokumen_tambahan || data.link_pdf;

            const wPersetujuan = data.waktu_persetujuan ? String(data.waktu_persetujuan).replace(/\.\d+\+.*$/, '') : '';
            const namaPembuat = data.disetujui_oleh || data.approver_name || data.approve_name || data.email_pembuat || data.approver_email || data.approve_email || '';

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Dokumen Tambah SPK</h4>
                            </div>
                            {renderMainPdfButton(pdfUrl, undefined, undefined, 'Lihat PDF Tambah SPK')}
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {renderStandardTokoInfo()}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Pertambahan Hari</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">+{data.pertambahan_hari || 0} Hari</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Target ST</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">
                                            {data.tanggal_spk_akhir_setelah_perpanjangan ? formatDateIndo(data.tanggal_spk_akhir_setelah_perpanjangan).replace(/ pukul.*$/, '') : '-'} <span className="text-slate-400 font-semibold text-sm ml-2">&middot; Sesuai Aturan ST (+{data.pertambahan_hari || 0} hari SPK)</span>
                                        </td>
                                    </tr>
                                    {data.alasan_perpanjangan && (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Alasan Perpanjangan</th>
                                            <td className="py-5 px-8 text-sm font-semibold text-slate-900 align-top whitespace-pre-wrap">{data.alasan_perpanjangan}</td>
                                        </tr>
                                    )}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Persetujuan</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{wPersetujuan ? `Disetujui ${formatDateIndo(wPersetujuan).replace(/ pukul.*$/, '')}${namaPembuat ? ` oleh ${namaPembuat}` : ''}` : '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));

                                        let displayVal = isCurrency ? fR(data[k]) : valStr;

                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                        if (kl === 'status') displayVal = valStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
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
        if (type === 'IL' || type === 'IL_ROOT') {
            const ilDataList = data.isILRoot ? data.projectData.instruksi_lapangan : [data];
            const isRoot = data.isILRoot;

            if (isRoot) {
                return (
                    <div className="w-full h-full flex flex-col bg-slate-50/20 relative">
                        <div className="px-8 pt-8 pb-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 tracking-tight">Daftar Instruksi Lapangan</h4>
                                    <p className="text-sm text-slate-500 font-medium">Total {ilDataList.length} dokumen IL</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {ilDataList.map((il: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedILForDrawer(il)}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-slate-800">IL {idx + 1} <span className="font-normal text-slate-500 mx-2">&middot;</span> {il.created_at ? String(il.created_at).replace(/\.\d+Z?$/, '').replace('T', ' ') : '-'}</h5>
                                                    <p className="text-sm font-bold text-emerald-600 mt-1">{fR(il.grand_total)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-100 pt-4 sm:border-0 sm:pt-0 mt-2 sm:mt-0">
                                            <div className="flex items-center text-sm font-semibold text-slate-400 group-hover:text-orange-600 transition-colors">
                                                Klik untuk melihat detail <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_lampiran', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'link_lampiran_pendukung', ...commonExcluded];
            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Instruksi Lapangan</h4>
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
                                    {renderStandardTokoInfo()}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Waktu Dibuat</th>
                                        <td className="py-5 px-8 text-base font-semibold text-slate-800 align-top">{data.created_at ? String(data.created_at).replace(/\.\d+Z?$/, '').replace('T', ' ') : '-'}</td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));

                                        let displayVal = isCurrency ? fR(data[k]) : valStr;

                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                        if (kl === 'status') displayVal = valStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
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
            const ulok = data.projectData?.toko?.nomor_ulok;
            let allGantts: any[] = [];
            if (ulok && projects && Array.isArray(projects)) {
                projects.filter(p => p.toko?.nomor_ulok === ulok).forEach(p => {
                    if (p.gantt && Array.isArray(p.gantt)) {
                        allGantts = [...allGantts, ...p.gantt];
                    }
                });
            } else {
                allGantts = data.ganttData || [];
            }

            // Group pengawasan items by id_pengawasan_gantt
            const groupedDocs: Array<{
                id: number;
                projectData: any;
                items: any[];
                tanggal: string;
                pdfUrl: string | null;
            }> = [];

            allGantts.forEach((g: any) => {
                if (g.pengawasan_gantt && Array.isArray(g.pengawasan_gantt)) {
                    g.pengawasan_gantt.forEach((pg: any) => {
                        const items = (g.pengawasan || []).filter((p: any) => p.id_pengawasan_gantt === pg.id);
                        if (items.length > 0) {
                            const berkas = (g.berkas_pengawasan || []).find((b: any) => b.id_pengawasan_gantt === pg.id);

                            // Find corresponding project from projects array for this gantt
                            let pData = data.projectData;
                            if (projects && Array.isArray(projects)) {
                                const matchedP = projects.find(p => p.toko?.id === g.id_toko);
                                if (matchedP) pData = matchedP;
                            }

                            // Prioritaskan data V1 dari pengawasan_pdf_pending
                            let pendingPdfUrl = null;
                            if (pData?.pengawasan_pdf_pending && Array.isArray(pData.pengawasan_pdf_pending)) {
                                const pendingMatch = pData.pengawasan_pdf_pending.find((p: any) =>
                                    p.tanggal_pengawasan === pg.tanggal_pengawasan
                                );
                                if (pendingMatch) {
                                    pendingPdfUrl = pendingMatch.link_pdf_pengawasan;
                                }
                            }

                            groupedDocs.push({
                                id: pg.id,
                                projectData: pData,
                                items: items,
                                tanggal: pg.tanggal_pengawasan || items[0].created_at || 'unknown_date',
                                pdfUrl: pendingPdfUrl || berkas?.link_pdf_pengawasan || null,
                            });
                        }
                    });
                }
            });

            // sort descending by id (latest created generally has higher ID)
            groupedDocs.sort((a, b) => b.id - a.id);

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20 relative">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Daftar Dokumen Pengawasan</h4>
                                <p className="text-sm text-slate-500 font-medium">Menampilkan {groupedDocs.length} dokumen pengawasan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4">
                            {groupedDocs.length > 0 ? groupedDocs.map((doc: any, idx: number) => {
                                const isSelesai = doc.items.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                                const isTerlambat = doc.items.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));
                                const statusDesc = isSelesai ? 'SELESAI' : isTerlambat ? 'TERLAMBAT' : 'PROGRESS';
                                const statusColor = isSelesai ? 'bg-emerald-50 text-emerald-700' : isTerlambat ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700';

                                return (
                                    <div
                                        key={idx}
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedMemoForDrawer({ project: doc.projectData, items: doc.items, dateKey: doc.tanggal, pdfUrl: doc.pdfUrl })}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-slate-800">{doc.projectData.toko?.nomor_ulok || '-'} <span className="font-normal text-slate-500 mx-2">&middot;</span> {doc.items.length} Item Pekerjaan</h5>
                                                    <p className="text-sm text-slate-500 flex items-center mt-1">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Tanggal {doc.tanggal ? formatDateIndo(doc.tanggal).replace(/ pukul.*$/, '') : '-'}
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
            const baseExcludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_pdf_opname', 'items', 'hari_denda', 'nilai_denda', 'tipe_opname', 'aksi', 'cost_terbuka', 'cost_beanspot', 'cost_bangunan', 'tanggal_akhir_spk_denda', 'tanggal_serah_terima_denda', 'pemberi_persetujuan_direktur', 'waktu_persetujuan_direktur', 'pemberi_persetujuan_koordinator', 'waktu_persetujuan_koordinator', 'pemberi_persetujuan_manager', 'waktu_persetujuan_manager', 'catatan_persetujuan_koordinator', 'catatan_persetujuan_manager', 'catatan_persetujuan_direktur', ...commonExcluded];
            const excludedKeys = type === 'Opname Parsial'
                ? [...baseExcludedKeys, 'grand_total_rab', 'status_opname_final', 'email_pembuat', 'catatan_opname', 'grand_total_final', 'grand_total_ktk', 'alasan_penolakan', 'catatan_penolakan']
                : [...baseExcludedKeys, 'grand_total_rab'];

            const keys = Object.keys(data).filter(k => !excludedKeys.includes(k) && data[k] !== null && data[k] !== '' && String(data[k]).toUpperCase() !== 'NULL' && typeof data[k] !== 'object');
            const docTitle = type === 'Opname Parsial' ? 'Opname Parsial' : 'Opname Final';

            const renderPersetujuanRow = (label: string, emailField: string, waktuField: string) => {
                if (!data[emailField] && !data[waktuField]) return null;

                let nama = data[emailField];
                if (nama && typeof nama === 'string') {
                    let emailName = nama.split('@')[0];
                    emailName = emailName.replace(/\./g, ' ');
                    nama = emailName.replace(/\b\w/g, l => l.toUpperCase());
                } else {
                    nama = '-';
                }

                const w = data[waktuField] ? String(data[waktuField]).replace(/\.\d+\+.*$/, '') : '';
                if (!w && nama === '-') return null;

                return (
                    <tr key={label} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{label}</th>
                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                            {w ? `Disetujui ${formatDateIndo(w).replace(/ pukul.*$/, '')} oleh ${nama}` : '-'}
                        </td>
                    </tr>
                );
            };

            // Per requirement: pake grand total final KTK opname bukan grand total opname
            let displayGrandTotal = data.grand_total_final || data.grand_total_ktk || data.grand_total_opname || data.nilai_opname || 0;

            let opnameStatus = '';
            let spkTotal = 0;
            // Per requirement: "grand total rab ganti dengan nilai spk"
            if (selectedProject?.spk && selectedProject.spk.length > 0) {
                spkTotal = selectedProject.spk[0].grand_total || 0;
                if (Number(displayGrandTotal) > Number(spkTotal)) opnameStatus = ' (Kerja Tambah)';
                else if (Number(displayGrandTotal) < Number(spkTotal)) opnameStatus = ' (Kerja Kurang)';
                else opnameStatus = ' (Sesuai)';
            }

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">{docTitle}</h4>
                            </div>
                            {type === 'Opname Parsial'
                                ? renderMainPdfButton(data.link_pdf || data.link_pdf_opname, undefined, undefined, 'Lihat PDF Opname Parsial')
                                : renderMainPdfButton(data.link_pdf || data.link_pdf_opname, undefined, undefined, 'Lihat PDF KTK')
                            }
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {type === 'Opname Parsial' && selectedProject?.gantt && (() => {
                                        let allPengawasanGantt: any[] = [];
                                        let allPengawasanItems: any[] = [];

                                        (selectedProject.gantt || []).forEach((g: any) => {
                                            if (g.pengawasan_gantt && Array.isArray(g.pengawasan_gantt)) {
                                                allPengawasanGantt = allPengawasanGantt.concat(g.pengawasan_gantt);
                                            }
                                            if (g.pengawasan && Array.isArray(g.pengawasan)) {
                                                allPengawasanItems = allPengawasanItems.concat(g.pengawasan);
                                            }
                                        });

                                        if (allPengawasanGantt.length === 0) return null;

                                        // Collect all opname items
                                        const allOpnameItems = (selectedProject.opname_final || [])
                                            .filter((o: any) => o.tipe_opname === 'OPNAME' || o.tipe_opname === 'OPNAME_FINAL')
                                            .flatMap((o: any) => o.items || []) as Array<Record<string, unknown>>;

                                        // Group by tanggal_pengawasan
                                        const groupsMap = new Map<string, { date: Date, count: number, total: number }>();

                                        allPengawasanGantt.forEach((pg: any) => {
                                            const items = allPengawasanItems.filter(p => p.id_pengawasan_gantt === pg.id);
                                            if (items.length > 0) {
                                                let tglStr = pg.tanggal_pengawasan || pg.created_at;
                                                if (tglStr && String(tglStr).match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                                    const parts = String(tglStr).split('/');
                                                    tglStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                                }
                                                const dStr = formatDateIndo(tglStr).replace(/ pukul.*$/, '');

                                                let groupTotal = 0;
                                                items.forEach(pi => {
                                                    const piStatus = String(pi.status).trim().toUpperCase();
                                                    // Map price only if 'selesai' to avoid double counting across parsials
                                                    if (['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes(piStatus)) {
                                                        const matchingOpname = allOpnameItems.find(oi =>
                                                            String(oi.kategori_pekerjaan).trim().toLowerCase() === String(pi.kategori_pekerjaan).trim().toLowerCase() &&
                                                            String(oi.jenis_pekerjaan).trim().toLowerCase() === String(pi.jenis_pekerjaan).trim().toLowerCase()
                                                        );
                                                        if (matchingOpname) {
                                                            groupTotal += parseFloat(String(matchingOpname.total_harga_opname ?? 0)) || 0;
                                                        }
                                                    }
                                                });

                                                const existing = groupsMap.get(dStr);
                                                if (existing) {
                                                    existing.count += items.length;
                                                    existing.total += groupTotal;
                                                } else {
                                                    let safeDate = new Date(tglStr);
                                                    if (isNaN(safeDate.getTime())) safeDate = new Date(pg.created_at);
                                                    groupsMap.set(dStr, { date: safeDate, count: items.length, total: groupTotal });
                                                }
                                            }
                                        });

                                        const groups = Array.from(groupsMap.entries()).map(([dStr, val]) => ({
                                            dateStr: dStr,
                                            date: val.date,
                                            count: val.count,
                                            total: val.total
                                        })).sort((a, b) => a.date.getTime() - b.date.getTime());

                                        return (
                                            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group bg-slate-50/30">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Riwayat</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 align-top">
                                                    <div className="flex flex-col gap-3">
                                                        {groups.map((g, idx) => (
                                                            <div key={idx} className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-slate-700">Opname Parsial {idx + 1}</span>
                                                                <span className="text-slate-500 font-medium text-xs px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                                                                    {g.dateStr}
                                                                </span>
                                                                <span className="text-emerald-700 font-bold text-xs px-2.5 py-1 bg-emerald-50 rounded-md border border-emerald-200">
                                                                    {g.count} Item
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })()}
                                    {renderStandardTokoInfo()}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Nilai SPK</th>
                                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                            <span className="text-base font-semibold break-words text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3">{fR(spkTotal)}</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Grand Total {docTitle}</th>
                                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                            <span className="text-base font-semibold break-words text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3">{fR(displayGrandTotal)}{opnameStatus}</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">Selisih</th>
                                        <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                            <span className="text-base font-semibold break-words text-red-700 bg-red-50 px-3 py-1 rounded-lg -ml-3">{fR(spkTotal - displayGrandTotal)}</span>
                                        </td>
                                    </tr>
                                    {keys.map((k, i) => {
                                        if (k === 'grand_total_opname' || k === 'grand_total_final' || k === 'nilai_opname' || k === 'grand_total_ktk') return null;

                                        const valStr = String(data[k]);
                                        const kl = k.toLowerCase();
                                        const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));

                                        let displayVal = isCurrency ? fR(data[k]) : valStr;

                                        if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                        if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;
                                        if (kl.includes('tanggal') || kl.includes('berlaku_polis')) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                        if (kl === 'status') displayVal = valStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                                <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">{k.replace(/_/g, ' ')}</th>
                                                <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                                    <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>{displayVal}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {type !== 'Opname Parsial' && (
                                        <>
                                            {renderPersetujuanRow('Persetujuan Koordinator', 'pemberi_persetujuan_koordinator', 'waktu_persetujuan_koordinator')}
                                            {renderPersetujuanRow('Persetujuan Manager', 'pemberi_persetujuan_manager', 'waktu_persetujuan_manager')}
                                            {renderPersetujuanRow('Persetujuan Direktur', 'pemberi_persetujuan_direktur', 'waktu_persetujuan_direktur')}
                                        </>
                                    )}
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
            const opname = selectedProject?.opname_final?.find((o: any) => o.tipe_opname !== 'OPNAME') || selectedProject?.opname_final?.[0];

            const nilaiOpnameFinal = opname?.grand_total_final || opname?.grand_total_opname || opname?.nilai_opname || data.nilai_opname || 0;

            let dendaRp = opname?.nilai_denda || 0;
            let dendaHari = opname?.hari_denda || 0;
            const ulok = selectedProject?.toko?.nomor_ulok;
            if (ulok && projects) {
                projects.filter(p => p.toko?.nomor_ulok === ulok).forEach(p => {
                    const pOpname = p.opname_final?.find((o: any) => o.tipe_opname !== 'OPNAME') || p.opname_final?.[0];
                    if (pOpname) {
                        if (Number(pOpname.nilai_denda) > dendaRp) dendaRp = Number(pOpname.nilai_denda);
                        if (Number(pOpname.hari_denda) > dendaHari) dendaHari = Number(pOpname.hari_denda);
                    }
                });
            }

            const spkAkhir = spk?.waktu_selesai ? formatDateIndo(spk.waktu_selesai).replace(/ pukul.*$/, '') : '-';
            const stDibuat = data.created_at ? formatDateIndo(data.created_at).replace(/ pukul.*$/, '') : '-';

            return (
                <div className="w-full h-full flex flex-col bg-slate-50/20">
                    <div className="px-8 pt-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Serah Terima Selesai</h4>
                                <p className="text-sm text-slate-500 font-medium">Ringkasan final proyek & serah terima</p>
                            </div>
                            {renderMainPdfButton(data.link_pdf, undefined, undefined, 'Lihat PDF Serah Terima')}
                        </div>
                    </div>
                    <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nomor ULOK</p>
                                <p className="text-lg font-semibold text-slate-800">{selectedProject?.toko?.nomor_ulok || '-'}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nama Toko</p>
                                <p className="text-lg font-semibold text-slate-800">{selectedProject?.toko?.nama_toko || '-'}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Lingkup Pekerjaan</p>
                                <p className="text-lg font-semibold text-slate-800">{selectedProject?._jhk_lingkup_gabungan ? selectedProject._jhk_lingkup_gabungan.join(' & ') : selectedProject?.toko?.lingkup_pekerjaan || '-'}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Tanggal Dibuat</p>
                                <p className="text-lg font-semibold text-slate-800">{stDibuat}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                {(() => {
                                    const selisih = nilaiOpnameFinal - Number(spk?.grand_total || 0);
                                    const selisihLabel = selisih > 0 ? 'Selisih (Kerja Tambah)' : selisih < 0 ? 'Selisih (Kerja Kurang)' : 'Selisih';
                                    const textColor = selisih > 0 ? 'text-amber-600' : selisih < 0 ? 'text-emerald-600' : 'text-slate-800';
                                    return (
                                        <>
                                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{selisihLabel}</p>
                                            <p className={`text-lg font-bold ${textColor}`}>
                                                {fR(selisih)}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nilai Penawaran</p>
                                <p className="text-lg font-bold text-slate-800">{fR(rab?.grand_total_final)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nilai SPK</p>
                                <p className="text-lg font-bold text-slate-800">{fR(spk?.grand_total)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nilai Opname / ST</p>
                                <p className="text-lg font-bold text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-lg -ml-3">{fR(nilaiOpnameFinal)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Keterlambatan</p>
                                <p className="text-lg font-semibold text-slate-800">{dendaHari} hari</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Denda</p>
                                <p className="text-lg font-bold text-rose-600">{fR(dendaRp)}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Akhir SPK</p>
                                <p className="text-lg font-semibold text-slate-800">{spkAkhir}</p>
                            </div>
                            <div className="space-y-1 border-b border-slate-100 pb-4 md:border-0 md:pb-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Serah Terima (ST)</p>
                                <p className="text-lg font-semibold text-slate-800">{stDibuat}</p>
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
                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Dokumen Tersedia</h4>
                            </div>
                            {renderMainPdfButton(selectedMemoForDrawer?.pdfUrl || data.link_pdf, undefined, undefined, 'Lihat PDF Pengawasan')}
                        </div>
                    </div>
                <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                        {keys.map((k, i) => {
                            const valStr = String(data[k]);
                            const isLink = valStr.startsWith('http://') || valStr.startsWith('https://');
                            const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(data[k])) && Number(data[k]) > 10000 && !k.toLowerCase().includes('tahun') && !k.toLowerCase().includes('hari') && !k.toLowerCase().includes('durasi') && !k.toLowerCase().includes('polis'));

                            const displayVal = isCurrency ? fR(data[k]) : valStr;

                            return (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                    <th className="py-5 px-8 text-xs font-bold uppercase text-slate-400 tracking-widest w-1/3 align-top group-hover:text-red-500 transition-colors">
                                        {k.replace(/_/g, ' ')}
                                    </th>
                                    <td className="py-5 px-8 text-sm font-semibold text-slate-900 break-words align-top">
                                        {isLink ? (
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.open(getProxyUrl(valStr), '_blank', 'noopener,noreferrer');
                                            }}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 -ml-3 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 shrink-0" /> Lihat Dokumen
                                        </a>
                                    ) : (
                                        <span className={`text-base font-semibold break-words ${isCurrency ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg -ml-3' : 'text-slate-800'}`}>
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

    const renderILDrawer = () => {
        if (!selectedILForDrawer) return null;
        const il = selectedILForDrawer;
        const finalILPdf = il.link_pdf_gabungan || il.link_pdf_non_sbo || il.link_pdf_rekapitulasi;

        const excludedKeys = ['id', 'created_at', 'updated_at', 'link_pdf', 'link_lampiran', 'link_pdf_gabungan', 'link_pdf_non_sbo', 'link_pdf_rekapitulasi', 'link_pdf_sph', 'logo', 'link_lampiran_pendukung', 'proyek', 'id_toko', 'lingkup_pekerjaan', 'nomor_ulok', 'nama_toko', 'kode_toko', 'pemberi_persetujuan_koordinator', 'nama_persetujuan_koordinator', 'pemberi_persetujuan_manager', 'nama_persetujuan_manager', 'pemberi_persetujuan_kontraktor', 'nama_persetujuan_kontraktor'];
        const keys = Object.keys(il).filter(k => !excludedKeys.includes(k) && il[k] !== null && il[k] !== '' && String(il[k]).toUpperCase() !== 'NULL' && typeof il[k] !== 'object');

        const fR = (val: any) => {
            if (!val || isNaN(Number(val))) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));
        };

        const getProxyUrl = (url: string) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
            return `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
        };

        return (
            <>
                <div
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[105] transition-opacity animate-in fade-in duration-300"
                    onClick={() => setSelectedILForDrawer(null)}
                />
                <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 z-[110] flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800 text-lg flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-orange-600" />
                            Detail Instruksi Lapangan
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedILForDrawer(null)} className="rounded-full hover:bg-slate-200 text-slate-500">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="mb-6 flex flex-col gap-3">
                            {finalILPdf && (
                                <Button
                                    className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold rounded-xl shadow-md shadow-red-500/20 h-12"
                                    onClick={() => window.open(getProxyUrl(finalILPdf), '_blank')}
                                >
                                    <Download className="w-5 h-5 mr-2" /> Lihat PDF IL
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Toko / ULOK</p>
                                <p className="font-semibold text-slate-900">{selectedProject?.toko?.nama_toko || '-'} ({selectedProject?.toko?.nomor_ulok || '-'})</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Waktu Dibuat</p>
                                <p className="font-semibold text-slate-900">{il.created_at ? formatDateIndo(il.created_at).replace(/ pukul.*$/, '') : '-'}</p>
                            </div>
                            {keys.map((k, i) => {
                                const valStr = String(il[k]);
                                const kl = k.toLowerCase();
                                const isCurrency = valStr.startsWith('Rp') || (!isNaN(Number(il[k])) && Number(il[k]) > 10000 && !kl.includes('tahun') && !kl.includes('hari') && !kl.includes('durasi') && !kl.includes('polis'));
                                const isDate = (kl.includes('tanggal') || kl.includes('waktu') || kl.endsWith('_at')) && isNaN(Number(valStr)) && valStr.length > 8;
                                let displayVal = isCurrency ? fR(il[k]) : valStr;
                                if (isDate) displayVal = formatDateIndo(valStr).replace(/ pukul.*$/, '');
                                if (kl.includes('luas')) displayVal = `${valStr} m2`;
                                if (kl.includes('durasi') || kl === 'hari_denda') displayVal = `${valStr} Hari`;

                                if (kl.includes('waktu_persetujuan_')) {
                                    const role = k.split('waktu_persetujuan_')[1];
                                    const pemberi = il[`pemberi_persetujuan_${role}`] || il[`nama_persetujuan_${role}`] || '-';
                                    displayVal = `Disetujui ${formatDateIndo(valStr).replace(/ pukul.*$/, '')} oleh ${pemberi}`;
                                    return (
                                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Persetujuan {role.replace(/_/g, ' ')}</p>
                                            <p className="font-semibold text-slate-900">{displayVal}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">{k.replace(/_/g, ' ')}</p>
                                        <p className={`font-semibold ${isCurrency ? 'text-emerald-700' : 'text-slate-900'}`}>{displayVal}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderMemoDrawer = () => {
        if (!selectedMemoForDrawer) return null;

        const { project, items, dateKey, pdfUrl: passedPdfUrl } = selectedMemoForDrawer;
        const firstItem = items[0] || {};
        const pdfUrl = passedPdfUrl || firstItem.link_pdf_pengawasan || firstItem.link_pdf || firstItem.berkas_pengawasan?.link_pdf_pengawasan;
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
                        <h3 className="font-semibold text-slate-800 text-lg flex items-center">
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
                                className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold rounded-xl shadow-md shadow-red-500/20 hover:scale-[1.02] transition-all h-12"
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
                                <Download className="w-5 h-5 mr-2" /> Lihat PDF Pengawasan
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nomor ULOK</p>
                                <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.toko?.nomor_ulok || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Toko</p>
                                <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.toko?.nama_toko || '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cabang</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.toko?.cabang || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Proyek</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{project.toko?.proyek || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tanggal Pengawasan</p>
                                <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{tgl ? formatDateIndo(tgl).replace(/ pukul.*$/, '') : '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ID Gantt</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{idGantt}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ID Pengawasan Gantt</p>
                                    <p className="font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{idPengawasanGantt || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };
    const renderILListView = () => {
        const ilDataList = selectedProject?.instruksi_lapangan || [];
        const fR = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

        return (
            <div className="w-full h-full flex flex-col bg-slate-50/20 relative">
                <div className="px-8 pt-8 pb-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Daftar Instruksi Lapangan</h4>
                            <p className="text-sm text-slate-500 font-medium">Total {ilDataList.length} dokumen IL</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        {ilDataList.map((il: any, idx: number) => (
                            <div
                                key={idx}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setSelectedILForDrawer(il)}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-slate-800">IL {idx + 1} <span className="font-normal text-slate-500 mx-2">&middot;</span> {il.created_at ? formatDateIndo(il.created_at).replace(/ pukul.*$/, '') : '-'}</h5>
                                            <p className="text-sm font-bold text-emerald-600 mt-1">{fR(il.grand_total)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-100 pt-4 sm:border-0 sm:pt-0 mt-2 sm:mt-0">
                                    <div className="flex items-center text-sm font-semibold text-slate-400 group-hover:text-orange-600 transition-colors">
                                        Klik untuk melihat detail <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSuratPeringatanList = () => {
        const spList = extraData?.list || [];
        const fR = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

        return (
            <div className="w-full h-full flex flex-col bg-slate-50/20 relative">
                <div className="px-8 pt-8 pb-4">
                    <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Daftar Surat Peringatan
                            </h4>
                            <p className="text-sm text-slate-500 font-medium">Menampilkan {spList.length} surat peringatan aktif</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 md:p-10 pt-4 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        {spList.map((sp: any, idx: number) => (
                            <div
                                key={idx}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group hover:border-red-200 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col gap-3 flex-1 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 group-hover:scale-105 transition-transform">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                                                {sp.nomor_surat || sp.nomor_ulok || 'Surat Peringatan'}
                                                {sp.sp_level && (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 font-bold">
                                                        SP {sp.sp_level}
                                                    </Badge>
                                                )}
                                                <Badge className="bg-slate-100 text-slate-600 border-0">
                                                    {formatStatusLabel(sp.status)}
                                                </Badge>
                                            </h5>
                                            <p className="text-sm font-semibold text-slate-600 mt-1">{sp.nama_kontraktor || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-wrap">
                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDateIndo(sp.created_at)}</div>
                                        {sp.cabang && <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {sp.cabang}</div>}
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Alasan: {sp.alasan_lainnya || sp.alasan_sp?.replace(/_/g, ' ') || '-'}</p>
                                </div>
                                <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t border-slate-100 pt-4 lg:border-0 lg:pt-0 shrink-0">
                                    {sp.link_pdf && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm font-semibold"
                                            onClick={() => viewGeneratedPdfOnline(sp.link_pdf)}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Dokumen
                                        </Button>
                                    )}
                                    <Button
                                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md font-semibold"
                                        onClick={() => window.open(`/surat-peringatan/${sp.id}`, '_blank')}
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Detail
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {spList.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">Tidak ada Surat Peringatan</h3>
                                <p className="text-slate-500 mt-1">Belum ada surat peringatan aktif untuk cabang ini.</p>
                            </div>
                        )}
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
                    {view === 'jhk_pekerjaan_list' && renderJhkPekerjaanList()}
                    {view === 'keterlambatan_list' && renderKeterlambatanList()}
                    {view === 'lingkup_selection' && renderLingkupSelection()}
                    {view === 'il_list_view' && renderILListView()}
                    {view === 'surat_peringatan_list' && renderSuratPeringatanList()}
                    {view === 'timeline' && renderTimeline()}
                    {view === 'detail' && (
                        <div className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {renderDocumentDetail()}
                        </div>
                    )}
                    {renderMemoDrawer()}
                    {renderILDrawer()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DashboardDrilldownModal;
