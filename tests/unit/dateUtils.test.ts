import { describe, it, expect } from 'vitest';
import { calculateAbsoluteWeek } from '../../src/lib/dateUtils';

describe('calculateAbsoluteWeek', () => {
    const programStart = '2026-02-16'; // A Monday

    it('returns Week 1 on the start date', () => {
        const ref = new Date('2026-02-16T12:00:00');
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(1);
    });

    it('returns Week 1 on the Sunday of the first week', () => {
        const ref = new Date('2026-02-22T23:59:59');
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(1);
    });

    it('returns Week 2 on the following Monday', () => {
        const ref = new Date('2026-02-23T00:00:01');
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(2);
    });

    it('returns Week 1 if the reference date is in the past', () => {
        const ref = new Date('2026-02-10T12:00:00');
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(1);
    });

    it('returns Week 5 on the 29th day since start', () => {
        const ref = new Date('2026-03-16T12:00:00'); // 4 weeks later
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(5);
    });

    it('handles string vs Date objects correctly', () => {
        const startObj = new Date('2026-02-16T00:00:00');
        const ref = new Date('2026-02-16T12:00:00');
        expect(calculateAbsoluteWeek(startObj, ref)).toBe(1);
    });
});
