# Phase 2: Maker Form, Standard Timeline, and Unified Detail Page
**Target Aplikasi:** `sparta-fe`  
**Fokus:** Input Maker (Spesifikasi, Bongkaran, Estimasi Harga, Lampiran, Durasi), Timeline Standar, & Halaman Detail Terpadu  
**Dokumen Referensi:** [dokumen-master-alur-dan-prototipe-trial.md](file:///C:/Users/UDevran/.gemini/antigravity/brain/0358315d-2502-45a9-933b-5cf52b2f56c1/dokumen-master-alur-dan-prototipe-trial.md)

---

## 1. Overview
Fase ini berfokus pada dua komponen inti: (1) Halaman dan modal input Maker untuk inisiasi item trial baru yang kaya spesifikasi teknis, dan (2) Halaman Detail Terpadu (`/prototipe-trial/detail/[id]`) yang menjadi pusat visualisasi dan eksekusi aksi untuk seluruh peran. Bahasa tampilan disusun secara ringkas, lugas, dan bebas dari istilah rumit yang tidak diperlukan pengguna.

---

## 2. Tasks

### 2.1. Shared Components
- [ ] **Task 2.1: Komponen Timeline Alur Standar**
  - **File:** `components/prototipe-trial/TrialTimelineBar.tsx`
  - **Spesifikasi:**
    - Visual bar alur: Inisiasi Maker ➔ Approval PP Mgr ➔ Approval BM GM ➔ Konfigurasi S&B ➔ Approval Reg Mgr ➔ Masa Trial Aktif ➔ Evaluasi Tim ➔ Master Harga.
    - Menandai tahapan aktif secara ringkas tanpa menampilkan banner khusus bypass PP Manager (alur umum bersih).
  - **Code Standard Check:** Terapkan prinsip presentational component murni.

### 2.2. Maker Page & Form Modal
- [ ] **Task 2.2: Modal Formulir Pengajuan Item Trial**
  - **File:** `components/prototipe-trial/ModalTambahTrial.tsx`
  - **Spesifikasi:**
    - Mengadopsi input spesifikasi lengkap dari `TambahItemTrialModal.tsx`:
      - Kategori, Material, Ukuran (Nilai & Satuan), Merk, Warna, Tipe, Permukaan, Tebal, Toleransi, Posisi, Lokasi, Cabang, Satuan.
    - Pilihan **Durasi Masa Uji Coba**: Pilihan tombol kartu ringkas: **2 Bulan (60 Hari)**, **3 Bulan (90 Hari)**, **4 Bulan (120 Hari)**.
    - Input **Estimasi Harga Awal (Rp)**: Mask ribuan / format currency otomatis.
    - Toggle Checkbox **"Termasuk Pekerjaan Bongkaran?"**: Mengikuti gaya `TambahPengajuanModal.tsx`.
    - Input **Upload Lampiran Dokumen/Gambar**: Tombol upload file pendukung dengan preview nama berkas ringkas.
    - Input **Alasan Pengajuan Trial**: Teks area ringkas.
    - Live kalkulasi Kode Item (`SIP-xxx`), Kode Master, dan Deskripsi Otomatis.
  - **Code Standard Check:** Validasi form terpusat, penanganan error state yang jelas.

- [ ] **Task 2.3: Halaman Antrean Maker**
  - **File:** `app/prototipe-trial/maker/page.tsx`
  - **Spesifikasi:**
    - Header halaman: Judul *"Pengajuan Item Trial"*, tombol *"Tambah Pengajuan"*.
    - Tabel antrean item Maker: Kolom Kode, Nama Material, Kategori, Durasi, Estimasi Harga, Status Badge ringkas.
    - Klik baris tabel mengarahkan ke halaman detail `/prototipe-trial/detail/[id]`.
  - **Code Standard Check:** Reusable data table, filter pencarian item sederhana.

### 2.3. Unified Detail Page
- [ ] **Task 2.4: Halaman Detail Item Trial Terpadu**
  - **File:** `app/prototipe-trial/detail/[id]/page.tsx`
  - **Spesifikasi:**
    - **Header & Ringkasan:** Kode item, kategori, status badge spesifik, badge sisa hari trial, tombol kembali ke antrean.
    - **Timeline Bar:** Memasang `TrialTimelineBar.tsx`.
    - **Tab Navigasi Informasi:**
      - **Tab 1: Spesifikasi & Data Maker:** Detail fisik material, estimasi harga awal, penanda bongkaran (Ya/Tidak), link file lampiran Maker, dan alasan trial.
      - **Tab 2: Rincian Koefisien S&B:** Ditampilkan jika tahap S&B sudah berjalan (Tabel biaya upah, material, bongkaran, margin, dan harga trial final).
      - **Tab 3: Dokumen Pelaksanaan Trial:** Pratinjau surat resmi trial dan tombol unduh PDF (aktif saat status `TRIAL_AKTIF`).
      - **Tab 4: Hasil Evaluasi Tim (PP, BMES, S&B):** Tampilan 3 kartu evaluasi mandiri tim beserta lampiran bukti uji coba (aktif saat masa aktif selesai).
      - **Tab 5: Riwayat Persetujuan:** Log historis tanggal, peran approver, dan catatan telaah.
    - **Bilah Aksi Kontekstual (Sticky Action Bar):**
      - Merender tombol aksi spesifik sesuai peran aktif di *Role Switcher* (misal tombol Maker: Edit / Hapus jika Draft; tombol Approval jika di halaman manajerial).
  - **Code Standard Check:** Pecah setiap tab menjadi sub-komponen terpisah (`TrialSpecTab.tsx`, `TrialCostTab.tsx`, `TrialDocTab.tsx`, `TrialEvaluationTab.tsx`) untuk mematuhi Single Responsibility Principle.

---

## 3. Checkpoint
- [ ] Modal input Maker berhasil menyimpan item lengkap dengan estimasi harga, status bongkaran, lampiran, dan durasi 2-4 bulan ke dalam store.
- [ ] Halaman `/prototipe-trial/maker` menampilkan daftar item yang baru saja diinput.
- [ ] Mengklik baris item membuka `/prototipe-trial/detail/[id]` dengan seluruh data fisik terisi akurat.
- [ ] Bahasa antarmuka padat, ringkas, dan mudah dipahami.

---

## 4. Outcome
Maker dapat menginput pengajuan trial baru dengan seluruh parameter fisik, komersial awal, dan lampiran. Halaman detail terpadu siap menjadi wadah interaksi untuk seluruh tahapan persetujuan berikutnya.
