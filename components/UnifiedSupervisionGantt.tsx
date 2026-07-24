"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { fetchGanttDetailByToko } from "@/lib/api";
import type { SupervisionWorkspace, UnifiedSupervisionCheckpoint } from "@/lib/api";

const DAY_WIDTH = 44;
const ROW_HEIGHT = 46;
const GROUP_HEIGHT = 34;

function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.includes("/")) {
        const [dd, mm, yyyy] = raw.split("/");
        const year = yyyy?.length === 2 ? `20${yyyy}` : yyyy;
        const parsed = new Date(Number(year), Number(mm) - 1, Number(dd));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw.split("T")[0] + "T00:00:00");
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFullDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function formatShortDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

function formatDayName(date: Date): string {
    return ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][date.getDay()];
}

function diffDays(left: Date, right: Date): number {
    return Math.round((left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

const NATIONAL_HOLIDAYS_2026 = new Set([
    "2026-01-01", "2026-01-16", "2026-02-17", "2026-03-19",
    "2026-04-03", "2026-05-01", "2026-05-14", "2026-05-27",
    "2026-06-01", "2026-06-16", "2026-08-17", "2026-08-25",
    "2026-12-25",
]);

function toIsoDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function isNonWorkingStDate(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6 || NATIONAL_HOLIDAYS_2026.has(toIsoDateKey(date));
}

function calculateTargetStFromSpkEnd(spkEndDate: Date) {
    const normalized = new Date(spkEndDate.getFullYear(), spkEndDate.getMonth(), spkEndDate.getDate());
    let target = addDays(normalized, 1);
    let skippedWeekends = 0;
    let skippedHolidays = 0;

    while (isNonWorkingStDate(target)) {
        const day = target.getDay();
        if (day === 0 || day === 6) skippedWeekends += 1;
        else if (NATIONAL_HOLIDAYS_2026.has(toIsoDateKey(target))) skippedHolidays += 1;
        target = addDays(target, 1);
    }

    const offsetDays = Math.max(1, Math.round((target.getTime() - normalized.getTime()) / (24 * 60 * 60 * 1000)));
    const endIsNonWorking = isNonWorkingStDate(normalized);
    const showOffsetLabel = endIsNonWorking || skippedWeekends > 0 || skippedHolidays > 0 || offsetDays > 1;
    const label = offsetDays > 1 ? `SPK +${offsetDays - 1} hari` : `ST`;
    const reasons = [
        skippedWeekends > 0 ? `${skippedWeekends} weekend` : null,
        skippedHolidays > 0 ? `${skippedHolidays} libur nasional` : null,
        endIsNonWorking && skippedWeekends === 0 && skippedHolidays === 0 ? "akhir SPK hari non-kerja" : null,
    ].filter(Boolean).join(", ");

    return {
        date: target,
        offsetDays,
        label,
        showOffsetLabel,
        explanation: reasons ? `${label} (${reasons})` : label,
    };
}

function isReasonableSpkStart(date: Date | null): date is Date {
    if (!date) return false;
    const year = date.getFullYear();
    return year >= 2024 && year <= new Date().getFullYear() + 1;
}

function getScopeSpkEnd(scope: SupervisionWorkspace["scopes"][number]): Date | null {
    const explicitEnd = parseDate(scope.spk_effective_end_date);
    if (explicitEnd) return explicitEnd;

    const spkStart = parseDate(scope.spk_start_date);
    const duration = Number(scope.spk_effective_duration || scope.spk_duration || 0);
    if (!spkStart || duration <= 0) return null;

    return addDays(spkStart, duration - 1);
}

type ScopeDetail = {
    id_toko: number;
    scopeName: string;
    ganttId: number | null;
    status: string | null;
    rows: Array<{
        taskId: number;
        id: string;
        label: string;
        dependencies: number[];
        bars: Array<{ start: number; end: number; duration: number; delay: number }>;
    }>;
};

type Timeline = {
    start: Date;
    days: number;
    dates: Date[];
};

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];

    for (let index = 0; index < items.length; index += concurrency) {
        const batch = items.slice(index, index + concurrency);
        const batchResults = await Promise.all(batch.map(mapper));
        results.push(...batchResults);
    }

    return results;
}

type CheckpointVisualState = "normal" | "today" | "todayCheckpoint" | "needsInput" | "filled";

function buildTimeline(workspace: SupervisionWorkspace): Timeline | null {
    const starts: Date[] = [];
    const ends: Date[] = [];

    // SPK dates define the base work schedule; checkpoints can extend it for Target ST.
    workspace.scopes.forEach((scope) => {
        const spkStart = parseDate(scope.spk_start_date);
        const duration = Number(scope.spk_effective_duration || scope.spk_duration || 0);
        let spkEnd: Date | null = null;
        if (spkStart && duration > 0) {
            starts.push(spkStart);
            spkEnd = new Date(spkStart);
            spkEnd.setDate(spkEnd.getDate() + duration - 1);
            ends.push(spkEnd);
        }
        const stTarget = parseDate(scope.st_target_date) || (spkEnd ? calculateTargetStFromSpkEnd(spkEnd).date : null);
        if (stTarget) {
            ends.push(stTarget);
        }

        (scope.checkpoints || []).forEach((checkpoint) => {
            const checkpointDate = parseDate(checkpoint.tanggal_pengawasan);
            if (checkpointDate) {
                ends.push(checkpointDate);
            }
        });
    });

    // Fallback: use checkpoints as start/end if no SPK start dates are available.
    if (starts.length === 0) {
        workspace.scopes.forEach((scope) => {
            (scope.checkpoints || []).forEach((checkpoint) => {
                const checkpointDate = parseDate(checkpoint.tanggal_pengawasan);
                if (checkpointDate) {
                    starts.push(checkpointDate);
                    ends.push(checkpointDate);
                }
            });
        });
    }

    if (starts.length === 0 || ends.length === 0) return null;
    const start = new Date(Math.min(...starts.map((date) => date.getTime())));
    const end = new Date(Math.max(...ends.map((date) => date.getTime())));
    const days = Math.max(1, diffDays(end, start) + 1);
    const dates = Array.from({ length: days }, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + index);
        return date;
    });

    return { start, days, dates };
}

function scopeRank(scopeName: string) {
    if (scopeName === "SIPIL") return 0;
    if (scopeName === "ME") return 1;
    return 2;
}

function buildTimelineFromBounds(starts: Date[], ends: Date[]): Timeline | null {
    if (starts.length === 0 || ends.length === 0) return null;
    const start = new Date(Math.min(...starts.map((date) => date.getTime())));
    const end = new Date(Math.max(...ends.map((date) => date.getTime())));
    const days = Math.max(1, diffDays(end, start) + 1);
    const dates = Array.from({ length: days }, (_, index) => addDays(start, index));
    return { start, days, dates };
}

export default function UnifiedSupervisionGantt({
    workspace,
    onCheckpointClick,
    onTargetStClick,
    showLegend = true,
}: {
    workspace: SupervisionWorkspace;
    onCheckpointClick: (checkpoint: UnifiedSupervisionCheckpoint, dayIndex: number) => void;
    onTargetStClick?: (date: string, dayIndex: number) => void;
    showLegend?: boolean;
}) {
    const [details, setDetails] = useState<ScopeDetail[]>([]);
    const [ganttFallbackTimeline, setGanttFallbackTimeline] = useState<Timeline | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const workspaceTimeline = useMemo(() => buildTimeline(workspace), [workspace]);
    const timeline = workspaceTimeline ?? ganttFallbackTimeline;
    
    // Responsive label width for mobile
    const [labelWidth, setLabelWidth] = useState(300);
    useEffect(() => {
        const handleResize = () => {
            setLabelWidth(window.innerWidth < 640 ? 176 : 300);
        };
        handleResize(); // Initialize
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const checkpointByDate = useMemo(() => {
        const map = new Map<string, UnifiedSupervisionCheckpoint>();
        (workspace.unified_checkpoints || []).forEach((checkpoint) => {
            map.set(checkpoint.tanggal_pengawasan, checkpoint);
        });
        return map;
    }, [workspace.unified_checkpoints]);

    const extensionDates = useMemo(() => {
        const dates = new Set<string>();

        workspace.scopes.forEach((scope) => {
            const spkStart = parseDate(scope.spk_start_date);
            const originalDuration = Number(scope.spk_duration || 0);
            const effectiveDuration = Number(scope.spk_effective_duration || 0);

            if (!spkStart || originalDuration <= 0 || effectiveDuration <= originalDuration) return;

            for (let day = originalDuration; day < effectiveDuration; day += 1) {
                dates.add(formatFullDate(addDays(spkStart, day)));
            }
        });

        return dates;
    }, [workspace.scopes]);

    const maxSpkEnd = useMemo(() => {
        let maxEnd: Date | null = null;
        workspace.scopes.forEach((scope) => {
            const spkEnd = getScopeSpkEnd(scope);
            if (spkEnd && (!maxEnd || spkEnd > maxEnd)) {
                maxEnd = spkEnd;
            }
        });
        return maxEnd;
    }, [workspace.scopes]);

    const spkEndByDate = useMemo(() => {
        const map = new Map<string, { label: string; scopes: string[] }>();
        if (!maxSpkEnd) return map;

        const dateStr = formatFullDate(maxSpkEnd);
        const current = { label: "Akhir SPK", scopes: [] as string[] };
        
        workspace.scopes.forEach((scope) => {
            const scopeName = String(scope.lingkup_pekerjaan || "SPK");
            if (!current.scopes.includes(scopeName)) {
                current.scopes.push(scopeName);
            }
        });
        
        map.set(dateStr, current);
        return map;
    }, [workspace.scopes, maxSpkEnd]);

    const stBufferByDate = useMemo(() => {
        const map = new Map<string, { label: string; explanation: string; offsetDays: number; isTarget: boolean; showOffsetLabel: boolean; scopes: string[]; targetLabel?: string }>();
        if (!maxSpkEnd) return map;
        
        let stTarget: Date | null = null;
        const allScopeNames: string[] = [];
        workspace.scopes.forEach((scope) => {
            const scopeName = String(scope.lingkup_pekerjaan || "SPK").toUpperCase();
            if (!allScopeNames.includes(scopeName)) allScopeNames.push(scopeName);
            
            const explicit = parseDate(scope.st_target_date);
            if (explicit && (!stTarget || explicit > stTarget)) stTarget = explicit;
        });

        const fallbackTarget = calculateTargetStFromSpkEnd(maxSpkEnd);
        if (!stTarget) {
            stTarget = fallbackTarget.date;
        }

        const effectiveOffsetDays = Math.max(0, diffDays(stTarget, maxSpkEnd));
        if (effectiveOffsetDays <= 0) return map;

        const showOffsetLabel = fallbackTarget.showOffsetLabel ?? effectiveOffsetDays > 1;

        for (let day = 1; day <= effectiveOffsetDays; day += 1) {
            const date = addDays(maxSpkEnd, day);
            if (date > stTarget) break;
            
            const dateStr = formatFullDate(date);
            const isTarget = dateStr === formatFullDate(stTarget);
            
            map.set(dateStr, {
                label: isTarget ? "ST" : `SPK +${day}`,
                explanation: isTarget ? (fallbackTarget.explanation || `Target ST ${formatFullDate(stTarget)}`) : `Jeda ke ST: SPK +${day}`,
                offsetDays: effectiveOffsetDays,
                isTarget,
                showOffsetLabel,
                scopes: allScopeNames,
                targetLabel: 'ST'
            });
        }

        return map;
    }, [workspace.scopes, maxSpkEnd]);

    const stDelaySummaries = useMemo(() => {
        const summaries = new Map<string, { date: string; label: string; scopes: string[] }>();
        stBufferByDate.forEach((value, date) => {
            if (value.isTarget && value.showOffsetLabel) {
                summaries.set(date, { date, label: value.label, scopes: value.scopes });
            }
        });
        return Array.from(summaries.values()).sort((left, right) => {
            const leftDate = parseDate(left.date);
            const rightDate = parseDate(right.date);
            return (leftDate?.getTime() || 0) - (rightDate?.getTime() || 0);
        });
    }, [stBufferByDate]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError("");

            try {
                const scopesWithGantt = workspace.scopes
                    .filter((scope) => scope.gantt_id)
                    .sort((left, right) => scopeRank(String(left.lingkup_pekerjaan || "").toUpperCase()) - scopeRank(String(right.lingkup_pekerjaan || "").toUpperCase()));

                const rawScopes = await mapWithConcurrency(scopesWithGantt, 2, async (scope) => {
                        const res = await fetchGanttDetailByToko(scope.id_toko);
                        const data = res as any;
                        const gantt = data.gantt_data;
                        const spkStart = parseDate(scope.spk_start_date);
                        const ganttStart = isReasonableSpkStart(spkStart)
                            ? spkStart
                            : parseDate(gantt?.timestamp) || null;
                        const categories = data.kategori_pekerjaan || [];
                        const dayItems = data.day_gantt_data || [];
                        const dependencies = data.dependency_data || [];
                        return { scope, ganttStart, categories, dayItems, dependencies };
                    });

                const fallbackStarts: Date[] = [];
                const fallbackEnds: Date[] = [];
                rawScopes.forEach(({ ganttStart, dayItems }) => {
                    dayItems.forEach((item: any) => {
                        const rawStart = String(item.h_awal || "");
                        const rawEnd = String(item.h_akhir || "");
                        const startDate = rawStart.includes("/")
                            ? parseDate(rawStart)
                            : ganttStart
                                ? addDays(ganttStart, (parseInt(rawStart, 10) || 1) - 1)
                                : null;
                        const endDate = rawEnd.includes("/")
                            ? parseDate(rawEnd)
                            : ganttStart
                                ? addDays(ganttStart, (parseInt(rawEnd, 10) || 1) - 1)
                                : null;
                        if (startDate) fallbackStarts.push(startDate);
                        if (endDate) fallbackEnds.push(endDate);
                    });
                });

                const fallbackTimeline = buildTimelineFromBounds(fallbackStarts, fallbackEnds);
                const activeTimeline = workspaceTimeline ?? fallbackTimeline;
                if (!activeTimeline) {
                    if (!cancelled) {
                        setGanttFallbackTimeline(null);
                        setDetails([]);
                    }
                    return;
                }

                const loaded = rawScopes.map(({ scope, ganttStart, categories, dayItems, dependencies }) => {
                        const rangeStart = ganttStart || activeTimeline.start;
                        const rangesByCategory = new Map<string, Array<{ start: number; end: number; duration: number; delay: number }>>();

                        const toAbsoluteDay = (value: string) => {
                            if (!value) return NaN;
                            if (String(value).includes("/")) {
                                const parsed = parseDate(value);
                                return parsed ? diffDays(parsed, activeTimeline.start) + 1 : NaN;
                            }
                            const day = parseInt(String(value), 10);
                            if (!Number.isFinite(day)) return NaN;
                            const date = new Date(rangeStart);
                            date.setDate(date.getDate() + day - 1);
                            return diffDays(date, activeTimeline.start) + 1;
                        };

                        dayItems.forEach((item: any) => {
                            const start = toAbsoluteDay(item.h_awal);
                            const end = toAbsoluteDay(item.h_akhir);
                            if (!Number.isFinite(start) || !Number.isFinite(end)) return;
                            const key = String(item.kategori_pekerjaan || "").trim().toLowerCase();
                            const list = rangesByCategory.get(key) || [];
                            list.push({
                                start,
                                end,
                                duration: Math.max(1, end - start + 1),
                                delay: Number(item.keterlambatan || 0),
                            });
                            rangesByCategory.set(key, list);
                        });

                        const depMap = new Map<string, string[]>();
                        dependencies.forEach((dep: any) => {
                            const child = String(dep.kategori_pekerjaan || "").trim().toLowerCase();
                            const parent = String(dep.kategori_pekerjaan_terikat || "").trim().toLowerCase();
                            if (!parent || !child) return;
                            const list = depMap.get(parent) || [];
                            list.push(child);
                            depMap.set(parent, list);
                        });
                        const taskIdByName = new Map<string, number>();
                        categories.forEach((category: any, index: number) => {
                            taskIdByName.set(String(category.kategori_pekerjaan || "").trim().toLowerCase(), index + 1);
                        });

                        const rows = categories.map((category: any, index: number) => {
                            const label = String(category.kategori_pekerjaan || "-");
                            const key = label.trim().toLowerCase();
                            return {
                                taskId: index + 1,
                                id: `${scope.id_toko}-${index}`,
                                label,
                                dependencies: (depMap.get(key) || [])
                                    .map((childName) => taskIdByName.get(childName))
                                    .filter((id): id is number => Number.isFinite(id)),
                                bars: rangesByCategory.get(key) || [],
                            };
                        });

                        return {
                            id_toko: scope.id_toko,
                            scopeName: String(scope.lingkup_pekerjaan || "LINGKUP").toUpperCase(),
                            ganttId: scope.gantt_id,
                            status: scope.status_opname_final || "Opname belum dibuat",
                            rows,
                        };
                    });

                if (!cancelled) {
                    setGanttFallbackTimeline(fallbackTimeline);
                    setDetails(loaded);
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Gagal memuat Gantt terpadu.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [workspace, workspaceTimeline]);

    const activeScopeIdsByDate = useMemo(() => {
        const map = new Map<string, Set<number>>();
        if (!timeline) return map;

        timeline.dates.forEach((date, dayIndex) => {
            const absoluteDay = dayIndex + 1;
            const scopeIds = new Set<number>();

            details.forEach((scope) => {
                const hasActiveBar = scope.rows.some((row) =>
                    row.bars.some((bar) => {
                        const start = Math.max(1, bar.start);
                        const end = bar.end + Math.max(0, bar.delay);
                        return start <= absoluteDay && absoluteDay <= end;
                    })
                );
                if (hasActiveBar) scopeIds.add(Number(scope.id_toko));
            });

            map.set(formatFullDate(date), scopeIds);
        });

        return map;
    }, [details, timeline]);
    
    // Calculate scope activity ranges for better visual indication
    const scopeActivityRanges = useMemo(() => {
        const ranges = new Map<number, { start: number; end: number }>();
        if (!timeline) return ranges;
        
        details.forEach((scope) => {
            let minDay = Infinity;
            let maxDay = -Infinity;
            
            scope.rows.forEach((row) => {
                row.bars.forEach((bar) => {
                    const start = Math.max(1, bar.start);
                    const end = bar.end + Math.max(0, bar.delay);
                    minDay = Math.min(minDay, start);
                    maxDay = Math.max(maxDay, end);
                });
            });
            
            if (minDay !== Infinity && maxDay !== -Infinity) {
                ranges.set(scope.id_toko, { start: minDay, end: maxDay });
            }
        });
        
        return ranges;
    }, [details, timeline]);

    const checkpointVisualStateByDate = useMemo(() => {
        const map = new Map<string, CheckpointVisualState>();
        if (!timeline) return map;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const checkpointEntries = timeline.dates
            .map((date) => {
                const fullDate = formatFullDate(date);
                const checkpoint = checkpointByDate.get(fullDate);
                if (!checkpoint) return null;
                const readyCount = Number(checkpoint.ready_opname_items || 0);
                const selesaiCount = Number(checkpoint.selesai_items || 0);
                const opnameCount = Number(checkpoint.opname_items || 0);
                const totalCount = Number(checkpoint.total_items || 0);
                const hasActionItems = readyCount > 0;
                const hasAnyFilledItem = selesaiCount > 0 || opnameCount > 0;
                return { date, fullDate, hasActionItems, hasAnyFilledItem, totalCount, selesaiCount, opnameCount };
            })
            .filter((entry): entry is { date: Date; fullDate: string; hasActionItems: boolean; hasAnyFilledItem: boolean; totalCount: number; selesaiCount: number; opnameCount: number } => Boolean(entry));

        checkpointEntries.forEach((entry) => {
            const isToday = entry.date.getTime() === todayStart.getTime();
            if (isToday) {
                map.set(entry.fullDate, "todayCheckpoint");
            } else if (entry.hasActionItems) {
                map.set(entry.fullDate, "needsInput");
            } else if (entry.date < todayStart) {
                if (entry.totalCount > entry.selesaiCount + entry.opnameCount) {
                    map.set(entry.fullDate, "needsInput");
                } else if (entry.hasAnyFilledItem) {
                    map.set(entry.fullDate, "filled");
                } else {
                    map.set(entry.fullDate, "normal");
                }
            } else {
                map.set(entry.fullDate, "normal");
            }
        });

        return map;
    }, [checkpointByDate, timeline]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center border-y border-slate-200 bg-white py-16 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat timeline terpadu...
            </div>
        );
    }

    if (!timeline) {
        // Check if we have scopes but no valid timeline data
        const hasScopesWithoutTimeline = workspace.scopes.length > 0 && !workspaceTimeline && !ganttFallbackTimeline;
        
        if (hasScopesWithoutTimeline) {
            return (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-10 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-3" />
                    <p className="text-sm font-bold text-amber-900 mb-2">
                        Data Gantt Tidak Lengkap
                    </p>
                    <p className="text-xs text-amber-700">
                        ULOK ini memiliki {workspace.scopes.length} scope ({workspace.scopes.map(s => s.lingkup_pekerjaan).join(', ')}), 
                        tetapi tidak ada tanggal kerja atau tanggal pengawasan yang valid untuk membuat timeline.
                    </p>
                </div>
            );
        }
        
        return (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500">
                Belum ada tanggal kerja atau tanggal pengawasan untuk ULOK ini.
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-8 text-center text-sm font-bold text-red-700">
                {error}
            </div>
        );
    }

    const totalHeight = details.reduce((sum, scope) => sum + GROUP_HEIGHT + (scope.rows.length * ROW_HEIGHT), 0);
    const totalWidth = timeline.days * DAY_WIDTH;
    const connectorNodes: React.ReactNode[] = [];
    let connectorY = 0;
    details.forEach((scope) => {
        connectorY += GROUP_HEIGHT;
        const coordinates = new Map<number, { centerY: number; startX: number; firstEndX: number }>();
        scope.rows.forEach((row, rowIndex) => {
            if (row.bars.length === 0) return;
            const rowTop = connectorY + (rowIndex * ROW_HEIGHT);
            const starts = row.bars.map((bar) => Math.max(1, bar.start));
            const minStart = Math.min(...starts);
            const firstBar = row.bars.reduce((winner, bar) => Math.max(1, bar.start) < Math.max(1, winner.start) ? bar : winner, row.bars[0]);
            const firstEnd = Math.min(timeline.days, firstBar.end + Math.max(0, firstBar.delay));
            coordinates.set(row.taskId, {
                centerY: rowTop + (ROW_HEIGHT / 2),
                startX: (minStart - 1) * DAY_WIDTH,
                firstEndX: firstEnd * DAY_WIDTH,
            });
        });

        scope.rows.forEach((row) => {
            row.dependencies.forEach((childId) => {
                const parent = coordinates.get(row.taskId);
                const child = coordinates.get(childId);
                if (!parent || !child) return;
                let tension = child.startX - parent.firstEndX < 40 ? 60 : 40;
                if (child.startX - parent.firstEndX < 0) tension = 100;
                const path = `M ${parent.firstEndX} ${parent.centerY} C ${parent.firstEndX + tension} ${parent.centerY}, ${child.startX - tension} ${child.centerY}, ${child.startX} ${child.centerY}`;
                connectorNodes.push(
                    <g key={`${scope.id_toko}-${row.taskId}-${childId}`}>
                        <path d={path} className="stroke-blue-500 fill-transparent stroke-2" markerEnd="url(#unifiedDepArrow)" opacity="0.95" />
                        <circle cx={parent.firstEndX} cy={parent.centerY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                        <circle cx={child.startX} cy={child.centerY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                    </g>
                );
            });
        });
        connectorY += scope.rows.length * ROW_HEIGHT;
    });

    return (
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white text-xs shadow-sm">
            {showLegend && <div className="border-b border-slate-300 bg-white">
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-xs font-black uppercase text-red-700">Status tanggal</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="h-2 w-2 rounded-full bg-sky-600" />
                            Pengawasan
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-400" />
                            Hari ini
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="h-3 w-3 animate-pulse rounded bg-yellow-100 ring-1 ring-yellow-400" />
                            Pengawasan hari ini
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="h-3 w-3 rounded bg-teal-100 ring-1 ring-teal-400" />
                            Pengawasan terisi
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="h-3 w-3 animate-pulse rounded bg-red-100 ring-1 ring-red-500" />
                            Belum selesai / diisi
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="rounded bg-amber-700 px-2 py-0.5 text-[10px] font-black text-white">Akhir</span>
                            Akhir SPK
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-black text-white">ST</span>
                            Target ST
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <span className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">SPK +N</span>
                            Mundur libur
                        </span>
                    </div>
                    {stDelaySummaries.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-teal-800">
                            <span className="text-slate-500">ST mundur:</span>
                            {stDelaySummaries.map((item) => (
                                <span key={item.date} className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5">
                                    {item.label.includes('Lama') || item.label.includes('Baru') ? '' : item.scopes.length === 1 ? `${item.scopes[0]}: ` : ''}{item.date.slice(0, 5)} {item.label.replace(" hari", "")}
                                </span>
                            ))}
                        </div>
                    )}
                    {details.length === 1 && (
                        <div className="inline-flex w-fit items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                            Scope tunggal
                        </div>
                    )}
                </div>
            </div>}

            <div className="flex border-b border-slate-300">
                <div className="grid h-16 shrink-0 grid-cols-[44px_1fr] items-stretch border-r border-slate-300 bg-slate-50 font-bold text-slate-700 overflow-hidden" style={{ width: labelWidth }}>
                    <div className="flex items-center justify-center border-r border-slate-300">No.</div>
                    <div className="flex items-center px-4">Uraian Pekerjaan</div>
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto" id="unified-gantt-scroll-top" onScroll={(e) => {
                    const body = document.getElementById("unified-gantt-scroll-body");
                    if (body && body.scrollLeft !== e.currentTarget.scrollLeft) body.scrollLeft = e.currentTarget.scrollLeft;
                }}>
                    <div className="flex" style={{ minWidth: totalWidth }}>
                        {timeline.dates.map((date, dayIndex) => {
                            const fullDate = formatFullDate(date);
                            const checkpoint = checkpointByDate.get(fullDate);
                            const isExtension = extensionDates.has(fullDate);
                            const spkEnd = spkEndByDate.get(fullDate);
                            const stBuffer = stBufferByDate.get(fullDate);
                            const checkpointState = checkpointVisualStateByDate.get(fullDate);
                            const today = new Date();
                            const isToday = fullDate === formatFullDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                            const visualState = checkpointState || (isToday ? "today" : undefined);
                            const activeScopeIds = activeScopeIdsByDate.get(fullDate) ?? new Set<number>();
                            const actionableCheckpoint = checkpoint && activeScopeIds.size > 0
                                ? {
                                    ...checkpoint,
                                    scopes: (checkpoint.scopes || []).filter((scope) => activeScopeIds.has(Number(scope.id_toko))),
                                }
                                : checkpoint;
                            const readyCount = Number(checkpoint?.ready_opname_items || 0);
                            const opnameCount = Number(checkpoint?.opname_items || 0);
                            const isReady = readyCount > 0;
                            const dateTextClass = visualState === "needsInput"
                                ? "text-red-700"
                                : visualState === "filled"
                                    ? "text-teal-800"
                                    : visualState === "todayCheckpoint"
                                        ? "text-yellow-900 text-[13px]"
                                    : visualState === "today"
                                        ? "text-emerald-700 text-[13px]"
                                        : "";
                            const isTargetStDate = Boolean(stBuffer?.isTarget);
                            return (
                                <button
                                    key={fullDate}
                                    type="button"
                                    disabled={!checkpoint && !isTargetStDate}
                                    onClick={() => {
                                        if (isTargetStDate && onTargetStClick) {
                                            onTargetStClick(fullDate, dayIndex);
                                            return;
                                        }
                                        if (actionableCheckpoint) onCheckpointClick(actionableCheckpoint, dayIndex);
                                    }}
                                    className={`relative flex h-16 shrink-0 flex-col items-center justify-end border-r border-slate-200 pb-1 text-[10px] font-bold ${
                                        spkEnd
                                            ? "bg-amber-50 text-slate-900 hover:bg-amber-100"
                                            : stBuffer?.isTarget
                                                ? "bg-teal-50 text-slate-900 hover:bg-teal-100"
                                                : stBuffer
                                                    ? "bg-teal-50 text-teal-900 hover:bg-teal-100"
                                                    : isExtension
                                                        ? "bg-amber-50 text-slate-900 hover:bg-amber-100"
                                                        : visualState === "needsInput"
                                                            ? "animate-pulse bg-red-50 text-red-800 ring-2 ring-inset ring-red-400 shadow-[inset_0_4px_0_#dc2626] hover:bg-red-100"
                                                            : visualState === "filled"
                                                                ? "bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-300 shadow-[inset_0_3px_0_#0d9488] hover:bg-teal-100"
                                                                : visualState === "todayCheckpoint"
                                                                    ? "animate-pulse bg-yellow-100 text-yellow-950 ring-2 ring-inset ring-yellow-500 shadow-[inset_0_4px_0_#f59e0b] hover:bg-yellow-100"
                                                                    : visualState === "today"
                                                                        ? "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-300 hover:bg-emerald-100"
                                                                    : checkpoint
                                                                        ? "bg-blue-100 text-slate-900 ring-1 ring-inset ring-blue-300 shadow-[inset_0_3px_0_#2563eb] hover:bg-blue-100"
                                                                : "bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                    style={{ width: DAY_WIDTH }}
                                    title={isExtension
                                        ? `${fullDate} - ${spkEnd ? `Akhir SPK ${spkEnd.scopes.join(" + ")}` : "tanggal pertambahan SPK"}`
                                        : stBuffer
                                            ? `${fullDate} - ${stBuffer.explanation}`
                                            : spkEnd
                                                ? `${fullDate} - Akhir SPK ${spkEnd.scopes.join(" + ")}`
                                                : checkpoint
                                                    ? `${fullDate} - ${readyCount} siap opname, ${opnameCount} sudah opname`
                                                    : fullDate}
                                >
                                    {spkEnd ? (
                                        <span className="absolute top-1 left-1/2 -translate-x-1/2 z-20 w-[40px] whitespace-normal break-words rounded bg-amber-700 px-0.5 py-0.5 text-center text-[8px] font-black leading-[9px] text-white shadow-sm">
                                            {spkEnd.label}
                                        </span>
                                    ) : stBuffer?.isTarget ? (
                                        <span className="absolute top-1 left-1/2 -translate-x-1/2 z-20 w-[40px] whitespace-normal break-words rounded bg-teal-700 px-0.5 py-0.5 text-center text-[8px] font-black leading-[9px] text-white shadow-sm">
                                            {stBuffer.targetLabel || 'ST'}
                                        </span>
                                    ) : stBuffer ? (
                                        <span className="absolute top-1 left-1/2 -translate-x-1/2 z-20 w-[40px] whitespace-normal break-words rounded bg-orange-500 px-0.5 py-0.5 text-center text-[8px] font-black leading-[9px] text-white">{stBuffer.label.replace(" hari", "")}</span>
                                    ) : visualState === "needsInput" ? (
                                        <span className="absolute top-1 h-2.5 w-2.5 rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.18)]" title="Ada item perlu diisi" />
                                    ) : visualState === "filled" ? (
                                        <span className="absolute top-1 h-2.5 w-2.5 rounded-full bg-teal-600 shadow-[0_0_0_4px_rgba(13,148,136,0.16)]" title="Pengawasan sudah terisi" />
                                    ) : visualState === "todayCheckpoint" ? (
                                        <span className="absolute top-1 h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-[0_0_0_4px_rgba(245,158,11,0.26)]" title="Pengawasan hari ini" />
                                    ) : visualState === "today" ? (
                                        <span className="absolute top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" title="Hari ini" />
                                    ) : isReady ? (
                                        <span className="absolute top-1 h-2 w-2 rounded-full bg-red-600 shadow-[0_0_0_3px_rgba(220,38,38,0.16)]" title="Siap opname" />
                                    ) : null}
                                    <span className={`text-[11px] leading-4 ${dateTextClass}`}>{formatShortDate(date)}</span>
                                    <span className="text-[10px] font-medium leading-3">{formatDayName(date)}</span>
                                    {checkpoint && !stBuffer && !spkEnd && visualState === "normal" ? <span className="absolute top-1 h-2 w-2 rounded-full bg-blue-700 shadow-[0_0_0_3px_rgba(37,99,235,0.18)]" title="Hari pengawasan" /> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex max-h-[620px] overflow-hidden">
                <div className="shrink-0 overflow-y-auto overflow-x-hidden border-r border-slate-300 bg-white" id="unified-gantt-labels" style={{ width: labelWidth }} onScroll={(e) => {
                    const body = document.getElementById("unified-gantt-scroll-body");
                    if (body && body.scrollTop !== e.currentTarget.scrollTop) body.scrollTop = e.currentTarget.scrollTop;
                }}>
                    {details.map((scope) => (
                        <React.Fragment key={scope.id_toko}>
                            <div className="grid grid-cols-[44px_1fr] items-center border-b border-slate-300 bg-slate-50 text-xs font-black text-slate-900 overflow-hidden" style={{ height: GROUP_HEIGHT }}>
                                <div className="flex h-full items-center justify-center border-r border-slate-200">
                                    <Building2 className={`h-3.5 w-3.5 shrink-0 ${scope.scopeName === "SIPIL" ? "text-red-600" : "text-blue-600"}`} />
                                </div>
                                <div className="flex min-w-0 items-center justify-between gap-2 px-3">
                                    <span className={`${scope.scopeName === "SIPIL" ? "text-red-700" : "text-blue-700"}`}>{scope.scopeName}</span>
                                    <span className="hidden shrink-0 text-[10px] text-slate-500 sm:inline">#{scope.ganttId || "-"}</span>
                                </div>
                            </div>
                            {scope.rows.map((row, index) => (
                                <div key={row.id} className="grid grid-cols-[44px_1fr] items-center border-b border-slate-100 text-[11px] font-bold text-slate-800 overflow-hidden" style={{ height: ROW_HEIGHT }}>
                                    <span className="flex h-full items-center justify-center border-r border-slate-100 text-slate-500">{index + 1}</span>
                                    <span className="truncate px-3" title={row.label}>{row.label}</span>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>

                <div className="min-w-0 flex-1 overflow-auto bg-white" id="unified-gantt-scroll-body" onScroll={(e) => {
                    const top = document.getElementById("unified-gantt-scroll-top");
                    const labels = document.getElementById("unified-gantt-labels");
                    if (top && top.scrollLeft !== e.currentTarget.scrollLeft) top.scrollLeft = e.currentTarget.scrollLeft;
                    if (labels && labels.scrollTop !== e.currentTarget.scrollTop) labels.scrollTop = e.currentTarget.scrollTop;
                }}>
                    <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
                        {timeline.dates.map((date, dayIndex) => {
                            const fullDate = formatFullDate(date);
                            const checkpoint = checkpointByDate.get(fullDate);
                            const isExtension = extensionDates.has(fullDate);
                            const spkEnd = spkEndByDate.get(fullDate);
                            const stBuffer = stBufferByDate.get(fullDate);
                            const checkpointState = checkpointVisualStateByDate.get(fullDate);
                            const today = new Date();
                            const isToday = fullDate === formatFullDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                            const visualState = checkpointState || (isToday ? "today" : undefined);
                            return (
                                <div
                                    key={fullDate}
                                    className={`absolute top-0 bottom-0 border-r ${
                                        spkEnd
                                            ? "bg-amber-50/80 border-amber-300 shadow-[inset_0_3px_0_#b45309]"
                                            : stBuffer?.isTarget
                                                ? "bg-teal-100/80 border-teal-300 shadow-[inset_0_3px_0_#0f766e]"
                                                : stBuffer
                                                    ? "bg-teal-50/60 border-teal-100"
                                                    : isExtension
                                                        ? "bg-amber-50/60 border-amber-200"
                                                            : visualState === "needsInput"
                                                                ? "animate-pulse bg-red-50/80 border-red-300 shadow-[inset_0_4px_0_#dc2626]"
                                                                : visualState === "filled"
                                                                    ? "bg-teal-50/75 border-teal-300 shadow-[inset_0_3px_0_#0d9488]"
                                                                    : visualState === "todayCheckpoint"
                                                                        ? "animate-pulse bg-yellow-100/85 border-yellow-500 shadow-[inset_0_4px_0_#f59e0b]"
                                                                        : visualState === "today"
                                                                            ? "bg-emerald-50/80 border-emerald-300 shadow-[inset_0_3px_0_#10b981]"
                                                                        : checkpoint
                                                                            ? "bg-blue-100/70 border-blue-300 shadow-[inset_0_3px_0_#2563eb]"
                                                                            : "border-slate-200"
                                    }`}
                                    style={{ left: dayIndex * DAY_WIDTH, width: DAY_WIDTH }}
                                    title={isExtension ? `${fullDate} - tanggal pertambahan SPK` : stBuffer ? `${fullDate} - ${stBuffer.explanation}` : spkEnd ? `${fullDate} - Akhir SPK ${spkEnd.scopes.join(" + ")}` : undefined}
                                />
                            );
                        })}
                        {connectorNodes.length > 0 && (
                            <svg className="pointer-events-none absolute left-0 top-0 z-20 overflow-visible" style={{ width: totalWidth, height: totalHeight }}>
                                <defs>
                                    <marker id="unifiedDepArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                        <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                                    </marker>
                                </defs>
                                {connectorNodes}
                            </svg>
                        )}
                        {details.reduce<{ nodes: React.ReactNode[]; y: number }>((acc, scope) => {
                            const scopeRange = scopeActivityRanges.get(scope.id_toko);
                            const scopeTop = acc.y;
                            const scopeHeight = GROUP_HEIGHT + (scope.rows.length * ROW_HEIGHT);
                            
                            // Add group header
                            acc.nodes.push(
                                <div key={`${scope.id_toko}-group`} className="absolute left-0 right-0 border-b border-slate-300 bg-slate-100/90" style={{ top: acc.y, height: GROUP_HEIGHT }}>
                                    <div className={`flex h-full items-center justify-between px-4 text-xs font-black ${scope.scopeName === "SIPIL" ? "text-red-700" : "text-blue-700"}`}>
                                        <span>{scope.scopeName}</span>
                                        {scopeRange && (
                                            <span className="text-[10px] font-normal text-slate-500">
                                                Hari {scopeRange.start}-{scopeRange.end}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                            acc.y += GROUP_HEIGHT;
                            
                            // Add inactive day overlays BEFORE scope starts
                            if (scopeRange && scopeRange.start > 1) {
                                acc.nodes.push(
                                    <div
                                        key={`${scope.id_toko}-inactive-before`}
                                        className="absolute z-10 pointer-events-none bg-slate-200/40"
                                        style={{
                                            top: scopeTop,
                                            left: 0,
                                            width: (scopeRange.start - 1) * DAY_WIDTH,
                                            height: scopeHeight,
                                        }}
                                        title={`${scope.scopeName} belum dimulai`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-300/60 to-slate-200/30" />
                                    </div>
                                );
                            }
                            
                            // Add inactive day overlays AFTER scope ends
                            if (scopeRange && scopeRange.end < timeline.days) {
                                acc.nodes.push(
                                    <div
                                        key={`${scope.id_toko}-inactive-after`}
                                        className="absolute z-10 pointer-events-none bg-slate-200/40"
                                        style={{
                                            top: scopeTop,
                                            left: scopeRange.end * DAY_WIDTH,
                                            width: (timeline.days - scopeRange.end) * DAY_WIDTH,
                                            height: scopeHeight,
                                        }}
                                        title={`${scope.scopeName} sudah selesai`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-l from-slate-300/60 to-slate-200/30" />
                                    </div>
                                );
                            }
                            
                            // Add rows and bars
                            scope.rows.forEach((row) => {
                                const rowTop = acc.y;
                                acc.nodes.push(
                                    <div key={`${row.id}-grid`} className="absolute left-0 right-0 border-b border-slate-100" style={{ top: rowTop, height: ROW_HEIGHT }} />
                                );
                                row.bars.forEach((bar, index) => {
                                    const start = Math.max(1, bar.start);
                                    const end = Math.min(timeline.days, bar.end + Math.max(0, bar.delay));
                                    if (end < 1 || start > timeline.days) return;
                                    const left = (start - 1) * DAY_WIDTH;
                                    const width = Math.max(DAY_WIDTH * 0.65, (end - start + 1) * DAY_WIDTH - 6);
                                    acc.nodes.push(
                                        <div
                                            key={`${row.id}-bar-${index}`}
                                            className="absolute z-30 flex items-center justify-center overflow-hidden rounded-md border border-blue-500 bg-blue-100 px-2 text-[10px] font-black text-blue-800 shadow-sm"
                                            style={{ top: rowTop + 8, left, width, height: ROW_HEIGHT - 16 }}
                                            title={`${scope.scopeName} - ${row.label}: ${bar.duration} hari`}
                                        >
                                            <div className="absolute inset-0 bg-blue-600 opacity-20" />
                                            <span className="relative z-10">{bar.duration} Hari</span>
                                        </div>
                                    );
                                });
                                acc.y += ROW_HEIGHT;
                            });
                            return acc;
                        }, { nodes: [], y: 0 }).nodes}
                    </div>
                </div>
            </div>
        </div>
    );
}
