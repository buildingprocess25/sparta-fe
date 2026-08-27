import React, { useState, useMemo } from 'react';
import { DashboardFilterBar } from './DashboardFilterBar';
import { DashboardKPICards } from './DashboardKPICards';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardCharts } from './DashboardCharts';
import { DashboardDrilldownModal } from './DashboardDrilldownModal';

interface DashboardViewV2Props {
    projects: any[]; // Ini adalah filteredProjects dari page.tsx
    allProjects?: any[];
    accessibleBranches: string[];
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
    isSuperAdmin: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    jobType: 'ALL' | 'RENOVASI' | 'REGULER';
    onJobTypeChange: (val: 'ALL' | 'RENOVASI' | 'REGULER') => void;
    tipeBangunan: 'ALL' | 'RUKO' | 'NON_RUKO';
    onTipeBangunanChange: (val: 'ALL' | 'RUKO' | 'NON_RUKO') => void;

    // Extracted from page.tsx
    searchQuery: string;
    onSearchChange: (val: string) => void;
    stats: any; // stats asli dari page.tsx
}

export const DashboardViewV2: React.FC<DashboardViewV2Props> = ({
    projects,
    allProjects,
    accessibleBranches,
    selectedBranch,
    onBranchChange,
    isSuperAdmin,
    onRefresh,
    isRefreshing,
    jobType,
    onJobTypeChange,
    tipeBangunan,
    onTipeBangunanChange,
    searchQuery,
    onSearchChange,
    stats
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<string | null>(null);

    const handleSearchChange = (val: string) => {
        onSearchChange(val);
        // Buka modal secara otomatis jika ada input pencarian
        if (val.trim().length > 0) {
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
        let totalNilaiSPK = 0;

        let totalNilaiIL = 0;
        let ilDone = 0;
        let ilOngoing = 0;

        let pengawasanSelesai = 0;
        let pengawasanProgress = 0;
        let pengawasanTerlambat = 0;

        let tambahHari = 0;
        let tambahHariDone = 0;
        let tambahHariOngoing = 0;
        let stCount = 0;
        let keterlambatanCount = 0;
        const now = new Date();

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
                    totalNilaiSPK += Number(s.grand_total || 0);

                    if (['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes(status)) {
                        spkDone++;
                    } else if (!['REJECTED', 'REJECT', 'DITOLAK', 'CANCELLED', 'CANCEL'].includes(status)) {
                        spkOngoing++;
                    }

                    // Tambah hari
                    if (s.pertambahan_spk && s.pertambahan_spk.length > 0) {
                        s.pertambahan_spk.forEach((pt: any) => {
                            const statusPt = String(pt?.status_persetujuan || '').toUpperCase();
                            if (['APPROVED', 'DISETUJUI', 'DISETUJUI BM'].includes(statusPt)) {
                                tambahHari += Number(pt.pertambahan_hari || 0);
                                tambahHariDone++;
                            } else if (!['REJECTED', 'REJECT', 'DITOLAK'].includes(statusPt)) {
                                tambahHariOngoing++;
                            }
                        });
                    }
                });
            }

            // Instruksi Lapangan
            if (p.instruksi_lapangan && p.instruksi_lapangan.length > 0) {
                p.instruksi_lapangan.forEach((il: any) => {
                    totalNilaiIL += Number(il.grand_total || 0);
                    const statusIL = String(il.status || '').toUpperCase();
                    if (['APPROVED', 'DISETUJUI', 'DISETUJUI BM', 'SELESAI', 'CLOSED', 'DONE', 'SPK_APPROVED'].includes(statusIL)) {
                        ilDone++;
                    } else {
                        ilOngoing++;
                    }
                });
            }

            // Pengawasan
            if (p.berkas_serah_terima && p.berkas_serah_terima.length > 0) {
                stCount++;
            }

            const groupedPengawasan = (p.gantt || []).reduce((acc: any, g: any) => {
                if (g.pengawasan && Array.isArray(g.pengawasan)) {
                    g.pengawasan.forEach((pw: any) => {
                        let dateKey = pw.tanggal_pengawasan || pw.created_at || 'unknown';
                        if (typeof dateKey === 'string') {
                            if (dateKey.includes('T')) dateKey = dateKey.split('T')[0];
                            else if (dateKey.includes(' ')) dateKey = dateKey.split(' ')[0];
                        }
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(pw);
                    });
                }
                return acc;
            }, {});

            Object.values(groupedPengawasan).forEach((groupItems: any) => {
                const isSelesai = groupItems.every((i: any) => ['SELESAI', 'CLOSED', 'DONE', 'SESUAI'].includes((i.status || '').toUpperCase()));
                const isTerlambat = groupItems.some((i: any) => ['TERLAMBAT', 'LATE'].includes((i.status || '').toUpperCase()));

                if (isSelesai) pengawasanSelesai++;
                else if (isTerlambat) pengawasanTerlambat++;
                else pengawasanProgress++;
            });

            // Keterlambatan calculation (belum ST tapi lewat batas)
            if ((!p.berkas_serah_terima || p.berkas_serah_terima.length === 0) && p.spk && p.spk.length > 0) {
                const spk = p.spk[0];
                const status = (spk.status || '').toUpperCase();
                // Only for active SPKs
                if (['APPROVED', 'ACTIVE', 'SPK_APPROVED', 'DISETUJUI', 'AKTIF', 'SELESAI'].includes(status)) {
                    const spkDateStr = spk.created_at || spk.waktu_persetujuan;
                    if (spkDateStr) {
                        const spkDate = new Date(spkDateStr);
                        if (!isNaN(spkDate.getTime())) {
                            const durasi = Number(spk.durasi) || 0;
                            const tsArray = spk.pertambahan_spk || [];
                            const tsDays = tsArray.reduce((acc: number, curr: any) => acc + (Number(curr.pertambahan_hari) || 0), 0);

                            const targetDate = new Date(spkDate);
                            targetDate.setDate(targetDate.getDate() + durasi + tsDays);

                            if (now > targetDate) {
                                keterlambatanCount++;
                            }
                        }
                    }
                }
            }
        });

        return {
            penawaranDone, penawaranOngoing,
            spkDone, spkOngoing, totalNilaiSPK,
            totalNilaiIL, ilDone, ilOngoing,
            pengawasanSelesai, pengawasanProgress, pengawasanTerlambat,
            tambahHariDone, tambahHariOngoing,
            tambahHariCount: tambahHariDone + tambahHariOngoing,
            avgTambahHari: tambahHariDone > 0 ? Math.round(tambahHari / tambahHariDone) : 0,
            spAktif: stats.attention, // fallback
            stCount,
            keterlambatanCount
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
                        jobType={jobType}
                        onJobTypeChange={onJobTypeChange}
                        tipeBangunan={tipeBangunan}
                        onTipeBangunanChange={onTipeBangunanChange}
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
                    <div className="opacity-100">
                        <DashboardCharts
                            projects={projects}
                            isSuperAdmin={isSuperAdmin}
                            accessibleBranches={accessibleBranches}
                            selectedBranch={selectedBranch}
                        />
                    </div>

                    <DashboardDrilldownModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            onSearchChange('');
                        }}
                        initialCardType={activeCard}
                        projects={projects} // already filtered by search
                        allProjects={allProjects}
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
