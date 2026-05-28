# Peta Integrasi API Frontend Terkini

Terakhir diperbarui: 2026-05-28

Dokumen ini merangkum endpoint backend yang dipanggil oleh `sparta-fe/lib/api.ts`. Detail payload berada di dokumen fitur masing-masing dan dokumentasi backend.

---

## Auth dan User

| Fungsi FE | Endpoint |
| --- | --- |
| Login/OTP session | `POST /api/auth/login`, `POST /api/auth/verify-otp` |
| `fetchUserCabangList` | `GET /api/user_cabang` |
| `fetchUserCabangDetail` | `GET /api/user_cabang/:id` |
| `createUserCabang` | `POST /api/user_cabang` |
| `updateUserCabang` | `PUT /api/user_cabang/:id` |
| `deleteUserCabang` | `DELETE /api/user_cabang/:id` |

## RAB, Gantt, SPK

| Fungsi FE | Endpoint |
| --- | --- |
| `submitRABData` | `POST /api/rab/submit` |
| `fetchRABList` | `GET /api/rab` |
| `fetchRABDetail` | `GET /api/rab/:id` |
| `updateRabItemsBulk` | `PUT /api/rab/:id/items` |
| `replaceRabItems` | `PUT /api/rab/:id/items/replace` |
| `syncRABBranchPrices` | `POST /api/rab/:id/sync-branch-prices` |
| `downloadRABPdf` | `GET /api/rab/:id/pdf` |
| `processRABApproval` | `POST /api/rab/:id/approval` |
| `updateRABStatus` | `PUT /api/rab/update-status` |
| `submitGanttChart` | `POST /api/gantt/submit` |
| `fetchGanttList` | `GET /api/gantt` |
| `fetchGanttDetail` | `GET /api/gantt/:id` |
| `fetchGanttDetailByToko` | `GET /api/gantt/detail/:id_toko` |
| `updateGanttChart` | `PUT /api/gantt/:id` |
| `lockGanttChart` | `POST /api/gantt/:id/lock` |
| `deleteGanttChart` | `DELETE /api/gantt/:id` |
| `addGanttDayItems` | `POST /api/gantt/:id/day` |
| `manageGanttPengawasan` | `POST /api/gantt/:id/pengawasan` |
| `submitSPK` | `POST /api/spk/submit` |
| `fetchSPKList` | `GET /api/spk` |
| `fetchSPKDetail` | `GET /api/spk/:id` |
| `downloadSPKPdf` | `GET /api/spk/:id/pdf` |
| `processSPKApproval` | `POST /api/spk/:id/approval` |
| `interveneSPKStatus` | `POST /api/spk/:id/intervention` |

## Pertambahan SPK dan Email

| Fungsi FE | Endpoint |
| --- | --- |
| `submitPertambahanSPK` | `POST /api/pertambahan-spk` |
| `fetchPertambahanSPKList` | `GET /api/pertambahan-spk` |
| `fetchPertambahanSPKDetail` | `GET /api/pertambahan-spk/:id` |
| `updatePertambahanSPK` | `PUT /api/pertambahan-spk/:id` |
| `processPertambahanSPKApproval` | `POST /api/pertambahan-spk/:id/approval` |
| `downloadPertambahanSPKLampiran` | `GET /api/pertambahan-spk/:id/lampiran-pendukung` |
| `downloadPertambahanSPKPdf` | `GET /api/pertambahan-spk/:id/pdf` |
| `deletePertambahanSPK` | `DELETE /api/pertambahan-spk/:id` |
| `sendEmailNotification` | `POST /api/send-email-notification` |

Flag email yang dipakai FE saat ini:

- `send-notification-spk`
- `send-notification-pertambahan-spk`
- `notification-spk-has-approve`
- `notification-spk-has-reject`

## Pengawasan, Opname, Instruksi Lapangan

| Fungsi FE | Endpoint |
| --- | --- |
| `submitPICPengawasan` | `POST /api/pic_pengawasan` |
| `fetchPICPengawasanList` | `GET /api/pic_pengawasan` |
| `submitPengawasanBulk` | `POST /api/pengawasan/bulk` |
| `updatePengawasanBulk` | `PUT /api/pengawasan/bulk` |
| `fetchPengawasanList` | `GET /api/pengawasan` |
| `fetchPengawasanDetail` | `GET /api/pengawasan/:id` |
| `downloadPengawasanPdf` | `GET /api/pengawasan/:id/pdf` |
| `submitOpnameSingle` | `POST /api/opname` |
| `submitOpnameBulk` | `POST /api/opname/bulk` |
| `fetchOpnameList` | `GET /api/opname` |
| `fetchOpnameDetail` | `GET /api/opname/:id` |
| `downloadOpnameFoto` | `GET /api/opname/:id/foto` |
| `updateOpname` | `PUT /api/opname/:id` |
| `deleteOpname` | `DELETE /api/opname/:id` |
| `fetchOpnameFinalList` | `GET /api/final_opname` |
| `fetchOpnameFinalDetail` | `GET /api/final_opname/:id` |
| `kunciOpnameFinal` | `POST /api/final_opname/:id/kunci_opname_final` |
| `approveOpnameFinal` | `POST /api/final_opname/:id/approval` |
| `downloadOpnameFinalPdf` | `GET /api/final_opname/:id/pdf` |
| `submitInstruksiLapangan` | `POST /api/instruksi-lapangan/submit` |
| `fetchInstruksiLapanganList` | `GET /api/instruksi-lapangan/list` |
| `fetchInstruksiLapanganDetail` | `GET /api/instruksi-lapangan/:id` |
| `processInstruksiLapanganApproval` | `POST /api/instruksi-lapangan/:id/approval` |
| `downloadInstruksiLapanganPdf` | `GET /api/instruksi-lapangan/:id/pdf` |

## Dokumen dan List

| Fungsi FE | Endpoint |
| --- | --- |
| `fetchBerkasSerahTerimaList` | `GET /api/berkas_serah_terima` |
| `createPdfSerahTerima` | `POST /api/create_pdf_serah_terima` |
| `downloadSerahTerimaPdf` | `GET /api/berkas_serah_terima/:id/pdf` |
| `fetchDokumentasiBangunanList` | `GET /api/dok/bangunan` |
| `fetchDokumentasiBangunanDetail` | `GET /api/dok/bangunan/:id` |
| `submitDokumentasiBangunan` | `POST /api/dok/bangunan` |
| `updateDokumentasiBangunan` | `PUT /api/dok/bangunan/:id` |
| `deleteDokumentasiBangunan` | `DELETE /api/dok/bangunan/:id` |
| `addDokumentasiBangunanItems` | `POST /api/dok/bangunan/:id/items` |
| `deleteDokumentasiBangunanItem` | `DELETE /api/dok/bangunan/items/:itemId` |
| `generateDokumentasiBangunanPdf` | `POST /api/dok/bangunan/:id/pdf` |
| `downloadDokumentasiBangunanPdf` | `GET /api/dok/bangunan/:id/pdf/download` |
| `fetchPenyimpananDokumenList` | `GET /api/doc/penyimpanan-dokumen` |
| `fetchPenyimpananDokumenArchiveStores` | `GET /api/doc/penyimpanan-dokumen/archive-stores` |
| `createPenyimpananDokumenArchiveStore` | `POST /api/doc/penyimpanan-dokumen/archive-stores` |
| `previewPenyimpananDokumenMigration` | `POST /api/doc/penyimpanan-dokumen/migration-preview` |
| `commitPenyimpananDokumenMigration` | `POST /api/doc/penyimpanan-dokumen/migration-commit` |
| `fetchPenyimpananDokumenDetail` | `GET /api/doc/penyimpanan-dokumen/:id` |
| `uploadPenyimpananDokumen` | `POST /api/doc/penyimpanan-dokumen` |
| `updatePenyimpananDokumen` | `PUT /api/doc/penyimpanan-dokumen/:id` |
| `deletePenyimpananDokumen` | `DELETE /api/doc/penyimpanan-dokumen/:id` |

## Dashboard, Project Planning, DC Development

| Fungsi FE | Endpoint |
| --- | --- |
| `fetchDashboardSingle` | `GET /api/dashboard` |
| `fetchDashboardAll` | `GET /api/dashboard/all` |
| `fetchActivityLogs` | `GET /api/activity-log` |
| `submitProjekPlanning` | `POST /api/projek-planning/submit` |
| `resubmitProjekPlanning` | `POST /api/projek-planning/:id/resubmit` |
| `fetchProjekPlanningList` | `GET /api/projek-planning` |
| `fetchProjekPlanningTaskCounts` | `GET /api/projek-planning/task-counts` |
| `fetchProjekPlanningDetail` | `GET /api/projek-planning/:id` |
| `fetchProjekPlanningLogs` | `GET /api/projek-planning/:id/logs` |
| `downloadProjekPlanningPdf` | `GET /api/projek-planning/:id/pdf` |
| `proxyProjekPlanningFile` | `GET /api/projek-planning/:id/proxy-file` |
| `processBmApproval` | `POST /api/projek-planning/:id/bm-approval` |
| `processPpApproval1` | `POST /api/projek-planning/:id/pp-approval-1` |
| `uploadDesain3d` | `POST /api/projek-planning/:id/upload-3d` |
| `uploadRabGambarKerja` | `POST /api/projek-planning/:id/upload-rab` |
| `processPpManagerApproval` | `POST /api/projek-planning/:id/pp-manager-approval` |
| `processPpApproval2` | `POST /api/projek-planning/:id/pp-approval-2` |
| `fetchDcProjects` | `GET /api/dc-development/projects` |
| `createDcProject` | `POST /api/dc-development/projects` |
| `fetchDcVendors` | `GET /api/dc-development/vendors` |
| `createDcVendor` | `POST /api/dc-development/vendors` |
| `fetchDcApprovals` | `GET /api/dc-development/approvals` |
