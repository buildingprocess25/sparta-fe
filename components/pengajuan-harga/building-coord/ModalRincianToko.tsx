"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Store, Calendar, MapPin, Image as ImageIcon, Scale } from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';

interface ModalRincianTokoProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
}

export function ModalRincianToko({ isOpen, onClose, item }: ModalRincianTokoProps) {
  if (!item) return null;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const surveyList = item.surveyToko || [];
  const avgPrice = item.hargaRataRata || item.estimasiHarga || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-5">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Rincian Survei 3 Toko</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {item.kode} - {item.item} ({item.merk} - {item.ukuran})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {surveyList.map((toko, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span>{toko.namaToko || `Toko ${i + 1}`}</span>
                  </div>
                  {toko.alamatToko && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{toko.alamatToko}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm block">
                    {formatRupiah(toko.hargaSatuan)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    / Vol: {toko.volumeAcuan ?? 1} {item.satuan || 'm2'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Survei: {toko.tanggalSurvei || '-'}</span>
                </div>

                {toko.buktiSurveiUrl ? (
                  <a
                    href={toko.buktiSurveiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Lihat Bukti ({toko.buktiSurveiName || 'Foto'})</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Tidak ada foto bukti</span>
                )}
              </div>
            </div>
          ))}

          {/* Rata-Rata */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-950">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>Rata-Rata:</span>
            </div>
            <span className="font-mono text-base text-emerald-800">
              {formatRupiah(avgPrice)} / {item.satuan || 'm2'}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-8 text-xs cursor-pointer"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
