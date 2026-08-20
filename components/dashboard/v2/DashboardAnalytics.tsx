import React from 'react';
import { Clock, FileText, Search, FileCheck, TrendingUp, AlertTriangle, Timer } from 'lucide-react';
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
                { label: 'TOTAL', value: (extraStats.penawaranDone || 0) + (extraStats.penawaranOngoing || 0), color: 'text-indigo-700' },
                { label: 'DONE', value: extraStats.penawaranDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.penawaranOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'PENAWARAN'
        },
        {
            title: 'NILAI SPK',
            value: formatRupiah(extraStats.totalNilaiSPK || 0),
            icon: <FileCheck className="w-5 h-5 text-teal-500" />,
            badgeBg: 'bg-teal-50 border-teal-100',
            hoverBorder: 'hover:border-teal-300',
            metrics: [
                { label: 'TOTAL', value: (extraStats.spkDone || 0) + (extraStats.spkOngoing || 0), color: 'text-teal-700' },
                { label: 'DONE', value: extraStats.spkDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.spkOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'SPK'
        },
        {
            title: 'RATA-RATA TAMBAH HARI SPK',
            value: `${extraStats.avgTambahHari || 0} Hari`,
            icon: <Clock className="w-5 h-5 text-blue-500" />,
            badgeBg: 'bg-blue-50 border-blue-100',
            hoverBorder: 'hover:border-blue-300',
            metrics: [
                { label: 'TOTAL', value: extraStats.tambahHariCount || 0, color: 'text-blue-700' },
                { label: 'DONE', value: extraStats.tambahHariDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.tambahHariOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'JHK'
        },
        {
            title: 'NILAI INSTRUKSI LAPANGAN',
            value: formatRupiah(extraStats.totalNilaiIL || 0),
            icon: <FileCheck className="w-5 h-5 text-orange-500" />,
            badgeBg: 'bg-orange-50 border-orange-100',
            hoverBorder: 'hover:border-orange-300',
            metrics: [
                { label: 'TOTAL', value: (extraStats.ilDone || 0) + (extraStats.ilOngoing || 0), color: 'text-orange-700' },
                { label: 'DONE', value: extraStats.ilDone || 0, color: 'text-emerald-600' },
                { label: 'ONGOING', value: extraStats.ilOngoing || 0, color: 'text-amber-600' }
            ],
            type: 'IL'
        },
        {
            title: 'DOKUMEN PENGAWASAN',
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
            title: 'KETERLAMBATAN PROYEK',
            value: extraStats.keterlambatanCount || 0,
            icon: <Timer className="w-5 h-5 text-rose-500" />,
            badgeBg: 'bg-rose-50 border-rose-100',
            hoverBorder: 'hover:border-rose-300',
            metrics: [
                { label: 'MELEWATI TARGET', value: extraStats.keterlambatanCount || 0, color: 'text-rose-700' },
                { label: 'BELUM ST', value: (extraStats.keterlambatanCount || 0) + ' ULOK', color: 'text-rose-500' },
                { label: 'STATUS', value: 'LATE', color: 'text-rose-600' }
            ],
            type: 'KETERLAMBATAN'
        }
    ];

    const costMetrics = [
        { label: 'Terbangun', value: stats.avgCostTerbangun || 0, color: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
        { label: 'Bangunan', value: stats.avgCostBangunan || 0, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
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
                                <h3 className="text-[11px] font-bold text-slate-500 tracking-widest">{card.title}</h3>
                            </div>

                            <div className="mb-8">
                                <p className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight transition-colors group-hover:text-slate-950">
                                    {card.value}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                            {card.metrics.map((m, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</span>
                                    <span className={`text-base font-bold mt-1 ${m.color}`}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Right side: Total Denda & Cost / m2 */}
            <div className="flex flex-col gap-6">

                {/* Total Denda Card */}
                <div
                    onClick={() => onCardClick('DENDA')}
                    className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-[24px] p-6 shadow-sm shadow-rose-500/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-rose-300 hover:-translate-y-1 flex flex-col justify-between group shrink-0"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl border bg-white border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-[11px] font-bold text-rose-600 tracking-widest uppercase">Total Denda</h3>
                    </div>
                    <div>
                        <p className="text-2xl lg:text-3xl font-bold text-rose-900 tracking-tight mb-1">
                            {formatRupiah(stats.totalDenda || 0)}
                        </p>
                        <p className="text-xs font-semibold text-rose-600/70">{stats.dendaTerlambat || 0} ULOK melampaui batas waktu</p>
                    </div>
                </div>

                {/* Cost / m2 Card */}
                <div
                    className="bg-white rounded-[24px] p-6 lg:p-7 border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden group shrink-0"
                    onClick={() => onCardClick('COST_M2')}
                >
                    {/* Decorative Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:bg-blue-100 transition-colors duration-700"></div>

                    <div className="relative z-10 flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Analitik Biaya</h3>
                            <p className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">Rata-rata Cost / m²</p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-6">
                        {costMetrics.map((cm, i) => (
                            <div key={i} className="group/item">
                                <div className="flex justify-between items-end mb-2.5">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{cm.label}</span>
                                    <span className="text-sm font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors">{formatRupiah(cm.value)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${cm.color} w-1/4 group-hover/item:w-1/3 transition-all duration-700`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
