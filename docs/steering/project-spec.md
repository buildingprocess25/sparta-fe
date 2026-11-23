# Project Spec — SPARTA (System for Property Administration, Reporting, Tracking & Approval)

## Master Document — Fondasi Teknis, Arsitektur, dan Spesifikasi Modul

Dokumen ini adalah **panduan spesifikasi utama (Single Source of Truth)** untuk seluruh pengembangan aplikasi frontend **SPARTA** (PT Sumber Alfaria Trijaya Tbk). Semua pengembang dan AI agent wajib membaca dan merujuk dokumen ini dalam merancang, memodifikasi, maupun mengintegrasikan fitur pada antarmuka pengguna.

---

## 1. Identitas Proyek

| Atribut | Nilai | Catatan |
| :--- | :--- | :--- |
| **Nama Sistem** | SPARTA Building | System for Property Administration, Reporting, Tracking & Approval |
| **Organisasi / Klien**| PT Sumber Alfaria Trijaya Tbk | Divisi Property Development, Building & Maintenance |
| **Cakupan Bisnis** | Konstruksi Toko Baru, Renovasi, & Distribution Center (DC) | Siklus penuh: Perencanaan (FPD) → RAB → SPK → Gantt / Kurva S → Opname & KTK → BAST → Arsip Dokumen Teknis |
| **Skala Operasional** | Nasional (Seluruh Cabang & DC Alfamart di Indonesia) | Mengelola 40+ Cabang Utama, Sub-Cabang, serta Kantor Pusat (Head Office) |
| **Dual Workspace** | 1. Toko (SPARTA Building)<br>2. DC Development | Dipisahkan berdasarkan hak akses role & kebutuhan bisnis logistik |
| **Framework Base** | Next.js 16.1.6 (App Router) + React 19.2.3 | Arsitektur modern dengan Server Components & Client Interactive Components |
| **Bahasa** | TypeScript 5 (Strict Mode) | Validasi tipe penuh di seluruh API, state, dan props komponen |
| **Styling Engine** | Tailwind CSS v4 + PostCSS v4 | Token arsitektur berbasis `@theme inline` dan CSS Variables OKLCH |
| **UI Primitive** | Shadcn UI (`radix-maia` style) + Radix UI + Base UI | Desain rounded pill, micro-interaction responsif, aksesibilitas tinggi |
| **Base Port Dev** | Port 3002 (`next dev -p 3002`) | Port default agar tidak bentrok dengan backend / SSO service |
| **API Backend** | Sparta Backend REST API | Base URL: `process.env.NEXT_PUBLIC_API_URL` (Default: `https://api-building.sparta-alfamart.web.id`) |

---

## 2. Tech Stack & Dependensi Utama

| Layer / Kategori | Pilihan Teknologi | Versi | Rationale & Fungsi |
| :--- | :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router) | `16.1.6` | Routing modular, server-side rendering, layout inheritance, metadata management |
| **Runtime Library** | React & React DOM | `19.2.3` | Ekosistem React 19 dengan performa rendering optimal |
| **Bahasa Pemrograman**| TypeScript | `^5.0.0` | Menjamin type safety kontrak API, data formulir proyek, dan model entitas |
| **CSS Utility Engine**| Tailwind CSS | `^4.0.0` | Mesin CSS generasi terbaru tanpa file konfigurasi `tailwind.config.js` |
| **Animasi** | tw-animate-css | `^1.4.0` | Transisi smooth dialog, accordion, drawer, alert banner |
| **Komponen UI** | Shadcn UI (`radix-maia`), Radix UI, Base UI | `^3.8.5` / `^1.4.3` | Komponen headless teruji (Dialog, Accordion, Select, Tabs, Popover, Switch) |
| **Ikonografi** | Lucide React & Hugeicons | Lucide `^0.575`, Hugeicons `^1.1.5` | Ikon industri presisi tinggi, clean, tree-shakeable |
| **Visualisasi / Chart**| Chart.js, react-chartjs-2, Recharts | Chart.js `^4.5.1`, Recharts `^3.10.1` | Kurva S proyek, perbandingan deviasi harian, grafik monitoring KPI |
| **Manipulasi Tanggal** | date-fns & react-day-picker | date-fns `^4.1.0`, day-picker `^10.0.0` | Penjadwalan proyek, filter periode, tanggal backdate, hari libur nasional |
| **PDF Processing** | jsPDF, jsPDF-AutoTable, pdfjs-dist | jsPDF `^4.2.0`, pdfjs `^4.10.38` | Render cetak otomatis RAB resmi, SPK, Berita Acara, dan viewer dokumen inline |
| **Image Compression** | browser-image-compression | `^2.0.2` | Kompresi foto dokumentasi toko di sisi client (Max 300KB) sebelum upload ke server |
| **Class Merge Helper** | clsx & tailwind-merge | clsx `^2.1.1`, twMerge `^3.5.0` | Utility `cn()` untuk penggabungan aman class Tailwind |
| **PWA & Offline** | Service Worker (`sw.js`) | Native PWA | Caching aset static, dukungan ikon mobile app, orientasi field engineer |

---

## 3. Arsitektur Dual Workspace

SPARTA menerapkan pemisahan workspace logis pada rute `/workspace` guna memenuhi dua kebutuhan konstruksi korporat:

```
                          ┌───────────────────────────┐
                          │   Halaman Login (/auth)   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Workspace Switcher      │
                          │      (/workspace)         │
                          └──────┬─────────────┬──────┘
                                 │             │
        Role Store / Super Human │             │ Role DC Development / Super Human
                                 ▼             ▼
          ┌──────────────────────────┐     ┌──────────────────────────┐
          │  Workspace Toko          │     │  Workspace DC            │
          │  (SPARTA Building)       │     │  (DC Development)        │
          │  Route: /dashboard       │     │  Route: /dc-development  │
          └──────────────────────────┘     └──────────────────────────┘
```

1. **Workspace Toko (SPARTA Building)**:
   - Dikhususkan untuk toko minimarket Alfamart baru maupun renovasi.
   - Melibatkan Cabang, Koordinator Bangunan, Maintenance Manager (BBMM), Branch Manager, Kontraktor Toko, dan Head Office.
   - Modul: FPD Project Planning, RAB Toko, SPK Toko, Pertambahan Hari SPK, Gantt Chart & Kurva S Harian, Opname Parsial & Final KTK, Dokumentasi Bangunan Foto Toko, Penyimpanan 12 Dokumen Toko, BAST Toko, Surat Peringatan & Denda.

2. **Workspace DC Development**:
   - Dikhususkan untuk konstruksi gedung gudang pusat distribusi logistik (Distribution Center).
   - Melibatkan Konsultan Soil Investigation, Konsultan Perencana, Konsultan Pengawas (MK), Kontraktor DC, DC Document Admin, DC Specialist, DC Manager, GM Building Development, GM Location Development, hingga Property Development Director.
   - Modul: Manajemen Tender & Peserta, Termin Pembayaran DC, Kurva S Monitoring DC, Pengawasan Lapangan MK, BAST DC, Manajemen Vendor & Dokumen Teknis DC.

---

## 4. Struktur Folder Proyek (`sparta-fe`)

```text
sparta-fe/
├── app/                                # Next.js 16 App Router (Rute & Layout)
│   ├── layout.tsx                      # Root layout (Font Geist, SessionProvider, GlobalAlert, ErrorReporter)
│   ├── globals.css                     # Tailwind v4 @theme inline + OKLCH Design Tokens + Legibility Overrides
│   ├── page.tsx                        # Public landing page (Pintu masuk Dashboard, Manual, & Tentang)
│   ├── auth/page.tsx                   # Halaman autentikasi SSO / Credential & pemilihan cabang
│   ├── workspace/page.tsx              # Portal pemilihan Workspace (Toko vs DC Development)
│   ├── dashboard/                      # Command Center & Monitoring Dashboard Proyek
│   │   ├── page.tsx                    # Dashboard utama Toko (KPI v1/v2/v3, Task Bell, Filter Cabang)
│   │   └── kontraktor/page.tsx         # Dashboard khusus role Kontraktor (Task, RAB, Proyek berjalan)
│   ├── projek-planning/                # Modul Project Planning (Form Permintaan Desain / FPD)
│   │   ├── page.tsx                    # Daftar & tracking alur approval FPD
│   │   ├── form/page.tsx               # Formulir pengajuan FPD baru
│   │   └── [id]/page.tsx               # Detail & review approval FPD
│   ├── rab/                            # Modul Penawaran Final Kontraktor (RAB)
│   │   ├── page.tsx                    # Pengisian, kalkulasi, & submit RAB Sipil/ME
│   │   └── migrasi/page.tsx            # Bulk migrasi histori RAB via Excel
│   ├── ubah-rab-item/page.tsx          # Master data manajemen & modifikasi item RAB via CSV
│   ├── spk/                            # Modul Surat Perintah Kerja (SPK)
│   │   ├── page.tsx                    # Pembuatan & persetujuan SPK kontraktor
│   │   ├── backdate/page.tsx           # Konfigurasi policy cabang izin tanggal backdate
│   │   └── migrasi/page.tsx            # Migrasi data SPK lama
│   ├── tambahspk/                      # Modul Perpanjangan Waktu / Addendum SPK
│   │   ├── page.tsx                    # Pengajuan & approval pertambahan hari kerja
│   │   └── migrasi/page.tsx            # Migrasi histori pertambahan SPK
│   ├── gantt/                          # Modul Gantt Chart & Kurva S Proyek
│   │   ├── page.tsx                    # Visualisasi progress harian, deviasi, & kurva S toko
│   │   └── migrasi/page.tsx            # Migrasi data jadwal Gantt
│   ├── inputpic/page.tsx               # Penugasan PIC Pengawas Cabang per proyek
│   ├── pengawasan/migrasi/page.tsx     # Migrasi log pengawasan proyek
│   ├── opname/                         # Modul Opname Fisik Lapangan & KTK
│   │   ├── page.tsx                    # Evaluasi fisik termin parsial & Final KTK
│   │   └── migrasi/page.tsx            # Migrasi histori opname
│   ├── ftdokumen/page.tsx              # Dokumentasi Bangunan (Foto Progres & Kompresi)
│   ├── svdokumen/                      # Penyimpanan Dokumen Teknis Toko (12 Kategori)
│   │   ├── page.tsx                    # Upload, validasi, dan arsip dokumen toko
│   │   └── migrasi/page.tsx            # Migrasi arsip dokumen lama
│   ├── instruksi-lapangan/             # Modul Instruksi Lapangan (Pekerjaan Tambah/Kurang Lapangan)
│   │   ├── page.tsx                    # Form Instruksi Lapangan resmi
│   │   ├── migrasi/page.tsx            # Migrasi data Instruksi Lapangan
│   │   └── migrasi-rab2/page.tsx       # Migrasi lanjutan IL RAB 2
│   ├── serah-terima/                   # Modul Berita Acara Serah Terima (BAST Toko)
│   │   ├── koreksi-tanggal/page.tsx    # Koreksi tanggal BAST & sinkronisasi dokumen
│   │   └── migrasi/page.tsx            # Migrasi histori serah terima toko
│   ├── surat-peringatan/page.tsx       # Manajemen Surat Peringatan (SP 1, 2, 3) & Kalkulasi Denda
│   ├── kontraktor/surat-peringatan/    # Tampilan SP dari sisi kontraktor
│   ├── approval/page.tsx               # Approval Center terpadu multi-dokumen & multi-role
│   ├── tarikan-data/page.tsx           # Export Center (Download Data Proyek Excel / CSV)
│   ├── list/page.tsx                   # Direktori & pencarian cepat seluruh dokumen proyek
│   ├── intervensi/page.tsx             # Emergency Override Center (Khusus Super Human)
│   ├── users/page.tsx                  # Manajemen User, Role, & Akses Cabang
│   ├── system-maintenance/page.tsx     # Konfigurasi pembatasan jam operasional & maintenance
│   ├── dc-development/                 # Modul Konstruksi Distribution Center (DC)
│   │   ├── page.tsx                    # Dashboard utama proyek DC
│   │   ├── tenders/                    # Manajemen tender & seleksi peserta
│   │   │   ├── page.tsx                # Daftar tender aktif & status evaluasi
│   │   │   ├── [id]/page.tsx           # Detail peserta & penawaran tender
│   │   │   └── participants/[id]/termin/page.tsx # Konfigurasi termin pembayaran kontraktor DC
│   │   ├── projects/                   # Proyek konstruksi DC aktif
│   │   │   ├── page.tsx                # List proyek DC
│   │   │   └── [id]/                   # Monitoring Kurva S & BAST DC
│   │   ├── supervision/page.tsx        # Modul Konsultan Pengawas MK (Manajemen Konstruksi)
│   │   ├── documents/                  # Manajemen dokumen DC (Legalitas, Sipil, ME, Arsitektur)
│   │   │   ├── page.tsx                # Folder kategori dokumen DC
│   │   │   └── [id]/[tipe]/page.tsx    # Slot upload file (PDF, DWG, DOCX, XLSX)
│   │   ├── terms/page.tsx              # Pengajuan & persetujuan termin pembayaran DC
│   │   ├── bast/page.tsx               # Pengelolaan BAST Proyek DC
│   │   ├── vendors/page.tsx            # Master data vendor & kontraktor DC
│   │   └── users/page.tsx              # Hak akses tim proyek DC
│   ├── manual/page.tsx                 # Manual panduan operasional pengguna (PDF viewer)
│   └── about/page.tsx                  # Informasi sistem, versi, & tim pengembang
│
├── components/                         # Komponen Reusable Modular
│   ├── AppNavbar.tsx                   # Top navigation bar seragam (Brand vs Clean variant)
│   ├── LandingNavbar.tsx               # Hero header halaman utama publik
│   ├── GlobalAlert.tsx                 # Dialog notifikasi modal tersentralisasi
│   ├── ErrorReporter.tsx               # Listener global penangkap runtime & API error
│   ├── LoadingOverlay.tsx              # Backdrop overlay spinner seragam
│   ├── TaskNotificationBell.tsx        # Lonceng notifikasi tugas pending real-time
│   ├── GanttViewer.tsx                 # Engine visualisasi interaktif Gantt Chart
│   ├── SpAnalyticsDashboard.tsx        # Visualisasi data analitik Surat Peringatan
│   ├── UnifiedSupervisionGantt.tsx     # Pengawasan integratif timeline proyek
│   ├── dashboard/                      # Komponen internal modul Dashboard
│   │   ├── DashboardNavigation.tsx     # Pengelompokan menu & switcher grup navigasi
│   │   ├── DashboardCommandWorkspace.tsx # Workspace cepat pintasan aksi
│   │   ├── contractor/                 # Modal & widget khusus kontraktor
│   │   ├── v2/                         # Dashboard versi 2 (Charts, KPI Cards, Filter Bar)
│   │   └── v3/                         # Dashboard versi 3 (Performance drilldown, timeline)
│   └── ui/                             # Komponen Atomik Shadcn UI (`radix-maia`)
│       ├── button.tsx, badge.tsx, card.tsx, input.tsx, select.tsx, dialog.tsx,
│       ├── accordion.tsx, calendar.tsx, date-picker.tsx, switch.tsx, tabs.tsx,
│       └── textarea.tsx, alert-dialog.tsx, dropdown-menu.tsx, combobox.tsx, ...
│
├── context/                            # Global State Management React Context
│   ├── SessionContext.tsx              # Autentikasi sesi, role RBAC, dan batasan jadwal operasional
│   └── GlobalAlertContext.tsx          # Service alert dialog notifikasi/konfirmasi
│
├── hooks/                              # Custom React Hooks
│   └── useContractorDashboard.ts       # Hook kalkulasi metrik & tugas kontraktor
│
├── lib/                                # Core Utilities & API Client Services
│   ├── api.ts                          # Client service API utama (6000+ baris kontrak backend)
│   ├── api/                            # Sub-client spesifik (kpi-performance, performance-v3)
│   ├── constants.ts                    # Master data: Role, Menus, Branch Mapping, ULOK Codes
│   ├── utils.ts                        # Helper formatRupiah, parseCurrency, compressImage, cn
│   ├── approval-notifications.ts       # Logic agregasi hitungan task approval
│   ├── dc-document.config.ts           # Konfigurasi kategori dokumen teknis DC
│   ├── denda-actions-api.ts            # Client API sanksi & denda keterlambatan kontraktor
│   ├── gantt-calculator.ts             # Kalkulator deviasi hari kerja & kalender libur
│   └── request-intervensi-api.ts       # Client API alur intervensi dokumen Super Human
│
├── public/                             # Static Assets
│   ├── assets/                         # Logo Alfamart Emblem, Building Logo, Foto Gedung
│   ├── user-manual/                    # Dokumen panduan PDF pembaruan sistem
│   ├── sw.js                           # Service worker PWA
│   ├── icon-192x192.png                # App icon PWA
│   └── icon-512x512.png                # Splash icon PWA
│
├── components.json                     # Konfigurasi Shadcn UI (radix-maia, hugeicons, zinc)
├── package.json                        # Definisi dependensi & skrip Next.js
├── postcss.config.mjs                  # PostCSS plugin (@tailwindcss/postcss)
└── tsconfig.json                       # Konfigurasi TypeScript compiler & path alias (@/*)
```

---

## 5. Role-Based Access Control (RBAC) & Struktur Organisasi

SPARTA menerapkan pembatasan hak akses berbasis peran (RBAC) yang sangat ketat pada `lib/constants.ts` dan ditegakkan oleh `context/SessionContext.tsx`.

### 5.1 Matriks Peran & Lingkup Kewenangan

| Kelompok Peran | Nama Peran Resmi di Sistem | Hak Akses Utama |
| :--- | :--- | :--- |
| **Pimpinan Pusat** | `HEAD OFFICE` | Monitoring global seluruh cabang, read-only data, analisis laporan nasional. |
| **Manajemen Cabang** | `BRANCH MANAGER` | Persetujuan akhir (Approval) RAB, SPK, Pertambahan SPK, dan Serah Terima cabang terkait. |
| **Operasional Bangunan Cabang** | `BRANCH BUILDING & MAINTENANCE MANAGER` (BBMM) | Persetujuan teknis RAB/SPK, monitoring Gantt, pengajuan SP, approval progress opname. |
| **Koordinator Lapangan** | `BRANCH BUILDING COORDINATOR` | Verifikasi dokumen lapangan, pengajuan intervensi, input PIC, persetujuan FPD. |
| **Pengawas Lapangan** | `BRANCH BUILDING SUPPORT` | Input harian pengawasan fisik pada Gantt Chart, upload foto progress, opname parsial, input IL. |
| **Mitra Pelaksana** | `KONTRAKTOR` | Input penawaran final RAB, upload update progress harian, monitoring denda, cek SPK. |
| **Pimpinan Rekanan** | `DIREKTUR KONTRAKTOR` | Menandatangani & menyetujui penawaran RAB serta SPK dari pihak rekanan. |
| **Manajemen Regional** | `BUILDING & MAINTENANCE REGIONAL MANAGER` | Monitoring lintas cabang regional, evaluasi performa cabang, review FPD. |
| **Pengendali Toko** | `STORE & BRANCH CONTROLLING SPECIALIST` | Audit kepatuhan dokumen, koreksi tanggal serah terima toko, analisis deviasi. |
| **Manajemen Energi & Gedung** | `BUILDING MAINTENANCE & ENERGY SYSTEM MANAGER`<br>`BUILDING & MAINTENANCE GENERAL MANAGER` | Monitoring performa pembangunan & efisiensi operasional skala nasional. |
| **Perencanaan Proyek** | `PROJECT PLANNING & DEVELOPMENT SPECIALIST`<br>`PROJECT PLANNING & DEVELOPMENT MANAGER` | Penerimaan, review teknis desain, dan persetujuan Form Permintaan Desain (FPD). |
| **Tim Proyek Distribution Center** | `KONSULTAN SOIL INVESTIGATION`<br>`KONSULTAN PERENCANA`<br>`KONSULTAN PENGAWAS DC`<br>`KONTRAKTOR DC`<br>`DC DOCUMENT ADMIN`<br>`DC BUILDING & DEVELOPMENT SPECIALIST`<br>`DC BUILDING & DEVELOPMENT MANAGER`<br>`BUILDING & DEVELOPMENT GENERAL MANAGER`<br>`LOCATION & DEVELOPMENT GENERAL MANAGER`<br>`PROPERTY DEVELOPMENT DIRECTOR` | Akses terisolasi pada Workspace DC Development: tender gudang, kurva S konstruksi DC, pengawasan MK, termin pembayaran, verifikasi BAST DC. |
| **Super Administrator** | `BUILDING & MAINTENANCE SUPER HUMAN` | Akses tidak terbatas (Bypass semua cabang, intervensi status, policy backdate SPK, kontrol jadwal operasional, seluruh modul migrasi). |

### 5.2 Struktur Hierarki Cabang & Pemetaan ULOK

Beberapa cabang satelit beroperasi di bawah naungan Cabang Induk (`BRANCH_GROUPS`). Pengguna yang memiliki hak `isBranchSupportRole` secara otomatis memiliki visibilitas ke seluruh cabang dalam grupnya:

```
[CIKOKOL (KZ01)]   ───► Cikokol, Parung, Balaraja, Serang, Bintan
[CILEUNGSI (JZ01)] ───► Cileungsi, Bogor, Bekasi, Karawang
[BANDUNG RAYA]     ───► Bandung Raya, Bandung, Bandung 1, Bandung 2
[SIDOARJO (UZ01)]  ───► Sidoarjo, Sidoarjo BPN SMD, Manokwari, NTT, Sorong
[PALEMBANG (PZ01)] ───► Palembang, Bengkulu, Bangka, Belitung
[MEDAN (WZ01)]     ───► Medan, Aceh
[LAMPUNG (LZ01)]   ───► Lampung, Kotabumi
[LOMBOK (1SZ1)]    ───► Lombok, Sumbawa
```

### 5.3 Kebijakan Jam & Hari Kerja Operasional (Operating Schedule)

Untuk menjamin integritas data dan disiplin kerja konstruksi, sistem membatasi waktu interaksi pengguna melalui `SessionContext.tsx`:
- **Hari Operasional**: Pengaturan hari kerja (Senin–Jumat) dan opsi aktif/nonaktif akses di akhir pekan (Sabtu–Minggu).
- **Jam Akses Kontraktor**: Ditentukan dengan jam mulai & jam selesai khusus (misal: 07:00 – 21:00).
- **Jam Akses Internal**: Jam operasional staf Alfamart.
- **Bypass**: Pengguna dengan role `BUILDING & MAINTENANCE SUPER HUMAN` dibebaskan dari pembatasan waktu.

---

## 6. Arsitektur Komunikasi API & Session Security

Seluruh interaksi client-to-backend diorkestrasi melalui `lib/api.ts` dengan pola keamanan terstandar:

```
┌─────────────────────────┐
│     Client Action       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     apiFetch() Wrapper  │ ──► Sisipkan Bearer Token dari sessionStorage ("spartaAccessToken")
└────────────┬────────────┘ ──► Tambahkan Header "ngrok-skip-browser-warning"
             │
             ▼
┌─────────────────────────┐
│      HTTP Request       │
└────────────┬────────────┘
             │
             ├────── 200 OK ──────► Parse JSON / Stream PDF Blob
             │
             └────── 401 Unauthorized
                           │
                           ▼
             ┌─────────────────────────┐
             │  Clear Auth Session     │
             │  Set Expiry Message     │
             │  Redirect to /auth      │
             └─────────────────────────┘
```

1. **Storage Keamanan**: Token JWT disimpan di `sessionStorage` dengan key `spartaAccessToken` dan `spartaAccessTokenExpiresAt`.
2. **Auto-Header Injection**: Fungsi `apiFetch` secara otomatis menyematkan header `Authorization: Bearer <token>` untuk setiap request ke domain API SPARTA.
3. **Penanganan 401 Graceful**: Jika session kadaluarsa, session dibersihkan dan pengguna diarahkan ke `/auth` dengan notifikasi "Sesi berakhir, silakan login kembali."
4. **Error Interception**: `setApiErrorHandler` menangkap kesalahan fetch global dan menyampaikannya ke `ErrorReporter.tsx` untuk dirender via `GlobalAlert.tsx`.

---

## 7. Katalog Modul & Alur Bisnis (End-to-End Workflow)

```
[Tahap 1: Perencanaan]
  FPD (Project Planning) ──► Desain & Spek Disetujui ──► Penawaran Final (RAB) ──► Approval RAB
                                                                                        │
[Tahap 2: Legalitas & SPK]                                                             ▼
  Penerbitan SPK ◄── Penunjukan Kontraktor ◄────────────────────────────────────────────┘
       │
       ├────────────────────────────────────────┬───────────────────────────────────────┐
       ▼                                        ▼                                       ▼
[Tahap 3: Pelaksanaan]                   [Instruksi Lapangan]                    [Tambah SPK]
  Gantt Chart & Kurva S (Harian)           Pekerjaan Tambah/Kurang Lapangan        Kompensasi Cuaca/Izin
  Input PIC & Dokumentasi Foto
       │
       ▼
[Tahap 4: Evaluasi & Opname]
  Opname Parsial (Termin 1, 2, ..) ──► Opname Final & KTK ──► Perhitungan Sanksi/Denda (Jika ada)
       │
       ▼
[Tahap 5: Serah Terima & Arsip]
  BAST (Berita Acara Serah Terima) ──► 12 Kategori Dokumen Toko ──► Arsip SVDokumen Selesai
```

### 7.1 Tahap 1 — Perencanaan & RAB
- **Project Planning (`/projek-planning`)**: Pengajuan Form Permintaan Desain (FPD) dari cabang ke tim Planning Pusat dengan alur verifikasi bertingkat: Koordinator → BBMM → Regional Manager → PP Specialist → PP Manager.
- **Penawaran Final RAB (`/rab`)**: Input breakdown harga satuan pekerjaan Sipil (18 kategori) dan ME (4 kategori) berdasarkan referensi harga cabang (`SUPPORTED_PRICE_BRANCHES`). Menghasilkan file PDF RAB legal berstempel.
- **Ubah RAB Item (`/ubah-rab-item`)**: Penggantian massal template satuan item melalui file CSV.

### 7.2 Tahap 2 — Surat Perintah Kerja (SPK)
- **SPK (`/spk`)**: Penentuan nomor SPK, kontraktor pelaksana, tanggal mulai, durasi kerja, dan total nilai kontrak borongan.
- **SPK Backdate Policy (`/spk/backdate`)**: Pengendali kebijakan khusus cabang mana saja yang diizinkan memilih tanggal mulai pekerjaan di masa lampau (lampau/backdate).

### 7.3 Tahap 3 — Pelaksanaan & Monitoring Proyek
- **Penunjukan PIC (`/inputpic`)**: Menentukan personal pengawas lapangan dari tim cabang.
- **Gantt Chart & Kurva S (`/gantt`)**: Input persentase progress mingguan/harian per sub-pekerjaan. Kurva S membandingkan garis rencana (Target S-Curve) vs realisasi lapangan. Menghitung otomatis status "On Track", "Terlambat (Minus)", atau "Maju (Plus)".
- **Instruksi Lapangan (`/instruksi-lapangan`)**: Catatan pekerjaan tambah/kurang mendesak di lapangan yang ditandatangani pengawas dan kontraktor sebelum diajukan ke Opname KTK.
- **Pertambahan SPK (`/tambahspk`)**: Addendum perpanjangan durasi kerja akibat kendala eksternal (izin warga, kendala PLN, cuaca ekstrem).
- **Dokumentasi Bangunan (`/ftdokumen`)**: Upload foto progress dari berbagai sudut toko (tampak depan, area sales, teras, gudang, mess, toilet). Gambar dikompresi otomatis di sisi browser maksimal 300KB (1200px JPEG) sebelum diunggah.

### 7.4 Tahap 4 — Evaluasi Fisik & Opname
- **Opname Proyek (`/opname`)**: Pemeriksaan fisik bersama untuk pencairan termin pembayaran (Termin 1, 2, 3) dan Opname Final / KTK (Koreksi Tambah Kurang).
- **Surat Peringatan & Denda (`/surat-peringatan`)**: Jika proyek melampaui batas akhir masa SPK (ditambah pertambahan SPK yang disetujui), sistem mengkalkulasi denda keterlambatan harian (1/1000 per hari keterlambatan) serta menerbitkan SP 1, SP 2, dan SP 3.

### 7.5 Tahap 5 — Serah Terima & Arsip Dokumen
- **Serah Terima Toko (`/serah-terima`)**: Penandatanganan BAST (Berita Acara Serah Terima) fisik bangunan toko baru dari kontraktor ke cabang dan operasional toko.
- **Koreksi Tanggal BAST (`/serah-terima/koreksi-tanggal`)**: Fasilitas otorisasi khusus Super Human & Controlling untuk mensinkronisasi kembali tanggal serah terima pada seluruh dokumen turunan yang terdampak.
- **Penyimpanan Dokumen Toko (`/svdokumen`)**: Database digital 12 dokumen mandatory toko baru (Sipil, ME, RAB Final, SPK, BAST, IMB/PBG, AMDAL/UKL-UPL, Sertifikat Tanah, SLO PLN, NIDI PLN, SLF Hydrant & Petir, Dokumentasi Foto).

---

## 8. Modul Khusus — DC Development (`/dc-development`)

Modul independen untuk pembangunan gedung logistik Distribution Center Alfamart yang memiliki siklus tender dan administrasi berskala besar:

| Sub-Modul | Rute | Fitur & Fungsionalitas |
| :--- | :--- | :--- |
| **Dashboard DC** | `/dc-development` | Statistik proyek gudang, status tender, monitoring fisik DC |
| **Manajemen Tender** | `/dc-development/tenders` | Pembuatan tender konstruksi DC, pengumuman, dan evaluasi penawaran vendor |
| **Peserta & Termin** | `/dc-development/tenders/participants/[id]/termin` | Penetapan tahapan termin pembayaran kontraktor pemenang tender DC |
| **Monitoring DC** | `/dc-development/monitoring` | Kurva S komprehensif konstruksi gedung gudang, perkerasan jalan, dan ME gedung |
| **Supervision MK** | `/dc-development/supervision` | Ruang kerja Konsultan Pengawas Manajemen Konstruksi (MK) untuk logbook harian |
| **Dokumen Teknis DC** | `/dc-development/documents` | Pengarsipan Siteplan, IMB, PBG, SLO, AMDAL, UKL-UPL, As-Built Drawing (PDF & DWG) |
| **BAST Proyek DC** | `/dc-development/bast` | Berita Acara Serah Terima bangunan gedung Distribution Center |

---

## 9. Sistem Kontrol & Pemeliharaan Sistem

1. **Approval Center (`/approval`)**: Menghimpun seluruh permohonan persetujuan tertunda (RAB, SPK, Pertambahan SPK, IL, BAST) ke dalam satu meja kerja terintegrasi dengan filter jenis dokumen dan status.
2. **Emergency Intervensi (`/intervensi`)**: Fitur darurat bagi role `BUILDING & MAINTENANCE SUPER HUMAN` untuk mereset status dokumen yang terhambat, memperbaiki data approval, atau membatalkan dokumen salah tanpa mengulang dari awal.
3. **Pemeliharaan Sistem (`/system-maintenance`)**: Mengaktifkan banner pemeliharaan sistem, mengatur jam operasional login kerja harian, dan mengisolasi akses kontraktor.
4. **Tarikan Data Proyek (`/tarikan-data`)**: Modul ekstraksi data tingkat lanjut untuk mengekspor database RAB, SPK, Progres Proyek, dan Status Toko ke format Excel (`.xlsx`) dan CSV dengan kriteria cabang, rentang tanggal, dan status penyelesaian.

---

## 10. Konvensi Koding & Best Practices Frontend

### 10.1 Konvensi Komponen React & Next.js
- Seluruh halaman dan komponen yang membutuhkan interaksi user, hooks (`useState`, `useEffect`, `useSession`), atau manipulasi browser wajib diawali dengan direktif `"use client"`.
- Gunakan TypeScript Interface untuk mendefinisikan kontrak props setiap komponen secara eksplisit.
- Hindari inline style `style={{...}}`. Gunakan utility class Tailwind CSS atau token CSS variables.

### 10.2 Penanganan State & Notifikasi
- Gunakan hook `useGlobalAlert()` dari `@/context/GlobalAlertContext` untuk seluruh notifikasi modal (`success`, `error`, `warning`, `info`) dan dialog konfirmasi aksi kritis.
- Selalu bungkus aksi asynchronous berdurasi lama (export Excel, generate PDF, upload gambar banyak) dengan `<LoadingOverlay isVisible={loading} />`.
- Gunakan helper `cn()` dari `@/lib/utils` untuk menggabungkan class conditionally.

### 10.3 Manipulasi Angka & Tanggal
- Format seluruh representasi mata uang Rupiah menggunakan fungsi seragam `formatRupiah(number)` dari `@/lib/utils` untuk memastikan simbol `Rp` dan separator titik Indonesia konsisten di seluruh layar.
- Konversi input teks rupiah menggunakan `parseCurrency(string | number)` guna mencegah bug parsing angka desimal dan nilai format lokal.

### 10.4 Penanganan Upload Gambar
- Semua file foto yang diambil di lapangan wajib dikompresi di browser menggunakan helper `compressImage(file)` (`maxSizeMB: 0.3`, `maxWidthOrHeight: 1200`, `useWebWorker: false`).
- Parameter `useWebWorker: false` wajib dipertahankan untuk mematuhi kebijakan Content Security Policy (CSP) produksi yang melarang pengambilan inline worker dari CDN.

---

## 11. Environment Variables

Pastikan variabel berikut terdaftar pada file `.env.local` saat pengembangan lokal maupun pada server deployment:

```env
# URL Backend Sparta API
NEXT_PUBLIC_API_URL=https://api-building.sparta-alfamart.web.id

# Port pengembangan lokal
PORT=3002
```

---

## 12. Checklist Pengujian & Standar Deployment

- [ ] **Linter & Type Check**: `npm run lint` dan `npx tsc --noEmit` wajib lulus tanpa error sebelum merge branch.
- [ ] **Dual Workspace Verification**: Pastikan pengguna Toko tidak dapat membuka rute DC tanpa izin, dan sebaliknya.
- [ ] **Role Isolation**: Pastikan kontraktor hanya melihat proyek di cabangnya sendiri dan menu yang diizinkan pada `ROLE_CONFIG`.
- [ ] **Operating Schedule**: Pastikan batasan jam operasional berjalan efektif sesuai konfigurasi di Pemeliharaan Sistem.
- [ ] **PDF Export**: Pastikan dokumen RAB dan SPK dapat diunduh serta memiliki layout tabel yang rapi.
- [ ] **Responsiveness**: Antarmuka wajib responsif dan dapat dioperasikan pada tablet pengawas lapangan maupun monitor desktop kantor cabang.

