# SPARTA Dashboard Command Workspace

Tanggal: 22 Juni 2026  
Status: siap ditinjau sebelum implementasi

## 1. Tujuan

Merombak dashboard SPARTA Building menjadi workspace monitoring yang:

- nyaman dilihat dalam penggunaan panjang;
- menyesuaikan isi berdasarkan role dan cakupan cabang;
- mengelompokkan akses fitur berdasarkan alur kerja;
- mempertahankan seluruh data, filter, notifikasi, ekspor, dan aksi yang tersedia saat ini;
- mengganti modal rincian besar dengan workspace drill-down yang sesuai dengan jenis datanya;
- memindahkan kalkulasi status proyek yang rawan berbeda antara FE dan BE ke kontrak data yang lebih konsisten.

## 2. Temuan Audit

### Frontend

- `app/dashboard/page.tsx` berisi sekitar 2.968 baris dan menangani pengambilan data, kalkulasi bisnis, sidebar, dashboard, filter, ekspor, pagination, serta seluruh modal rincian.
- Menu pada `ALL_MENUS` masih ditampilkan sebagai daftar datar sehingga fitur migrasi, pelaksanaan, finalisasi, dan administrasi bercampur.
- Kalkulasi tahap proyek, perhatian/SLA, keterlambatan, denda, cost/m², nilai toko, dan nilai kontraktor tersebar di komponen UI.
- Tampilan rincian menggunakan dialog hampir selebar viewport dan mencampur beberapa pola presentasi data.
- Banyak data masih bertipe `any`, sehingga perubahan response backend mudah menimbulkan regresi yang tidak terdeteksi TypeScript.

### Backend

- `GET /api/dashboard/all` mengambil seluruh toko beserta banyak relasi sekaligus.
- Repository sudah menghindari sebagian N+1 dengan query batch, tetapi response tetap sangat lebar untuk kebutuhan ringkasan.
- Filter, sorting, pagination, dan sebagian besar kalkulasi dashboard dilakukan di browser.
- Status proyek dan SLA belum menjadi kontrak backend tunggal.

### Database dan environment

- Perubahan skema database bukan syarat awal.
- Indeks baru hanya ditambahkan jika hasil pemeriksaan query menunjukkan kebutuhan pada kolom filter/join seperti `toko.cabang`, `toko.nomor_ulok`, `rab.id_toko`, `pengajuan_spk.id_toko`, dan relasi opname.
- Nama environment yang sudah ada tetap digunakan. Tidak ada secret yang dipindahkan ke frontend.

## 3. Arah Visual

Nama konsep: **SPARTA Command Workspace**.

- Font utama: Geist.
- Sidebar dan permukaan utama berwarna putih/abu sangat muda.
- Merah Alfamart dipakai untuk identitas, aksi utama, status kritis, dan penanda aktif; bukan sebagai bidang latar besar.
- Bobot font didominasi 400–600. Bold 700 hanya untuk angka atau kondisi yang benar-benar perlu ditekankan.
- Logo Alfamart, nama SPARTA Building, dan Building Logo tetap tampil.
- Layout desktop padat namun tenang; layout tablet/mobile berubah menjadi drawer dan kolom tunggal.
- Informasi utama memakai garis, tabel, progress, timeline, dan panel terstruktur. Card hanya digunakan bila benar-benar mewakili satu objek independen.

## 4. Navigasi Berkelompok

Menu tetap mengikuti `ROLE_CONFIG`, tetapi item yang lolos akses dikelompokkan:

1. **Ringkasan**
   - Dashboard

2. **Perencanaan & RAB**
   - Project Planning
   - Penawaran Final Kontraktor
   - Ubah RAB Item

3. **Pelaksanaan Proyek**
   - Surat Perintah Kerja
   - Tambah Surat Perintah Kerja
   - Gantt Chart
   - PIC Pengawasan
   - Instruksi Lapangan

4. **Finalisasi & Arsip**
   - Opname
   - Dokumentasi Bangunan
   - Penyimpanan Dokumen
   - Daftar Dokumen

5. **Pusat Migrasi**
   - Migrasi RAB
   - Migrasi SPK
   - Migrasi Gantt
   - Migrasi Pengawasan
   - Migrasi Dokumen

6. **Kontrol Sistem**
   - Approval Dokumen
   - Intervensi
   - Manajemen User
   - fitur administratif lain sesuai role

Menu kosong tidak ditampilkan. Badge notifikasi tetap diterapkan pada item dan kelompok yang relevan.

## 5. Variasi Dashboard Berdasarkan Role

### Super Human

- cakupan nasional dan seluruh cabang;
- KPI risiko, proyek aktif, nilai SPK, dan perhatian;
- akses ke seluruh kelompok menu;
- daftar prioritas lintas cabang;
- filter cabang, lingkup SIPIL/ME, proyek, kontraktor, tahap, SLA, dan rentang tanggal;
- akses ekspor XLSX, CSV, dan PDF;
- shortcut intervensi dan manajemen user.

### Head Office dan manajemen regional/global

- fokus portfolio, performa cabang, biaya, kualitas, SLA, dan risiko;
- tidak menampilkan aksi yang tidak tersedia bagi role;
- cakupan nasional atau regional mengikuti `canViewAllBranches`.

### Operasional cabang

- fokus tugas yang harus dikerjakan;
- approval dan dokumen yang mendekati/melewati SLA;
- proyek cabang aktif;
- aksi cepat menuju form atau dokumen terkait;
- angka finansial sensitif mengikuti hak akses yang sudah ada.

### Kontraktor

- hanya data perusahaan sendiri;
- fokus penawaran, SPK, Gantt, opname, revisi, dan approval yang relevan;
- ekspor dashboard tetap dibatasi sesuai aturan backend yang ada.

## 6. Data Dashboard yang Dipertahankan

Tidak boleh ada data lama yang hilang:

- total toko/proyek;
- perlu perhatian;
- ongoing;
- done/serah terima;
- Approval RAB;
- Proses Gantt;
- Proses PJU;
- Approval SPK;
- Kerja Tambah Kurang;
- nilai penawaran;
- nilai SPK;
- denda resmi/estimasi;
- rata-rata JHK;
- rata-rata keterlambatan;
- nilai toko: desain, kualitas, spesifikasi;
- nilai kontraktor;
- Beanspot;
- cost/m² area terbangun, bangunan, dan terbuka;
- dokumen serah terima;
- badge revisi RAB, permintaan RAB Project Planning, dan approval;
- filter cabang, pencarian, refresh, serta ekspor.

Penamaan dapat diperjelas, tetapi arti dan sumber datanya tidak berubah tanpa persetujuan bisnis.

## 7. Komposisi Dashboard

### Header workspace

- identitas user, role, dan cabang/cakupan;
- pencarian global;
- notifikasi;
- refresh;
- ekspor bila diizinkan;
- filter cakupan yang relevan.

### Ringkasan utama

Empat metrik adaptif berdasarkan role. Untuk Super Human:

1. perlu tindakan;
2. proyek/toko aktif;
3. nilai SPK aktif;
4. risiko denda.

### Alur proyek

Tahap disajikan sebagai daftar proses vertikal dengan jumlah, proporsi, dan indikator perhatian:

1. Approval RAB;
2. Proses Gantt;
3. Proses PJU;
4. Approval SPK;
5. Ongoing;
6. Kerja Tambah Kurang;
7. Done.

### Prioritas

Daftar singkat berdasarkan severity dan dampak:

- kritis;
- melewati SLA;
- mendekati SLA;
- dokumen tidak lengkap;
- potensi denda.

### Insight sekunder

- nilai pekerjaan;
- kualitas;
- durasi/keterlambatan;
- cost/m²;
- performa kontraktor;
- Beanspot.

## 8. Pola Drill-down

Klik KPI atau tahap tidak membuka modal besar. Dashboard berpindah ke workspace rincian di area utama dengan breadcrumb dan tombol kembali.

### Struktur umum

- judul dan definisi metrik;
- pencarian lokal;
- filter kontekstual;
- sorting;
- jumlah hasil;
- tabel/list responsif;
- pagination server-side;
- panel inspector di desktop dan bottom sheet di mobile.

### Rincian Status Proyek

Kolom utama:

- toko/ULOK;
- cabang dan lingkup;
- tahap;
- status dokumen;
- umur tahap/SLA;
- nilai relevan;
- indikator perhatian.

Inspector:

- timeline RAB → Gantt/PJU → SPK → pelaksanaan → opname → ST;
- progress;
- dokumen tersedia;
- PIC/kontraktor;
- aksi menuju halaman proyek/dokumen.

### Rincian Perlu Perhatian

Kolom utama:

- severity;
- alasan perhatian;
- jumlah hari;
- tahap;
- estimasi dampak/denda;
- pemilik tindak lanjut.

### Rincian Finansial

Penawaran dan SPK memakai tabel komparatif per toko. Denda menampilkan sumber `Resmi` atau `Estimasi`, hari terlambat, tanggal acuan, dan tautan sumber.

### Rincian JHK dan Keterlambatan

Menampilkan tanggal mulai, target awal, tambahan hari yang disetujui, target efektif, tanggal ST, dan hasil perhitungan.

### Rincian Nilai Toko

Menampilkan skor total serta breakdown desain, kualitas, dan spesifikasi. Inspector menampilkan item opname yang membentuk nilai.

### Rincian Nilai Kontraktor

Menampilkan agregasi per kontraktor, jumlah toko, rata-rata nilai, distribusi nilai, dan daftar proyek.

### Rincian Cost/m²

Menampilkan sumber RAB atau Opname, luas, biaya, dan rasio untuk area terbangun, bangunan, serta terbuka.

### Rincian Beanspot

Menampilkan toko, cabang, ULOK, nilai Beanspot, dan sumber item pekerjaan.

## 9. Arsitektur Frontend

`app/dashboard/page.tsx` menjadi orchestrator tipis. Unit yang direncanakan:

- `dashboard-shell.tsx`;
- `dashboard-sidebar.tsx`;
- `dashboard-header.tsx`;
- `dashboard-overview.tsx`;
- `dashboard-pipeline.tsx`;
- `dashboard-priority-list.tsx`;
- `dashboard-detail-workspace.tsx`;
- renderer detail per konteks;
- hooks untuk query/filter/pagination;
- `lib/dashboard/*` untuk tipe, mapper, formatter, dan aturan presentasi.

Komponen tidak mendefinisikan komponen lain di dalam render. Data turunan murah dihitung langsung; kalkulasi berat dimemoisasi atau dipindahkan ke mapper/backend.

## 10. Perubahan Backend

Endpoint lama dipertahankan sementara untuk kompatibilitas.

Endpoint baru:

- `GET /api/dashboard/summary`
  - menerima role, cabang, perusahaan, dan filter;
  - mengembalikan KPI, tahap, perhatian, dan insight ringkas.

- `GET /api/dashboard/projects`
  - pagination, search, filter, sorting;
  - mengembalikan row yang sudah memiliki stage, SLA, severity, nilai, dan status dokumen.

- `GET /api/dashboard/projects/:tokoId`
  - mengembalikan detail/timeline proyek dan tautan dokumen.

- endpoint rincian agregat dapat memakai `type` pada `/projects` atau route khusus bila query-nya berbeda secara material.

Backend menjadi sumber tunggal untuk:

- stage proyek;
- SLA/attention;
- tanggal target efektif;
- hari keterlambatan;
- sumber dan nilai denda.

Aturan role dan company scope wajib diterapkan kembali di backend, tidak hanya disembunyikan di UI.

## 11. Error, Loading, dan Empty State

- skeleton per bagian, bukan overlay penuh;
- error ringkasan tidak menghilangkan navigasi;
- retry tersedia pada bagian yang gagal;
- empty state menjelaskan filter aktif dan memberi aksi reset;
- badge “data diperbarui” memakai timestamp response backend;
- ekspor dan refresh menampilkan status tanpa memblokir seluruh dashboard.

## 12. Aksesibilitas dan Responsiveness

- ukuran teks utama minimal 12–14px pada aplikasi aktual;
- target klik minimal 40px;
- warna status selalu disertai teks/ikon;
- fokus keyboard terlihat;
- tabel mempunyai alternatif stacked rows pada layar kecil;
- sidebar menjadi drawer;
- inspector menjadi bottom sheet atau halaman lanjutan;
- `prefers-reduced-motion` dihormati.

## 13. Pengujian

### Frontend

- unit test mapper/status presentation;
- test akses menu per role;
- test filter dan pagination;
- test klik KPI → workspace detail → inspector;
- test empty/error/loading state;
- test responsif desktop, tablet, dan mobile;
- typecheck dan lint.

### Backend

- test stage dan SLA untuk setiap cabang kondisi;
- test denda resmi vs estimasi;
- test scope role/cabang/perusahaan;
- test pagination/filter/sort;
- test query dengan dataset besar;
- typecheck.

### Verifikasi visual

- Super Human;
- Head Office/manajemen;
- operasional cabang;
- kontraktor;
- data kosong;
- data padat;
- nilai rupiah panjang;
- nama toko/kontraktor panjang.

## 14. Urutan Implementasi

1. ekstraksi tipe dan aturan bisnis dashboard;
2. endpoint summary/projects/detail;
3. shell dan navigasi berkelompok;
4. overview role-adaptive;
5. workspace rincian per konteks;
6. ekspor, notifikasi, dan aksi dokumen;
7. responsive/accessibility;
8. typecheck, build, dan browser verification;
9. penghapusan kode dashboard lama setelah seluruh parity check lulus.

## 15. Kriteria Selesai

- seluruh metrik dan konteks detail lama tersedia;
- role dan scope menghasilkan data yang benar;
- tidak ada modal rincian dashboard selebar viewport;
- navigasi migrasi dan fitur terkait terkumpul secara jelas;
- dashboard utama tidak memuat seluruh detail relasi jika belum dibutuhkan;
- tampilan sesuai konsep Super Human yang disetujui;
- FE dan BE lulus typecheck/build;
- alur utama diverifikasi di browser pada beberapa role dan ukuran layar.
