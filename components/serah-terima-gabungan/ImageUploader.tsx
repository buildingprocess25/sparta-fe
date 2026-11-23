import React, { useRef } from 'react';
import { Camera, Trash2, UploadCloud, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
    file: File | null;
    previewUrl: string | null;
    onChange: (file: File | null) => void;
}

export function ImageUploader({ file, previewUrl, onChange }: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onChange(e.target.files[0]);
        }
    };

    if (previewUrl) {
        const isDriveLink = previewUrl.startsWith('http');
        
        if (isDriveLink) {
            return (
                <div className="relative w-full h-24 mt-3 bg-blue-50/50 rounded-xl overflow-hidden border border-blue-200 flex items-center justify-between px-6 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full shadow-inner">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">Foto Terlampir</p>
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-1"
                            >
                                Lihat di Google Drive <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                    <button 
                        onClick={() => onChange(null)}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 p-2.5 rounded-full shadow-sm transition-colors"
                        title="Hapus Gambar"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            );
        }

        return (
            <div className="relative w-full h-40 mt-3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group transition-all duration-300">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                        onClick={() => onChange(null)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                        title="Hapus Gambar"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => inputRef.current?.click()}
            className="w-full h-40 mt-3 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 group"
        >
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={inputRef}
                onChange={handleFileChange}
            />
            <div className="p-3 bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full mb-2 transition-colors">
                <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 group-hover:text-blue-700">Ambil Foto atau Upload</p>
            <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG (Max 5MB)</p>
        </div>
    );
}
