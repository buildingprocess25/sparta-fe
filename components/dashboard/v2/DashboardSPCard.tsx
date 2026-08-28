"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, FileText, Activity } from 'lucide-react';
import { fetchDendaActions, type DendaAction } from '@/lib/denda-actions-api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isViewOnlyUser } from '@/lib/constants';
import { useSession } from '@/context/SessionContext';

interface DashboardSPCardProps {
    selectedBranch: string;
    onCardClick: (cardType: string, data?: any) => void;
}

export const DashboardSPCard: React.FC<DashboardSPCardProps> = ({ selectedBranch, onCardClick }) => {
    const { user } = useSession();
    const [spList, setSpList] = useState<DendaAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Fetch all SPs user is authorized to see
        fetchDendaActions({ action_type: 'SP' })
            .then(res => {
                if (res.data) {
                    setSpList(res.data);
                }
            })
            .catch(err => console.error("Gagal mengambil data Surat Peringatan:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const isContractor = user?.roles?.some(r => r.includes('KONTRAKTOR') || r.includes('DIREKTUR'));

    // Filter SPs based on selected branch and active status
    const filteredSp = spList.filter(sp => {
        // Must be active and in a relevant state
        if (!sp.is_active) return false;
        if (!['WAITING_MANAGER', 'APPROVED', 'SENT_TO_CONTRACTOR', 'VIEWED_BY_CONTRACTOR', 'ACKNOWLEDGED_BY_CONTRACTOR'].includes(sp.status)) {
            return false;
        }

        // Branch filtering
        if (selectedBranch && selectedBranch !== 'ALL') {
            // If the user selected a specific branch
            if (sp.cabang) {
                // If it has a branch, must match
                if (sp.cabang.toUpperCase() !== selectedBranch.toUpperCase()) return false;
            } else {
                // Global SP (no branch). 
                // If contractor, they should always see their global SPs regardless of branch filter.
                // If internal user, maybe they shouldn't see it if filtered by branch?
                if (!isContractor) return false; 
            }
        }
        return true;
    });

    if (!isLoading && filteredSp.length === 0) {
        return null; // Do not render if no active SPs in this branch
    }

    // Hitung stat
    const sp3Count = filteredSp.filter(sp => sp.sp_level === 3).length;
    const pendingAckCount = filteredSp.filter(sp => ['SENT_TO_CONTRACTOR', 'VIEWED_BY_CONTRACTOR'].includes(sp.status)).length;
    const highestLevel = Math.max(0, ...filteredSp.map(sp => sp.sp_level || 0));

    return (
        <div 
            onClick={() => onCardClick('SURAT_PERINGATAN_LIST', { list: filteredSp })}
            className={cn(
                "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
                "bg-white border border-red-200 shadow-sm hover:shadow-md hover:border-red-300 hover:-translate-y-1 mb-2",
                isLoading && "animate-pulse bg-slate-50 border-slate-200 pointer-events-none"
            )}
        >
            {/* Subtle red glow in the background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 group-hover:scale-105 transition-transform duration-300">
                        {isLoading ? (
                            <Activity className="w-6 h-6 text-red-300 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2.5} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-slate-800 font-bold text-lg md:text-xl tracking-tight flex items-center gap-2">
                            Peringatan Kontraktor
                            {!isLoading && filteredSp.length > 0 && (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 font-bold shadow-sm px-2">
                                    {filteredSp.length} Aktif
                                </Badge>
                            )}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xl leading-relaxed font-medium">
                            {isLoading 
                                ? "Memuat status peringatan..."
                                : isContractor
                                    ? "Perhatian: Anda memiliki Surat Peringatan aktif yang perlu ditindaklanjuti. Segera periksa dokumen SP Anda."
                                    : "Terdapat kontraktor dengan Surat Peringatan aktif di cabang ini. Klik untuk melihat rincian peringatan."
                            }
                        </p>
                    </div>
                </div>

                {!isLoading && (
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end mt-2 md:mt-0">
                        <div className="flex gap-2">
                            {highestLevel > 0 && (
                                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex flex-col items-center justify-center min-w-[70px]">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level Max</span>
                                    <span className="text-lg font-black text-red-600 leading-none mt-1">SP{highestLevel}</span>
                                </div>
                            )}
                            {isContractor && pendingAckCount > 0 && (
                                <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex flex-col items-center justify-center min-w-[70px] shadow-sm relative">
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Konfirmasi</span>
                                    <span className="text-lg font-black text-amber-600 leading-none mt-1">{pendingAckCount}</span>
                                </div>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors duration-300 shrink-0 ml-2">
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors duration-300" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
