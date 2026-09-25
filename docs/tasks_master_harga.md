# 📋 Implementation Tasks: Prototype Pengajuan Master Harga

Dokumen ini memuat daftar tugas terstruktur untuk membangun prototipe modul **Pengajuan Master Harga** pada aplikasi **SPARTA FE**, mencakup Alur Request Penetapan Harga Baru, Alur Pengajuan 4-Layer Approval (Jalur A), dan Jalur Trial (Jalur B).

---

## Phase 1: Landasan Data Schema & Workflow Engine

### Overview
Fase ini berfokus pada penyusunan kontrak data TypeScript, tipe data approval 4-layer, komponen AHSP (Upah, Material, Alat), data 3 survei toko, serta mock data pengajuan interaktif.

### Tasks

#### 1. Data Contracts & Interfaces
- [ ] **1.1 Update `types.ts`**
  - **File Target**: `components/pengajuan-harga/types.ts`
  - **Uraian**: Tambahkan tipe status approval 4-layer (`DRAFT`, `PENDING_BM_MGR`, `PENDING_SB_SPECIALIST`, `PENDING_REGIONAL_MGR`, `PENDING_KONTRAKTOR`, `RETURNED_TO_BC`, `RELEASED`).
  - **Uraian**: Tambahkan interface `SurveyTokoItem` (3 toko: Nama Toko, Harga Satuan, Tanggal Survei, Bukti/Catatan).
  - **Uraian**: Tambahkan interface `AHSPKomponen` (Rincian Upah, Material, Alat, dan Koefisien Standar Master).
  - **Uraian**: Tambahkan interface `RequestPenetapanItem` (Alur 1: B&M Mgr Request -> Validasi S&B Specialist -> Mastering Koefisien).
  - **Uraian**: Tambahkan interface `TrialHargaItem` (Alur 2B: S&B Specialist -> Regional Mgr Approval).
  - **Code Standard Check**: *Enforce SOLID - Single Responsibility Principle pada perancangan tipe data.*

#### 2. Mock Data Engine
- [ ] **1.2 Update `mock-data.ts`**
  - **File Target**: `components/pengajuan-harga/mock-data.ts`
  - **Uraian**: Sediakan data simulasi untuk 4 Tab utama (Master Harga Released, Request Item Baru, Pengajuan 4-Layer Approval, dan Jalur Trial).
  - **Uraian**: Sediakan data contoh dengan 3 survei toko dan rincian AHSP yang realistis (misal: Keramik Granit 60x60, Gypsum Board, Cat Emulsi).

### Checkpoint
- Tipe data TypeScript tidak ada error (`tsc` clean).
- Mock data mencakup seluruh status approval dari `DRAFT` hingga `RELEASED`.

### Outcome
Terbentuknya arsitektur data yang kokoh untuk mendukung simulasi 4 layer persetujuan dan perhitungan AHSP secara akurat.

---

## Phase 2: UI Components & Approval Widgets

### Overview
Fase ini berfokus pada pembuatan komponen visual UI modular, seperti Stepper 4-Layer Approval, Modal Rincian AHSP & 3 Survei Toko, serta Form Aksi Approval / Return.

### Tasks

#### 1. Stepper & Visual Indicators
- [ ] **2.1 Buat `ApprovalStepper.tsx`**
  - **File Target**: `components/pengajuan-harga/ApprovalStepper.tsx`
  - **Uraian**: Visualisasi 4 tahap persetujuan berurutan (`1. B&M Mgr` $\rightarrow$ `2. S&B Specialist` $\rightarrow$ `3. Regional Mgr` $\rightarrow$ `4. Kontraktor`).
  - **Uraian**: Tampilkan status aktif (Warna Hijau/Biru untuk Approve, Kuning untuk Pending, Merah untuk Rejected/Returned ke Ground Zero).

#### 2. Modals Rincian Administrasi Wajib
- [ ] **2.2 Buat `AHSPDetailModal.tsx`**
  - **File Target**: `components/pengajuan-harga/AHSPDetailModal.tsx`
  - **Uraian**: Tampilkan tabel perbandingan harga dari 3 Toko/Supplier.
  - **Uraian**: Tampilkan rincian kalkulasi AHSP: $\text{Upah} + \text{Material} + \text{Alat}$ beserta koefisiennya.

- [ ] **2.3 Buat `RequestItemModal.tsx` (Alur 1)**
  - **File Target**: `components/pengajuan-harga/RequestItemModal.tsx`
  - **Uraian**: Form inisiasi Request Penetapan Harga Baru oleh B&M Manager.

- [ ] **2.4 Buat `TrialItemModal.tsx` (Alur 2B)**
  - **File Target**: `components/pengajuan-harga/TrialItemModal.tsx`
  - **Uraian**: Form cepat penambahan Item Trial oleh S&B Controlling Specialist.

- [ ] **2.5 Buat `ApprovalActionModal.tsx`**
  - **File Target**: `components/pengajuan-harga/ApprovalActionModal.tsx`
  - **Uraian**: Modal tindakan persetujuan bagi penguji (B&M Mgr, S&B, Reg Mgr, Kontraktor) dengan input Catatan Revisi & Tombol *Setujui* atau *Kembalikan ke BC (Return)*.

### Checkpoint
- Komponen UI responsif, menggunakan design system SPARTA FE (Tailwind CSS, OKLCH, Shadcn UI).
- Stepper dapat merepresentasikan posisi approval secara real-time.

### Outcome
Kumpulan komponen UI reusable yang siap diintegrasikan pada layar utama Pengajuan Master Harga.

---

## Phase 3: Integrasi Halaman Utama (Tabbed Dashboard)

### Overview
Fase ini mengintegrasikan seluruh komponen ke dalam halaman utama `app/pengajuan-harga/page.tsx` dengan sistem Tabulasi 4 Modul dan Pemilihan Role Simulasi.

### Tasks

#### 1. Tabbed Interface & Role Switcher
- [ ] **3.1 Re-architect `app/pengajuan-harga/page.tsx`**
  - **File Target**: `app/pengajuan-harga/page.tsx`
  - **Uraian**: Tambahkan **Role Switcher Simulasi** di header (*"Simulasi Sebagai: Building Coord | B&M Mgr | S&B Specialist | Regional Mgr | Kontraktor"*).
  - **Uraian**: Buat 4 Tab Navigasi Utama:
    1. **Master Harga Resmi (Released)**
    2. **Request Penetapan Harga (Alur 1)**
    3. **Pengajuan & Review (Alur 2A - 4 Layer Approval)**
    4. **Jalur Trial (Alur 2B)**

#### 2. Integrasi Workflow Logik per Tab
- [ ] **3.2 Integrasi Alur 1 (Request Item Baru)**
  - **Uraian**: B&M Mgr mengirim Request $\rightarrow$ S&B Specialist Validasi & Input Master Koefisien.
- [ ] **3.3 Integrasi Alur 2A (Pengajuan 4 Layer)**
  - **Uraian**: Display list pengajuan dari Building Coord $\rightarrow$ Tombol Aksi Approval aktif sesuai Role yang dipilih $\rightarrow$ Eksekusi Reject mengembalikan dokumen ke `RETURNED_TO_BC`.
- [ ] **3.4 Integrasi Alur 2B (Jalur Trial)**
  - **Uraian**: S&B Specialist membuat Trial $\rightarrow$ Approval Regional Mgr $\rightarrow$ Release ke Master Harga.

### Checkpoint
- Pengguna dapat berpindah role dan mencoba alur persetujuan dari awal hingga rilis.
- Dokumen yang ditolak di layer mana pun pada Alur 2A otomatis kembali ke status `RETURNED_TO_BC` (Ground Zero).

### Outcome
Prototipe interaktif yang berfungsi penuh untuk menguji kedua diagram alur (Alur Request & Alur Pengajuan).

---

## Phase 4: Verifikasi & Polishing UI/UX

### Overview
Fase pemolesan akhir untuk memastikan tampilan user-friendly, bahasa ringkas, animasi transisi smooth, dan pengujian ekspor data.

### Tasks
- [ ] **4.1 Verifikasi Teks & UX User-Friendly**
  - Pastikan seluruh istilah menggunakan bahasa Indonesia yang ramah, ringkas, dan bebas jargon birokratis kaku.
- [ ] **4.2 Fitur Export Data ber-Status**
  - Update `export-utils.ts` agar dapat mengekspor daftar Master Harga rilis maupun riwayat approval ke CSV, Excel, dan PDF.
- [ ] **4.3 Verification Run**
  - Jalankan pengujian visual di browser untuk memastikan tidak ada layout shift atau lint error.

### Checkpoint
- Tidak ada lint atau console error.
- Alur lengkap dapat diperagakan tanpa kendala.

### Outcome
Prototipe fitur Pengajuan Master Harga yang siap dipresentasikan dan diuji oleh pengguna/stakeholder.
