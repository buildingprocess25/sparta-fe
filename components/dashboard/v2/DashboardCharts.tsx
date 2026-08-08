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

const palette = ['#ef4444', '#0ea5e9', '#10b981', '#f59e0b'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ charts, period, onPeriodChange }) => {
    return (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-black text-slate-900">Grafik Dashboard</h3>
                    <p className="text-xs font-semibold text-slate-500">Perbandingan dokumen dan nilai proyek</p>
                </div>
                <Select value={period} onValueChange={(value) => onPeriodChange(value as DashboardV2Period)}>
                    <SelectTrigger className="h-9 w-[130px] rounded-lg border-slate-200 bg-slate-50 text-sm font-bold">
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

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {(charts?.charts ?? []).map((chart) => {
                    const isCurrency = chart.datasets.some((dataset) => dataset.kind === 'currency');
                    const data = {
                        labels: chart.labels,
                        datasets: chart.datasets.map((dataset, index) => ({
                            label: dataset.label,
                            data: dataset.data,
                            backgroundColor: palette[index % palette.length],
                            borderRadius: 6,
                            maxBarThickness: 34,
                        })),
                    };

                    return (
                        <div key={chart.id} className="h-[280px] rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                            <h4 className="mb-2 text-sm font-black text-slate-800">{chart.title}</h4>
                            <Bar
                                data={data}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: { boxWidth: 10, font: { size: 11, weight: 'bold' } },
                                        },
                                        tooltip: {
                                            backgroundColor: '#0f172a',
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
                                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: '#e2e8f0' },
                                            ticks: {
                                                font: { size: 11 },
                                                callback: (value) => isCurrency ? formatRupiah(Number(value)).replace('Rp ', 'Rp') : value,
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
