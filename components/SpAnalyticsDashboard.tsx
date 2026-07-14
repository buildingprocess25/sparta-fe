"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/constants";

type SpAnalytics = {
    stats: {
        total_sp: number;
        active_sp: number;
        expiring_soon: number;
        pending_acknowledge: number;
    };
    expiring_soon: number;
    critical_expiry: number;
    expiring_sp_list: Array<{
        id: number;
        nomor_surat: string | null;
        nama_kontraktor: string | null;
        cabang: string | null;
        sp_level: number | null;
        expires_at: string | null;
    }>;
};

export default function SpAnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<SpAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const res = await fetch(`${API_URL}/api/denda/actions/analytics`, {
                credentials: "include",
            });
            const json = await res.json();
            if (json.status === "success") {
                setAnalytics(json.data);
            }
        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </Card>
                ))}
            </div>
        );
    }

    if (!analytics) return null;

    const daysUntilExpiry = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6 mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-slate-600">Total SP</div>
                        <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {analytics.stats.total_sp}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Semua periode</div>
                </Card>

                <Card className="p-4 border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-slate-600">SP Aktif</div>
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {analytics.stats.active_sp}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Masih berlaku</div>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-slate-600">Pending Acknowledge</div>
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {analytics.stats.pending_acknowledge}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Belum diterima kontraktor</div>
                </Card>

                <Card className="p-4 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-slate-600">Expiring Soon</div>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {analytics.expiring_soon}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                        {analytics.critical_expiry} kritis (&lt; 7 hari)
                    </div>
                </Card>
            </div>

            {/* Expiring SP Alert */}
            {analytics.expiring_soon > 0 && (
                <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 mb-2">
                                ⚠️ {analytics.expiring_soon} SP Akan Expired dalam 30 Hari
                            </h3>
                            {analytics.critical_expiry > 0 && (
                                <p className="text-sm text-amber-800 mb-3">
                                    <strong className="text-red-700">{analytics.critical_expiry} SP kritis</strong> akan expired dalam 7 hari atau kurang!
                                </p>
                            )}
                            <div className="space-y-2">
                                {analytics.expiring_sp_list.slice(0, 5).map((sp) => {
                                    const daysLeft = daysUntilExpiry(sp.expires_at!);
                                    const isCritical = daysLeft <= 7;
                                    return (
                                        <div
                                            key={sp.id}
                                            className={`p-3 rounded-lg border ${
                                                isCritical
                                                    ? "bg-red-50 border-red-200"
                                                    : "bg-white border-amber-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm">
                                                            {sp.nomor_surat || `SP #${sp.id}`}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                sp.sp_level === 3
                                                                    ? "bg-red-50 text-red-700 border-red-300"
                                                                    : sp.sp_level === 2
                                                                    ? "bg-orange-50 text-orange-700 border-orange-300"
                                                                    : "bg-yellow-50 text-yellow-700 border-yellow-300"
                                                            }
                                                        >
                                                            SP {sp.sp_level}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-600">
                                                        {sp.nama_kontraktor} • {sp.cabang}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div
                                                        className={`text-sm font-bold ${
                                                            isCritical ? "text-red-700" : "text-amber-700"
                                                        }`}
                                                    >
                                                        {daysLeft} hari lagi
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(sp.expires_at!).toLocaleDateString("id-ID", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {analytics.expiring_sp_list.length > 5 && (
                                <p className="text-xs text-amber-700 mt-2">
                                    + {analytics.expiring_sp_list.length - 5} SP lainnya
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
