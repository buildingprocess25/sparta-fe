import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileImage, Minimize } from 'lucide-react';

interface FileLimitWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileSizeMB: number;
}

export function FileLimitWarningModal({ isOpen, onClose, fileName, fileSizeMB }: FileLimitWarningModalProps) {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200">
                <div className="bg-gradient-to-b from-rose-50 to-white px-6 pt-8 pb-6 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                        <div className="absolute inset-0 bg-rose-200/50 blur-xl rounded-full"></div>
                        <div className="relative w-16 h-16 bg-white border border-rose-100 shadow-sm flex items-center justify-center rounded-2xl rotate-3">
                            <FileImage className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-rose-500 flex items-center justify-center rounded-full border-4 border-white shadow-sm">
                            <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-2">
                        Ukuran File Terlalu Besar
                    </h2>
                    
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                        Batas maksimal file adalah <span className="font-semibold text-slate-700">10 MB</span>. File yang Anda unggah berukuran <span className="font-semibold text-rose-600">{fileSizeMB.toFixed(1)} MB</span>.
                    </p>
                </div>
                
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                        <Minimize className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 font-medium">
                            Solusi: Anda dapat mengompresi gambar menggunakan alat kompresi online (seperti iloveimg.com) atau memilih file lain dengan ukuran yang lebih kecil.
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full mt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium h-11 rounded-xl">
                            Batal
                        </Button>
                        <Button onClick={onClose} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium h-11 rounded-xl shadow-sm shadow-rose-200">
                            Pilih File Lain
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
