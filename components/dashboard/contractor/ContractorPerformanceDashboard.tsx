"use client"

import React, { useState } from 'react';
import { Building2, TrendingDown, TrendingUp, Search, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, FileText, BarChart3, LineChart } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ContractorDrilldownModal } from '@/components/dashboard/contractor/ContractorDrilldownModal';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useContractorDashboard } from '@/hooks/useContractorDashboard';
import { Card } from '@/components/ui/card';

export default function ContractorPerformanceDashboard() {
    const { isLoading, summary, charts, leaderboard, filters, setFilters } = useContractorDashboard();
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLayer, setModalLayer] = useState<'RANKING' | 'SP_HISTORY' | 'ULOK_LIST' | 'SCOPE' | 'DETAIL'>('RANKING');
    const [modalMetric, setModalMetric] = useState<string | undefined>();
    const [modalKontraktor, setModalKontraktor] = useState<string | undefined>();

    const openModalRanking = (metric: string) => {
        setModalLayer('RANKING');
        setModalMetric(metric);
        setModalKontraktor(undefined);
        setIsModalOpen(true);
    };

    const openModalSpHistory = (kontraktor: string) => {
        setModalLayer('SP_HISTORY');
        setModalMetric(undefined);
        setModalKontraktor(kontraktor);
        setIsModalOpen(true);
    };
    
    const openModalUlok = (kontraktor: string) => {
        setModalLayer('ULOK_LIST');
        setModalMetric(undefined);
        setModalKontraktor(kontraktor);
        setIsModalOpen(true);
    };

    // Derived Metrics
    const globalAvgNilaiToko = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_nilai_toko, 0) / leaderboard.length) : 0;
    const globalAvgDesign = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_design, 0) / leaderboard.length) : 0;
    const globalTotalSp = leaderboard.reduce((acc, curr) => acc + curr.history_sp_count, 0);

    // Keseimbangan SPK (sum of all opname vs SPK in charts)
    const totalSpkBulanIni = charts.length > 0 ? charts[charts.length - 1].spk : 0;
    
    // Keseimbangan Penawaran vs SPK %
    const totalPenawaran = charts.reduce((acc, curr) => acc + curr.penawaran, 0);
    const totalSpk = charts.reduce((acc, curr) => acc + curr.spk, 0);
    const penawaranSelisihPct = totalPenawaran > 0 ? ((totalPenawaran - totalSpk) / totalPenawaran) * 100 : 0;

    return (
        <div className="h-full overflow-y-auto bg-[#F8FAFC] p-4 lg:p-8">
            <main className="mx-auto max-w-[1400px]">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-emerald-600" />
                        Performance Kontraktor
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">
                        Metrik performa, kepatuhan, dan kualitas eksekusi dari seluruh mitra kontraktor.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cari kontraktor..." 
                            className="pl-9 bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500 rounded-xl"
                            value={filters.search || ''}
                            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Top Grid (Sparklines) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative group">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-slate-500">Keseimbangan Penawaran vs SPK</span>
                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><LineChart className="w-4 h-4" /></div>
                            </div>
                            <div className="text-3xl font-black text-slate-800 tracking-tight">
                                {isLoading ? "..." : `${penawaranSelisihPct > 0 ? '+' : ''}${penawaranSelisihPct.toFixed(1)}%`}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Rata-rata selisih Penawaran dengan SPK (All Time)</div>
                        </div>
                        <div className="h-[100px] w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPenawaran" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="penawaran" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorPenawaran)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative group">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-slate-500">Keseimbangan Nominal SPK</span>
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><BarChart3 className="w-4 h-4" /></div>
                            </div>
                            <div className="text-3xl font-black text-slate-800 tracking-tight">
                                {isLoading ? "..." : formatRupiah(totalSpkBulanIni)}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-1">Total SPK berjalan bulan ini</div>
                        </div>
                        <div className="h-[100px] w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSpk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="spk" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorSpk)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                    </div>
                </div>

                {/* Metrics Grid 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
                    <MetricCard 
                        title="Avg Denda Keterlambatan" 
                        value={isLoading ? "..." : formatRupiah(summary?.avg_denda || 0)} 
                        subtext="Rata-rata denda proyek bermasalah" 
                        trend="up"
                        onClick={() => openModalRanking('avg_denda')}
                    />
                    <MetricCard 
                        title="Avg Keterlambatan" 
                        value={isLoading ? "..." : `${Math.round(summary?.avg_keterlambatan || 0)} Hari`} 
                        subtext="Keterlambatan penyelesaian" 
                        trend="up"
                        onClick={() => openModalRanking('avg_keterlambatan')}
                    />
                    <MetricCard 
                        title="Surat Peringatan" 
                        value={isLoading ? "..." : `${globalTotalSp} SP`} 
                        subtext="Total SP yang pernah diterbitkan" 
                        trend="neutral"
                        noHover
                    />
                    <MetricCard 
                        title="Kontraktor SP Aktif" 
                        value={isLoading ? "..." : `${summary?.sp_aktif_count || 0} Mitra`} 
                        subtext="Saat ini sedang dalam masa SP" 
                        trend="up"
                        onClick={() => openModalRanking('sp_aktif')}
                    />
                </div>

                {/* Metrics Grid 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                    <MetricCard 
                        title="Kerja Tambah (Avg)" 
                        value={isLoading ? "..." : `+ ${formatRupiah(summary?.avg_kerja_tambah || 0)}`} 
                        subtext="Selisih Opname > SPK" 
                        trend="up"
                        onClick={() => openModalRanking('kerja_tambah')}
                    />
                    <MetricCard 
                        title="Kerja Kurang (Avg)" 
                        value={isLoading ? "..." : `- ${formatRupiah(summary?.avg_kerja_kurang || 0)}`} 
                        subtext="Selisih SPK > Opname" 
                        trend="down"
                        onClick={() => openModalRanking('kerja_kurang')}
                    />
                    <MetricCard 
                        title="Avg Nilai Toko" 
                        value={isLoading ? "..." : globalAvgNilaiToko.toFixed(1)} 
                        subtext="Skor kepuasan & kelengkapan (Max 100)" 
                        trend="neutral"
                        noHover
                    />
                    <MetricCard 
                        title="Kepatuhan Design" 
                        value={isLoading ? "..." : `${globalAvgDesign.toFixed(0)}%`} 
                        subtext="Sesuai dengan standar SBO" 
                        trend="neutral"
                        noHover
                    />
                </div>

                {/* Table Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Breakdown Kualitas & Kepatuhan per Kontraktor</h2>
                        <Badge variant="outline" className="bg-white text-slate-600">{leaderboard.length} Mitra</Badge>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Nama Kontraktor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status SP</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-48">Nilai Toko</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Design</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Kualitas</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Spek</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Total SP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            {isLoading ? "Memuat data..." : "Tidak ada data kontraktor"}
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((row, idx) => {
                                        // Simple logic for SP active status (mocked slightly based on history for now since we don't have active SP flag in leaderboard row)
                                        const spStatus = row.history_sp_count > 0 ? "SP Pernah Aktif" : "Aman";
                                        const isSpActive = row.history_sp_count > 0; // Ideally backend sends current active SP count per contractor
                                        
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                                                <td className="px-6 py-4 border-b border-slate-50">
                                                    <div 
                                                        className="font-bold text-slate-800 cursor-pointer group-hover:text-emerald-600 transition-colors flex items-center gap-2"
                                                        onClick={() => openModalUlok(row.nama_kontraktor)}
                                                    >
                                                        {row.nama_kontraktor}
                                                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-slate-50">
                                                    <Badge variant="outline" className={cn(
                                                        "font-semibold",
                                                        isSpActive ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    )}>
                                                        {spStatus}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 border-b border-slate-50 cursor-pointer" onClick={() => openModalUlok(row.nama_kontraktor)}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={cn(
                                                            "font-black text-base",
                                                            row.avg_nilai_toko >= 80 ? "text-emerald-600" : row.avg_nilai_toko >= 60 ? "text-amber-500" : "text-rose-500"
                                                        )}>{row.avg_nilai_toko.toFixed(1)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                row.avg_nilai_toko >= 80 ? "bg-emerald-500" : row.avg_nilai_toko >= 60 ? "bg-amber-400" : "bg-rose-500"
                                                            )}
                                                            style={{ width: `${Math.min(100, Math.max(0, row.avg_nilai_toko))}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-slate-50 font-medium text-slate-600">{Math.round(row.avg_design)}% Sesuai</td>
                                                <td className="px-6 py-4 border-b border-slate-50 font-medium text-slate-600">{Math.round(row.avg_kualitas)}% Sesuai</td>
                                                <td className="px-6 py-4 border-b border-slate-50 font-medium text-slate-600">{Math.round(row.avg_spek)}% Sesuai</td>
                                                <td className="px-6 py-4 border-b border-slate-50">
                                                    <div 
                                                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                                                        onClick={() => openModalSpHistory(row.nama_kontraktor)}
                                                    >
                                                        {row.history_sp_count}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <ContractorDrilldownModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                token={""}
                initialLayer={modalLayer}
                initialMetric={modalMetric}
                initialKontraktor={modalKontraktor}
                filters={filters}
            />
        </div>
    );
}

function MetricCard({ 
    title, value, subtext, trend, onClick, noHover 
}: { 
    title: string; value: string; subtext: string; trend: 'up' | 'down' | 'neutral'; onClick?: () => void; noHover?: boolean;
}) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm relative group",
                !noHover && "cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all hover:-translate-y-0.5"
            )}
        >
            <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] font-semibold text-slate-500">{title}</span>
                {!noHover && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />}
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">{value}</div>
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
                {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />}
                {subtext}
            </div>
        </div>
    );
}
