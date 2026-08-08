import React from 'react';
import { ClipboardCheck, Clock, FileText, Layers, MoveRight, Ruler, Search } from 'lucide-react';
import type { DashboardV2CardType, DashboardV2SummaryCard, DashboardV2Tone } from '@/lib/dashboard-v2-api';

interface DashboardAnalyticsProps {
    cards: DashboardV2SummaryCard[];
    onCardClick: (cardType: DashboardV2CardType) => void;
}

const analyticalOrder: DashboardV2CardType[] = [
    'NILAI_PENAWARAN',
    'TAMBAH_HARI_SPK',
    'ITEM_PENGAWASAN',
    'INSTRUKSI_LAPANGAN',
    'KERJA_TAMBAH_KURANG',
    'SERAH_TERIMA',
];

const costOrder: DashboardV2CardType[] = ['COST_M2_BANGUNAN', 'COST_M2_TERBUKA'];

const toneStyle: Record<DashboardV2Tone, { border: string; icon: string; metric: string; bar: string }> = {
    neutral: { border: 'hover:border-slate-300', icon: 'bg-slate-50 text-slate-600 border-slate-100', metric: 'text-slate-700', bar: 'bg-slate-500' },
    blue: { border: 'hover:border-indigo-300', icon: 'bg-indigo-50 text-indigo-600 border-indigo-100', metric: 'text-indigo-700', bar: 'bg-indigo-500' },
    green: { border: 'hover:border-emerald-300', icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', metric: 'text-emerald-700', bar: 'bg-emerald-500' },
    yellow: { border: 'hover:border-amber-300', icon: 'bg-amber-50 text-amber-600 border-amber-100', metric: 'text-amber-700', bar: 'bg-amber-500' },
    red: { border: 'hover:border-rose-300', icon: 'bg-rose-50 text-rose-600 border-rose-100', metric: 'text-rose-700', bar: 'bg-rose-500' },
    purple: { border: 'hover:border-purple-300', icon: 'bg-purple-50 text-purple-600 border-purple-100', metric: 'text-purple-700', bar: 'bg-purple-500' },
    orange: { border: 'hover:border-orange-300', icon: 'bg-orange-50 text-orange-600 border-orange-100', metric: 'text-orange-700', bar: 'bg-orange-500' },
};

const iconForCard = (type: DashboardV2CardType) => {
    if (type === 'TAMBAH_HARI_SPK') return Clock;
    if (type === 'ITEM_PENGAWASAN') return Search;
    if (type === 'INSTRUKSI_LAPANGAN') return ClipboardCheck;
    if (type === 'KERJA_TAMBAH_KURANG') return Layers;
    if (type === 'SERAH_TERIMA') return MoveRight;
    return FileText;
};

const parseNumericValue = (value: string | number) => {
    if (typeof value === 'number') return value;
    return Number(String(value).replace(/[^\d]/g, '')) || 0;
};

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ cards, onCardClick }) => {
    const analyticalCards = analyticalOrder
        .map((type) => cards.find((card) => card.type === type))
        .filter(Boolean) as DashboardV2SummaryCard[];
    const costCards = costOrder
        .map((type) => cards.find((card) => card.type === type))
        .filter(Boolean) as DashboardV2SummaryCard[];
    const maxCost = Math.max(1, ...costCards.map((card) => parseNumericValue(card.value)));

    return (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:col-span-2">
                {analyticalCards.map((card) => {
                    const Icon = iconForCard(card.type);
                    const tone = toneStyle[card.tone] ?? toneStyle.neutral;
                    return (
                        <button
                            key={card.type}
                            type="button"
                            onClick={() => onCardClick(card.type)}
                            className={`group flex min-h-[232px] flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:shadow-lg ${tone.border}`}
                        >
                            <div>
                                <div className="mb-6 flex items-center gap-3">
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${tone.icon}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{card.title}</h3>
                                </div>
                                <p className="break-words text-3xl font-black leading-tight tracking-normal text-slate-900">{card.value}</p>
                            </div>

                            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                                {card.metrics.slice(0, 3).map((metric) => (
                                    <div key={`${card.type}-${metric.label}`} className="min-w-0">
                                        <span className="block truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{metric.label}</span>
                                        <span className={`mt-1 block truncate text-base font-black ${tone.metric}`}>{metric.value}</span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-xl">
                <div className="mb-10 flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                        <Ruler className="h-6 w-6" />
                    </span>
                    <div>
                        <h3 className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Analitik Biaya</h3>
                        <p className="text-2xl font-black tracking-normal text-slate-900">Rata-rata Cost / m2</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {costCards.map((card) => {
                        const tone = toneStyle[card.tone] ?? toneStyle.neutral;
                        const value = parseNumericValue(card.value);
                        const width = Math.min(100, Math.max(12, (value / maxCost) * 100));
                        return (
                            <button
                                key={card.type}
                                type="button"
                                onClick={() => onCardClick(card.type)}
                                className="block w-full text-left"
                            >
                                <div className="mb-3 flex items-end justify-between gap-3">
                                    <p className="text-xs font-bold text-slate-500">{card.title.replace('RATA-RATA ', '')}</p>
                                    <p className="text-lg font-black tracking-normal text-slate-900">{card.value}</p>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
                                </div>
                                <p className="mt-2 text-xs font-semibold text-slate-400">{card.subtitle}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
