# Implementation Plan: Revisi Alur Pengajuan Master Harga (Notulensi 02 Okt 2026)

## Overview
Implementasi perbaikan alur pengajuan Master Harga berdasarkan 15 poin notulensi rapat. Perbaikan mencakup penyempurnaan UI/UX form input (formatting, multi-select, autosuggest), penambahan logika bisnis (kalkulasi otomatis, sinkronisasi induk-anak, auto-generate kode & item bongkaran), penggabungan alur review dan survei, serta implementasi sistem voting 1/2 + 1 untuk persetujuan kontraktor.

## Architecture Decisions
- **State Management:** Penyesuaian `store.ts` untuk mendukung sinkronisasi data Item Induk (SIP) ke Item Anak secara reaktif.
- **Form Components:** Menggunakan `react-select` untuk input multi-select dan dropdown dengan pencarian (Autosuggest).
- **Two-way Data Binding:** Menggunakan efek/handler terkontrol pada komponen React untuk memastikan perubahan harga dan margin saling menyesuaikan tanpa *infinite loop*.
- **Image Metadata:** Ekstraksi EXIF data (Geo Tag & Timestamp) menggunakan API standar browser atau library ringan saat *client-side upload*.

## Task List

### Phase 1: Foundation & Form Input Enhancements
Fokus pada penambahan field baru dan perbaikan *formatting* pada form pengajuan harga awal.

- [x] Task 1: Penambahan Jenis Pengajuan & Formatting Deskripsi
- [ ] Task 2: Input Multi-select & Format Ribuan Harga
- [ ] Task 3: Dropdown Satuan Koefisien & Info Toleransi Minimal

### Checkpoint: Foundation
- [ ] Form pengajuan baru menampilkan field Jenis Pengajuan.
- [ ] Format angka ribuan berfungsi saat mengetik nominal harga.
- [ ] Multi-select Implementasi dan Lokasi berfungsi dengan baik.
- [ ] Deskripsi otomatis membungkus informasi tambahan dengan kurung `()`.

### Phase 2: Form Logic & Automation
Fokus pada logika otomatisasi dan interaktivitas tingkat menengah pada form.

- [ ] Task 4: Logika Auto-Bongkaran untuk Kategori "Pasangan"
- [ ] Task 5: Auto-generate Kode Master berdasarkan Kategori
- [ ] Task 6: Autosuggest Input Berdasarkan Data Tersedia

### Checkpoint: Form Logic
- [ ] Memilih kategori "Pekerjaan Pasangan" otomatis memunculkan/menambah item "Bongkaran".
- [ ] Kode master di-generate otomatis mengikuti singkatan kategori.
- [ ] Field input memberikan saran autocompletion dari data master.

### Phase 3: Complex State & Synchronizations
Fokus pada logika *state* yang kompleks, sinkronisasi data induk-anak, dan *two-way binding*.

- [ ] Task 7: Kalkulasi Dua Arah (Harga vs Margin)
- [ ] Task 8: Sinkronisasi Perubahan Item Induk ke Anak
- [ ] Task 9: Referensi Harga Lintas Cabang (Induk Sama)

### Checkpoint: Complex State
- [ ] Mengubah harga otomatis mengupdate margin, dan sebaliknya.
- [ ] Saat B&M mengedit data Item Induk, semua Item Anak/Varian terupdate secara konsisten di `store.ts`.
- [ ] User di cabang A dapat melihat harga cabang B pada UI jika item induknya sama.

### Phase 4: Workflow Integrations (Survei & Approval)
Fokus pada perombakan alur review, validasi foto, dan logika persetujuan (Voting).

- [ ] Task 10: Penggabungan Form Review dan Modul Survei
- [ ] Task 11: Validasi Metadata Foto Survei (Geo Tag & Timestamp)
- [ ] Task 12: Mesin Status Persetujuan Voting (1/2 + 1)

### Checkpoint: Complete
- [ ] Alur S&B Review sudah mencakup pengisian survei tanpa berpindah halaman jauh.
- [ ] Upload foto tanpa GPS/Waktu ditolak oleh sistem.
- [ ] Pengajuan otomatis berstatus "Disetujui" jika jumlah *approve* kontraktor melebihi setengah total kontraktor.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Infinite Loop pada Harga vs Margin | High | Pisahkan state internal input dengan state global, gunakan kondisi pencegahan *update* berulang. |
| Performa *Cascade Update* Induk-Anak | Med | Lakukan pembaruan state secara batch (functional setState) pada list data. |
| Pembacaan EXIF bermasalah (foto dari WA) | Med | Berikan *fallback* atau instruksi UI yang jelas agar user mengambil foto langsung dari kamera (live). |

## Open Questions
- Apakah fitur *Geo Tag* akan otomatis *reject* gambar yang metadata-nya hilang karena di-forward dari WhatsApp, atau ada *bypass* (peringatan saja)?
- Pada proses sinkronisasi Item Induk ke Anak, field apa saja secara spesifik yang diizinkan untuk disinkronkan? (Apakah harga anak ikut berubah jika induk diubah?)
