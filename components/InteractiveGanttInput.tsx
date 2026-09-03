"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, GripHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface TaskRange {
    start: string | number;
    end: string | number;
    keterlambatan: number;
}

interface Task {
    id: number;
    name: string;
    scope?: string;
    dependencies: number[];
    ranges: TaskRange[];
    keterlambatan: number;
}

interface InteractiveGanttInputProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    isReadOnly: boolean;
    maxDays?: number;
}

const CELL_WIDTH = 40;
const ROW_HEIGHT = 44;

export default function InteractiveGanttInput({ tasks, setTasks, isReadOnly, maxDays = 90 }: InteractiveGanttInputProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{
        taskId: number;
        startDay: number;
        currentDay: number;
        isDragging: boolean;
    } | null>(null);

    const [dependencyModal, setDependencyModal] = useState<{
        isOpen: boolean;
        taskId: number | null;
        selectedDependency: number | null;
    }>({
        isOpen: false,
        taskId: null,
        selectedDependency: null
    });

    const scopes = Array.from(new Set(tasks.map(t => t.scope || 'SIPIL')));

    // Calculate maximum duration to show based on existing tasks and default maxDays
    const highestDay = useMemo(() => {
        let max = 20; // Default minimum grid size
        tasks.forEach(t => {
            t.ranges.forEach(r => {
                if (r.end && Number(r.end) > max) max = Number(r.end);
            });
        });
        return Math.max(maxDays, max + 5);
    }, [tasks, maxDays]);

    const daysArray = Array.from({ length: highestDay }, (_, i) => i + 1);

    const handleMouseDown = (e: React.MouseEvent, taskId: number, day: number) => {
        if (isReadOnly) return;
        setDragState({
            taskId,
            startDay: day,
            currentDay: day,
            isDragging: true
        });
    };

    const handleMouseEnter = (day: number) => {
        if (!dragState || !dragState.isDragging) return;
        setDragState(prev => prev ? { ...prev, currentDay: day } : null);
    };

    const handleMouseUp = () => {
        if (!dragState || !dragState.isDragging) return;

        const { taskId, startDay, currentDay } = dragState;
        const actualStart = Math.min(startDay, currentDay);
        const actualEnd = Math.max(startDay, currentDay);

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                // Filter out empty ranges before adding the new one
                const cleanRanges = t.ranges.filter(r => r.start !== '' && r.end !== '');
                
                // Add new range
                const newRanges = [...cleanRanges, { start: actualStart, end: actualEnd, keterlambatan: 0 }];
                
                // Merge overlapping ranges
                newRanges.sort((a, b) => Number(a.start) - Number(b.start));
                const mergedRanges: TaskRange[] = [];
                let current = newRanges[0];

                for (let i = 1; i < newRanges.length; i++) {
                    const next = newRanges[i];
                    if (Number(current.end) >= Number(next.start) - 1) { // Merge adjacent or overlapping
                        current.end = Math.max(Number(current.end), Number(next.end));
                    } else {
                        mergedRanges.push(current);
                        current = next;
                    }
                }
                mergedRanges.push(current);

                return { ...t, ranges: mergedRanges };
            }
            return t;
        }));

        setDragState(null);
        
        // Open dependency modal for the task
        const task = tasks.find(t => t.id === taskId);
        if (task && task.dependencies.length === 0) {
            setDependencyModal({
                isOpen: true,
                taskId: taskId,
                selectedDependency: null
            });
        }
    };

    const handleMouseLeave = () => {
        if (dragState && dragState.isDragging) {
            handleMouseUp();
        }
    };

    const handleDeleteRange = (taskId: number, rangeIndex: number) => {
        if (isReadOnly) return;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newRanges = t.ranges.filter((_, idx) => idx !== rangeIndex);
                if (newRanges.length === 0) {
                    newRanges.push({ start: '', end: '', keterlambatan: 0 }); // Fallback empty
                }
                return { ...t, ranges: newRanges };
            }
            return t;
        }));
    };

    const saveDependency = () => {
        if (dependencyModal.taskId && dependencyModal.selectedDependency !== null) {
            setTasks(prev => prev.map(t => {
                if (t.id === dependencyModal.taskId) {
                    return { ...t, dependencies: [dependencyModal.selectedDependency!] };
                }
                return t;
            }));
        }
        setDependencyModal({ isOpen: false, taskId: null, selectedDependency: null });
    };

    const getTaskScopeColor = (scope: string) => {
        return scope.toUpperCase() === 'SIPIL' ? 'bg-red-500' : 'bg-blue-500';
    };

    const getTaskRowBg = (scope: string) => {
        return scope.toUpperCase() === 'SIPIL' ? 'hover:bg-red-50/50' : 'hover:bg-blue-50/50';
    };

    const activeTask = tasks.find(t => t.id === dependencyModal.taskId);
    const availableDependencies = activeTask 
        ? tasks.filter(t => t.scope === activeTask.scope && t.id > activeTask.id) 
        : [];

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
            <div 
                className="overflow-x-auto relative" 
                ref={containerRef}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
            >
                <div className="inline-block min-w-full align-middle">
                    <table className="w-full border-collapse text-xs select-none relative" style={{ minWidth: 'max-content' }}>
                        <thead>
                            <tr className="bg-slate-50/80 border-b">
                                <th className="sticky left-0 z-20 bg-slate-50/90 backdrop-blur p-3 text-left font-bold text-slate-600 w-[300px] border-r shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                                    Tahapan Pekerjaan
                                </th>
                                {daysArray.map(day => (
                                    <th 
                                        key={day} 
                                        className="p-2 font-semibold text-slate-500 border-r border-slate-200 text-center"
                                        style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH }}
                                    >
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {scopes.map(scope => {
                                const scopeTasks = tasks.filter(t => (t.scope || 'SIPIL') === scope);
                                if (scopeTasks.length === 0) return null;

                                return (
                                    <React.Fragment key={scope}>
                                        <tr className="bg-slate-100/60 border-y border-slate-200">
                                            <td 
                                                colSpan={daysArray.length + 1} 
                                                className="sticky left-0 z-10 p-2 shadow-[1px_0_0_0_rgba(226,232,240,1)]"
                                            >
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className={`w-3 h-3 rounded-full ${getTaskScopeColor(scope)}`}></span>
                                                    <span className="font-bold text-slate-700 text-xs">Lingkup: {scope.toUpperCase()}</span>
                                                    <Badge variant="outline" className="ml-2 bg-white text-slate-500 font-semibold text-[10px] h-5">{scopeTasks.length} Item</Badge>
                                                </div>
                                            </td>
                                        </tr>

                                        {scopeTasks.map(task => {
                                            const depName = task.dependencies[0] ? scopeTasks.find(t => t.id === task.dependencies[0])?.name : null;
                                            
                                            return (
                                                <tr key={task.id} className={`border-b border-slate-100 ${getTaskRowBg(scope)} transition-colors`}>
                                                    <td className="sticky left-0 z-10 bg-white p-3 font-semibold text-slate-800 border-r shadow-[1px_0_0_0_rgba(226,232,240,1)] align-top group">
                                                        <div className="flex flex-col gap-1">
                                                            <span>{task.id}. {task.name}</span>
                                                            {depName && (
                                                                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center w-fit mt-1">
                                                                    <GripHorizontal className="w-3 h-3 mr-1" />
                                                                    Melanjutkan: {depName.substring(0, 20)}{depName.length > 20 ? '...' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {daysArray.map(day => {
                                                        const inRangeIndex = task.ranges.findIndex(r => r.start !== '' && r.end !== '' && day >= Number(r.start) && day <= Number(r.end));
                                                        const isStart = inRangeIndex >= 0 && day === Number(task.ranges[inRangeIndex].start);
                                                        const isEnd = inRangeIndex >= 0 && day === Number(task.ranges[inRangeIndex].end);
                                                        
                                                        let isDraggingThisDay = false;
                                                        let isDragStart = false;
                                                        let isDragEnd = false;

                                                        if (dragState && dragState.taskId === task.id) {
                                                            const actualStart = Math.min(dragState.startDay, dragState.currentDay);
                                                            const actualEnd = Math.max(dragState.startDay, dragState.currentDay);
                                                            isDraggingThisDay = day >= actualStart && day <= actualEnd;
                                                            isDragStart = day === actualStart;
                                                            isDragEnd = day === actualEnd;
                                                        }

                                                        const isActive = inRangeIndex >= 0 || isDraggingThisDay;
                                                        const isStartBlock = isStart || isDragStart;
                                                        const isEndBlock = isEnd || isDragEnd;

                                                        return (
                                                            <td 
                                                                key={day}
                                                                className={`border-r border-slate-200 relative p-0 m-0 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                                                                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH, height: ROW_HEIGHT }}
                                                                onMouseDown={(e) => handleMouseDown(e, task.id, day)}
                                                                onMouseEnter={() => handleMouseEnter(day)}
                                                            >
                                                                {isActive && (
                                                                    <div 
                                                                        className={`absolute top-2 bottom-2 ${scope === 'SIPIL' ? 'bg-red-500' : 'bg-blue-500'} ${isStartBlock ? 'left-1 rounded-l-md' : 'left-0'} ${isEndBlock ? 'right-1 rounded-r-md' : 'right-0'} z-0 shadow-sm opacity-90 transition-all`} 
                                                                    />
                                                                )}

                                                                {!isReadOnly && inRangeIndex >= 0 && isEnd && (!dragState || !dragState.isDragging) && (
                                                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 transition-opacity">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteRange(task.id, inRangeIndex); }}
                                                                            className="bg-white text-red-500 rounded p-0.5 shadow border border-red-100 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={dependencyModal.isOpen} onOpenChange={(open) => !open && setDependencyModal({ isOpen: false, taskId: null, selectedDependency: null })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tentukan Keterikatan Pekerjaan</DialogTitle>
                        <DialogDescription>
                            Pekerjaan <strong>{activeTask?.name}</strong> akan dilanjutkan ke tahapan apa?
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        {availableDependencies.length > 0 ? (
                            <select
                                className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                value={dependencyModal.selectedDependency || ''}
                                onChange={(e) => setDependencyModal(prev => ({ ...prev, selectedDependency: Number(e.target.value) || null }))}
                            >
                                <option value="">- Tidak Ada (Pekerjaan Terakhir) -</option>
                                {availableDependencies.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.id}. {opt.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-amber-800 text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Ini adalah tahapan terakhir di daftar. Tidak ada pekerjaan lanjutan yang tersedia.</p>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter className="sm:justify-between">
                        <Button type="button" variant="ghost" onClick={() => setDependencyModal({ isOpen: false, taskId: null, selectedDependency: null })}>
                            Lewati
                        </Button>
                        <Button type="button" onClick={saveDependency} className="bg-blue-600 hover:bg-blue-700">
                            Simpan Keterikatan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
