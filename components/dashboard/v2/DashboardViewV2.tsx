import React, { useState } from 'react';
import { DashboardFilterBar } from './DashboardFilterBar';
import { DashboardKPICards } from './DashboardKPICards';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardCharts } from './DashboardCharts';
import { DashboardDrilldownModal } from './DashboardDrilldownModal';
import type {
    DashboardV2CardType,
    DashboardV2Charts,
    DashboardV2JobType,
    DashboardV2Period,
    DashboardV2ScopeParams,
    DashboardV2Summary,
} from '@/lib/dashboard-v2-api';

interface DashboardViewV2Props {
    accessibleBranches: string[];
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
    isSuperAdmin: boolean;
    onRefresh: () => void | Promise<void>;
    isRefreshing: boolean;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    jobType: DashboardV2JobType;
    onJobTypeChange: (val: DashboardV2JobType) => void;
    period: DashboardV2Period;
    onPeriodChange: (val: DashboardV2Period) => void;
    summary: DashboardV2Summary | null;
    charts: DashboardV2Charts | null;
    scopeParams: DashboardV2ScopeParams;
}

export const DashboardViewV2: React.FC<DashboardViewV2Props> = ({
    accessibleBranches,
    selectedBranch,
    onBranchChange,
    isSuperAdmin,
    onRefresh,
    isRefreshing,
    searchQuery,
    onSearchChange,
    jobType,
    onJobTypeChange,
    period,
    onPeriodChange,
    summary,
    charts,
    scopeParams,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<DashboardV2CardType>('TOTAL_TOKO');
    const [openedFromSearch, setOpenedFromSearch] = useState(false);

    const handleCardClick = (cardType: DashboardV2CardType) => {
        setOpenedFromSearch(false);
        setActiveCard(cardType);
        setIsModalOpen(true);
    };

    const handleSearchSubmit = () => {
        if (!searchQuery.trim()) return;
        setOpenedFromSearch(true);
        setActiveCard('TOTAL_TOKO');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (openedFromSearch) {
            onSearchChange('');
            setOpenedFromSearch(false);
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-50">
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
                    <DashboardFilterBar
                        searchQuery={searchQuery}
                        onSearchChange={onSearchChange}
                        onSearchSubmit={handleSearchSubmit}
                        selectedBranch={selectedBranch}
                        onBranchChange={onBranchChange}
                        accessibleBranches={accessibleBranches}
                        isSuperAdmin={isSuperAdmin}
                        jobType={jobType}
                        onJobTypeChange={onJobTypeChange}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                    />

                    <DashboardKPICards
                        cards={summary?.cards ?? []}
                        isLoading={isRefreshing && !summary}
                        onCardClick={handleCardClick}
                    />

                    <DashboardAnalytics
                        cards={summary?.cards ?? []}
                        onCardClick={handleCardClick}
                    />

                    <DashboardCharts
                        charts={charts}
                        period={period}
                        onPeriodChange={onPeriodChange}
                    />

                    <DashboardDrilldownModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        initialCardType={activeCard}
                        scopeParams={scopeParams}
                    />
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 7px;
                    height: 7px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
};
