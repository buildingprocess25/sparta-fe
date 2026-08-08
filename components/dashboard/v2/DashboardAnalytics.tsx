import React from 'react';
import { ClipboardCheck, FileText, Layers, MoveRight, Ruler, Search, TimerReset } from 'lucide-react';
import type { DashboardV2CardType, DashboardV2SummaryCard, DashboardV2Tone } from '@/lib/dashboard-v2-api';

interface DashboardAnalyticsProps {
    cards: DashboardV2SummaryCard[];
    onCardClick: (cardType: DashboardV2CardType) => void;
}

const analyticsOrder: DashboardV2CardType[] = [
    'NILAI_PENAWARAN',
    'TAMBAH_HARI_SPK',
    'ITEM_PENGAWASAN',
    'INSTRUKSI_LAPANGAN',
    'KERJA_TAMBAH_KURANG',
    'SERAH_TERIMA',
    'COST_M2_BANGUNAN',
    'COST_M2_TERBUKA',
];

const toneClass: Record<DashboardV2Tone, string> = {
    neutral: 'hover:border-slate-300',
    blue: 'hover:border-blue-300',
    green: 'hover:border-emerald-300',
    yellow: 'hover:border-amber-300',
    red: 'hover:border-red-300',
    purple: 'hover:border-violet-300',
    orange: 'hover:border-orange-300',
};

const iconClass: Record<DashboardV2Tone, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-violet-50 text-violet-700',
    orange: 'bg-orange-50 text-orange-700',
};

const iconForCard = (type: DashboardV2CardType) => {
    if (type === 'TAMBAH_HARI_SPK') return TimerReset;
    if (type === 'ITEM_PENGAWASAN') return Search;
    if (type === 'INSTRUKSI_LAPANGAN') return ClipboardCheck;
    if (type === 'KERJA_TAMBAH_KURANG') return Layers;
    if (type === 'SERAH_TERIMA') return MoveRight;
    if (type === 'COST_M2_BANGUNAN' || type === 'COST_M2_TERBUKA') return Ruler;
    return FileText;
};

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ cards, onCardClick }) => {
    const visibleCards = analyticsOrder
        .map((type) => cards.find((card) => card.type === type))
        .filter(Boolean) as DashboardV2SummaryCard[];

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visibleCards.map((card) => {
                const Icon = iconForCard(card.type);
                return (
                    <button
                        key={card.type}
                        type="button"
                        onClick={() => onCardClick(card.type)}
                        className={`flex min-h-[150px] flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass[card.tone]}`}
                    >
                        <div className="flex items-start gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass[card.tone]}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{card.title}</p>
                                <p className="mt-2 break-words text-2xl font-black leading-tight text-slate-950">{card.value}</p>
                            </div>
                        </div>
                        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                            {card.metrics.slice(0, 3).map((metric) => (
                                <div key={`${card.type}-${metric.label}`} className="min-w-0">
                                    <p className="truncate text-[10px] font-black uppercase tracking-wide text-slate-400">{metric.label}</p>
                                    <p className="mt-1 truncate text-sm font-black text-slate-800">{metric.value}</p>
                                </div>
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
