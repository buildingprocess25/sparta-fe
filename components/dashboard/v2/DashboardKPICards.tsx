import React from 'react';
import { HardHat, Store, AlertTriangle, FileCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface DashboardKPICardsProps {
    stats: any;
    extraStats: any;
    onCardClick: (cardType: string) => void;
}

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({ stats, extraStats, onCardClick }) => {
    
    const cards = [
        {
            title: 'TOTAL TOKO',
            value: stats.total || 0,
            icon: <Store className="w-6 h-6 text-indigo-600" />,
            glow: 'shadow-indigo-500/20',
            bg: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100',
            text: 'text-indigo-900',
            subtext: `Done: ${stats.miniStats?.['Done'] || 0} · Ongoing: ${(stats.total || 0) - (stats.miniStats?.['Done'] || 0)}`,
            type: 'TOTAL_PROJECT'
        },
        {
            title: 'SLA PERHATIAN',
            value: stats.attention || 0,
            icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
            glow: 'shadow-yellow-500/20',
            bg: 'bg-gradient-to-br from-yellow-50 to-white border-yellow-100',
            text: 'text-yellow-900',
            subtext: `PJU: ${stats.miniPerhatian?.['Proses PJU'] || 0} · SPK: ${stats.miniPerhatian?.['Approval SPK'] || 0} · Ongoing: ${stats.miniPerhatian?.['Ongoing'] || 0}`,
            type: 'SLA'
        },
        {
            title: 'SPK AKTIF',
            value: extraStats.spkDone || 0,
            icon: <HardHat className="w-6 h-6 text-emerald-600" />,
            glow: 'shadow-emerald-500/20',
            bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
            text: 'text-emerald-900',
            subtext: `Dari ${(extraStats.spkOngoing || 0) + (extraStats.spkDone || 0)} total SPK diterbitkan`,
            type: 'SPK_AKTIF'
        },
        {
            title: 'JHK PEKERJAAN',
            value: extraStats.stCount || 0, // Number of STs is base count for Gantt view
            icon: <Store className="w-6 h-6 text-purple-600" />, // using Store or Calendar
            glow: 'shadow-purple-500/20',
            bg: 'bg-gradient-to-br from-purple-50 to-white border-purple-100',
            text: 'text-purple-900',
            subtext: `Grafik Durasi SPK s.d Serah Terima`,
            type: 'JHK_PEKERJAAN'
        },
        {
            title: 'SERAH TERIMA',
            value: extraStats.stCount || 0,
            icon: <FileCheck className="w-6 h-6 text-teal-600" />,
            glow: 'shadow-teal-500/20',
            bg: 'bg-gradient-to-br from-teal-50 to-white border-teal-100',
            text: 'text-teal-900',
            subtext: `Dokumen BAST selesai`,
            type: 'SERAH_TERIMA'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {cards.map((card, idx) => (
                <div 
                    key={idx}
                    onClick={() => onCardClick(card.type)}
                    className={`relative overflow-hidden rounded-[24px] p-6 border ${card.bg} shadow-lg ${card.glow} cursor-pointer group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl`}
                >
                    {/* Decorative Background Blob */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white rounded-full opacity-40 blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 truncate">{card.title}</h4>
                                <p className={`font-bold tracking-tighter truncate text-2xl xl:text-[26px] 2xl:text-3xl ${card.text}`}>
                                    {card.value}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-white/60 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                {card.icon}
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200/50">
                            <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                                {card.subtext}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
