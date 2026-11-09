import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

export type ContractorPerformancePeriod = 
    | "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "LAST_YEAR" | "YTD" | "ALL_TIME" | "CUSTOM";
export type ContractorJobType = "ALL" | "PROJECT" | "MAINTENANCE";

export interface ContractorGlobalSummary {
    total_denda: number;
    total_keterlambatan: number;
    avg_denda: number;
    avg_keterlambatan: number;
    sp_aktif_count: number;
    avg_kerja_tambah: number;
    avg_kerja_kurang: number;
    total_kerja_tambah: number;
    total_kerja_kurang: number;
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
    const [allSpHistory, setAllSpHistory] = useState<any[]>([]);
    const [balanceChart, setBalanceChart] = useState<any[]>([]);
    const [availableCabangs, setAvailableCabangs] = useState<string[]>([]);
    const [availableKontraktors, setAvailableKontraktors] = useState<string[]>([]);
    const [filters, setFilters] = useState<{ cabang: string; job_type: string; period: ContractorPerformancePeriod; search?: string; proyek?: string; bangunan?: string; kontraktor?: string }>({
        cabang: 'ALL',
        job_type: 'ALL',
        period: 'ALL_TIME',
        proyek: 'ALL',
        bangunan: 'ALL',
        kontraktor: 'ALL'
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
            if (filters.proyek) queryParams.append('proyek', filters.proyek);
            if (filters.bangunan) queryParams.append('bangunan', filters.bangunan);
            if (filters.kontraktor && filters.kontraktor !== 'ALL') queryParams.append('kontraktor', filters.kontraktor);

            const baseUrl = API_URL.replace(/\/$/, "");
            const [summaryRes, chartsRes, leaderboardRes, spAllRes, balanceChartRes, cabangsRes, kontraktorsRes] = await Promise.all([
                apiFetch(`${baseUrl}/api/dashboard/contractor/summary?${queryParams.toString()}`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/charts?${queryParams.toString()}`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/leaderboard?${queryParams.toString()}`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/all-sp-history?${queryParams.toString()}`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/balance-chart?${queryParams.toString()}`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/filters/cabang`),
                apiFetch(`${baseUrl}/api/dashboard/contractor/filters/kontraktor?cabang=${encodeURIComponent(filters.cabang || '')}`)
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
            if (spAllRes.ok) {
                const data = await spAllRes.json();
                setAllSpHistory(data.data);
            }
            if (balanceChartRes.ok) {
                const data = await balanceChartRes.json();
                setBalanceChart(data.data);
            }
            if (cabangsRes.ok) {
                const data = await cabangsRes.json();
                setAvailableCabangs(data.data || []);
            }
            if (kontraktorsRes.ok) {
                const data = await kontraktorsRes.json();
                setAvailableKontraktors(data.data || []);
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
        allSpHistory,
        balanceChart,
        availableCabangs,
        availableKontraktors,
        filters,
        setFilters
    };
}
