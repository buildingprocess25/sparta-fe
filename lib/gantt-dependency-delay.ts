export type DependencyRow = {
    taskId: number;
    dependencies: number[]; // Outgoing: categories that depend on this row.
    bars: Array<{ start: number; end: number; duration: number; delay: number }>;
};

/** Use only the source's recorded delay, never recursively propagate a shift. */
export function dependencyShifts(rows: DependencyRow[]): Map<number, number> {
    const shifts = new Map<number, number>();
    for (const row of rows) {
        const delay = Math.max(0, ...row.bars.map(bar => Number.isFinite(bar.delay) ? bar.delay : 0));
        for (const target of row.dependencies) {
            if (target !== row.taskId) shifts.set(target, Math.max(shifts.get(target) || 0, delay));
        }
    }
    return shifts;
}

export function shiftDependencyRows<T extends DependencyRow>(rows: T[]) {
    const shifts = dependencyShifts(rows);
    return rows.map(row => ({
        ...row,
        bars: row.bars.map(bar => ({
            ...bar,
            start: bar.start + (shifts.get(row.taskId) || 0),
            end: bar.end + (shifts.get(row.taskId) || 0),
            waitingStart: bar.start,
            waitingDays: shifts.get(row.taskId) || 0,
        })),
    }));
}
