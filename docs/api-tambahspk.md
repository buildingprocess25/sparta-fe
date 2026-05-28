# Dokumentasi Logika UI - Fitur Tambah SPK (Addendum)

Terakhir diperbarui: 2026-05-28

Dokumentasi ini menjelaskan secara spesifik logika pada sisi antarmuka (*Frontend*) untuk pengajuan **Pertambahan Hari SPK (Addendum/CCO)** yang berada di berkas `app/tambahspk/page.tsx`.

Catatan: Untuk detail *Endpoint* API dan struktur *Payload* pengajuan Pertambahan SPK, lihat dokumentasi backend `sparta-be/docs/api-pertambahan-spk.md`.

## 1. Hak Akses (Role Base Access)
Tidak semua orang dapat mengakses form ini. Berdasarkan fungsi `useEffect`, pengajuan addendum hanya dibatasi untuk role:
- `BRANCH BUILDING & MAINTENANCE MANAGER`
- `BRANCH BUILDING SUPPORT DOKUMENTASI`

Sistem akan otomatis melempar _(redirect)_ kembali ke Dashboard jika _role_ pengguna tidak sesuai.

## 2. Kalkulasi Tanggal Otomatis (Auto-Calculation)
Sistem meminimalisir *human error* dengan tidak mengizinkan pengguna memilih kalender akhir secara manual:
- Saat pengguna memilih sebuah "SPK Approved", sistem menangkap `waktu_selesai` (Tanggal Akhir SPK) yang berlaku.
- Pengguna cukup menginput **Jumlah Hari** perpanjangan.
- Fungsi pembantu `addDays(tanggalSpkAkhir, parseInt(pertambahanHari))` akan secara dinamis (menggunakan `useMemo`) mengkalkulasi dan menampilkan tanggal "SPK Akhir Setelah Perpanjangan" ke layar. Angka ini yang kemudian dikirim ke backend.

## 3. Logika Pemblokiran & Revisi (Validation Rules)

Karena SPK hanya bisa memiliki 1 proses pengajuan aktif, *state* antarmuka memiliki aturan ketat:

### 3.1 Status Pending (Form Disabled)
Apabila sistem mendeteksi ada riwayat pengajuan perpanjangan untuk SPK terpilih yang masih berstatus `Menunggu Persetujuan` (belum dijawab oleh BM), maka **seluruh form otomatis di-disable** (transparan & tidak bisa di-klik) untuk mencegah pengajuan ganda / *spam*.

### 3.2 Mode Revisi (Ditolak BM)
Jika pengajuan terakhir berstatus `Ditolak BM`, sistem akan masuk ke **Mode Revisi**:
1. Menampilkan **Modal Popup Merah** yang berisi Alasan Penolakan dari BM.
2. Mengisi ulang (*Auto-populate*) seluruh *form* dengan data pengajuan lama agar PIC tidak perlu mengetik dari awal.
3. **Validasi Perubahan Wajib:** Variabel `isRevisiUnchanged` akan aktif. Tombol submit tidak akan bisa ditekan jika PIC tidak mengubah *minimal 1 karakter* (baik hari, alasan, atau dokumen baru) dibandingkan pengajuan yang ditolak. Ini mencegah pengajuan ulang data yang sama persis.
4. Ketika dikirim, sistem menggunakan `updatePertambahanSPK` (PUT/Revisi), bukan POST data baru.

## 4. Endpoint yang Dipakai Frontend

Fungsi API berada di `lib/api.ts`.

| Fungsi FE | Endpoint | Keterangan |
| --- | --- | --- |
| `fetchSPKList({ status: "SPK_APPROVED" })` | `GET /api/spk?status=SPK_APPROVED` | Mengambil SPK yang sudah disetujui sebagai sumber pilihan. |
| `fetchPertambahanSPKList({ id_spk })` | `GET /api/pertambahan-spk?id_spk=:id_spk` | Mengecek riwayat perpanjangan untuk SPK terpilih. |
| `submitPertambahanSPK(payload)` | `POST /api/pertambahan-spk` | Membuat pengajuan baru. Bisa JSON atau multipart jika ada `file_lampiran_pendukung`. |
| `updatePertambahanSPK(id, payload)` | `PUT /api/pertambahan-spk/:id` | Mengirim revisi dari pengajuan yang ditolak BM. |
| `downloadPertambahanSPKLampiran(id)` | `GET /api/pertambahan-spk/:id/lampiran-pendukung` | Mengunduh lampiran pendukung pengajuan terakhir. |
| `sendEmailNotification(payload)` | `POST /api/send-email-notification` | Mengirim notifikasi email ke Branch Manager setelah submit/revisi berhasil. |

Payload notifikasi email setelah submit/revisi berhasil:

```json
{
  "cabang": "BATAM",
  "id_toko": 123,
  "flag": "send-notification-pertambahan-spk"
}
```

Jika pengiriman email gagal, data pertambahan SPK tetap dianggap berhasil tersimpan. Error email hanya dicatat ke console agar alur submit tidak gagal karena masalah Gmail/notifikasi.

## 5. Mode Lampiran Opsional
Lampiran bersifat opsional.
Jika PIC menemukan bahwa ada *existing* lampiran dari revisi sebelumnya dan tidak mengupload lampiran baru, sistem membiarkannya. Jika PIC mengunggah file gambar (JPG/PNG), *Thumbnail Preview* akan otomatis digenerate dan ditampilkan di atas form upload (`URL.createObjectURL`).

## 6. Status Submit Sukses

Setelah `POST` atau `PUT` berhasil:

1. Frontend memanggil email notification dengan flag `send-notification-pertambahan-spk`.
2. Modal sukses ditampilkan.
3. User diarahkan kembali ke dashboard saat menekan tombol kembali.
