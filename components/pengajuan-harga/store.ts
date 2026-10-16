// =============================================================================
// components/pengajuan-harga/store.ts
// Local Storage & Shared State Store untuk Prototipe SPARTA Pengajuan Harga
// =============================================================================

import {
  RequestPenetapanItem,
  PengajuanHargaItem,
  TrialHargaItem,
  MasterTokoItem,
  HargaCabangItem,
  VotingKontraktorItem,
  VotingKontraktorState,
} from './types';

// Daftar 3 Rekanan Kontraktor Default untuk Kuorum Voting (50% + 1)
export const DAFTAR_KONTRAKTOR_REKANAN_DEFAULT: Omit<VotingKontraktorItem, 'statusVote'>[] = [
  {
    kontraktorId: 'kontraktor-1',
    namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
    picName: 'Ir. Budi Santoso',
  },
  {
    kontraktorId: 'kontraktor-2',
    namaPerusahaan: 'PT Sinar Surya Perkasa',
    picName: 'Hendra Wijaya',
  },
  {
    kontraktorId: 'kontraktor-3',
    namaPerusahaan: 'CV Graha Cipta Sarana',
    picName: 'Agus Setiawan',
  },
];

export function makeInitialVotingKontraktor(
  tanggalApprovalRM?: string,
  existingVoting?: VotingKontraktorState
): VotingKontraktorState {
  if (existingVoting && existingVoting.daftarKontraktor?.length > 0) {
    return existingVoting;
  }

  // Batas waktu: 3 x 24 jam (72 jam)
  const baseDate = tanggalApprovalRM ? new Date(tanggalApprovalRM) : new Date();
  const deadline = new Date(baseDate.getTime() + 72 * 60 * 60 * 1000);

  return {
    deadlineVoting: deadline.toISOString(),
    daftarKontraktor: DAFTAR_KONTRAKTOR_REKANAN_DEFAULT.map((k) => ({
      ...k,
      statusVote: 'MENUNGGU',
    })),
  };
}

const STORAGE_KEYS = {
  REQUEST_PENETAPAN: 'sparta_request_penetapan_v1',
  PENGAJUAN_HARGA: 'sparta_pengajuan_harga_v5',
  TRIAL_HARGA: 'sparta_trial_harga_v1',
  MASTER_TOKO: 'sparta_master_toko_v1',
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
    kodeMaster: 'SIP-001-A-Keramik',
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
    kodeMaster: 'SIP-002-A-Granit',
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
    kodeMaster: 'SIP-003-A-CatDinding',
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
    kodeMaster: 'SIP-004-A-Keramik',
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
    kodeMaster: 'SIP-005-A-Gypsum',
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
    kodeMaster: 'SIP-006-A-CatEksterior',
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
    kodeMaster: 'SIP-007-A-KacaTempered',
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
    kodeMaster: 'SIP-008-A-VinylFlooring',
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
    kodeMaster: 'SIP-009-A-RollingDoor',
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
    kodeMaster: 'SIP-010-A-Keramik',
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
    hargaRataRata: 205000,
    satuan: 'm2',
    status: 'RELEASED',
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
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-09-20 10:00',
        catatan: 'Master resmi dirilis untuk pengadaan nasional.',
      },
    ],
  },
  {
    id: 'item-10-b',
    kode: 'SIP-010',
    kodeMaster: 'SIP-010-B-Keramik',
    item: 'Keramik Lantai',
    ukuran: '60x60 cm',
    merk: 'Roman',
    warna: 'Ivory',
    tipe: 'dPorto Ivory Matte Unpolished',
    tebal: '9.5mm',
    permukaan: 'Matte',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Gudang & Transit Toko',
    toleransi: '±0.2mm',
    informasiTambahan: 'Nat semen SIKA Tile Grout warna abu',
    deskripsiOtomatis: 'Keramik Lantai 60×60 cm Roman Ivory Tipe dPorto Ivory Matte Unpolished Matte Area Gudang & Transit Toko (Lantai Gerai)',
    estimasiHarga: 198000,
    hargaRataRata: 198000,
    satuan: 'm2',
    status: 'RELEASED',
    tanggalPengajuan: '2026-09-17',
    koefisienUpah: 0.35,
    koefisienMaterial: 1.05,
    koefisienAlat: 0.05,
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-09-17 08:30',
        catatan: 'Varian keramik lantai Roman permukaan matte untuk gudang transit.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-09-20 10:00',
        catatan: 'Master resmi dirilis.',
      },
    ],
  },
  {
    id: 'item-11',
    kode: 'SIP-011',
    kodeMaster: 'SIP-011-A-Aluminium',
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
    kodeMaster: 'SIP-012-A-LampuLED',
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

  // =========================================================================
  // DATA DUMMY JALUR B (TRIAL 3 BULAN) & PROMOSI PERMANEN
  // =========================================================================

  // Skenario 1: Menunggu Persetujuan Awal B&M Regional Manager (Usulan Trial Baru dari S&B)
  {
    id: 'item-trial-pending-1',
    kode: 'SIP-015',
    kodeMaster: 'SIP-015-A-WPC-Wallpanel',
    item: 'WPC Wallpanel Fluted 4-Groove',
    ukuran: '20x290 cm',
    merk: 'Duma',
    warna: 'Teak Wood',
    tipe: 'Linear Fluted',
    tebal: '12mm',
    permukaan: 'Embossed Woodgrain',
    kategori: 'Pekerjaan Dinding',
    implementasi: 'Dinding Gerai',
    lokasi: 'Area Point of Sale & Kasir',
    toleransi: '±0.5mm',
    informasiTambahan: 'Klip stainless dan lem sealant hybrid',
    deskripsiOtomatis: 'WPC Wallpanel Fluted 4-Groove 20×290 cm Duma Teak Wood Linear Fluted Area Point of Sale & Kasir (Dinding Gerai)',
    estimasiHarga: 145000,
    hargaRataRata: 145000,
    satuan: 'batang',
    status: 'TRIAL_PENDING_REGIONAL_MGR',
    isTrial: true,
    alasanTrial: 'Uji coba aksen panel dinding area kasir modern pengganti cat tekstur dengan ketahanan benturan tinggi dan kemudahan pembersihan.',
    tanggalPengajuan: '2026-09-28',
    koefisienUpahItems: [
      { id: 'u-1', label: 'Mandor', value: '0.0100', unit: 'Oh', hargaAcuan: 245000, subtotal: 2450 },
      { id: 'u-2', label: 'Tukang Kayu / Khusus', value: '0.1200', unit: 'Oh', hargaAcuan: 175000, subtotal: 21000 },
      { id: 'u-3', label: 'Pekerja', value: '0.0800', unit: 'Oh', hargaAcuan: 140000, subtotal: 11200 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'WPC Wallpanel Duma Fluted', value: '1.0000', unit: 'Btg', hargaAcuan: 98000, subtotal: 98000 },
      { id: 'm-2', label: 'Klip Stainless Starter', value: '4.0000', unit: 'Pcs', hargaAcuan: 2500, subtotal: 10000 },
      { id: 'm-3', label: 'Lem Sealant Hybrid Sika', value: '0.0500', unit: 'Tube', hargaAcuan: 47000, subtotal: 2350 },
    ],
    historyLog: [
      {
        role: 'S&B Specialist',
        action: 'SUBMIT',
        tanggal: '2026-09-28 08:30',
        catatan: 'Pengajuan Item Trial baru beserta koefisien AHSP diajukan ke B&M Regional Manager.',
      },
    ],
  },

  // Skenario 2: Perlu Revisi oleh S&B Specialist (Dikembalikan oleh Regional Manager)
  {
    id: 'item-trial-revisi-1',
    kode: 'SIP-016',
    kodeMaster: 'SIP-016-A-Cat-Silver-Ion',
    item: 'Cat Dinding Antibakteri Silver Ion',
    ukuran: '20 Liter',
    merk: 'Mowilex',
    warna: 'White Lily',
    tipe: 'Silver Ion Shield',
    tebal: '2 Lapis',
    permukaan: 'Satin Eggshell',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Gerai',
    lokasi: 'Area Fresh Food & Chiller',
    toleransi: 'Daya sebar 12m2/L',
    informasiTambahan: 'Kadar VOC rendah ramah lingkungan',
    deskripsiOtomatis: 'Cat Dinding Antibakteri Silver Ion 20 Liter Mowilex White Lily Silver Ion Shield Area Fresh Food & Chiller (Dinding Gerai)',
    estimasiHarga: 1850000,
    hargaRataRata: 1850000,
    satuan: 'pail',
    status: 'TRIAL_REVISI',
    isTrial: true,
    alasanTrial: 'Pengujian daya tahan cat antibakteri untuk menekan bau dan pertumbuhan jamur di area lembab chiller gerai.',
    tanggalPengajuan: '2026-09-26',
    koefisienUpahItems: [
      { id: 'u-1', label: 'Mandor', value: '0.0250', unit: 'Oh', hargaAcuan: 245000, subtotal: 6125 },
      { id: 'u-2', label: 'Tukang Cat', value: '0.2500', unit: 'Oh', hargaAcuan: 175000, subtotal: 43750 },
      { id: 'u-3', label: 'Pekerja', value: '0.1000', unit: 'Oh', hargaAcuan: 140000, subtotal: 14000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Cat Mowilex Silver Ion 20L', value: '1.0000', unit: 'Pail', hargaAcuan: 1750000, subtotal: 1750000 },
      { id: 'm-2', label: 'Plamir Alkali Killer', value: '5.0000', unit: 'Kg', hargaAcuan: 7225, subtotal: 36125 },
    ],
    historyLog: [
      {
        role: 'S&B Specialist',
        action: 'SUBMIT',
        tanggal: '2026-09-26 10:00',
        catatan: 'Pengajuan uji coba cat antibakteri area chiller.',
      },
      {
        role: 'Regional Manager',
        action: 'REJECT',
        tanggal: '2026-09-27 14:15',
        catatan: 'Mohon sesuaikan koefisien pelapisan upah tukang dan lengkapi data perbandingan ketahanan jamur dengan cat standar sebelum dirilis uji coba.',
      },
    ],
  },

  // Skenario 3: Trial Aktif Mendekati Batas 3 Bulan - Perlu Tindakan Evaluasi oleh S&B Specialist (Sisa ~6 Hari)
  {
    id: 'item-trial-urgent-1',
    kode: 'SIP-017',
    kodeMaster: 'SIP-017-A-Plafon-PVC-Waterproof',
    item: 'Plafon PVC Acoustic Water-Resistant',
    ukuran: '20x400 cm',
    merk: 'Shunda Plafon',
    warna: 'White Matte',
    tipe: 'Hollow Anti-Sagging',
    tebal: '8mm',
    permukaan: 'Matte Flat',
    kategori: 'Pekerjaan Plafon',
    implementasi: 'Plafon Gerai',
    lokasi: 'Area Kanopi Teras Luar',
    toleransi: '±0.3mm',
    informasiTambahan: 'Rangka hollow galvalum 0.35mm',
    deskripsiOtomatis: 'Plafon PVC Acoustic 20×400 cm Shunda White Matte Hollow Anti-Sagging Area Kanopi Teras Luar (Plafon Gerai)',
    estimasiHarga: 98000,
    hargaRataRata: 98000,
    satuan: 'm2',
    status: 'TRIAL_RELEASED',
    isTrial: true,
    trialStartDate: '2026-07-04',
    trialDurationDays: 90,
    alasanTrial: 'Solusi plafon luar ruang tahan tampias air hujan tanpa risiko lapuk dan noda jamur seperti kalsiboard konvensional.',
    tanggalPengajuan: '2026-07-01',
    koefisienUpahItems: [
      { id: 'u-1', label: 'Mandor', value: '0.0120', unit: 'Oh', hargaAcuan: 245000, subtotal: 2940 },
      { id: 'u-2', label: 'Tukang Plafon', value: '0.1500', unit: 'Oh', hargaAcuan: 175000, subtotal: 26250 },
      { id: 'u-3', label: 'Pekerja', value: '0.1000', unit: 'Oh', hargaAcuan: 140000, subtotal: 14000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Panel Shunda Plafon PVC', value: '1.0500', unit: 'M2', hargaAcuan: 52000, subtotal: 54600 },
      { id: 'm-2', label: 'Sekrup Wafer Head 1 Inch', value: '0.0500', unit: 'Dus', hargaAcuan: 4200, subtotal: 210 },
    ],
    historyLog: [
      {
        role: 'S&B Specialist',
        action: 'SUBMIT',
        tanggal: '2026-07-01 11:00',
        catatan: 'Pengajuan uji coba plafon PVC kanopi teras toko.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-07-04 09:20',
        catatan: 'Disetujui rilis trial 3 bulan (90 hari). Pantau lendutan rangka dan ketahanan panas matahari.',
      },
    ],
  },

  // Skenario 4: Permohonan Promosi Master Resmi Permanen Menunggu Pengesahan Regional Manager
  {
    id: 'item-trial-promosi-1',
    kode: 'SIP-018',
    kodeMaster: 'SIP-018-A-Lampu-LED-Batten',
    item: 'Lampu LED Batten T8 Energy Saver',
    ukuran: '120 cm',
    merk: 'Philips',
    warna: 'Cool Daylight (6500K)',
    tipe: 'SmartBright Essential',
    tebal: 'Slim Batten',
    permukaan: 'Polycarbonate Diffuser',
    kategori: 'Pekerjaan Elektrikal',
    implementasi: 'Plafon Gerai',
    lokasi: 'Area Sales Utama',
    toleransi: 'Lumen 1800 lm',
    informasiTambahan: 'Garansi resmi 2 tahun Philips Lighting',
    deskripsiOtomatis: 'Lampu LED Batten T8 120 cm Philips Cool Daylight SmartBright Essential Area Sales Utama (Plafon Gerai)',
    estimasiHarga: 72500,
    hargaRataRata: 72500,
    satuan: 'unit',
    status: 'TRIAL_PROMOSI_REGIONAL_MGR',
    isTrial: true,
    trialStartDate: '2026-06-28',
    trialDurationDays: 90,
    trialEvaluationAction: 'PERMANEN',
    trialCatatanEvaluasi: 'Hasil evaluasi pilot 3 bulan di 5 toko: efisiensi konsumsi daya listrik turun 24%, pencahayaan konsisten 320 lux tanpa degradasi, dan tingkat kerusakan lampu 0%. Sangat layak disahkan menjadi Master Resmi Permanen Nasional.',
    tanggalPengajuan: '2026-06-25',
    koefisienUpahItems: [
      { id: 'u-1', label: 'Mandor', value: '0.0050', unit: 'Oh', hargaAcuan: 245000, subtotal: 1225 },
      { id: 'u-2', label: 'Tukang Listrik', value: '0.0800', unit: 'Oh', hargaAcuan: 175000, subtotal: 14000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Lampu Philips Batten T8 18W', value: '1.0000', unit: 'Unit', hargaAcuan: 55000, subtotal: 55000 },
      { id: 'm-2', label: 'Klem & Fischer S6', value: '2.0000', unit: 'Set', hargaAcuan: 1137.5, subtotal: 2275 },
    ],
    historyLog: [
      {
        role: 'S&B Specialist',
        action: 'SUBMIT',
        tanggal: '2026-06-25 09:00',
        catatan: 'Pengajuan trial efisiensi energi lampu LED.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-06-28 15:40',
        catatan: 'Disetujui trial 90 hari di 5 toko percontohan.',
      },
      {
        role: 'S&B Specialist',
        action: 'EVALUATE',
        tanggal: '2026-09-28 09:15',
        catatan: 'Evaluasi Lapangan (3 Bulan): Rekomendasi promosi menjadi Master Resmi Permanen diajukan ke B&M Regional Manager. Efisiensi daya 24% dan kerusakan 0%.',
      },
    ],
  },

  // Skenario 5: Master Resmi Permanen yang Berhasil Disahkan dari Hasil Promosi Trial
  {
    id: 'item-master-promosi-1',
    kode: 'SIP-019',
    kodeMaster: 'SIP-019-A-Vinyl-HeavyDuty',
    item: 'Vinyl Flooring Plank Heavy Duty 3mm',
    ukuran: '15x90 cm',
    merk: 'Tarkett',
    warna: 'Natural Oak',
    tipe: 'Commercial Wear Layer 0.5mm',
    tebal: '3mm',
    permukaan: 'Deep Embossed Anti-Slip',
    kategori: 'Pekerjaan Lantai',
    implementasi: 'Lantai Gerai',
    lokasi: 'Area Bean Spot & Bakery',
    toleransi: '±0.1mm',
    informasiTambahan: 'Lem akrilik khusus vinyl komersial',
    deskripsiOtomatis: 'Vinyl Flooring Plank Heavy Duty 3mm 15×90 cm Tarkett Natural Oak Commercial Wear Layer Area Bean Spot & Bakery (Lantai Gerai)',
    estimasiHarga: 168000,
    hargaRataRata: 168000,
    satuan: 'm2',
    status: 'APPROVED_ACTIVE',
    isTrial: false,
    alasanTrial: 'Uji coba lantai estetik hangat area kafe Bean Spot dengan ketahanan tumpahan air/kopi.',
    trialCatatanEvaluasi: 'Lolos uji coba 3 bulan. Tahan gesekan troli dan tumpahan cairan tanpa noda atau mengelupas.',
    tanggalPengajuan: '2026-05-10',
    koefisienUpahItems: [
      { id: 'u-1', label: 'Mandor', value: '0.0150', unit: 'Oh', hargaAcuan: 245000, subtotal: 3675 },
      { id: 'u-2', label: 'Tukang Vinyl', value: '0.1800', unit: 'Oh', hargaAcuan: 175000, subtotal: 31500 },
      { id: 'u-3', label: 'Pekerja', value: '0.1000', unit: 'Oh', hargaAcuan: 140000, subtotal: 14000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Vinyl Tarkett Plank 3mm', value: '1.0500', unit: 'M2', hargaAcuan: 105000, subtotal: 110250 },
      { id: 'm-2', label: 'Lem Akrilik Komersial', value: '0.2500', unit: 'Kg', hargaAcuan: 34300, subtotal: 8575 },
    ],
    historyLog: [
      {
        role: 'S&B Specialist',
        action: 'SUBMIT',
        tanggal: '2026-05-10 11:30',
        catatan: 'Pengajuan uji coba material vinyl Bean Spot.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-05-12 14:00',
        catatan: 'Disetujui rilis trial 90 hari.',
      },
      {
        role: 'S&B Specialist',
        action: 'EVALUATE',
        tanggal: '2026-08-15 10:00',
        catatan: 'Hasil uji coba 3 bulan sangat memuaskan. Diajukan promosi permanen.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-08-18 16:30',
        catatan: 'Disahkan menjadi Master Resmi Permanen setelah menyelesaikan masa uji coba 3 bulan.',
      },
    ],
  },
  // =========================================================================
  // DATA DUMMY EVALUASI TRIAL (DURASI SUDAH HABIS)
  // =========================================================================
  {
    id: 'item-trial-expired-1',
    kode: 'SIP-021',
    kodeMaster: 'SIP-021-A-CatAntiNoda',
    item: 'Cat Dinding Interior Anti Noda',
    ukuran: '2.5 Liter',
    merk: 'Dulux',
    warna: 'Putih',
    tipe: 'EasyClean',
    tebal: '',
    permukaan: 'Matte',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Dalam',
    lokasi: 'Area Back Office',
    toleransi: '',
    informasiTambahan: 'Cat mudah dibersihkan',
    deskripsiOtomatis: 'Cat Dinding Interior Anti Noda 2.5 Liter Dulux Putih EasyClean Area Back Office (Dinding Dalam)',
    estimasiHarga: 195000,
    hargaRataRata: 195000,
    satuan: 'kaleng',
    status: 'TRIAL_RELEASED',
    isTrial: true,
    alasanTrial: 'Menguji efisiensi pembersihan noda pada tembok',
    tanggalPengajuan: '2026-01-10',
    trialStartDate: '2026-01-15',
    trialDurationDays: 90,
    marginUpah: 8,
    marginMaterial: 8,
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Cat', value: '0.1', unit: 'Oh', hargaAcuan: 150000, subtotal: 15000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Cat Dulux EasyClean', value: '1', unit: 'Klg', hargaAcuan: 180000, subtotal: 180000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-01-15 10:00',
        catatan: 'Disetujui untuk trial.',
      }
    ],
  },
  {
    id: 'item-trial-expired-2',
    kode: 'SIP-022',
    kodeMaster: 'SIP-022-A-LampuSorot',
    item: 'Lampu Sorot LED Outdoor',
    ukuran: '50 Watt',
    merk: 'Philips',
    warna: 'Warm White',
    tipe: 'BVP150',
    tebal: '',
    permukaan: '',
    kategori: 'Pekerjaan Elektrikal',
    implementasi: 'Fasad Depan',
    lokasi: 'Area Fasad',
    toleransi: '',
    informasiTambahan: 'IP65 Waterproof',
    deskripsiOtomatis: 'Lampu Sorot LED Outdoor 50 Watt Philips Warm White BVP150 Area Fasad (Fasad Depan)',
    estimasiHarga: 225000,
    hargaRataRata: 225000,
    satuan: 'titik',
    status: 'TRIAL_RELEASED',
    isTrial: true,
    alasanTrial: 'Mencari alternatif lampu sorot yang lebih hemat energi dan tahan lama',
    tanggalPengajuan: '2026-02-05',
    trialStartDate: '2026-02-10',
    trialDurationDays: 60,
    marginUpah: 8,
    marginMaterial: 8,
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Listrik', value: '0.2', unit: 'Oh', hargaAcuan: 160000, subtotal: 32000 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Lampu Philips 50W', value: '1', unit: 'Pcs', hargaAcuan: 193000, subtotal: 193000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-02-10 11:00',
        catatan: 'Trial 60 hari disetujui.',
      }
    ],
  },
  {
    id: 'item-trial-expired-3',
    kode: 'SIP-023',
    kodeMaster: 'SIP-023-A-KranAir',
    item: 'Kran Air Sensor Otomatis',
    ukuran: '1/2 inch',
    merk: 'Toto',
    warna: 'Chrome',
    tipe: 'TT01',
    tebal: '',
    permukaan: 'Glossy',
    kategori: 'Pekerjaan Plumbing',
    implementasi: 'Toilet',
    lokasi: 'Area Toilet Gerai',
    toleransi: '',
    informasiTambahan: 'Baterai tahan lama',
    deskripsiOtomatis: 'Kran Air Sensor Otomatis 1/2 inch Toto Chrome TT01 Area Toilet Gerai (Toilet)',
    estimasiHarga: 850000,
    hargaRataRata: 850000,
    satuan: 'unit',
    status: 'TRIAL_RELEASED',
    isTrial: true,
    alasanTrial: 'Menguji penghematan air pada gerai padat pengunjung',
    tanggalPengajuan: '2025-11-20',
    trialStartDate: '2025-11-25',
    trialDurationDays: 120,
    marginUpah: 8,
    marginMaterial: 8,
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Pipa', value: '0.15', unit: 'Oh', hargaAcuan: 155000, subtotal: 23250 },
    ],
    koefisienMaterialItems: [
      { id: 'm-1', label: 'Kran Sensor Toto', value: '1', unit: 'Pcs', hargaAcuan: 826750, subtotal: 826750 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2025-11-25 09:00',
        catatan: 'Disetujui untuk diuji di beberapa gerai sibuk selama 4 bulan.',
      }
    ],
  },
  // =========================================================================
  // DATA DUMMY USULAN HARGA (MENUNGGU KONFIRMASI KONTRAKTOR)
  // =========================================================================
  {
    id: 'item-kontraktor-1',
    kode: 'SIP-024',
    kodeMaster: 'SIP-024-A-PintuKaca',
    item: 'Pintu Kaca Tempered Frameless',
    ukuran: '90x210 cm',
    merk: 'Asahimas',
    warna: 'Clear',
    tipe: '12mm',
    tebal: '12mm',
    permukaan: 'Polished Edge',
    kategori: 'Pekerjaan Kaca',
    implementasi: 'Pintu Utama Gerai',
    lokasi: 'Area Fasad',
    toleransi: '',
    informasiTambahan: 'Lengkap dengan floor hinge dan patch fitting',
    deskripsiOtomatis: 'Pintu Kaca Tempered Frameless 90x210 cm Asahimas Clear 12mm 12mm Polished Edge Area Fasad (Pintu Utama Gerai)',
    estimasiHarga: 4500000,
    hargaRataRata: 4500000,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-01',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Aneka Kaca BSD',
        alamatToko: 'Jl. Raya Serpong No. 12, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 4450000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Harga set komplit daun pintu & fitting',
      },
      {
        namaToko: 'Sentral Kaca Tangerang',
        alamatToko: 'Jl. Daan Mogot Km 21, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 4500000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Ready stock unit tempered 12mm',
      },
      {
        namaToko: 'Mitra Kaca Serpong',
        alamatToko: 'Kav. Komersial BSD City',
        volumeAcuan: 1,
        hargaSatuan: 4550000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Garansi resmi aksesoris floor hinge',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Kaca', value: '1.5', unit: 'Oh', hargaAcuan: 160000, subtotal: 240000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Daun Pintu Kaca 12mm',
        value: '1',
        unit: 'Lembar',
        hargaAcuan: 3000000,
        hargaSurveiRataRata: 3000000,
        subtotal: 3000000,
        surveyToko: [
          { namaToko: 'Aneka Kaca BSD', hargaSatuan: 2950000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
          { namaToko: 'Sentral Kaca Tangerang', hargaSatuan: 3000000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
          { namaToko: 'Mitra Kaca Serpong', hargaSatuan: 3050000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
        ],
      },
      { id: 'm-2', label: 'Floor Hinge Dorma', value: '1', unit: 'Set', hargaAcuan: 1200000, subtotal: 1200000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-02 10:00',
        catatan: 'Disetujui. Menunggu konfirmasi kesanggupan harga dari Kontraktor.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T10:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-2',
    kode: 'SIP-025',
    kodeMaster: 'SIP-025-A-HandlePintu',
    item: 'Pull Handle Pintu Kaca',
    ukuran: 'Panjang 60cm',
    merk: 'Dekkson',
    warna: 'Stainless Murni',
    tipe: 'PH-102',
    tebal: '',
    permukaan: 'Hairline',
    kategori: 'Pekerjaan Kunci & Penggantung',
    implementasi: 'Pintu Utama Gerai',
    lokasi: 'Area Fasad',
    toleransi: '',
    informasiTambahan: '',
    deskripsiOtomatis: 'Pull Handle Pintu Kaca Panjang 60cm Dekkson Stainless Murni PH-102 Area Fasad (Pintu Utama Gerai)',
    estimasiHarga: 450000,
    hargaRataRata: 450000,
    satuan: 'pasang',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-01',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Mitra 10 Gading Serpong',
        alamatToko: 'Jl. Boulevard Gading Serpong',
        volumeAcuan: 1,
        hargaSatuan: 440000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Stainless steel SUS 304 original',
      },
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 450000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Ready stock batch baru',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S',
        volumeAcuan: 1,
        hargaSatuan: 460000,
        tanggalSurvei: '2026-10-01',
        catatan: 'Termasuk baut dan aksesoris pasang',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang', value: '0.2', unit: 'Oh', hargaAcuan: 150000, subtotal: 30000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Handle Dekkson PH-102',
        value: '1',
        unit: 'Psg',
        hargaAcuan: 400000,
        hargaSurveiRataRata: 400000,
        subtotal: 400000,
        surveyToko: [
          { namaToko: 'Mitra 10 Gading Serpong', hargaSatuan: 390000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 400000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 410000, volumeAcuan: 1, tanggalSurvei: '2026-10-01' },
        ],
      },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-02 10:05',
        catatan: 'Disetujui untuk di-publish ke Kontraktor.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T10:05:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-3',
    kode: 'SIP-026',
    kodeMaster: 'SIP-026-A-Wastafel',
    item: 'Wastafel Gantung Komplit',
    ukuran: '40x30 cm',
    merk: 'American Standard',
    warna: 'Putih',
    tipe: 'Studio Wall Hung',
    tebal: '',
    permukaan: 'Keramik',
    kategori: 'Pekerjaan Plumbing',
    implementasi: 'Wastafel Area Cuci Tangan',
    lokasi: 'Area Toilet',
    toleransi: '',
    informasiTambahan: 'Termasuk sifon dan kran dingin',
    deskripsiOtomatis: 'Wastafel Gantung Komplit 40x30 cm American Standard Putih Studio Wall Hung Area Toilet (Wastafel Area Cuci Tangan)',
    estimasiHarga: 500000,
    hargaRataRata: 500000,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-03',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 490000,
        tanggalSurvei: '2026-10-03',
        catatan: 'Lengkap sifon dan kran original',
      },
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 500000,
        tanggalSurvei: '2026-10-03',
        catatan: 'Stok tersedia banyak',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S',
        volumeAcuan: 1,
        hargaSatuan: 510000,
        tanggalSurvei: '2026-10-03',
        catatan: 'Harga promo bundling aksesoris',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Pipa', value: '0.5', unit: 'Oh', hargaAcuan: 155000, subtotal: 77500 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Wastafel AmStad',
        value: '1',
        unit: 'Set',
        hargaAcuan: 500000,
        hargaSurveiRataRata: 500000,
        subtotal: 500000,
        surveyToko: [
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 490000, volumeAcuan: 1, tanggalSurvei: '2026-10-03' },
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 500000, volumeAcuan: 1, tanggalSurvei: '2026-10-03' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 510000, volumeAcuan: 1, tanggalSurvei: '2026-10-03' },
        ],
      },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-04 14:00',
        catatan: 'Ok.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T14:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-4',
    kode: 'SIP-027',
    kodeMaster: 'SIP-027-A-KabelNYM',
    item: 'Kabel Listrik NYM 3x2.5mm',
    ukuran: 'Roll 50m',
    merk: 'Supreme',
    warna: 'Putih',
    tipe: 'NYM',
    tebal: '2.5mm',
    permukaan: 'PVC',
    kategori: 'Pekerjaan Elektrikal',
    implementasi: 'Instalasi Stop Kontak',
    lokasi: 'Seluruh Area',
    toleransi: '',
    informasiTambahan: 'SNI LMK',
    deskripsiOtomatis: 'Kabel Listrik NYM 3x2.5mm Roll 50m Supreme Putih NYM 2.5mm PVC Seluruh Area (Instalasi Stop Kontak)',
    estimasiHarga: 850000,
    hargaRataRata: 850000,
    satuan: 'roll',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-05',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Plaza Kenari Mas Serpong',
        alamatToko: 'Jl. Raya Serpong Km 7',
        volumeAcuan: 1,
        hargaSatuan: 840000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Kabel tembaga murni SNI LMK',
      },
      {
        namaToko: 'Mitra 10 Tangerang',
        alamatToko: 'Jl. MH Thamrin No. 8',
        volumeAcuan: 1,
        hargaSatuan: 850000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Segel pabrik resmi 50m utuh',
      },
      {
        namaToko: 'Toko Terang Abadi BSD',
        alamatToko: 'Ruko Golden Madrid Serpong',
        volumeAcuan: 1,
        hargaSatuan: 860000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Ready stock 20 roll',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Listrik', value: '0.8', unit: 'Oh', hargaAcuan: 160000, subtotal: 128000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Kabel Supreme 3x2.5',
        value: '1',
        unit: 'Roll',
        hargaAcuan: 850000,
        hargaSurveiRataRata: 850000,
        subtotal: 850000,
        surveyToko: [
          { namaToko: 'Plaza Kenari Mas Serpong', hargaSatuan: 840000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
          { namaToko: 'Mitra 10 Tangerang', hargaSatuan: 850000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
          { namaToko: 'Toko Terang Abadi BSD', hargaSatuan: 860000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
        ],
      },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-06 09:15',
        catatan: 'Diteruskan ke Kontraktor.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T09:15:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-5',
    kode: 'SIP-029',
    kodeMaster: 'SIP-029-A-KlosetDuduk',
    item: 'Kloset Duduk Eco-Washer',
    ukuran: 'Rough-in 500mm',
    merk: 'TOTO',
    warna: 'Putih',
    tipe: 'CW421J / TC505SW',
    tebal: '',
    permukaan: 'Vitreous China Glazed',
    kategori: 'Pekerjaan Plumbing & Sanitasi',
    implementasi: 'Sanitasi Toilet Gerai',
    lokasi: 'Area Toilet Pelanggan & Karyawan',
    toleransi: '±5mm',
    informasiTambahan: 'Dilengkapi Eco-Washer dan dual flush hemat air',
    deskripsiOtomatis: 'Kloset Duduk Eco-Washer Rough-in 500mm TOTO Putih CW421J / TC505SW Area Toilet Pelanggan & Karyawan (Sanitasi Toilet Gerai)',
    estimasiHarga: 2806500,
    hargaRataRata: 2806500,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-07',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 2400000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Paket komplit unit kloset dan tutup soft-close',
      },
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 2450000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Original TOTO garansi resmi mekanikal 5 tahun',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S, BSD',
        volumeAcuan: 1,
        hargaSatuan: 2500000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Ready stock 15 unit di toko',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Pipa', value: '0.8', unit: 'Oh', hargaAcuan: 155000, subtotal: 124000 },
      { id: 'u-2', label: 'Pekerja', value: '0.5', unit: 'Oh', hargaAcuan: 125000, subtotal: 62500 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Kloset Duduk TOTO CW421J',
        value: '1',
        unit: 'Unit',
        hargaAcuan: 2450000,
        hargaSurveiRataRata: 2450000,
        subtotal: 2450000,
        surveyToko: [
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 2400000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 2450000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 2500000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
        ],
      },
      { id: 'm-2', label: 'Stop Kran & Fleksibel TOTO', value: '1', unit: 'Set', hargaAcuan: 125000, subtotal: 125000 },
      { id: 'm-3', label: 'Seal Gasket Anti-Bocor', value: '1', unit: 'Pcs', hargaAcuan: 45000, subtotal: 45000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-07 14:00',
        catatan: 'Disetujui. Silakan diajukan ke kontraktor rekanan cabang Cikokol.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T14:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-6',
    kode: 'SIP-030',
    kodeMaster: 'SIP-030-A-LampuBatten36W',
    item: 'Lampu LED Batten Seamless 36W',
    ukuran: '120 cm',
    merk: 'Philips',
    warna: 'Cool Daylight 6500K',
    tipe: 'BN126C CoreLine',
    tebal: 'Slim Batten',
    permukaan: 'Opal Polycarbonate',
    kategori: 'Pekerjaan Elektrikal',
    implementasi: 'Penerangan Sales Area',
    lokasi: 'Area Sales Utama',
    toleransi: 'Luminous Flux 3600 lm',
    informasiTambahan: 'Konektor trunking continuous row tanpa bayangan antar lampu',
    deskripsiOtomatis: 'Lampu LED Batten Seamless 36W 120 cm Philips Cool Daylight BN126C Area Sales Utama (Penerangan Sales Area)',
    estimasiHarga: 189000,
    hargaRataRata: 189000,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-07',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Plaza Kenari Mas Serpong',
        alamatToko: 'Jl. Raya Serpong Km 7',
        volumeAcuan: 1,
        hargaSatuan: 160000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Lampu LED komplit housing seamless trunking',
      },
      {
        namaToko: 'Mitra 10 Tangerang',
        alamatToko: 'Jl. MH Thamrin No. 8, Cikokol',
        volumeAcuan: 1,
        hargaSatuan: 165000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Original Philips Lighting garansi resmi 2 tahun',
      },
      {
        namaToko: 'Toko Terang Abadi BSD',
        alamatToko: 'Ruko Golden Madrid Serpong',
        volumeAcuan: 1,
        hargaSatuan: 170000,
        tanggalSurvei: '2026-10-07',
        catatan: 'Ready stock 50 unit',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Listrik', value: '0.15', unit: 'Oh', hargaAcuan: 160000, subtotal: 240000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Lampu Philips BN126C 36W',
        value: '1',
        unit: 'Unit',
        hargaAcuan: 165000,
        hargaSurveiRataRata: 165000,
        subtotal: 165000,
        surveyToko: [
          { namaToko: 'Plaza Kenari Mas Serpong', hargaSatuan: 160000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
          { namaToko: 'Mitra 10 Tangerang', hargaSatuan: 165000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
          { namaToko: 'Toko Terang Abadi BSD', hargaSatuan: 170000, volumeAcuan: 1, tanggalSurvei: '2026-10-07' },
        ],
      },
      { id: 'm-2', label: 'Klem Gantungan & Sekrup Fischer', value: '1', unit: 'Set', hargaAcuan: 12000, subtotal: 12000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-07 15:30',
        catatan: 'Disetujui. Spesifikasi pencahayaan memenuhi standar 300 lux gerai.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T15:30:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-7',
    kode: 'SIP-031',
    kodeMaster: 'SIP-031-A-GypsumWR',
    item: 'Plafon Gypsum Water Resistant 9mm',
    ukuran: '120x240 cm',
    merk: 'Jayaboard',
    warna: 'Hijau (Water Resistant)',
    tipe: 'Wetstop 9mm',
    tebal: '9mm',
    permukaan: 'Smooth Paper Faced',
    kategori: 'Pekerjaan Plafon & Partisi',
    implementasi: 'Plafon Tahan Lembap',
    lokasi: 'Area Toilet & Gudang Belakang',
    toleransi: '±0.2mm',
    informasiTambahan: 'Rangka hollow galvalum 40x40 & 20x40 tebal 0.35mm',
    deskripsiOtomatis: 'Plafon Gypsum Water Resistant 9mm 120x240 cm Jayaboard Hijau Wetstop 9mm Area Toilet & Gudang Belakang (Plafon Tahan Lembap)',
    estimasiHarga: 95000,
    hargaRataRata: 95000,
    satuan: 'm2',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-08',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 92000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Papan gypsum Jayaboard Wetstop tahan lembap',
      },
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 95000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Harga satuan lembar standar proyek retail',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 98000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Stok ready di gudang BSD',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Plafon', value: '0.20', unit: 'Oh', hargaAcuan: 175000, subtotal: 35000 },
      { id: 'u-2', label: 'Pekerja', value: '0.10', unit: 'Oh', hargaAcuan: 125000, subtotal: 12500 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Gypsum Jayaboard Wetstop 9mm',
        value: '0.364',
        unit: 'Lbr',
        hargaAcuan: 95000,
        hargaSurveiRataRata: 95000,
        subtotal: 34580,
        surveyToko: [
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 92000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 95000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 98000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
        ],
      },
      { id: 'm-2', label: 'Rangka Hollow Galvalum 0.35', value: '3.5', unit: 'M', hargaAcuan: 8500, subtotal: 29750 },
      { id: 'm-3', label: 'Cornice Compound & Paper Tape', value: '0.3', unit: 'Kg', hargaAcuan: 5000, subtotal: 1500 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-08 09:00',
        catatan: 'Disetujui untuk penggantian plafon area lembap.',
      },
      {
        role: 'Kontraktor',
        action: 'APPROVE',
        tanggal: '2026-10-08 11:20',
        catatan: 'PT Sinar Surya Perkasa: Harga material gypsum Jayaboard dan rangka hollow sesuai acuan proyek Alfamart.',
      },
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T09:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'SETUJU',
          tanggalRespon: '2026-10-08 11:20',
          catatan: 'Harga material gypsum Jayaboard dan rangka hollow sesuai acuan proyek Alfamart.',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-8',
    kode: 'SIP-032',
    kodeMaster: 'SIP-032-A-ExhaustFan',
    item: 'Exhaust Fan Dinding 12 Inch',
    ukuran: '30 cm (12 Inch)',
    merk: 'Panasonic',
    warna: 'Putih Gading',
    tipe: 'FV-30RUN5',
    tebal: '',
    permukaan: 'ABS Plastic High Impact',
    kategori: 'Pekerjaan Mekanikal & Ventilasi',
    implementasi: 'Sirkulasi Udara Ruang Belakang',
    lokasi: 'Area Gudang & Back Office',
    toleransi: 'Air Volume 1150 CMH',
    informasiTambahan: 'Dilengkapi automatic shutter penutup belakang anti tikus/hujan',
    deskripsiOtomatis: 'Exhaust Fan Dinding 12 Inch 30 cm Panasonic Putih FV-30RUN5 Area Gudang & Back Office (Sirkulasi Udara Ruang Belakang)',
    estimasiHarga: 550000,
    hargaRataRata: 550000,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-08',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Plaza Kenari Mas Serpong',
        alamatToko: 'Jl. Raya Serpong Km 7',
        volumeAcuan: 1,
        hargaSatuan: 475000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Original Panasonic motor heavy duty',
      },
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 485000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Garansi resmi pabrik Panasonic 3 tahun motor',
      },
      {
        namaToko: 'Toko Terang Abadi BSD',
        alamatToko: 'Ruko Golden Madrid Serpong',
        volumeAcuan: 1,
        hargaSatuan: 495000,
        tanggalSurvei: '2026-10-08',
        catatan: 'Stok ready 8 unit',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Listrik', value: '0.30', unit: 'Oh', hargaAcuan: 160000, subtotal: 48000 },
      { id: 'u-2', label: 'Pekerja', value: '0.15', unit: 'Oh', hargaAcuan: 125000, subtotal: 18750 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Exhaust Fan Panasonic FV-30RUN5',
        value: '1',
        unit: 'Unit',
        hargaAcuan: 485000,
        hargaSurveiRataRata: 485000,
        subtotal: 485000,
        surveyToko: [
          { namaToko: 'Plaza Kenari Mas Serpong', hargaSatuan: 475000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 485000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
          { namaToko: 'Toko Terang Abadi BSD', hargaSatuan: 495000, volumeAcuan: 1, tanggalSurvei: '2026-10-08' },
        ],
      },
      { id: 'm-2', label: 'Stop Kontak Outbow Panasonic', value: '1', unit: 'Set', hargaAcuan: 38000, subtotal: 38000 },
      { id: 'm-3', label: 'Kabel NYM 2x1.5mm & Steker', value: '3', unit: 'M', hargaAcuan: 9000, subtotal: 27000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-08 13:45',
        catatan: 'Disetujui. Standar ventilasi gudang dan ruang panel.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T13:45:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-9',
    kode: 'SIP-033',
    kodeMaster: 'SIP-033-A-KeramikHeavyDuty',
    item: 'Keramik Lantai Anti-Slip 40x40 cm',
    ukuran: '40x40 cm',
    merk: 'Roman',
    warna: 'Dark Grey',
    tipe: 'dCastello G440803',
    tebal: '9.5mm',
    permukaan: 'Struktur Kasar Matt Anti-Slip',
    kategori: 'Pekerjaan Keramik',
    implementasi: 'Lantai Luar & Teras',
    lokasi: 'Area Teras Depan & Selasar Toko',
    toleransi: '±0.2mm',
    informasiTambahan: 'Standar ketahanan beban traffic tinggi & tidak licin saat hujan',
    deskripsiOtomatis: 'Keramik Lantai Anti-Slip 40x40 cm Roman Dark Grey dCastello G440803 Area Teras Depan & Selasar Toko (Lantai Luar & Teras)',
    estimasiHarga: 135000,
    hargaRataRata: 135000,
    satuan: 'm2',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-09',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 132000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Keramik Roman kw 1 motif batu alam matt',
      },
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 135000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Ready stock 120 dus',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 138000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Kemasan original dos per meter persegi',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Keramik', value: '0.35', unit: 'Oh', hargaAcuan: 175000, subtotal: 61250 },
      { id: 'u-2', label: 'Pekerja', value: '0.20', unit: 'Oh', hargaAcuan: 125000, subtotal: 25000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Keramik Roman 40x40 dCastello',
        value: '1.05',
        unit: 'Dus',
        hargaAcuan: 135000,
        hargaSurveiRataRata: 135000,
        subtotal: 141750,
        surveyToko: [
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 132000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 135000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 138000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
        ],
      },
      { id: 'm-2', label: 'Semen Instan Tile Adhesive', value: '0.12', unit: 'Sak', hargaAcuan: 95000, subtotal: 11400 },
      { id: 'm-3', label: 'Semen Grout AM 53', value: '0.5', unit: 'Kg', hargaAcuan: 18000, subtotal: 9000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-09 10:00',
        catatan: 'Disetujui. Standar keramik teras anti licin.',
      },
      {
        role: 'Kontraktor',
        action: 'REJECT',
        tanggal: '2026-10-09 13:40',
        catatan: 'CV Graha Cipta Sarana: Area teras luar rawan tampias hujan sehingga memerlukan aditif semen tile adhesive ekstra tahan basah dan upah kemiringan air lebih cermat. Usulan Rp 155.000/m2.',
      },
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T10:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'TOLAK',
          usulanHarga: 155000,
          usulanMargin: 17.5,
          tanggalRespon: '2026-10-09 13:40',
          catatan: 'Area teras luar rawan tampias hujan sehingga memerlukan aditif semen tile adhesive ekstra tahan basah dan upah kemiringan air lebih cermat. Usulan Rp 155.000/m2.',
          hasRejectedOnce: true,
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-10',
    kode: 'SIP-034',
    kodeMaster: 'SIP-034-A-RollingDoor',
    item: 'Rolling Door One Sheet Full Perforated',
    ukuran: 'Lebar 300 x Tinggi 280 cm',
    merk: 'Sanjaya Door',
    warna: 'Putih Powder Coating',
    tipe: 'One Sheet 0.55mm',
    tebal: '0.55mm',
    permukaan: 'Powder Coated Full Perforated',
    kategori: 'Pekerjaan Pintu & Pengaman',
    implementasi: 'Pengaman Toko Malam Hari',
    lokasi: 'Area Fasad Depan Gerai',
    toleransi: '±2mm',
    informasiTambahan: 'Lengkap dengan box gulung, rel samping peredam suara nylon, dan kunci silinder double',
    deskripsiOtomatis: 'Rolling Door One Sheet Full Perforated 300x280 cm Sanjaya Putih One Sheet 0.55mm Area Fasad Depan Gerai (Pengaman Toko Malam Hari)',
    estimasiHarga: 5800000,
    hargaRataRata: 5800000,
    satuan: 'unit',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Cikokol',
    tanggalPengajuan: '2026-10-09',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Sentral Pintu Tangerang',
        alamatToko: 'Jl. Daan Mogot Km 22, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 5700000,
        tanggalSurvei: '2026-10-09',
        catatan: 'One sheet tebal 0.55mm anti karat',
      },
      {
        namaToko: 'Mitra Rolling Door BSD',
        alamatToko: 'Kawasan Industri Taman Tekno BSD',
        volumeAcuan: 1,
        hargaSatuan: 5800000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Lengkap komponen rel nylon silent dan spring baja',
      },
      {
        namaToko: 'Aneka Door Serpong',
        alamatToko: 'Jl. Raya Serpong No. 88, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 5900000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Garansi pemasangan & kelancaran gulungan 1 tahun',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Besi Khusus', value: '2.0', unit: 'Oh', hargaAcuan: 180000, subtotal: 360000 },
      { id: 'u-2', label: 'Pekerja', value: '1.0', unit: 'Oh', hargaAcuan: 125000, subtotal: 125000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Daun Rolling Door Perforated 300x280',
        value: '1',
        unit: 'Unit',
        hargaAcuan: 4600000,
        hargaSurveiRataRata: 4600000,
        subtotal: 4600000,
        surveyToko: [
          { namaToko: 'Sentral Pintu Tangerang', hargaSatuan: 4500000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Mitra Rolling Door BSD', hargaSatuan: 4600000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Aneka Door Serpong', hargaSatuan: 4700000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
        ],
      },
      { id: 'm-2', label: 'Rel Guide Rail + Karet Peredam', value: '2', unit: 'Btg', hargaAcuan: 350000, subtotal: 700000 },
      { id: 'm-3', label: 'Spring Box Gulung & Dudukan As', value: '1', unit: 'Set', hargaAcuan: 500000, subtotal: 500000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-09 11:30',
        catatan: 'Disetujui. Standarisasi keamanan pintu toko malam hari.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T11:30:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-11',
    kode: 'SIP-035',
    kodeMaster: 'SIP-035-A-CatWeathershield',
    item: 'Cat Dinding Eksterior Weathershield',
    ukuran: 'Pail 20 Liter',
    merk: 'Dulux',
    warna: 'Brilliant White',
    tipe: 'Weathershield Powerflex',
    tebal: '',
    permukaan: 'Matt Sheen',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Luar Fasad Toko',
    lokasi: 'Area Fasad Eksterior',
    toleransi: '',
    informasiTambahan: 'Tahan cuaca ekstrem, anti lumut & jamur garansi 8 tahun',
    deskripsiOtomatis: 'Cat Dinding Eksterior Weathershield Pail 20 Liter Dulux Brilliant White Weathershield Powerflex Area Fasad Eksterior (Dinding Luar Fasad Toko)',
    estimasiHarga: 2350000,
    hargaRataRata: 2350000,
    satuan: 'pail',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Balaraja',
    tanggalPengajuan: '2026-10-09',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Mitra 10 Balaraja',
        alamatToko: 'Jl. Raya Serang Km 24, Balaraja',
        volumeAcuan: 1,
        hargaSatuan: 2320000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Ready stock batch baru',
      },
      {
        namaToko: 'Depo Bangunan Cikupa',
        alamatToko: 'Jl. Raya Pemda Tigaraksa, Cikupa',
        volumeAcuan: 1,
        hargaSatuan: 2350000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Kemasan original pail 20L',
      },
      {
        namaToko: 'TB Makmur Balaraja',
        alamatToko: 'Pasar Sentiong Balaraja',
        volumeAcuan: 1,
        hargaSatuan: 2380000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Stok tersedia 15 pail',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Cat', value: '1.5', unit: 'Oh', hargaAcuan: 200000, subtotal: 300000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Cat Dulux Weathershield 20L',
        value: '1',
        unit: 'Pail',
        hargaAcuan: 2350000,
        hargaSurveiRataRata: 2350000,
        subtotal: 2350000,
        surveyToko: [
          { namaToko: 'Mitra 10 Balaraja', hargaSatuan: 2320000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Depo Bangunan Cikupa', hargaSatuan: 2350000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'TB Makmur Balaraja', hargaSatuan: 2380000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
        ],
      },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-09 14:00',
        catatan: 'Disetujui. Standar cat eksterior cabang Balaraja.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T14:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-kontraktor-12',
    kode: 'SIP-036',
    kodeMaster: 'SIP-036-A-KacaMati10mm',
    item: 'Kaca Mati Tempered 10mm Clear Fasad',
    ukuran: '150x240 cm',
    merk: 'Asahimas',
    warna: 'Clear Transparan',
    tipe: 'Tempered 10mm',
    tebal: '10mm',
    permukaan: 'Polished Flat',
    kategori: 'Pekerjaan Kaca',
    implementasi: 'Kaca Display Depan Toko',
    lokasi: 'Area Fasad Depan Gerai',
    toleransi: '±1mm',
    informasiTambahan: 'Lengkap dengan seal silikon netral weatherseal Dow Corning',
    deskripsiOtomatis: 'Kaca Mati Tempered 10mm Clear Fasad 150x240 cm Asahimas Clear Tempered 10mm Area Fasad Depan Gerai (Kaca Display Depan Toko)',
    estimasiHarga: 1850000,
    hargaRataRata: 1850000,
    satuan: 'lembar',
    status: 'PENDING_KONTRAKTOR',
    cabang: 'Balaraja',
    tanggalPengajuan: '2026-10-09',
    marginUpah: 8,
    marginMaterial: 8,
    surveyToko: [
      {
        namaToko: 'Sentral Kaca Balaraja',
        alamatToko: 'Jl. Raya Serang Km 25, Balaraja',
        volumeAcuan: 1,
        hargaSatuan: 1820000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Tempered 10mm gosok mesin rapi',
      },
      {
        namaToko: 'Mitra Kaca Cikupa',
        alamatToko: 'Jl. Raya Serang Km 18, Cikupa',
        volumeAcuan: 1,
        hargaSatuan: 1850000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Ready stock lembaran display',
      },
      {
        namaToko: 'Asahi Glass Serang',
        alamatToko: 'Jl. Jenderal Sudirman No. 45, Serang',
        volumeAcuan: 1,
        hargaSatuan: 1880000,
        tanggalSurvei: '2026-10-09',
        catatan: 'Sertifikasi Asahimas tempered resmi',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Kaca', value: '1.2', unit: 'Oh', hargaAcuan: 160000, subtotal: 192000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Kaca Tempered 10mm 150x240',
        value: '1',
        unit: 'Lembar',
        hargaAcuan: 1850000,
        hargaSurveiRataRata: 1850000,
        subtotal: 1850000,
        surveyToko: [
          { namaToko: 'Sentral Kaca Balaraja', hargaSatuan: 1820000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Mitra Kaca Cikupa', hargaSatuan: 1850000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
          { namaToko: 'Asahi Glass Serang', hargaSatuan: 1880000, volumeAcuan: 1, tanggalSurvei: '2026-10-09' },
        ],
      },
      { id: 'm-2', label: 'Sealant Silikon Dow Corning', value: '2', unit: 'Tube', hargaAcuan: 45000, subtotal: 90000 },
    ],
    historyLog: [
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-09 15:00',
        catatan: 'Disetujui. Standar kaca fasad etalase toko.',
      }
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-20T15:00:00.000Z',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'MENUNGGU',
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  },
  {
    id: 'item-usulan-kontraktor-1',
    kode: 'SIP-028',
    kodeMaster: 'SIP-028-A-CatDinding',
    item: 'Cat Dinding Interior Jotun Majestic',
    ukuran: 'Pail 20 Liter',
    merk: 'Jotun',
    warna: 'Pure White',
    tipe: 'Majestic True Beauty',
    tebal: '',
    permukaan: 'Matt Sheen',
    kategori: 'Pekerjaan Pengecatan',
    implementasi: 'Dinding Dalam Gerai',
    lokasi: 'Area Sales Utama',
    toleransi: '',
    informasiTambahan: 'Daya sebar 12m2/liter per lapis',
    deskripsiOtomatis: 'Cat Dinding Interior Jotun Majestic Pail 20 Liter Jotun Pure White Majestic True Beauty Matt Sheen Area Sales Utama (Dinding Dalam Gerai)',
    estimasiHarga: 1850000,
    hargaRataRata: 1550000,
    satuan: 'pail',
    status: 'USULAN_KONTRAKTOR',
    tanggalPengajuan: '2026-10-06',
    marginUpah: 8,
    marginMaterial: 8,
    marginBongkaran: 8,
    usulanHargaKontraktor: 2150000,
    usulanMarginKontraktor: 16.22,
    surveyToko: [
      {
        namaToko: 'Mitra 10 Cikokol',
        alamatToko: 'Jl. MH Thamrin No. 8, Tangerang',
        volumeAcuan: 1,
        hargaSatuan: 1520000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Ready stock batch baru',
      },
      {
        namaToko: 'Depo Bangunan Alam Sutera',
        alamatToko: 'Kav. Commercial Alam Sutera',
        volumeAcuan: 1,
        hargaSatuan: 1560000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Harga satuan netto termasuk PPN',
      },
      {
        namaToko: 'BJ Home Serpong',
        alamatToko: 'Jl. Pahlawan Seribu Blok S',
        volumeAcuan: 1,
        hargaSatuan: 1570000,
        tanggalSurvei: '2026-10-05',
        catatan: 'Stok tersedia 30 pail',
      },
    ],
    koefisienUpahItems: [
      { id: 'u-1', label: 'Tukang Cat', value: '1.5', unit: 'Oh', hargaAcuan: 200000, subtotal: 300000 },
    ],
    koefisienMaterialItems: [
      {
        id: 'm-1',
        label: 'Cat Jotun Majestic 20L',
        value: '1',
        unit: 'Pail',
        hargaAcuan: 1550000,
        hargaSurveiRataRata: 1550000,
        subtotal: 1550000,
        surveyToko: [
          { namaToko: 'Mitra 10 Cikokol', hargaSatuan: 1520000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
          { namaToko: 'Depo Bangunan Alam Sutera', hargaSatuan: 1560000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
          { namaToko: 'BJ Home Serpong', hargaSatuan: 1570000, volumeAcuan: 1, tanggalSurvei: '2026-10-05' },
        ],
      },
    ],
    historyLog: [
      {
        role: 'B&M Manager',
        action: 'SUBMIT',
        tanggal: '2026-10-02 08:30',
        catatan: 'Pengajuan spesifikasi material cat Jotun Majestic.',
      },
      {
        role: 'S&B Specialist',
        action: 'APPROVE',
        tanggal: '2026-10-03 09:00',
        catatan: 'Spesifikasi disetujui, diteruskan ke survei BC.',
      },
      {
        role: 'Building Coordinator',
        action: 'SUBMIT',
        tanggal: '2026-10-05 14:00',
        catatan: 'Survei 3 toko selesai dilakukan dengan rata-rata Rp 1.550.000.',
      },
      {
        role: 'B&M Manager',
        action: 'APPROVE',
        tanggal: '2026-10-05 16:30',
        catatan: 'Hasil survei disetujui Layer 1.',
      },
      {
        role: 'S&B Specialist',
        action: 'APPROVE',
        tanggal: '2026-10-06 09:00',
        catatan: 'Koefisien AHSP dan margin 8% disetujui Layer 2.',
      },
      {
        role: 'Regional Manager',
        action: 'APPROVE',
        tanggal: '2026-10-06 11:00',
        catatan: 'Disetujui Layer 3, diteruskan ke Kontraktor.',
      },
      {
        role: 'Kontraktor',
        action: 'REJECT',
        tanggal: '2026-10-06 15:30',
        catatan: 'Harga pasar Jotun naik dan upah aplikasi 2 lapis cat butuh penyesuaian margin minimal 16%. Kami usulkan harga Rp 2.150.000 / pail.',
      },
      {
        role: 'Kontraktor',
        action: 'REJECT',
        tanggal: '2026-10-06 16:15',
        catatan: 'PT Sinar Surya Perkasa: Spesifikasi Jotun Majestic membutuhkan pengerjaan cat dasar alkali dan plamir ekstra halus. Usulan Rp 2.200.000 / pail.',
      },
    ],
    votingKontraktor: {
      deadlineVoting: '2026-10-09T11:00:00.000Z',
      selectedKontraktorIdForNego: 'kontraktor-1',
      daftarKontraktor: [
        {
          kontraktorId: 'kontraktor-1',
          namaPerusahaan: 'PT Mahakarya Konstruksi Mandiri',
          picName: 'Ir. Budi Santoso',
          statusVote: 'TOLAK',
          usulanHarga: 2150000,
          usulanMargin: 16.22,
          catatan: 'Harga pasar Jotun naik dan upah aplikasi 2 lapis cat butuh penyesuaian margin minimal 16%. Kami usulkan harga Rp 2.150.000 / pail.',
          tanggalRespon: '2026-10-06 15:30',
          hasRejectedOnce: true,
        },
        {
          kontraktorId: 'kontraktor-2',
          namaPerusahaan: 'PT Sinar Surya Perkasa',
          picName: 'Hendra Wijaya',
          statusVote: 'TOLAK',
          usulanHarga: 2200000,
          usulanMargin: 18.92,
          catatan: 'Spesifikasi Jotun Majestic membutuhkan pengerjaan cat dasar alkali dan plamir ekstra halus.',
          tanggalRespon: '2026-10-06 16:15',
          hasRejectedOnce: true,
        },
        {
          kontraktorId: 'kontraktor-3',
          namaPerusahaan: 'CV Graha Cipta Sarana',
          picName: 'Agus Setiawan',
          statusVote: 'MENUNGGU',
        },
      ],
    },
  }
];

// Data Awal Jalur B: Trial Item oleh S&B Controlling Specialist
export const INITIAL_TRIAL_HARGA: TrialHargaItem[] = [
  {
    id: 'tr-1',
    kodeMaster: 'SIP-TR01-A-KeramikTactile',
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
    const parsed: PengajuanHargaItem[] = JSON.parse(raw);
    const initialBranchMap: Record<string, string> = {
      'item-1': 'Cikokol',
      'item-2': 'Balaraja',
      'item-3': 'Cikokol',
      'item-4': 'Bekasi',
      'item-5': 'Parung',
      'item-6': 'Cileungsi',
      'item-7': 'Cikokol',
      'item-8': 'Balaraja',
      'item-9': 'Bekasi',
      'item-10': 'Cikokol',
      'item-11': 'Parung',
      'item-12': 'Bogor',
      'item-kontraktor-1': 'Cikokol',
      'item-kontraktor-2': 'Cikokol',
      'item-kontraktor-3': 'Cikokol',
      'item-kontraktor-4': 'Cikokol',
      'item-kontraktor-5': 'Cikokol',
      'item-kontraktor-6': 'Cikokol',
      'item-kontraktor-7': 'Cikokol',
      'item-kontraktor-8': 'Cikokol',
      'item-kontraktor-9': 'Cikokol',
      'item-kontraktor-10': 'Cikokol',
      'item-kontraktor-11': 'Balaraja',
      'item-kontraktor-12': 'Balaraja',
      'item-usulan-kontraktor-1': 'Cikokol',
      'item-trial-pending-1': 'Cikokol',
      'item-trial-revisi-1': 'Balaraja',
      'item-trial-urgent-1': 'Cikokol',
      'item-trial-promosi-1': 'Bekasi',
      'item-master-promosi-1': 'Cikokol',
    };

    // Sinkronisasi item baru: Gabungkan item dari INITIAL_PENGAJUAN_HARGA yang belum ada di localStorage
    const existingIds = new Set(parsed.map((p) => p.id));
    const missingInitial = INITIAL_PENGAJUAN_HARGA.filter((init) => !existingIds.has(init.id));
    const combinedList = [...parsed, ...missingInitial];

    const mapped: PengajuanHargaItem[] = combinedList.map((item, idx) => {
      let km = item.kodeMaster;
      if (km) {
        if (item.ukuran) {
          const cleanUk = item.ukuran.trim().replace(/\s*cm$/i, '').replace(/\s+/g, '');
          if (cleanUk && km.endsWith(`-${cleanUk}`)) {
            km = km.slice(0, -(cleanUk.length + 1));
          }
        }
        km = km.replace(/-(\d+x\d+|\d+L|\d+mm|\d+inch|\d+W)$/i, '');
      }
      return {
        ...item,
        kodeMaster: km,
        cabang: initialBranchMap[item.id] || item.cabang || (idx % 2 === 0 ? 'Cikokol' : 'Balaraja'),
        tanggalPengajuan: item.tanggalPengajuan || item.historyLog?.[0]?.tanggal?.slice(0, 10) || '2026-09-24',
        hargaPerCabang: item.hargaPerCabang && item.hargaPerCabang.length > 0
          ? item.hargaPerCabang
          : [
              {
                cabang: 'Cikokol',
                harga: item.hargaRataRata || item.estimasiHarga || 100000,
                status: 'AKTIF' as const,
                tanggalUpdate: '2026-09-20',
              },
              {
                cabang: 'Balaraja',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.02),
                status: 'AKTIF' as const,
                tanggalUpdate: '2026-09-22',
              },
              {
                cabang: 'Bekasi',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.04),
                status: 'AKTIF' as const,
                tanggalUpdate: '2026-09-25',
              },
              {
                cabang: 'Bandung',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.05),
                status: (idx % 3 === 0 ? 'AKTIF' : 'NONAKTIF') as 'AKTIF' | 'NONAKTIF',
                tanggalUpdate: idx % 3 === 0 ? '2026-09-26' : undefined,
              },
              {
                cabang: 'Serang',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.03),
                status: 'NONAKTIF' as const,
              },
              {
                cabang: 'Parung',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.01),
                status: 'NONAKTIF' as const,
              },
              {
                cabang: 'Cileungsi',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.02),
                status: 'NONAKTIF' as const,
              },
              {
                cabang: 'Bogor',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.03),
                status: 'NONAKTIF' as const,
              },
            ],
        surveyToko:
          item.surveyToko && item.surveyToko.length > 0
            ? item.surveyToko
            : INITIAL_PENGAJUAN_HARGA.find((init) => init.id === item.id)?.surveyToko ||
              item.koefisienMaterialItems?.[0]?.surveyToko ||
              (item.hargaRataRata
                ? [
                    {
                      namaToko: `Mitra 10 ${item.cabang || 'Cikokol'}`,
                      alamatToko: `Jl. MH Thamrin No. 8, ${item.cabang || 'Tangerang'}`,
                      volumeAcuan: 1,
                      hargaSatuan: Math.round((item.hargaRataRata || 100000) * 0.985),
                      tanggalSurvei: item.tanggalPengajuan || '2026-10-05',
                      catatan: 'Ready stock batch baru',
                    },
                    {
                      namaToko: `Depo Bangunan ${item.cabang || 'Alam Sutera'}`,
                      alamatToko: `Kav. Komersial Barat, ${item.cabang || 'Tangerang'}`,
                      volumeAcuan: 1,
                      hargaSatuan: item.hargaRataRata || 100000,
                      tanggalSurvei: item.tanggalPengajuan || '2026-10-05',
                      catatan: 'Harga satuan netto termasuk PPN',
                    },
                    {
                      namaToko: `BJ Home ${item.cabang || 'Serpong'}`,
                      alamatToko: `Jl. Pahlawan Seribu Blok S, ${item.cabang || 'Tangerang'}`,
                      volumeAcuan: 1,
                      hargaSatuan: Math.round((item.hargaRataRata || 100000) * 1.015),
                      tanggalSurvei: item.tanggalPengajuan || '2026-10-05',
                      catatan: 'Stok tersedia di gudang cabang',
                    },
                  ]
                : undefined),
        votingKontraktor:
          item.votingKontraktor && item.votingKontraktor.daftarKontraktor?.length > 0
            ? item.votingKontraktor
            : INITIAL_PENGAJUAN_HARGA.find((init) => init.id === item.id)?.votingKontraktor ||
              (item.status === 'PENDING_KONTRAKTOR' ||
              item.status === 'USULAN_KONTRAKTOR' ||
              item.status === 'DITOLAK_KONTRAKTOR' ||
              item.status === 'RELEASED'
                ? makeInitialVotingKontraktor(item.tanggalPengajuan)
                : undefined),
      };
    });

    if (missingInitial.length > 0) {
      saveStoredPengajuan(mapped);
    }
    return mapped;
  } catch {
    return INITIAL_PENGAJUAN_HARGA;
  }
}

/**
 * Submit vote dari salah satu kontraktor rekanan (Kuorum 50% + 1)
 * - Jika 2 dari 3 setuju -> Early Release langsung ke RELEASED
 * - Jika 2 dari 3 tolak -> Kuorum gagal, status berubah ke USULAN_KONTRAKTOR untuk review S&B Specialist
 */
export function submitVoteKontraktor(
  itemId: string,
  kontraktorId: string,
  payload: {
    action: 'SETUJU' | 'TOLAK';
    usulanHarga?: number;
    usulanMargin?: number;
    catatan?: string;
  }
): PengajuanHargaItem | null {
  const current = getStoredPengajuan();
  const index = current.findIndex((i) => i.id === itemId);
  if (index === -1) return null;

  const item = { ...current[index] };
  const voting = item.votingKontraktor
    ? { ...item.votingKontraktor }
    : makeInitialVotingKontraktor(item.tanggalPengajuan);

  const daftar = (voting.daftarKontraktor || []).map((k) => {
    if (k.kontraktorId === kontraktorId) {
      return {
        ...k,
        statusVote: (payload.action === 'SETUJU' ? 'SETUJU' : 'TOLAK') as VotingKontraktorItem['statusVote'],
        usulanHarga: payload.action === 'TOLAK' ? payload.usulanHarga : undefined,
        usulanMargin: payload.action === 'TOLAK' ? payload.usulanMargin : undefined,
        catatan: payload.catatan?.trim() || (payload.action === 'SETUJU' ? 'Harga penawaran disepakati.' : ''),
        tanggalRespon: new Date().toISOString().slice(0, 16).replace('T', ' '),
        hasRejectedOnce: payload.action === 'TOLAK' ? true : k.hasRejectedOnce,
      };
    }
    return k;
  });

  voting.daftarKontraktor = daftar;

  const setujuCount = daftar.filter((k) => k.statusVote === 'SETUJU').length;
  const tolakCount = daftar.filter((k) => k.statusVote === 'TOLAK').length;
  const menungguCount = daftar.filter((k) => k.statusVote === 'MENUNGGU').length;
  const targetPerusahaan = daftar.find((k) => k.kontraktorId === kontraktorId)?.namaPerusahaan || 'Kontraktor';

  let nextStatus = item.status;
  const logs = [...(item.historyLog || [])];
  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

  // Catat log vote rekanan kontraktor
  logs.push({
    role: 'Kontraktor',
    action: payload.action === 'SETUJU' ? 'APPROVE' : 'REJECT',
    tanggal: nowStr,
    catatan: `${targetPerusahaan}: ${
      payload.action === 'SETUJU'
        ? 'Menyetujui harga penawaran.'
        : `Mengajukan usulan harga Rp ${(payload.usulanHarga || 0).toLocaleString('id-ID')} (${payload.catatan || ''})`
    }`,
  });

  // Simpan usulan harga terbaru ke item untuk referensi umum jika ada
  const daftarUsulan = daftar.filter((k) => k.statusVote === 'TOLAK' && k.usulanHarga);
  if (daftarUsulan.length > 0) {
    const latest = daftarUsulan[daftarUsulan.length - 1];
    item.usulanHargaKontraktor = latest.usulanHarga;
    item.usulanMarginKontraktor = latest.usulanMargin;
  }

  // ATURAN KUORUM (50% + 1):
  // 1. Kasus SETUJU: Jika minimal 2 dari 3 rekanan setuju, langsung Early Release ke RELEASED (tidak perlu menunggu rekanan ke-3)
  if (setujuCount >= 2) {
    nextStatus = 'RELEASED';
    logs.push({
      role: 'S&B Specialist',
      action: 'APPROVE',
      tanggal: nowStr,
      catatan: `Kuorum 50%+1 terpenuhi (${setujuCount}/3 kontraktor rekanan menyetujui penawaran). Harga resmi dirilis ke Master.`,
    });
  } else if (menungguCount === 0) {
    // 2. Kasus TOLAK: Jika seluruh rekanan telah selesai merespon (menungguCount === 0) dan setujuCount < 2
    // Maka kuorum persetujuan tidak tercapai, alihkan ke meja S&B Specialist untuk negosiasi / penyesuaian margin
    nextStatus = 'USULAN_KONTRAKTOR';
    logs.push({
      role: 'S&B Specialist',
      action: 'REVISE',
      tanggal: nowStr,
      catatan: `Seluruh rekanan kontraktor telah selesai merespon (${tolakCount}/3 tolak/usulan). Pengajuan dialihkan ke S&B Specialist untuk evaluasi/negosiasi ulang.`,
    });
  } else {
    // 3. Jika masih ada rekanan yang belum merespon (menungguCount > 0) dan setujuCount < 2:
    // Status TETAP PENDING_KONTRAKTOR agar seluruh rekanan mendapat kesempatan merespon hingga batas waktu SLA.
    nextStatus = 'PENDING_KONTRAKTOR';
  }

  const updatedItem: PengajuanHargaItem = {
    ...item,
    status: nextStatus,
    votingKontraktor: voting,
    historyLog: logs,
  };

  current[index] = updatedItem;
  saveStoredPengajuan(current);
  return updatedItem;
}

/**
 * Atur kontraktor yang usulannya dijadikan acuan negosiasi oleh S&B Specialist
 */
export function setSelectedKontraktorForNego(
  itemId: string,
  kontraktorId: string
): PengajuanHargaItem | null {
  const current = getStoredPengajuan();
  const index = current.findIndex((i) => i.id === itemId);
  if (index === -1) return null;

  const item = { ...current[index] };
  if (!item.votingKontraktor) return null;

  const voting = { ...item.votingKontraktor };
  voting.selectedKontraktorIdForNego = kontraktorId;

  const selected = (voting.daftarKontraktor || []).find((k) => k.kontraktorId === kontraktorId);
  if (selected && selected.usulanHarga) {
    item.usulanHargaKontraktor = selected.usulanHarga;
    item.usulanMarginKontraktor = selected.usulanMargin;
  }

  item.votingKontraktor = voting;
  current[index] = item;
  saveStoredPengajuan(current);
  return item;
}

export function updateHargaCabangPengajuan(
  itemId: string,
  hargaCabangList: HargaCabangItem[]
): PengajuanHargaItem | null {
  const current = getStoredPengajuan();
  const index = current.findIndex(i => i.id === itemId);
  if (index === -1) return null;

  const updated: PengajuanHargaItem = {
    ...current[index],
    hargaPerCabang: hargaCabangList,
  };

  current[index] = updated;
  saveStoredPengajuan(current);
  return updated;
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
    const parsed: TrialHargaItem[] = JSON.parse(raw);
    return parsed.map(t => {
      let km = t.kodeMaster;
      if (km) {
        if (t.ukuran) {
          const cleanUk = t.ukuran.trim().replace(/\s*cm$/i, '').replace(/\s+/g, '');
          if (cleanUk && km.endsWith(`-${cleanUk}`)) {
            km = km.slice(0, -(cleanUk.length + 1));
          }
        }
        km = km.replace(/-(\d+x\d+|\d+L|\d+mm|\d+inch|\d+W)$/i, '');
      }
      return { ...t, kodeMaster: km };
    });
  } catch {
    return INITIAL_TRIAL_HARGA;
  }
}

export function saveStoredTrials(data: TrialHargaItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRIAL_HARGA, JSON.stringify(data));
}

// Data Awal Direktori Toko / Supplier Bahan Bangunan Rekanan
export const INITIAL_MASTER_TOKO: MasterTokoItem[] = [
  {
    id: 'toko-1',
    namaToko: 'Mitra 10 Cikokol',
    alamat: 'Jl. M.H. Thamrin No. 8, Cikokol',
    kota: 'Tangerang',
    telepon: '021-55781234',
    kontakPic: 'Bpk. Hendra (Manager Penjualan)',
    status: 'AKTIF',
    jumlahSurvei: 12,
  },
  {
    id: 'toko-2',
    namaToko: 'Depo Bangunan Alam Sutera',
    alamat: 'Kav. Commercial Alam Sutera, Serpong',
    kota: 'Tangerang Selatan',
    telepon: '021-29008899',
    kontakPic: 'Ibu Linda (Sales Proyek)',
    status: 'AKTIF',
    jumlahSurvei: 15,
  },
  {
    id: 'toko-3',
    namaToko: 'TB Sinar Abadi',
    alamat: 'Jl. Daan Mogot Km. 12 No. 45, Kalideres',
    kota: 'Jakarta Barat',
    telepon: '021-5401928',
    kontakPic: 'Koh William (Owner)',
    status: 'AKTIF',
    jumlahSurvei: 9,
  },
  {
    id: 'toko-4',
    namaToko: 'TB Maju Jaya Sentosa',
    alamat: 'Jl. Cut Meutia No. 20, Rawa Lumbu',
    kota: 'Bekasi',
    telepon: '021-8241098',
    kontakPic: 'Bpk. Agus (Admin Toko)',
    status: 'AKTIF',
    jumlahSurvei: 8,
  },
  {
    id: 'toko-5',
    namaToko: 'BJ Home BSD City',
    alamat: 'Jl. Pahlawan Seribu Blok S, Lengkong Gudang',
    kota: 'Tangerang Selatan',
    telepon: '021-5374455',
    kontakPic: 'Bpk. Rizal (Koordinator Proyek)',
    status: 'AKTIF',
    jumlahSurvei: 11,
  },
  {
    id: 'toko-6',
    namaToko: 'TB Sumber Rejeki',
    alamat: 'Jl. Raya Pajajaran No. 88, Bantarjati',
    kota: 'Bogor',
    telepon: '0251-8321456',
    kontakPic: 'Bpk. Deni (Pemasaran)',
    status: 'AKTIF',
    jumlahSurvei: 6,
  },
];

export function getStoredMasterToko(): MasterTokoItem[] {
  if (typeof window === 'undefined') return INITIAL_MASTER_TOKO;
  const raw = localStorage.getItem(STORAGE_KEYS.MASTER_TOKO);
  if (!raw) return INITIAL_MASTER_TOKO;
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MASTER_TOKO;
  }
}

export function saveStoredMasterToko(data: MasterTokoItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MASTER_TOKO, JSON.stringify(data));
}
