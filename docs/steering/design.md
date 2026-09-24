# SPARTA Design System & UI Guidelines (`design.md`)

## Panduan Standar Desain, Token Warna, Tipografi, dan Konsistensi Antarmuka

Dokumen ini adalah **pedoman desain resmi** untuk frontend **SPARTA** (PT Sumber Alfaria Trijaya Tbk). Tujuan dokumen ini adalah memastikan setiap komponen, halaman, dialog, tabel, dan formulir memiliki visual, interaksi, dan ergonomi yang seragam, berakar langsung pada konfigurasi token di [`app/globals.css`]

---

## 1. Filosofi & Prinsip Desain SPARTA

Aplikasi SPARTA dirancang untuk mendukung operasional properti dan konstruksi dari level pengawas lapangan hingga direksi. Oleh karena itu, prinsip desain utama adalah:

1. **High Legibility for Operational & Field Staff**:
   - Teks harus selalu tajam, kontras tinggi, dan mudah dibaca di layar smartphone, tablet lapangan, maupun monitor kantor.
   - Penggunaan root base font scaling `html { font-size: 14px; }` memastikan teks antarmuka nyaman dibaca oleh pengguna senior maupun staf cabang.
2. **Dense Yet Breathable Data Presentation**:
   - Modul seperti RAB, Kurva S Gantt, Opname, dan Tarikan Data memuat ratusan baris data teknis.
   - Data tabular harus padat (compact padding) namun tetap terstruktur rapi dengan separator jelas dan angka rata kanan (`text-right`) berfont tabular.
3. **Alfamart Brand Consistency**:
   - Dominasi warna merah korporat Alfamart yang tegas dipadukan dengan latar netral bersih (putih dan slate), memberikan kesan profesional dan modern.
4. **Pill-Shape Micro-Interactions (Radix Maia Style)**:
   - Tombol, badge, dan input menggunakan bentuk rounded-pill (`rounded-4xl`), memberikan sentuhan modern yang membedakan SPARTA dari aplikasi legacy.

---

## 2. Arsitektur Tailwind CSS v4 & Theme Setup

Pada Tailwind CSS v4, konfigurasi tidak lagi menggunakan file `tailwind.config.js`. Seluruh design tokens didefinisikan secara deklaratif di [`app/globals.css`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/app/globals.css) menggunakan blok `@theme inline`.

```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --font-heading: var(--font-sans);
}
```

> [!IMPORTANT]
> **Aturan Wajib**: Dilarang membuat file `tailwind.config.js`. Semua penambahan token CSS baru wajib ditambahkan ke blok `@theme inline` atau blok CSS variables `:root` / `.dark` di [`app/globals.css`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/app/globals.css).

---

## 3. Sistem Warna OKLCH & Semantic Tokens

SPARTA menggunakan ruang warna **OKLCH** (`oklch(Lightness Chroma Hue)`) untuk memastikan konsistensi persepsi kecerahan visual di seluruh spektrum warna.

### 3.1 Nilai Variabel Warna `:root` (Light Mode)

| Token CSS | Nilai OKLCH | Visual / Hex Approx | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| `--primary` | `oklch(0.577 0.245 27.325)` | 🔴 Merah Alfamart (`#dc2626`) | Tombol aksi utama, navbar gradient, active tabs, header hero |
| `--primary-foreground` | `oklch(0.971 0.013 17.38)` | ⚪ Putih gading lembut | Teks di atas background primary |
| `--background` | `oklch(1 0 0)` | ⚪ Pure White (`#ffffff`) | Background halaman utama |
| `--foreground` | `oklch(0.141 0.005 285.823)`| ⚫ Zinc gelap (`#09090b`) | Teks utama, judul, angka nilai |
| `--card` | `oklch(1 0 0)` | ⚪ Pure White | Background card & dialog modal |
| `--card-foreground` | `oklch(0.141 0.005 285.823)`| ⚫ Zinc gelap | Teks dalam card |
| `--secondary` | `oklch(0.967 0.001 286.375)`| 🔘 Slate sangat terang | Tombol sekunder, background badge netral |
| `--secondary-foreground`| `oklch(0.21 0.006 285.885)` | ⚫ Charcoal slate | Teks tombol/badge sekunder |
| `--muted` | `oklch(0.967 0.001 286.375)`| 🔘 Abu-abu netral | Background sel tabel selang-seling, input disabled |
| `--muted-foreground` | `oklch(0.552 0.016 285.938)`| 🔘 Slate 500 (`#64748b`) | Label keterangan, placeholder, subjudul |
| `--accent` | `oklch(0.577 0.245 27.325)` | 🔴 Merah aksen | Hover state tombol, highlight filter |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 🔴 Merah peringatan | Aksi hapus, reject approval, sanksi SP |
| `--border` | `oklch(0.92 0.004 286.32)` | 🔘 Abu-abu border (`#e4e4e7`) | Garis tepi card, pembatas tabel, divider |
| `--input` | `oklch(0.92 0.004 286.32)` | 🔘 Abu-abu border input | Border input text & select |
| `--ring` | `oklch(0.705 0.015 286.067)`| 🔘 Ring focus outline | Focus visible indicator (`ring-[3px]`) |

### 3.2 Nilai Variabel Warna `.dark` (Dark Mode)

| Token CSS | Nilai OKLCH | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `--background` | `oklch(0.141 0.005 285.823)` | Zinc hitam pekat |
| `--foreground` | `oklch(0.985 0 0)` | Putih bersih untuk kontras tinggi |
| `--card` / `--popover` | `oklch(0.21 0.006 285.885)` | Surface gelap dengan kedalaman lapis |
| `--primary` | `oklch(0.637 0.237 25.331)` | Merah yang sedikit dinaikkan lightness-nya agar terbaca jelas di background gelap |
| `--border` / `--input` | `oklch(1 0 0 / 10%)` | Putih transparan 10% – 15% |

### 3.3 Spektrum Chart Palette (Monochromatic Warm Red)

Digunakan pada Kurva S, grafik batang progress harian, dan analitik monitoring:

```css
--color-chart-1: oklch(0.808 0.114 19.571);  /* Merah terang pastel (Progress Rencana) */
--color-chart-2: oklch(0.637 0.237 25.331);  /* Merah medium cerah */
--color-chart-3: oklch(0.577 0.245 27.325);  /* Merah Alfamart primer */
--color-chart-4: oklch(0.505 0.213 27.518);  /* Merah marun pekat (Progress Realisasi) */
--color-chart-5: oklch(0.444 0.177 26.899);  /* Merah gelap tua */
```

### 3.4 Semantic Status Tokens (Pewarnaan Status Dokumen & Proyek)

Untuk mempertahankan konsistensi seluruh modul, gunakan standar semantic color token berikut:

| Kategori Status | Class Background & Text | Accent Rail Class | Contoh Status Dokumen |
| :--- | :--- | :--- | :--- |
| **Approval / Menunggu** | `bg-sky-50 text-sky-700 border-sky-200` | `bg-sky-500` | Menunggu Approval BBMM, Review BM, FPD Pending |
| **Selesai / Approved / Ready** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-500` | Disetujui, BAST Selesai, KTK Ready, On Track |
| **Revisi / Peringatan** | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-500` | Perlu Revisi, Tanggal Lewat, Deviasi Minus Ringan |
| **Denda / SP / Error / Batal**| `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-500` | SP 1, SP 2, SP 3 Diterbitkan, Denda Berjalan, Ditolak |
| **Penugasan PIC** | `bg-violet-50 text-violet-700 border-violet-200` | `bg-violet-500` | Belum Ada PIC Pengawas, Menunggu Assignment |
| **Perencanaan Desain** | `bg-blue-50 text-blue-700 border-blue-200` | `bg-blue-500` | Pengajuan FPD Baru, Desain Arsitek |

---

## 4. Tipografi & Kebijakan Legibilitas Khusus

SPARTA menggunakan keluarga font **Geist Sans** (`--font-sans`) untuk teks umum dan **Geist Mono** (`--font-mono`) untuk kode toko, angka anggaran, serta nomor dokumen.

### 4.1 Kebijakan Khusus Skala Ukuran Font (`html { font-size: 14px }`)

Pada [`app/globals.css`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/app/globals.css#L128-L149), ukuran dasar HTML ditetapkan:

```css
html {
  @apply font-sans;
  font-size: 14px; /* Skala standar legibilitas operasional staf cabang & warehouse */
}
```

### 4.2 Legacy Absolute Pixel Overrides

Untuk mencegah teks terlalu kecil akibat class warisan Tailwind lama, [`app/globals.css`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/app/globals.css#L133-L149) memetakan class piksel absolut ke nilai rem yang terjamin keterbacaannya:

| Class Legacy | Nilai Rem | Ukuran Aktual | Penggunaan yang Disarankan |
| :--- | :--- | :--- | :--- |
| `.text-[8px]` | `0.6875rem !important` | ~11px | Dilarang untuk informasi penting; hanya untuk badge mikro |
| `.text-[9px]` | `0.75rem !important` | ~12px | Label metadata sekunder atau timestamp |
| `.text-[10px]`| `0.8125rem !important` | ~13px | Header kolom tabel padat |
| `.text-[11px]`| `0.875rem !important` | ~14px | Sub-keterangan, helper text |
| `.text-[12px]`| `0.9375rem !important` | ~15px | Isi sel tabel operasional |

### 4.3 Hirarki Tipografi Standar

| Tingkat | Class Tailwind | Ukuran / Weight | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Hero Display** | `text-3xl md:text-4xl font-black tracking-tight` | 36px–40px, 900 | Judul utama landing page & workspace selector |
| **Page Title** | `text-xl md:text-2xl font-bold tracking-tight` | 24px–28px, 700 | Judul modul (Dashboard, RAB, SPK, DC Development) |
| **Section Title**| `text-lg md:text-xl font-semibold` | 20px, 600 | Header card, judul tab, judul grup tabel |
| **Card / Subtitle**| `text-base font-medium` | 16px, 500 | Judul item pekerjaan, header widget KPI |
| **Body Text** | `text-sm font-normal text-slate-800` | 14px, 400 | Deskripsi, konten form, isi dialog |
| **Table / Meta** | `text-xs md:text-sm font-normal text-slate-600` | 12px–14px, 400 | Baris tabel, riwayat log activity |
| **Numeric Mono** | `font-mono text-sm font-semibold tabular-nums` | 14px, Mono 600 | Nilai Rupiah (`formatRupiah`), persentase progress |

---

## 5. Border Radius & Shape Language (Gaya Radix Maia)

Sesuai konfigurasi pada [`components.json`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components.json) (`"style": "radix-maia"`), SPARTA menggunakan kombinasi **Pill-Shape** untuk elemen interaktif dan **Rounded Box** untuk wadah data.

### 5.1 Skala Formula Radius

```css
--radius: 0.625rem;                      /* Base: 10px */
--radius-sm:  calc(var(--radius) - 4px);  /* 6px  */
--radius-md:  calc(var(--radius) - 2px);  /* 8px  */
--radius-lg:  var(--radius);              /* 10px */
--radius-xl:  calc(var(--radius) + 4px);  /* 14px */
--radius-2xl: calc(var(--radius) + 8px);  /* 18px */
--radius-3xl: calc(var(--radius) + 12px); /* 22px */
--radius-4xl: calc(var(--radius) + 16px); /* 26px (Pill effect) */
```

### 5.2 Panduan Penggunaan Radius

```
┌────────────────────────────────────────────────────────────────────────┐
│  Card Container: rounded-2xl (18px)                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ CardHeader / Nested Container: rounded-xl (14px)                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Interactive Controls: rounded-4xl (26px - Pill)                       │
│  [ Button (rounded-4xl) ]   ( Input Field: rounded-4xl )   <Badge 4xl> │
│                                                                        │
│  Small Elements: rounded-md (8px)                                      │
│  [x] Checkbox (rounded-md)     (o) Radio     [Switch: rounded-full]    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Pill-Shape (`rounded-4xl`)**:
   - Wajib digunakan pada elemen interaktif kecil: [`Button`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/ui/button.tsx), [`Input`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/ui/input.tsx), [`Badge`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/ui/badge.tsx), dan `SelectTrigger`.
2. **Main Card & Dialog Modal (`rounded-2xl` / `rounded-3xl`)**:
   - Digunakan pada kontainer card utama ([`Card`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/ui/card.tsx)), modal konfirmasi, dan modal drilldown.
3. **Inner Header/Footer (`rounded-t-xl` / `rounded-b-xl`)**:
   - Digunakan pada bagian atas dan bawah panel di dalam card agar serasi dengan kelengkungan kontainer luar.
4. **Mini Controls (`rounded-md`)**:
   - Checkbox, item dropdown menu, dan tooltip.

---

## 6. Spesifikasi Komponen Navigasi & Layout

### 6.1 Top Navigation Bar ([`AppNavbar.tsx`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/AppNavbar.tsx))

`AppNavbar` menyediakan dua varian resmi:

```tsx
// 1. Varian Brand (Default untuk seluruh modul internal toko & operasional)
<AppNavbar 
  title="SPARTA Building" 
  variant="brand" 
  showBackButton={true}
  backHref="/dashboard"
  rightActions={<TaskNotificationBell />}
/>

// 2. Varian Clean (Untuk tampilan dashboard analitik minimalis atau report)
<AppNavbar 
  title="DC Development" 
  variant="clean" 
  showBackButton={false}
/>
```

- **Varian `brand`**:
  `border-b border-red-900 bg-linear-to-r from-red-700 via-red-600 to-red-800 text-white shadow-md`
- **Varian `clean`**:
  `border-b border-slate-200 bg-white text-slate-900`
- **Elemen Identitas**:
  - Logo Alfamart Emblem: `/assets/Alfamart-Emblem.png` (Tinggi responsif: `h-7 md:h-12`).
  - Separator: Divider tipis vertikal `h-6 md:h-8 w-px bg-white/30`.
  - Building Logo: `/assets/Building-Logo.png` (Tampil di desktop).

### 6.2 Public Hero Navigation ([`LandingNavbar.tsx`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/LandingNavbar.tsx))

- Dikhususkan untuk halaman publik `/` (Landing Page).
- Menggunakan gradient diagonal berani: `bg-linear-to-br from-red-600 to-red-800 text-white border-b border-red-900 shadow-md` dengan animasi `animate-in slide-in-from-left-12` pada logo.

---

## 7. Spesifikasi Komponen Dialog, Alert & Feedback

### 7.1 Global Alert Dialog ([`GlobalAlert.tsx`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/GlobalAlert.tsx))

Seluruh pesan notifikasi sistem wajib dipanggil melalui `useGlobalAlert()`:

```tsx
const { showAlert } = useGlobalAlert();

// A. Notifikasi Sukses
showAlert({
  title: "RAB Berhasil Disimpan",
  message: "Penawaran final kontraktor telah diteruskan ke BBMM untuk diverifikasi.",
  type: "success",
});

// B. Konfirmasi Aksi Kritis (Confirm Mode)
showAlert({
  title: "Konfirmasi Penerbitan SPK",
  message: "Apakah Anda yakin ingin menerbitkan SPK untuk Toko Harapan Indah?",
  type: "warning",
  confirmMode: true,
  confirmText: "Ya, Terbitkan",
  cancelText: "Batal",
  onConfirm: () => handlePublishSpk(),
});

// C. Notifikasi Error Terperinci
showAlert({
  title: "Gagal Mengunggah Dokumen",
  message: "Format file tidak didukung atau ukuran melebihi batas.",
  type: "error",
  details: "Server responded with status 413 Payload Too Large.",
});
```

**Standar Visual GlobalAlert**:
- Container: `rounded-3xl border-0 shadow-2xl p-0 overflow-hidden`
- Icon Box: Lingkaran berlatar putih `bg-white/80 p-4 rounded-full shadow-sm`
- Tombol: `h-12 rounded-xl font-bold tracking-wide active:scale-95 shadow-md`

### 7.2 Loading Overlay Terstandarisasi ([`LoadingOverlay.tsx`](file:///c:/Users/UDevran/Documents/Sumber%20Alfaria%20Trijaya/system/sparta-fe/components/LoadingOverlay.tsx))

Gunakan selalu komponen ini saat sistem melakukan proses asynchronous yang membutuhkan waktu tunggu (ekspor Excel, generate PDF, sinkronisasi data migrasi):

```tsx
<LoadingOverlay 
  isVisible={isSubmitting} 
  title="Menyimpan Dokumen..." 
  subtitle="Sedang memproses kompresi dan tanda tangan digital"
/>
```

- Backdrop: `fixed inset-0 z-100 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm`
- Card: `bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-100 max-w-xs`
- Spinner: `w-12 h-12 rounded-full bg-red-50 text-red-600` dengan ikon `<Loader2 className="animate-spin" />`

---

## 8. Standar Desain Tabel Data & Formulir Proyek (Dense Data UX)

### 8.1 Format Tabel Data Teknis

Tabel data operasional (RAB, SPK, Opname, Tarikan Data) wajib mematuhi aturan berikut:

1. **Sticky Header**: Header tabel harus selalu berada di atas saat user melakukan scroll panjang:
   ```html
   <thead className="sticky top-0 bg-slate-100 text-slate-700 z-10 shadow-xs">
   ```
2. **Perataan Kolom (Alignment)**:
   - Nomor Urut & Kode Toko/Cabang: Rata tengah (`text-center`).
   - Deskripsi Pekerjaan / Nama Toko: Rata kiri (`text-left`).
   - Volume, Koefisien, & Nilai Rupiah: Rata kanan (`text-right`) dengan font monospace tabular:
     ```html
     <td className="text-right font-mono font-medium tabular-nums">
       {formatRupiah(item.hargaTotal)}
     </td>
     ```
   - Status Badge: Rata tengah (`text-center`).
   - Tombol Aksi: Rata tengah / kanan (`text-center`).
3. **Hover State**: Berikan indikator hover baris yang lembut:
   ```html
   <tr className="border-b border-slate-100 hover:bg-red-50/40 transition-colors">
   ```

### 8.2 Standar Formulir Input

1. **Form Labels**:
   ```html
   <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
     Nomor Surat Perintah Kerja (SPK)
   </label>
   ```
2. **Pill Inputs**:
   ```html
   <Input 
     className="h-10 rounded-4xl border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-red-500" 
     placeholder="Masukkan nomor SPK..." 
   />
   ```
3. **Mata Uang Input**:
   Gunakan helper `parseCurrency` saat parsing dan tampilkan mask format Rupiah secara otomatis pada event `onChange`.

---

## 9. Ikonografi & Media Aset

### 9.1 Koleksi Ikon

1. **Lucide React** (`lucide-react`): Digunakan untuk 90% komponen navigasi, status bar, tombol aksi, dan kontrol form.
2. **Hugeicons** (`@hugeicons/react`): Dikonfigurasikan pada `components.json` untuk micro-icons modern pada dashboard v3 dan KPI widgets.

### 9.2 Ukuran Ikon Baku

| Ukuran Class | Nilai Piksel | Tempat Penggunaan |
| :--- | :--- | :--- |
| `size-3` / `w-3 h-3` | 12px | Di dalam Badge status atau tombol mikro (`size="xs"`) |
| `size-4` / `w-4 h-4` | 16px | Standar di dalam `Button`, input field adornment, item dropdown |
| `size-5` / `w-5 h-5` | 20px | Header action, icon tab menu, AppNavbar action icons |
| `size-6` / `w-6 h-6` | 24px | Icon header card dashboard, modal icon box |
| `size-12` - `size-20`| 48px–80px | Empty states, welcome illustrations di Landing Page |

### 9.3 Penempatan Aset Resmi

- Emblem Logo Alfamart: `/assets/Alfamart-Emblem.png`
- Building Maintenance Logo: `/assets/Building-Logo.png`
- Foto Arsitektur Background: `/assets/floor.png`, `/assets/floor2.jpeg`, `/assets/floor3.jpeg`

---

## 10. Checklist Konsistensi Desain (Do's & Don'ts)

| Area | ✅ Wajib (Do) | ❌ Dilarang (Don't) |
| :--- | :--- | :--- |
| **Token Styling** | Gunakan warna semantik `--primary`, `--secondary`, dsb. dari `globals.css`. | Hardcode warna hex sembarangan seperti `bg-[#ff0000]`. |
| **Bentuk Tombol** | Gunakan komponen `<Button>` yang otomatis memiliki `rounded-4xl`. | Membuat tag `<button>` mentah tanpa class radius dan focus ring. |
| **Mata Uang** | Gunakan `formatRupiah(val)` dari `@/lib/utils` dengan `font-mono`. | Menulis format manual string `Rp ${val}` yang tidak konsisten. |
| **Pesan / Notifikasi**| Panggil `useGlobalAlert()` (`showAlert`). | Menggunakan fungsi bawaan browser `alert()` atau `confirm()`. |
| **Loading State** | Tampilkan `<LoadingOverlay>` pada proses berdurasi >1 detik. | Membiarkan layar freeze tanpa umpan balik visual saat proses request. |
| **Legibilitas Font**| Gunakan skala tipografi rem standar yang telah disesuaikan di `globals.css`. | Memaksa styling font berukuran < 10px yang tidak terbaca staf lapangan. |
| **Focus Accessibility**| Pertahankan `focus-visible:ring-[3px]` untuk navigasi keyboard. | Menulis `outline-none` tanpa menyertakan varian `focus-visible`. |
| **Dark Mode** | Uji seluruh kontras teks card dan tabel pada mode `.dark`. | Membiarkan teks berwarna hitam keras (`text-black`) di dark mode. |

