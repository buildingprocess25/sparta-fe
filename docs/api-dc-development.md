# Dokumentasi Frontend DC Development

Terakhir diperbarui: 2026-05-28

Dokumen ini memetakan fungsi frontend di `lib/api.ts` ke endpoint backend modul DC Development.

Base backend: `/api/dc-development`

## Fungsi API

| Fungsi FE | Endpoint | Keterangan |
| --- | --- | --- |
| `fetchDcProjects(filters)` | `GET /api/dc-development/projects` | List project DC dengan filter opsional. |
| `createDcProject(payload)` | `POST /api/dc-development/projects` | Buat project DC. |
| `fetchDcVendors()` | `GET /api/dc-development/vendors` | List vendor DC. |
| `createDcVendor(payload)` | `POST /api/dc-development/vendors` | Buat vendor DC. |
| `fetchDcApprovals(filters)` | `GET /api/dc-development/approvals` | List approval DC dengan filter opsional. |
| `fetchDcDocuments(filters)` | `GET /api/dc-development/documents` | List dokumen DC yang bisa diakses actor. |
| `uploadDcDocuments(payload, files)` | `POST /api/dc-development/documents` | Upload dokumen DC. |
| `updateDcDocument(id, payload, file)` | `PUT /api/dc-development/documents/:id` | Update metadata atau versi file. |
| `deleteDcDocument(id, actor)` | `DELETE /api/dc-development/documents/:id` | Soft delete dokumen DC. |
| `buildDcDocumentViewUrl(id, actor, mode)` | `GET /api/dc-development/documents/:id/view|download` | URL view/download via backend access check. |

Endpoint backend lain yang sudah tersedia tetapi belum semua dibungkus fungsi khusus di frontend:

| Endpoint | Keterangan |
| --- | --- |
| `GET /api/dc-development/projects/:id` | Detail project DC. |
| `POST /api/dc-development/projects/:id/advance-stage` | Maju/update stage project. |
| `POST /api/dc-development/projects/:id/tenders` | Buat tender project. |
| `POST /api/dc-development/vendors/:id/users` | Buat user vendor. |
| `GET /api/dc-development/documents/:id` | Detail dokumen DC. |

## Filter Project

`fetchDcProjects` mendukung:

- `status`
- `current_stage`
- `branch_name`
- `search`
- `actor_email`
- `actor_role`

Jika `actor_email` dikirim, backend mengembalikan project yang melibatkan actor tersebut. Super Human tetap bisa melihat semua project.

## Filter Dokumen

`fetchDcDocuments` mewajibkan:

- `actor_email`
- `actor_role`

Filter opsional:

- `project_id`
- `tender_id`
- `participant_id`
- `document_type`
- `entity_type`
- `stage`

## Filter Approval

`fetchDcApprovals` mendukung:

- `status`
- `required_role`
- `project_id`

## Catatan UI

Halaman DC Development berada di:

- `app/dc-development/page.tsx`
- `app/dc-development/projects/page.tsx`
- `app/dc-development/tenders/page.tsx`
- `app/dc-development/vendors/page.tsx`
- `app/dc-development/documents/page.tsx`
- `app/dc-development/monitoring/page.tsx`
- `app/dc-development/supervision/page.tsx`
- `app/dc-development/bast/page.tsx`
- `app/dc-development/terms/page.tsx`
