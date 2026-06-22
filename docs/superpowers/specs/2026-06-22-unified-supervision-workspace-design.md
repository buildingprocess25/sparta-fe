# Unified Gantt & PIC Supervision Workspace

## Scope

- Input Gantt tetap terpisah per lingkup SIPIL dan ME.
- Data `toko`, `gantt_chart`, `pengawasan_gantt`, `pengawasan`, `pic_pengawasan`, dan `opname_final` tetap terpisah per `id_toko`.
- Mode pengawasan dan menu PIC digabung pada level ULOK dan tampilan.

## Mode Pengawasan Gantt

Setelah pengguna memilih satu ULOK, workspace menampilkan:

1. Ringkasan proyek gabungan.
2. Panel SIPIL di atas.
3. Panel ME di bawah.
4. Timeline dan checkpoint pengawasan masing-masing lingkup.

Jika salah satu lingkup belum tersedia, lingkup lain tetap dapat digunakan dan panel yang hilang diberi status informatif.

### Indikator Opname

Titik merah berkedip hanya tampil pada checkpoint yang memiliki item `pengawasan.status = selesai` dan belum memiliki pasangan `opname_item`.

- Label: `Ada pekerjaan siap Opname`.
- Klik checkpoint membuka memo pengawasan dan menyediakan aksi `Lanjut Opname`.
- Setelah item tersimpan sebagai Opname, indikator berubah menjadi status statis `Sudah masuk Opname`.
- Checkpoint sesudah seluruh pekerjaan selesai tidak membuka form kosong. UI menampilkan `Tidak ada pekerjaan tersisa—lanjutkan melalui Opname`.

### Serah Terima

Tombol `Generate Serah Terima` dikeluarkan dari modal Opname dan ditempatkan pada panel status utama ULOK.

Tombol aktif jika seluruh lingkup yang tersedia telah memiliki Opname Final yang memenuhi syarat pembuatan Serah Terima. Status readiness SIPIL dan ME ditampilkan terpisah.

## PIC Pengawasan

Menu PIC memakai satu pilihan ULOK dan satu workspace:

- satu PIC bersama;
- satu pilihan jadwal pengawasan bersama;
- preview Gantt SIPIL di atas;
- preview Gantt ME di bawah;
- saat disimpan, backend tetap membuat/memperbarui PIC dan tanggal pengawasan pada masing-masing lingkup.

Data existing parsial dipertahankan dan lingkup yang belum memiliki PIC dilengkapi menggunakan jadwal existing.

## Backend

Tambahkan endpoint agregasi read-only berdasarkan ULOK untuk mengembalikan:

- seluruh lingkup dan Gantt terbaru;
- checkpoint tanggal;
- jumlah item selesai yang belum masuk Opname;
- jumlah item yang sudah masuk Opname;
- status readiness Opname Final dan Serah Terima per lingkup;
- status PIC per lingkup.

Endpoint aksi tetap memakai endpoint existing per Gantt/per toko untuk menjaga kompatibilitas.

## Verifikasi

- Satu ULOK dengan SIPIL dan ME.
- ULOK hanya SIPIL atau hanya ME.
- Checkpoint tanpa item tersisa.
- Checkpoint dengan item selesai belum Opname.
- Checkpoint setelah Opname tersimpan.
- Readiness Serah Terima parsial dan lengkap.
- PIC existing pada satu lingkup saja.
