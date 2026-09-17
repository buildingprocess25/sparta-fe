# Batam RAB Contract Value Fix Design

## Context
RAB for Batam and Bintan branches has a no-PPN policy (0% PPN). The backend and PDF generator respect this, but historically `grand_total_final` in the DB may contain values with PPN applied.

## Problem
The UI `Nilai Kontrak` relies on `getRabDisplayTotal`, which defaults to `grand_total_final`. This results in the UI displaying a value that includes PPN for older Batam RABs.

## Proposed Solution (Frontend-only)
Update `getRabDisplayTotal` in `sparta-fe/app/list/page.tsx`. Check the `cabang` value. If it's `BATAM` or `BINTAN`, return `parseCurrency(rab?.grand_total)` directly to ignore the `grand_total_final` and ensure no PPN is applied. Else, fallback to `grand_total_final`.

## Validation
The change is localized to `getRabDisplayTotal` and ensures frontend alignment with the PDF rules for Batam.
