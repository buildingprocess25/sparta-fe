import React from 'react';
import { ImageUploader } from './ImageUploader';

export interface SerahTerimaItemDef {
    kategori: string;
    nama_kategori: string;
    id_item: string;
    nama_item: string;
    no_urut: number;
}

export interface ItemState {
    isAvailable: boolean | null;
    file: File | { url: string, name: string } | null;
    previewUrl: string | null;
    isUploading?: boolean;
}

interface ItemChecklistProps {
    items: SerahTerimaItemDef[];
    state: Record<string, ItemState>;
    onChangeState: (itemId: string, newState: Partial<ItemState>) => void;
    nomorUlok: string;
}

export function ItemChecklist({ items, state, onChangeState, nomorUlok }: ItemChecklistProps) {
    if (items.length === 0) {
        return <div className="p-8 text-center text-slate-500">Tidak ada item di kategori ini.</div>;
    }

    const handleRadioChange = (itemId: string, value: boolean) => {
        onChangeState(itemId, { 
            isAvailable: value,
            // If they change from Yes to No, we clear the file automatically
            ...(value === false ? { file: null, previewUrl: null } : {})
        });
    };

    const handleFileChange = async (itemId: string, file: File | null) => {
        if (file) {
            // Optimistic local preview and loading state
            const previewUrl = URL.createObjectURL(file);
            onChangeState(itemId, { previewUrl, isUploading: true });
            
            try {
                const { getApiAuthToken } = await import('@/lib/api');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                
                const formData = new FormData();
                formData.append('image', file);
                
                const res = await fetch(`${apiUrl}/api/serah-terima-gabungan/upload-image?nomor_ulok=${nomorUlok}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getApiAuthToken()}`
                    },
                    body: formData
                });
                
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                
                // Set the real url from drive
                onChangeState(itemId, { 
                    file: { url: data.url, name: file.name },
                    isUploading: false 
                });
            } catch (err) {
                alert('Gagal mengupload gambar ke Drive');
                onChangeState(itemId, { file: null, previewUrl: null, isUploading: false });
            }
        } else {
            // Revoke old object URL if exists to prevent memory leaks
            const oldUrl = state[itemId]?.previewUrl;
            if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
            onChangeState(itemId, { file: null, previewUrl: null });
        }
    };

    return (
        <div className="space-y-6">
            {items.map((item, index) => {
                const itemState = state[item.id_item] || { isAvailable: null, file: null, previewUrl: null };
                const isYes = itemState.isAvailable === true;
                const isNo = itemState.isAvailable === false;
                const isAnswered = itemState.isAvailable !== null;
                const isComplete = isNo || (isYes && itemState.file !== null);

                return (
                    <div 
                        key={item.id_item} 
                        className={`p-5 rounded-2xl border transition-all duration-300 ${
                            isAnswered 
                                ? isComplete 
                                    ? 'border-emerald-200 bg-emerald-50/30' 
                                    : 'border-amber-200 bg-amber-50/30' 
                                : 'border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                        {item.id_item}
                                    </span>
                                </div>
                                <h4 className="text-base font-medium text-slate-800 leading-snug">
                                    {item.nama_item}
                                </h4>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors border ${
                                    isYes 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name={`radio-${item.id_item}`} 
                                        checked={isYes}
                                        onChange={() => handleRadioChange(item.id_item, true)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium">Ya</span>
                                </label>

                                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors border ${
                                    isNo 
                                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name={`radio-${item.id_item}`} 
                                        checked={isNo}
                                        onChange={() => handleRadioChange(item.id_item, false)}
                                        className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-medium">Tidak</span>
                                </label>
                            </div>
                        </div>

                        {/* Image Uploader Area - Animated Expansion */}
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isYes ? 'max-h-[300px] opacity-100 mt-4 relative' : 'max-h-0 opacity-0'}`}>
                            {isYes && (
                                <>
                                    <ImageUploader 
                                        file={itemState.file instanceof File ? itemState.file : null} 
                                        previewUrl={itemState.previewUrl || (itemState.file && !(itemState.file instanceof File) ? itemState.file.url : null)} 
                                        onChange={(file) => handleFileChange(item.id_item, file)} 
                                    />
                                    {itemState.isUploading && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="mt-2 text-sm font-semibold text-blue-800">Mengupload ke Drive...</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
