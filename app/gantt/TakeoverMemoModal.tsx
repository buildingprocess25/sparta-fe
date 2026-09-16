'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar } from 'lucide-react';
import { apiFetch, fetchPengawasanList, fetchRABList, fetchRABDetail, fetchGanttDetail } from '@/lib/api';
import { API_URL } from '@/lib/constants';

export function TakeoverMemoModal({ workspace, onClose, onSuccess }: any) {
    const [tanggalTakeover, setTanggalTakeover] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!workspace) return;

        const fetchItems = async () => {
            const allItems: any[] = [];
            const isSameWorkText = (a: any, b: any) => String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();

            // 1. Fetch RAB details for this ULOK
            let rabItems: any[] = [];
            try {
                const rabListRes = await fetchRABList({ nomor_ulok: workspace.nomor_ulok, status: 'Disetujui' });
                if (rabListRes.status === 'success' && rabListRes.data) {
                    for (const rab of rabListRes.data) {
                        const detailRes = await fetchRABDetail(rab.id);
                        if (detailRes.status === 'success' && detailRes.data?.items) {
                            const tokoId = detailRes.data.toko?.id;
                            // Ensure we only process the RAB belonging to the specific Takeover sequence of this workspace
                            if (!workspace.scopes.some((s: any) => s.id_toko === tokoId)) {
                                continue;
                            }
                            
                            const lingkup = detailRes.data.toko?.lingkup_pekerjaan;
                            const itemsWithLingkup = detailRes.data.items.map(item => ({
                                ...item,
                                lingkup_pekerjaan: lingkup
                            }));
                            rabItems.push(...itemsWithLingkup);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch RAB list/details", e);
            }

            // 2. Process each scope to find remaining unfinished items
            for (const scope of workspace.scopes) {
                if (!scope.gantt_id) continue;
                
                try {
                    const ganttRes = await fetchGanttDetail(scope.gantt_id);
                    const listRes = await fetchPengawasanList({ id_gantt: scope.gantt_id });
                    
                    if (ganttRes.status === 'success' && ganttRes.data) {
                        const supervisedItems = (listRes.status === 'success' && listRes.data) ? listRes.data : [];
                        const ilItems = ganttRes.data.instruksi_lapangan_items || [];
                        
                        // Filter RAB items that belong to this scope
                        const scopeRabItems = rabItems
                    .filter(item => String(item.lingkup_pekerjaan).toUpperCase() === String(scope.lingkup_pekerjaan).toUpperCase())
                    .map(item => ({ ...item, id_gantt: scope.gantt_id }));

                        // Map IL items to RAB-like format
                        const mappedIlItems = ilItems.map((item: any) => ({
                            kategori_pekerjaan: `[IL] ${String(item.kategori_pekerjaan || 'LAIN-LAIN').toUpperCase()}`,
                            jenis_pekerjaan: item.jenis_pekerjaan || '-',
                            lingkup_pekerjaan: scope.lingkup_pekerjaan
                        }));

                        // Combine standard RAB items and IL items
                        const combinedItems = [...scopeRabItems, ...mappedIlItems];

                        for (const rabItem of combinedItems) {
                            // Check if this RAB item is already 'Selesai' in pengawasan history
                            const historyMatch = supervisedItems.find((h: any) => 
                                isSameWorkText(h.kategori_pekerjaan, rabItem.kategori_pekerjaan) &&
                                isSameWorkText(h.jenis_pekerjaan, rabItem.jenis_pekerjaan || rabItem.kategori_pekerjaan)
                            );

                            const isSelesai = historyMatch && String(historyMatch.status || '').trim().toUpperCase() === 'SELESAI';

                            if (!isSelesai) {
                                const hargaMaterial = Number(rabItem.harga_material || 0);
                                const hargaUpah = Number(rabItem.harga_upah || 0);
                                const volumeRAB = Number(rabItem.volume || 0);
                                
                                allItems.push({
                                    id_pengawasan: historyMatch?.id,
                                    id_gantt: scope.gantt_id,
                                    kategori: rabItem.kategori_pekerjaan,
                                    jenis: rabItem.jenis_pekerjaan,
                                    lingkup: scope.lingkup_pekerjaan,
                                    oldStatus: historyMatch ? (historyMatch as any).status : null,
                                    status: '', // To be filled by user
                                    volumeRAB,
                                    satuan: rabItem.satuan || '-',
                                    hargaSatuan: hargaMaterial + hargaUpah,
                                    id_rab_item: rabItem.id_rab_item || rabItem.id, // for RAB
                                    id_instruksi_lapangan_item: rabItem.id_instruksi_lapangan_item, // for IL
                                    source_type: rabItem.id_instruksi_lapangan_item ? 'IL' : 'RAB'
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch gantt data for scope", scope.lingkup_pekerjaan, e);
                }
            }

            // Deduplicate items just in case (by id_gantt + kategori + jenis)
            const uniqueItems = Array.from(new Map(allItems.map(i => [`${i.id_gantt}-${i.kategori}-${i.jenis}`, i])).values());
            setItems(uniqueItems);
        };

        fetchItems();
    }, [workspace]);

    const handleItemChange = (index: number, status: string) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const newItem = { ...item, status };
                // Pre-fill volume_akhir with volume RAB if Selesai
                if (status === 'Selesai' && newItem.volume_akhir === undefined) {
                    newItem.volume_akhir = item.volumeRAB;
                }
                return newItem;
            }
            return item;
        }));
    };

    const handleOpnameFieldChange = (index: number, field: string, value: any) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
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

        const incompleteOpname = items.find(i => 
            i.status === 'Selesai' && 
            (!i.volume_akhir || !i.desain || !i.kualitas || !i.spesifikasi || !i.file_opname)
        );

        if (incompleteOpname) {
            alert(`Pekerjaan "${incompleteOpname.jenis || incompleteOpname.kategori}" wajib melengkapi form opname (Volume Akhir, Desain, Kualitas, Material, dan Upload Foto).`);
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('nomor_ulok', workspace.nomor_ulok);
            formData.append('tanggal_takeover', tanggalTakeover);

            const itemsPayload = items.map((item, idx) => {
                const payloadItem: any = {
                    id_gantt: item.id_gantt,
                    kategori_pekerjaan: item.kategori,
                    jenis_pekerjaan: item.jenis || null,
                    status: item.status
                };
                
                if (item.status === 'Selesai') {
                    const totalHargaOpname = Math.round(Number(item.volume_akhir) * item.hargaSatuan);
                    const totalSelisih = Math.round(item.volumeRAB * item.hargaSatuan) - totalHargaOpname;
                    const selisihVolume = item.volumeRAB - Number(item.volume_akhir);
                    
                    payloadItem.opname_data = {
                        id_rab_item: item.source_type === 'RAB' ? Number(item.id_rab_item) : undefined,
                        id_instruksi_lapangan_item: item.source_type === 'IL' ? Number(item.id_instruksi_lapangan_item) : undefined,
                        volume_akhir: Number(item.volume_akhir),
                        selisih_volume: selisihVolume,
                        total_selisih: totalSelisih,
                        total_harga_opname: totalHargaOpname,
                        desain: item.desain || '',
                        kualitas: item.kualitas || '',
                        spesifikasi: item.spesifikasi || '',
                        catatan: item.catatan || ''
                    };
                    
                    if (item.file_opname) {
                        formData.append(`file_opname_${idx}`, item.file_opname);
                    }
                }

                if (item.file_dokumentasi) {
                    formData.append(`file_dokumentasi_${idx}`, item.file_dokumentasi);
                }

                return payloadItem;
            });

            formData.append('items', JSON.stringify(itemsPayload));

            const res = await apiFetch(`${API_URL.replace(/\/$/, '')}/api/gantt/takeover-inspection`, {
                method: 'POST',
                body: formData
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
                                            value={item.status || ''} 
                                            onValueChange={(val) => handleItemChange(idx, val)}
                                        >
                                            <SelectTrigger className="w-32 h-8 text-xs bg-white">
                                                <SelectValue placeholder="Pilih Status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Selesai">Selesai</SelectItem>
                                                <SelectItem value="Tidak Dikerjakan">Tidak Dikerjakan</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {item.status && (
                                            <div className="mt-3 bg-white p-3 rounded border border-slate-200 shadow-inner">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase">Upload Foto Pengawasan (Opsional)</Label>
                                                <Input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="h-8 text-xs mt-1 py-1" 
                                                    onChange={(e) => handleOpnameFieldChange(idx, 'file_dokumentasi', e.target.files?.[0] || null)}
                                                />
                                            </div>
                                        )}

                                        {item.status === 'Selesai' && (
                                            <div className="mt-3 bg-white p-3 rounded border border-slate-200 shadow-inner flex flex-col gap-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Volume Akhir (RAB: {item.volumeRAB} {item.satuan}) <span className="text-red-500">*</span></Label>
                                                        <Input 
                                                            type="number" 
                                                            className="h-8 text-xs mt-1" 
                                                            value={item.volume_akhir ?? ''} 
                                                            onChange={(e) => handleOpnameFieldChange(idx, 'volume_akhir', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Desain <span className="text-red-500">*</span></Label>
                                                        <Select value={item.desain || ''} onValueChange={(v) => handleOpnameFieldChange(idx, 'desain', v)}>
                                                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Pilih..."/></SelectTrigger>
                                                            <SelectContent><SelectItem value="Sesuai">Sesuai</SelectItem><SelectItem value="Tidak Sesuai">Tidak Sesuai</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Kualitas <span className="text-red-500">*</span></Label>
                                                        <Select value={item.kualitas || ''} onValueChange={(v) => handleOpnameFieldChange(idx, 'kualitas', v)}>
                                                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Pilih..."/></SelectTrigger>
                                                            <SelectContent><SelectItem value="Baik">Baik</SelectItem><SelectItem value="Tidak Baik">Tidak Baik</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Material <span className="text-red-500">*</span></Label>
                                                        <Select value={item.spesifikasi || ''} onValueChange={(v) => handleOpnameFieldChange(idx, 'spesifikasi', v)}>
                                                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Pilih..."/></SelectTrigger>
                                                            <SelectContent><SelectItem value="Sesuai">Sesuai</SelectItem><SelectItem value="Tidak Sesuai">Tidak Sesuai</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-[10px] text-slate-500 font-bold uppercase">Upload Foto <span className="text-red-500">*</span></Label>
                                                    <Input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="h-8 text-xs mt-1 py-1" 
                                                        onChange={(e) => handleOpnameFieldChange(idx, 'file_opname', e.target.files?.[0] || null)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-[10px] text-slate-500 font-bold uppercase">Catatan Tambahan (Opsional)</Label>
                                                    <Input 
                                                        className="h-8 text-xs mt-1" 
                                                        placeholder="Catatan masalah, selisih..." 
                                                        value={item.catatan || ''} 
                                                        onChange={(e) => handleOpnameFieldChange(idx, 'catatan', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
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
