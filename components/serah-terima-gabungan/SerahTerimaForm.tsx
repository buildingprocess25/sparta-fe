import React, { useState, useMemo } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { ItemChecklist, SerahTerimaItemDef, ItemState } from './ItemChecklist';
import { Save, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SerahTerimaFormProps {
    nomorUlok: string;
    tokoData: any;
    templateItems: SerahTerimaItemDef[];
    initialState?: Record<string, ItemState>;
}

export function SerahTerimaForm({ nomorUlok, tokoData, templateItems, initialState = {} }: SerahTerimaFormProps) {
    const [state, setState] = useState<Record<string, ItemState>>(initialState);
    const [popup, setPopup] = useState<{ show: boolean, type: 'success' | 'error' | 'loading', title: string, message: string } | null>(null);
    
    // Derived categories
    const categories = useMemo(() => {
        const cats = new Set(templateItems.map(item => item.nama_kategori));
        return Array.from(cats);
    }, [templateItems]);

    const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');

    const handleChangeState = (itemId: string, newState: Partial<ItemState>) => {
        setState(prev => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || { isAvailable: null, file: null, previewUrl: null }), ...newState }
        }));
    };

    const progressMap = useMemo(() => {
        const map: Record<string, { total: number, completed: number }> = {};
        categories.forEach(cat => map[cat] = { total: 0, completed: 0 });

        templateItems.forEach(item => {
            const itemState = state[item.id_item];
            const cat = item.nama_kategori;
            if (map[cat]) {
                map[cat].total += 1;
                if (itemState) {
                    const isYes = itemState.isAvailable === true;
                    const isNo = itemState.isAvailable === false;
                    const isComplete = isNo || (isYes && itemState.file !== null);
                    if (isComplete) {
                        map[cat].completed += 1;
                    }
                }
            }
        });
        return map;
    }, [categories, templateItems, state]);

    const activeItems = useMemo(() => {
        return templateItems.filter(item => item.nama_kategori === activeCategory);
    }, [templateItems, activeCategory]);

    const totalItems = templateItems.length;
    const totalCompleted = Object.values(progressMap).reduce((sum, p) => sum + p.completed, 0);
    const isAllCompleted = totalItems > 0 && totalCompleted === totalItems;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans">
            <CategorySidebar 
                categories={categories} 
                activeCategory={activeCategory} 
                onSelectCategory={setActiveCategory} 
                progressMap={progressMap} 
            />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
                {/* Header */}
                <header className="shrink-0 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Form Serah Terima (Sipil & ME)</h1>
                        <p className="text-xs text-slate-500 font-medium">{nomorUlok} - {tokoData?.nama_toko}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={async () => {
                                setPopup({ show: true, type: 'loading', title: 'Menyimpan...', message: 'Mohon tunggu sebentar.' });
                                try {
                                    const { getApiAuthToken } = await import('@/lib/api');
                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                    const res = await fetch(`${apiUrl}/api/serah-terima-gabungan/save?nomor_ulok=${nomorUlok}`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${getApiAuthToken()}`
                                        },
                                        body: JSON.stringify({ state })
                                    });
                                    if (!res.ok) throw new Error('Failed');
                                    setPopup({ show: true, type: 'success', title: 'Berhasil!', message: 'Draft dokumentasi telah berhasil disimpan.' });
                                } catch (e) {
                                    setPopup({ show: true, type: 'error', title: 'Gagal Menyimpan', message: 'Terjadi kesalahan saat menyimpan draft. Silakan coba lagi.' });
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Simpan Draft
                        </button>
                        <button 
                            disabled={!isAllCompleted}
                            onClick={async () => {
                                setPopup({ show: true, type: 'loading', title: 'Mengirim...', message: 'Sedang mengirim form dokumentasi.' });
                                try {
                                    const { getApiAuthToken } = await import('@/lib/api');
                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                    
                                    // Simpan draft dulu memastikan data terupdate
                                    await fetch(`${apiUrl}/api/serah-terima-gabungan/save?nomor_ulok=${nomorUlok}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiAuthToken()}` },
                                        body: JSON.stringify({ state })
                                    });

                                    // Lalu submit (mock for now, or call /submit endpoint if added)
                                    const res = await fetch(`${apiUrl}/api/serah-terima-gabungan/submit?nomor_ulok=${nomorUlok}`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${getApiAuthToken()}` }
                                    });
                                    
                                    if (!res.ok) throw new Error('Failed');
                                    setPopup({ show: true, type: 'success', title: 'Form Terkirim!', message: 'Seluruh dokumentasi telah berhasil dikirim untuk direview.' });
                                } catch (e) {
                                    setPopup({ show: true, type: 'error', title: 'Gagal Mengirim', message: 'Terjadi kesalahan saat mengirim form. Silakan periksa koneksi Anda.' });
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm ${
                                isAllCompleted 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Send className="w-4 h-4" />
                            Kirim Form
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 bg-white/50">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">{activeCategory}</h2>
                            <p className="text-slate-500 mt-1">Silakan pilih Ya/Tidak untuk setiap item. Wajib melampirkan foto jika Ya.</p>
                        </div>
                        
                        <ItemChecklist 
                            items={activeItems} 
                            state={state} 
                            onChangeState={handleChangeState} 
                            nomorUlok={nomorUlok}
                        />
                    </div>
                </main>
            </div>

            {/* Premium Pop-up Modal */}
            {popup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="flex justify-center mb-5">
                                {popup.type === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in duration-500 delay-150" />}
                                {popup.type === 'error' && <XCircle className="w-16 h-16 text-rose-500 animate-in zoom-in duration-500 delay-150" />}
                                {popup.type === 'loading' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{popup.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{popup.message}</p>
                        </div>
                        {popup.type !== 'loading' && (
                            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-center">
                                <button 
                                    onClick={() => {
                                        const type = popup.type;
                                        setPopup(null);
                                        // Reload to Gantt if success submit
                                        if (type === 'success' && popup.title.includes('Terkirim')) {
                                            window.parent.postMessage({ type: 'closeSerahTerimaModal' }, '*');
                                        }
                                    }}
                                    className="px-8 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors shadow-sm focus:ring-4 focus:ring-slate-200"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
