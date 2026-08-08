import React from 'react';
import { AlertTriangle, CheckCircle2, FileCheck, HardHat, Store } from 'lucide-react';
import type { DashboardV2CardType, DashboardV2SummaryCard, DashboardV2Tone } from '@/lib/dashboard-v2-api';

interface DashboardKPICardsProps {
    cards: DashboardV2SummaryCard[];
    isLoading: boolean;
    onCardClick: (cardType: DashboardV2CardType) => void;
}

const primaryCards: DashboardV2CardType[] = ['TOTAL_TOKO', 'SLA', 'SPK_AKTIF', 'TOTAL_DENDA'];

const cardTone: Record<DashboardV2Tone, { bg: string; text: string; glow: string; icon: string }> = {
    neutral: {
        bg: 'bg-gradient-to-br from-slate-50 to-white border-slate-200',
        text: 'text-slate-900',
        glow: 'shadow-slate-500/10',
        icon: 'text-slate-700',
    },
    blue: {
        bg: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100',
        text: 'text-indigo-900',
        glow: 'shadow-indigo-500/20',
        icon: 'text-indigo-600',
    },
    green: {
        bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
        text: 'text-emerald-900',
        glow: 'shadow-emerald-500/20',
        icon: 'text-emerald-600',
    },
    yellow: {
        bg: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
        text: 'text-amber-900',
        glow: 'shadow-amber-500/20',
        icon: 'text-amber-600',
    },
    red: {
        bg: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',
        text: 'text-rose-900',
        glow: 'shadow-rose-500/20',
        icon: 'text-rose-600',
    },
    purple: {
        bg: 'bg-gradient-to-br from-purple-50 to-white border-purple-100',
        text: 'text-purple-900',
        glow: 'shadow-purple-500/20',
        icon: 'text-purple-600',
    },
    orange: {
        bg: 'bg-gradient-to-br from-orange-50 to-white border-orange-100',
        text: 'text-orange-900',
        glow: 'shadow-orange-500/20',
        icon: 'text-orange-600',
    },
};

const iconForCard = (type: DashboardV2CardType) => {
    if (type === 'SLA') return AlertTriangle;
    if (type === 'SPK_AKTIF') return HardHat;
    if (type === 'TOTAL_DENDA') return FileCheck;
    if (type === 'SERAH_TERIMA') return CheckCircle2;
    return Store;
};

const valueClassForCard = (card: DashboardV2SummaryCard) => {
    const valueLength = String(card.value ?? '').length;
    if (card.type === 'TOTAL_DENDA') return valueLength > 16 ? 'text-[28px] leading-[1.08]' : 'text-[32px] leading-none';
    return valueLength > 12 ? 'text-[30px] leading-[1.08]' : 'text-[32px] leading-none';
};

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({ cards, isLoading, onCardClick }) => {
    const visibleCards = cards.filter((card) => primaryCards.includes(card.type));

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {primaryCards.map((type) => (
                    <div key={type} className="h-[154px] animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-sm" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {visibleCards.map((card) => {
                const tone = cardTone[card.tone] ?? cardTone.neutral;
                const Icon = iconForCard(card.type);
                return (
                    <button
                        key={card.type}
                        type="button"
                        onClick={() => onCardClick(card.type)}
                        className={`group relative min-h-[154px] overflow-hidden rounded-[24px] border px-6 py-5 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tone.bg} ${tone.glow}`}
                    >
                        <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1.5">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{card.title}</h4>
                                    <p className={`max-w-[230px] whitespace-normal break-normal font-black tracking-normal [overflow-wrap:normal] ${valueClassForCard(card)} ${tone.text}`}>
                                        {card.value}
                                    </p>
                                </div>
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm transition duration-300 group-hover:scale-105">
                                    <Icon className={`h-5 w-5 ${tone.icon}`} />
                                </span>
                            </div>

                            <div className="border-t border-slate-200/60 pt-3">
                                <p className="text-[12px] font-bold leading-relaxed text-slate-600">{card.subtitle}</p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
