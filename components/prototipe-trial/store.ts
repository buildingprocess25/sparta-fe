// =============================================================================
// components/prototipe-trial/store.ts
// Store State Controller & Persistensi Prototipe Alur Trial Baru Sparta
// Clean Architecture: Terisolasi, Reaktif, & Mudah di-Debug
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  TrialItem,
  TrialStatus,
  KoefisienItem,
  FormEvaluasiTim,
  calculateEvaluationQuorum,
} from './types';

const STORAGE_KEY = 'sparta_prototipe_trial_items_v2';
const EVENT_NAME = 'sparta_trial_store_updated';

// Data Awal Mock yang merepresentasikan seluruh tahapan
const INITIAL_MOCK_ITEMS: TrialItem[] = [
  {
    id: 'trial-001',
    kode: 'SIP-101',
    kodeMaster: 'KRK-001-A-Keramik-60x60',
    item: 'Keramik Lantai Matte Heavy Duty',
    kategori: 'Pekerjaan Keramik',
    ukuran: '60x60 cm',
    merk: 'Sandimas',
    warna: 'Grey Rock',
    tipe: 'Sicily Grey Matte',
    permukaan: 'Matte Anti-Slip',
    tebal: '9 mm',
    toleransi: '0.5 mm',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Sales & Kasir',
    cabang: 'Cikokol',
    satuan: 'm2',
    deskripsiOtomatis: 'Keramik Lantai Sandimas 60x60 cm Grey Rock Sicily Grey Matte Tebal 9 mm untuk Area Sales & Kasir Cikokol',
    alasanTrial: 'Pengujian durabilitas terhadap gesekan troli barang dan lalu lintas konsumen tinggi.',
    durasiBulan: 3,
    durasiHari: 90,
    estimasiHargaMaker: 115000,
    isTermasukBongkaran: true,
    lampiranMakerName: 'spek_sandimas_heavy_duty.pdf',
    lampiranMakerUrl: '#',
    makerRole: 'MAKER_JUNIOR',
    makerNama: 'Bima (BMES Specialist)',
    tanggalPengajuan: '2026-10-08',
    status: 'TRIAL_PENDING_PP_MGR',
    historyLog: [
      {
        role: 'Maker (BMES Specialist)',
        namaUser: 'Bima',
        action: 'SUBMIT',
        tanggal: '2026-10-08',
        catatan: 'Pengajuan item trial keramik heavy duty untuk cabang Cikokol.',
      },
    ],
  },
  {
    id: 'trial-002',
    kode: 'SIP-102',
    kodeMaster: 'FIN-002-Cat-Epoxy-Lantai',
    item: 'Cat Epoxy Floor Self-Leveling',
    kategori: 'Pekerjaan Finishing',
    ukuran: '20 kg',
    merk: 'Propan',
    warna: 'Light Grey',
    tipe: 'Epogreen Multi-layer',
    permukaan: 'Gloss Anti-Chemical',
    tebal: '2 mm',
    toleransi: '0.2 mm',
    implementasi: 'Lantai Gudang',
    lokasi: 'Area Gudang & Chiller',
    cabang: 'Bandung',
    satuan: 'm2',
    deskripsiOtomatis: 'Cat Epoxy Floor Propan 20 kg Light Grey Tebal 2 mm untuk Area Gudang & Chiller Bandung',
    alasanTrial: 'Uji ketahanan suhu dingin dan tumpahan cairan pembersih di area chiller.',
    durasiBulan: 2,
    durasiHari: 60,
    estimasiHargaMaker: 85000,
    isTermasukBongkaran: false,
    lampiranMakerName: 'datasheet_epoxy_propan.pdf',
    lampiranMakerUrl: '#',
    makerRole: 'PP_MANAGER',
    makerNama: 'Pak Eko Indra (PP Manager)',
    tanggalPengajuan: '2026-10-09',
    status: 'TRIAL_PENDING_BM_GM', // Auto-skip PP Manager!
    historyLog: [
      {
        role: 'PP Manager (Maker)',
        namaUser: 'Pak Eko Indra',
        action: 'SUBMIT',
        tanggal: '2026-10-09',
        catatan: 'Diajukan langsung oleh PP Manager. Auto-bypass ke B&M General Manager.',
      },
    ],
  },
  {
    id: 'trial-003',
    kode: 'SIP-103',
    kodeMaster: 'PLF-003-Plafon-PVC-AntiAir',
    item: 'Plafon PVC Waterproof Anti-Rayap',
    kategori: 'Pekerjaan Plafon',
    ukuran: '20x400 cm',
    merk: 'Shunda Plafon',
    warna: 'White Lily',
    tipe: 'Linear Fluted 4-Groove',
    permukaan: 'Semi Gloss',
    tebal: '8 mm',
    toleransi: '0.1 mm',
    implementasi: 'Plafon Gerai',
    lokasi: 'Area Teras & Teras Depan',
    cabang: 'Surabaya',
    satuan: 'm2',
    deskripsiOtomatis: 'Plafon PVC Shunda Plafon 20x400 cm White Lily Tebal 8 mm untuk Area Teras Surabaya',
    alasanTrial: 'Solusi plafon anti-bocor untuk teras luar yang terpapar angin dan tempias hujan.',
    durasiBulan: 3,
    durasiHari: 90,
    estimasiHargaMaker: 145000,
    isTermasukBongkaran: true,
    makerRole: 'MAKER_SENIOR',
    makerNama: 'Pak Andy (BMES Manager)',
    tanggalPengajuan: '2026-10-05',
    status: 'TRIAL_PENDING_SB_CONFIG', // Disetujui BM GM, menunggu S&B
    historyLog: [
      {
        role: 'Maker (BMES Manager)',
        namaUser: 'Pak Andy',
        action: 'SUBMIT',
        tanggal: '2026-10-05',
      },
      {
        role: 'PP Manager',
        namaUser: 'Pak Eko Indra',
        action: 'APPROVE',
        tanggal: '2026-10-06',
        catatan: 'Disetujui. Spesifikasi sesuai standar toko modern.',
      },
      {
        role: 'B&M General Manager',
        action: 'APPROVE',
        tanggal: '2026-10-07',
        catatan: 'Disetujui. Silakan S&B susun rincian koefisien dan harga.',
      },
    ],
  },
  {
    id: 'trial-004',
    kode: 'SIP-104',
    kodeMaster: 'ELK-004-Lampu-LED-Batten',
    item: 'Lampu LED Batten High Lumen Eco',
    kategori: 'Pekerjaan Elektrikal',
    ukuran: '120 cm',
    merk: 'Philips',
    warna: 'Cool Daylight (6500K)',
    tipe: 'Essential SmartBright 18W',
    permukaan: 'Frosted Diffuser',
    tebal: '30 mm',
    toleransi: '1 mm',
    implementasi: 'Plafon Gerai',
    lokasi: 'Area Sales Utama',
    cabang: 'Semarang',
    satuan: 'unit',
    deskripsiOtomatis: 'Lampu LED Batten Philips 120 cm 18W untuk Area Sales Utama Semarang',
    alasanTrial: 'Pengujian efisiensi daya listrik dan penurunan emisi panas di area rak penjualan.',
    durasiBulan: 4,
    durasiHari: 120,
    estimasiHargaMaker: 98000,
    isTermasukBongkaran: false,
    makerRole: 'MAKER_JUNIOR',
    makerNama: 'Syahid Jaya (BMES Specialist)',
    tanggalPengajuan: '2026-10-02',
    status: 'TRIAL_PENDING_BM_REG_CONFIG', // S&B sudah hitung, menunggu Reg Mgr
    marginUpah: 8,
    marginMaterial: 8,
    hargaTrialFinal: 104500,
    koefisienUpah: [
      { id: 'u-1', label: 'Mandor', unit: 'Oh', value: 0.015, hargaAcuan: 245000, jenis: 'UPAH' },
      { id: 'u-2', label: 'Tukang Listrik', unit: 'Oh', value: 0.15, hargaAcuan: 210000, jenis: 'UPAH' },
    ],
    koefisienMaterial: [
      { id: 'm-1', label: 'Lampu LED Philips 18W Batten', unit: 'unit', value: 1.0, hargaAcuan: 65000, jenis: 'MATERIAL' },
      { id: 'm-2', label: 'Kabel NYM 2x1.5mm', unit: 'm', value: 1.2, hargaAcuan: 8500, jenis: 'MATERIAL' },
    ],
    historyLog: [
      { role: 'Maker', action: 'SUBMIT', tanggal: '2026-10-02' },
      { role: 'PP Manager', action: 'APPROVE', tanggal: '2026-10-03' },
      { role: 'B&M General Manager', action: 'APPROVE', tanggal: '2026-10-04' },
      {
        role: 'S&B Specialist',
        namaUser: 'Pak Dyan',
        action: 'CONFIG',
        tanggal: '2026-10-05',
        catatan: 'Koefisien upah dan material telah dihitung dengan margin 8%. Harga final trial Rp 104.500.',
      },
    ],
  },
  {
    id: 'trial-005',
    kode: 'SIP-105',
    kodeMaster: 'SNT-005-Kloset-Duduk-EcoFlush',
    item: 'Kloset Duduk Eco-Flush Dual Button',
    kategori: 'Pekerjaan Sanitair',
    ukuran: '36x70x74 cm',
    merk: 'Toto',
    warna: 'White',
    tipe: 'EcoWash C436',
    permukaan: 'Cefiontect Glossy',
    tebal: '12 mm',
    toleransi: '2 mm',
    implementasi: 'Toilet Gerai',
    lokasi: 'Toilet Konsumen & Karyawan',
    cabang: 'Cikokol',
    satuan: 'unit',
    deskripsiOtomatis: 'Kloset Duduk Toto White EcoWash C436 untuk Toilet Gerai Cikokol',
    alasanTrial: 'Uji ketahanan katup penghemat air di gerai dengan traffic toilet intensif.',
    durasiBulan: 3,
    durasiHari: 90,
    estimasiHargaMaker: 1850000,
    isTermasukBongkaran: true,
    makerRole: 'MAKER_SENIOR',
    makerNama: 'Pak Wiwit (Regional Manager)',
    tanggalPengajuan: '2026-08-15',
    status: 'TRIAL_AKTIF', // Sedang aktif berjalan di lapangan!
    nomorDokumenTrial: 'SPARTA/TRIAL/202608/SIP-105',
    trialStartDate: '2026-08-20',
    trialEndDate: '2026-11-18',
    hargaTrialFinal: 1920000,
    historyLog: [
      { role: 'Maker (Regional Manager)', action: 'SUBMIT', tanggal: '2026-08-15' },
      { role: 'B&M General Manager', action: 'APPROVE', tanggal: '2026-08-16' },
      { role: 'S&B Specialist', action: 'CONFIG', tanggal: '2026-08-18' },
      {
        role: 'B&M Regional Manager',
        namaUser: 'Pak Wiwit',
        action: 'APPROVE',
        tanggal: '2026-08-20',
        catatan: 'Dokumen trial resmi terbit. Item aktif untuk SPK cabang Cikokol.',
      },
    ],
  },
  {
    id: 'trial-006',
    kode: 'SIP-106',
    kodeMaster: 'LNT-006-Vinyl-Plank-Click',
    item: 'Vinyl Plank Rigid Core Click 5mm',
    kategori: 'Pekerjaan Lantai',
    ukuran: '18x122 cm',
    merk: 'Duma',
    warna: 'Natural Oak',
    tipe: 'Plank Click Series',
    permukaan: 'Deep Embossed Anti-Slip',
    tebal: '5 mm',
    toleransi: '0.2 mm',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Bean Spot & Kafe',
    cabang: 'Tangerang',
    satuan: 'm2',
    deskripsiOtomatis: 'Vinyl Plank Duma 18x122 cm Natural Oak Tebal 5 mm untuk Area Bean Spot Tangerang',
    alasanTrial: 'Uji ketahanan terhadap goresan kursi dan tumpahan kopi di area Bean Spot.',
    durasiBulan: 2,
    durasiHari: 60,
    estimasiHargaMaker: 165000,
    isTermasukBongkaran: false,
    makerRole: 'MAKER_JUNIOR',
    makerNama: 'Annisa Purnamasari (PP Specialist)',
    tanggalPengajuan: '2026-08-01',
    status: 'TRIAL_EVALUASI_VOTING', // Masa aktif 60 hari habis!
    nomorDokumenTrial: 'SPARTA/TRIAL/202608/SIP-106',
    trialStartDate: '2026-08-05',
    trialEndDate: '2026-10-04',
    hargaTrialFinal: 172000,
    evaluasiPP: {
      tim: 'TIM_PP',
      namaPenilai: 'Mbak Caca (PP Specialist)',
      keputusan: 'LANJUT',
      catatan: 'Tahan air dan tumpahan kopi, sambungan click presisi.',
      lampiranName: 'laporan_uji_lapangan_pp_bean_spot.pdf',
      tanggal: '2026-10-06',
    },
    // Belum diisi oleh BMES dan S&B (Menunggu voting!)
    historyLog: [
      { role: 'Regional Manager', action: 'APPROVE', tanggal: '2026-08-05' },
      { role: 'Tim Evaluasi (PP)', action: 'EVALUATE', tanggal: '2026-10-06', catatan: 'PP mengisi form evaluasi: Lanjut.' },
    ],
  },
  {
    id: 'trial-007',
    kode: 'SIP-107',
    kodeMaster: 'PSG-007-Batu-Bata-Ringan-AAC',
    item: 'Bata Ringan AAC Presisi Grade A',
    kategori: 'Pekerjaan Pasangan',
    ukuran: '60x20x10 cm',
    merk: 'Batu Alam',
    warna: 'White Grey',
    tipe: 'Block AAC Presisi',
    permukaan: 'Halus Porous',
    tebal: '10 cm',
    toleransi: '1 mm',
    implementasi: 'Dinding Gerai',
    lokasi: 'Dinding Sekat Gudang',
    cabang: 'Bekasi',
    satuan: 'm3',
    deskripsiOtomatis: 'Bata Ringan AAC 60x20x10 cm untuk Dinding Sekat Gudang Bekasi',
    alasanTrial: 'Efisiensi waktu pengerjaan sekat partisi gerai renovasi.',
    durasiBulan: 2,
    durasiHari: 60,
    estimasiHargaMaker: 650000,
    isTermasukBongkaran: true,
    makerRole: 'MAKER_JUNIOR',
    makerNama: 'Pak Iqbal (BMES Specialist)',
    tanggalPengajuan: '2026-07-20',
    status: 'TRIAL_PENDING_FINAL_BM_REG', // Lolos kuorum 2 dari 3 setuju!
    nomorDokumenTrial: 'SPARTA/TRIAL/202607/SIP-107',
    hargaTrialFinal: 675000,
    evaluasiPP: {
      tim: 'TIM_PP',
      namaPenilai: 'Pak Eko Indra',
      keputusan: 'LANJUT',
      catatan: 'Waktu konstruksi lebih cepat 25%, mutu dinding baik.',
      lampiranName: 'uji_kuat_tekan_bata.pdf',
      tanggal: '2026-10-01',
    },
    evaluasiBMES: {
      tim: 'TIM_BMES',
      namaPenilai: 'Pak Andy',
      keputusan: 'LANJUT',
      catatan: 'Tidak ada retak rambut pasca plesteran acian.',
      lampiranName: 'foto_inspeksi_dinding.jpg',
      tanggal: '2026-10-02',
    },
    historyLog: [
      { role: 'Tim Evaluasi (PP)', action: 'EVALUATE', tanggal: '2026-10-01' },
      { role: 'Tim Evaluasi (BMES)', action: 'EVALUATE', tanggal: '2026-10-02' },
    ],
  },
  {
    id: 'trial-008',
    kode: 'SIP-108',
    kodeMaster: 'KRM-008-Granit-Tile-Polished',
    item: 'Granit Tile Nano Polished 80x80',
    kategori: 'Pekerjaan Keramik',
    ukuran: '80x80 cm',
    merk: 'Roman',
    warna: 'Ivory Cream',
    tipe: 'Travertine Cream Polish',
    permukaan: 'Nano Polish Gloss',
    tebal: '10 mm',
    toleransi: '0.3 mm',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Sales Gerai Premium',
    cabang: 'Jakarta Barat',
    satuan: 'm2',
    deskripsiOtomatis: 'Granit Tile Roman 80x80 cm Ivory Cream Tebal 10 mm untuk Area Sales Jakarta Barat',
    alasanTrial: 'Uji ketahanan kilap lantai pada konsep gerai Alfamart format besar.',
    durasiBulan: 3,
    durasiHari: 90,
    estimasiHargaMaker: 210000,
    isTermasukBongkaran: true,
    makerRole: 'MAKER_SENIOR',
    makerNama: 'Pak Jhon (Regional Manager)',
    tanggalPengajuan: '2026-06-10',
    status: 'TRIAL_EVALUASI_TIDAK_LANJUT', // Tidak lanjut / Kuorum gagal -> NON-DEADLOCK!
    nomorDokumenTrial: 'SPARTA/TRIAL/202606/SIP-108',
    hargaTrialFinal: 225000,
    evaluasiPP: {
      tim: 'TIM_PP',
      namaPenilai: 'Pak Eko Indra',
      keputusan: 'TIDAK_LANJUT',
      catatan: 'Biaya pemasangan terlalu tinggi dan mudah licin saat basah.',
      lampiranName: 'laporan_inspeksi_lantai_licin.pdf',
      tanggal: '2026-09-15',
    },
    evaluasiBMES: {
      tim: 'TIM_BMES',
      namaPenilai: 'Pak Andy',
      keputusan: 'TIDAK_LANJUT',
      catatan: 'Rentan gores jika terkena roda pallet.',
      lampiranName: 'bukti_goresan_pallet.jpg',
      tanggal: '2026-09-16',
    },
    historyLog: [
      { role: 'Tim Evaluasi', action: 'EVALUATE', tanggal: '2026-09-16', catatan: 'Kuorum menolak (2 dari 3 Tidak Lanjut).' },
    ],
  },
  {
    id: 'trial-009',
    kode: 'SIP-109',
    kodeMaster: 'WPC-009-Wallpanel-Fluted',
    item: 'WPC Wallpanel Wood Texture Fluted',
    kategori: 'Pekerjaan Dinding',
    ukuran: '20x290 cm',
    merk: 'Duma',
    warna: 'Teak Wood',
    tipe: 'Linear Fluted',
    permukaan: 'Embossed Woodgrain',
    tebal: '12 mm',
    toleransi: '0.5 mm',
    implementasi: 'Dinding Gerai',
    lokasi: 'Fascia Depan & Kasir',
    cabang: 'Tangerang',
    satuan: 'm2',
    deskripsiOtomatis: 'WPC Wallpanel Duma 20x290 cm Teak Wood untuk Dinding Fascia Tangerang',
    alasanTrial: 'Standarisasi aksen dinding estetik kayu tahan rayap dan cuaca.',
    durasiBulan: 3,
    durasiHari: 90,
    estimasiHargaMaker: 175000,
    isTermasukBongkaran: false,
    makerRole: 'MAKER_SENIOR',
    makerNama: 'Pak Andy (BMES Manager)',
    tanggalPengajuan: '2026-05-01',
    status: 'TRIAL_PROMOTED_MASTER', // SUDAH RESMI MASUK MASTER HARGA!
    nomorDokumenTrial: 'SPARTA/TRIAL/202605/SIP-109',
    hargaTrialFinal: 182000,
    historyLog: [
      { role: 'Regional Manager', action: 'APPROVE', tanggal: '2026-05-10' },
      { role: 'Tim Evaluasi', action: 'EVALUATE', tanggal: '2026-08-15', catatan: 'Lolos kuorum 3/3 setuju.' },
      {
        role: 'B&M Regional Manager',
        namaUser: 'Pak Wiwit',
        action: 'PROMOTE',
        tanggal: '2026-08-20',
        catatan: 'Disetujui final. Resmi ditetapkan menjadi Master Harga perusahaan.',
      },
    ],
  },
];

// Helper akses localStorage
export function getStoredTrialItems(): TrialItem[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ITEMS));
      return INITIAL_MOCK_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ITEMS;
  }
}

export function saveStoredTrialItems(items: TrialItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.error('Gagal menyimpan trial items ke localStorage:', err);
  }
}

export function resetToDefaultTrialItems(): void {
  saveStoredTrialItems(INITIAL_MOCK_ITEMS);
}

// Mutasi Operasi Bisnis (Clean Architecture)
export function addTrialItem(newItem: TrialItem): void {
  const current = getStoredTrialItems();
  saveStoredTrialItems([newItem, ...current]);
}

export function updateTrialItem(id: string, updater: (item: TrialItem) => TrialItem): void {
  const current = getStoredTrialItems();
  const next = current.map((i) => (i.id === id ? updater(i) : i));
  saveStoredTrialItems(next);
}

export function approveTrialPP(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_PENDING_BM_GM',
    historyLog: [
      ...item.historyLog,
      {
        role: 'PP Manager',
        namaUser: 'Pak Eko Indra',
        action: 'APPROVE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Disetujui oleh PP Manager.',
      },
    ],
  }));
}

export function reviseTrialPP(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_REVISI_MAKER',
    revisiCatatan: catatan,
    revisiOleh: 'PP Manager',
    historyLog: [
      ...item.historyLog,
      {
        role: 'PP Manager',
        namaUser: 'Pak Eko Indra',
        action: 'REVISE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Dikembalikan untuk revisi oleh PP Manager.',
      },
    ],
  }));
}

export function approveTrialBMGM(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_PENDING_SB_CONFIG',
    historyLog: [
      ...item.historyLog,
      {
        role: 'B&M General Manager',
        action: 'APPROVE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Disetujui oleh B&M General Manager.',
      },
    ],
  }));
}

export function reviseTrialBMGM(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_REVISI_MAKER',
    revisiCatatan: catatan,
    revisiOleh: 'B&M General Manager',
    historyLog: [
      ...item.historyLog,
      {
        role: 'B&M General Manager',
        action: 'REVISE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Dikembalikan untuk revisi oleh B&M General Manager.',
      },
    ],
  }));
}

export function submitTrialSBCoefficients(
  id: string,
  data: {
    koefisienUpah: KoefisienItem[];
    koefisienMaterial: KoefisienItem[];
    koefisienBongkaran?: KoefisienItem[];
    marginUpah: number;
    marginMaterial: number;
    hargaTrialFinal: number;
    catatan?: string;
  }
): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_PENDING_BM_REG_CONFIG',
    koefisienUpah: data.koefisienUpah,
    koefisienMaterial: data.koefisienMaterial,
    koefisienBongkaran: data.koefisienBongkaran,
    marginUpah: data.marginUpah,
    marginMaterial: data.marginMaterial,
    hargaTrialFinal: data.hargaTrialFinal,
    historyLog: [
      ...item.historyLog,
      {
        role: 'S&B Specialist',
        action: 'CONFIG',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: data.catatan || `Harga final trial disesuaikan menjadi Rp ${data.hargaTrialFinal.toLocaleString('id-ID')}`,
      },
    ],
  }));
}

export function approveTrialRegMgrConfig(id: string, catatan: string): void {
  const today = new Date().toISOString().split('T')[0];
  const yearMonth = today.replace('-', '').substring(0, 6);
  updateTrialItem(id, (item) => {
    const docNo = item.nomorDokumenTrial || `SPARTA/TRIAL/${yearMonth}/${item.kode}`;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + item.durasiHari);
    return {
      ...item,
      status: 'TRIAL_AKTIF',
      nomorDokumenTrial: docNo,
      trialStartDate: today,
      trialEndDate: endDate.toISOString().split('T')[0],
      historyLog: [
        ...item.historyLog,
        {
          role: 'B&M Regional Manager',
          action: 'APPROVE',
          tanggal: today,
          catatan: catatan || `Harga disetujui. Dokumen resmi diterbitkan: ${docNo}. Item aktif untuk transaksi SPK.`,
        },
      ],
    };
  });
}

export function reviseTrialRegMgrConfig(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_REVISI_SB',
    revisiCatatan: catatan,
    revisiOleh: 'B&M Regional Manager',
    historyLog: [
      ...item.historyLog,
      {
        role: 'B&M Regional Manager',
        action: 'REVISE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Harga perlu disesuaikan kembali oleh tim S&B.',
      },
    ],
  }));
}

export function submitTrialTimEvaluation(id: string, form: FormEvaluasiTim): void {
  updateTrialItem(id, (item) => {
    const updated = { ...item };
    if (form.tim === 'TIM_PP') updated.evaluasiPP = form;
    if (form.tim === 'TIM_BMES') updated.evaluasiBMES = form;
    if (form.tim === 'TIM_SB') updated.evaluasiSB = form;

    const quorum = calculateEvaluationQuorum(updated);
    let nextStatus: TrialStatus = updated.status;
    let logMsg = `Form evaluasi ${form.tim} dikirim: ${form.keputusan}.`;

    if (quorum.isQuorumApproved) {
      nextStatus = 'TRIAL_PENDING_FINAL_BM_REG';
      logMsg += ' Kuorum 2/3 terpenuhi (Setuju Lanjut ke Master).';
    } else if (quorum.isQuorumRejected) {
      nextStatus = 'TRIAL_EVALUASI_TIDAK_LANJUT';
      logMsg += ' Kuorum mayoritas menolak (Tidak Lanjut). Item siap untuk aksi re-entry.';
    }

    updated.status = nextStatus;
    updated.historyLog = [
      ...updated.historyLog,
      {
        role: `Evaluator (${form.tim})`,
        namaUser: form.namaPenilai,
        action: 'EVALUATE',
        tanggal: form.tanggal,
        catatan: logMsg,
      },
    ];

    return updated;
  });
}

export function approveTrialFinalMaster(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_PROMOTED_MASTER',
    historyLog: [
      ...item.historyLog,
      {
        role: 'B&M Regional Manager',
        action: 'PROMOTE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Disetujui resmi. Item ditetapkan ke dalam katalog Master Harga permanen.',
      },
    ],
  }));
}

export function rejectTrialFinalMaster(id: string, catatan: string): void {
  updateTrialItem(id, (item) => ({
    ...item,
    status: 'TRIAL_DITOLAK_REG_MGR',
    revisiCatatan: catatan,
    revisiOleh: 'B&M Regional Manager',
    historyLog: [
      ...item.historyLog,
      {
        role: 'B&M Regional Manager',
        action: 'REVISE',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan || 'Penetapan master ditolak oleh Regional Manager. Item dapat diajukan kembali.',
      },
    ],
  }));
}

// Aksi Re-Entry Non-Deadlock
export function reEntryTrialAction(
  id: string,
  actionType: 'RE_TRIAL' | 'DIRECT_MASTER' | 'RESUBMIT',
  catatan?: string
): void {
  const today = new Date().toISOString().split('T')[0];
  updateTrialItem(id, (item) => {
    if (actionType === 'RE_TRIAL') {
      return {
        ...item,
        status: 'TRIAL_PENDING_PP_MGR',
        evaluasiPP: undefined,
        evaluasiBMES: undefined,
        evaluasiSB: undefined,
        historyLog: [
          ...item.historyLog,
          {
            role: 'Maker',
            action: 'RE_ENTRY',
            tanggal: today,
            catatan: catatan || 'Item diajukan kembali untuk periode uji coba trial babak baru.',
          },
        ],
      };
    }
    if (actionType === 'DIRECT_MASTER') {
      return {
        ...item,
        status: 'TRIAL_PENDING_FINAL_BM_REG',
        historyLog: [
          ...item.historyLog,
          {
            role: 'Maker / Manajemen',
            action: 'RE_ENTRY',
            tanggal: today,
            catatan: catatan || 'Item diajukan langsung ke penetapan akhir Master Harga.',
          },
        ],
      };
    }
    // RESUBMIT pasca penolakan
    return {
      ...item,
      status: 'TRIAL_PENDING_PP_MGR',
      historyLog: [
        ...item.historyLog,
        {
          role: 'Maker',
          action: 'RE_ENTRY',
          tanggal: today,
          catatan: catatan || 'Item diperbaiki dan diajukan ulang ke alur persetujuan.',
        },
      ],
    };
  });
}

// Custom Hook Reactive (Clean Architecture)
export function useTrialStore() {
  const [items, setItems] = useState<TrialItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => {
    setItems(getStoredTrialItems());
  }, []);

  useEffect(() => {
    setMounted(true);
    reload();

    const handleStorage = () => reload();
    window.addEventListener(EVENT_NAME, handleStorage);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorage);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, [reload]);

  return {
    items,
    mounted,
    reload,
    resetToDefault: resetToDefaultTrialItems,
    addItem: addTrialItem,
    updateItem: updateTrialItem,
    approvePP: approveTrialPP,
    revisePP: reviseTrialPP,
    approveBMGM: approveTrialBMGM,
    reviseBMGM: reviseTrialBMGM,
    submitSBCoef: submitTrialSBCoefficients,
    approveRegMgrConfig: approveTrialRegMgrConfig,
    reviseRegMgrConfig: reviseTrialRegMgrConfig,
    submitEvaluation: submitTrialTimEvaluation,
    approveFinalMaster: approveTrialFinalMaster,
    rejectFinalMaster: rejectTrialFinalMaster,
    reEntry: reEntryTrialAction,
  };
}
