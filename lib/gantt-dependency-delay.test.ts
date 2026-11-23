import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftDependencyRows } from './gantt-dependency-delay';

const row = (taskId: number, start: number, end: number, delay: number, dependencies: number[] = []) => ({
    taskId, dependencies, bars: [{ start, end, duration: end - start + 1, delay }],
});

test('three recorded delay days shift the dependent blue bar and preserve original data', () => {
    const original = [row(1, 1, 5, 3, [2]), row(2, 6, 9, 0)];
    const output = shiftDependencyRows(original);
    assert.deepEqual(output[1].bars[0], { start: 9, end: 12, duration: 4, delay: 0, waitingStart: 6, waitingDays: 3 });
    assert.equal(output[0].bars[0].delay, 3);
    assert.equal(original[1].bars[0].start, 6);
});

test('no delay means no shift; unrelated rows and scopes remain independent', () => {
    assert.equal(shiftDependencyRows([row(1, 1, 5, 0, [2]), row(2, 6, 9, 0)])[1].bars[0].waitingDays, 0);
    assert.equal(shiftDependencyRows([row(2, 6, 9, 0)])[0].bars[0].start, 6);
});

test('direct delays only, irrespective of row order; no recursive propagation', () => {
    const output = shiftDependencyRows([row(3, 10, 11, 0), row(2, 6, 9, 0, [3]), row(1, 1, 5, 3, [2])]);
    assert.equal(output[0].bars[0].waitingDays, 0);
    assert.equal(output[1].bars[0].waitingDays, 3);
});

test('multiple ranges preserve duration and use maximum recorded delay without adding duplicates', () => {
    const source = row(1, 1, 3, 3, [2, 2]);
    source.bars.push({ start: 6, end: 8, duration: 3, delay: 1 });
    const target = row(2, 4, 5, 2);
    target.bars.push({ start: 9, end: 10, duration: 2, delay: 0 });
    const bars = shiftDependencyRows([source, target])[1].bars;
    assert.deepEqual(bars.map(bar => [bar.start, bar.end, bar.duration, bar.delay]), [[7, 8, 2, 2], [12, 13, 2, 0]]);
});
