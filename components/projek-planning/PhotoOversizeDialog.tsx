"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, Loader2, RefreshCw, FileWarning, ArrowDownRight, HardDrive } from "lucide-react";
import { formatFileSize } from "@/lib/client-image-compressor";

export interface PhotoOversizeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pointId: number | null;
    pointLabel: string;
    file: File | null;
    onCompressNow: () => Promise<void>;
    onPickAnother: () => void;
    isCompressing: boolean;
}

export function PhotoOversizeDialog({
    open,
    onOpenChange,
    pointId,
    pointLabel,
    file,
    onCompressNow,
    onPickAnother,
    isCompressing,
}: PhotoOversizeDialogProps) {
    if (!file) return null;

    const fileSizeFormatted = formatFileSize(file.size);

    return (
        <AlertDialog open={open} onOpenChange={(val) => {
            if (!isCompressing) onOpenChange(val);
        }}>
            <AlertDialogContent className="max-w-md p-6 rounded-2xl bg-white border border-amber-200/80 shadow-2xl animate-in fade-in-50 zoom-in-95">
                <AlertDialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm border border-amber-200">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mb-0.5">
                                Validasi Ukuran Foto
                            </span>
                            <AlertDialogTitle className="text-base font-bold text-slate-900 leading-tight">
                                Ukuran Foto Melebihi 10 MB
                            </AlertDialogTitle>
                        </div>
                    </div>

                    <AlertDialogDescription className="text-xs text-slate-600 space-y-2.5 leading-relaxed pt-1" asChild>
                        <div>
                            <p>
                                Foto untuk{" "}
                                <strong className="text-slate-900 font-semibold">
                                    {pointId ? `${pointId}. ${pointLabel}` : pointLabel}
                                </strong>{" "}
                                yang Anda pilih berukuran{" "}
                                <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                    {fileSizeFormatted}
                                </span>.
                            </p>

                            <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                                <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                                    <HardDrive className="w-3.5 h-3.5 flex-shrink-0" />
                                    Batas Maksimal: 10 MB per foto
                                </p>
                                <p className="text-slate-600 leading-normal">
                                    File foto kamera yang terlalu besar menyebabkan koneksi upload cabang lemot dan berisiko gagal simpan.
                                </p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* File preview badge */}
                <div className="my-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <FileWarning className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[11px] text-slate-500">Ukuran asli: {fileSizeFormatted}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex-shrink-0">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Estimasi: &lt; 1.5 MB</span>
                    </div>
                </div>

                <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isCompressing}
                        onClick={onPickAnother}
                        className="w-full sm:w-auto text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 h-9"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Pilih Foto Lain
                    </Button>
                    <Button
                        type="button"
                        disabled={isCompressing}
                        onClick={onCompressNow}
                        className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 gap-1.5 transition-all"
                    >
                        {isCompressing ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Mengompres Foto...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Kompres Otomatis Sekarang
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
