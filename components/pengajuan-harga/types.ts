// =============================================================================
// components/pengajuan-harga/types.ts
// Kontrak Data & Workflow Types untuk Modul Pengajuan Master Harga
// =============================================================================

export interface SurveyTokoItem {
  namaToko: string;
  hargaSatuan: number;
  tanggalSurvei: string;
  catatan?: string;
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
  role: 'B&M Manager' | 'S&B Specialist' | 'Regional Manager' | 'Kontraktor' | 'Building Coord';
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REVISE' | 'MASTERING';
  tanggal: string;
  catatan?: string;
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
  lokasi: string;
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
  implementasi: 'Dinding' | 'Lantai' | string;
  lokasi: string;
  toleransi?: string;
  informasiTambahan?: string;
  deskripsiOtomatis: string;
  estimasiHarga?: number;
  satuan?: string;
  
  // Status Persetujuan
  status:
    | 'DIAJUKAN'
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
    | 'DITOLAK_SB';

  // Prasyarat Administrasi & Koefisien AHSP
  koefisienUpah?: number;
  koefisienMaterial?: number;
  koefisienAlat?: number;
  catatanReview?: string;
  surveyToko?: SurveyTokoItem[];
  rincianAHSP?: AHSPKomponen[];
  koefisienUpahItems?: KoefisienDetailItem[];
  koefisienMaterialItems?: KoefisienDetailItem[];
  historyLog?: ApprovalLog[];

  tanggalPengajuan?: string;
}

export interface KoefisienDetailItem {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  isCustom?: boolean;
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
  permukaan: string;
  lokasi: string;
  informasiTambahan?: string;
  implementasi: string;
}): string {
  const parts: string[] = [];

  if (data.item) parts.push(data.item.trim());
  if (data.ukuran) parts.push(data.ukuran.trim());
  if (data.merk) parts.push(data.merk.trim());
  if (data.warna) parts.push(data.warna.trim());
  if (data.tipe) parts.push(`Tipe ${data.tipe.trim()}`);
  if (data.permukaan) parts.push(data.permukaan.trim());
  if (data.lokasi) parts.push(data.lokasi.trim());
  if (data.informasiTambahan && data.informasiTambahan.trim()) {
    parts.push(data.informasiTambahan.trim());
  }

  let result = parts.join(' ');
  if (data.implementasi && data.implementasi.trim()) {
    result += ` (${data.implementasi.trim()})`;
  }

  return result.trim();
}

/**
 * Helper untuk menentukan Kode Item (misal: "SIP-001")
 * dan Kode Master Item (format: "Kode-Kode Varian-Nama Material-Ukuran", misal: "SIP-001-A-Keramik-60x60")
 * 
 * Aturan Hierarki:
 * 1. Scope Pekerjaan (Parent SIP): Kategori Pekerjaan + Nama Material + Posisi Bidang + Area/Ruangan
 *    -> Jika sama, mengelompok ke Kode SIP yang sama (misal: SIP-001).
 * 2. Varian Spesifikasi (Child Variant A, B, C, dst.):
 *    -> Ditentukan oleh perbedaan Ukuran, Merk, Tipe, Warna, Permukaan, Tebal, Toleransi.
 *    -> Jika seluruh spesifikasi fisik sama persis dengan varian yang sudah ada -> DUPLIKAT!
 *    -> Jika ada spesifikasi fisik yang berbeda -> VARIAN BARU dengan suffix A, B, C, dst.
 */
export function getKodeData(data: {
  kategori?: string;
  item: string;
  implementasi?: string;
  lokasi: string;
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

  const cKategori = norm(data.kategori);
  const cItem = norm(data.item);
  const cImplementasi = norm(data.implementasi);
  const cLokasi = norm(data.lokasi);

  const cUkuran = normUkuran(data.ukuran);
  const cMerk = norm(data.merk);
  const cWarna = norm(data.warna);
  const cTipe = norm(data.tipe);
  const cPermukaan = norm(data.permukaan);
  const cTebal = normTebal(data.tebal);
  const cToleransi = norm(data.toleransi);

  // 1. Cari Parent Group berdasarkan [Kategori + Material + Posisi + Area]
  const parentGroup = existingItems.filter(i => {
    if (!cItem || !cLokasi) return false;
    const matchItem = norm(i.item) === cItem;
    const matchLokasi = norm(i.lokasi) === cLokasi;
    const matchKategori = !cKategori || !i.kategori || norm(i.kategori) === cKategori;
    const matchImplementasi = !cImplementasi || !i.implementasi || norm(i.implementasi) === cImplementasi;
    return matchItem && matchLokasi && matchKategori && matchImplementasi;
  });

  let kodeItem = '';
  let kodeVarian = 'A';
  let isDuplicate = false;
  let duplicateItem: PengajuanHargaItem | undefined;

  if (parentGroup.length > 0) {
    // Gunakan Kode SIP dari group parent yang sudah ada
    const firstCode = parentGroup[0].kode || '';
    const matchSIP = firstCode.match(/^(SIP-\d+)/i);
    kodeItem = matchSIP ? matchSIP[1].toUpperCase() : `SIP-${String(nextIndex).padStart(3, '0')}`;

    // Cek apakah spesifikasi fisik ini cocok persis dengan salah satu varian yang sudah ada
    const matchedExisting = parentGroup.find(i => {
      // Hanya bandingkan jika spesifikasi input sudah terisi
      if (!cUkuran && !cMerk) return false;
      const isSameUkuran = normUkuran(i.ukuran) === cUkuran;
      const isSameMerk = norm(i.merk) === cMerk;
      const isSameWarna = !cWarna || !i.warna || norm(i.warna) === cWarna;
      const isSameTipe = !cTipe || !i.tipe || norm(i.tipe) === cTipe;
      const isSamePermukaan = !cPermukaan || !i.permukaan || norm(i.permukaan) === cPermukaan;
      const isSameTebal = !cTebal || !i.tebal || normTebal(i.tebal) === cTebal;
      const isSameToleransi = !cToleransi || !i.toleransi || norm(i.toleransi) === cToleransi;

      return (
        isSameUkuran &&
        isSameMerk &&
        isSameWarna &&
        isSameTipe &&
        isSamePermukaan &&
        isSameTebal &&
        isSameToleransi
      );
    });

    if (matchedExisting && cItem && cUkuran && cMerk) {
      isDuplicate = true;
      duplicateItem = matchedExisting;

      // Ambil kode huruf varian dari item yang sudah ada
      const vMatch = (matchedExisting.kodeMaster || '').match(/SIP-\d+-([A-Z])-/i);
      kodeVarian = vMatch ? vMatch[1].toUpperCase() : 'A';
    } else {
      // Varian Baru di bawah Kode SIP yang sama!
      // Hitung huruf varian berikutnya (A, B, C, ...)
      const usedVariants = new Set<string>();
      parentGroup.forEach(i => {
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
    // Belum pernah ada di scope [Kategori + Material + Posisi + Area]
    // Generate Kode SIP baru
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

  const kodeMaster = `${kodeItem}-${kodeVarian}-${cleanItem}-${cleanUkuran || 'Default'}`;

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
  implementasi?: string;
  lokasi: string;
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
