# Dokumentasi API & Logika Dashboard Statistik

Dokumentasi ini mencakup alur logika dari halaman **Dashboard** (`app/dashboard/page.tsx`), secara spesifik membedah bagaimana aplikasi mengambil data secara *real-time* dan melakukan kalkulasi untuk setiap indikator (_Stat-Card_) di layar.

## 1. Mekanisme Pengambilan Data (Data Fetching)
Dashboard berpusat pada satu fungsi API tunggal yaitu `fetchDashboardAll()` (Endpoint: `GET /api/dashboard`).
- API ini dirancang untuk melakukan **Join/Include Data Massal**, yang berarti ia tidak hanya mengambil data `Toko/ULOK`, melainkan juga berelasi (_nested_) dengan seluruh tabel turunannya, yaitu: `RAB`, `SPK`, `Pertambahan SPK`, `Opname Final`, dan `Berkas Serah Terima`.
- **Filtering Akses**: Jika _role_ pengguna bukan dari `HEAD OFFICE` (misalnya "BRANCH BUILDING SUPPORT" cabang "MALANG"), _frontend_ akan otomatis memfilter _array_ proyek di sisi klien sehingga *user* hanya memproses dan melihat kalkulasi statistik untuk cabang "MALANG" saja.

## 2. Pengelompokkan Funnel (Project Phases)
Dasbor menggunakan array data gabungan untuk mengklasifikasikan setiap proyek (toko) ke dalam salah satu tahapan (Funnel). Logika pemetaan (_Mapping_) pada variabel `cat` adalah sebagai berikut, dari fase akhir ke awal:
1. **Done**: Terdapat data Opname Final dan berstatus `DISETUJUI`.
2. **Kerja Tambah Kurang**: Terdapat data Berkas Serah Terima, ATAU terdapat data Opname Final namun belum `DISETUJUI`.
3. **Ongoing**: Terdapat SPK dan statusnya `APPROVED`/`ACTIVE`.
4. **Approval SPK**: Terdapat SPK namun statusnya masih `WAITING_FOR_BM_APPROVAL`.
5. **Proses PJU**: Terdapat RAB yang berstatus `DISETUJUI` namun belum dibuatkan SPK.
6. **Approval RAB**: RAB masih dalam proses persetujuan.

## 3. Logika Stat-Card Utama

### 3.1 Nilai Finansial (RAB vs SPK)
- **Total Penawaran (RAB)**: Dihitung dengan mengakumulasi nilai `grand_total_final` dari dokumen RAB setiap proyek.
- **Total Nilai SPK**: Dihitung dari `total_harga` / `grand_total` dari dokumen SPK. Status `REJECTED` atau `CANCELLED` dilewati (tidak dihitung), sementara yang menunggu _approval_ atau aktif tetap dihitung sebagai proyeksi nilai.

### 3.2 Indikator Kinerja Waktu & Keterlambatan
Sistem melakukan simulasi kalender (_Date Math_) untuk mencari:
- **JHK (Jumlah Hari Kerja)**: Merupakan penjumlahan antara `durasi` asli SPK ditambah total hari dari `Pertambahan SPK` (jika ada addendum yang disetujui).
- **Keterlambatan (Delay)**: Sistem mencari tanggal *Deadline* `(Waktu Mulai SPK + JHK)`. Kemudian membandingkannya dengan tanggal dokumen `Berkas Serah Terima` dibuat. Jika lewat dari _deadline_, selisih hari dikalkulasi sebagai Keterlambatan.
- **Total Denda**: Apabila terdapat keterlambatan, maka denda dihitung berjenjang:
  - 5 hari pertama terlambat = Rp 1.000.000 / hari.
  - Hari ke-6 sampai ke-10 terlambat = Rp 500.000 / hari.
  - Nilai denda dibatasi pada maksimal Rp 10.000.000 per proyek.

### 3.3 Indikator "Perhatian" (SLA Violation Monitoring)
Kartu "Perhatian" memonitor pelanggaran SLA (Service Level Agreement):
- **Approval RAB**: Dianggap "Perhatian" jika usia dokumen RAB lebih dari **2 hari** dan belum disetujui.
- **Proses PJU**: Dianggap "Perhatian" jika RAB sudah disetujui namun lebih dari **10 hari** belum diterbitkan SPK.
- **Approval SPK**: Dianggap "Perhatian" jika usia dokumen SPK lebih dari **2 hari** namun belum disetujui BM.
- **Ongoing**: Dianggap "Perhatian" jika hari berjalan sudah melewati kalkulasi JHK maksimal.
- **Kerja Tambah Kurang**: Dianggap "Perhatian" jika dokumen Opname dibuat namun belum mendapat persetujuan (_Approved_) lebih dari **14 hari**.

### 3.4 Rasio Cost / Meter Persegi (Area Terbuka vs Bangunan)
Kalkulasi ini dirancang untuk mencari "Berapa modal yang dihabiskan untuk membangun per m2?".
- Aplikasi melakukan pemanggilan `fetchRABDetail` sekunder secara asinkron di belakang layar (_Background Fetching_) untuk setiap ID RAB.
- Sistem mengklasifikasikan "Item RAB" berdasarkan `kategori_pekerjaan`. Jika kategori tersebut memuat kata `AREA TERBUKA`, maka harganya masuk ke *bucket* Area Terbuka. Sisanya masuk ke *bucket* Bangunan.
- Total harga di *bucket* masing-masing dibagi dengan luas bangunan aktual (`luas_area_terbuka` atau `luas_bangunan`) untuk memperoleh rasio rata-rata harga per meter perseginya.
