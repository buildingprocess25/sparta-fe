"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { RequestPenetapanItem } from './types';
import { FilePlus, Sparkles } from 'lucide-react';

export interface ModalRequestPenetapanHargaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newItem: RequestPenetapanItem) => void;
  nextIndex?: number;
}

const INITIAL_MATERIAL_OPTIONS = [
  'Homogeneous Tile',
  'Gypsum Board Tahan Air',
  'Keramik Tactile Guiding',
  'Batu Alam Candi',
  'Vinyl Plank Kayu',
  'Pintu Aluminium Powder Coating',
];

const INITIAL_UKURAN_OPTIONS = [
  '80x80 cm',
  '60x120 cm',
  '120x240 cm',
  '30x30 cm',
  '15x90 cm',
  '200x90 cm',
];

const INITIAL_AREA_OPTIONS = [
  'Area Sales Utama',
  'Area Toilet & Dapur',
  'Area Teras Depan',
  'Area Parkir',
  'Fascia Depan',
  'Gudang Transit',
];

export function ModalRequestPenetapanHarga({
  isOpen,
  onClose,
  onSubmit,
  nextIndex = 3,
}: ModalRequestPenetapanHargaProps) {
  const [noTiket] = useState(`REQ-2026-${String(nextIndex).padStart(3, '0')}`);
  const [item, setItem] = useState('');
  const [kategori, setKategori] = useState('Pekerjaan Keramik');
  const [ukuran, setUkuran] = useState('');
  const [merk, setMerk] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [alasanRequest, setAlasanRequest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!item.trim() || !kategori.trim() || !ukuran.trim() || !merk.trim() || !lokasi.trim() || !alasanRequest.trim()) {
      return;
    }

    const newItem: RequestPenetapanItem = {
      id: `req-${Date.now()}`,
      noTiket,
      tanggalRequest: new Date().toISOString().slice(0, 10),
      item: item.trim(),
      kategori: kategori.trim(),
      ukuran: ukuran.trim(),
      merk: merk.trim(),
      lokasi: lokasi.trim(),
      alasanRequest: alasanRequest.trim(),
      status: 'PENDING_VALIDASI_SB',
    };

    onSubmit(newItem);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setItem('');
    setUkuran('');
    setMerk('');
    setLokasi('');
    setAlasanRequest('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                <FilePlus className="w-5 h-5" />
              </span>
              Request Penetapan Harga Baru (Alur 1)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Form B&amp;M Manager untuk mengusulkan item pekerjaan baru agar di-mastering oleh S&amp;B Controlling Specialist.
            </DialogDescription>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            {noTiket}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kategori Pekerjaan */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </Label>
                <Select value={kategori} onValueChange={setKategori} required>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pekerjaan Keramik">Pekerjaan Keramik</SelectItem>
                    <SelectItem value="Pekerjaan Pasangan">Pekerjaan Pasangan</SelectItem>
                    <SelectItem value="Pekerjaan Finishing">Pekerjaan Finishing</SelectItem>
                    <SelectItem value="Pekerjaan Kusen & Kaca">Pekerjaan Kusen &amp; Kaca</SelectItem>
                    <SelectItem value="Area Terbuka">Area Terbuka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nama Item / Material */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Nama Item / Material Baru <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={item}
                  onChange={setItem}
                  options={INITIAL_MATERIAL_OPTIONS}
                  required
                  placeholder="Ketik atau pilih nama item baru..."
                />
              </div>

              {/* Ukuran */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Ukuran Standar <span className="text-red-500">*</span>
                </Label>
                <CreatableCombobox
                  value={ukuran}
                  onChange={setUkuran}
                  options={INITIAL_UKURAN_OPTIONS}
                  required
                  placeholder="Ketik atau pilih ukuran..."
                />
              </div>

              {/* Merk */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Merk / Brand Acuan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={merk}
                  onChange={e => setMerk(e.target.value)}
                  placeholder="Contoh: Sandimas, Jayaboard"
                  required
                  className="h-9 rounded-lg text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Lokasi Toko / Area */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Area / Peruntukan Toko <span className="text-red-500">*</span>
              </Label>
              <CreatableCombobox
                value={lokasi}
                onChange={setLokasi}
                options={INITIAL_AREA_OPTIONS}
                required
                placeholder="Pilih atau ketik area peruntukan..."
              />
            </div>

            {/* Alasan Request */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Alasan Request Penetapan Harga Baru <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={alasanRequest}
                onChange={e => setAlasanRequest(e.target.value)}
                placeholder="Jelaskan kebutuhan item baru ini di proyek toko..."
                required
                className="text-xs rounded-lg bg-white border-slate-200 min-h-[80px]"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Request ini akan dikirim ke <strong>S&amp;B Controlling Specialist</strong> untuk diverifikasi dan ditentukan koefisien mastering perhitungan (Upah, Material, dan Alat).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs border-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs gap-1.5"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Kirim Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
