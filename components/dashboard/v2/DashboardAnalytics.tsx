import React from 'react';
import { 
    Clock, FileText, Search, FileCheck, TrendingUp, TrendingDown,
    Building2, SquareChartGantt, Briefcase, Ruler, LucideIcon
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { DashboardV2Tone, DashboardV2SummaryCard } from 'sparta-be/src/modules/dashboard/dashboard-v2.types';

interface DashboardAnalyticsProps {
    summary: any;
    isLoading: boolean;
    onCardClick: (cardType: string) => void;
}

const TONE_MAP: Record<string, { iconColor: string, badgeBg: string, hoverBorder: string }> = {
    'blue': { iconColor: 'text-blue-600', badgeBg: 'bg-blue-50 border-blue-100 text-blue-700', hoverBorder: 'hover:border-blue-300 hover:shadow-blue-500/10' },
    'green': { iconColor: 'text-emerald-600', badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-700', hoverBorder: 'hover:border-emerald-300 hover:shadow-emerald-500/10' },
    'yellow': { iconColor: 'text-yellow-600', badgeBg: 'bg-yellow-50 border-yellow-100 text-yellow-700', hoverBorder: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
    'red': { iconColor: 'text-rose-600', badgeBg: 'bg-rose-50 border-rose-100 text-rose-700', hoverBorder: 'hover:border-rose-300 hover:shadow-rose-500/10' },
    'purple': { iconColor: 'text-indigo-600', badgeBg: 'bg-indigo-50 border-indigo-100 text-indigo-700', hoverBorder: 'hover:border-indigo-300 hover:shadow-indigo-500/10' },
    'orange': { iconColor: 'text-orange-600', badgeBg: 'bg-orange-50 border-orange-100 text-orange-700', hoverBorder: 'hover:border-orange-300 hover:shadow-orange-500/10' },
    'neutral': { iconColor: 'text-slate-600', badgeBg: 'bg-slate-50 border-slate-200 text-slate-700', hoverBorder: 'hover:border-slate-300 hover:shadow-slate-500/10' }
};

const ICON_MAP: Record<string, LucideIcon> = {
    'NILAI_PENAWARAN': FileText,
    'TAMBAH_HARI_SPK': Clock,
    'ITEM_PENGAWASAN': Search,
    'INSTRUKSI_LAPANGAN': FileCheck,
    'KERJA_TAMBAH_KURANG': TrendingUp,
    'COST_M2_BANGUNAN': Building2,
    'COST_M2_TERBUKA': Ruler,
    'KETERLAMBATAN': Clock,
    'TOTAL_DENDA': TrendingDown,
    'JHK_PEKERJAAN': Briefcase
};

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ summary, isLoading, onCardClick }) => {
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-slate-200 rounded-[24px] animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (!summary || !summary.cards) return null;

    const TOP_CARDS = ['TOTAL_TOKO', 'SLA', 'SPK_AKTIF', 'NILAI_SPK', 'SERAH_TERIMA'];
    const analyticalCards = summary.cards.filter((c: any) => !TOP_CARDS.includes(c.type));

    return (
        <div className="mt-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6 px-1 flex items-center gap-3">
                <SquareChartGantt className="w-6 h-6 text-indigo-500" />
                Analytical Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {analyticalCards.map((card: DashboardV2SummaryCard, idx: number) => {
                    const styles = TONE_MAP[card.tone] || TONE_MAP['neutral'];
                    const Icon = ICON_MAP[card.type] || FileText;

                    return (
                        <div 
                            key={idx}
                            onClick={() => onCardClick(card.type)}
                            className={`group flex flex-col justify-between bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm hover:shadow-xl ${styles.hoverBorder} transition-all duration-300 cursor-pointer relative overflow-hidden`}
                        >
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className={`p-3 rounded-2xl ${styles.badgeBg} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                    Metrics
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{card.title}</h4>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">
                                    {typeof card.value === 'number' && card.value > 100000 
                                            ? formatRupiah(card.value) 
                                            : card.value}
                                </p>
                            </div>

                            {/* Submetrics / Progress Line */}
                            <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
                                <div className="flex items-center gap-3 w-full">
                                    {card.metrics?.map((metric: any, i: number) => (
                                        <div key={i} className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 truncate">{metric.label}</p>
                                            <p className={`text-sm font-bold truncate ${TONE_MAP[metric.tone]?.iconColor || 'text-slate-700'}`}>
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                    {(!card.metrics || card.metrics.length === 0) && (
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{card.subtitle}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subtle Background Accent */}
                            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 pointer-events-none bg-current ${styles.iconColor}`}></div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
