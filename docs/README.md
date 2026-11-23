# Dokumentasi SPARTA Frontend (`sparta-fe`)

Direktori ini memuat seluruh dokumentasi teknis, spesifikasi sistem, dan panduan alur kerja untuk aplikasi SPARTA (PT Sumber Alfaria Trijaya Tbk).

---

## Struktur Direktori `docs/`

```text
docs/
├── README.md                            # Panduan navigasi dokumentasi ini
├── alur-kerja-sistem.md                 # MASTER HUB: Peta & indeks seluruh alur kerja sistem (End-to-End)
├── workflows/                           # Dokumen detail per alur kerja spesifik
│   ├── alur-kerja-serah-terima-st.md    # Detail alur kerja Serah Terima (ST) & validasi pengawasan
│   └── alur-kerja-opname-ktk.md         # Detail alur kerja Opname, KTK, & Approval Kontraktor
└── steering/                            # Dokumen arsitektur & spesifikasi teknis
    ├── project-spec.md                  # Spesifikasi modul, dual workspace, & tech stack
    └── design.md                        # Desain sistem, token warna, typography, & UI standards
```

---

## Dokumen Kunci

1. **[Master Alur Kerja Sistem](./alur-kerja-sistem.md)**:
   Katalog lengkap siklus konstruksi (FPD → RAB → SPK → Gantt / Kurva S → Pengawasan → Opname → Serah Terima → BAST → Dokumen).
2. **[Alur Kerja Serah Terima (ST)](./workflows/alur-kerja-serah-terima-st.md)**:
   Panduan mendalam proses serah terima fisik toko, aturan multi-lingkup (SIPIL & ME), carry-over item terlambat, dan troubleshooting.
3. **[Alur Kerja Opname & KTK](./workflows/alur-kerja-opname-ktk.md)**:
   Panduan mendalam proses opname fisik, transisi 6 status approval bertingkat (PIC → Kontraktor → Koordinator → Manajer → Direktur Kontraktor), serta studi kasus Prembun Cilacap.
4. **[Project Spec (`steering/project-spec.md`)](./steering/project-spec.md)**:
   Single source of truth spesifikasi fungsional, dependensi, dan dual workspace (Toko vs DC).
4. **[Design Guidelines (`steering/design.md`)](./steering/design.md)**:
   Standar antarmuka solid colors, OKLCH token, dan anti-slop guidelines.
