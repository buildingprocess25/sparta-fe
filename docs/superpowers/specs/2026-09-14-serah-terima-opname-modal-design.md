# Serah Terima Opname Modal - Design Spec

## Context
When a user targets a handover (Serah Terima) but there are still items pending for Opname (Opname parsial) from previous dates (e.g., `24/07/2026 SIPIL`), the frontend blocks the Serah Terima generation. 
Currently, the "Buka Form Pengawasan / Opname" button in the Serah Terima Modal is only rendered if there is a matching supervision checkpoint exactly on the Serah Terima date. Since the pending Opname is from a past date, the user has no way to open the Opname form from the Serah Terima Modal, stranding them in a blocked state.

## Goal
Provide a direct pathway to fill the pending Opname forms directly from the Serah Terima Modal without requiring the user to navigate back to the original supervision (Pengawasan) date.

## Architecture & Logic Changes

### 1. Identify Ready Scopes for Opname
Instead of looking for a checkpoint on the specific `showTargetStModal.dateString`, we will extract all scopes within the `supervisionWorkspace` that have `ready_opname_items > 0` or are listed in `pendingOpnameDates`. 

### 2. Update SerahTerimaModal Action Button
If the Serah Terima is blocked due to pending Opnames (`handoverReadiness.readyOpnameItems > 0`), the modal will render a new button: **"Lanjut ke Form Opname"**.

### 3. Direct Navigation to Opname Flow
Clicking the "Lanjut ke Form Opname" button will invoke `setUnifiedOpnameFlow`, which directly populates the Opname modal flow for all the outstanding scopes. 
- It bypasses the `MemoPengawasanModal` entirely.
- The `unifiedOpnameFlow` state will be constructed using the scopes identified in Step 1.
- `showOpnameModal` will implicitly open when `unifiedOpnameFlow` is set.

## Error Handling & Edge Cases
- **No pending opname items:** If `handoverReadiness.readyOpnameItems === 0` but it's still not ready due to missing pengawasan, it should show a warning to fill Pengawasan instead of opening the Opname form.
- **Multiple dates with pending opnames:** `unifiedOpnameFlow` will gather the latest checkpoints for the affected scopes and present them sequentially or as a single batch to the user.

## Data Flow
1. User opens Serah Terima Modal.
2. System checks `supervisionWorkspace.unified_checkpoints` for any `ready_opname_items > 0`.
3. If true, button "Lanjut ke Form Opname" appears.
4. On click, `setUnifiedOpnameFlow({ scopes: pendingScopes, index: 0, dayIndex: ..., dateString: ... })` is called.
5. User completes Opname Flow and closes modal.
6. The frontend reloads data and unlocks Serah Terima generation.
