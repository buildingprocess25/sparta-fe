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
} from './types';

const STORAGE_KEYS = {
  REQUEST_PENETAPAN: 'sparta_request_penetapan_v1',
  PENGAJUAN_HARGA: 'sparta_pengajuan_harga_v3',
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
      'item-trial-pending-1': 'Cikokol',
      'item-trial-revisi-1': 'Balaraja',
      'item-trial-urgent-1': 'Cikokol',
      'item-trial-promosi-1': 'Bekasi',
      'item-master-promosi-1': 'Cikokol',
    };
    return parsed.map((item, idx) => {
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
        cabang: item.cabang || initialBranchMap[item.id] || (idx % 2 === 0 ? 'Cikokol' : 'Balaraja'),
        tanggalPengajuan: item.tanggalPengajuan || item.historyLog?.[0]?.tanggal?.slice(0, 10) || '2026-09-24',
        hargaPerCabang: item.hargaPerCabang && item.hargaPerCabang.length > 0
          ? item.hargaPerCabang
          : [
              {
                cabang: 'Cikokol',
                harga: item.hargaRataRata || item.estimasiHarga || 100000,
                status: 'AKTIF',
                tanggalUpdate: '2026-09-20',
              },
              {
                cabang: 'Balaraja',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.02),
                status: 'AKTIF',
                tanggalUpdate: '2026-09-22',
              },
              {
                cabang: 'Bekasi',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.04),
                status: 'AKTIF',
                tanggalUpdate: '2026-09-25',
              },
              {
                cabang: 'Bandung',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.05),
                status: idx % 3 === 0 ? 'AKTIF' : 'NONAKTIF',
                tanggalUpdate: idx % 3 === 0 ? '2026-09-26' : undefined,
              },
              {
                cabang: 'Serang',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.03),
                status: 'NONAKTIF',
              },
              {
                cabang: 'Parung',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.01),
                status: 'NONAKTIF',
              },
              {
                cabang: 'Cileungsi',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.02),
                status: 'NONAKTIF',
              },
              {
                cabang: 'Bogor',
                harga: Math.round((item.hargaRataRata || item.estimasiHarga || 100000) * 1.03),
                status: 'NONAKTIF',
              },
            ],
      };
    });
  } catch {
    return INITIAL_PENGAJUAN_HARGA;
  }
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
