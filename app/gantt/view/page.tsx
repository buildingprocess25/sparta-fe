"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Loader2, Eye } from 'lucide-react';
import { fetchGanttData } from '@/lib/api';

function GanttViewer() {
  const searchParams = useSearchParams();
  const urlUlok = searchParams.get('ulok');

  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (urlUlok) {
        setIsLoading(true);
        // Memanggil fungsi api dengan isViewOnly = true
        fetchGanttData(urlUlok, true)
            .then(data => {
                setProjectData(data.rab_info || { ulokClean: urlUlok, store: "Data Ditemukan" });
                // Eksekusi fungsi gambar Gantt disini...
            })
            .catch(err => setErrorMsg("Gagal memuat atau proyek belum di-publish."))
            .finally(() => setIsLoading(false));
    } else {
        setErrorMsg("Tidak ada parameter Ulok di URL.");
    }
  }, [urlUlok]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* HEADER KHUSUS VIEW */}
      <header className="flex items-center justify-between p-4 md:px-8 bg-slate-800 text-white shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <Link href="/" className="mr-2 hover:bg-white/20 p-2 rounded-full transition-colors"><Home className="w-6 h-6" /></Link>
            <img src="/assets/Alfamart-Emblem.png" alt="Logo" className="h-8 brightness-0 invert opacity-80" />
            <div className="h-6 w-px bg-white/30 hidden md:block"></div>
            <h1 className="text-lg md:text-xl font-bold">Laporan Gantt Chart</h1>
        </div>
        <div>
            <Badge className="bg-blue-500 hover:bg-blue-500 text-white flex gap-2">
                <Eye className="w-3 h-3" /> MODE TAMPILAN
            </Badge>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {errorMsg ? (
              <div className="bg-red-50 p-8 text-center rounded-xl border border-red-200">
                  <h2 className="text-red-600 font-bold text-lg">{errorMsg}</h2>
                  <p className="text-slate-500 mt-2">Pastikan URL yang Anda buka sudah benar.</p>
              </div>
          ) : (
              <>
                  {/* INFORMASI PROYEK VIEW */}
                  <Card className="mb-6 bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
                          <div className="flex gap-8 flex-wrap">
                             <div><p className="text-xs text-slate-500">No. Ulok</p><p className="font-bold text-xl text-slate-800">{urlUlok}</p></div>
                             {projectData && (
                                <>
                                  <div><p className="text-xs text-slate-500">Nama Toko</p><p className="font-bold text-slate-800">{projectData.store}</p></div>
                                  <div><p className="text-xs text-slate-500">Durasi Pekerjaan</p><p className="font-bold text-slate-800">{projectData.duration} Hari</p></div>
                                </>
                             )}
                          </div>
                      </CardContent>
                  </Card>

                  {/* TEMPAT RENDER GRAFIK GANTT CHART */}
                  <Card className="overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-100 border-b flex justify-center gap-6 text-sm font-medium">
                          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div> Sesuai Target</div>
                          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded"></div> Terlambat</div>
                          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-sky-200 rounded"></div> Masa Pengawasan</div>
                      </div>
                      
                      <div className="p-0 overflow-x-auto min-h-[400px] relative bg-white" id="ganttChartContainer">
                          {isLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                                  <Loader2 className="w-10 h-10 animate-spin text-slate-600 mb-2" />
                                  <p>Memuat Laporan Grafis...</p>
                              </div>
                          )}
                          <div id="ganttChart" className="w-full pointer-events-none">
                              {/* Data grafik dirender disini. Pointer-events-none mencegah user nge-klik/drag grafik */}
                          </div>
                      </div>
                  </Card>
              </>
          )}
      </main>
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Viewer...</div>}>
            <GanttViewer />
        </Suspense>
    );
}