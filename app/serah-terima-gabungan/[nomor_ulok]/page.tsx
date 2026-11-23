"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SerahTerimaForm } from '@/components/serah-terima-gabungan/SerahTerimaForm';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getApiAuthToken } from '@/lib/api';

export default function SerahTerimaGabunganPage() {
    const params = useParams();
    const router = useRouter();
    const nomorUlok = params.nomor_ulok as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{ tokoData: any; templateItems: any[] } | null>(null);

    useEffect(() => {
        if (!nomorUlok) return;

        const checkEligibility = async () => {
            try {
                // Determine base URL, assuming proxy or same domain for now
                // Adjust if they use a specific apiClient
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const token = getApiAuthToken();
                
                const res = await fetch(`${apiUrl}/api/serah-terima-gabungan/eligibility?nomor_ulok=${nomorUlok}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const result = await res.json();
                
                if (!res.ok || !result.success) {
                    throw new Error(result.error || result.message || 'Gagal memeriksa kelayakan');
                }

                if (!result.data.eligible) {
                    throw new Error(result.data.message || 'Project ini belum memenuhi syarat untuk Serah Terima Gabungan.');
                }

                setData({
                    tokoData: result.data.tokoData,
                    templateItems: result.data.templateItems,
                    draftState: result.data.draftState || {}
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkEligibility();
    }, [nomorUlok]);

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-600 font-medium">Memuat data 125 item...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SerahTerimaForm 
            nomorUlok={nomorUlok} 
            tokoData={data.tokoData} 
            templateItems={data.templateItems} 
            initialState={data.draftState}
        />
    );
}
