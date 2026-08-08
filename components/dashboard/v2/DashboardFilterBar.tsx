import React from 'react';
import { Loader2, MapPin, RefreshCw, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { DashboardV2JobType } from '@/lib/dashboard-v2-api';

interface DashboardFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    selectedBranch: string;
    onBranchChange: (value: string) => void;
    accessibleBranches: string[];
    isSuperAdmin: boolean;
    jobType: DashboardV2JobType;
    onJobTypeChange: (value: DashboardV2JobType) => void;
    onRefresh: () => void | Promise<void>;
    isRefreshing: boolean;
}

const jobTypeLabels: Record<DashboardV2JobType, string> = {
    ALL: 'Semua Tipe',
    REGULER: 'Reguler',
    RENOVASI: 'Renovasi',
};

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    selectedBranch,
    onBranchChange,
    accessibleBranches,
    isSuperAdmin,
    jobType,
    onJobTypeChange,
    onRefresh,
    isRefreshing,
}) => {
    const showBranchFilter = isSuperAdmin && accessibleBranches.length > 1;

    return (
        <form
            className="sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
            onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit();
            }}
        >
            <div className="relative min-w-[260px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    placeholder="Cari Proyek, No ULOK, Kontraktor..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>

            {showBranchFilter && (
                <div className="w-[190px] max-w-full">
                    <Select value={selectedBranch} onValueChange={onBranchChange}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 text-sm font-semibold">
                            <div className="flex min-w-0 items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="truncate">{selectedBranch === 'ALL' ? 'Semua Cabang' : selectedBranch}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Cabang</SelectItem>
                            {accessibleBranches.map((branch) => (
                                <SelectItem key={branch} value={branch}>
                                    {branch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="w-[150px] max-w-full">
                <Select value={jobType} onValueChange={(value) => onJobTypeChange(value as DashboardV2JobType)}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 text-sm font-semibold">
                        {jobTypeLabels[jobType]}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Tipe</SelectItem>
                        <SelectItem value="REGULER">Reguler</SelectItem>
                        <SelectItem value="RENOVASI">Renovasi</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200 px-3 text-sm font-bold text-slate-700"
                onClick={onRefresh}
                disabled={isRefreshing}
            >
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
            </Button>
        </form>
    );
};
