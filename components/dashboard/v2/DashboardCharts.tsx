import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/utils';
import { getParentBranch, getSubBranchesForParent } from '@/lib/constants';
type DashboardData = any;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface DashboardChartsProps {
    projects: DashboardData[];
    isSuperAdmin?: boolean;
    accessibleBranches?: string[];
    selectedBranch?: string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ projects, isSuperAdmin, accessibleBranches, selectedBranch }) => {
    // Each chart has its own time filter state
    const [filterRab, setFilterRab] = useState<string>('semua');
    const [filterSpk, setFilterSpk] = useState<string>('semua');
    const [filterSt, setFilterSt] = useState<string>('semua');
    const [filterNilai, setFilterNilai] = useState<string>('semua');

    // Helper to get cutoff date
    const getCutoffDate = (filter: string) => {
        if (filter === 'semua') return null;
        const now = new Date();
        if (filter === '1') now.setMonth(now.getMonth() - 1);
        if (filter === '3') now.setMonth(now.getMonth() - 3);
        if (filter === '6') now.setMonth(now.getMonth() - 6);
        if (filter === '12') now.setFullYear(now.getFullYear() - 1);
        return now;
    };

    const baseLabels = useMemo(() => {
        if (!accessibleBranches || accessibleBranches.length === 0) return [];
        if (selectedBranch === 'ALL' || !selectedBranch) {
            return accessibleBranches;
        } else {
            if (isSuperAdmin) {
                return getSubBranchesForParent(selectedBranch);
            } else {
                return [selectedBranch];
            }
        }
    }, [accessibleBranches, selectedBranch, isSuperAdmin]);

    const getBranchName = (cabang: string | null | undefined, isSuperAdmin: boolean) => {
        const rawCabang = (cabang || 'UNKNOWN').toUpperCase();
        if (selectedBranch === 'ALL' || !selectedBranch) {
            if (isSuperAdmin) return getParentBranch(rawCabang) || rawCabang;
            return rawCabang;
        } else {
            // When filtered to a specific branch group, break it down to sub-branches
            return rawCabang;
        }
    };

    // --- CHART A: RAB Dibuat vs RAB Approved ---
    const dataRab = useMemo(() => {
        const cutoff = getCutoffDate(filterRab);
        const mapDibuat: Record<string, number> = {};
        const mapApproved: Record<string, number> = {};
        
        baseLabels.forEach(l => {
            mapDibuat[l] = 0;
            mapApproved[l] = 0;
        });

        projects.forEach((p: any) => {
            const branchLabel = getBranchName(p.toko?.cabang, !!isSuperAdmin);
            if (!baseLabels.includes(branchLabel)) return;

            p.rab?.forEach((r: any) => {
                const dateDibuat = r.created_at;
                const dateApproved = r.waktu_persetujuan_direktur || r.waktu_persetujuan_manager || r.waktu_persetujuan_koordinator || r.waktu_persetujuan || (['DISETUJUI', 'MENUNGGU GANTT CHART'].includes(String(r.status).toUpperCase()) ? r.updated_at : null);
                
                if (dateDibuat) {
                    const d = new Date(dateDibuat);
                    if (!cutoff || d >= cutoff) {
                        mapDibuat[branchLabel] = (mapDibuat[branchLabel] || 0) + 1;
                    }
                }
                
                const status = String(r.status).toUpperCase();
                if (dateApproved && (status === 'DISETUJUI' || status === 'MENUNGGU GANTT CHART' || status === 'APPROVED')) {
                    const d = new Date(dateApproved);
                    if (!cutoff || d >= cutoff) {
                        mapApproved[branchLabel] = (mapApproved[branchLabel] || 0) + 1;
                    }
                }
            });
        });

        // Collect all unique labels and sort them
        const labelsSet = new Set([...baseLabels, ...Object.keys(mapDibuat), ...Object.keys(mapApproved)]);
        const labels = Array.from(labelsSet)
            .filter(l => !['TERISI', 'TESTING'].includes(l.toUpperCase()))
            .sort((a, b) => {
                const sumA = (mapDibuat[a] || 0) + (mapApproved[a] || 0);
                const sumB = (mapDibuat[b] || 0) + (mapApproved[b] || 0);
                return sumB - sumA;
            });
        
        return {
            labels,
            datasets: [
                { label: 'RAB Dibuat', data: labels.map(l => mapDibuat[l] || 0), backgroundColor: '#cbd5e1', borderRadius: 4 },
                { label: 'RAB Approved', data: labels.map(l => mapApproved[l] || 0), backgroundColor: '#0ea5e9', borderRadius: 4 }
            ]
        };
    }, [projects, filterRab]);

    // --- CHART B: SPK Dibuat vs SPK Approved ---
    const dataSpk = useMemo(() => {
        const cutoff = getCutoffDate(filterSpk);
        const mapDibuat: Record<string, number> = {};
        const mapApproved: Record<string, number> = {};

        baseLabels.forEach(l => {
            mapDibuat[l] = 0;
            mapApproved[l] = 0;
        });

        projects.forEach((p: any) => {
            const branchLabel = getBranchName(p.toko?.cabang, !!isSuperAdmin);
            if (!baseLabels.includes(branchLabel)) return;

            p.spk?.forEach((s: any) => {
                const dateDibuat = s.created_at;
                const dateApproved = s.waktu_persetujuan || s.updated_at;
                
                if (dateDibuat) {
                    const d = new Date(dateDibuat);
                    if (!cutoff || d >= cutoff) {
                        mapDibuat[branchLabel] = (mapDibuat[branchLabel] || 0) + 1;
                    }
                }
                
                if (dateApproved && ['APPROVED', 'ACTIVE', 'AKTIF', 'SPK_APPROVED', 'SELESAI', 'DISETUJUI'].includes(String(s.status).toUpperCase())) {
                    const d = new Date(dateApproved);
                    if (!cutoff || d >= cutoff) {
                        mapApproved[branchLabel] = (mapApproved[branchLabel] || 0) + 1;
                    }
                }
            });
        });

        const labelsSet = new Set([...baseLabels, ...Object.keys(mapDibuat), ...Object.keys(mapApproved)]);
        const labels = Array.from(labelsSet)
            .filter(l => !['TERISI', 'TESTING'].includes(l.toUpperCase()))
            .sort((a, b) => {
                const sumA = (mapDibuat[a] || 0) + (mapApproved[a] || 0);
                const sumB = (mapDibuat[b] || 0) + (mapApproved[b] || 0);
                return sumB - sumA;
            });
        
        return {
            labels,
            datasets: [
                { label: 'SPK Dibuat', data: labels.map(l => mapDibuat[l] || 0), backgroundColor: '#e2e8f0', borderRadius: 4 },
                { label: 'SPK Approved', data: labels.map(l => mapApproved[l] || 0), backgroundColor: '#10b981', borderRadius: 4 }
            ]
        };
    }, [projects, filterSpk, isSuperAdmin]);

    // --- CHART C: SPK Release vs Serah Terima ---
    const dataSpkRelease = useMemo(() => {
        const cutoff = getCutoffDate(filterSt);
        const mapSpkRelease: Record<string, number> = {};
        const mapST: Record<string, number> = {};
        const mapHabisDurasi: Record<string, number> = {};
        const now = new Date();

        baseLabels.forEach(l => {
            mapSpkRelease[l] = 0;
            mapST[l] = 0;
            mapHabisDurasi[l] = 0;
        });

        projects.forEach((p: any) => {
            const branchLabel = getBranchName(p.toko?.cabang, !!isSuperAdmin);
            if (!baseLabels.includes(branchLabel)) return;

            p.spk?.forEach((s: any) => {
                const dateApproved = s.waktu_persetujuan || s.updated_at;
                if (dateApproved && ['APPROVED', 'ACTIVE', 'AKTIF', 'SPK_APPROVED', 'SELESAI', 'DISETUJUI'].includes(String(s.status).toUpperCase())) {
                    const d = new Date(dateApproved);
                    if (!cutoff || d >= cutoff) {
                        mapSpkRelease[branchLabel] = (mapSpkRelease[branchLabel] || 0) + 1;
                        
                        // Cek Habis Durasi
                        const hasST = p.berkas_serah_terima && p.berkas_serah_terima.length > 0;
                        if (!hasST) {
                            // Menggunakan waktu_selesai asli dari DB sebagai base date
                            const baseEndDate = s.waktu_selesai || s.created_at || s.waktu_persetujuan;
                            if (baseEndDate) {
                                const targetDate = new Date(baseEndDate);
                                if (!isNaN(targetDate.getTime())) {
                                    // Tambahkan total hari dari adendum/pertambahan SPK yang di-approve
                                    const tsArray = s.pertambahan_spk || [];
                                    const tsDays = tsArray.reduce((acc: number, curr: any) => {
                                        if(['APPROVED', 'DISETUJUI', 'DISETUJUI BM'].includes(String(curr.status_persetujuan || '').toUpperCase())) {
                                            return acc + (Number(curr.pertambahan_hari) || 0);
                                        }
                                        return acc;
                                    }, 0);
                                    
                                    // Jika waktu_selesai tidak ada, fallback hitung manual durasi
                                    if (!s.waktu_selesai) {
                                        const durasi = Number(s.durasi) || 0;
                                        targetDate.setDate(targetDate.getDate() + durasi);
                                    }
                                    
                                    targetDate.setDate(targetDate.getDate() + tsDays);
                                    
                                    if (now > targetDate) {
                                        mapHabisDurasi[branchLabel] = (mapHabisDurasi[branchLabel] || 0) + 1;
                                    }
                                }
                            }
                        }
                    }
                }
            });

            p.berkas_serah_terima?.forEach((st: any) => {
                const dST = st.created_at;
                if (dST) {
                    const d = new Date(dST);
                    if (!cutoff || d >= cutoff) {
                        mapST[branchLabel] = (mapST[branchLabel] || 0) + 1;
                    }
                }
            });
        });

        const labelsSet = new Set([...baseLabels, ...Object.keys(mapSpkRelease), ...Object.keys(mapST), ...Object.keys(mapHabisDurasi)]);
        const labels = Array.from(labelsSet)
            .filter(l => !['TERISI', 'TESTING'].includes(l.toUpperCase()))
            .sort((a, b) => {
                const sumA = (mapSpkRelease[a] || 0) + (mapST[a] || 0) + (mapHabisDurasi[a] || 0);
                const sumB = (mapSpkRelease[b] || 0) + (mapST[b] || 0) + (mapHabisDurasi[b] || 0);
                return sumB - sumA;
            });
        
        return {
            labels,
            datasets: [
                { label: 'SPK Release', data: labels.map(l => mapSpkRelease[l] || 0), backgroundColor: '#f87171', borderRadius: 4 },
                { label: 'Serah Terima', data: labels.map(l => mapST[l] || 0), backgroundColor: '#8b5cf6', borderRadius: 4 },
                { label: 'SPK Habis Durasi', data: labels.map(l => mapHabisDurasi[l] || 0), backgroundColor: '#fbbf24', borderRadius: 4 }
            ]
        };
    }, [projects, filterSt]);

    // --- CHART D: Nilai SPK vs Nilai Grand Opname Final ---
    const dataNilai = useMemo(() => {
        const cutoff = getCutoffDate(filterNilai);
        const mapNilaiSpk: Record<string, number> = {};
        const mapNilaiOpname: Record<string, number> = {};

        baseLabels.forEach(l => {
            mapNilaiSpk[l] = 0;
            mapNilaiOpname[l] = 0;
        });

        projects.forEach((p: any) => {
            const branchLabel = getBranchName(p.toko?.cabang, !!isSuperAdmin);
            if (!baseLabels.includes(branchLabel)) return;

            // Opname
            const opnames = p.opname_final || [];
            const ofinal = opnames.find((o: any) => o.tipe_opname !== 'OPNAME');
            
            // "Nilai SPK vs Nilai opname final, gunakan nilai SPK yang hanya udah Opname final aja, yang belum jangan di bawa bawa"
            if (!ofinal) return; // Skip entirely if no Opname Final!

            if (ofinal && ofinal.created_at) {
                const d = new Date(ofinal.created_at);
                if (!cutoff || d >= cutoff) {
                    mapNilaiOpname[branchLabel] = (mapNilaiOpname[branchLabel] || 0) + Number(ofinal.grand_total_final || ofinal.grand_total_opname || ofinal.nilai_opname || 0);
                }
            }

            // SPK
            p.spk?.forEach((s: any) => {
                const dateApproved = s.waktu_persetujuan || s.updated_at;
                if (dateApproved && ['APPROVED', 'ACTIVE', 'AKTIF', 'SPK_APPROVED', 'SELESAI', 'DISETUJUI'].includes(String(s.status).toUpperCase())) {
                    const d = new Date(dateApproved);
                    if (!cutoff || d >= cutoff) {
                        mapNilaiSpk[branchLabel] = (mapNilaiSpk[branchLabel] || 0) + Number(s.grand_total || 0);
                    }
                }
            });
        });

        const labelsSet = new Set([...baseLabels, ...Object.keys(mapNilaiSpk), ...Object.keys(mapNilaiOpname)]);
        const labels = Array.from(labelsSet)
            .filter(l => !['TERISI', 'TESTING'].includes(l.toUpperCase()))
            .sort((a, b) => {
                const sumA = (mapNilaiSpk[a] || 0) + (mapNilaiOpname[a] || 0);
                const sumB = (mapNilaiSpk[b] || 0) + (mapNilaiOpname[b] || 0);
                return sumB - sumA;
            });
        
        return {
            labels,
            datasets: [
                { label: 'Nilai SPK', data: labels.map(l => mapNilaiSpk[l] || 0), backgroundColor: '#fbbf24', borderRadius: 4 },
                { label: 'Nilai Opname Final', data: labels.map(l => mapNilaiOpname[l] || 0), backgroundColor: '#2dd4bf', borderRadius: 4 }
            ]
        };
    }, [projects, filterNilai]);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { font: { family: 'Geist' }, usePointStyle: true, padding: 20 } },
            tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { family: 'Geist' }, bodyFont: { family: 'Geist' } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Geist' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Geist' } } }
        }
    };

    const currencyOptions = {
        ...commonOptions,
        plugins: {
            ...commonOptions.plugins,
            tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {
                    label: function(context: any) {
                        return ' ' + context.dataset.label + ': ' + formatRupiah(context.raw);
                    }
                }
            }
        },
        scales: {
            ...commonOptions.scales,
            y: {
                ...commonOptions.scales.y,
                ticks: {
                    ...commonOptions.scales.y.ticks,
                    callback: function(value: any) {
                        if (value >= 1000000000) return 'Rp ' + (value / 1000000000).toFixed(1) + ' M';
                        if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + ' Jt';
                        return value;
                    }
                }
            }
        }
    };

    const FilterDropdown = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filter Waktu" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="1">1 Bulan Terakhir</SelectItem>
                <SelectItem value="3">3 Bulan Terakhir</SelectItem>
                <SelectItem value="6">6 Bulan Terakhir</SelectItem>
                <SelectItem value="12">1 Tahun Terakhir</SelectItem>
                <SelectItem value="semua">Semua Waktu</SelectItem>
            </SelectContent>
        </Select>
    );

    return (
        <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 elegant-shadow w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <h3 className="font-bold text-xl text-slate-800 tracking-tight">Perbandingan RAB</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <FilterDropdown value={filterRab} onChange={setFilterRab} />
                    </div>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                    <div className="h-[350px] md:h-[400px] min-w-[800px] xl:min-w-[1000px]">
                        <Bar data={dataRab} options={commonOptions} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 elegant-shadow w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <h3 className="font-bold text-xl text-slate-800 tracking-tight">Perbandingan SPK</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <FilterDropdown value={filterSpk} onChange={setFilterSpk} />
                    </div>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                    <div className="h-[350px] md:h-[400px] min-w-[800px] xl:min-w-[1000px]">
                        <Bar data={dataSpk} options={commonOptions} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 elegant-shadow w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <h3 className="font-bold text-xl text-slate-800 tracking-tight">SPK Release vs Serah Terima</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <FilterDropdown value={filterSt} onChange={setFilterSt} />
                    </div>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                    <div className="h-[350px] md:h-[400px] min-w-[800px] xl:min-w-[1000px]">
                        <Bar data={dataSpkRelease} options={commonOptions} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 elegant-shadow w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <h3 className="font-bold text-xl text-slate-800 tracking-tight">Nilai SPK vs Opname Final</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <FilterDropdown value={filterNilai} onChange={setFilterNilai} />
                    </div>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                    <div className="h-[350px] md:h-[400px] min-w-[800px] xl:min-w-[1000px]">
                        <Bar data={dataNilai} options={currencyOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};


