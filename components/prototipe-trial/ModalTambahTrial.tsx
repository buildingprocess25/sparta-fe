// =============================================================================
// components/prototipe-trial/ModalTambahTrial.tsx
// Modal Formulir Pengajuan Item Trial Baru (Maker)
// Fitur: Spesifikasi Lengkap, Durasi 2-4 Bln, Estimasi Harga, Bongkaran, Lampiran
// Bahasa: Lugas, Ringkas, Clean Code
// =============================================================================

"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  Upload,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { TrialItem, TrialStatus } from './types';
import { addTrialItem } from './store';

interface ModalTambahTrialProps {
  isOpen: boolean;
  onClose: () => void;
  nextIndex?: number;
  onSuccess?: (item: TrialItem) => void;
}

const MAKER_OPTIONS = [
  { label: 'Pak Wiwit (Regional Manager - Senior)', value: 'Pak Wiwit', role: 'MAKER_SENIOR' },
  { label: 'Pak Jhon (Regional Manager - Senior)', value: 'Pak Jhon', role: 'MAKER_SENIOR' },
  { label: 'Pak Andy (BMES Manager - Senior)', value: 'Pak Andy', role: 'MAKER_SENIOR' },
  { label: 'Pak Eko Indra (PP Manager - Senior [Bypass PP])', value: 'Pak Eko Indra', role: 'PP_MANAGER' },
  { label: 'Bima (BMES Specialist - Junior)', value: 'Bima', role: 'MAKER_JUNIOR' },
  { label: 'Syahid Jaya (BMES Specialist - Junior)', value: 'Syahid Jaya', role: 'MAKER_JUNIOR' },
  { label: 'Pak Iqbal (BMES Specialist - Junior)', value: 'Pak Iqbal', role: 'MAKER_JUNIOR' },
  { label: 'Annisa Purnamasari / Mbak Caca (PP Specialist - Junior)', value: 'Annisa Purnamasari', role: 'MAKER_JUNIOR' },
  { label: 'Pak Dyan (S&B Specialist - Junior)', value: 'Pak Dyan', role: 'MAKER_JUNIOR' },
  { label: 'Pak Permadi (S&B Specialist - Junior)', value: 'Pak Permadi', role: 'MAKER_JUNIOR' },
];

const KATEGORI_OPTIONS = [
  'Pekerjaan Keramik',
  'Pekerjaan Finishing',
  'Pekerjaan Pasangan',
  'Pekerjaan Plafon',
  'Pekerjaan Lantai',
  'Pekerjaan Dinding',
  'Pekerjaan Sanitair',
  'Pekerjaan Elektrikal',
  'Pekerjaan Pintu & Jendela',
];

const CABANG_OPTIONS = [
  'Cikokol',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Medan',
  'Makassar',
  'Palembang',
  'Tangerang',
  'Jakarta Barat',
  'Bekasi',
];

export function ModalTambahTrial({
  isOpen,
  onClose,
  nextIndex = 110,
  onSuccess,
}: ModalTambahTrialProps) {
  // Maker & Durasi
  const [makerOption, setMakerOption] = useState(MAKER_OPTIONS[0]);
  const [durasiBulan, setDurasiBulan] = useState<2 | 3 | 4>(3);

  // Spesifikasi Fisik
  const [kategori, setKategori] = useState('Pekerjaan Keramik');
  const [namaItem, setNamaItem] = useState('');
  const [ukuranNilai, setUkuranNilai] = useState('60x60');
  const [ukuranSatuan, setUkuranSatuan] = useState('cm');
  const [merk, setMerk] = useState('');
  const [warna, setWarna] = useState('');
  const [tipe, setTipe] = useState('');
  const [permukaan, setPermukaan] = useState('Matte');
  const [tebalNilai, setTebalNilai] = useState('9');
  const [tebalSatuan, setTebalSatuan] = useState('mm');
  const [toleransiNilai, setToleransiNilai] = useState('0.5');
  const [toleransiSatuan, setToleransiSatuan] = useState('mm');
  const [implementasi, setImplementasi] = useState('Lantai Gerai');
  const [lokasi, setLokasi] = useState('Area Sales');
  const [cabang, setCabang] = useState('Cikokol');
  const [satuan, setSatuan] = useState('m2');
  const [informasiTambahan, setInformasiTambahan] = useState('');

  // Komersial & Lampiran
  const [estimasiHarga, setEstimasiHarga] = useState<number>(125000);
  const [isTermasukBongkaran, setIsTermasukBongkaran] = useState(false);
  const [lampiranName, setLampiranName] = useState('brosur_spesifikasi_produk.pdf');
  const [alasanTrial, setAlasanTrial] = useState('');

  const durasiHari = useMemo(() => durasiBulan * 30, [durasiBulan]);

  const kodeItem = useMemo(() => `SIP-${String(nextIndex).padStart(3, '0')}`, [nextIndex]);

  const deskripsiOtomatis = useMemo(() => {
    const parts = [
      namaItem || 'Item Material',
      merk ? `Merk ${merk}` : '',
      ukuranNilai ? `${ukuranNilai} ${ukuranSatuan}` : '',
      warna,
      tipe,
      tebalNilai ? `Tebal ${tebalNilai} ${tebalSatuan}` : '',
      permukaan,
      implementasi,
      lokasi,
      cabang ? `Cabang ${cabang}` : '',
    ].filter(Boolean);
    return parts.join(' - ');
  }, [namaItem, merk, ukuranNilai, ukuranSatuan, warna, tipe, tebalNilai, tebalSatuan, permukaan, implementasi, lokasi, cabang]);

  const handleSubmit = (isDraft: boolean) => {
    if (!isDraft && (!namaItem.trim() || !merk.trim() || !alasanTrial.trim())) {
      alert('Mohon lengkapi Nama Item, Merk, dan Alasan Pengajuan Trial.');
      return;
    }

    // Aturan Bisnis BR-01: Jika Maker adalah PP Manager, auto-skip ke TRIAL_PENDING_BM_GM
    let statusTarget: TrialStatus = 'TRIAL_DRAFT';
    if (!isDraft) {
      statusTarget = makerOption.role === 'PP_MANAGER' ? 'TRIAL_PENDING_BM_GM' : 'TRIAL_PENDING_PP_MGR';
    }

    const today = new Date().toISOString().split('T')[0];

    const newItem: TrialItem = {
      id: `trial-${Date.now()}`,
      kode: kodeItem,
      kodeMaster: `TRL-${kategori.substring(10, 13).toUpperCase() || 'ITM'}-${ukuranNilai}`,
      item: namaItem || 'Item Uji Coba Trial',
      kategori,
      ukuran: `${ukuranNilai} ${ukuranSatuan}`,
      merk,
      warna,
      tipe,
      permukaan,
      tebal: `${tebalNilai} ${tebalSatuan}`,
      toleransi: `${toleransiNilai} ${toleransiSatuan}`,
      implementasi,
      lokasi,
      cabang,
      satuan,
      deskripsiOtomatis,
      informasiTambahan,
      alasanTrial: alasanTrial || 'Uji coba operasional lapangan.',
      durasiBulan,
      durasiHari,
      estimasiHargaMaker: Number(estimasiHarga) || 0,
      isTermasukBongkaran,
      lampiranMakerName: lampiranName,
      lampiranMakerUrl: '#',
      makerRole: makerOption.role as any,
      makerNama: makerOption.value,
      tanggalPengajuan: today,
      status: statusTarget,
      historyLog: [
        {
          role: `Maker (${makerOption.role})`,
          namaUser: makerOption.value,
          action: 'SUBMIT',
          tanggal: today,
          catatan: isDraft
            ? 'Pengajuan disimpan sebagai draf.'
            : makerOption.role === 'PP_MANAGER'
            ? 'Diajukan oleh PP Manager (Alur PP Manager otomatis dilewati ke B&M General Manager).'
            : 'Pengajuan trial dikirimkan ke PP Manager untuk verifikasi awal.',
        },
      ],
    };

    addTrialItem(newItem);
    if (onSuccess) onSuccess(newItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Tambah Pengajuan Item Trial
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Kode Item: <span className="font-mono font-bold text-red-600">{kodeItem}</span> &bull; Lengkapi spesifikasi fisik, durasi, dan estimasi harga awal.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Bagian 1: Inisiasi Pengaju & Durasi Masa Trial */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Aktor Pengaju (Maker)</Label>
                <Select
                  value={makerOption.value}
                  onValueChange={(val) => {
                    const opt = MAKER_OPTIONS.find((o) => o.value === val);
                    if (opt) setMakerOption(opt);
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 bg-white text-xs">
                    <SelectValue placeholder="Pilih Maker" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAKER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector Durasi 2-4 Bulan (Tombol Kartu Ringkas) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Durasi Masa Uji Coba</span>
                  <span className="text-[11px] text-red-600 font-semibold">{durasiHari} Hari Kalender</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {([2, 3, 4] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setDurasiBulan(m)}
                      className={`h-9 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        durasiBulan === m
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{m} Bulan</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Spesifikasi Fisik Item (Standard TambahItemTrialModal) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Spesifikasi Fisik Material
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Kategori Pekerjaan</Label>
                <Select value={kategori} onValueChange={setKategori}>
                  <SelectTrigger className="mt-1 h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Nama Material / Item *</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Contoh: Keramik Lantai Heavy Duty"
                  value={namaItem}
                  onChange={(e) => setNamaItem(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Merk / Brand *</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Contoh: Sandimas / Roman"
                  value={merk}
                  onChange={(e) => setMerk(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Ukuran / Dimensi</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    className="h-8 text-xs flex-1"
                    value={ukuranNilai}
                    onChange={(e) => setUkuranNilai(e.target.value)}
                    placeholder="60x60"
                  />
                  <Select value={ukuranSatuan} onValueChange={setUkuranSatuan}>
                    <SelectTrigger className="h-8 w-16 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm" className="text-xs">cm</SelectItem>
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="m" className="text-xs">m</SelectItem>
                      <SelectItem value="inch" className="text-xs">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Warna</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Contoh: Grey Rock"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Tipe / Motif</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Contoh: Matte Flat"
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Finishing Permukaan</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  placeholder="Contoh: Matte Anti-Slip"
                  value={permukaan}
                  onChange={(e) => setPermukaan(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Ketebalan</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    className="h-8 text-xs flex-1"
                    value={tebalNilai}
                    onChange={(e) => setTebalNilai(e.target.value)}
                    placeholder="9"
                  />
                  <Select value={tebalSatuan} onValueChange={setTebalSatuan}>
                    <SelectTrigger className="h-8 w-16 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="cm" className="text-xs">cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Toleransi</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    className="h-8 text-xs flex-1"
                    value={toleransiNilai}
                    onChange={(e) => setToleransiNilai(e.target.value)}
                    placeholder="0.5"
                  />
                  <Select value={toleransiSatuan} onValueChange={setToleransiSatuan}>
                    <SelectTrigger className="h-8 w-16 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm" className="text-xs">mm</SelectItem>
                      <SelectItem value="%" className="text-xs">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Posisi / Implementasi</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={implementasi}
                  onChange={(e) => setImplementasi(e.target.value)}
                  placeholder="Lantai Gerai"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Area Gerai</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Area Sales & Kasir"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Cabang Uji Coba</Label>
                <Select value={cabang} onValueChange={setCabang}>
                  <SelectTrigger className="mt-1 h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CABANG_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Satuan Pekerjaan</Label>
                <Input
                  className="mt-1 h-8 text-xs"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  placeholder="m2 / unit / m1"
                />
              </div>
            </div>
          </div>

          {/* Bagian 3: Parameter Komersial Awal & Bongkaran */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Parameter Biaya Awal & Lingkup Pekerjaan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Estimasi Harga Awal Maker (Rp)
                </Label>
                <Input
                  type="number"
                  className="mt-1 h-9 text-xs bg-white"
                  value={estimasiHarga}
                  onChange={(e) => setEstimasiHarga(Number(e.target.value))}
                  placeholder="125000"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  *Catatan: Harga dan koefisien tetap dapat disesuaikan kembali oleh S&B Specialist.
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-2 p-2.5 bg-white rounded-lg border border-slate-200">
                  <Checkbox
                    id="bongkaran-checkbox"
                    checked={isTermasukBongkaran}
                    onCheckedChange={(checked) => setIsTermasukBongkaran(Boolean(checked))}
                  />
                  <label
                    htmlFor="bongkaran-checkbox"
                    className="text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    Termasuk Pekerjaan Bongkaran?
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-1">
                  Centang jika item memerlukan sub-pekerjaan bongkaran eksisting di toko.
                </p>
              </div>
            </div>
          </div>

          {/* Bagian 4: Lampiran & Alasan Trial */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Lampiran Dokumen / Gambar Maker</Label>
                <div className="mt-1 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  <Input
                    className="h-7 text-xs bg-white flex-1"
                    value={lampiranName}
                    onChange={(e) => setLampiranName(e.target.value)}
                    placeholder="nama_file_lampiran.pdf"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lampirkan foto spesifikasi, brosur, atau referensi material.
                </p>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Alasan / Urgensi Trial *</Label>
                <Textarea
                  className="mt-1 h-16 text-xs bg-white"
                  placeholder="Jelaskan tujuan pengujian lapangan..."
                  value={alasanTrial}
                  onChange={(e) => setAlasanTrial(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Live Preview Deskripsi Otomatis */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold text-slate-700 mb-0.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Preview Deskripsi Otomatis:
            </div>
            <p className="font-mono text-slate-800 text-[11px] leading-relaxed">
              {deskripsiOtomatis}
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-20 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(true)}
              className="text-xs"
            >
              Simpan Draf
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(false)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4"
            >
              Kirim Pengajuan Trial
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
