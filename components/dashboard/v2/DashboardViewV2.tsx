import React, { useState, useMemo } from 'react';
import { DashboardFilterBar } from './DashboardFilterBar';
import { DashboardKPICards } from './DashboardKPICards';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardCharts } from './DashboardCharts';
import { DashboardDrilldownModalV2 } from './DashboardDrilldownModalV2';
import { fetchDashboardV2Summary } from '@/lib/api';

interface DashboardViewV2Props {
    projects: any[]; // Deprecated but kept for compatibility
    accessibleBranches: string[];
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
    isSuperAdmin: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    jobType: 'ALL' | 'RENOVASI' | 'REGULER';
    onJobTypeChange: (val: 'ALL' | 'RENOVASI' | 'REGULER') => void;
    
    // Extracted from page.tsx
    searchQuery: string;
    onSearchChange: (val: string) => void;
    stats: any; // Deprecated
}

export const DashboardViewV2: React.FC<DashboardViewV2Props> = ({
    projects,
    accessibleBranches,
    selectedBranch,
    onBranchChange,
    isSuperAdmin,
    onRefresh,
    isRefreshing,
    jobType,
    onJobTypeChange,
    searchQuery,
    onSearchChange,
    stats
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<string | null>(null);

    const handleSearchChange = (val: string) => {
        onSearchChange(val);
        // Bypass to Tahap 3 / Timeline when searching by ULOK specific
        if (val.length > 5) {
            setActiveCard('TIMELINE');
            setIsModalOpen(true);
        }
    };

    const handleCardClick = (cardType: string) => {
        setActiveCard(cardType);
        setIsModalOpen(true);
    };

    const [summary, setSummary] = useState<any>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);

    React.useEffect(() => {
        const fetchSummary = async () => {
            setIsLoadingSummary(true);
            try {
                const res = await fetchDashboardV2Summary({
                    branch: selectedBranch !== 'ALL' ? selectedBranch : undefined,
                    job_type: jobType !== 'ALL' ? jobType : undefined,
                    search: searchQuery || undefined
                });
                if (res?.data) {
                    setSummary(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch v2 summary", err);
            } finally {
                setIsLoadingSummary(false);
            }
        };
        fetchSummary();
    }, [selectedBranch, jobType, searchQuery, isRefreshing]);

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Soft decorative background glow */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

            <div className="w-full flex-1 overflow-y-auto px-4 md:px-8 py-6 z-10 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
                    
                    <DashboardFilterBar 
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        selectedBranch={selectedBranch}
                        onBranchChange={onBranchChange}
                        accessibleBranches={accessibleBranches}

                        isSuperAdmin={isSuperAdmin}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        jobType={jobType}
                        onJobTypeChange={onJobTypeChange}
                    />
                    
                    <div className="mt-2">
                        <DashboardKPICards 
                            summary={summary}
                            isLoading={isLoadingSummary}
                            onCardClick={handleCardClick}
                        />
                    </div>
                    
                    <DashboardAnalytics 
                        summary={summary}
                        isLoading={isLoadingSummary}
                        onCardClick={handleCardClick}
                    />

                    {/* Temporary dummy charts, can be updated later if requested */}
                    <div className="opacity-100">
                        <DashboardCharts 
                            projects={projects} 
                            isSuperAdmin={isSuperAdmin} 
                            accessibleBranches={accessibleBranches}
                            selectedBranch={selectedBranch}
                        />
                    </div>

                    <DashboardDrilldownModalV2 
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setActiveCard(null);
                        }}
                        initialCardType={activeCard}
                        searchQuery={searchQuery}
                        selectedBranch={selectedBranch}
                        jobType={jobType}
                    />
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02);
                }
                .elegant-shadow {
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
};
