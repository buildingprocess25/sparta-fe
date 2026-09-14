# Serah Terima Opname Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the Serah Terima Modal to directly offer a "Lanjut ke Form Opname" button that opens the pending Opname forms from past dates, bypassing the Pengawasan form.

**Architecture:** Update the conditionally rendered button inside `SerahTerimaModal` in `app/gantt/page.tsx`. If `handoverReadiness.readyOpnameItems > 0` or `handoverReadiness.pendingOpnameDates.length > 0`, render the new button. On click, it gathers all `unified_checkpoints` scopes with `ready_opname_items > 0`, assigns them to `setUnifiedOpnameFlow`, and calls `setShowOpnameModal(true)`.

**Tech Stack:** React, Next.js, Tailwind CSS

## Global Constraints

- Do not modify or remove the existing `openUnifiedCheckpoint` logic if there are no pending opnames; the fallback button should remain for normal pengawasan.
- Use exact React hooks/state variable names: `setUnifiedOpnameFlow`, `setShowOpnameModal`.

---

### Task 1: Update Serah Terima Modal Button

**Files:**
- Modify: `app/gantt/page.tsx:3310-3325`

**Interfaces:**
- Consumes: `handoverReadiness`, `supervisionWorkspace`, `showTargetStModal`, `setUnifiedOpnameFlow`, `setShowOpnameModal`, `setShowTargetStModal`, `openUnifiedCheckpoint`
- Produces: A new UI button inside the modal and updated state logic.

- [ ] **Step 1: Write minimal implementation**

```tsx
                            {(() => {
                                if (handoverReadiness.readyOpnameItems > 0 || handoverReadiness.pendingOpnameDates.length > 0) {
                                    return (
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setShowTargetStModal(null);
                                                const pendingScopes: any[] = [];
                                                supervisionWorkspace?.unified_checkpoints?.forEach((ucp: any) => {
                                                    ucp.scopes.forEach((entry: any) => {
                                                        if (entry.gantt_id && entry.checkpoint && Number(entry.checkpoint.ready_opname_items || 0) > 0) {
                                                            pendingScopes.push(entry);
                                                        }
                                                    });
                                                });
                                                if (pendingScopes.length > 0) {
                                                    setUnifiedOpnameFlow({
                                                        scopes: pendingScopes,
                                                        index: 0,
                                                        dayIndex: showTargetStModal.dayIndex,
                                                        dateString: showTargetStModal.dateString,
                                                    });
                                                    setShowOpnameModal(true);
                                                }
                                            }}
                                            className="flex h-11 w-full items-center justify-center rounded-md bg-amber-600 px-4 font-bold text-white transition hover:bg-amber-500 shadow-sm"
                                        >
                                            <ClipboardCheck className="mr-2 h-4 w-4" />
                                            Lanjut ke Form Opname
                                        </Button>
                                    );
                                }

                                const stCheckpoint = supervisionWorkspace?.unified_checkpoints?.find((c: any) => c.tanggal_pengawasan === showTargetStModal.dateString);
                                if (!stCheckpoint) return null;
                                return (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowTargetStModal(null);
                                            openUnifiedCheckpoint(stCheckpoint as any, showTargetStModal.dayIndex);
                                        }}
                                        className="flex h-11 w-full items-center justify-center rounded-md bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-500 shadow-sm"
                                    >
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        Buka Form Pengawasan
                                    </Button>
                                );
                            })()}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run build` or load the frontend and manually verify no compilation errors. Since Next.js `npm run dev` is running, verify the page reloads successfully without syntax errors.
Expected: PASS / Page loads properly.

- [ ] **Step 3: Commit**

```bash
git add app/gantt/page.tsx
git commit -m "feat: add opname shortcut in serah terima modal"
```
