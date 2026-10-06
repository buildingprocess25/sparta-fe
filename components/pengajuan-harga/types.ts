// =============================================================================
// components/pengajuan-harga/types.ts
// Kontrak Data & Workflow Types untuk Modul Pengajuan Master Harga
// =============================================================================

export interface SurveyTokoItem {
  namaToko: string;
  alamatToko?: string; // Alamat Toko / Lokasi Survei
  volumeAcuan?: number; // Volume Acuan (dikunci, dan selalu 1)
  hargaSatuan: number; // Harga Survei (Rp)
  buktiSurveiUrl?: string; // Lampiran Bukti Survei (upload gambar)
  buktiSurveiName?: string;
  tanggalSurvei: string;
  catatan?: string;
}

export interface MasterTokoItem {
  id: string;
  namaToko: string;
  alamat: string;
  kota: string;
  telepon?: string;
  kontakPic?: string;
  status: 'AKTIF' | 'NONAKTIF';
  jumlahSurvei?: number;
}

export interface AHSPKomponen {
  namaKomponen: string;
  jenis: 'UPAH' | 'MATERIAL' | 'ALAT';
  satuan: string;
  hargaSatuan: number;
  koefisien: number;
  total: number;
}

export interface ApprovalLog {
  role: 'B&M Manager' | 'S&B Specialist' | 'Regional Manager' | 'Kontraktor' | 'Building Coord' | 'Building Coordinator';
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REVISE' | 'MASTERING' | 'PROMOTED' | 'EVALUATE';
  tanggal: string;
  catatan?: string;
  revisiFields?: string[];
}

/**
 * Alur 1: Request Penetapan Harga Baru oleh B&M Manager
 */
export interface RequestPenetapanItem {
  id: string;
  noTiket: string;
  tanggalRequest: string;
  item: string;
  kategori: string;
  ukuran: string;
  merk: string;
  lokasi: string | string[];
  alasanRequest: string;
  status: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'REVISI' | 'PENDING_VALIDASI_SB' | 'DISETUJUI_MASTERING' | 'DITOLAK_SB';
  catatanReview?: string;
  // Data Mastering Perhitungan oleh S&B Controlling Specialist
  koefisienUpah?: number;
  koefisienMaterial?: number;
  koefisienAlat?: number;
}

/**
 * Alur 2A: Pengajuan Harga Satuan 4-Layer Approval oleh Building Coord
 */
export interface PengajuanHargaItem {
  id: string;
  kode: string; // Kode Item (contoh: "SIP-001")
  kodeMaster?: string; // Kode Master Item (contoh: "SIP-001-A-Keramik-60x60")
  item: string;
  ukuran: string;
  merk: string;
  warna: string;
  tipe: string;
  tebal: string;
  permukaan: string;
  kategori: string;
  implementasi: string;
  lokasi: string;
  toleransi?: string;
  informasiTambahan?: string;
  deskripsiOtomatis: string;
  estimasiHarga?: number;
  hargaRataRata?: number;
  satuan?: string;
  jenisPengajuan?: 'Hanya Jasa' | 'Material';
  
  // Status Persetujuan
  status:
    | 'DIAJUKAN'
    | 'SIAP_SURVEI'
    | 'DISETUJUI'
    | 'DITOLAK'
    | 'REVISI'
    | 'PERLU_REVISI'
    | 'DRAFT'
    | 'PENDING_VALIDASI_SB'
    | 'PENDING_BM_MGR'
    | 'PENDING_SB_SPECIALIST'
    | 'PENDING_REGIONAL_MGR'
    | 'PENDING_KONTRAKTOR'
    | 'RETURNED_TO_BC'
    | 'RELEASED'
    | 'DISETUJUI_MASTERING'
    | 'APPROVED_ACTIVE'
    | 'DITOLAK_SB'
    // Status Khusus Jalur B: Trial
    | 'TRIAL_PENDING_REGIONAL_MGR'
    | 'TRIAL_REVISI'
    | 'TRIAL_DITOLAK'
    | 'TRIAL_RELEASED'
    | 'TRIAL_PROMOSI_BM_MGR'
    | 'TRIAL_PROMOSI_REGIONAL_MGR'
    | 'TRIAL_PROMOSI_KONTRAKTOR';

  // Metadata Jalur B (Trial 3 Bulan)
  isTrial?: boolean;
  alasanTrial?: string;
  trialStartDate?: string; // Tanggal mulai rilis trial YYYY-MM-DD
  trialDurationDays?: number; // Durasi default 90 hari (3 bulan)
  trialEvaluationAction?: 'PERMANEN' | 'STOP' | 'PERPANJANG';
  trialCatatanEvaluasi?: string;

  // Prasyarat Administrasi & Koefisien AHSP
  koefisienUpah?: number;
  koefisienMaterial?: number;
  koefisienAlat?: number;
  catatanReview?: string;
  revisiFields?: string[];
  surveyToko?: SurveyTokoItem[];
  rincianAHSP?: AHSPKomponen[];
  koefisienUpahItems?: KoefisienDetailItem[];
  koefisienMaterialItems?: KoefisienDetailItem[];
  marginUpah?: number; // Margin persentase internal S&B untuk komponen upah (%) - default 8%
  marginMaterial?: number; // Margin persentase internal S&B untuk komponen material (%) - default 8%
  historyLog?: ApprovalLog[];

  tanggalPengajuan?: string;
  cabang?: string; // Cabang pengaju (contoh: 'Cikokol', 'Balaraja', 'Bekasi', 'Parung')

  // Aktivasi & Harga per Cabang (Disparitas Harga Antar Daerah)
  hargaPerCabang?: HargaCabangItem[];
}

export interface HargaCabangItem {
  cabang: string; // contoh: 'Cikokol', 'Balaraja', 'Bekasi', 'Bandung', dll.
  harga: number; // nominal harga satuan master di cabang tersebut (Rp)
  status: 'AKTIF' | 'NONAKTIF';
  tanggalUpdate?: string;
  catatan?: string;
}

export const DAFTAR_CABANG_ALFAMART = [
  'Cikokol',
  'Balaraja',
  'Bekasi',
  'Parung',
  'Cileungsi',
  'Bogor',
  'Bandung',
  'Serang',
] as const;

export const DAFTAR_FIELD_SPESIFIKASI: { id: string; label: string }[] = [
  { id: 'kategori', label: 'Kategori Pekerjaan' },
  { id: 'item', label: 'Nama Material' },
  { id: 'ukuran', label: 'Ukuran / Dimensi' },
  { id: 'merk', label: 'Merk / Brand' },
  { id: 'warna', label: 'Warna' },
  { id: 'tipe', label: 'Tipe / Motif' },
  { id: 'permukaan', label: 'Permukaan' },
  { id: 'tebal', label: 'Ketebalan' },
  { id: 'toleransi', label: 'Toleransi Presisi' },
  { id: 'implementasi', label: 'Implementasi / Posisi' },
  { id: 'lokasi', label: 'Lokasi / Area Gerai' },
  { id: 'informasiTambahan', label: 'Informasi Tambahan' },
];

export interface KoefisienDetailItem {
  id: string;
  label: string;
  value: number | string; // Nilai Koefisien
  unit: string;
  hargaAcuan?: number; // Master acuan harga satuan (khusus upah, contoh: 245000, 175000, dll)
  margin?: number; // Margin persentase internal S&B (%) - tidak ditampilkan ke Building Coordinator
  subtotal?: number; // Hasil kalkulasi koefisien * hargaAcuan (termasuk margin)
  isCustom?: boolean;
  surveyToko?: SurveyTokoItem[]; // Survei 3 toko per item material oleh Building Coordinator
  hargaSurveiRataRata?: number; // Rata-rata harga hasil survei 3 toko
}

/**
 * Alur 2B: Jalur Trial (Item Baru) oleh S&B Controlling Specialist
 */
export interface TrialHargaItem {
  id: string;
  kodeMaster: string;
  item: string;
  ukuran: string;
  merk: string;
  hargaSatuan: number;
  tanggalTrial: string;
  status: 'PENDING_REGIONAL_MGR' | 'RELEASED' | 'REJECTED_REGIONAL_MGR';
  catatan?: string;
}

export interface PengajuanHargaFilterState {
  search: string;
  kategori: string;
  merk: string;
  implementasi: string;
}

/**
 * Helper untuk menggenerasi deskripsi otomatis berdasarkan parameter spesifikasi
 */
export function generateDeskripsiOtomatis(data: {
  item: string;
  ukuran: string;
  merk: string;
  warna: string;
  tipe: string;
  tebal?: string;
  permukaan: string;
  toleransi?: string;
  informasiTambahan?: string;
  implementasi?: string | string[];
  lokasi?: string | string[];
}): string {
  const parts: string[] = [];

  if (data.item?.trim()) parts.push(data.item.trim());
  if (data.ukuran?.trim()) parts.push(data.ukuran.trim());
  if (data.merk?.trim()) parts.push(data.merk.trim());
  if (data.warna?.trim()) parts.push(data.warna.trim());
  if (data.tipe?.trim()) {
    const cleanTipe = data.tipe.trim();
    parts.push(cleanTipe.toLowerCase().startsWith('tipe') ? cleanTipe : `Tipe ${cleanTipe}`);
  }
  if (data.tebal?.trim()) {
    const cleanTebal = data.tebal.trim();
    parts.push(cleanTebal.toLowerCase().startsWith('tebal') ? cleanTebal : `Tebal ${cleanTebal}`);
  }
  if (data.permukaan?.trim()) parts.push(data.permukaan.trim());
  if (data.toleransi?.trim()) {
    const cleanTol = data.toleransi.trim();
    parts.push(cleanTol.toLowerCase().startsWith('toleransi') ? cleanTol : `Toleransi ${cleanTol}`);
  }
  // TEPAT SEBELUM IMPLEMENTASI
  if (data.informasiTambahan?.trim()) {
    parts.push(`(${data.informasiTambahan.trim()})`);
  }
  if (data.implementasi && data.implementasi.length > 0) {
    const impls = Array.isArray(data.implementasi) ? data.implementasi.join(', ') : data.implementasi; parts.push(`(${impls})`);
  }
  if (data.lokasi && data.lokasi.length > 0) {
    const locs = Array.isArray(data.lokasi) ? data.lokasi.join(', ') : data.lokasi; const cleanLoc = locs.trim();
    parts.push(cleanLoc.toLowerCase().startsWith('area') ? cleanLoc : `Area ${cleanLoc}`);
  }

  return parts.join(' ').trim();
}

/**
 * Helper untuk menentukan:
 * 1. Kode Item (misal: "SIP-001"):
 *    Ditentukan oleh 7 field fisik material: item, ukuran, merk, warna, tipe, permukaan, dan ketebalan.
 *    - Jika ada 1 saja yang berbeda, maka akan menjadi kode dengan angka baru (SIP-002, SIP-003, dst.).
 *    - Jika ke-7 field fisik ini sama persis dengan item yang sudah ada, maka kode item sama.
 * 2. Kode Varian (A, B, C, dst.):
 *    Ditentukan HANYA dari kunci field lokasi!
 *    - Jika barang fisik sama (Kode Item sama) dan lokasi sama persis -> DUPLIKAT.
 *    - Jika barang fisik sama (Kode Item sama) tapi lokasi berbeda -> Varian baru (A, B, C, dst.).
 * 3. Kode Master:
 *    Format: [Kode Item]-[Kode Varian]-[Nama Material]
 */
export function getKodeData(data: {
  kategori?: string;
  item: string;
  implementasi?: string | string[];
  lokasi: string | string[];
  ukuran?: string;
  merk?: string;
  warna?: string;
  tipe?: string;
  permukaan?: string;
  tebal?: string;
  toleransi?: string;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
}): {
  kodeItem: string;
  kodeArea: string; // Varian A, B, C, dst.
  kodeMaster: string;
  isDuplicate: boolean;
  duplicateItem?: PengajuanHargaItem;
} {
  const norm = (s?: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normUkuran = (s?: string) => (s || '').trim().replace(/\s*cm$/i, '').replace(/\s+/g, '').toLowerCase();
  const normTebal = (s?: string) => (s || '').trim().replace(/\s*mm$/i, '').replace(/\s+/g, '').toLowerCase();

  const cleanItem = (data.item || 'Item').trim().replace(/\s+/g, '');
  const cleanUkuran = (data.ukuran || '').trim().replace(/\s*cm$/i, '').replace(/\s+/g, '');
  const existingItems = data.existingItems || [];
  const nextIndex = data.nextIndex || (existingItems.length + 1);

  const cItem = norm(data.item);
  const cUkuran = normUkuran(data.ukuran);
  const cMerk = norm(data.merk);
  const cWarna = norm(data.warna);
  const cTipe = norm(data.tipe);
  const cPermukaan = norm(data.permukaan);
  const cTebal = normTebal(data.tebal);
  const cLokasi = data.lokasi ? (Array.isArray(data.lokasi) ? data.lokasi.map(l => norm(l)).sort().join(',') : norm(data.lokasi)) : '';

  // 1. Cek apakah ada material dengan 7 spesifikasi fisik yang sama persis
  // (item, ukuran, merk, warna, tipe, permukaan, tebal)
  const isPhysicalMatch = (i: PengajuanHargaItem) => {
    if (!cItem) return false;
    return (
      norm(i.item) === cItem &&
      normUkuran(i.ukuran) === cUkuran &&
      norm(i.merk) === cMerk &&
      norm(i.warna) === cWarna &&
      norm(i.tipe) === cTipe &&
      norm(i.permukaan) === cPermukaan &&
      normTebal(i.tebal) === cTebal
    );
  };

  // Kumpulkan semua item yang memiliki 7 parameter fisik yang sama
  const physicalMatches = existingItems.filter(isPhysicalMatch);

  let kodeItem = '';
  let kodeVarian = 'A';
  let isDuplicate = false;
  let duplicateItem: PengajuanHargaItem | undefined;

  if (physicalMatches.length > 0) {
    // 7 field fisik SAMA -> Gunakan Kode Item yang sudah ada!
    const existingCode = physicalMatches[0].kode || '';
    const matchSIP = existingCode.match(/^(SIP-\d+)/i);
    kodeItem = matchSIP ? matchSIP[1].toUpperCase() : `SIP-${String(nextIndex).padStart(3, '0')}`;

    // 2. Tentukan Kode Varian HANYA berdasarkan lokasi
    const matchedLocationItem = physicalMatches.find(i => (Array.isArray(i.lokasi) ? i.lokasi.map(l => norm(l)).sort().join(',') : norm(i.lokasi)) === cLokasi);

    if (matchedLocationItem && cLokasi) {
      // Spesifikasi fisik sama DAN lokasi sama persis -> DUPLIKAT!
      isDuplicate = true;
      duplicateItem = matchedLocationItem;

      // Ambil kode varian dari item yang sudah ada
      const vMatch = (matchedLocationItem.kodeMaster || '').match(/SIP-\d+-([A-Z])-/i);
      kodeVarian = vMatch ? vMatch[1].toUpperCase() : 'A';
    } else {
      // Spesifikasi fisik sama tapi lokasi BERBEDA -> Varian baru (A, B, C, dst.)
      const usedVariants = new Set<string>();
      physicalMatches.forEach(i => {
        const vMatch = (i.kodeMaster || '').match(/SIP-\d+-([A-Z])-/i);
        if (vMatch) {
          usedVariants.add(vMatch[1].toUpperCase());
        }
      });

      let nextCharCode = 65; // 'A'
      while (usedVariants.has(String.fromCharCode(nextCharCode)) && nextCharCode <= 90) {
        nextCharCode++;
      }
      kodeVarian = String.fromCharCode(nextCharCode);
    }
  } else {
    // Ada minimal 1 parameter fisik yang BERBEDA -> Angka Baru!
    let maxSIP = 0;
    existingItems.forEach(i => {
      const match = (i.kode || '').match(/SIP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSIP) {
          maxSIP = num;
        }
      }
    });

    const nextSIPNum = Math.max(maxSIP + 1, nextIndex);
    kodeItem = `SIP-${String(nextSIPNum).padStart(3, '0')}`;
    kodeVarian = 'A';
  }

  const kodeMaster = `${kodeItem}-${kodeVarian}-${cleanItem}`;

  return {
    kodeItem,
    kodeArea: kodeVarian,
    kodeMaster,
    isDuplicate,
    duplicateItem,
  };
}

export function generateKodeMasterItem(data: {
  kategori?: string;
  item: string;
  implementasi?: string | string[];
  lokasi: string | string[];
  ukuran?: string;
  merk?: string;
  warna?: string;
  tipe?: string;
  permukaan?: string;
  tebal?: string;
  toleransi?: string;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
}): string {
  return getKodeData(data).kodeMaster;
}

