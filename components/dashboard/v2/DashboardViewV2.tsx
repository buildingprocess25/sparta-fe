import React, { useState, useMemo } from 'react';
import { DashboardFilterBar } from './DashboardFilterBar';
import { DashboardKPICards } from './DashboardKPICards';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardCharts } from './DashboardCharts';
import { DashboardDrilldownModal } from './DashboardDrilldownModal';

interface DashboardViewV2Props {
    projects: any[]; // Ini adalah filteredProjects dari page.tsx
    accessibleBranches: string[];
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
    isSuperAdmin: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    onExport: (format: 'xlsx' | 'csv' | 'pdf') => void;
    isExporting: boolean;
    
    // Extracted from page.tsx
    searchQuery: string;
    onSearchChange: (val: string) => void;
    stats: any; // stats asli dari page.tsx
}

export const DashboardViewV2: React.FC<DashboardViewV2Props> = ({
    projects,
    accessibleBranches,
    selectedBranch,
    onBranchChange,
    isSuperAdmin,
    onRefresh,
    isRefreshing,
    onExport,
    isExporting,
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

    // 1. Extra logic missing from page.tsx (Penawaran Done/Ongoing, IL, dll)
    const extraStats = useMemo(() => {
        let penawaranDone = 0;
        let penawaranOngoing = 0;
        
        let spkDone = 0;
        let spkOngoing = 0;
        
        let totalNilaiIL = 0;
        let ilDone = 0;
        let ilOngoing = 0;

        let pengawasanSelesai = 0;
        let pengawasanProgress = 0;
        let pengawasanTerlambat = 0;

        let tambahHari = 0;
        let countTambahHari = 0;

        projects.forEach(p => {
            // Penawaran
            if (p.rab && p.rab.length > 0) {
                const r = p.rab[0];
                if ((r.status || '').toUpperCase() === 'DISETUJUI') {
                    penawaranDone++;
                } else {
                    penawaranOngoing++;
                }
            }

            // SPK
            if (p.spk && p.spk.length > 0) {
                p.spk.forEach((s: any) => {
                    const status = (s.status || '').toUpperCase();
                    if (!['REJECTED', 'REJECT', 'CANCELLED', 'CANCEL'].includes(status)) {
                        if (['SELESAI', 'CLOSED'].includes(status) || p.berkas_serah_terima?.length > 0) {
                            spkDone++;
                        } else {
                            spkOngoing++;
                        }
                    }

                    // Tambah hari
                    if (s.pertambahan_spk && s.pertambahan_spk.length > 0) {
                        s.pertambahan_spk.forEach((pt: any) => {
                            if (['APPROVED', 'DISETUJUI', 'DISETUJUI BM'].includes(String(pt?.status_persetujuan || '').toUpperCase())) {
                                tambahHari += Number(pt.pertambahan_hari || 0);
                                countTambahHari++;
                            }
                        });
                    }
                });
            }

            // Instruksi Lapangan
            if (p.instruksi_lapangan && p.instruksi_lapangan.length > 0) {
                p.instruksi_lapangan.forEach((il: any) => {
                    totalNilaiIL += Number(il.grand_total || 0);
                    if (il.status === 'APPROVED' || il.status === 'DISETUJUI') {
                        ilDone++;
                    } else {
                        ilOngoing++;
                    }
                });
            }

            // Pengawasan
            if (p.gantt && p.gantt.length > 0) {
                p.gantt.forEach((g: any) => {
                    if (g.pengawasan_gantt && g.pengawasan_gantt.length > 0) {
                        g.pengawasan_gantt.forEach((pw: any) => {
                            const bobot = Number(pw.bobot_realisasi || 0);
                            if (bobot >= 100) {
                                pengawasanSelesai++;
                            } else {
                                // Dummy logic for terlambat (kalau tgl akhir lewat)
                                if (new Date(pw.tanggal_akhir || g.end_date) < new Date()) {
                                    pengawasanTerlambat++;
                                } else {
                                    pengawasanProgress++;
                                }
                            }
                        });
                    }
                });
            }
        });

        return {
            penawaranDone, penawaranOngoing,
            spkDone, spkOngoing,
            totalNilaiIL, ilDone, ilOngoing,
            pengawasanSelesai, pengawasanProgress, pengawasanTerlambat,
            tambahHariCount: countTambahHari,
            avgTambahHari: countTambahHari > 0 ? Math.round(tambahHari / countTambahHari) : 0,
            spAktif: stats.attention // fallback
        };
    }, [projects, stats]);

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
                        onExport={onExport}
                        isExporting={isExporting}
                    />
                    
                    <div className="mt-2">
                        <DashboardKPICards 
                            stats={stats}
                            extraStats={extraStats}
                            onCardClick={handleCardClick}
                        />
                    </div>
                    
                    <DashboardAnalytics 
                        stats={stats}
                        extraStats={extraStats}
                        onCardClick={handleCardClick}
                    />

                    {/* Temporary dummy charts, can be updated later if requested */}
                    <div className="opacity-90">
                        <DashboardCharts 
                            trendData={{
                                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                datasets: [{ label: 'Proyek', data: [12, 19, 15, 25, 22, 30], borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', fill: true, tension: 0.4 }]
                            }}
                            branchData={{
                                labels: accessibleBranches.slice(0, 5),
                                datasets: [{ label: 'Proyek', data: [45, 32, 28, 56, 41], backgroundColor: '#1e293b', borderRadius: 6 }]
                            }}
                            budgetData={{
                                labels: ['Reguler', 'Renovasi', 'Relokasi'],
                                datasets: [{ data: [45, 35, 20], backgroundColor: ['#0ea5e9', '#1e293b', '#e2e8f0'], borderWidth: 0 }]
                            }}
                        />
                    </div>

                    <DashboardDrilldownModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        initialCardType={activeCard}
                        projects={projects} // already filtered by search
                        searchQuery={searchQuery}
                        stats={stats}
                        extraStats={extraStats}
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
