# Penolakan Draft Reguler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mencegah pemuatan draft RAB yang tersimpan dengan status 'Reguler' dan menghapusnya dari localStorage.

**Architecture:** Modifikasi `useEffect` di halaman RAB agar mengevaluasi konten `formData` dari `localStorage` sebelum menyimpannya ke *state* `draftData`. Jika terdeteksi draft adalah 'Reguler', hapus item dari `localStorage`, tampilkan peringatan menggunakan `showAlert`, dan cegah pemunculan dialog konfirmasi draft.

**Tech Stack:** Next.js, React Hooks (useEffect).

## Global Constraints

- Kode harus ditambahkan pada lokasi `useEffect` pemuatan draft yang sudah ada.
- Jangan mengubah logika state lain selain mencegah `setDraftData` dan memanggil `showAlert`.

---
### Task 1: Mencegah Muat Draft Reguler dan Tampilkan Pesan Error

**Files:**
- Modify: `c:\alfamart\KERJA\sparta-fe\app\rab\page.tsx:607-623`

**Interfaces:**
- Consumes: `showAlert` (sudah tersedia di scope komponen).
- Produces: Logika pencegahan draft reguler pada load draft.

- [ ] **Step 1: Modifikasi logika pada useEffect untuk load draft**

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

- [ ] **Step 2: Commit perubahan**

```bash
git add c:/alfamart/KERJA/sparta-fe/app/rab/page.tsx
git commit -m "feat: blokir pemuatan draft reguler pada RAB dan hapus otomatis dari storage"
```
