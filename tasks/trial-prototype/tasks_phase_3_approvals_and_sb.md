# Phase 3: Managerial Approvals and S&B Price Configuration
**Target Aplikasi:** `sparta-fe`  
**Fokus:** Alur Verifikasi Awal (PP Mgr & BM GM), Penyesuaian Harga & Koefisien S&B, serta Approval Harga B&M Regional Manager  
**Dokumen Referensi:** [dokumen-master-alur-dan-prototipe-trial.md](file:///C:/Users/UDevran/.gemini/antigravity/brain/0358315d-2502-45a9-933b-5cf52b2f56c1/dokumen-master-alur-dan-prototipe-trial.md)

---

## 1. Overview
Fase ini mengimplementasikan tahapan verifikasi awal dan konfigurasi komersial. S&B Specialist memiliki keleluasaan penuh untuk menghitung dan menyesuaikan harga final trial meskipun Maker telah memberikan estimasi harga awal. B&M Regional Manager memvalidasi harga tersebut, dengan opsi meminta revisi jika dinilai belum sesuai. Seluruh label tombol dan dialog menggunakan bahasa yang tegas dan ringkas.

---

## 2. Tasks

### 2.1. Inisiasi & Verifikasi Manajerial Awal
- [ ] **Task 3.1: Halaman Antrean PP Manager**
  - **File:** `app/prototipe-trial/pp-manager/page.tsx`
  - **Spesifikasi:**
    - Tabel antrean item menunggu persetujuan PP Manager (`TRIAL_PENDING_PP_MGR`).
    - Pengecekan otomatis: Pengajuan dengan Maker ber-role `PP_MANAGER` tidak muncul di antrean ini (langsung diteruskan ke B&M General Manager).
    - Klik baris item membuka Halaman Detail.
    - Integrasi Bilah Aksi di Halaman Detail:
      - Tombol **"Setujui Pengajuan"** ➔ Update status menjadi `TRIAL_PENDING_BM_GM`.
      - Tombol **"Kembalikan (Perlu Revisi)"** ➔ Dialog catatan revisi, status kembali ke `TRIAL_REVISI_MAKER`.
  - **Code Standard Check:** Manfaatkan mutator state terpusat dari `store.ts`.

- [ ] **Task 3.2: Halaman Antrean B&M General Manager**
  - **File:** `app/prototipe-trial/bm-general-manager/page.tsx`
  - **Spesifikasi:**
    - Tabel antrean item menunggu persetujuan B&M General Manager (`TRIAL_PENDING_BM_GM`).
    - Klik baris item membuka Halaman Detail.
    - Integrasi Bilah Aksi di Halaman Detail:
      - Tombol **"Setujui Pengajuan"** ➔ Update status menjadi `TRIAL_PENDING_SB_CONFIG`.
      - Tombol **"Kembalikan (Perlu Revisi)"** ➔ Dialog catatan revisi, status kembali ke `TRIAL_REVISI_MAKER`.

### 2.2. Konfigurasi Koefisien & Harga oleh S&B Specialist
- [ ] **Task 3.3: Komponen Editor Koefisien & Harga S&B**
  - **File:** `components/prototipe-trial/TrialSBCoefEditor.tsx`
  - **Spesifikasi:**
    - Menampilkan panel informasi referensi: *Estimasi Harga Awal Maker (Rp)* dan status *Termasuk Bongkaran*.
    - Tabel input dinamis koefisien upah tenaga kerja (Mandor, Tukang, Pekerja) dan material acuan.
    - Sub-tabel koefisien pekerjaan bongkaran (otomatis aktif jika item ditandai `isTermasukBongkaran`).
    - Input persentase margin keuntungan (default 8%).
    - Kalkulasi reaktif harga final trial (Upah + Material + Bongkaran + Margin). S&B dapat menimpa/menyesuaikan nominal akhir jika diperlukan.
  - **Code Standard Check:** Hindari efek samping (*re-render loop*), gunakan kalkulasi deterministik murni.

- [ ] **Task 3.4: Halaman Antrean S&B Specialist**
  - **File:** `app/prototipe-trial/sb-specialist/page.tsx`
  - **Spesifikasi:**
    - **Tab 1: Siap Dikonfigurasi** (`TRIAL_PENDING_SB_CONFIG`).
    - **Tab 2: Perlu Revisi Harga** (`TRIAL_REVISI_SB`) lengkap dengan box peringatan catatan revisi dari Regional Manager.
    - Klik baris item membuka Halaman Detail dengan tombol aksi *"Buka Form Konfigurasi Harga"* atau *"Submit Penyesuaian Harga"*.

### 2.3. Approval Harga oleh B&M Regional Manager
- [ ] **Task 3.5: Halaman B&M Regional Manager (Tab Approval Harga)**
  - **File:** `app/prototipe-trial/regional-manager/page.tsx`
  - **Spesifikasi:**
    - **Tab 1: Approval Harga Trial** (`TRIAL_PENDING_BM_REG_CONFIG`).
    - Klik baris item membuka Halaman Detail untuk meninjau rincian biaya yang disusun S&B.
    - Integrasi Bilah Aksi di Halaman Detail:
      - Tombol **"Setujui Harga Trial"** ➔ Menerbitkan nomor dokumen resmi, mengubah status ke `TRIAL_AKTIF`.
      - Tombol **"Minta Revisi S&B"** ➔ Dialog catatan alasan revisi, mengubah status ke `TRIAL_REVISI_SB`.

---

## 3. Checkpoint
- [ ] Item dapat disetujui bertingkat dari PP Manager ➔ B&M GM ➔ S&B Specialist.
- [ ] S&B Specialist dapat menginput koefisien dan menyesuaikan harga final trial.
- [ ] Regional Manager dapat menyetujui harga (status berubah ke `TRIAL_AKTIF`) atau meminta revisi kembali ke S&B (`TRIAL_REVISI_SB`).
- [ ] Riwayat log mencatat setiap aksi approver dengan tanggal dan catatan telaah yang akurat.

---

## 4. Outcome
Tahap konfigurasi harga dan persetujuan manajerial awal tuntas. Item siap diterbitkan dokumennya dan masuk ke masa aktif uji coba lapangan.
