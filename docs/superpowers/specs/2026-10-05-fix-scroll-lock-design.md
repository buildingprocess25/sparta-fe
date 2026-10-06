# Perbaikan Bug Scroll Lock pada Modal Project Planning

## 1. Konteks dan Masalah
Saat pengguna menekan tombol "Buat Penawaran" pada modal (dialog) "Permintaan RAB Project Planning", halaman tiba-tiba tidak bisa digeser ke bawah (di-scroll). Hal ini dikarenakan *body* masih terkunci (terdapat *pointer-events: none* dan *overflow: hidden*) oleh komponen modal Radix UI, yang tidak sempat melakukan *cleanup* karena aksi navigasi `router.push` berjalan terlalu cepat (synchronous) bersaman dengan penutupan modal.

## 2. Tujuan
Mengembalikan fungsi scroll halaman menjadi normal setelah pengguna memilih proyek dari modal Project Planning.

## 3. Desain Solusi (Implementasi)
Modifikasi aksi `onClick` pada tombol "Buat Penawaran" di `c:\alfamart\KERJA\sparta-fe\app\rab\page.tsx`.

Kode saat ini:
```javascript
onClick={() => {
  setPlanningRequestDialogOpen(false);
  router.push(`/rab?projek_planning_id=${request.projek_planning_id}&lingkup=${request.lingkup_pekerjaan}`);
}}
```

Akan diubah menjadi:
```javascript
onClick={() => {
  setPlanningRequestDialogOpen(false);
  // Beri jeda agar Radix UI sempat menghapus class pengunci scroll pada body
  setTimeout(() => {
    router.push(`/rab?projek_planning_id=${request.projek_planning_id}&lingkup=${request.lingkup_pekerjaan}`);
  }, 150);
}}
```

## 4. Kriteria Penerimaan
- Pengguna dapat menggulir halaman RAB ke atas dan ke bawah secara bebas setelah mengklik "Buat Penawaran" pada modal Project Planning.
- Pemuatan form RAB dari permintaan Project Planning tetap berjalan sesuai dengan data yang diharapkan tanpa menyebabkan bug navigasi ganda.
