import { describe, it, expect } from 'vitest';
import { calculateAbsoluteWeek, getWeekDates, getWeeksToAdvance } from '../../src/lib/dateUtils';

// ============================================
// calculateAbsoluteWeek
// ============================================

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

    it('returns Week 1 if the reference date is before the start date', () => {
        const ref = new Date('2026-02-10T12:00:00');
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(1);
    });

    it('returns Week 5 on the 29th day since start', () => {
        const ref = new Date('2026-03-16T12:00:00'); // 4 weeks later
        expect(calculateAbsoluteWeek(programStart, ref)).toBe(5);
    });

    it('handles Date objects as start date', () => {
        const startObj = new Date('2026-02-16T00:00:00');
        const ref = new Date('2026-02-16T12:00:00');
        expect(calculateAbsoluteWeek(startObj, ref)).toBe(1);
    });

    // TIMESTAMPTZ regression tests — Supabase returns ISO timestamps, not plain dates
    it('handles TIMESTAMPTZ string (2026-02-16T00:00:00+00:00) same as plain date', () => {
        const tsStart = '2026-02-16T00:00:00+00:00';
        const ref = new Date('2026-02-16T12:00:00');
        expect(calculateAbsoluteWeek(tsStart, ref)).toBe(1);
    });

    it('handles TIMESTAMPTZ string on week 2', () => {
        const tsStart = '2026-02-16T00:00:00+00:00';
        const ref = new Date('2026-02-23T12:00:00');
        expect(calculateAbsoluteWeek(tsStart, ref)).toBe(2);
    });

    it('handles UTC timestamp with Z suffix', () => {
        const tsStart = '2026-02-16T00:00:00Z';
        const ref = new Date('2026-02-16T12:00:00');
        expect(calculateAbsoluteWeek(tsStart, ref)).toBe(1);
    });

    it('does not produce NaN for TIMESTAMPTZ input', () => {
        const result = calculateAbsoluteWeek('2026-03-04T00:00:00+00:00');
        expect(result).not.toBeNaN();
        expect(result).toBeGreaterThanOrEqual(1);
    });
});

// ============================================
// getWeekDates
// ============================================

describe('getWeekDates', () => {
    it('returns correct start date for week 1', () => {
        const { start } = getWeekDates(1, '2026-02-16');
        expect(start.getFullYear()).toBe(2026);
        expect(start.getMonth()).toBe(1); // February = 1
        expect(start.getDate()).toBe(16);
    });

    it('returns correct start date for week 2', () => {
        const { start } = getWeekDates(2, '2026-02-16');
        expect(start.getDate()).toBe(23);
    });

    it('end date is 6 days after start', () => {
        const { start, end } = getWeekDates(1, '2026-02-16');
        const diff = (end.getTime() - start.getTime()) / 86_400_000;
        expect(diff).toBe(6);
    });

    it('days array has 7 entries', () => {
        const { days } = getWeekDates(1, '2026-02-16');
        expect(days).toHaveLength(7);
    });

    it('handles TIMESTAMPTZ start date without producing Invalid Date', () => {
        const { start } = getWeekDates(1, '2026-02-16T00:00:00+00:00');
        // Only verify it parses to a valid date — exact local date depends on host timezone
        expect(isNaN(start.getTime())).toBe(false);
        expect(start.getFullYear()).toBe(2026);
    });
});

// ============================================
// getWeeksToAdvance
// ============================================

describe('getWeeksToAdvance', () => {
    it('returns 0 when week started today', () => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        expect(getWeeksToAdvance(todayStr)).toBe(0);
    });

    it('returns 1 when week started 8 days ago', () => {
        const d = new Date();
        d.setDate(d.getDate() - 8);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        expect(getWeeksToAdvance(str)).toBe(1);
    });

    it('returns 2 when week started 15 days ago', () => {
        const d = new Date();
        d.setDate(d.getDate() - 15);
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        expect(getWeeksToAdvance(str)).toBe(2);
    });

    it('handles TIMESTAMPTZ without NaN', () => {
        const result = getWeeksToAdvance('2026-02-16T00:00:00+00:00');
        expect(result).not.toBeNaN();
        expect(result).toBeGreaterThanOrEqual(0);
    });
});
