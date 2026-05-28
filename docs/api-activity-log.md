# Dokumentasi Frontend Activity Log

Terakhir diperbarui: 2026-05-28

Dokumen ini menjelaskan pemakaian activity log dari sisi frontend.

## Fungsi API

File: `lib/api.ts`

| Fungsi | Endpoint | Keterangan |
| --- | --- | --- |
| `fetchActivityLogs({ entity_type, entity_id })` | `GET /api/activity-log?entity_type=:type&entity_id=:id` | Mengambil riwayat aktivitas dokumen/entity. |

## Entity Type

Nilai yang dipakai harus sesuai backend:

- `RAB`
- `SPK`
- `PERTAMBAHAN_SPK`
- `OPNAME_FINAL`
- `PENGAWASAN`
- `BERKAS_SERAH_TERIMA`
- `INSTRUKSI_LAPANGAN`
- `PROJECT_PLANNING`
- `DOKUMENTASI_BANGUNAN`
- `PENYIMPANAN_DOKUMEN`

## Contoh Pemakaian

```ts
await fetchActivityLogs({
  entity_type: "SPK",
  entity_id: 12,
});
```

Response mengikuti format umum:

```json
{
  "status": "success",
  "data": []
}
```
