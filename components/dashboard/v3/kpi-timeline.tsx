import React, { useEffect, useState } from 'react';
import { fetchDashboardAll } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import { formatRupiah } from '@/lib/utils';
import { CheckCircle2, Clock, Activity, HardHat, FileCheck, Search, FileText, Loader2, ExternalLink } from 'lucide-react';

export function KpiTimeline({ nomor_ulok }: { nomor_ulok: string }) {
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const res = await fetchDashboardAll(nomor_ulok);
                if (res?.status === 'success' && res.data && res.data.length > 0) {
                    setProject(res.data[0]);
                }
            } catch (error) {
                console.error("Failed to load project for timeline", error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [nomor_ulok]);

    const getProxyUrl = (url: string) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
        return `${API_URL.replace(/\/$/, "")}/api/denda/actions/proxy-file?url=${encodeURIComponent(url)}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                <p className="text-sm font-medium text-slate-500">Memuat Timeline Projek...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center p-10">
                <p className="text-sm font-medium text-slate-500">Data projek tidak ditemukan untuk timeline.</p>
            </div>
        );
    }

    const nodes: any[] = [];
    const proj = project;
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
        isCompleted: hasRab,
        url: hasRab ? proj.rab[0].link_pdf_gabungan : null
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
        isCompleted: hasSpk,
        url: hasSpk ? proj.spk[0].link_pdf : null
    });

    // 3. Tambah SPK (Only if exists)
    let spkTs = hasSpk ? proj.spk[0].pertambahan_spk : null;
    if (spkTs && spkTs.length > 0) {
        const t = spkTs[0];
        nodes.push({
            type: 'Tambah SPK',
            title: `Tambah SPK${suffix}`,
            desc: `${t.pertambahan_hari} Hari`,
            icon: <Clock className="w-5 h-5"/>,
            color: 'cyan',
            data: t,
            isActive: true,
            isCompleted: true,
            url: t.link_pdf
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
            isCompleted: true,
            url: proj.instruksi_lapangan[0].link_pdf_gabungan
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
        isCompleted: pSelesai,
        url: null
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
        isCompleted: hasParsial,
        url: parsialData?.link_pdf_opname
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
        isCompleted: hasST,
        url: hasST ? proj.berkas_serah_terima[0].link_pdf : null
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
        isCompleted: hasFinal,
        url: hasFinal ? opnameFinal[0].link_pdf_opname : null
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
        isCompleted: isProyekSelesai,
        url: null
    });

    const getColorClasses = (color: string, isActive: boolean, isCompleted: boolean) => {
        if (!isActive) return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', dot: 'bg-slate-300' };
        const maps: any = {
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
            cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', dot: 'bg-cyan-500' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' },
            sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', dot: 'bg-sky-500' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
            teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', dot: 'bg-teal-500' },
            slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500' }
        };
        return maps[color] || maps.slate;
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="mb-4 flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <h4 className="text-xl font-bold tracking-tight text-slate-900">Timeline Projek</h4>
                </div>
            </div>
            
            <div className="w-full max-w-4xl relative pb-10 mt-6">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-100 -translate-x-1/2 rounded-full hidden md:block"></div>
                
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-100 rounded-full md:hidden"></div>

                <div className="space-y-4 md:space-y-10">
                    {nodes.map((node, idx) => {
                        const isEven = idx % 2 === 0;
                        const colors = getColorClasses(node.color, node.isActive, node.isCompleted);
                        return (
                            <div key={idx} className={`relative flex items-center md:justify-between w-full group ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                
                                <div className="hidden md:block w-[45%]"></div>

                                <div className={`absolute left-8 md:left-1/2 w-8 h-8 rounded-full border-4 border-white ${colors.dot} -translate-x-1/2 flex items-center justify-center shadow-md z-10 transition-transform group-hover:scale-125`}>
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>

                                <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                                    <div className={`p-5 rounded-2xl border bg-white shadow-sm transition-all duration-300 ${node.isActive ? 'hover:shadow-lg hover:-translate-y-1' : 'opacity-60'} ${colors.border}`}>
                                        <div className={`flex items-center gap-3 mb-2 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                                                {node.icon}
                                            </div>
                                            <h4 className={`font-bold text-lg ${node.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{node.title}</h4>
                                        </div>
                                        <div className={`flex items-center justify-between mt-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                            <p className={`font-semibold ${node.isActive ? colors.text : 'text-slate-400'}`}>
                                                {node.desc}
                                            </p>
                                            
                                            {node.url && (
                                                <a 
                                                    href={getProxyUrl(node.url)} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Lihat Dokumen
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
