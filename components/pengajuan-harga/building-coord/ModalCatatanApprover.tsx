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
import { AlertCircle } from 'lucide-react';
import { PengajuanHargaItem } from '@/components/pengajuan-harga/types';

interface ModalCatatanApproverProps {
  isOpen: boolean;
  onClose: () => void;
  item: PengajuanHargaItem | null;
}

export function ModalCatatanApprover({
  isOpen,
  onClose,
  item,
}: ModalCatatanApproverProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-xl p-5">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Catatan Pengembalian</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {item.kode} - {item.item} ({item.merk})
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="text-xs text-rose-950 bg-rose-50/80 p-3.5 rounded-lg border border-rose-200 leading-relaxed whitespace-pre-wrap">
            {(() => {
              const logs = item.historyLog || [];
              const lastRejectLog = [...logs]
                .reverse()
                .find((l) => l.action === 'REJECT' || l.action === 'REVISE' || l.catatan);
              return (
                lastRejectLog?.catatan ||
                item.catatanReview ||
                'Tidak ada catatan pengembalian tertulis.'
              );
            })()}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-lg h-8 text-xs cursor-pointer"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
