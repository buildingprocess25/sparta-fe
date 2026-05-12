# Dokumentasi API & Logika Dashboard Statistik (Updated)

Dokumentasi ini mencakup alur logika dari halaman **Dashboard** (`app/dashboard/page.tsx`), secara spesifik membedah bagaimana aplikasi mengambil data secara *real-time* dan melakukan kalkulasi untuk setiap indikator (_Stat-Card_) di layar.

## 1. Mekanisme Pengambilan Data (Data Fetching)
Dashboard berpusat pada satu fungsi API tunggal yaitu `fetchDashboardAll()` (Endpoint: `GET /api/dashboard`).
- API ini melakukan **Join/Include Data Massal** (RAB, SPK, Tambah SPK, Opname Final, dan Berkas Serah Terima).
- **Filtering Akses**: Jika _role_ pengguna bukan dari `HEAD OFFICE`, _frontend_ akan otomatis memfilter proyek di sisi klien sehingga *user* hanya melihat data cabang miliknya.
- **Background Loading**: Aplikasi melakukan _lazy-loading_ detail RAB (`fetchRABDetail`) dan rincian item opname untuk kalkulasi rasio biaya dan skor kualitas tanpa menghambat render awal.

## 2. Pengelompokkan Funnel (Project Phases)
Proyek diklasifikasikan ke dalam Funnel berdasarkan status dokumen (dari akhir ke awal):
1. **Done**: Opname Final `DISETUJUI`.
2. **Kerja Tambah Kurang**: Terdapat Berkas Serah Terima ATAU Opname Final belum `DISETUJUI`.
3. **Ongoing**: SPK berstatus `APPROVED`/`ACTIVE`.
4. **Approval SPK**: SPK berstatus `WAITING_FOR_BM_APPROVAL`.
5. **Proses PJU**: RAB `DISETUJUI` namun belum ada SPK.
6. **Approval RAB**: RAB masih dalam proses persetujuan.

## 3. Logika Stat-Card Utama

### 3.1 Nilai Finansial & Beanspot
- **Total Penawaran (RAB)**: Akumulasi `grand_total_final` dari dokumen RAB.
- **Total Nilai SPK**: Akumulasi `grand_total` dari SPK (kecuali status `REJECTED`/`CANCELLED`).
- **Nominal Beanspot**: Sistem secara spesifik memfilter item RAB dengan kategori `PEKERJAAN BEANSPOT` untuk memantau rata-rata investasi Beanspot per toko.

### 3.2 Indikator Kinerja Waktu & Keterlambatan
- **JHK (Jumlah Hari Kerja)**: `Durasi SPK` + `Total Pertambahan Hari` + `Keterlambatan`.
- **Keterlambatan (Delay)**: Selisih hari antara tanggal *Deadline* dan tanggal pembuatan `Berkas Serah Terima`.
- **Denda**: Denda keterlambatan dihitung berjenjang (Rp 1jt/hari untuk 5 hari pertama, Rp 500rb/hari berikutnya) dengan batas maksimal Rp 10.000.000 per proyek.

### 3.3 Penilaian Kualitas (Scoring)
Ini adalah fitur baru untuk mengukur performa kontraktor dan kualitas hasil lapangan:
- **Nilai Toko (Quality Score)**: Dihitung dari item opname dengan bobot:
  - **Desain (30%)**: Berdasarkan status "Sesuai".
  - **Kualitas (35%)**: Berdasarkan status "Baik".
  - **Spesifikasi (35%)**: Berdasarkan status "Sesuai".
- **Nilai Kontraktor**: Rata-rata dari seluruh `Nilai Toko` yang dikerjakan oleh kontraktor tersebut. Memberikan gambaran performa vendor secara agregat.

### 3.4 Monitoring SLA (Perhatian)
Kartu "Perhatian" memonitor ambang batas keterlambatan:
- **RAB**: > 2 hari (Belum Disetujui).
- **PJU**: > 10 hari (RAB Approved tapi belum SPK).
- **SPK**: > 2 hari (Menunggu Approval BM).
- **Ongoing**: Melewati batas JHK yang diizinkan.
- **Opname**: > 14 hari (Belum Disetujui).

## 4. Fitur Detail & Drill-down
Setiap kartu statistik dapat diklik untuk membuka **Monitoring Rincian Data**:
- **Pagination**: Menampilkan 5 data per halaman untuk menjaga performa UI.
- **Breakdown View (Expanded Row)**:
  - **Cost/m2**: Rincian biaya per m2 untuk area Terbangun, Bangunan, dan Terbuka.
  - **JHK**: Rincian durasi SPK vs Pertambahan vs Delay.
  - **Nilai Toko**: Rincian poin untuk aspek Desain, Kualitas, dan Spesifikasi.
- **Contractor Ranking**: Menampilkan daftar kontraktor beserta rata-rata nilai dan jumlah toko yang ditangani.
