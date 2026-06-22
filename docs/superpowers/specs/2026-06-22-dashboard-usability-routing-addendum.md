# Dashboard Usability and Role-Aware Routing Addendum

Tanggal: 22 Juni 2026

## Perubahan Visual

- Ringkasan SPK tidak memakai panel hitam besar; gunakan permukaan putih dengan aksen merah Alfamart.
- Data yang sudah tampil pada panel Nilai Pekerjaan tidak diulang di Ringkasan Lengkap.
- Beanspot disembunyikan dari dashboard dan drill-down.
- Cost/m² memakai palet putih, slate, dan merah; tidak memakai hijau dominan.
- Setiap keluarga data mempertahankan layout khusus, tetapi kepadatan informasi dan hierarki teks diperhalus.

## SLA

- SLA menampilkan kondisi yang mudah dipahami: Dalam target, Mendekati batas, Lewat SLA, dan Kritis.
- Keterangan mencantumkan aturan batas, umur tahap, serta selisih hari.
- Semua data yang melewati SLA masuk ke Prioritas SLA.
- Prioritas SLA dapat dibuka dan diarahkan ke data ULOK terkait.

## Format Tanggal

Semua tanggal dashboard menggunakan locale Indonesia dengan format `tanggal nama-bulan tahun`, contoh `22 Juni 2026`.

## Navigasi Data

- Aksi membuka data ULOK/dokumen spesifik dalam aplikasi.
- Jika detail ID tersedia, buka data spesifik; jika tidak, buka daftar dengan kategori dan pencarian ULOK terisi.
- Navigasi mengikuti akses menu role.
- Jika user hanya boleh melihat, buka tujuan dalam mode read-only.
- Jika user tidak memiliki akses, aksi tidak ditampilkan dan UI menjelaskan role yang perlu dihubungi.
- Backend tetap menjadi pengaman scope cabang/perusahaan.
