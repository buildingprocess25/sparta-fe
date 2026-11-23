import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface CategoryProgress {
    total: number;
    completed: number;
}

interface CategorySidebarProps {
    categories: string[];
    activeCategory: string;
    onSelectCategory: (category: string) => void;
    progressMap: Record<string, CategoryProgress>;
}

export function CategorySidebar({ categories, activeCategory, onSelectCategory, progressMap }: CategorySidebarProps) {
    const totalItems = Object.values(progressMap).reduce((sum, p) => sum + p.total, 0);
    const totalCompleted = Object.values(progressMap).reduce((sum, p) => sum + p.completed, 0);
    const globalProgressPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return (
        <div className="w-full lg:w-80 shrink-0 bg-slate-50 border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-white">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Progress Form</h3>
                <p className="text-sm text-slate-500 mb-4">Pastikan {totalItems} item terisi lengkap</p>
                
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">{globalProgressPct}% Selesai</span>
                    <span className="text-sm font-medium text-slate-500">{totalCompleted} / {totalItems}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${globalProgressPct}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {categories.map((cat, idx) => {
                    const prog = progressMap[cat] || { total: 0, completed: 0 };
                    const isAllDone = prog.total > 0 && prog.completed === prog.total;
                    const isActive = activeCategory === cat;

                    return (
                        <button
                            key={cat}
                            onClick={() => onSelectCategory(cat)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                                isActive 
                                    ? 'bg-blue-100/50 border-blue-200 shadow-sm' 
                                    : 'hover:bg-slate-100 border-transparent'
                            } border`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="shrink-0">
                                    {isAllDone ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <div className="truncate">
                                    <div className={`text-sm font-semibold truncate ${isActive ? 'text-blue-800' : 'text-slate-700'}`}>
                                        {idx + 1}. {cat}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {prog.completed} / {prog.total} item
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
