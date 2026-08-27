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
                "bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_8px_30px_rgb(225,29,72,0.15)] hover:shadow-[0_8px_40px_rgb(225,29,72,0.3)] hover:-translate-y-1 mb-2",
                isLoading && "animate-pulse from-slate-200 to-slate-300 pointer-events-none"
            )}
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
            
            <div className="relative p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        {isLoading ? (
                            <Activity className="w-6 h-6 text-white/50 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg md:text-xl tracking-tight flex items-center gap-2">
                            Peringatan Kontraktor
                            {!isLoading && filteredSp.length > 0 && (
                                <Badge className="bg-white text-red-600 hover:bg-white/90 border-0 font-black shadow-sm">
                                    {filteredSp.length} Aktif
                                </Badge>
                            )}
                        </h3>
                        <p className="text-red-100 text-sm mt-1 max-w-xl leading-relaxed font-medium">
                            {isLoading 
                                ? "Memuat status peringatan..."
                                : isContractor
                                    ? "Perhatian: Anda memiliki Surat Peringatan aktif yang perlu ditindaklanjuti. Segera periksa detailnya untuk menghindari sanksi lanjutan."
                                    : "Terdapat kontraktor dengan Surat Peringatan aktif di cabang ini. Klik untuk melihat rincian tindakan pendisiplinan."
                            }
                        </p>
                    </div>
                </div>

                {!isLoading && (
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end mt-2 md:mt-0">
                        <div className="flex gap-2">
                            {highestLevel > 0 && (
                                <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                                    <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider">Level Max</span>
                                    <span className="text-lg font-black text-white leading-none mt-1">SP{highestLevel}</span>
                                </div>
                            )}
                            {isContractor && pendingAckCount > 0 && (
                                <div className="bg-amber-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex flex-col items-center justify-center animate-pulse min-w-[70px] shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                    <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider">Konfirmasi</span>
                                    <span className="text-lg font-black text-white leading-none mt-1">{pendingAckCount}</span>
                                </div>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white transition-colors duration-300 shrink-0 ml-2">
                            <ChevronRight className="w-5 h-5 text-white group-hover:text-red-600 transition-colors duration-300" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
