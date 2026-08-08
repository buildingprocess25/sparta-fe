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
            className="relative z-30 mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
            onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit();
            }}
        >
            <div className="relative min-w-[280px] flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-4 w-4" />
                </span>
                <input
                    type="search"
                    name="dashboard-search"
                    autoComplete="off"
                    placeholder="Cari Proyek, No ULOK, Kontraktor..."
                    className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>

            {showBranchFilter && (
                <div className="w-full md:w-64">
                    <Select value={selectedBranch} onValueChange={onBranchChange}>
                        <SelectTrigger className="h-[42px] w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
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

            <div className="w-full sm:w-44">
                <Select value={jobType} onValueChange={(value) => onJobTypeChange(value as DashboardV2JobType)}>
                    <SelectTrigger className="h-[42px] w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
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
                className="h-[42px] flex-1 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:flex-none"
                onClick={onRefresh}
                disabled={isRefreshing}
            >
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
            </Button>
        </form>
    );
};
