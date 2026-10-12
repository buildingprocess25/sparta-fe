# Phase 1: Foundation, Data Contracts, and Role Portal
**Target Aplikasi:** `sparta-fe`  
**Fokus:** Fondasi Arsitektur Bersih (Types, Store Mock State, Portal Pilih Peran, & Navigation Bar)  
**Dokumen Referensi:** [dokumen-master-alur-dan-prototipe-trial.md](file:///C:/Users/UDevran/.gemini/antigravity/brain/0358315d-2502-45a9-933b-5cf52b2f56c1/dokumen-master-alur-dan-prototipe-trial.md)

---

## 1. Overview
Fase ini berfokus pada pembangunan fondasi data dan struktur navigasi rute dedicated `/prototipe-trial`. Mengikuti prinsip **Clean Architecture**, data kontrak (*types*) dan state management (*mock store*) dipisahkan secara tegas dari komponen tampilan (UI). Tampilan dirancang dengan antarmuka yang bersih, ringkas, dan profesional tanpa teks bertele-tele.

---

## 2. Tasks

### 2.1. Domain & Data Contracts (Types)
- [x] **Task 1.1: Pembuatan Tipe Data Terpusat**
  - **File:** `components/prototipe-trial/types.ts`
  - **Spesifikasi:**
    - Definisikan enum/union type untuk 12 status trial (`TRIAL_DRAFT`, `TRIAL_PENDING_PP_MGR`, `TRIAL_REVISI_MAKER`, `TRIAL_PENDING_BM_GM`, `TRIAL_PENDING_SB_CONFIG`, `TRIAL_PENDING_BM_REG_CONFIG`, `TRIAL_REVISI_SB`, `TRIAL_AKTIF`, `TRIAL_EVALUASI_VOTING`, `TRIAL_PENDING_FINAL_BM_REG`, `TRIAL_EVALUASI_TIDAK_LANJUT`, `TRIAL_DITOLAK_REG_MGR`, `TRIAL_PROMOTED_MASTER`).
    - Definisikan tipe `TrialItem`: Spesifikasi fisik lengkap, `estimasiHargaMaker`, `isTermasukBongkaran`, `lampiranMakerUrl`, `durasiBulan` (2/3/4), `sisaHariAktif`, `nomorDokumenTrial`.
    - Definisikan tipe `FormEvaluasiTim`: `keputusan: 'LANJUT' | 'TIDAK_LANJUT'`, `catatan: string`, `lampiranUrl?: string`, `namaPenilai: string`, `tanggal: string`.
    - Definisikan tipe `RoleTrial`: `'MAKER' | 'PP_MANAGER' | 'BM_GM' | 'SB_SPECIALIST' | 'BM_REGIONAL_MGR' | 'EVALUATOR'`.
  - **Status:** Selesai dan terverifikasi bersih.

### 2.2. State Management & Storage (Clean Store)
- [x] **Task 1.2: Mock Store & State Controller**
  - **File:** `components/prototipe-trial/store.ts`
  - **Spesifikasi:**
    - Buat helper penyimpanan `localStorage` terisolasi (`sparta_prototipe_trial_items_v2`).
    - Sediakan data awal (*seed mock items*) yang merepresentasikan berbagai fase status (9+ item di tiap antrean).
    - Implementasikan fungsi-fungsi mutasi state (SRP): `createTrialItem`, `updateTrialStatus`, `updateSBCoefficients`, `submitTimEvaluation`, `reEntryTrialAction`.
    - Sediakan custom hook `useTrialStore()` dengan event listener `storage` untuk sinkronisasi otomatis antar tab/komponen.
  - **Status:** Selesai dan terverifikasi.

### 2.3. Shared UI & Layout Navigation
- [x] **Task 1.3: Top Navigation Bar dengan Quick Role Switcher**
  - **File:** `components/prototipe-trial/TrialNavbar.tsx`
  - **Spesifikasi:**
    - Header bersih dengan logo, judul *"SPARTA Trial"*, tombol reset demo, dan pemilih peran cepat (*Quick Role Switcher pills*).
    - Menampilkan indikator peran aktif saat ini dengan bahasa yang lugas.
  - **Status:** Selesai dan terverifikasi.

- [x] **Task 1.4: Portal Pilih Peran (Landing Page)**
  - **File:** `app/prototipe-trial/page.tsx`
  - **Spesifikasi:**
    - Grid kartu peran mengadopsi struktur `/pengajuan-harga`:
      1. Maker (Senior / Junior Manager)
      2. PP Manager
      3. B&M General Manager
      4. S&B Specialist
      5. B&M Regional Manager
      6. Tim Lapangan (Monitoring Trial Aktif)
      7. Tim Evaluasi (PP, BMES, S&B)
      8. Master Harga Resmi
    - Menampilkan badge jumlah item aktif (*counter*) pada masing-masing kartu peran.
    - Copywriting ringkas dan jelas tanpa penjelasan yang berlebihan.
  - **Status:** Selesai dan terverifikasi.

---

## 3. Checkpoint
- [x] Tipe data `types.ts` lolos TypeScript static analysis.
- [x] Mock store menginisialisasi 9+ item awal di status berbeda secara konsisten.
- [x] Halaman `/prototipe-trial` tampil rapi dan kartu peran dapat diklik untuk navigasi.
- [x] Peran dapat diganti secara instan melalui bilah *Quick Role Switcher*.

---

## 4. Outcome
Fondasi sistem prototipe telah siap, tipe data terkunci secara aman, dan alur navigasi antar-peran dapat diakses secara instan dari rute `/prototipe-trial`.
