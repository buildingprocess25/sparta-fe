"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Lock, Send, Loader2, Info, Plus, Trash2 } from 'lucide-react'; 

import { fetchGanttData } from '@/lib/api';
import { API_URL } from '@/lib/constants'; 

// Fungsi format Rupiah (jika dibutuhkan)
const toRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

// --- FUNGSI HELPER ---
function extractUlokAndLingkup(value: string) {
    if (!value) return { ulokClean: "", lingkupClean: "" };
    const trimmed = String(value).trim();
    const parts = trimmed.split("-");
    if (parts.length < 2) return { ulokClean: trimmed, lingkupClean: "" };
    
    const lingkupRaw = parts.pop() || "";
    const ulokClean = parts.join("-");
    const lingkupUpper = lingkupRaw.replace(/[^a-zA-Z]/g, "").toUpperCase();
    return { ulokClean, lingkupClean: lingkupUpper === "ME" ? "ME" : "Sipil" };
}

// --- KOMPONEN UTAMA GANTT ---
function GanttBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params
  const urlUlok = searchParams.get('ulok');
  const urlLingkup = searchParams.get('lingkup');

  // State Session & Role
  const [appMode, setAppMode] = useState<'kontraktor' | 'pic' | null>(null);
  const [userRole, setUserRole] = useState('');
  
  // State Data Proyek
  const [selectedUlok, setSelectedUlok] = useState(urlUlok || '');
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectLocked, setIsProjectLocked] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  // State Data Tabel / Tasks (Dinamis dari RAB)
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const cabang = sessionStorage.getItem('loggedInUserCabang'); 
    const email = sessionStorage.getItem('loggedInUserEmail'); 

    if (!role) {
      alert("Sesi Anda telah habis. Silakan login kembali.");
      router.push('/auth');
      return;
    }

    setUserRole(role);
    let currentAppMode: 'kontraktor' | 'pic' = 'kontraktor';
    const picRoles = ['BRANCH BUILDING & MAINTENANCE MANAGER', 'BRANCH BUILDING COORDINATOR', 'BRANCH BUILDING SUPPORT'];
    
    if (role === 'KONTRAKTOR') {
        currentAppMode = 'kontraktor';
        setAppMode('kontraktor');
    } else if (picRoles.includes(role.toUpperCase())) {
        currentAppMode = 'pic';
        setAppMode('pic');
    } else {
        alert("Anda tidak memiliki akses.");
        router.push('/dashboard');
        return;
    }

    if (urlUlok) {
        loadGanttData(urlUlok);
    } 
    else {
        const cleanBaseUrl = API_URL.replace(/\/$/, ""); 
        
        // PERBAIKAN: Menambahkan /api/ di depan nama endpoint agar sesuai dengan backend Python Anda
        let targetUrl = currentAppMode === 'kontraktor' 
            ? `${cleanBaseUrl}/api/get_ulok_by_email?email=${encodeURIComponent(email || '')}`
            : `${cleanBaseUrl}/api/get_ulok_by_cabang_pic?cabang=${encodeURIComponent(cabang || '')}`;

        fetch(targetUrl)
            .then(async (res) => {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return res.json();
                } else {
                    const text = await res.text();
                    throw new Error(`Endpoint salah (HTML Error). URL: ${targetUrl} | Res: ${text.substring(0, 100)}...`);
                }
            })
            .then(data => {
                const list = data.data || data.projects || (Array.isArray(data) ? data : []);
                setAvailableProjects(list);
            })
            .catch(err => console.error("Gagal memuat list dropdown:", err.message));
    }
  }, [router, urlUlok]);

  // --- FUNGSI LOAD DATA GRAFIK & PARSING TASKS DINAMIS DARI RAB ---
  const loadGanttData = async (selectedValue: string) => {
      if(!selectedValue) return;
      setIsLoading(true);
      
      try {
          const { ulokClean, lingkupClean } = extractUlokAndLingkup(selectedValue);
          const finalUlok = urlUlok || ulokClean;
          const finalLingkup = urlLingkup || lingkupClean || "Sipil";

          // Fetch API
          const data = await fetchGanttData(finalUlok, finalLingkup);
          
          // 1. SET PROJECT INFO
          const rab = data.rab || {};
          const duration = parseInt(rab.Durasi_Pekerjaan || 0);
          setProjectData({
              ulokClean: finalUlok, 
              store: rab.Nama_Toko || rab.nama_toko || "Data Toko Ditemukan", 
              work: finalLingkup, 
              duration: duration
          });

          // 2. CEK STATUS TERKUNCI
          const status = String(data.gantt_data?.Status || '').toLowerCase();
          setIsProjectLocked(['terkunci', 'locked', 'published'].includes(status));

          // 3. EKSTRAK KATEGORI PEKERJAAN MURNI DARI RAB
          let generatedTasks: any[] = [];
          
          if (data.filtered_categories && data.filtered_categories.length > 0) {
              generatedTasks = data.filtered_categories.map((catName: string, idx: number) => ({
                  id: idx + 1,
                  name: catName,
                  dependencies: [],
                  ranges: [{ start: '', end: '' }]
              }));
          } 
          else if (data.rab) {
              const rabKeys = Object.keys(data.rab);
              const kategoriKeys = rabKeys.filter(k => k.startsWith('Kategori_Pekerjaan_') || k.startsWith('Kategori_'));
              
              if (kategoriKeys.length > 0) {
                  const rawCategories = kategoriKeys.map(k => data.rab[k]).filter(Boolean);
                  const uniqueCategories = Array.from(new Set(rawCategories));
                  
                  generatedTasks = uniqueCategories.map((catName: any, idx: number) => ({
                      id: idx + 1,
                      name: String(catName),
                      dependencies: [],
                      ranges: [{ start: '', end: '' }]
                  }));
              }
          }

          setTasks(generatedTasks);

      } catch (err) {
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  // --- HANDLER INPUT TABEL ---
  const handleRangeChange = (taskId: number, rangeIdx: number, field: 'start'|'end', value: string) => {
      setTasks(prev => prev.map(t => {
          if(t.id === taskId) {
              const newRanges = [...t.ranges];
              newRanges[rangeIdx][field] = value;
              return {...t, ranges: newRanges};
          }
          return t;
      }));
  };

  const addRange = (taskId: number) => {
      setTasks(prev => prev.map(t => {
          if(t.id === taskId) {
              return {...t, ranges: [...t.ranges, {start: '', end: ''}]};
          }
          return t;
      }));
  };

  const removeRange = (taskId: number, rangeIdx: number) => {
      setTasks(prev => prev.map(t => {
          if(t.id === taskId) {
              const newRanges = t.ranges.filter((_, i) => i !== rangeIdx);
              return {...t, ranges: newRanges};
          }
          return t;
      }));
  };

  const handleDependencyChange = (taskId: number, parentId: string) => {
      setTasks(prev => prev.map(t => {
          if(t.id === taskId) {
              return {...t, dependencies: parentId ? [parseInt(parentId)] : []};
          }
          return t;
      }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 md:px-8 bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <Link href="/dashboard" className="mr-2 hover:bg-white/20 p-2 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></Link>
            <img src="/assets/Alfamart-Emblem.png" alt="Logo" className="h-8 md:h-10 drop-shadow-md" />
            <div className="h-6 w-px bg-white/30 hidden md:block"></div>
            <h1 className="text-lg md:text-xl font-bold">Gantt Chart Interaktif</h1>
        </div>
        <Badge variant="outline" className="bg-black/20 text-white border-white/30 px-3 py-1 shadow-sm">
            {appMode === 'kontraktor' ? 'MODE KONTRAKTOR' : 'MODE PENGAWASAN'}
        </Badge>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto mt-2">
          {/* KONTROL PENCARIAN & INFO PROYEK */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
              
              <Card className="w-full lg:w-1/3 shadow-sm">
                  <CardContent className="p-6">
                      <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Pilih / Input No. Ulok</label>
                          {urlUlok ? (
                              <div className="p-3 bg-slate-100 border rounded-md font-bold text-slate-600 flex justify-between items-center shadow-inner">
                                  <span>{urlUlok}</span><Lock className="w-5 h-5 text-slate-400" />
                              </div>
                          ) : (
                              <select 
                                className="w-full p-3 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                value={selectedUlok}
                                onChange={(e) => { setSelectedUlok(e.target.value); loadGanttData(e.target.value); }}
                              >
                                  <option value="">-- Pilih Proyek Anda --</option>
                                  {availableProjects.map((proj, idx) => {
                                      const ulokValue = proj.value || proj['Nomor Ulok'] || proj.ulokClean || (typeof proj === 'string' ? proj : '');
                                      const textLabel = proj.label || proj['Nama_Toko'] || proj.store || ulokValue;
                                      return <option key={idx} value={ulokValue}>{textLabel}</option>;
                                  })}
                              </select>
                          )}
                      </div>
                  </CardContent>
              </Card>

              {/* INFORMASI PROYEK */}
              {projectData && (
                  <Card className="w-full lg:w-2/3 bg-blue-50 border-blue-200 shadow-sm">
                      <CardContent className="p-6 flex flex-wrap gap-x-10 gap-y-6 items-center">
                          <div>
                              <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Nama Toko</p>
                              <p className="text-xl font-bold text-blue-900">{projectData.store}</p>
                          </div>
                          <div className="h-10 w-px bg-blue-200 hidden md:block"></div>
                          <div>
                              <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Lingkup</p>
                              <p className="text-xl font-bold text-blue-900">{projectData.work}</p>
                          </div>
                          <div className="h-10 w-px bg-blue-200 hidden md:block"></div>
                          <div>
                              <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Durasi</p>
                              <p className="text-xl font-bold text-blue-900">{projectData.duration} Hari</p>
                          </div>
                      </CardContent>
                  </Card>
              )}
          </div>

          {/* TEMPAT RENDER TABEL INPUT KONTRAKTOR DINAMIS */}
          {!isLoading && selectedUlok && appMode === 'kontraktor' && !isProjectLocked && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                  <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
                      <div>
                        <h2 className="font-bold text-slate-800 text-lg">Input Jadwal & Keterikatan (Dependencies)</h2>
                        <p className="text-sm text-slate-500">Item pekerjaan ditarik otomatis dari form RAB yang telah disubmit.</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{tasks.length} Item Pekerjaan</Badge>
                  </div>
                  
                  {tasks.length > 0 ? (
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                              <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                                  <tr>
                                      <th className="p-4 w-12 text-center border-r">No</th>
                                      <th className="p-4 w-[30%] border-r">Tahapan Pekerjaan</th>
                                      <th className="p-4 w-[25%] border-r">Keterikatan (Bisa dikerjakan setelah..)</th>
                                      <th className="p-4">Durasi (Hari Ke-)</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {tasks.map(task => (
                                      <tr key={task.id} className="border-b hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 text-center font-bold text-slate-500 border-r">{task.id}</td>
                                          <td className="p-4 font-semibold text-slate-800 border-r">{task.name}</td>
                                          
                                          <td className="p-4 border-r">
                                              <select 
                                                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                                  value={task.dependencies[0] || ''}
                                                  onChange={(e) => handleDependencyChange(task.id, e.target.value)}
                                              >
                                                  <option value="">- Tidak Ada (Dikerjakan paralel) -</option>
                                                  {tasks.filter(t => t.id < task.id).map(opt => (
                                                      <option key={opt.id} value={opt.id}>{opt.id}. {opt.name}</option>
                                                  ))}
                                              </select>
                                          </td>
                                          
                                          <td className="p-4 space-y-2">
                                              {task.ranges.map((r: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-2">
                                                      <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                          <span className="bg-slate-100 text-slate-500 px-2 py-1.5 text-xs font-bold border-r">H</span>
                                                          <input 
                                                              type="number" className="w-16 p-1.5 text-center outline-none focus:bg-blue-50 text-sm font-semibold text-slate-800" 
                                                              value={r.start} onChange={(e) => handleRangeChange(task.id, idx, 'start', e.target.value)}
                                                              placeholder="Start" min="1" max={projectData?.duration || 99}
                                                          />
                                                      </div>
                                                      <span className="text-slate-400 text-xs">➜</span>
                                                      <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                                                          <span className="bg-slate-100 text-slate-500 px-2 py-1.5 text-xs font-bold border-r">H</span>
                                                          <input 
                                                              type="number" className="w-16 p-1.5 text-center outline-none focus:bg-blue-50 text-sm font-semibold text-slate-800" 
                                                              value={r.end} onChange={(e) => handleRangeChange(task.id, idx, 'end', e.target.value)}
                                                              placeholder="End" min="1" max={projectData?.duration || 99}
                                                          />
                                                      </div>
                                                      {idx > 0 && (
                                                          <button type="button" onClick={() => removeRange(task.id, idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded border border-transparent hover:border-red-200 transition-colors">
                                                              <Trash2 className="w-4 h-4" />
                                                          </button>
                                                      )}
                                                  </div>
                                              ))}
                                              <button type="button" onClick={() => addRange(task.id)} className="text-xs text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition-colors mt-2 flex items-center">
                                                  <Plus className="w-3 h-3 mr-1" /> Tambah Periode Terputus
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  ) : (
                      <div className="p-8 text-center text-slate-500">
                          <p className="font-semibold mb-1">Data Pekerjaan Kosong</p>
                          <p className="text-sm">Tidak ditemukan data kategori pekerjaan dari RAB proyek ini. Pastikan form RAB telah diisi dengan benar.</p>
                      </div>
                  )}
              </div>
          )}

          {/* TEMPAT RENDER FORM KETERLAMBATAN PIC */}
          {!isLoading && selectedUlok && appMode === 'pic' && isProjectLocked && tasks.length > 0 && (
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                 <h3 className="font-bold text-amber-700 mb-4 flex items-center"><Info className="w-5 h-5 mr-2" /> Input Keterlambatan Pengawasan</h3>
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                     <div className="flex-1 space-y-2 w-full">
                         <label className="text-sm font-semibold text-slate-600">Pilih Tahapan yang Terlambat</label>
                         <select className="w-full p-3 border border-slate-300 rounded-md bg-slate-50 focus:bg-white outline-none">
                            <option value="">-- Pilih Tahapan --</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                     </div>
                     <div className="w-full md:w-32 space-y-2">
                         <label className="text-sm font-semibold text-slate-600">Jml Hari (+)</label>
                         <input type="number" className="w-full p-3 border border-slate-300 rounded-md font-bold text-slate-800 text-center outline-none focus:border-amber-500" placeholder="0" min="0" />
                     </div>
                 </div>
             </div>
          )}

          {/* TEMPAT RENDER GRAFIK GANTT CHART */}
          <Card className="overflow-hidden shadow-md mb-8 border-slate-200">
              <div className="p-4 bg-slate-100 border-b flex justify-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded shadow-inner"></div> Sesuai Target</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded shadow-inner"></div> Terlambat</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-sky-200 border border-sky-300 rounded shadow-inner"></div> Masa Pengawasan</div>
              </div>
              
              <div className="p-0 overflow-x-auto min-h-[400px] relative bg-white" id="ganttChartContainer">
                  {isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                          <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                          <p className="font-semibold text-slate-700">Mempersiapkan Jadwal Proyek...</p>
                      </div>
                  ) : !selectedUlok ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                           <p>Silakan pilih proyek / ulok di atas untuk mulai</p>
                      </div>
                  ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                           <p className="text-lg font-bold text-slate-600 mb-2">Area Tampilan Grafik</p>
                           <p className="text-sm text-center max-w-md">Tabel Input Dinamis dari RAB sudah aktif. <br/> Anda dapat mengisi form tanggal dan keterikatan di atas.</p>
                      </div>
                  )}
              </div>
          </Card>

          {/* BOTTOM ACTIONS */}
          {projectData && !isLoading && tasks.length > 0 && (
              <div className="sticky bottom-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-4 justify-end">
                  
                  {appMode === 'kontraktor' && !isProjectLocked && (
                      <>
                        <Button variant="outline" className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-6 w-full md:w-auto">
                            Simpan Draft
                        </Button>
                        <Button className="h-12 bg-red-600 hover:bg-red-700 shadow-md font-bold px-8 text-[15px] w-full md:w-auto">
                            <Lock className="w-5 h-5 mr-2" /> Kunci & Publish Jadwal
                        </Button>
                      </>
                  )}

                  {appMode === 'pic' && isProjectLocked && (
                      <Button className="h-12 bg-blue-600 hover:bg-blue-700 shadow-md font-bold px-8 text-[15px] w-full md:w-auto">
                          <Send className="w-5 h-5 mr-2" /> Simpan Update Keterlambatan
                      </Button>
                  )}
              </div>
          )}

      </main>
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
                <p className="font-semibold text-slate-600">Memuat Gantt Chart Workspace...</p>
            </div>
        }>
            <GanttBoard />
        </Suspense>
    );
}