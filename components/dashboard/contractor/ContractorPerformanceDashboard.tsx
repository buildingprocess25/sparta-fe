"use client"

import React, { useState } from 'react';
import { Building2, TrendingDown, TrendingUp, Search, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, AlertTriangle, FileText, BarChart3, LineChart, ChevronsUpDown } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ContractorDrilldownModal } from '@/components/dashboard/contractor/ContractorDrilldownModal';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, cn } from '@/lib/utils';
import { getParentBranch } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { useContractorDashboard } from '@/hooks/useContractorDashboard';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSession } from '@/context/SessionContext';

const formatContractorChartLabel = (val: string, maxLen = 32) => {
    if (!val) return '';
    if (val.length <= maxLen) return val;

    const lastDashIdx = val.lastIndexOf(' - ');
    if (lastDashIdx !== -1) {
        const contractor = val.substring(0, lastDashIdx);
        const branch = val.substring(lastDashIdx);
        const allowedContractorLen = maxLen - branch.length - 1;
        if (allowedContractorLen > 6) {
            return `${contractor.substring(0, allowedContractorLen)}…${branch}`;
        }
    }

    return val.substring(0, maxLen - 1) + '…';
};

export default function ContractorPerformanceDashboard() {
    const { user } = useSession();
    const { isLoading, summary, charts, leaderboard, allSpHistory, balanceChart, filters, setFilters, availableCabangs, availableKontraktors } = useContractorDashboard();

    const [openKontraktor, setOpenKontraktor] = useState(false);
    const [searchKontraktor, setSearchKontraktor] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Pagination State for Balance Chart
    const [chartPage, setChartPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLayer, setModalLayer] = useState<'RANKING' | 'SP_HISTORY' | 'SP_ACTIVE_ALL' | 'SP_SINGLE' | 'ULOK_LIST' | 'SCOPE' | 'DETAIL' | 'SEARCH_RESULTS'>('RANKING');
    const [modalSearchQuery, setModalSearchQuery] = useState<string | undefined>();
    const [modalMetric, setModalMetric] = useState<string | undefined>();
    const [modalKontraktor, setModalKontraktor] = useState<string | undefined>();
    const [modalSpData, setModalSpData] = useState<any>(undefined);

    const openModalRanking = (metric: string) => {
        const isContractorUser = user?.roles.some(r => r.includes('KONTRAKTOR'));
        const selectedKontraktor = (filters.kontraktor && filters.kontraktor !== 'ALL') ? filters.kontraktor : undefined;

        if (isContractorUser) {
            // Bypass Ranking, go direct to Ulok List for the logged-in contractor
            setModalLayer('ULOK_LIST');
            setModalMetric(metric);
            setModalKontraktor(user?.namaPt || user?.namaLengkap);
            setIsModalOpen(true);
            return;
        }

        if (selectedKontraktor) {
            if (metric === 'sp_aktif') {
                setModalLayer('SP_ACTIVE_ALL' as any);
                setModalMetric(metric);
                setModalKontraktor(selectedKontraktor);
                setIsModalOpen(true);
                return;
            }

            // Bypass Ranking if a specific contractor is already filtered globally
            setModalLayer('ULOK_LIST');
            setModalMetric(metric);
            setModalKontraktor(selectedKontraktor);
            setIsModalOpen(true);
            return;
        }

        if (metric === 'sp_aktif') {
            setModalLayer('SP_ACTIVE_ALL' as any);
            setModalMetric(metric);
            setModalKontraktor(undefined);
            setIsModalOpen(true);
            return;
        }

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

    const openModalSpSingle = (spData: any) => {
        setModalLayer('SP_SINGLE' as any);
        setModalMetric(undefined);
        setModalKontraktor(undefined);
        setModalSpData(spData);
        setIsModalOpen(true);
    };

    const openModalUlok = (kontraktor: string, metric?: string) => {
        setModalLayer('ULOK_LIST');
        setModalMetric(metric);
        setModalKontraktor(kontraktor);
        setIsModalOpen(true);
    };

    // Derived Metrics
    const globalAvgNilaiToko = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_nilai_toko, 0) / leaderboard.length) : 0;
    const globalAvgDesign = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_design, 0) / leaderboard.length) : 0;
    const globalAvgKualitas = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_kualitas, 0) / leaderboard.length) : 0;
    const globalAvgSpek = leaderboard.length > 0 ? (leaderboard.reduce((acc, curr) => acc + curr.avg_spek, 0) / leaderboard.length) : 0;
    const globalTotalSp = leaderboard.reduce((acc, curr) => acc + curr.history_sp_count, 0);

    return (
        <div className="h-full overflow-y-auto bg-slate-50/50 font-sans relative">
            <main className="pb-8 relative">
                
                {/* 1. Sticky Header & Filters Section */}
                <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md transition-all duration-300 px-4 lg:px-8 pb-4 pt-6">
                    <div className="max-w-[1400px] mx-auto space-y-4">
                        {/* Title Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Performance Kontraktor</h1>
                                <span className="px-2.5 py-0.5 rounded bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                    LIVE
                                </span>
                            </div>
                            <button
                                onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm text-[13px] font-semibold"
                            >
                                <Search className="w-4 h-4 text-slate-400" />
                                {isHeaderVisible ? "Sembunyikan Filter" : "Tampilkan Filter"}
                            </button>
                        </div>

                        {/* Filter Container */}
                        {isHeaderVisible && (
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 p-2 bg-white border border-slate-200/80 rounded-2xl w-full animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                                
                                {/* Search Input */}
                                <div className="relative w-full lg:flex-1 lg:min-w-[280px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        placeholder="Cari Kontraktor, atau Enter..."
                                        className="w-full h-9 pl-9 pr-4 bg-transparent hover:bg-slate-50/50 focus:bg-slate-50/50 border border-slate-200/70 rounded-xl text-[13px] font-medium outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-slate-400"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchInput.trim()) {
                                                e.preventDefault();
                                                setModalSearchQuery(searchInput);
                                                setModalLayer('SEARCH_RESULTS');
                                                setModalMetric('search_all');
                                                setModalKontraktor(undefined);
                                                setIsModalOpen(true);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Kontraktor Popover */}
                                <Popover open={openKontraktor} onOpenChange={setOpenKontraktor}>
                                    <PopoverTrigger asChild>
                                        <button className="h-9 px-3 relative bg-white border border-slate-200/70 hover:bg-slate-50 rounded-xl text-[13px] font-semibold text-slate-600 flex items-center justify-between transition-colors min-w-[170px]">
                                            <span className="truncate max-w-[130px] text-left">
                                                {filters.kontraktor === 'ALL' || !filters.kontraktor ? 'Semua Kontraktor' : filters.kontraktor}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full sm:w-72 p-0 rounded-2xl shadow-xl border-slate-100" align="start">
                                        <div className="p-3 border-b border-slate-100">
                                            <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Search className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                                                <input
                                                    placeholder="Cari kontraktor..."
                                                    className="w-full bg-transparent outline-none text-[13px] font-medium"
                                                    value={searchKontraktor}
                                                    onChange={e => setSearchKontraktor(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
                                            <div
                                                className={cn(
                                                    "px-3 py-2 text-[13px] rounded-xl cursor-pointer transition-colors font-medium",
                                                    (!filters.kontraktor || filters.kontraktor === 'ALL') ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-600"
                                                )}
                                                onClick={() => { setFilters({ ...filters, kontraktor: 'ALL' }); setOpenKontraktor(false); }}
                                            >
                                                Semua Kontraktor
                                            </div>
                                            {availableKontraktors
                                                .filter(k => k.toLowerCase().includes(searchKontraktor.toLowerCase()))
                                                .map(k => (
                                                    <div
                                                        key={k}
                                                        className={cn(
                                                            "px-3 py-2 text-[13px] rounded-xl cursor-pointer transition-colors truncate font-medium",
                                                            filters.kontraktor === k ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-600"
                                                        )}
                                                        onClick={() => { setFilters({ ...filters, kontraktor: k }); setOpenKontraktor(false); }}
                                                        title={k}
                                                    >
                                                        {k}
                                                    </div>
                                                ))}
                                            {availableKontraktors.filter(k => k.toLowerCase().includes(searchKontraktor.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-4 text-[13px] text-center text-slate-400 font-medium">
                                                    Tidak ditemukan
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Select Proyek */}
                                <div className="relative border border-slate-200/70 rounded-xl hover:bg-slate-50 transition-colors bg-white">
                                    <select
                                        className="h-9 pl-3 pr-8 bg-transparent text-[13px] font-semibold text-slate-600 outline-none appearance-none cursor-pointer min-w-[140px]"
                                        value={filters.proyek || 'ALL'}
                                        onChange={(e) => setFilters(p => ({ ...p, proyek: e.target.value }))}
                                    >
                                        <option value="ALL">Semua Proyek</option>
                                        <option value="REGULER">Reguler</option>
                                        <option value="RENOVASI">Renovasi</option>
                                    </select>
                                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>

                                {/* Select Bangunan (Ruko / Non Ruko) */}
                                <div className="relative border border-slate-200/70 rounded-xl hover:bg-slate-50 transition-colors bg-white">
                                    <select 
                                        className="h-9 pl-3 pr-8 bg-transparent text-[13px] font-semibold text-slate-600 outline-none appearance-none cursor-pointer min-w-[150px]"
                                        value={filters.bangunan || 'ALL'}
                                        onChange={(e) => setFilters(p => ({ ...p, bangunan: e.target.value }))}
                                    >
                                        <option value="ALL">Semua Bangunan</option>
                                        <option value="RUKO">Ruko</option>
                                        <option value="NON RUKO">Non Ruko</option>
                                    </select>
                                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>

                                {/* Select Cabang */}
                                {availableCabangs && availableCabangs.length > 0 && (
                                    <div className="relative border border-slate-200/70 rounded-xl hover:bg-slate-50 transition-colors bg-white">
                                        <select
                                            className="h-9 pl-3 pr-8 bg-transparent text-[13px] font-semibold text-slate-600 outline-none appearance-none cursor-pointer min-w-[140px]"
                                            value={filters.cabang || 'ALL'}
                                            onChange={(e) => setFilters(p => ({ ...p, cabang: e.target.value }))}
                                        >
                                            <option value="ALL">Semua Cabang</option>
                                            {availableCabangs.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 lg:px-8 mt-2 space-y-8 max-w-[1400px] mx-auto">
                    {/* 2. Metrics Grid (4-Column layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Row 1 */}
                        <ModernMetricCard
                            title="Rata-rata Denda"
                            mainValue={isLoading ? "..." : formatRupiah(summary?.avg_denda || 0)}
                            subValue={isLoading ? "..." : `Total: ${formatRupiah(summary?.total_denda || 0)}`}
                            icon={AlertCircle}
                            colorScheme="rose"
                            onClick={() => openModalRanking('avg_denda')}
                        />
                        <ModernMetricCard
                            title="Rata-rata Keterlambatan"
                            mainValue={isLoading ? "..." : `${Math.round(summary?.avg_keterlambatan || 0)} Hari`}
                            subValue={isLoading ? "..." : `Total: ${summary?.total_keterlambatan || 0} ULOK lambat`}
                            icon={AlertTriangle}
                            colorScheme="amber"
                            onClick={() => openModalRanking('avg_keterlambatan')}
                        />
                        <ModernMetricCard
                            title="Kontraktor SP Aktif"
                            mainValue={isLoading ? "..." : `${summary?.sp_aktif_count || 0}`}
                            subValue="Kontraktor dalam masa peringatan"
                            icon={FileText}
                            colorScheme="orange"
                            onClick={() => openModalRanking('sp_aktif')}
                        />
                        <ModernMetricCard
                            title="Rata-rata Kerja Tambah"
                            mainValue={isLoading ? "..." : formatRupiah(summary?.avg_kerja_tambah || 0)}
                            subValue={isLoading ? "..." : `Total: ${formatRupiah(summary?.total_kerja_tambah || 0)}`}
                            icon={TrendingUp}
                            colorScheme="indigo"
                            onClick={() => openModalRanking('kerja_tambah')}
                        />

                        {/* Row 2 */}
                        <ModernMetricCard
                            title="Rata-rata Kerja Kurang"
                            mainValue={isLoading ? "..." : formatRupiah(summary?.avg_kerja_kurang || 0)}
                            subValue={isLoading ? "..." : `Total: ${formatRupiah(summary?.total_kerja_kurang || 0)}`}
                            icon={TrendingDown}
                            colorScheme="teal"
                            onClick={() => openModalRanking('kerja_kurang')}
                        />

                        {/* Penilaian Toko (White with Emerald Accents) */}
                        <div 
                            onClick={() => openModalRanking('evaluasi_toko')}
                            className="col-span-1 md:col-span-1 lg:col-span-3 bg-white rounded-[24px] p-8 border border-slate-200/70 shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
                        >
                            {/* Subtle background color effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-200/50 transition-colors duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-50/50 rounded-full blur-2xl -ml-20 -mb-20 group-hover:bg-teal-100/50 transition-colors duration-500"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center h-full gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-400 tracking-widest uppercase text-[11px]">Primary Metric</h3>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-1.5 text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">Penilaian Toko</h2>
                                    <p className="text-slate-500 text-[14px] font-medium leading-relaxed max-w-sm">Penilaian keseluruhan komponen bangunan toko berdasarkan standar kelayakan Alfamart.</p>
                                </div>
                                
                                <div className="flex flex-wrap md:flex-nowrap items-center gap-8 lg:gap-12">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-bold text-[12px] uppercase tracking-wider mb-1">Nilai Toko</span>
                                        <span className="text-5xl font-bold tracking-tighter text-emerald-600 drop-shadow-sm">{isLoading ? "..." : globalAvgNilaiToko.toFixed(1)}</span>
                                    </div>
                                    <div className="w-px h-14 bg-slate-200 hidden md:block"></div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Desain</span>
                                        <span className="text-[28px] font-bold text-slate-700 tracking-tight">{isLoading ? "..." : `${globalAvgDesign.toFixed(0)}%`}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Kualitas</span>
                                        <span className="text-[28px] font-bold text-slate-700 tracking-tight">{isLoading ? "..." : `${globalAvgKualitas.toFixed(0)}%`}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Spek</span>
                                        <span className="text-[28px] font-bold text-slate-700 tracking-tight">{isLoading ? "..." : `${globalAvgSpek.toFixed(0)}%`}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Surat Peringatan Table */}
                    <div className="bg-white rounded-[24px] border border-slate-200/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-rose-50 rounded-[14px]">
                                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Riwayat Surat Peringatan</h2>
                                    <p className="text-sm font-medium text-slate-500">Total {globalTotalSp} SP diterbitkan secara keseluruhan</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Kontraktor</th>
                                        <th className="px-6 py-4 font-bold">Status SP</th>
                                        <th className="px-6 py-4 font-bold">Masa Berlaku</th>
                                        <th className="px-6 py-4 font-bold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Memuat data...</td></tr>
                                    ) : allSpHistory.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Tidak ada riwayat SP</td></tr>
                                    ) : (
                                        allSpHistory.map((row, i) => {
                                            const spLevel = String(row.sp_level || '');
                                            const borderColor = spLevel === '1' ? 'border-l-amber-400' :
                                                                spLevel === '2' ? 'border-l-orange-500' :
                                                                (spLevel === '3' || spLevel === 'FINAL') ? 'border-l-rose-500' :
                                                                'border-l-slate-200';
                                            return (
                                                <tr key={i} className={cn("hover:bg-slate-50/80 transition-colors group border-l-4", borderColor)}>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-[15px]">{row.nama_kontraktor}</div>
                                                    <div className="text-[13px] text-slate-500 flex items-center gap-1.5 mt-1">
                                                        <span className="font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">{row.action_type === 'SP' && row.sp_level ? `SP ${row.sp_level}` : row.action_type}</span>
                                                        <span>•</span>
                                                        <span>{getParentBranch(row.cabang)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {row.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            Aktif
                                                        </span>
                                                    ) : row.has_next_sp ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            {row.next_sp_level ? `Dilanjut ke SP ${row.next_sp_level}` : 'Dilanjut ke SP Selanjutnya'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                            Selesai
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">
                                                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    <span className="text-slate-300 mx-2">→</span>
                                                    {row.expires_at ? new Date(row.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum Berakhir'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openModalSpSingle(row)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl border border-slate-200 transition-all shadow-sm"
                                                    >
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. Chart Section */}
                    {(() => {
                        const totalPages = Math.ceil(balanceChart.length / itemsPerPage);
                        const paginatedData = balanceChart.slice(chartPage * itemsPerPage, (chartPage + 1) * itemsPerPage);

                        return (
                            <div className="bg-white rounded-[24px] border border-slate-200/50 shadow-sm p-6 lg:p-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Keseimbangan Anggaran</h2>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Perbandingan nilai nominal Penawaran (RAB) vs Nilai SPK</p>
                                    </div>
                                    {balanceChart.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            {/* Item per page selector */}
                                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">Per Hal:</span>
                                                {[10, 15, 20].map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => {
                                                            setItemsPerPage(size);
                                                            setChartPage(0);
                                                        }}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                                            itemsPerPage === size
                                                                ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                                                                : "text-slate-500 hover:text-slate-800"
                                                        )}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-[18px] border border-slate-100">
                                                <span className="text-xs font-bold text-slate-500 px-3 uppercase tracking-wider">
                                                    {chartPage * itemsPerPage + 1} - {Math.min((chartPage + 1) * itemsPerPage, balanceChart.length)} dari {balanceChart.length}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setChartPage(Math.max(0, chartPage - 1))}
                                                        disabled={chartPage === 0}
                                                        className="p-2 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setChartPage(Math.min(totalPages - 1, chartPage + 1))}
                                                        disabled={chartPage === totalPages - 1 || totalPages === 0}
                                                        className="p-2 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-[500px] w-full overflow-visible [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible">
                                    {isLoading ? (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Memuat grafik...</div>
                                    ) : balanceChart.length === 0 ? (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Tidak ada data keseimbangan SPK</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" className="overflow-visible [&_.recharts-surface]:overflow-visible">
                                            <BarChart data={paginatedData} margin={{ top: 20, right: 20, left: 60, bottom: 120 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="nama_kontraktor"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    height={115}
                                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                                                    interval={0}
                                                    tickFormatter={(val) => formatContractorChartLabel(val, 32)}
                                                    angle={-48}
                                                    textAnchor="end"
                                                    dx={0}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={65}
                                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                                    tickFormatter={(val) => val >= 1000000000 ? `Rp${(val / 1000000000).toFixed(1)}M` : `Rp${(val / 1000000).toFixed(0)}JT`}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            const penawaran = payload[0].value as number;
                                                            const spk = payload[1]?.value as number;
                                                            const totalToko = payload[0]?.payload?.total_toko || 0;
                                                            return (
                                                                <div className="bg-white/95 backdrop-blur-md p-4 rounded-[20px] shadow-xl border border-slate-100 min-w-[220px]">
                                                                    <p className="font-bold text-slate-800 mb-4 text-[15px]">{label}</p>
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between items-center gap-6">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penawaran</span>
                                                                            </div>
                                                                            <span className="text-sm font-black text-slate-700">
                                                                                {formatRupiah(penawaran)} <span className="text-[11px] font-semibold text-slate-400">/ {totalToko} toko</span>
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center gap-6">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SPK</span>
                                                                            </div>
                                                                            <span className="text-sm font-black text-slate-700">
                                                                                {formatRupiah(spk)} <span className="text-[11px] font-semibold text-slate-400">/ {totalToko} toko</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend
                                                    verticalAlign="top"
                                                    height={40}
                                                    iconType="circle"
                                                    formatter={(value) => <span className="text-[13px] font-bold text-slate-600 ml-1.5">{value}</span>}
                                                />
                                                <Bar dataKey="total_penawaran" name="Penawaran RAB" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={itemsPerPage <= 10 ? 28 : itemsPerPage <= 15 ? 22 : 16} />
                                                <Bar dataKey="total_spk" name="Nilai SPK" fill="#34d399" radius={[6, 6, 0, 0]} barSize={itemsPerPage <= 10 ? 28 : itemsPerPage <= 15 ? 22 : 16} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </main>

            <ContractorDrilldownModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialLayer={modalLayer}
                initialMetric={modalMetric}
                initialKontraktor={modalKontraktor}
                initialData={modalSpData}
                filters={filters}
                searchQuery={modalSearchQuery}
                availableKontraktors={availableKontraktors}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// Komponen Kartu Metrik Modern
// ----------------------------------------------------------------------
function ModernMetricCard({
    title, mainValue, subValue, icon: Icon, colorScheme, onClick
}: {
    title: string; mainValue: string; subValue: string; icon: any; colorScheme: 'rose' | 'amber' | 'emerald' | 'indigo' | 'orange' | 'teal'; onClick: () => void;
}) {
    // Definisi tema warna untuk tiap skema bergaya Modern Minimal
    const themes = {
        rose: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-rose-50 text-rose-600",
            hover: "hover:border-rose-300 hover:shadow-[0_8px_30px_rgb(225,29,72,0.08)] hover:-translate-y-1",
        },
        amber: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-amber-50 text-amber-600",
            hover: "hover:border-amber-300 hover:shadow-[0_8px_30px_rgb(217,119,6,0.08)] hover:-translate-y-1",
        },
        orange: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-orange-50 text-orange-600",
            hover: "hover:border-orange-300 hover:shadow-[0_8px_30px_rgb(234,88,12,0.08)] hover:-translate-y-1",
        },
        indigo: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(79,70,229,0.08)] hover:-translate-y-1",
        },
        emerald: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-emerald-50 text-emerald-600",
            hover: "hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] hover:-translate-y-1",
        },
        teal: {
            bg: "bg-white",
            border: "border-slate-200/70",
            iconBg: "bg-teal-50 text-teal-600",
            hover: "hover:border-teal-300 hover:shadow-[0_8px_30px_rgb(13,148,136,0.08)] hover:-translate-y-1",
        }
    };

    const theme = themes[colorScheme];

    return (
        <div 
            onClick={onClick}
            className={cn(
                "rounded-[24px] p-6 border shadow-sm cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between",
                theme.bg, theme.border, theme.hover
            )}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("p-3 rounded-xl transition-colors", theme.iconBg)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">{title}</h3>
                <div className="text-[24px] font-bold text-slate-800 tracking-tight mb-2 truncate group-hover:text-slate-900 transition-colors" title={mainValue}>{mainValue}</div>
                <div className="flex items-center gap-2">
                    {/* Add simple icon indicator instead of complex borders */}
                    {colorScheme === 'rose' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                    {colorScheme === 'amber' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    {colorScheme === 'orange' && <FileText className="w-3.5 h-3.5 text-orange-500" />}
                    {colorScheme === 'indigo' && <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />}
                    {colorScheme === 'teal' && <TrendingDown className="w-3.5 h-3.5 text-teal-500" />}
                    <span className="text-xs font-bold text-slate-500">{subValue}</span>
                </div>
            </div>
            
            {/* Soft background glow on hover */}
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500", theme.iconBg.split(' ')[0])}></div>
        </div>
    );
}
