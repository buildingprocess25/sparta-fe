import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

export type ContractorPerformancePeriod = 
    | "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "LAST_YEAR" | "YTD" | "ALL_TIME" | "CUSTOM";
export type ContractorJobType = "ALL" | "PROJECT" | "MAINTENANCE";

export interface ContractorGlobalSummary {
    avg_denda: number;
    avg_keterlambatan: number;
    sp_aktif_count: number;
    avg_kerja_tambah: number;
    avg_kerja_kurang: number;
}

export interface ContractorChartPoint {
    month: string;
    penawaran: number;
    spk: number;
    opname: number;
}

export interface ContractorLeaderboardRow {
    nama_kontraktor: string;
    avg_nilai_toko: number;
    history_sp_count: number;
    avg_design: number;
    avg_kualitas: number;
    avg_spek: number;
}

export function useContractorDashboard() {
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<ContractorGlobalSummary | null>(null);
    const [charts, setCharts] = useState<ContractorChartPoint[]>([]);
    const [leaderboard, setLeaderboard] = useState<ContractorLeaderboardRow[]>([]);
    const [filters, setFilters] = useState<{ cabang: string; job_type: string; period: ContractorPerformancePeriod; search?: string }>({
        cabang: 'ALL',
        job_type: 'ALL',
        period: 'THIS_YEAR'
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                cabang: filters.cabang,
                job_type: filters.job_type,
                period: filters.period
            });
            if (filters.search) queryParams.append('search', filters.search);

            const [summaryRes, chartsRes, leaderboardRes] = await Promise.all([
                apiFetch(`${API_URL}/api/dashboard/contractor/summary?${queryParams.toString()}`),
                apiFetch(`${API_URL}/api/dashboard/contractor/charts?${queryParams.toString()}`),
                apiFetch(`${API_URL}/api/dashboard/contractor/leaderboard?${queryParams.toString()}`)
            ]);

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data.data);
            }
            if (chartsRes.ok) {
                const data = await chartsRes.json();
                setCharts(data.data);
            }
            if (leaderboardRes.ok) {
                const data = await leaderboardRes.json();
                setLeaderboard(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch contractor dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        isLoading,
        summary,
        charts,
        leaderboard,
        filters,
        setFilters
    };
}
