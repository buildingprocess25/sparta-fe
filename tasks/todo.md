## Task 1: Penambahan Jenis Pengajuan & Formatting Deskripsi

**Description:** Menambahkan field pilihan "Jenis Pengajuan" (Hanya Jasa / Material) pada form, serta memperbarui logika deskripsi otomatis agar teks *Informasi Tambahan* diapit dengan tanda kurung `(...)`.

**Expect:** Saat user mengisi form, terdapat Radio/Dropdown "Jenis Pengajuan". Saat form dirangkum menjadi deskripsi otomatis, kolom Informasi Tambahan akan dirender seperti `(Catatan tambahan)`.

**Acceptance criteria:**
- [x] Field "Jenis Pengajuan" ("Hanya Jasa" atau "Material") tersedia dan state-nya tersimpan.
- [x] Logika `deskripsiOtomatis` membungkus input informasi tambahan dengan kurung.

**Verification:**
- [ ] Manual check: Isi form dan periksa string pada deskripsi otomatis.

**Dependencies:** None

**Estimated scope:** Small

---

## Task 2: Input Multi-select & Format Ribuan Harga

**Description:** Mengubah field input "Implementasi" dan "Lokasi" menjadi komponen multi-select. Menerapkan formatter ribuan pada input nominal harga.

**Expect:** User dapat memilih lebih dari satu lokasi (misal: "Toilet", "Dapur"). Saat user mengetik "10000" pada input harga, akan otomatis terformat menjadi "10.000".

**Acceptance criteria:**
- [x] Komponen input Implementasi dan Lokasi menggunakan multi-select (array string).
- [x] Input harga memiliki mask ribuan/currency formatting secara real-time.

**Verification:**
- [ ] Manual check: Pilih 2 lokasi, dan ketik angka jutaan di field harga.

**Dependencies:** None

**Estimated scope:** Small

---

## Task 3: Dropdown Satuan Koefisien & Info Toleransi Minimal

**Description:** Mengubah field teks "Satuan" pada tabel koefisien menjadi Dropdown. Menambahkan info *Toleransi Terukur Minimal* di deskripsi.

**Expect:** Saat mengisi koefisien, field satuan tidak diketik manual melainkan dipilih dari daftar baku. Di deskripsi/info UI, akan ada kalkulasi otomatis `Ketebalan - Toleransi`.

**Acceptance criteria:**
- [ ] Field satuan di tabel koefisien menggunakan komponen `<Select>`.
- [ ] Info Toleransi Terukur Minimal dirender di UI (jika ketebalan dan toleransi diisi).

**Verification:**
- [ ] Manual check: Isi ketebalan 10mm dan toleransi 2mm, pastikan tertulis 8mm.

**Dependencies:** None

**Estimated scope:** Small

---

## Task 4: Logika Auto-Bongkaran untuk Kategori "Pasangan"

**Description:** Menambahkan logic event ketika user memilih kategori "Pekerjaan Pasangan", form otomatis men-*generate* sub-item atau pekerjaan "Bongkaran".

**Expect:** User memilih kategori "Pekerjaan Pasangan", sistem memunculkan field/tugas "Bongkaran" otomatis tanpa user perlu mengetiknya dari nol.

**Acceptance criteria:**
- [x] Event `onChange` pada kategori mendeteksi nilai "Pasangan".
- [x] `setState` dijalankan untuk menambahkan pekerjaan bongkaran.

**Verification:**
- [ ] Manual check: Ubah kategori ke Pekerjaan Pasangan, periksa item list.

**Dependencies:** None

**Estimated scope:** Medium

---

## Task 5: Auto-generate Kode Master berdasarkan Kategori

**Description:** Membuat *helper function* yang meng-generate format Kode Master Item menyesuaikan kode singkat kategori yang dipilih.

**Expect:** Kategori "Pekerjaan Keramik" mungkin menghasilkan awalan "KRK", atau format khusus lainnya sesuai SOP tanpa input manual.

**Acceptance criteria:**
- [ ] Terdapat mapping fungsi kategori ke prefix kode.
- [ ] Field Kode Master disembunyikan/di-disable dan diisi otomatis oleh fungsi ini.

**Verification:**
- [ ] Manual check: Ganti kategori dan lihat perubahan pada kode master.

**Dependencies:** None

**Estimated scope:** Medium

---

## Task 6: Autosuggest Input Berdasarkan Data Tersedia

**Description:** Menambahkan fitur *autocomplete* / saran otomatis pada field input deskripsi/item berdasarkan data master yang sudah di-load di `store.ts`.

**Expect:** Saat user mengetik "Kera...", sistem memunculkan *dropdown popover* menyarankan "Keramik Lantai", "Keramik Dinding".

**Acceptance criteria:**
- [x] Field nama item menggunakan komponen combobox/autocomplete.
- [x] Data *suggestion* di-filter dari data eksisting di *store*.

**Verification:**
- [x] Manual check: Ketik beberapa huruf dan pastikan opsi yang relevan muncul.

**Dependencies:** None

**Estimated scope:** Medium

---

## Task 7: Kalkulasi Dua Arah (Harga vs Margin)

**Description:** Mengimplementasikan kalkulasi harga dan margin yang reaktif; perubahan pada harga akan menghitung ulang margin, dan sebaliknya.

**Expect:** User dapat mengedit kolom Harga, Margin otomatis menyesuaikan. User merevisi Margin, Harga otomatis bergeser, tanpa layar *freeze*.

**Acceptance criteria:**
- [x] *onChange* Harga mengubah state Margin (Margin = ...).
- [x] *onChange* Margin mengubah state Harga (Harga = ...).
- [x] Pencegahan infinite loop *re-render*.

**Verification:**
- [ ] Manual check: Edit kedua field secara bergantian.

**Dependencies:** Task 2

**Estimated scope:** Medium

---

## Task 8: Sinkronisasi Perubahan Item Induk ke Anak

**Description:** Mengatur *state management* agar jika "Item Induk" direvisi, sistem mencari seluruh "Item Anak" (yang memiliki referensi induk tersebut) dan menyingkronkan perubahannya.

**Expect:** B&M Manager mengedit kategori "Keramik Lantai". Semua varian keramik lantai (anak) otomatis terkoreksi kategorinya di halaman/data lain.

**Acceptance criteria:**
- [ ] Terdapat fungsi sinkronisasi di `store.ts` atau event handler.
- [ ] *Update* pada Induk memicu `.map()` pada state yang menimpa field anak.

**Verification:**
- [ ] Manual check: Edit Item Induk, lihat data Varian Anak apakah berubah.

**Dependencies:** None

**Estimated scope:** Large

---

## Task 9: Referensi Harga Lintas Cabang (Induk Sama)

**Description:** Menambahkan antarmuka (tabel/panel) yang memunculkan daftar harga dari cabang lain untuk komponen yang berada di bawah Item Induk yang sama.

**Expect:** Cabang Bandung melihat referensi harga dari Cabang Jakarta untuk "Semen PC" karena berada dalam satu induk yang sama, membantu menentukan kewajaran harga.

**Acceptance criteria:**
- [ ] Modul UI khusus yang me-render list/table komparasi.
- [ ] Data difilter dengan relasi `item.kode` (Induk) yang sama antar cabang.

**Verification:**
- [ ] Manual check: Buka rincian item, periksa apakah panel cabang lain tampil benar.

**Dependencies:** None

**Estimated scope:** Medium

---

## Task 10: Penggabungan Form Review dan Modul Survei

**Description:** Menyederhanakan alur kerja agar bagian Survei Pasar dapat diisi dan dilihat pada layar yang sama saat melakukan Pengajuan Review Harga.

**Expect:** Alih-alih berpindah tab/halaman untuk memasukkan hasil survei 3 toko, panel input survei tergabung pada halaman *Review* S&B Specialist.

**Acceptance criteria:**
- [ ] Form komponen Survei di-import/di-mount ke dalam page Review.
- [ ] *Submit* form menyimpan hasil review sekaligus data surveinya.

**Verification:**
- [ ] Manual check: Buka form review, pastikan modul survei terlihat dan tersimpan bersamaan.

**Dependencies:** None

**Estimated scope:** Large

---

## Task 11: Validasi Metadata Foto Survei (Geo Tag & Timestamp)

**Description:** Membaca data EXIF file gambar (*client-side*) saat user mengunggah foto survei. Jika GPS atau Timestamp tidak ada, tampilkan error validasi.

**Expect:** User memilih foto yang dikirim dari WhatsApp (tanpa metadata). Sistem memblokir unggahan dengan pesan: "Foto harus memiliki data lokasi dan waktu (Geo Tag & Timestamp)."

**Acceptance criteria:**
- [ ] Memanfaatkan lib/API untuk parsing EXIF saat `onChange` file input.
- [ ] Memeriksa properti GPS dan DateTime.
- [ ] Validasi memblokir/mengizinkan file berdasarkan kondisi tersebut.

**Verification:**
- [ ] Manual check: Upload foto ber-EXIF vs foto tanpa EXIF.

**Dependencies:** Task 10

**Estimated scope:** Medium

---

## Task 12: Mesin Status Persetujuan Voting (1/2 + 1)

**Description:** Mengimplementasikan kalkulasi persetujuan kontraktor. Jika jumlah `approved_by` lebih dari 50% total partisipan kontraktor, status beralih menjadi "Disetujui".

**Expect:** Ada 5 Kontraktor. Saat Kontraktor ketiga (3 dari 5) mengeklik setuju, pengajuan otomatis berstatus Final Approved tanpa menunggu 2 orang lainnya.

**Acceptance criteria:**
- [ ] Data mencatat total kontraktor yang *eligible*.
- [ ] Setiap aksi *Approve* menghitung ulang (Count > Total / 2).
- [ ] Memperbarui `status` item secara otomatis jika memenuhi syarat.

**Verification:**
- [ ] Tes dengan *mock data* 3 kontraktor, setuju 1 (Pending), setuju 2 (Approved).

**Dependencies:** None

**Estimated scope:** Large
