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
    onExport: (format: 'xlsx' | 'csv' | 'pdf') => void;
    isExporting: boolean;
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
    onExport,
    isExporting
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
                <div className="w-full md:w-64">
                    <Select value={selectedBranch} onValueChange={onBranchChange}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl h-[42px]">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="truncate">
                                    {selectedBranch === 'all' ? 'Semua Cabang' : selectedBranch}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="font-semibold text-red-600">Semua Cabang</span>
                            </SelectItem>
                            {accessibleBranches.map((branch) => (
                                <SelectItem key={branch} value={branch}>
                                    {branch}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-[42px] flex-1 md:flex-none"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-[42px] flex-1 md:flex-none">
                            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Export Data
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">Format Unduhan</div>
                        <DropdownMenuItem onClick={() => onExport('xlsx')} className="cursor-pointer rounded-lg py-2">
                            <span className="font-medium text-green-700">Excel (.xlsx)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer rounded-lg py-2">
                            <span className="font-medium text-slate-700">CSV (.csv)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer rounded-lg py-2">
                            <span className="font-medium text-red-600">PDF Document</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
