"use client"

import React, { useEffect, useState, useMemo } from 'react';
import AppNavbar from '@/components/AppNavbar';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Building2, TrendingDown, TrendingUp, Search, ChevronRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ContractorDrilldownModal } from '@/components/dashboard/contractor/ContractorDrilldownModal';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useContractorDashboard } from '@/hooks/useContractorDashboard';

export default function ContractorPerformanceDashboard() {
    const { user, isLoading: isSessionLoading } = useSession();
    const router = useRouter();
    const { isLoading, summary, charts, leaderboard, filters, setFilters } = useContractorDashboard();

    const [isPageLoading, setIsPageLoading] = useState(true);
    
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

    useEffect(() => {
        if (!isSessionLoading && !user) {
            router.push('/auth');
        } else if (user) {
            setIsPageLoading(false);
        }
    }, [user, isSessionLoading, router]);

    if (isPageLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600"></div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat Dashboard Kontraktor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AppNavbar />
            <main className="container mx-auto max-w-[1400px] px-4 py-8">
                {/* Header & Nav */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                                <Building2 className="h-8 w-8 text-emerald-600" />
                                Contractor Performance
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium">
                                Evaluasi performa mitra kerja berdasarkan Denda, SP, dan Kualitas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between gap-4 mb-8 p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100/50">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cari kontraktor..." 
                            className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                            value={filters.search || ''}
                            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                </div>

                {/* KPI Cards (Zona B) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <DashboardCard 
                        title="RATA-RATA DENDA" 
                        value={isLoading ? "..." : formatRupiah(summary?.avg_denda || 0)}
                        icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
                        description="Dari proyek yang bermasalah"
                        gradient="from-rose-50/80 to-white"
                        borderColor="border-rose-100/50"
                        onClick={() => openModalRanking('avg_denda')}
                    />
                    <DashboardCard 
                        title="AVG TELAT" 
                        value={isLoading ? "..." : `${Math.round(summary?.avg_keterlambatan || 0)} Hari`}
                        icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                        description="Keterlambatan penyelesaian"
                        gradient="from-amber-50/80 to-white"
                        borderColor="border-amber-100/50"
                        onClick={() => openModalRanking('avg_keterlambatan')}
                    />
                    <DashboardCard 
                        title="SP AKTIF" 
                        value={isLoading ? "..." : `${summary?.sp_aktif_count || 0} PT`}
                        icon={<Building2 className="h-5 w-5 text-indigo-500" />}
                        description="Kontraktor dalam hukuman"
                        gradient="from-indigo-50/80 to-white"
                        borderColor="border-indigo-100/50"
                        onClick={() => openModalRanking('sp_aktif')}
                    />
                    <DashboardCard 
                        title="AVG KERJA TAMBAH" 
                        value={isLoading ? "..." : formatRupiah(summary?.avg_kerja_tambah || 0)}
                        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                        description="Selisih Opname > SPK"
                        gradient="from-emerald-50/80 to-white"
                        borderColor="border-emerald-100/50"
                        onClick={() => openModalRanking('kerja_tambah')}
                    />
                    <DashboardCard 
                        title="AVG KERJA KURANG" 
                        value={isLoading ? "..." : formatRupiah(summary?.avg_kerja_kurang || 0)}
                        icon={<TrendingDown className="h-5 w-5 text-slate-500" />}
                        description="Selisih SPK > Opname"
                        gradient="from-slate-50/80 to-white"
                        borderColor="border-slate-200/50"
                        onClick={() => openModalRanking('kerja_kurang')}
                    />
                </div>

                {/* Charts (Zona A) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="rounded-3xl border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white/70 backdrop-blur-xl">
                        <CardHeader className="bg-transparent border-b border-slate-100/50 px-6 py-5">
                            <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                Keseimbangan Penawaran vs SPK
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[320px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPenawaran" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSpk" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                                        <Tooltip 
                                            formatter={(value: any) => formatRupiah(value as number)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="penawaran" name="Penawaran" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorPenawaran)" />
                                        <Area type="monotone" dataKey="spk" name="SPK" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSpk)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white/70 backdrop-blur-xl">
                        <CardHeader className="bg-transparent border-b border-slate-100/50 px-6 py-5">
                            <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Keseimbangan SPK vs Opname Final
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[320px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600"></div></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorOpname" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                                        <Tooltip 
                                            formatter={(value: any) => formatRupiah(value as number)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="spk" name="SPK" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSpk)" />
                                        <Area type="monotone" dataKey="opname" name="Opname Final" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOpname)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard Table (Zona C) */}
                <Card className="rounded-3xl border-slate-100/60 shadow-[0_12px_40px_rgb(0,0,0,0.06)] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 px-6 py-5">
                        <CardTitle className="text-sm font-bold tracking-widest text-slate-500 uppercase flex justify-between items-center">
                            <span>Leaderboard Evaluasi Kontraktor</span>
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-semibold">{leaderboard.length} Kontraktor</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/30">
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Kontraktor</th>
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-48">Nilai Toko (Max 100)</th>
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Surat Peringatan</th>
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-40">AVG Design</th>
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-40">AVG Kualitas</th>
                                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-40">AVG Spek</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                {isLoading ? "Memuat data leaderboard..." : "Tidak ada data kontraktor"}
                                            </td>
                                        </tr>
                                    ) : (
                                        leaderboard.map((row, idx) => (
                                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div 
                                                        className="font-bold text-slate-800 cursor-pointer group-hover:text-emerald-600 transition-colors flex items-center gap-2"
                                                        onClick={() => openModalUlok(row.nama_kontraktor)}
                                                    >
                                                        {row.nama_kontraktor}
                                                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div 
                                                        className="cursor-pointer"
                                                        onClick={() => openModalUlok(row.nama_kontraktor)}
                                                    >
                                                        <div className="flex justify-between items-end mb-1.5">
                                                            <span className={cn(
                                                                "font-black text-lg tracking-tight",
                                                                row.avg_nilai_toko >= 80 ? "text-emerald-600" : 
                                                                row.avg_nilai_toko >= 60 ? "text-amber-500" : "text-rose-500"
                                                            )}>{Math.round(row.avg_nilai_toko)}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-1000",
                                                                    row.avg_nilai_toko >= 80 ? "bg-emerald-500" : 
                                                                    row.avg_nilai_toko >= 60 ? "bg-amber-400" : "bg-rose-500"
                                                                )}
                                                                style={{ width: `${Math.min(100, Math.max(0, row.avg_nilai_toko))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div 
                                                        className="inline-flex items-center justify-center min-w-[32px] h-8 px-3 rounded-full bg-rose-50 text-rose-600 font-bold text-sm cursor-pointer hover:bg-rose-100 transition-colors"
                                                        onClick={() => openModalSpHistory(row.nama_kontraktor)}
                                                    >
                                                        {row.history_sp_count}x
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <MetricProgressBar value={row.avg_design} onClick={() => openModalUlok(row.nama_kontraktor)} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <MetricProgressBar value={row.avg_kualitas} onClick={() => openModalUlok(row.nama_kontraktor)} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <MetricProgressBar value={row.avg_spek} onClick={() => openModalUlok(row.nama_kontraktor)} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
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

function MetricProgressBar({ value, onClick }: { value: number, onClick: () => void }) {
    return (
        <div className="cursor-pointer group" onClick={onClick}>
            <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-600 transition-colors">{Math.round(value)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        value >= 80 ? "bg-emerald-400" : 
                        value >= 60 ? "bg-amber-400" : "bg-rose-400"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}

function DashboardCard({ 
    title, value, icon, description, gradient, borderColor, onClick 
}: { 
    title: string; value: string; icon: React.ReactNode; description: string; gradient: string; borderColor: string; onClick: () => void;
}) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "relative group overflow-hidden rounded-3xl border shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 bg-gradient-to-br cursor-pointer",
                gradient, borderColor
            )}
        >
            <div className="p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold tracking-widest text-slate-500">{title}</span>
                    <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100/50">
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{description}</p>
                </div>
            </div>
            {/* Hover Indicator */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </div>
    );
}
