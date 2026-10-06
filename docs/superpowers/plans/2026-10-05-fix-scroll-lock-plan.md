# Fix Scroll Lock pada Modal Project Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki isu halaman tidak bisa di-*scroll* (scroll terkunci pada body) setelah menekan tombol "Buat Penawaran" di modal Project Planning.

**Architecture:** Modifikasi komponen tombol "Buat Penawaran" pada halaman RAB. Aksi `onClick` pada tombol ini akan diubah agar memberikan jeda eksekusi (`setTimeout` sebesar 150ms) sebelum melakukan navigasi lewat `router.push`, sehingga memberikan waktu bagi modal Radix UI untuk menyelesaikan *cleanup* atribut penguncian scroll pada *body*.

**Tech Stack:** Next.js, React.

## Global Constraints

- Lakukan modifikasi langsung pada handler `onClick` tombol "Buat Penawaran".
- Jeda `setTimeout` di-set sebesar 150ms.
- Parameter URL untuk `router.push` harus dipertahankan sama persis dengan kode awal.

---
### Task 1: Modifikasi Event onClick Tombol Buat Penawaran

**Files:**
- Modify: `c:\alfamart\KERJA\sparta-fe\app\rab\page.tsx:2291-2294` (baris yang memuat eksekusi onClick pada daftar modal Planning Requests)

**Interfaces:**
- Consumes: Fungsi `router.push`, `request` data di dalam mapping array `planningRequests`.
- Produces: `onClick` handler yang asynchronous.

- [ ] **Step 1: Ubah blok onClick pada tombol "Buat Penawaran" di `page.tsx`**

Perbarui kode yang ada menjadi seperti ini:

```javascript
                    onClick={() => {
                      setPlanningRequestDialogOpen(false);
                      setTimeout(() => {
                        router.push(`/rab?projek_planning_id=${request.projek_planning_id}&lingkup=${request.lingkup_pekerjaan}`);
                      }, 150);
                    }}
```

- [ ] **Step 2: Commit perubahan**

```bash
git add c:/alfamart/KERJA/sparta-fe/app/rab/page.tsx
git commit -m "fix: gunakan setTimeout pada router.push untuk mencegah bug scroll terkunci dari Radix UI"
```
