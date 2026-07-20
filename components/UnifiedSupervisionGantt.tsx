"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { fetchGanttDetailByToko } from "@/lib/api";
import type { SupervisionCheckpoint, SupervisionWorkspace, UnifiedSupervisionCheckpoint } from "@/lib/api";

const DAY_WIDTH = 40;
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

function diffDays(left: Date, right: Date): number {
    return Math.round((left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
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

function buildTimeline(workspace: SupervisionWorkspace): Timeline | null {
    const starts: Date[] = [];
    const ends: Date[] = [];

    // SPK dates define the base work schedule; checkpoints can extend it for Target ST.
    workspace.scopes.forEach((scope) => {
        const spkStart = parseDate(scope.spk_start_date);
        const duration = Number(scope.spk_effective_duration || scope.spk_duration || 0);
        if (spkStart && duration > 0) {
            starts.push(spkStart);
            const end = new Date(spkStart);
            end.setDate(end.getDate() + duration - 1);
            ends.push(end);
        }
        const stTarget = parseDate(scope.st_target_date);
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
}: {
    workspace: SupervisionWorkspace;
    onCheckpointClick: (checkpoint: UnifiedSupervisionCheckpoint, dayIndex: number) => void;
}) {
    const [details, setDetails] = useState<ScopeDetail[]>([]);
    const [ganttFallbackTimeline, setGanttFallbackTimeline] = useState<Timeline | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const workspaceTimeline = useMemo(() => buildTimeline(workspace), [workspace]);
    const timeline = workspaceTimeline ?? ganttFallbackTimeline;
    
    // Responsive label width for mobile
    const [labelWidth, setLabelWidth] = useState(340);
    useEffect(() => {
        const handleResize = () => {
            setLabelWidth(window.innerWidth < 640 ? 180 : 340);
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

    const spkEndByDate = useMemo(() => {
        const map = new Map<string, { label: string; scopes: string[] }>();

        workspace.scopes.forEach((scope) => {
            const spkEnd = getScopeSpkEnd(scope);
            if (!spkEnd) return;
            const fullDate = formatFullDate(spkEnd);
            const current = map.get(fullDate) || { label: "Akhir SPK", scopes: [] };
            current.scopes.push(String(scope.lingkup_pekerjaan || "SPK"));
            map.set(fullDate, current);
        });

        return map;
    }, [workspace.scopes]);

    const stBufferByDate = useMemo(() => {
        const map = new Map<string, { label: string; explanation: string; offsetDays: number; isTarget: boolean }>();
        const unifiedCheckpointDates = (workspace.unified_checkpoints || [])
            .map((checkpoint) => parseDate(checkpoint.tanggal_pengawasan))
            .filter((date): date is Date => Boolean(date));

        workspace.scopes.forEach((scope) => {
            const spkEnd = getScopeSpkEnd(scope);
            let stTarget = parseDate(scope.st_target_date);
            if (!stTarget && spkEnd) {
                stTarget = (scope.checkpoints || [])
                    .map((checkpoint) => parseDate(checkpoint.tanggal_pengawasan))
                    .filter((date): date is Date => Boolean(date && date > spkEnd))
                    .sort((left, right) => left.getTime() - right.getTime())[0] || null;
            }
            if (!stTarget && spkEnd) {
                stTarget = unifiedCheckpointDates
                    .filter((date) => date > spkEnd)
                    .sort((left, right) => left.getTime() - right.getTime())[0] || null;
            }
            const offsetDays = Number(scope.st_offset_days || 0);
            const effectiveOffsetDays = offsetDays || (spkEnd && stTarget ? Math.max(0, diffDays(stTarget, spkEnd)) : 0);
            if (!spkEnd || !stTarget || effectiveOffsetDays <= 0 || stTarget <= spkEnd) return;

            for (let day = 1; day <= effectiveOffsetDays; day += 1) {
                const date = addDays(spkEnd, day);
                if (date > stTarget) break;
                map.set(formatFullDate(date), {
                    label: scope.st_offset_label || `SPK +${effectiveOffsetDays} hari`,
                    explanation: scope.st_offset_explanation || `Target ST ${formatFullDate(stTarget)}`,
                    offsetDays: effectiveOffsetDays,
                    isTarget: formatFullDate(date) === formatFullDate(stTarget),
                });
            }
        });

        return map;
    }, [workspace.scopes, workspace.unified_checkpoints]);

    const stDelaySummaries = useMemo(() => {
        const summaries = new Map<string, { date: string; label: string }>();
        stBufferByDate.forEach((value, date) => {
            if (value.isTarget && value.offsetDays > 1) {
                summaries.set(date, { date, label: value.label });
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
                const rawScopes = await Promise.all(workspace.scopes
                    .filter((scope) => scope.gantt_id)
                    .sort((left, right) => scopeRank(String(left.lingkup_pekerjaan || "").toUpperCase()) - scopeRank(String(right.lingkup_pekerjaan || "").toUpperCase()))
                    .map(async (scope) => {
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
                    }));

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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-sm">
            <div className="border-b bg-slate-100 p-4 text-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Gantt Chart Terpadu</h3>
                        <p className="text-xs text-slate-500">
                            {details.length === 1 
                                ? `Hanya scope ${details[0].scopeName} yang tersedia untuk ULOK ini.`
                                : `${details.map(d => d.scopeName).join(' + ')} dalam satu tanggal pengawasan.`
                            }
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-slate-800 shadow-[inset_0_3px_0_#f59e0b]" />
                                Akhir SPK
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-teal-700" />
                                Target ST
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm border border-teal-200 bg-teal-50" />
                                Weekend/libur
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
                                Pertambahan SPK
                            </span>
                        </div>
                        {stDelaySummaries.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-teal-800">
                                <span className="text-slate-500">ST mundur:</span>
                                {stDelaySummaries.map((item) => (
                                    <span key={item.date} className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5">
                                        {item.date.slice(0, 5)} {item.label.replace(" hari", "")}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {details.length === 1 && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Scope Tunggal</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex border-b border-slate-300">
                <div className="flex h-10 shrink-0 items-center border-r-[3px] border-slate-400 bg-slate-50 px-4 font-bold text-slate-600 overflow-hidden" style={{ width: labelWidth }}>
                    Tahapan Pekerjaan
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
                            const isDone = !isReady && opnameCount > 0;
                            return (
                                <button
                                    key={fullDate}
                                    type="button"
                                    disabled={!checkpoint}
                                    onClick={() => actionableCheckpoint && onCheckpointClick(actionableCheckpoint, dayIndex)}
                                    className={`flex h-10 shrink-0 flex-col items-center justify-center border-r border-slate-300 text-[9px] font-black ${
                                        isReady
                                            ? "bg-red-600 text-white ring-2 ring-inset ring-red-200"
                                            : isExtension
                                                ? "bg-amber-50 text-amber-950 shadow-[inset_0_3px_0_#f59e0b] hover:bg-amber-100"
                                                : stBuffer?.isTarget
                                                    ? "bg-teal-700 text-white shadow-[inset_0_3px_0_#134e4a] hover:bg-teal-600"
                                                    : spkEnd
                                                        ? "bg-slate-800 text-white shadow-[inset_0_3px_0_#f59e0b] hover:bg-slate-700"
                                                        : stBuffer
                                                            ? "bg-teal-50 text-teal-900 shadow-[inset_0_3px_0_#99f6e4] hover:bg-teal-100"
                                                            : isDone
                                                                ? "bg-emerald-500 text-white"
                                                                : checkpoint
                                                                    ? "bg-blue-600 text-white hover:bg-blue-500"
                                                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
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
                                    <span className={isExtension || stBuffer || spkEnd ? "leading-3" : undefined}>{formatShortDate(date)}</span>
                                    {isExtension && !isReady ? (
                                        <span className="mt-0.5 rounded-sm bg-amber-200 px-1 text-[8px] font-black leading-3 text-amber-950">
                                            {spkEnd ? "Akhir" : "SPK+"}
                                        </span>
                                    ) : null}
                                    {stBuffer && !isExtension && !isReady ? (
                                        <span className={`mt-0.5 whitespace-nowrap rounded-sm px-1 text-[8px] font-black leading-3 ${stBuffer.isTarget ? "bg-white text-teal-800" : "bg-teal-100 text-teal-800"}`}>
                                            {stBuffer.isTarget ? (stBuffer.offsetDays > 1 ? stBuffer.label.replace(" hari", "") : "ST") : "libur"}
                                        </span>
                                    ) : null}
                                    {spkEnd && !isExtension && !stBuffer && !isReady ? (
                                        <span className="mt-0.5 rounded-sm bg-amber-300 px-1 text-[8px] font-black leading-3 text-slate-950">
                                            Akhir
                                        </span>
                                    ) : null}
                                    {isReady ? <AlertCircle className="mt-1 h-3 w-3" /> : isDone && !isExtension && !stBuffer && !spkEnd ? <CheckCircle2 className="mt-1 h-3 w-3" /> : checkpoint ? <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isExtension ? "bg-amber-700" : stBuffer ? "bg-white" : spkEnd ? "bg-amber-300" : "bg-white"}`} /> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex max-h-[520px] overflow-hidden">
                <div className="shrink-0 overflow-y-auto overflow-x-hidden border-r-[3px] border-slate-400 bg-white shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)]" id="unified-gantt-labels" style={{ width: labelWidth }} onScroll={(e) => {
                    const body = document.getElementById("unified-gantt-scroll-body");
                    if (body && body.scrollTop !== e.currentTarget.scrollTop) body.scrollTop = e.currentTarget.scrollTop;
                }}>
                    {details.map((scope) => (
                        <React.Fragment key={scope.id_toko}>
                            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-2 sm:px-4 text-xs font-black text-slate-800 overflow-hidden" style={{ height: GROUP_HEIGHT }}>
                                <span className="flex items-center gap-1.5 min-w-0 truncate"><Building2 className={`h-3.5 w-3.5 shrink-0 ${scope.scopeName === "SIPIL" ? "text-red-600" : "text-blue-600"}`} /> {scope.scopeName}</span>
                                <span className="text-[10px] text-slate-500 shrink-0 hidden sm:inline ml-1">#{scope.ganttId || "-"}</span>
                            </div>
                            {scope.rows.map((row, index) => (
                                <div key={row.id} className="flex items-center border-b border-slate-100 px-2 sm:px-4 text-[11px] font-bold text-slate-700 overflow-hidden" style={{ height: ROW_HEIGHT }}>
                                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                                    <span className="truncate" title={row.label}>{row.label}</span>
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
                            return (
                                <div
                                    key={fullDate}
                                    className={`absolute top-0 bottom-0 border-r ${
                                        isExtension
                                            ? "bg-amber-50/70 border-amber-200 shadow-[inset_0_3px_0_#f59e0b]"
                                            : stBuffer?.isTarget
                                                ? "bg-teal-100/80 border-teal-300 shadow-[inset_0_3px_0_#0f766e]"
                                                : spkEnd
                                                    ? "bg-slate-100/90 border-slate-300 shadow-[inset_0_3px_0_#f59e0b]"
                                                    : stBuffer
                                                        ? "bg-teal-50/60 border-teal-100"
                                                        : checkpoint
                                                            ? "bg-blue-50/70 border-blue-200"
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
