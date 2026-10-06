"use client";

import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, Plus, Check } from 'lucide-react';
import { MasterTokoItem } from '../types';
import { useGlobalAlert } from '@/context/GlobalAlertContext';

interface ModalTambahTokoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (toko: MasterTokoItem) => void;
  tokoToEdit?: MasterTokoItem | null;
}

export function ModalTambahToko({
  isOpen,
  onClose,
  onSave,
  tokoToEdit,
}: ModalTambahTokoProps) {
  const { showAlert } = useGlobalAlert();

  const [namaToko, setNamaToko] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kota, setKota] = useState('Tangerang');
  const [telepon, setTelepon] = useState('');
  const [kontakPic, setKontakPic] = useState('');
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  useEffect(() => {
    if (tokoToEdit) {
      setNamaToko(tokoToEdit.namaToko);
      setAlamat(tokoToEdit.alamat);
      setKota(tokoToEdit.kota);
      setTelepon(tokoToEdit.telepon || '');
      setKontakPic(tokoToEdit.kontakPic || '');
      setStatus(tokoToEdit.status);
    } else {
      setNamaToko('');
      setAlamat('');
      setKota('Tangerang');
      setTelepon('');
      setKontakPic('');
      setStatus('AKTIF');
    }
  }, [tokoToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaToko.trim()) {
      showAlert({
        title: 'Nama Toko Wajib Diisi',
        message: 'Mohon masukkan nama toko atau supplier bahan bangunan.',
        type: 'warning',
      });
      return;
    }

    if (!alamat.trim()) {
      showAlert({
        title: 'Alamat Toko Wajib Diisi',
        message: 'Mohon masukkan alamat lengkap toko.',
        type: 'warning',
      });
      return;
    }

    const tokoData: MasterTokoItem = {
      id: tokoToEdit ? tokoToEdit.id : `toko-${Date.now()}`,
      namaToko: namaToko.trim(),
      alamat: alamat.trim(),
      kota: kota.trim(),
      telepon: telepon.trim() || undefined,
      kontakPic: kontakPic.trim() || undefined,
      status: status,
      jumlahSurvei: tokoToEdit ? tokoToEdit.jumlahSurvei : 0,
    };

    onSave(tokoData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-5 md:p-6 bg-white border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {tokoToEdit ? 'Ubah Data Toko Rekanan' : 'Tambah Toko Rekanan Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Direktori toko bahan bangunan untuk acuan survei harga pasar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3 text-xs">
          {/* Nama Toko */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Nama Toko / Supplier <span className="text-red-500">*</span>
            </Label>
            <Input
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              placeholder="Contoh: Mitra 10 Cikokol, TB Sinar Abadi..."
              className="h-9 text-xs rounded-xl border-slate-200"
              required
            />
          </div>

          {/* Kota / Cabang Wilayah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Wilayah / Kota <span className="text-red-500">*</span>
              </Label>
              <Select value={kota} onValueChange={(val) => setKota(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="Pilih Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tangerang">Tangerang</SelectItem>
                  <SelectItem value="Tangerang Selatan">Tangerang Selatan</SelectItem>
                  <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                  <SelectItem value="Jakarta Selatan">Jakarta Selatan</SelectItem>
                  <SelectItem value="Bekasi">Bekasi</SelectItem>
                  <SelectItem value="Bogor">Bogor</SelectItem>
                  <SelectItem value="Depok">Depok</SelectItem>
                  <SelectItem value="Serang">Serang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Status Toko</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif (Rekomendasi)</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Alamat Lengkap Toko <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat jalan, nomor ruko, kelurahan, kecamatan..."
              className="text-xs rounded-xl border-slate-200 min-h-[70px] leading-relaxed"
              required
            />
          </div>

          {/* Kontak & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nomor Telepon Toko</Label>
              <Input
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="Contoh: 021-55781234 / 0812..."
                className="h-9 text-xs rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kontak Person / PIC</Label>
              <Input
                value={kontakPic}
                onChange={(e) => setKontakPic(e.target.value)}
                placeholder="Contoh: Bpk. Hendra (Manager Sales)"
                className="h-9 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 text-xs cursor-pointer order-last sm:order-first"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-9 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{tokoToEdit ? 'Simpan Perubahan' : 'Tambah Toko'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
