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
  status?: 'DRAFT' | 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';
  tanggalPengajuan?: string;
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
 * dan Kode Master Item (format: "Kode-kode area/ruangan-nama material-ukuran", misal: "SIP-001-A-Keramik-60x60")
 * 
 * Aturan:
 * - Jika nama material, ukuran, dan merk sama persis dengan item yang sudah ada,
 *   gunakan Kode Item yang sama (misal "SIP-001").
 *   - Jika areanya sama: kode area tetap 'A'.
 *   - Jika area/ruangannya beda: kode area menjadi 'B', 'C', dst.
 * - Jika kombinasi material/ukuran/merk belum pernah ada:
 *   terbitkan Kode Item baru (misal "SIP-007") dengan kode area 'A'.
 */
export function getKodeData(data: {
  item: string;
  ukuran: string;
  merk: string;
  lokasi: string;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
}): {
  kodeItem: string;
  kodeArea: string;
  kodeMaster: string;
} {
  const cleanItem = (data.item || 'Item').trim().replace(/\s+/g, '');
  const cleanUkuran = (data.ukuran || '').trim().replace(/\s*cm$/i, '').replace(/\s+/g, '');
  const cleanMerk = (data.merk || '').trim().toLowerCase();
  const cleanLokasi = (data.lokasi || '').trim().toLowerCase();
  const existingItems = data.existingItems || [];
  const nextIndex = data.nextIndex || (existingItems.length + 1);

  // Cari item-item yang memiliki material, ukuran, dan merk yang sama
  const matchingGroup = existingItems.filter(i => {
    const mItem = (i.item || '').trim().toLowerCase() === (data.item || '').trim().toLowerCase();
    const mUkuran = (i.ukuran || '').trim().replace(/\s*cm$/i, '').toLowerCase() === cleanUkuran.toLowerCase();
    const mMerk = (i.merk || '').trim().toLowerCase() === cleanMerk;
    return mItem && mUkuran && mMerk;
  });

  let kodeItem = '';
  let kodeArea = 'A';

  if (matchingGroup.length > 0) {
    // Ambil Kode Item murni (misal "SIP-001") dari item pertama di grup yang sama
    const firstCode = matchingGroup[0].kode || '';
    const match = firstCode.match(/^(SIP-\d+)/);
    kodeItem = match ? match[1] : `SIP-${String(nextIndex).padStart(3, '0')}`;

    // Kumpulkan lokasi unik yang sudah terdaftar dalam grup ini
    const registeredLocations: string[] = [];
    matchingGroup.forEach(item => {
      const loc = (item.lokasi || '').trim().toLowerCase();
      if (!registeredLocations.includes(loc)) {
        registeredLocations.push(loc);
      }
    });

    let areaIndex = registeredLocations.indexOf(cleanLokasi);
    if (areaIndex === -1) {
      // Area baru untuk item yang sama: lanjutkan ke B, C, dst.
      areaIndex = registeredLocations.length;
    }
    kodeArea = String.fromCharCode(65 + Math.min(areaIndex, 25));
  } else {
    // Kombinasi baru: cari nomor SIP tertinggi di existingItems
    let maxSIP = nextIndex;
    existingItems.forEach(i => {
      const match = (i.kode || '').match(/SIP-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= maxSIP) {
          maxSIP = num + 1;
        }
      }
    });
    kodeItem = `SIP-${String(maxSIP).padStart(3, '0')}`;
    kodeArea = 'A';
  }

  const kodeMaster = `${kodeItem}-${kodeArea}-${cleanItem}-${cleanUkuran}`;

  return {
    kodeItem,
    kodeArea,
    kodeMaster,
  };
}

export function generateKodeMasterItem(data: {
  item: string;
  ukuran: string;
  merk: string;
  lokasi: string;
  nextIndex?: number;
  existingItems?: PengajuanHargaItem[];
}): string {
  return getKodeData(data).kodeMaster;
}



