"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { fetchGanttList, fetchGanttDetail, fetchGanttDetailByToko } from '@/lib/api';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { SupervisionCheckpoint } from '@/lib/api';
import { calculateEffectiveStDate } from '@/lib/gantt-calculator';

const SUPERVISION_RULES: Record<number, number[]> = {
    10: [2, 5, 8, 10], 14: [2, 7, 10, 14], 20: [2, 12, 16, 20],
    30: [2, 7, 14, 18, 23, 30], 35: [2, 7, 17, 22, 28, 35],
    40: [2, 7, 17, 25, 33, 40], 48: [2, 10, 25, 32, 41, 48]
};

const DAY_WIDTH = 40;
const ROW_HEIGHT = 50;

function parseDateDDMMYYYY(dateStr: string) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
}

function formatHeaderDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
}

function formatFullDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

export default function GanttViewer({ nomorUlok, idToko, spkStartDate, spkDuration, spkEffectiveDuration, spkOriginalDuration, title, checkpoints = [], onCheckpointClick, hideChartTitle = false, hideDateHeader = false, timelineStartDate, timelineDuration, syncScrollGroup }: {
    nomorUlok: string;
    idToko?: number;
    spkStartDate?: string;          // ISO date string e.g. "2026-04-01T00:00:00" or "2026-04-01"
    spkDuration?: number;           // SPK duration in days (effective, used as main duration)
    spkEffectiveDuration?: number;  // Effective duration including approved extensions
    spkOriginalDuration?: number;   // Original SPK duration before extensions (for marker line)
    title?: string;
    checkpoints?: SupervisionCheckpoint[];
    onCheckpointClick?: (checkpoint: SupervisionCheckpoint, dayIndex: number) => void;
    hideChartTitle?: boolean;
    hideDateHeader?: boolean;
    timelineStartDate?: string;
    timelineDuration?: number;
    syncScrollGroup?: string;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [projectData, setProjectData] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const viewerId = useMemo(() => `gantt-viewer-${idToko || nomorUlok}`.replace(/[^a-zA-Z0-9_-]/g, '-'), [idToko, nomorUlok]);
    const checkpointByDate = useMemo(
        () => new Map(checkpoints.map((checkpoint) => [checkpoint.tanggal_pengawasan, checkpoint])),
        [checkpoints]
    );

    useEffect(() => {
        if (!nomorUlok && !idToko) return;
        
        setIsLoading(true);
        setErrorMsg('');
        
        const fetchPromise = idToko 
            ? fetchGanttDetailByToko(idToko).then((res: any) => {
                if (!res || !res.gantt_data) throw new Error("Gantt Chart belum dibuat untuk proyek ini.");
                return {
                    data: {
                        gantt: res.gantt_data,
                        toko: res.toko,
                        kategori_pekerjaan: res.kategori_pekerjaan,
                        day_items: res.day_gantt_data,
                        dependencies: res.dependency_data || [],
                        pengawasan: res.pengawasan_data || []
                    }
                };
            })
            : fetchGanttList({ nomor_ulok: nomorUlok })
                .then(res => {
                    const list = res.data || [];
                    if (list.length === 0) {
                        throw new Error("Gantt Chart belum dibuat untuk proyek ini.");
                    }
                    const ganttId = list[0].id;
                    return fetchGanttDetail(ganttId);
                });

        fetchPromise
            .then(detailRes => {
                if (!detailRes) return;
                const { gantt, toko, kategori_pekerjaan, day_items, dependencies, pengawasan } = detailRes.data;

                // Determine project start date
                let projectStart = new Date();
                if (gantt.timestamp) {
                    const parts = gantt.timestamp.split('T')[0].split('-');
                    if (parts.length === 3) projectStart = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }

                const msPerDay = 1000 * 60 * 60 * 24;

                // Helper: convert h_awal/h_akhir to day number
                // Supports both numeric ("1", "10") and date format ("01/04/2026")
                const toDayNumber = (val: string): number => {
                    if (!val) return NaN;
                    if (val.includes('/')) {
                        // Date format DD/MM/YYYY — convert to relative day from projectStart
                        const parsed = parseDateDDMMYYYY(val);
                        if (!parsed) return NaN;
                        const diff = Math.round((parsed.getTime() - projectStart.getTime()) / msPerDay);
                        return diff + 1; // Day 1-based
                    }
                    return parseInt(val);
                };

                const endDaysRaw = day_items.map((entry: any) => toDayNumber(entry.h_akhir)).filter((d: number) => !isNaN(d));
                const maxDay = endDaysRaw.length > 0 ? Math.max(...endDaysRaw) : 0;

                const duration = maxDay;

                const pengawasanDates = (pengawasan || []).map((p: any) => p.tanggal_pengawasan).filter(Boolean);

                let effectiveStartDate = projectStart;
                let effectiveDuration = duration;
                
                if (timelineStartDate) {
                    effectiveStartDate = new Date(timelineStartDate.split('T')[0] + 'T00:00:00');
                    if (timelineDuration && timelineDuration > 0) {
                        effectiveDuration = timelineDuration;
                    }
                } else if (spkStartDate) {
                    effectiveStartDate = new Date(spkStartDate.split('T')[0] + 'T00:00:00');
                    // Gunakan effective duration (termasuk pertambahan) jika tersedia
                    const activeDuration = spkEffectiveDuration || spkDuration;
                    if (activeDuration && activeDuration > 0) {
                        effectiveDuration = activeDuration;
                    }
                } else if (pengawasanDates.length > 0) {
                    // Fallback to earliest pengawasan date if SPK is missing, to avoid missing dots
                    const pDates = pengawasanDates.map((d: string) => {
                        const [dd, mm, yyyy] = d.split('/');
                        const fixedYyyy = yyyy.length === 2 ? `20${yyyy}` : yyyy;
                        return new Date(`${fixedYyyy}-${mm}-${dd}T00:00:00`);
                    }).filter((d: Date) => !isNaN(d.getTime()));
                    
                    if (pDates.length > 0) {
                        const minDate = new Date(Math.min(...pDates.map((d: Date) => d.getTime())));
                        const maxDate = new Date(Math.max(...pDates.map((d: Date) => d.getTime())));
                        
                        if (minDate < effectiveStartDate) {
                            effectiveStartDate = minDate;
                        }
                        
                        // Recalculate duration based on max pengawasan date if it exceeds current duration
                        const diffTime = Math.abs(maxDate.getTime() - effectiveStartDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (diffDays > effectiveDuration) {
                            effectiveDuration = diffDays;
                        }
                    }
                }

                const normalizeToSharedTimelineDay = (day: number): number => {
                    if (!timelineStartDate || !Number.isFinite(day)) return day;
                    const absoluteDate = new Date(projectStart);
                    absoluteDate.setDate(absoluteDate.getDate() + day - 1);
                    const diff = Math.round((absoluteDate.getTime() - effectiveStartDate.getTime()) / msPerDay);
                    return diff + 1;
                };

                const extensionDays = (spkEffectiveDuration && spkOriginalDuration && spkEffectiveDuration > spkOriginalDuration)
                    ? spkEffectiveDuration - spkOriginalDuration
                    : 0;
                const extensionStartDate = extensionDays > 0 ? new Date(effectiveStartDate) : null;
                if (extensionStartDate && spkOriginalDuration) {
                    extensionStartDate.setDate(extensionStartDate.getDate() + spkOriginalDuration);
                }
                const extensionEndDate = extensionDays > 0 ? new Date(effectiveStartDate) : null;
                if (extensionEndDate && spkEffectiveDuration) {
                    extensionEndDate.setDate(extensionEndDate.getDate() + spkEffectiveDuration - 1);
                }
                const spkEndDate = new Date(effectiveStartDate);
                spkEndDate.setDate(spkEndDate.getDate() + effectiveDuration - 1);
                const stInfo = calculateEffectiveStDate(spkEndDate);
                const stOffsetDays = timelineDuration ? 0 : stInfo.offsetDays;
                if (!timelineDuration && stOffsetDays > 0) {
                    effectiveDuration += stOffsetDays;
                }

                setProjectData({
                    duration: effectiveDuration,
                    startDate: effectiveStartDate.toISOString().split('T')[0],
                    useSpkDates: !!(spkStartDate && (spkEffectiveDuration || spkDuration) && (spkEffectiveDuration || spkDuration)! > 0),
                    spkStartDateObj: effectiveStartDate,
                    pengawasanDates,
                    // Data marker pertambahan SPK
                    originalSpkDays: spkOriginalDuration || spkDuration || 0,
                    hasExtension: !!(spkEffectiveDuration && spkOriginalDuration && spkEffectiveDuration > spkOriginalDuration),
                    extensionDays,
                    extensionStartLabel: extensionStartDate ? formatFullDate(extensionStartDate) : '',
                    extensionEndLabel: extensionEndDate ? formatFullDate(extensionEndDate) : '',
                    stBufferStartDay: (spkEffectiveDuration || spkDuration || 0) + 1,
                    stBufferDays: stOffsetDays,
                    stBufferLabel: stInfo.label,
                    stBufferOffsetDays: stInfo.offsetDays,
                    stBufferExplanation: stInfo.explanation,
                });

                let generatedTasks: any[] = kategori_pekerjaan.map((k: any, idx: number) => ({
                    id: idx + 1, name: k.kategori_pekerjaan, dependencies: [], ranges: [], keterlambatan: 0
                }));

                const categoryRangesMap: Record<string, any[]> = {};
                day_items.forEach((entry: any) => {
                    const startDay = normalizeToSharedTimelineDay(toDayNumber(entry.h_awal));
                    const endDay   = normalizeToSharedTimelineDay(toDayNumber(entry.h_akhir));
                    
                    if (!isNaN(startDay) && !isNaN(endDay)) {
                        const key = entry.kategori_pekerjaan.toLowerCase().trim();
                        if (!categoryRangesMap[key]) categoryRangesMap[key] = [];
                        categoryRangesMap[key].push({
                            start:         startDay,
                            end:           endDay,
                            duration:      endDay - startDay + 1,
                            keterlambatan: parseInt(String(entry.keterlambatan || 0)),
                        });
                    }
                });

                const depMap: Record<string, string[]> = {};
                dependencies.forEach((dep: any) => {
                    const child  = dep.kategori_pekerjaan.toLowerCase().trim();
                    const parent = dep.kategori_pekerjaan_terikat.toLowerCase().trim();
                    if (!depMap[parent]) depMap[parent] = [];
                    depMap[parent].push(child);
                });

                generatedTasks = generatedTasks.map(task => {
                    const tName = task.name.toLowerCase().trim();
                    const matchedRanges = categoryRangesMap[tName]
                        ?? Object.entries(categoryRangesMap).find(([k]) => tName.includes(k) || k.includes(tName))?.[1]
                        ?? [];

                    const childIds: number[] = [];
                    (depMap[tName] || []).forEach(childName => {
                        const childObj = generatedTasks.find(t => t.name.toLowerCase().trim() === childName);
                        if (childObj) childIds.push(childObj.id);
                    });

                    return {
                        ...task,
                        ranges:       matchedRanges.length > 0 ? matchedRanges : [{ start: '', end: '', keterlambatan: 0 }],
                        dependencies: childIds,
                    };
                });

                setTasks(generatedTasks);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('GanttViewer error:', err);
                setErrorMsg(err?.message || "Gagal memuat detail Gantt Chart.");
                setIsLoading(false);
            });
    }, [nomorUlok, idToko, spkStartDate, spkDuration, spkEffectiveDuration, spkOriginalDuration, timelineStartDate, timelineDuration]);

    const chartData = useMemo(() => {
        if (!projectData || tasks.length === 0) return null;
        let processedTasks = [...tasks];
        let maxTaskEndDay = 0;

        processedTasks.forEach(task => {
            let maxShift = 0;
            const myParents = processedTasks.filter(pt => pt.dependencies && pt.dependencies.includes(task.id));
            if (myParents.length > 0) {
                myParents.forEach(parentTask => {
                    const parentShift = parentTask.computed?.shift || 0;
                    const pRanges = parentTask.ranges || [];
                    const parentDelay = pRanges.length > 0 ? (parseInt(pRanges[pRanges.length-1].keterlambatan) || 0) : 0;
                    const potentialShift = parentShift + parentDelay;
                    if (potentialShift > maxShift) maxShift = potentialShift;
                });
            }
            
            task.computed = { shift: maxShift };

            const ranges = task.ranges || [];
            if (ranges.length > 0 && ranges[0].start) {
                ranges.forEach((r: any) => {
                    const endVal = parseInt(r.end || 0) + maxShift + (parseInt(r.keterlambatan) || 0);
                    if(endVal > maxTaskEndDay) maxTaskEndDay = endVal;
                });
            }
        });

        let totalDaysToRender = Math.max(projectData.duration, maxTaskEndDay);
        const totalChartWidth = totalDaysToRender * DAY_WIDTH;
        const svgHeight = processedTasks.length * ROW_HEIGHT;
        
        let taskCoordinates: Record<number, any> = {};
        processedTasks.forEach((task, idx) => {
            const shift = task.computed.shift || 0;
            const ranges = task.ranges || [];
            if(ranges.length > 0 && ranges[0].start) {
                const maxEnd = Math.max(...ranges.map((r:any) => parseInt(r.end || 0) + shift + (parseInt(r.keterlambatan) || 0)));
                const minStart = Math.min(...ranges.map((r:any) => parseInt(r.start || 0) + shift));
                
                let firstPeriodEnd = maxEnd;
                let lowestStart = Infinity;
                ranges.forEach((r: any) => {
                    const s = parseInt(r.start || 0) + shift;
                    if (s < lowestStart) {
                        lowestStart = s;
                        firstPeriodEnd = parseInt(r.end || 0) + shift + (parseInt(r.keterlambatan) || 0);
                    }
                });

                taskCoordinates[task.id] = {
                    centerY: (idx * ROW_HEIGHT) + (ROW_HEIGHT / 2),
                    endX: maxEnd * DAY_WIDTH,
                    startX: (minStart - 1) * DAY_WIDTH,
                    firstEndX: firstPeriodEnd * DAY_WIDTH
                };
            }
        });

        let svgLines: any[] = [];
        for (let i=0; i < processedTasks.length; i++) {
            const task = processedTasks[i];
            if(task.dependencies && task.dependencies.length > 0) {
                for (let cId of task.dependencies) {
                    const parentCoordinates = taskCoordinates[task.id];
                    const childCoordinates = taskCoordinates[cId];
                    if(parentCoordinates && childCoordinates && parentCoordinates.firstEndX !== undefined && childCoordinates.startX !== undefined) {
                        const startX = parentCoordinates.firstEndX, startY = parentCoordinates.centerY;
                        const endX = childCoordinates.startX, endY = childCoordinates.centerY;
                        let tension = (endX - startX) < 40 ? 60 : 40;
                        if ((endX - startX) < 0) tension = 100;
                        const path = `M ${startX} ${startY} C ${startX + tension} ${startY}, ${endX - tension} ${endY}, ${endX} ${endY}`;
                        svgLines.push(
                            <g key={`${task.id}-${cId}`}>
                                <path d={path} className="dependency-line stroke-blue-500 fill-transparent stroke-2" markerEnd="url(#depArrow)" opacity="0.95" />
                                <circle cx={startX} cy={startY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                                <circle cx={endX} cy={endY} r="4" className="fill-white stroke-blue-500 stroke-2" />
                            </g>
                        );
                    }
                }
            }
        }

        let liveDayIndex = -1;
        if (projectData?.spkStartDateObj) {
            const today = new Date();
            const td = String(today.getDate()).padStart(2, '0');
            const tm = String(today.getMonth() + 1).padStart(2, '0');
            const ty = today.getFullYear();
            
            for (let i = 0; i < totalDaysToRender; i++) {
                const d = new Date(projectData.spkStartDateObj);
                d.setDate(d.getDate() + i);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                if (dd === td && mm === tm && yyyy === ty) {
                    liveDayIndex = i;
                    break;
                }
            }
        }

        return { processedTasks, totalDaysToRender, totalChartWidth, svgHeight, svgLines, liveDayIndex };
    }, [tasks, projectData]);

    if (isLoading) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    if (errorMsg) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">{errorMsg}</p>
            </div>
        );
    }

    if (!chartData) return null;

    const { processedTasks, totalDaysToRender, totalChartWidth, svgHeight, svgLines, liveDayIndex } = chartData;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs">
            {!hideChartTitle && (
                <div className="p-4 bg-slate-100 border-b flex justify-between items-center text-sm">
                    <div>
                        <h3 className="font-bold text-slate-800">{title || 'Visualisasi Gantt Chart'}</h3>
                        <p className="text-xs text-slate-500">Jadwal yang telah direncanakan oleh Kontraktor.</p>
                    </div>
                </div>
            )}
            <div className="flex border-b overflow-hidden relative" style={{ maxHeight: "400px" }}>
                <div className="w-1/3 min-w-50 border-r-[3px] border-slate-400 bg-white z-40 sticky left-0 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)] flex flex-col">
                    {!hideDateHeader && (
                        <div className="h-10 bg-slate-50 border-b-2 border-slate-300 flex items-center px-4 font-bold text-slate-600">
                            Tahapan Pekerjaan
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar" id={`${viewerId}-left`} onScroll={(e) => {
                        const rightPane = document.getElementById(`${viewerId}-right`);
                        if (rightPane) rightPane.scrollTop = e.currentTarget.scrollTop;
                    }}>
                        {processedTasks.map((task) => (
                            <div key={task.id} className="border-b border-slate-100 flex flex-col justify-center px-4" style={{ height: ROW_HEIGHT }}>
                                <div className="font-semibold text-slate-800 truncate" title={task.name}>{task.id}. {task.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="w-2/3 flex-1 overflow-auto bg-grid-pattern relative pb-6"
                    id={`${viewerId}-right`}
                    data-gantt-sync={syncScrollGroup || undefined}
                    onScroll={(e) => {
                        const leftPane = document.getElementById(`${viewerId}-left`);
                        if (leftPane) leftPane.scrollTop = e.currentTarget.scrollTop;
                        if (syncScrollGroup) {
                            document.querySelectorAll<HTMLElement>(`[data-gantt-sync="${syncScrollGroup}"]`).forEach((el) => {
                                if (el !== e.currentTarget && el.scrollLeft !== e.currentTarget.scrollLeft) {
                                    el.scrollLeft = e.currentTarget.scrollLeft;
                                }
                            });
                        }
                    }}
                >
                    {!hideDateHeader && (
                        <div className="h-10 border-b-2 border-slate-300 flex sticky top-0 bg-white z-30" style={{ minWidth: totalChartWidth }}>
                            {Array.from({ length: totalDaysToRender }).map((_, i) => {
                            let label: string = String(i + 1);
                            let isPengawasan = false;
                            let isLiveDay = false;
                            let fullDateString = '';
                            // Apakah kolom ini bagian dari hari pertambahan SPK?
                            const isExtensionDay = !!(projectData?.hasExtension
                                && projectData?.originalSpkDays > 0
                                && (i + 1) > projectData.originalSpkDays
                                && (i + 1) <= (projectData.originalSpkDays + projectData.extensionDays)
                            );
                            const isStBufferDay = !!(projectData?.stBufferDays > 0
                                && (i + 1) >= projectData.stBufferStartDay
                                && (i + 1) < projectData.stBufferStartDay + projectData.stBufferDays
                            );
                            const isSpkEndDay = !!(projectData?.stBufferDays > 0
                                && projectData?.stBufferStartDay > 1
                                && (i + 1) === projectData.stBufferStartDay - 1
                            );
                            
                            if (projectData?.spkStartDateObj) {
                                const d = new Date(projectData.spkStartDateObj);
                                d.setDate(d.getDate() + i);
                                label = formatHeaderDate(d);
                                
                                const dd = String(d.getDate()).padStart(2, '0');
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const yyyy = d.getFullYear();
                                fullDateString = `${dd}/${mm}/${yyyy}`;
                                
                                const today = new Date();
                                const td = String(today.getDate()).padStart(2, '0');
                                const tm = String(today.getMonth() + 1).padStart(2, '0');
                                const ty = today.getFullYear();
                                
                                if (dd === td && mm === tm && yyyy === ty) {
                                    isLiveDay = true;
                                }
                                
                                if (projectData?.pengawasanDates?.includes(fullDateString)) {
                                    isPengawasan = true;
                                }
                            }
                            const checkpoint = checkpointByDate.get(fullDateString);
                            const readyCount = Number(checkpoint?.ready_opname_items || 0);
                            const opnameCount = Number(checkpoint?.opname_items || 0);
                            const isReadyOpname = readyCount > 0;
                            const isAlreadyOpname = !isReadyOpname && opnameCount > 0;
                            const isClickable = Boolean(checkpoint && onCheckpointClick);

                            // Tentukan kelas warna: prioritas dari atas ke bawah
                            let colClass = '';
                            if (isReadyOpname) {
                                colClass = 'relative bg-red-50 text-red-700 ring-2 ring-inset ring-red-400 cursor-pointer hover:bg-red-100';
                            } else if (isExtensionDay) {
                                colClass = `relative bg-amber-50 text-amber-900 border-amber-300 shadow-[inset_0_3px_0_#f59e0b] ${isClickable ? 'cursor-pointer hover:bg-amber-100' : ''}`;
                            } else if (isStBufferDay) {
                                const isStTargetDay = (i + 1) === projectData.stBufferStartDay + projectData.stBufferDays - 1;
                                colClass = isStTargetDay
                                    ? `relative bg-teal-700 text-white border-teal-800 shadow-[inset_0_3px_0_#134e4a] ${isClickable ? 'cursor-pointer hover:bg-teal-600' : ''}`
                                    : `relative bg-teal-50 text-teal-900 border-teal-100 shadow-[inset_0_3px_0_#99f6e4] ${isClickable ? 'cursor-pointer hover:bg-teal-100' : ''}`;
                            } else if (isSpkEndDay) {
                                colClass = `relative bg-slate-800 text-white border-slate-700 shadow-[inset_0_3px_0_#f59e0b] ${isClickable ? 'cursor-pointer hover:bg-slate-700' : ''}`;
                            } else if (isAlreadyOpname) {
                                colClass = 'bg-emerald-50 text-emerald-700 cursor-pointer';
                            } else if (isLiveDay) {
                                colClass = 'bg-green-50 text-green-700';
                            } else if (isPengawasan) {
                                colClass = 'bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100';
                            } else {
                                colClass = 'bg-slate-50 text-slate-500';
                            }

                            return (
                                <button
                                    type="button"
                                    key={i}
                                    disabled={!isClickable}
                                    onClick={() => checkpoint && onCheckpointClick?.(checkpoint, i)}
                                    className={`shrink-0 flex flex-col items-center justify-center border-r-2 border-slate-300 font-bold py-0.75 ${colClass}`}
                                    style={{ width: DAY_WIDTH, fontSize: projectData?.spkStartDateObj ? '9px' : undefined }}
                                    title={isReadyOpname
                                        ? `${readyCount} pekerjaan siap Opname`
                                        : isAlreadyOpname
                                            ? 'Pekerjaan sudah masuk Opname'
                                            : isExtensionDay
                                                ? (isSpkEndDay ? 'Akhir SPK' : `Pertambahan SPK +${projectData.extensionDays} hari`)
                                                : isStBufferDay
                                                    ? projectData.stBufferExplanation
                                                    : isSpkEndDay
                                                        ? 'Akhir SPK'
                                                    : isPengawasan
                                                        ? 'Buka checkpoint pengawasan'
                                                        : undefined}
                                >
                                    <span className={isExtensionDay || isStBufferDay || isSpkEndDay ? 'leading-3' : undefined}>{label}</span>
                                    {isExtensionDay && (
                                        <span className="mt-0.5 rounded-sm bg-amber-200 px-1 text-[8px] font-extrabold leading-3 text-amber-950">
                                            {isSpkEndDay ? 'Akhir' : 'SPK+'}
                                        </span>
                                    )}
                                    {isStBufferDay && (
                                        <span className={`mt-0.5 whitespace-nowrap rounded-sm px-1 text-[8px] font-extrabold leading-3 ${(i + 1) === projectData.stBufferStartDay + projectData.stBufferDays - 1 ? 'bg-white text-teal-800' : 'bg-teal-100 text-teal-800'}`}>
                                            {(i + 1) === projectData.stBufferStartDay + projectData.stBufferDays - 1
                                                ? (Number(projectData.stBufferOffsetDays || 0) > 1 ? String(projectData.stBufferLabel || '').replace(' hari', '') : 'ST')
                                                : `SPK +${(i + 1) - projectData.stBufferStartDay + 1}`}
                                        </span>
                                    )}
                                    {isSpkEndDay && !isExtensionDay && (
                                        <span className="mt-0.5 rounded-sm bg-amber-300 px-1 text-[8px] font-extrabold leading-3 text-slate-950">
                                            Akhir
                                        </span>
                                    )}
                                    {isReadyOpname ? (
                                        <span className="mt-0.5 flex items-center">
                                            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500 absolute" />
                                            <AlertCircle className="relative h-3 w-3 text-red-600" />
                                        </span>
                                    ) : isAlreadyOpname ? (
                                        <CheckCircle2 className="mt-0.5 h-3 w-3 text-emerald-600" />
                                    ) : isPengawasan ? (
                                        <div className={`w-1.5 h-1.5 rounded-full ${isExtensionDay ? 'mt-0.5 bg-amber-700' : isStBufferDay ? 'mt-0.5 bg-teal-700' : 'mt-1 bg-blue-500'}`} title="Hari Pengawasan" />
                                    ) : isExtensionDay ? (
                                        null
                                    ) : null}
                                    {isLiveDay && !isPengawasan && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isExtensionDay ? 'bg-amber-600' : isStBufferDay ? 'bg-teal-700' : 'bg-green-500'}`} title="Hari Ini" />}
                                </button>
                            );
                            })}
                        </div>
                    )}

                    <div className="relative" style={{ width: totalChartWidth, height: svgHeight }}>
                        {/* Kolom hijau samar Live Day */}
                        {liveDayIndex !== -1 && (
                            <div 
                                className="absolute top-0 bottom-0 pointer-events-none"
                                style={{ left: liveDayIndex * DAY_WIDTH, width: DAY_WIDTH, zIndex: 5, backgroundColor: 'rgba(34, 197, 94, 0.08)' }} 
                            />
                        )}
                        {/* Garis Lurus Live Day ke Bawah */}
                        {liveDayIndex !== -1 && (
                            <div 
                                className="absolute top-0 bottom-0 pointer-events-none"
                                style={{ left: (liveDayIndex * DAY_WIDTH) + (DAY_WIDTH / 2), width: 2, zIndex: 16, backgroundColor: 'rgba(34, 197, 94, 0.7)' }} 
                            />
                        )}

                        {/* Area latar belakang amber untuk hari-hari pertambahan SPK */}
                        {projectData?.hasExtension && projectData.originalSpkDays > 0 && (
                            <div
                                className="absolute top-0 bottom-0 pointer-events-none"
                                style={{
                                    left: projectData.originalSpkDays * DAY_WIDTH,
                                    width: projectData.extensionDays * DAY_WIDTH,
                                    zIndex: 1,
                                    backgroundColor: 'rgba(251, 191, 36, 0.06)',
                                }}
                            />
                        )}
                        {projectData?.hasExtension && projectData.originalSpkDays > 0 && projectData.extensionDays >= 2 && (
                            <div
                                className="absolute top-1 z-[17] pointer-events-none flex h-6 items-center rounded border border-amber-200 bg-amber-50/95 px-2 text-[10px] font-semibold text-amber-900 shadow-sm"
                                style={{
                                    left: projectData.originalSpkDays * DAY_WIDTH + 4,
                                    maxWidth: Math.max(0, projectData.extensionDays * DAY_WIDTH - 8),
                                }}
                                title={`Perpanjangan SPK: ${projectData.extensionStartLabel} - ${projectData.extensionEndLabel}`}
                            >
                                <span className="truncate">
                                    Perpanjangan SPK: {projectData.extensionStartLabel} - {projectData.extensionEndLabel}
                                </span>
                            </div>
                        )}
                        {projectData?.stBufferDays > 0 && (
                            <div
                                className="absolute top-0 bottom-0 pointer-events-none"
                                style={{
                                    left: (projectData.stBufferStartDay - 1) * DAY_WIDTH,
                                    width: projectData.stBufferDays * DAY_WIDTH,
                                    zIndex: 2,
                                    backgroundColor: 'rgba(15, 118, 110, 0.07)',
                                    boxShadow: 'inset 0 3px 0 #0f766e',
                                }}
                                title={projectData.stBufferExplanation}
                            />
                        )}
                        {projectData?.stBufferDays > 0 && (
                            <div
                                className="absolute top-8 z-[17] pointer-events-none flex h-6 items-center rounded border border-teal-200 bg-white/95 px-2 text-[10px] font-semibold text-teal-900 shadow-sm"
                                style={{
                                    left: (projectData.stBufferStartDay - 1) * DAY_WIDTH + 4,
                                    maxWidth: Math.max(0, projectData.stBufferDays * DAY_WIDTH - 8),
                                }}
                                title={projectData.stBufferExplanation}
                            >
                                <span className="truncate">{projectData.stBufferExplanation}</span>
                            </div>
                        )}
                        {/* Garis vertikal putus-putus penanda batas SPK original */}
                        {projectData?.hasExtension && projectData.originalSpkDays > 0 && (
                            <div
                                className="absolute top-0 bottom-0 pointer-events-none"
                                title={`Akhir SPK original (hari ke-${projectData.originalSpkDays})`}
                                style={{
                                    left: projectData.originalSpkDays * DAY_WIDTH - 1,
                                    width: 2,
                                    zIndex: 15,
                                    backgroundImage: 'repeating-linear-gradient(to bottom, #d97706 0px, #d97706 6px, transparent 6px, transparent 12px)',
                                }}
                            />
                        )}

                        {Array.from({ length: totalDaysToRender }).map((_, i) => (
                            <div key={`col-${i}`} className="absolute top-0 bottom-0 border-r border-slate-200 z-0 pointer-events-none" style={{ left: (i + 1) * DAY_WIDTH, width: 1 }} />
                        ))}
                        
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible">
                            <defs>
                                <marker id="depArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                                </marker>
                            </defs>
                            {svgLines}
                        </svg>

                        {processedTasks.map((task, rowIdx) => {
                            const shift = task.computed?.shift || 0;
                            const tRanges = task.ranges || [];
                            if (tRanges.length === 0 || !tRanges[0].start) return null;

                            return (
                                <div key={`row-${task.id}`} className="absolute left-0 right-0 border-b border-slate-100 z-10" style={{ top: rowIdx * ROW_HEIGHT, height: ROW_HEIGHT }}>
                                    {tRanges.map((r: any, rIdx: number) => {
                                        if (!r.start || !r.end) return null;
                                        const rStart = parseInt(r.start);
                                        const rEnd = parseInt(r.end);
                                        const bStart = rStart + shift;
                                        const bEnd = rEnd + shift + parseInt(r.keterlambatan || 0);
                                        const leftPos = (bStart - 1) * DAY_WIDTH;
                                        const blockWidth = (bEnd - bStart + 1) * DAY_WIDTH;

                                        return (
                                            <div
                                                key={`block-${task.id}-${rIdx}`}
                                                className="absolute border border-blue-500 rounded-md shadow-sm transition-all group overflow-hidden bg-blue-100 flex items-center justify-center cursor-default"
                                                style={{ left: leftPos, width: blockWidth, top: 8, height: ROW_HEIGHT - 16 }}
                                            >
                                                <div className="absolute inset-0 bg-blue-600 opacity-20"></div>
                                                <div className="relative z-10 font-bold text-[10px] text-blue-800 tracking-wider">
                                                    {bEnd - bStart + 1} Hari
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .bg-grid-pattern {
                    background-image: linear-gradient(to right, #f8fafc 1px, transparent 1px);
                    background-size: 40px 100%;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            {(projectData?.hasExtension || projectData?.stBufferDays > 0) && (
                <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-500 bg-slate-50/50">
                    {projectData?.hasExtension && (
                        <>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(251,191,36,0.35)', border: '1px solid #d97706' }} />
                                Pertambahan SPK +{projectData.extensionDays} hari
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block" style={{ width: 2, height: 12, backgroundImage: 'repeating-linear-gradient(to bottom, #d97706 0px, #d97706 4px, transparent 4px, transparent 8px)' }} />
                                Batas SPK asli
                            </span>
                        </>
                    )}
                    {projectData?.stBufferDays > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded-sm border border-teal-700 bg-slate-100" />
                            Target ST{Number(projectData.stBufferOffsetDays || 0) > 1 ? ` ${projectData.stBufferLabel}` : ''}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500 opacity-70" />
                        Hari ini
                    </span>
                </div>
            )}
        </div>
    );
}
