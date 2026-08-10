import React from 'react';
import { 
    HardHat, Store, AlertTriangle, FileCheck, CalendarClock, 
    Banknote, CircleDollarSign, Clock, FileText, Pickaxe, 
    LucideIcon, TrendingDown
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { DashboardV2Tone, DashboardV2SummaryCard } from 'sparta-be/src/modules/dashboard/dashboard-v2.types';

interface DashboardKPICardsProps {
    summary: any;
    isLoading: boolean;
    onCardClick: (cardType: string) => void;
}

const TONE_MAP: Record<string, { iconColor: string, glow: string, bg: string, text: string }> = {
    'blue': { iconColor: 'text-blue-600', glow: 'shadow-blue-500/20', bg: 'bg-gradient-to-br from-blue-50 to-white border-blue-100', text: 'text-blue-900' },
    'green': { iconColor: 'text-emerald-600', glow: 'shadow-emerald-500/20', bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100', text: 'text-emerald-900' },
    'yellow': { iconColor: 'text-yellow-600', glow: 'shadow-yellow-500/20', bg: 'bg-gradient-to-br from-yellow-50 to-white border-yellow-100', text: 'text-yellow-900' },
    'red': { iconColor: 'text-rose-600', glow: 'shadow-rose-500/20', bg: 'bg-gradient-to-br from-rose-50 to-white border-rose-100', text: 'text-rose-900' },
    'purple': { iconColor: 'text-indigo-600', glow: 'shadow-indigo-500/20', bg: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100', text: 'text-indigo-900' },
    'orange': { iconColor: 'text-orange-600', glow: 'shadow-orange-500/20', bg: 'bg-gradient-to-br from-orange-50 to-white border-orange-100', text: 'text-orange-900' },
    'neutral': { iconColor: 'text-slate-600', glow: 'shadow-slate-500/20', bg: 'bg-gradient-to-br from-slate-50 to-white border-slate-200', text: 'text-slate-900' }
};

const ICON_MAP: Record<string, LucideIcon> = {
    'TOTAL_TOKO': Store,
    'SLA': AlertTriangle,
    'SPK_AKTIF': Pickaxe,
    'NILAI_SPK': Banknote,
    'KETERLAMBATAN': Clock,
    'JHK_PEKERJAAN': CalendarClock,
    'TOTAL_DENDA': TrendingDown,
    'SERAH_TERIMA': FileCheck
};

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({ summary, isLoading, onCardClick }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-40 bg-slate-200 rounded-[24px]"></div>
                ))}
            </div>
        );
    }

    if (!summary || !summary.cards) return null;

    // Kebutuhan dari rencana implementasi:
    // Urutan Cards: TOTAL TOKO, SLA, SPK AKTIF, NILAI SPK, SERAH TERIMA (di atas)
    // Diikuti oleh JHK PEKERJAAN, KETERLAMBATAN, TOTAL DENDA
    // Agar rapi kita render berurutan sesuai balikan array `summary.cards` yang sudah diatur backend.

    const TOP_CARDS = ['TOTAL_TOKO', 'SLA', 'SPK_AKTIF', 'NILAI_SPK', 'SERAH_TERIMA'];
    const kpiCards = summary.cards.filter((c: any) => TOP_CARDS.includes(c.type));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {kpiCards.map((card: DashboardV2SummaryCard, idx: number) => {
                const styles = TONE_MAP[card.tone] || TONE_MAP['neutral'];
                const Icon = ICON_MAP[card.type] || FileText;

                return (
                    <div 
                        key={idx}
                        onClick={() => onCardClick(card.type)}
                        className={`relative overflow-hidden rounded-[24px] p-6 border ${styles.bg} shadow-lg ${styles.glow} cursor-pointer group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between`}
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white rounded-full opacity-40 blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                            <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 truncate">{card.title}</h4>
                                    <p className={`font-black tracking-tighter truncate text-2xl xl:text-[26px] 2xl:text-3xl ${styles.text}`}>
                                        {typeof card.value === 'number' && card.value > 100000 
                                            ? formatRupiah(card.value) 
                                            : card.value}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-white/60 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                    <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-200/50">
                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                    {card.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
