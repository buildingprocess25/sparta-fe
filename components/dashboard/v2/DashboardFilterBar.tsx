import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Download, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const handleSearch = () => {
        onSearchChange(localSearch);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center relative z-30 mb-6">
            <div className="flex-1 min-w-[250px] relative">
                <button 
                    className="absolute left-3.5 top-2.5 text-slate-400 mt-0.5 hover:text-red-500 focus:outline-none transition-colors"
                    onClick={handleSearch}
                    title="Klik untuk mencari"
                >
                    <Search className="w-4 h-4" />
                </button>
                <input 
                    type="text" 
                    placeholder="Cari Proyek, No ULOK, Kontraktor... (Tekan Enter)" 
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition text-slate-700"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {localSearch && (
                    <button 
                        onClick={() => { setLocalSearch(''); onSearchChange(''); }}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-red-500 mt-0.5 focus:outline-none transition-colors"
                        title="Hapus pencarian"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                )}
            </div>
            
            {accessibleBranches.length > 1 && (
                <div className="w-full md:w-56">
                    <Select value={selectedBranch} onValueChange={onBranchChange}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-[42px] focus:ring-1 focus:ring-red-500">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <SelectValue>
                                    <span className="truncate text-sm font-semibold">
                                        {selectedBranch.toUpperCase() === 'ALL' ? 'Semua Cabang' : selectedBranch}
                                    </span>
                                </SelectValue>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">
                                <span className="font-semibold text-red-600">Semua Cabang</span>
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
                        <SelectValue>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                {jobType === 'ALL' ? 'Semua Tipe Proyek' : jobType === 'RENOVASI' ? 'Renovasi' : 'Reguler'}
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL"><span className="font-semibold text-slate-800">Semua Tipe Proyek</span></SelectItem>
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
