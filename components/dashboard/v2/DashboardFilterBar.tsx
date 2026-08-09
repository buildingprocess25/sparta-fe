import React from 'react';
import { Search, MapPin, Loader2, Download, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DashboardFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedBranch: string;
    onBranchChange: (value: string) => void;
    accessibleBranches: string[];
    isSuperAdmin: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    jobType: 'ALL' | 'RENOVASI' | 'REGULER';
    onJobTypeChange: (value: 'ALL' | 'RENOVASI' | 'REGULER') => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    selectedBranch,
    onBranchChange,
    accessibleBranches,
    isSuperAdmin,
    onRefresh,
    isRefreshing,
    jobType,
    onJobTypeChange
}) => {
    return (
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center relative z-30 mb-6">
            <div className="flex-1 min-w-[250px] relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 mt-0.5">
                    <Search className="w-4 h-4" />
                </span>
                <input 
                    type="text" 
                    placeholder="Cari Proyek, No ULOK, Kontraktor..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition text-slate-700"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            
            {accessibleBranches.length > 1 && (
                <div className="w-full md:w-56">
                    <Select value={selectedBranch} onValueChange={onBranchChange}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-[42px] focus:ring-1 focus:ring-red-500">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="truncate text-sm font-semibold">
                                    {selectedBranch === 'all' ? 'Semua Cabang' : selectedBranch}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">
                                <span className="font-bold text-red-600">Semua Cabang</span>
                            </SelectItem>
                            {accessibleBranches.map((branch) => (
                                <SelectItem key={branch} value={branch} className="font-medium text-slate-700">
                                    {branch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="w-full md:w-48">
                <Select value={jobType} onValueChange={(val: any) => onJobTypeChange(val)}>
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-[42px] focus:ring-1 focus:ring-red-500">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            {jobType === 'ALL' ? 'Semua Tipe Proyek' : jobType === 'RENOVASI' ? 'Renovasi' : 'Reguler'}
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL"><span className="font-bold text-slate-800">Semua Tipe Proyek</span></SelectItem>
                        <SelectItem value="RENOVASI"><span className="font-medium text-slate-700">Renovasi</span></SelectItem>
                        <SelectItem value="REGULER"><span className="font-medium text-slate-700">Reguler</span></SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-[42px] px-6 font-semibold shadow-sm transition-all flex-1 md:flex-none"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Segarkan
                </Button>
            </div>
        </div>
    );
};
