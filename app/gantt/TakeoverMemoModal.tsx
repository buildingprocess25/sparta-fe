'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar } from 'lucide-react';
import { apiFetch, fetchPengawasanList } from '@/lib/api';
import { API_URL } from '@/lib/constants';

export function TakeoverMemoModal({ workspace, onClose, onSuccess }: any) {
    const [tanggalTakeover, setTanggalTakeover] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!workspace) return;
        
        // Fetch ALL pengawasan items for ALL scopes in this workspace
        const fetchItems = async () => {
            const allItems: any[] = [];
            
            for (const scope of workspace.scopes) {
                if (!scope.gantt_id) continue;
                
                try {
                    const res = await fetchPengawasanList({ id_gantt: scope.gantt_id });
                    if (res.status === 'success' && res.data) {
                        res.data.forEach((item: any) => {
                            allItems.push({
                                id_pengawasan: item.id,
                                kategori: item.kategori_pekerjaan,
                                jenis: item.jenis_pekerjaan,
                                lingkup: scope.lingkup_pekerjaan,
                                oldStatus: item.status,
                                status: item.status === 'Selesai' ? 'Selesai' : ''
                            });
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch gantt data for scope", scope.lingkup_pekerjaan, e);
                }
            }

            // Deduplicate items just in case
            const uniqueItems = Array.from(new Map(allItems.map(i => [i.id_pengawasan, i])).values());
            setItems(uniqueItems);
        };

        fetchItems();
    }, [workspace]);

    const handleItemChange = (id: number, status: string) => {
        setItems(prev => prev.map(item => item.id_pengawasan === id ? { ...item, status } : item));
    };

    const handleSubmit = async () => {
        if (!tanggalTakeover) {
            alert("Tanggal Takeover wajib diisi!");
            return;
        }

        const unfilled = items.filter(i => !i.status);
        if (unfilled.length > 0) {
            alert(`Ada ${unfilled.length} item yang belum dipilih statusnya (Selesai/Tidak Dikerjakan).`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                nomor_ulok: workspace.nomor_ulok,
                tanggal_takeover: tanggalTakeover,
                items: items.map(i => ({
                    id_pengawasan: i.id_pengawasan,
                    status: i.status
                }))
            };

            const res = await apiFetch(`${API_URL.replace(/\/$/, '')}/api/gantt/takeover-inspection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Gagal menyimpan inspeksi takeover");

            onSuccess();
        } catch (e: any) {
            alert(e.message || "Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pre-inspeksi Takeover</h2>
                        <p className="text-sm text-slate-500">Tentukan status akhir setiap pekerjaan sebelum proyek diambil alih.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <Label className="text-slate-700 font-bold">Tanggal Takeover <span className="text-red-500">*</span></Label>
                        <div className="relative mt-2">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                type="date" 
                                value={tanggalTakeover} 
                                onChange={(e) => setTanggalTakeover(e.target.value)}
                                className="pl-9 h-10 border-slate-300 w-full md:w-1/2" 
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-700 border-b pb-2">Daftar Pekerjaan</h3>
                        {items.length === 0 ? (
                            <p className="text-slate-500 italic text-sm">Memuat data atau tidak ada pekerjaan...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-slate-50/50 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-sm leading-tight text-slate-800">{item.jenis || item.kategori}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${String(item.lingkup).toUpperCase() === 'SIPIL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {String(item.lingkup).toUpperCase()}
                                            </span>
                                        </div>
                                        <Select 
                                            value={item.status} 
                                            onValueChange={(val) => handleItemChange(item.id_pengawasan, val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Pilih Status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Selesai" className="text-green-600 font-semibold">Selesai</SelectItem>
                                                <SelectItem value="Tidak Dikerjakan" className="text-red-600 font-semibold">Tidak Dikerjakan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Inspeksi'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
