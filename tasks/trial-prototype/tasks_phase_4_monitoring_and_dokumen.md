# Phase 4: Active Trial Monitoring and Official Document Generator
**Target Aplikasi:** `sparta-fe`  
**Fokus:** Pemantauan Item `TRIAL_AKTIF`, Generator Dokumen Resmi Trial (PDF Ready), & Widget Countdown  
**Dokumen Referensi:** [dokumen-master-alur-dan-prototipe-trial.md](file:///C:/Users/UDevran/.gemini/antigravity/brain/0358315d-2502-45a9-933b-5cf52b2f56c1/dokumen-master-alur-dan-prototipe-trial.md)

---

## 1. Overview
Fase ini berfokus pada visualisasi item saat berada dalam masa aktif uji coba lapangan (`TRIAL_AKTIF`). Sistem secara otomatis menerbitkan **Dokumen Pelaksanaan Trial** yang dapat dilihat dan diunduh/dicetak. Item pada tahap ini secara eksplisit diberi label bahwa item tersebut sah digunakan untuk transaksi pembuatan SPK cabang. Disediakan tombol simulasi agar penguji dapat mempercepat waktu habisnya durasi trial untuk kebutuhan demonstrasi.

---

## 2. Tasks

### 2.1. Dokumen Pelaksanaan Trial (PDF Template & Modal)
- [ ] **Task 4.1: Komponen Dokumen Pelaksanaan Trial Resmi**
  - **File:** `components/prototipe-trial/DokumenTrialModal.tsx`
  - **Spesifikasi:**
    - Format surat resmi standar perusahaan:
      - Kop Surat: PT Sumber Alfaria Trijaya Tbk - Divisi Building & Maintenance.
      - Nomor Registrasi Unik: `SPARTA/TRIAL/YYYYMM/{KODE_ITEM}`.
      - Periode Uji Coba: Tanggal Mulai s/d Tanggal Berakhir (Durasi 2-4 Bulan).
      - Rincian Spesifikasi Material & Lingkup Pekerjaan.
      - Lokasi Cabang Uji Coba Terdaftar.
      - Harga Satuan Trial yang Disetujui.
      - Klausul legalitas pelaksanaan uji coba lapangan.
      - Stempel verifikasi digital & kode batang (barcode) sistem.
    - Tombol aksi: **"Cetak / Unduh PDF"** (menggunakan browser print trigger atau jspdf jika diperlukan) dan **"Tutup"**.
  - **Code Standard Check:** Tampilan dokumen bersih dengan styling cetak (*print-friendly CSS*).

### 2.2. Halaman Monitoring Trial Aktif (Katalog Master Trial)
- [ ] **Task 4.2: Halaman Katalog Monitoring Trial**
  - **File:** `app/prototipe-trial/monitoring-trial/page.tsx`
  - **Spesifikasi:**
    - Tabel katalog seluruh item yang berstatus `TRIAL_AKTIF`.
    - Kolom tabel: Kode Item, Nama Material, Cabang, Durasi (2-4 Bln), Tanggal Terbit, Sisa Hari Masa Aktif, Status Transaksi.
    - Badge Legalitas: *"Siap Digunakan untuk SPK Proyek Cabang"*.
    - Tombol cepat pada baris tabel:
      - **"Lihat Dokumen Trial"** ➔ Membuka modal preview dokumen resmi.
      - **"Detail Item"** ➔ Membuka halaman detail `/prototipe-trial/detail/[id]`.
    - Tombol Simulasi Pengujian:
      - Tombol **"Simulasikan Masa Trial Selesai"** pada setiap baris item ➔ Memperbarui tanggal atau langsung mengalihkan status item ke `TRIAL_EVALUASI_VOTING` agar dapat langsung diuji ke tahap evaluasi berikutnya.
  - **Code Standard Check:** Clean presentation, filter pencarian berdasarkan cabang atau nama material.

---

## 3. Checkpoint
- [ ] Saat B&M Regional Manager menyetujui harga, nomor registrasi dokumen terbit secara otomatis.
- [ ] Dokumen Pelaksanaan Trial dapat dibuka dalam modal dan tampil dengan layout surat resmi yang presisi.
- [ ] Halaman `/prototipe-trial/monitoring-trial` menampilkan daftar item aktif beserta countdown sisa hari.
- [ ] Menekan tombol simulasi berhasil mengubah status item menjadi `TRIAL_EVALUASI_VOTING`.

---

## 4. Outcome
Masa aktif trial di lapangan terkelola secara transparan, dokumen resmi siap dicetak, dan transisi menuju fase evaluasi pasca-trial dapat disimulasikan dengan mudah.
