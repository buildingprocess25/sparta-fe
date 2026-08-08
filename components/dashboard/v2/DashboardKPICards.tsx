import React from 'react';
import { AlertTriangle, CheckCircle2, FileCheck, HardHat, Store } from 'lucide-react';
import type { DashboardV2CardType, DashboardV2SummaryCard, DashboardV2Tone } from '@/lib/dashboard-v2-api';

interface DashboardKPICardsProps {
    cards: DashboardV2SummaryCard[];
    isLoading: boolean;
    onCardClick: (cardType: DashboardV2CardType) => void;
}

const primaryCards: DashboardV2CardType[] = ['TOTAL_TOKO', 'SLA', 'SPK_AKTIF', 'TOTAL_DENDA'];

const toneClass: Record<DashboardV2Tone, string> = {
    neutral: 'border-slate-200 bg-white text-slate-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    yellow: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    purple: 'border-violet-200 bg-violet-50 text-violet-900',
    orange: 'border-orange-200 bg-orange-50 text-orange-900',
};

const iconClass: Record<DashboardV2Tone, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-violet-100 text-violet-700',
    orange: 'bg-orange-100 text-orange-700',
};

const iconForCard = (type: DashboardV2CardType) => {
    if (type === 'SLA') return AlertTriangle;
    if (type === 'SPK_AKTIF') return HardHat;
    if (type === 'TOTAL_DENDA') return FileCheck;
    if (type === 'SERAH_TERIMA') return CheckCircle2;
    return Store;
};

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({ cards, isLoading, onCardClick }) => {
    const visibleCards = cards.filter((card) => primaryCards.includes(card.type));

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {primaryCards.map((type) => (
                    <div key={type} className="h-[132px] animate-pulse rounded-xl border border-slate-200 bg-white" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleCards.map((card) => {
                const Icon = iconForCard(card.type);
                return (
                    <button
                        key={card.type}
                        type="button"
                        onClick={() => onCardClick(card.type)}
                        className={`min-h-[132px] rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass[card.tone]}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{card.title}</p>
                                <p className="mt-2 break-words text-3xl font-black leading-none tracking-normal">{card.value}</p>
                            </div>
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass[card.tone]}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                        </div>
                        <div className="mt-4 border-t border-current/10 pt-3">
                            <p className="text-xs font-bold leading-5 text-slate-600">{card.subtitle}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
