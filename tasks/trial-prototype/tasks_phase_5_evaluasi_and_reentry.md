# Phase 5: Multi-Team Evaluation, Quorum Voting, Final Master Promotion, and Non-Deadlock Re-Entry
**Target Aplikasi:** `sparta-fe`  
**Fokus:** Form Evaluasi Mandiri 3 Tim (PP, BMES, S&B) + Lampiran, Kuorum Voting 2/3, Approval Akhir Master, & Aksi Re-Entry Non-Deadlock  
**Dokumen Referensi:** [dokumen-master-alur-dan-prototipe-trial.md](file:///C:/Users/UDevran/.gemini/antigravity/brain/0358315d-2502-45a9-933b-5cf52b2f56c1/dokumen-master-alur-dan-prototipe-trial.md)

---

## 1. Overview
Fase ini menyelesaikan siklus hidup pengujian trial. Masing-masing tim (PP, BMES, S&B) memiliki form evaluasi independen yang wajib menyertakan catatan telaah dan upload lampiran bukti evaluasi lapangan. Kuorum 2 dari 3 suara secara otomatis menentukan kelolosan ke tahap B&M Regional Manager. Jika item tidak lanjut atau ditolak, sistem menerapkan **Kebijakan Non-Deadlock**: item tidak dikunci mati, melainkan menyediakan opsi untuk *Ajukan Trial Kembali*, *Ajukan Langsung ke Master*, atau *Ajukan Kembali*.

---

## 2. Tasks

### 2.1. Form Evaluasi Mandiri Tim & Lampiran
- [ ] **Task 5.1: Modal Formulir Evaluasi Mandiri Tim**
  - **File:** `components/prototipe-trial/FormEvaluasiTimModal.tsx`
  - **Spesifikasi:**
    - Menerima parameter tim penilai aktif (`'TIM_PP' | 'TIM_BMES' | 'TIM_SB'`).
    - Input Keputusan: Pilihan kartu ringkas: **"Setuju Lanjut ke Master"** atau **"Tidak Lanjut"**.
    - Input Catatan Evaluasi: Catatan observasi hasil uji coba di gerai/lapangan.
    - Input **Upload Lampiran Bukti Evaluasi**: File upload (foto terpasang, laporan teknis, berita acara uji coba) dengan preview nama file.
    - Tombol simpan penilaian: **"Kirim Penilaian Evaluasi"**.
  - **Code Standard Check:** Validasi form ketat (catatan dan lampiran wajib diisi sebelum submit).

### 2.2. Halaman Evaluasi Kuorum & Rekapitulasi Suara
- [ ] **Task 5.2: Halaman Evaluasi Pasca-Trial**
  - **File:** `app/prototipe-trial/evaluasi-tim/page.tsx`
  - **Spesifikasi:**
    - Tabel antrean item yang durasinya telah habis (`TRIAL_EVALUASI_VOTING`).
    - Status pengisian masing-masing formulir tim:
      - Tim PP: [Belum / Sudah Diisi]
      - Tim BMES: [Belum / Sudah Diisi]
      - Tim S&B: [Belum / Sudah Diisi]
    - Indikator Kuorum Reaktif (Real-Time Meter):
      - Menghitung suara setuju vs tidak setuju.
      - Jika $\ge 2$ tim menyetujui ➔ Banner sukses ringkas: *"Kuorum 2/3 Terpenuhi: Lolos ke B&M Regional Manager"*, status beralih ke `TRIAL_PENDING_FINAL_BM_REG`.
      - Jika $\ge 2$ tim menolak ➔ Status beralih ke `TRIAL_EVALUASI_TIDAK_LANJUT`.
    - Klik baris tabel membuka Halaman Detail untuk mengisi atau meninjau form evaluasi tim terkait.
  - **Code Standard Check:** Logika kuorum terisolasi dalam pure function `calculateQuorum(evaluasiList)`.

### 2.3. Approval Akhir B&M Regional Manager & Promosi Master
- [ ] **Task 5.3: Halaman B&M Regional Manager (Tab 2: Penetapan Akhir)**
  - **File:** `app/prototipe-trial/regional-manager/page.tsx`
  - **Spesifikasi:**
    - **Tab 2: Approval Akhir Penetapan Master** (`TRIAL_PENDING_FINAL_BM_REG`).
    - Menampilkan ringkasan riwayat uji coba dan rekapitulasi voting 3 tim beserta lampiran buktinya.
    - Integrasi Bilah Aksi di Halaman Detail:
      - Tombol **"Tetapkan Menjadi Master Harga (Resmi)"** ➔ Mengubah status menjadi `TRIAL_PROMOTED_MASTER` dan menyalin data ke katalog Master Harga permanen.
      - Tombol **"Tolak Penetapan"** ➔ Dialog catatan penolakan, mengubah status menjadi `TRIAL_DITOLAK_REG_MGR`.

### 2.4. Aksi Re-Entry Non-Deadlock (Item Tidak Dikunci Mati)
- [ ] **Task 5.4: Modul Aksi Re-Entry pada Halaman Detail**
  - **File:** `components/prototipe-trial/TrialReEntryActions.tsx`
  - **Spesifikasi:**
    - Muncul saat item berstatus `TRIAL_EVALUASI_TIDAK_LANJUT` atau `TRIAL_DITOLAK_REG_MGR`.
    - Menyediakan 3 opsi aksi terarah bagi pengguna:
      1. **Tombol "Ajukan Trial Kembali"**: Menginisiasi pengajuan trial putaran baru (membuka modal Maker untuk memilih durasi/lokasi baru, status kembali ke `TRIAL_DRAFT`/`TRIAL_PENDING_PP_MGR`).
      2. **Tombol "Ajukan Langsung ke Master"**: Meneruskan item langsung ke tahap penetapan akhir B&M Regional Manager (status menjadi `TRIAL_PENDING_FINAL_BM_REG`), meskipun masa aktif trial sudah lewat jauh.
      3. **Tombol "Ajukan Kembali / Resubmit"**: Memperbaiki catatan pengajuan pasca-penolakan Regional Manager dan mengembalikan ke antrean review awal.
  - **Code Standard Check:** Seluruh state transition terdefinisi dengan aman di `store.ts` tanpa merusak riwayat lama (*immutable audit log*).

### 2.5. Halaman Katalog Master Harga Resmi
- [ ] **Task 5.5: Halaman Katalog Master Harga**
  - **File:** `app/prototipe-trial/master-harga/page.tsx`
  - **Spesifikasi:**
    - Katalog Master Harga resmi perusahaan.
    - Menampilkan item yang telah berstatus `TRIAL_PROMOTED_MASTER` dengan badge *"Resmi Master Harga"* (dengan catatan referensi bahwa item berasal dari kelulusan alur uji coba trial).
  - **Code Standard Check:** Tampilan tabel standar katalog yang bersih dan mudah dibaca.

---

## 3. Checkpoint
- [ ] Form evaluasi mandiri untuk Tim PP, BMES, dan S&B dapat diisi secara independen lengkap dengan lampiran berkas bukti.
- [ ] Logika kuorum 2 dari 3 berjalan otomatis (2 setuju = lolos ke penetapan master).
- [ ] Approval final B&M Regional Manager berhasil memasukkan item ke katalog `/prototipe-trial/master-harga`.
- [ ] Item yang tidak lanjut atau ditolak tidak terkunci mati, dan tombol re-entry (*Ajukan Trial Kembali*, *Ajukan ke Master*, *Ajukan Kembali*) berfungsi normal.

---

## 4. Outcome
Seluruh alur pengujian trial ujung-ke-ujung (End-to-End) telah lengkap, terverifikasi secara fungsional, mematuhi prinsip Clean Architecture, dan siap disimulasikan serta dipresentasikan.
