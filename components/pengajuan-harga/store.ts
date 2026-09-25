// =============================================================================
// components/pengajuan-harga/store.ts
// Local Storage & Shared State Store untuk Prototipe SPARTA Pengajuan Harga
// =============================================================================

import {
  RequestPenetapanItem,
  PengajuanHargaItem,
  TrialHargaItem,
} from './types';

const STORAGE_KEYS = {
  REQUEST_PENETAPAN: 'sparta_request_penetapan_v1',
  PENGAJUAN_HARGA: 'sparta_pengajuan_harga_v2',
  TRIAL_HARGA: 'sparta_trial_harga_v1',
};

// Data Awal Simulasi Alur 1: Request Penetapan Harga Baru oleh B&M Manager
export const INITIAL_REQUEST_PENETAPAN: RequestPenetapanItem[] = [
  {
    id: 'req-1',
    noTiket: 'REQ-2026-001',
    tanggalRequest: '2026-09-24',
    item: 'Homogeneous Tile',
    kategori: 'Pekerjaan Keramik',
    ukuran: '80x80 cm',
    merk: 'Sandimas',
    lokasi: 'Area Sales Utama',
    alasanRequest: 'Membutuhkan standar lantai tahan gores beban lalu lintas tinggi gerai baru.',
    status: 'DIAJUKAN',
  },
  {
    id: 'req-2',
    noTiket: 'REQ-2026-002',
    tanggalRequest: '2026-09-23',
    item: 'Gypsum Board Tahan Air',
    kategori: 'Pekerjaan Finishing',
    ukuran: '120x240 cm',
    merk: 'Jayaboard',
    lokasi: 'Area Toilet & Dapur',
    alasanRequest: 'Spesifikasi standar plafon area lembab belum memiliki koefisien master.',
    status: 'DISETUJUI',
    koefisienUpah: 0.25,
    koefisienMaterial: 1.05,
    koefisienAlat: 0.05,
    catatanReview: 'Disetujui. Koefisien standar AHSP telah di-mastering.',
  },
  {
    id: 'req-3',
    noTiket: 'REQ-2026-003',
    tanggalRequest: '2026-09-22',
    item: 'Cat Dinding Interior Dulux',
    kategori: 'Pekerjaan Pengecatan',
    ukuran: '20 Liter',
    merk: 'Dulux',
    lokasi: 'Area Sales & Fascia Depan',
    alasanRequest: 'Pengajuan merk alternatif untuk penghematan biaya.',
    status: 'DITOLAK',
    catatanReview: 'Ditolak. Spesifikasi cat tidak sesuai dengan panduan warna standar gerai Alfa.',
  },
];

// Data Awal Simulasi Alur Pengajuan Harga (Masing-masing 3 data: DIAJUKAN, REVISI, DITOLAK, DISETUJUI)
export const INITIAL_PENGAJUAN_HARGA: PengajuanHargaItem[] = [
  // ==========================================
  // 1. DATA DALAM PENGAJUAN (STATUS: DIAJUKAN)
  // ==========================================
  {
    id: 'item-1',
    kode: 'SIP-001',
    kodeMaster: 'SIP-001-A-Keramik-60x60',
    item: 'Keramik',
    ukuran: '60x60 cm',
    merk: 'Sandimas',
    warna: 'Grey',
    tipe: 'Sicily Grey Matte',
    tebal: '9mm',
    permukaan: 'Matte',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Teras Depan',
    toleransi: '±0.2mm',
    informasiTambahan: 'Nat semen SIKA Tile Grout warna abu',
    deskripsiOtomatis: 'Keramik 60×60 cm Sandimas Grey Tipe Sicily Grey Matte Matte Area Teras Depan Nat semen SIKA Tile Grout warna abu (Lantai Gerai)',
    estimasiHarga: 185000,
    satuan: 'm2',
    status: 'DIAJUKAN',
    tanggalPengajuan: '2026-09-24',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-24 09:30',
        catatan: 'Pengajuan spesifikasi standar keramik teras gerai baru.',
      },
    ],
  },
  {
    id: 'item-2',
    kode: 'SIP-002',
    kodeMaster: 'SIP-002-A-Granit-60x60',
    item: 'Granit',
    ukuran: '60x60 cm',
    merk: 'Indogress',
    warna: 'Cream',
    tipe: 'Travertine Cream Polish',
    tebal: '10mm',
    permukaan: 'Polish',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Sales Utama',
    toleransi: '±0.1mm',
    informasiTambahan: 'Standar lantai gerai tipe reguler traffic tinggi',
    deskripsiOtomatis: 'Granit 60×60 cm Indogress Cream Tipe Travertine Cream Polish Polish Area Sales Utama Standar lantai gerai tipe reguler traffic tinggi (Lantai Gerai)',
    estimasiHarga: 215000,
    satuan: 'm2',
    status: 'DIAJUKAN',
    tanggalPengajuan: '2026-09-24',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-24 10:15',
        catatan: 'Pengajuan granit pengganti spek lama untuk area sales.',
      },
    ],
  },
  {
    id: 'item-3',
    kode: 'SIP-003',
    kodeMaster: 'SIP-003-A-CatDinding-20L',
    item: 'Cat Dinding Interior',
    ukuran: '20 Liter',
    merk: 'Dulux',
    warna: 'Brilliant White',
    tipe: 'Pentalite Ultra Matt',
    tebal: '2 Lapis',
    permukaan: 'Matt',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Gerai',
    lokasi: 'Area Sales & Kasir',
    toleransi: 'Standar Pabrik',
    informasiTambahan: 'Daya sebar 10-12 m2/liter per lapis',
    deskripsiOtomatis: 'Cat Dinding Interior 20 Liter Dulux Brilliant White Tipe Pentalite Ultra Matt Matt Area Sales & Kasir Daya sebar 10-12 m2/liter per lapis (Dinding Gerai)',
    estimasiHarga: 1350000,
    satuan: 'Pail',
    status: 'DIAJUKAN',
    tanggalPengajuan: '2026-09-25',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-25 08:30',
        catatan: 'Penyegaran standar cat dinding interior gerai.',
      },
    ],
  },

  // ==========================================
  // 2. DATA PERLU REVISI (STATUS: REVISI)
  // ==========================================
  {
    id: 'item-4',
    kode: 'SIP-004',
    kodeMaster: 'SIP-004-A-Keramik-40x40',
    item: 'Keramik Toilet',
    ukuran: '40x40 cm',
    merk: 'Mulia',
    warna: 'Dark Grey',
    tipe: 'Rustic Stone Unpolished',
    tebal: '8mm',
    permukaan: 'Unpolished',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Toilet & Janitor',
    toleransi: '±0.3mm',
    informasiTambahan: 'Anti slip R10 untuk area basah',
    deskripsiOtomatis: 'Keramik Toilet 40×40 cm Mulia Dark Grey Tipe Rustic Stone Unpolished Unpolished Toilet & Janitor Anti slip R10 untuk area basah (Lantai Gerai)',
    estimasiHarga: 95000,
    satuan: 'm2',
    status: 'REVISI',
    tanggalPengajuan: '2026-09-23',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-23 11:00',
        catatan: 'Pengajuan keramik lantai toilet gerai.',
      },
      {
        role: 'S&B Specialist',
        action: 'REVISE',
        tanggal: '2026-09-23 15:45',
        catatan: 'Tolong sesuaikan merk dengan katalog rekomendasi (Roman / Milan) dan sertakan sertifikasi anti-slip R10.',
      },
    ],
  },
  {
    id: 'item-5',
    kode: 'SIP-005',
    kodeMaster: 'SIP-005-A-Gypsum-9mm',
    item: 'Plafon Gypsum Water Resistant',
    ukuran: '120x240 cm',
    merk: 'Elephant',
    warna: 'Hijau Primer',
    tipe: 'Moisture Shield 9mm',
    tebal: '9mm',
    permukaan: 'Halus',
    kategori: 'Pekerjaan Finishing',
    implementasi: 'Plafon Gerai',
    lokasi: 'Dapur & Gudang Belakang',
    toleransi: '±0.2mm',
    informasiTambahan: 'Rangka hollow galvanis 40x40',
    deskripsiOtomatis: 'Plafon Gypsum Water Resistant 120×240 cm Elephant Hijau Primer Tipe Moisture Shield 9mm Halus Dapur & Gudang Belakang Rangka hollow galvanis 40x40 (Plafon Gerai)',
    estimasiHarga: 125000,
    satuan: 'Lembar',
    status: 'REVISI',
    tanggalPengajuan: '2026-09-22',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-22 13:20',
        catatan: 'Plafon gypsum tahan lembab untuk area gudang basah.',
      },
      {
        role: 'S&B Specialist',
        action: 'REVISE',
        tanggal: '2026-09-22 16:30',
        catatan: 'Tebal standar Alfaria adalah 12mm untuk area plafon bentang lebar agar tidak lendut. Mohon ubah tebal dan toleransi.',
      },
    ],
  },
  {
    id: 'item-6',
    kode: 'SIP-006',
    kodeMaster: 'SIP-006-A-CatEksterior-20L',
    item: 'Cat Dinding Eksterior',
    ukuran: '20 Liter',
    merk: 'Nippon Paint',
    warna: 'Signal Red',
    tipe: 'Weatherbond Extreme',
    tebal: '2 Lapis',
    permukaan: 'Semi Gloss',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Gerai',
    lokasi: 'Fascia Depan & Lisplang',
    toleransi: 'Standar Pabrik',
    informasiTambahan: 'Warna merah Alfa standar brand guideline',
    deskripsiOtomatis: 'Cat Dinding Eksterior 20 Liter Nippon Paint Signal Red Tipe Weatherbond Extreme Semi Gloss Fascia Depan & Lisplang Warna merah Alfa standar brand guideline (Dinding Gerai)',
    estimasiHarga: 1850000,
    satuan: 'Pail',
    status: 'REVISI',
    tanggalPengajuan: '2026-09-21',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-21 09:10',
        catatan: 'Pengajuan cat eksterior khusus fascia.',
      },
      {
        role: 'S&B Specialist',
        action: 'REVISE',
        tanggal: '2026-09-21 14:00',
        catatan: 'Kode warna merah belum melampirkan color code RAL / Pantone resmi Alfamart. Harap lengkapi di informasi tambahan.',
      },
    ],
  },

  // ==========================================
  // 3. DATA DITOLAK FINAL (STATUS: DITOLAK)
  // ==========================================
  {
    id: 'item-7',
    kode: 'SIP-007',
    kodeMaster: 'SIP-007-A-KacaTempered-12mm',
    item: 'Pintu Kaca Utama',
    ukuran: '100x210 cm',
    merk: 'Asahimas',
    warna: 'Clear',
    tipe: 'Tempered Glass Frameless',
    tebal: '12mm',
    permukaan: 'Polished Edge',
    kategori: 'Pekerjaan Pintu & Jendela',
    implementasi: 'Dinding Gerai',
    lokasi: 'Pintu Masuk Utama',
    toleransi: '±0.5mm',
    informasiTambahan: 'Floor hinge Dorma BTS-84',
    deskripsiOtomatis: 'Pintu Kaca Utama 100×210 cm Asahimas Clear Tipe Tempered Glass Frameless Polished Edge Pintu Masuk Utama Floor hinge Dorma BTS-84 (Dinding Gerai)',
    estimasiHarga: 3200000,
    satuan: 'Unit',
    status: 'DITOLAK',
    tanggalPengajuan: '2026-09-20',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-20 10:00',
        catatan: 'Pengajuan pintu kaca frameless gerai flagship.',
      },
      {
        role: 'S&B Specialist',
        action: 'REJECT',
        tanggal: '2026-09-20 16:15',
        catatan: 'Ditolak permanen. Spek frameless tidak memenuhi standar keamanan benturan gerai retail. Harus menggunakan frame aluminium.',
      },
    ],
  },
  {
    id: 'item-8',
    kode: 'SIP-008',
    kodeMaster: 'SIP-008-A-VinylFlooring-3mm',
    item: 'Vinyl Flooring',
    ukuran: '15x90 cm',
    merk: 'Taco',
    warna: 'Oak Wood',
    tipe: 'Plank Click Series',
    tebal: '3mm',
    permukaan: 'Embossed Wood',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Bean Spot',
    toleransi: '±0.2mm',
    informasiTambahan: 'Lem kuning khusus vinyl',
    deskripsiOtomatis: 'Vinyl Flooring 15×90 cm Taco Oak Wood Tipe Plank Click Series Embossed Wood Area Bean Spot Lem kuning khusus vinyl (Lantai Gerai)',
    estimasiHarga: 160000,
    satuan: 'm2',
    status: 'DITOLAK',
    tanggalPengajuan: '2026-09-19',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-19 14:00',
        catatan: 'Uji coba lantai motif kayu area seating Alfa Express.',
      },
      {
        role: 'S&B Specialist',
        action: 'REJECT',
        tanggal: '2026-09-19 17:00',
        catatan: 'Ditolak. Material vinyl 3mm terbukti rentan tergores kaki kursi meja dan roda troli barang.',
      },
    ],
  },
  {
    id: 'item-9',
    kode: 'SIP-009',
    kodeMaster: 'SIP-009-A-RollingDoor-0.8mm',
    item: 'Rolling Door Manual',
    ukuran: '300x300 cm',
    merk: 'Local Specialist',
    warna: 'Silver Zincalume',
    tipe: 'One Sheet Solid',
    tebal: '0.5mm',
    permukaan: 'Zincalume Coating',
    kategori: 'Pekerjaan Pintu & Jendela',
    implementasi: 'Dinding Gerai',
    lokasi: 'Pintu Masuk Depan',
    toleransi: '±0.05mm',
    informasiTambahan: 'Kunci double lock tengah & bawah',
    deskripsiOtomatis: 'Rolling Door Manual 300×300 cm Local Specialist Silver Zincalume Tipe One Sheet Solid Zincalume Coating Pintu Masuk Depan Kunci double lock tengah & bawah (Dinding Gerai)',
    estimasiHarga: 4500000,
    satuan: 'Unit',
    status: 'DITOLAK',
    tanggalPengajuan: '2026-09-18',
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-18 11:30',
        catatan: 'Pengajuan rolling door alternatif non-perforated.',
      },
      {
        role: 'S&B Specialist',
        action: 'REJECT',
        tanggal: '2026-09-18 15:20',
        catatan: 'Ditolak final. Ketebalan 0.5mm tidak lulus uji ketahanan angin dan pengamanan toko. Minimal 0.8mm sesuai SOP.',
      },
    ],
  },

  // ==========================================
  // 4. DATA DISETUJUI (STATUS: DISETUJUI)
  // ==========================================
  {
    id: 'item-10',
    kode: 'SIP-010',
    kodeMaster: 'SIP-010-A-Keramik-60x60',
    item: 'Keramik Lantai',
    ukuran: '60x60 cm',
    merk: 'Roman',
    warna: 'Ivory',
    tipe: 'dPorto Ivory Polished',
    tebal: '9.5mm',
    permukaan: 'Polish',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Sales Utama',
    toleransi: '±0.2mm',
    informasiTambahan: 'Nat AM 53 epoxy grout',
    deskripsiOtomatis: 'Keramik Lantai 60×60 cm Roman Ivory Tipe dPorto Ivory Polished Polish Area Sales Utama Nat AM 53 epoxy grout (Lantai Gerai)',
    estimasiHarga: 205000,
    satuan: 'm2',
    status: 'DISETUJUI',
    tanggalPengajuan: '2026-09-17',
    koefisienUpah: 0.35,
    koefisienMaterial: 1.05,
    koefisienAlat: 0.05,
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-17 08:30',
        catatan: 'Pengajuan keramik lantai Roman standar gerai nasional.',
      },
      {
        role: 'S&B Specialist',
        action: 'APPROVE',
        tanggal: '2026-09-17 14:00',
        catatan: 'Spesifikasi telah valid dan sesuai standar. Lanjut ke penyusunan koefisien AHSP.',
      },
    ],
  },
  {
    id: 'item-11',
    kode: 'SIP-011',
    kodeMaster: 'SIP-011-A-Aluminium-4inch',
    item: 'Kusen Aluminium',
    ukuran: '4 Inch',
    merk: 'YKK',
    warna: 'Hitam Anodized',
    tipe: 'Shopfront 4" Anodized',
    tebal: '1.3mm',
    permukaan: 'Anodized',
    kategori: 'Pekerjaan Pintu & Jendela',
    implementasi: 'Dinding Gerai',
    lokasi: 'Fascia Depan & Etalase',
    toleransi: '±0.1mm',
    informasiTambahan: 'Sealant neutral Dowsil 791',
    deskripsiOtomatis: 'Kusen Aluminium 4 Inch YKK Hitam Anodized Tipe Shopfront 4" Anodized Anodized Fascia Depan & Etalase Sealant neutral Dowsil 791 (Dinding Gerai)',
    estimasiHarga: 165000,
    satuan: 'm1',
    status: 'DISETUJUI',
    tanggalPengajuan: '2026-09-16',
    koefisienUpah: 0.2,
    koefisienMaterial: 1.08,
    koefisienAlat: 0.02,
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-16 10:15',
        catatan: 'Standar kusen aluminium tampak depan gerai.',
      },
      {
        role: 'S&B Specialist',
        action: 'APPROVE',
        tanggal: '2026-09-16 16:30',
        catatan: 'Disetujui. Ketebalan 1.3mm YKK sesuai spesifikasi ketahanan cuaca.',
      },
    ],
  },
  {
    id: 'item-12',
    kode: 'SIP-012',
    kodeMaster: 'SIP-012-A-LampuLED-18W',
    item: 'Lampu Downlight LED',
    ukuran: '6 Inch',
    merk: 'Philips',
    warna: 'Cool Daylight (6500K)',
    tipe: 'Meson 59464 17W/18W',
    tebal: 'Recessed 45mm',
    permukaan: 'Frosted Diffuser',
    kategori: 'Pekerjaan Elektrikal',
    implementasi: 'Plafon Gerai',
    lokasi: 'Area Sales & Display Rak',
    toleransi: 'Standar Philips',
    informasiTambahan: 'Garansi resmi 2 tahun Philips Lighting',
    deskripsiOtomatis: 'Lampu Downlight LED 6 Inch Philips Cool Daylight (6500K) Tipe Meson 59464 17W/18W Frosted Diffuser Area Sales & Display Rak Garansi resmi 2 tahun Philips Lighting (Plafon Gerai)',
    estimasiHarga: 88000,
    satuan: 'Titik',
    status: 'DISETUJUI',
    tanggalPengajuan: '2026-09-15',
    koefisienUpah: 0.15,
    koefisienMaterial: 1.02,
    koefisienAlat: 0.01,
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-15 09:00',
        catatan: 'Penyelarasan lampu LED hemat daya pencahayaan sales 300 lux.',
      },
      {
        role: 'S&B Specialist',
        action: 'APPROVE',
        tanggal: '2026-09-15 11:45',
        catatan: 'Disetujui penuh. Nilai lumen dan efisiensi daya sesuai target ESG Alfaria.',
      },
    ],
  },
];

// Data Awal Jalur B: Trial Item oleh S&B Controlling Specialist
export const INITIAL_TRIAL_HARGA: TrialHargaItem[] = [
  {
    id: 'tr-1',
    kodeMaster: 'SIP-TR01-A-KeramikTactile-30x30',
    item: 'Keramik Tactile Guiding',
    ukuran: '30x30 cm',
    merk: 'Indogress',
    hargaSatuan: 175000,
    tanggalTrial: '2026-09-24',
    status: 'PENDING_REGIONAL_MGR',
    catatan: 'Pengujian item baru untuk aksesabilitas disabilitas area teras.',
  },
];

// LocalStorage Persistence Helpers
export function getStoredRequests(): RequestPenetapanItem[] {
  if (typeof window === 'undefined') return INITIAL_REQUEST_PENETAPAN;
  const raw = localStorage.getItem(STORAGE_KEYS.REQUEST_PENETAPAN);
  if (!raw) return INITIAL_REQUEST_PENETAPAN;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUEST_PENETAPAN;
  }
}

export function saveStoredRequests(data: RequestPenetapanItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REQUEST_PENETAPAN, JSON.stringify(data));
}

export function getStoredPengajuan(): PengajuanHargaItem[] {
  if (typeof window === 'undefined') return INITIAL_PENGAJUAN_HARGA;
  const raw = localStorage.getItem(STORAGE_KEYS.PENGAJUAN_HARGA);
  if (!raw) return INITIAL_PENGAJUAN_HARGA;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PENGAJUAN_HARGA;
  }
}

export function saveStoredPengajuan(data: PengajuanHargaItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENGAJUAN_HARGA, JSON.stringify(data));
}

export function getStoredTrials(): TrialHargaItem[] {
  if (typeof window === 'undefined') return INITIAL_TRIAL_HARGA;
  const raw = localStorage.getItem(STORAGE_KEYS.TRIAL_HARGA);
  if (!raw) return INITIAL_TRIAL_HARGA;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRIAL_HARGA;
  }
}

export function saveStoredTrials(data: TrialHargaItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRIAL_HARGA, JSON.stringify(data));
}
