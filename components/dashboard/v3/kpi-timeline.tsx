import React, { useEffect, useState } from 'react';
import { fetchDashboardAll } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import { formatRupiah } from '@/lib/utils';
import { CheckCircle2, Clock, Activity, HardHat, FileCheck, Search, FileText, Loader2, ExternalLink, ChevronDown } from 'lucide-react';

export function KpiTimeline({ nomor_ulok }: { nomor_ulok: string }) {
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedNode, setExpandedNode] = useState<number | null>(null);

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
    
    let ilSubItems: any[] = [];
    if (hasIL) {
        ilSubItems = proj.instruksi_lapangan.filter((il: any) => il.link_pdf_gabungan || il.link_pdf_non_sbo).map((il: any, idx: number) => ({
            title: `Instruksi Lapangan ${idx + 1}`,
            desc: new Date(il.created_at).toLocaleDateString('id-ID'),
            url: il.link_pdf_gabungan || il.link_pdf_non_sbo
        }));
        
        nodes.push({
            type: 'IL_ROOT',
            title: `Instruksi Lapangan${suffix}`,
            desc: formatRupiah(totalIL),
            icon: <Activity className="w-5 h-5"/>,
            color: 'orange',
            data: { isILRoot: true, projectData: proj },
            isActive: true,
            isCompleted: true,
            url: null,
            subItems: ilSubItems.length > 0 ? ilSubItems : undefined
        });
    }

    // 5. Pengawasan
    let hasPengawasan = false;
    let pengawasanProgress = 0, pengawasanTerlambat = 0;
    
    const pengawasanSubItems: any[] = [];
    let bpList: any[] = [];
    
    const grouped = (proj.gantt || []).reduce((acc: any, g: any) => {
        if (g.berkas_pengawasan && Array.isArray(g.berkas_pengawasan)) {
            bpList = bpList.concat(g.berkas_pengawasan);
        }
        
        if (g.pengawasan && Array.isArray(g.pengawasan) && g.pengawasan.length > 0) {
            hasPengawasan = true;
            g.pengawasan.forEach((pw: any) => {
                let dateKey = pw.tanggal_pengawasan || pw.created_at || 'unknown';
                if (typeof dateKey === 'string') dateKey = dateKey.split(/[T ]/)[0];
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(pw);
                
                const matchPdf = bpList.find(bp => bp.id_pengawasan_gantt === pw.id_pengawasan_gantt || bp.id_pengawasan_gantt === pw.id_gantt);
                
                let pendingPdfUrl = null;
                if (proj.pengawasan_pdf_pending && Array.isArray(proj.pengawasan_pdf_pending)) {
                    const pendingMatch = proj.pengawasan_pdf_pending.find((p: any) =>
                        p.tanggal_pengawasan === pw.tanggal_pengawasan || p.tanggal_pengawasan === dateKey
                    );
                    if (pendingMatch) {
                        pendingPdfUrl = pendingMatch.link_pdf_pengawasan;
                    }
                }
                
                let pengawasanUrl = pendingPdfUrl || matchPdf?.link_pdf_pengawasan || pw.dokumentasi || pw.dokumentasi_base64 || null;
                
                pengawasanSubItems.push({
                    title: `Pengawasan - Progress: ${pw.status || '-'}`,
                    desc: new Date(dateKey !== 'unknown' ? dateKey : pw.created_at).toLocaleDateString('id-ID'),
                    url: pengawasanUrl,
                    createdAt: new Date(pw.created_at).getTime(),
                    idGantt: g.id
                });
            });
        }
        return acc;
    }, {});
    
    pengawasanSubItems.sort((a, b) => a.createdAt - b.createdAt);

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
        url: null,
        subItems: pengawasanSubItems.length > 0 ? pengawasanSubItems : undefined
    });

    // 6. Opname Parsial
    const allOpnames = proj.opname_final || [];
    const opnameParsial = allOpnames.filter((o: any) => o.tipe_opname === 'OPNAME' || o.tipe_opname === 'OPNAME_FINAL' || o.tipe_opname === 'KTK');
    const hasParsial = opnameParsial.length > 0;
    const parsialData = hasParsial ? opnameParsial[0] : null;
    const parsialTotal = parsialData ? (parsialData.grand_total_final || parsialData.grand_total_ktk || parsialData.grand_total_opname || parsialData.nilai_opname || 0) : 0;
    
    // Fallback to Opname Final / KTK document if parsial document is missing
    const finalDataFallback = allOpnames.find((o: any) => o.tipe_opname === 'OPNAME_FINAL' || o.tipe_opname === 'KTK');
    
    let parsialSubItems: any[] = [];
    if (hasParsial) {
        parsialSubItems = opnameParsial.map((op: any, idx: number) => ({
            title: `Opname Parsial ${idx + 1}`,
            desc: new Date(op.created_at).toLocaleDateString('id-ID'),
            url: op.link_pdf_opname || finalDataFallback?.link_pdf_opname || null
        }));
    }
    
    nodes.push({
        type: 'Opname Parsial',
        title: `Opname Parsial${suffix}`,
        desc: hasParsial ? formatRupiah(parsialTotal) : 'Belum Tersedia',
        icon: <Activity className="w-5 h-5"/>,
        color: hasParsial ? 'sky' : 'slate',
        data: parsialData,
        isActive: hasParsial,
        isCompleted: hasParsial,
        url: null,
        subItems: parsialSubItems.length > 0 ? parsialSubItems : undefined
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

                <div className="space-y-4 md:space-y-6">
                    {nodes.map((node, idx) => {
                        const isEven = idx % 2 === 0;
                        const colors = getColorClasses(node.color, node.isActive, node.isCompleted);
                        const hasSubItems = node.subItems && node.subItems.length > 0;
                        const isExpanded = expandedNode === idx;
                        
                        const CardContent = (
                            <div className={`p-3.5 rounded-xl border bg-white shadow-sm transition-all duration-300 ${node.isActive ? (node.url || hasSubItems ? 'hover:shadow-md hover:-translate-y-1 hover:border-blue-300 cursor-pointer' : 'hover:shadow-md hover:-translate-y-1') : 'opacity-60'} ${colors.border}`}>
                                <div className={`flex items-center justify-between gap-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                                            {node.icon && React.cloneElement(node.icon as React.ReactElement<{ className: string }>, { className: 'w-4 h-4' })}
                                        </div>
                                        <div className={`flex flex-col ${isEven ? 'md:items-end' : 'items-start'}`}>
                                            <h4 className={`font-bold text-sm ${node.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{node.title}</h4>
                                            <p className={`font-semibold text-xs mt-0.5 ${node.isActive ? colors.text : 'text-slate-400'}`}>
                                                {node.desc}
                                            </p>
                                        </div>
                                    </div>
                                    {node.url && !hasSubItems && (
                                        <ExternalLink className={`w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 ${isEven ? 'md:rotate-180' : ''}`} />
                                    )}
                                    {hasSubItems && (
                                        <ChevronDown className={`w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                                
                                {hasSubItems && isExpanded && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                        {node.subItems.map((sub: any, sIdx: number) => {
                                            const SubContent = (
                                               <div className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-100 ${sub.url ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer' : 'bg-slate-50 opacity-80'} transition-colors ${isEven ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
                                                   <div className="flex flex-col">
                                                       <span className="text-sm font-bold text-slate-700">{sub.title}</span>
                                                       <span className="text-xs text-slate-500">{sub.desc}</span>
                                                   </div>
                                                   {sub.url && <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                               </div>
                                            );
                                            return sub.url ? (
                                                <a key={sIdx} href={getProxyUrl(sub.url)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    {SubContent}
                                                </a>
                                            ) : (
                                                <div key={sIdx} onClick={(e) => e.stopPropagation()}>
                                                    {SubContent}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );

                        return (
                            <div key={idx} className={`relative flex items-center md:justify-between w-full group ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                
                                <div className="hidden md:block w-[45%]"></div>

                                <div className={`absolute left-8 md:left-1/2 w-5 h-5 rounded-full border-[3px] border-white ${colors.dot} -translate-x-1/2 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-125`}>
                                </div>

                                <div className={`w-full md:w-[45%] pl-14 md:pl-0 ${isEven ? 'md:pr-10 md:text-right' : 'md:pl-10'}`}>
                                    {node.url && !hasSubItems ? (
                                        <a href={getProxyUrl(node.url)} target="_blank" rel="noreferrer" className="block outline-none">
                                            {CardContent}
                                        </a>
                                    ) : hasSubItems ? (
                                        <div onClick={() => setExpandedNode(isExpanded ? null : idx)} className="block outline-none">
                                            {CardContent}
                                        </div>
                                    ) : (
                                        CardContent
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
