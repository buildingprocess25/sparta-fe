import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatRupiah } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardChartsProps {
    trendData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            fill: boolean;
            tension: number;
        }[];
    };
    branchData: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
            borderRadius: number;
        }[];
    };
    budgetData: {
        labels: string[];
        datasets: {
            data: number[];
            backgroundColor: string[];
            borderWidth: number;
        }[];
    };
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
    trendData,
    branchData,
    budgetData
}) => {
    // Chart Options
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { boxWidth: 10, font: { family: 'Geist' } } },
            tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { family: 'Geist' }, bodyFont: { family: 'Geist' } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Geist' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Geist' } } }
        },
        interaction: { mode: 'index' as const, intersect: false },
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { family: 'Geist' }, bodyFont: { family: 'Geist' } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Geist' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Geist' } } }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: { position: 'right' as const, labels: { boxWidth: 12, padding: 20, font: { family: 'Geist' } } },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { family: 'Geist' },
                bodyFont: { family: 'Geist' },
                callbacks: {
                    label: function(context: any) {
                        return ' ' + context.label + ': ' + formatRupiah(context.raw);
                    }
                }
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Trend Pembangunan Bulanan</h3>
                </div>
                <div className="h-[280px]">
                    <Line data={trendData} options={lineOptions} />
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Distribusi Proyek per Cabang</h3>
                </div>
                <div className="h-[280px]">
                    <Bar data={branchData} options={barOptions} />
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Proporsi Anggaran Proyek</h3>
                </div>
                <div className="h-[300px] flex justify-center">
                    <Doughnut data={budgetData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
};
