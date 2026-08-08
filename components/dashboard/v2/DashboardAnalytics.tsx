import React from 'react';
import { Clock, FileText, Search, FileCheck, TrendingUp } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface DashboardAnalyticsProps {
    stats: any;
    extraStats: any;
    onCardClick: (cardType: string) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ stats, extraStats, onCardClick }) => {
    
    const analyticalCards = [
        {
            title: 'NILAI PENAWARAN',
            value: formatRupiah(stats.penawaran || 0),
            icon: <FileText className="w-5 h-5 text-indigo-500" />,
            badgeBg: 'bg-indigo-50 border-indigo-100',
            hoverBorder: 'hover:border-indigo-300',
            metrics: [
                { label: 'DISETUJUI', value: extraStats.penawaranDone || 0, color: 'text-indigo-700' },
                { label: 'ONGOING', value: extraStats.penawaranOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'PENAWARAN'
        },
        {
            title: 'RATA-RATA TAMBAH HARI SPK',
            value: `${extraStats.avgTambahHari || 0} Hari`,
            icon: <Clock className="w-5 h-5 text-blue-500" />,
            badgeBg: 'bg-blue-50 border-blue-100',
            hoverBorder: 'hover:border-blue-300',
            metrics: [
                { label: 'JUMLAH TAMBAH SPK', value: extraStats.tambahHariCount || 0, color: 'text-blue-700' },
                { label: 'DONE', value: extraStats.spkDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.spkOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'JHK'
        },
        {
            title: 'ITEM PENGAWASAN',
            value: (extraStats.pengawasanSelesai || 0) + (extraStats.pengawasanProgress || 0) + (extraStats.pengawasanTerlambat || 0),
            icon: <Search className="w-5 h-5 text-purple-500" />,
            badgeBg: 'bg-purple-50 border-purple-100',
            hoverBorder: 'hover:border-purple-300',
            metrics: [
                { label: 'SELESAI', value: extraStats.pengawasanSelesai || 0, color: 'text-emerald-600' },
                { label: 'PROGRESS', value: extraStats.pengawasanProgress || 0, color: 'text-blue-600' },
                { label: 'TERLAMBAT', value: extraStats.pengawasanTerlambat || 0, color: 'text-rose-600' }
            ],
            type: 'PENGAWASAN'
        },
        {
            title: 'NILAI INSTRUKSI LAPANGAN',
            value: formatRupiah(extraStats.totalNilaiIL || 0),
            icon: <FileCheck className="w-5 h-5 text-orange-500" />,
            badgeBg: 'bg-orange-50 border-orange-100',
            hoverBorder: 'hover:border-orange-300',
            metrics: [
                { label: 'APPROVED', value: extraStats.ilDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.ilOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'IL'
        }
    ];

    const costMetrics = [
        { label: 'Terbangun', value: stats.avgCostTerbangun || 0, color: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
        { label: 'Bangunan Utama', value: stats.avgCostBangunan || 0, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
        { label: 'Area Terbuka', value: stats.avgCostTerbuka || 0, color: 'bg-gradient-to-r from-purple-400 to-purple-500' },
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            
            {/* Left side: Grid of specific analytical metrics */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticalCards.map((card, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => onCardClick(card.type)}
                        className={`bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 flex flex-col justify-between group ${card.hoverBorder} hover:shadow-lg`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-2xl border ${card.badgeBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                    {card.icon}
                                </div>
                                <h3 className="text-[11px] font-black text-slate-500 tracking-widest">{card.title}</h3>
                            </div>
                            
                            <div className="mb-8">
                                <p className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight transition-colors group-hover:text-slate-950">
                                    {card.value}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                            {card.metrics.map((m, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                                    <span className={`text-base font-black mt-1 ${m.color}`}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Right side: Cost / m2 */}
            <div 
                className="bg-white rounded-[24px] p-8 border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-center relative overflow-hidden group"
                onClick={() => onCardClick('COST_M2')}
            >
                {/* Decorative Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:bg-blue-100 transition-colors duration-700"></div>

                <div className="relative z-10 flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-slate-400 tracking-widest uppercase mb-1">Analitik Biaya</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">Rata-rata Cost / m²</p>
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    {costMetrics.map((cost, idx) => (
                        <div key={idx} className="relative group/bar">
                            <div className="flex justify-between items-end mb-3">
                                <p className="text-xs font-bold text-slate-500 tracking-wide">{cost.label}</p>
                                <p className="text-lg font-black tracking-tighter text-slate-800">{formatRupiah(cost.value)}</p>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${cost.color} rounded-full transition-all duration-1000 ease-out`} 
                                    style={{ width: `${Math.min(100, Math.max(15, (cost.value / 8000000) * 100))}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
