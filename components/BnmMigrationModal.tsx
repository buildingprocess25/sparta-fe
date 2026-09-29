"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BnmMigrationModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 opacity-[0.03]" />
          <div className="pointer-events-none absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
          
          <div className="relative z-10 p-8 pb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 shadow-inner">
                <ArrowRightLeft className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Pindah ke Aplikasi BNM</DialogTitle>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Penawaran Final Kontraktor</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Seluruh transaksi Penawaran Final Kontraktor kini telah dipindahkan ke aplikasi <strong>BNM</strong>.
              </p>

              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-xs font-semibold text-red-900 uppercase tracking-wider mb-3">Jadwal Sosialisasi & Panduan</p>
                
                <div className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm border border-red-100">
                  <div className="flex flex-col items-center justify-center bg-red-600 rounded-md text-white min-w-[52px] py-1.5 px-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Sep</span>
                    <span className="text-xl font-black leading-none my-0.5">30</span>
                    <span className="text-[9px] font-medium opacity-80">2026</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                      <span>Rabu</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>13.30 WIB</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Link meeting akan diinformasikan lebih lanjut</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-600/20 rounded-xl px-8 h-11"
              onClick={() => onOpenChange(false)}
            >
              Saya Mengerti
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
