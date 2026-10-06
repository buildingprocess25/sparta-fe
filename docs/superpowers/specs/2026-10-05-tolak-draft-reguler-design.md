# Penolakan Draft Reguler pada Form RAB (Penawaran Final)

## 1. Konteks dan Masalah
Saat ini form RAB (Rencana Anggaran Biaya) untuk kontraktor sudah disesuaikan agar hanya mendukung mode "Proyek Renovasi". Namun, jika pengguna sebelumnya memiliki draft (tersimpan di `localStorage`) yang berstatus "Reguler" (bukan renovasi), sistem masih memuat draft tersebut. Akibatnya, form akan terisi dengan tipe proyek "Reguler" yang seharusnya tidak lagi diizinkan atau tidak ada opsi pilihannya di antarmuka baru.

## 2. Tujuan
Mencegah draft dengan status "Reguler" dimuat ke dalam form RAB dan memaksa pengguna untuk membuat pengajuan baru dengan format "Renovasi".

## 3. Desain Solusi (Implementasi)
Modifikasi logika pemuatan draft pada `c:\alfamart\KERJA\sparta-fe\app\rab\page.tsx`.

Pada bagian `useEffect` yang membaca draft dari `localStorage`:
```javascript
useEffect(() => {
  if (user?.email && !currentRabId && !hasProjectPlanningRequest) {
    const draftKey = `rab_draft_${user.email}_${user.role}_${user.cabang}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.formData && (parsed.tableRows?.length > 0 || parsed.formData.namaToko !== '')) {
          
          // --- LOGIKA BARU: BLOKIR DRAFT REGULER ---
          if (parsed.formData.isRenovasi === false || parsed.formData.proyek === 'Reguler') {
            // 1. Hapus draft dari storage
            localStorage.removeItem(draftKey);
            // 2. Munculkan error / warning kepada pengguna
            showAlert(
              "Draft Tidak Didukung", 
              "Draft yang tersimpan sebelumnya adalah draft Reguler. Saat ini sistem hanya mendukung pengajuan Renovasi. Draft lama Anda telah dihapus otomatis, silakan buat pengajuan dari awal.", 
              "warning"
            );
            // 3. Hentikan eksekusi, biarkan form tetap default (Renovasi)
            return;
          }
          // ----------------------------------------

          setDraftData(parsed);
          setDraftDialogOpen(true);
        }
      } catch (e) {
        console.error("Gagal load draft RAB", e);
      }
    }
  }
}, [user, currentRabId, hasProjectPlanningRequest]);
```

## 4. Kriteria Penerimaan
- Jika ada draft "Reguler" di local storage, sistem tidak akan menampilkan popup "Lanjutkan draft yang belum selesai?".
- Draft lama langsung dihapus secara *silent* dari local storage.
- Sistem memunculkan alert (notifikasi) yang memberitahu pengguna bahwa draft reguler sudah dihapus dan meminta mengisi form baru (renovasi).
- Aplikasi tidak error dan tetap pada *state* standar form yaitu form siap isi dengan "Proyek Renovasi (Format Baru)" sudah tercentang.
