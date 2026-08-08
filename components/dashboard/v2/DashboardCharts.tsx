import React from 'react';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { formatRupiah } from '@/lib/utils';
import type { DashboardV2Charts, DashboardV2Period } from '@/lib/dashboard-v2-api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DashboardChartsProps {
    charts: DashboardV2Charts | null;
    period: DashboardV2Period;
    onPeriodChange: (period: DashboardV2Period) => void;
}

const periodLabel: Record<DashboardV2Period, string> = {
    '1m': '1 Bulan',
    '3m': '3 Bulan',
    '6m': '6 Bulan',
    '1y': '1 Tahun',
    all: 'Semua',
};

const chartColors: Record<string, string[]> = {
    rab: ['#38bdf8', '#22c55e'],
    spk: ['#fb923c', '#2563eb'],
    release_st: ['#2563eb', '#10b981'],
    spk_vs_opname: ['#f97316', '#dc2626'],
};

const compactCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
    if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} jt`;
    return formatRupiah(value);
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ charts, period, onPeriodChange }) => {
    const chartItems = charts?.charts ?? [];

    return (
        <div className="mb-8 mt-1 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {chartItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400 shadow-sm xl:col-span-2">
                    Belum ada data grafik pada filter aktif.
                </div>
            ) : chartItems.map((chart) => {
                const isCurrency = chart.datasets.some((dataset) => dataset.kind === 'currency');
                const colors = chartColors[chart.id] ?? ['#0ea5e9', '#10b981'];
                const data = {
                    labels: chart.labels,
                    datasets: chart.datasets.map((dataset, index) => ({
                        label: dataset.label,
                        data: dataset.data,
                        backgroundColor: colors[index % colors.length],
                        borderRadius: 8,
                        maxBarThickness: 32,
                    })),
                };

                const hasData = chart.datasets.some((dataset) => dataset.data.some((value) => Number(value) > 0));

                return (
                    <section key={chart.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-black text-slate-800">{chart.title}</h3>
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                    Periode {periodLabel[period].toLowerCase()}
                                </p>
                            </div>
                            <Select value={period} onValueChange={(value) => onPeriodChange(value as DashboardV2Period)}>
                                <SelectTrigger className="h-9 w-[130px] rounded-xl border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                                    {periodLabel[period]}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">1 Bulan</SelectItem>
                                    <SelectItem value="3m">3 Bulan</SelectItem>
                                    <SelectItem value="6m">6 Bulan</SelectItem>
                                    <SelectItem value="1y">1 Tahun</SelectItem>
                                    <SelectItem value="all">Semua</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {hasData ? (
                            <div className="h-[280px]">
                                <Bar
                                    data={data}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                                align: 'center',
                                                labels: {
                                                    boxWidth: 10,
                                                    boxHeight: 10,
                                                    color: '#64748b',
                                                    font: { size: 11, weight: 'bold' },
                                                },
                                            },
                                            tooltip: {
                                                backgroundColor: '#0f172a',
                                                padding: 12,
                                                callbacks: {
                                                    label: (context) => {
                                                        const label = context.dataset.label || '';
                                                        const value = Number(context.raw || 0);
                                                        return `${label}: ${isCurrency ? formatRupiah(value) : value}`;
                                                    },
                                                },
                                            },
                                        },
                                        scales: {
                                            x: {
                                                grid: { display: false },
                                                ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' } },
                                            },
                                            y: {
                                                beginAtZero: true,
                                                grid: { color: '#f1f5f9' },
                                                ticks: {
                                                    color: '#94a3b8',
                                                    font: { size: 11, weight: 'bold' },
                                                    callback: (value) => isCurrency ? compactCurrency(Number(value)) : value,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
                                Belum ada data pada periode ini.
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};
