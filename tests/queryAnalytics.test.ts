/**
 * Query Analytics Tests
 * 
 * Tests for the query analytics logging module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    logToolCall,
    getAnalyticsSummary,
    getTypoPatterns,
    clearAnalytics,
} from '../src/lib/ai/queryAnalytics';

describe('Query Analytics Module', () => {
    beforeEach(() => {
        clearAnalytics();
    });

    describe('logToolCall', () => {
        it('logs a basic tool call', () => {
            logToolCall({
                toolName: 'getRecentLogs',
                exerciseName: 'squat',
            });

            const summary = getAnalyticsSummary();
            expect(summary.totalQueries).toBe(1);
            expect(summary.toolBreakdown['getRecentLogs']).toBe(1);
        });

        it('logs tool calls with normalized names', () => {
            logToolCall({
                toolName: 'getExercisePR',
                exerciseName: 'squirt',
                normalizedName: 'squat',
                wasCorrected: true,
            });

            const summary = getAnalyticsSummary();
            expect(summary.topExercises[0].name).toBe('squat');
        });

        it('tracks multiple tool calls', () => {
            logToolCall({ toolName: 'getRecentLogs', exerciseName: 'squat' });
            logToolCall({ toolName: 'getRecentLogs', exerciseName: 'deadlift' });
            logToolCall({ toolName: 'getExercisePR', exerciseName: 'bench' });

            const summary = getAnalyticsSummary();
            expect(summary.totalQueries).toBe(3);
            expect(summary.toolBreakdown['getRecentLogs']).toBe(2);
            expect(summary.toolBreakdown['getExercisePR']).toBe(1);
        });
    });

    describe('getAnalyticsSummary', () => {
        it('returns empty summary when no logs', () => {
            const summary = getAnalyticsSummary();
            expect(summary.totalQueries).toBe(0);
            expect(summary.correctionRate).toBe(0);
            expect(summary.topExercises).toHaveLength(0);
        });

        it('calculates correction rate correctly', () => {
            logToolCall({ toolName: 'test', exerciseName: 'a', wasCorrected: true });
            logToolCall({ toolName: 'test', exerciseName: 'b', wasCorrected: true });
            logToolCall({ toolName: 'test', exerciseName: 'c', wasCorrected: false });
            logToolCall({ toolName: 'test', exerciseName: 'd', wasCorrected: false });

            const summary = getAnalyticsSummary();
            expect(summary.correctionRate).toBe(0.5);
        });

        it('ranks exercises by count', () => {
            logToolCall({ toolName: 'test', normalizedName: 'squat' });
            logToolCall({ toolName: 'test', normalizedName: 'squat' });
            logToolCall({ toolName: 'test', normalizedName: 'squat' });
            logToolCall({ toolName: 'test', normalizedName: 'bench' });
            logToolCall({ toolName: 'test', normalizedName: 'bench' });
            logToolCall({ toolName: 'test', normalizedName: 'deadlift' });

            const summary = getAnalyticsSummary();
            expect(summary.topExercises[0].name).toBe('squat');
            expect(summary.topExercises[0].count).toBe(3);
            expect(summary.topExercises[1].name).toBe('bench');
            expect(summary.topExercises[1].count).toBe(2);
        });
    });

    describe('getTypoPatterns', () => {
        it('tracks typo patterns', () => {
            logToolCall({
                toolName: 'test',
                exerciseName: 'squirt',
                normalizedName: 'squat',
                wasCorrected: true,
            });
            logToolCall({
                toolName: 'test',
                exerciseName: 'squirt',
                normalizedName: 'squat',
                wasCorrected: true,
            });
            logToolCall({
                toolName: 'test',
                exerciseName: 'benchh',
                normalizedName: 'bench_press',
                wasCorrected: true,
            });

            const patterns = getTypoPatterns();
            expect(patterns.length).toBe(2);
            expect(patterns[0].original).toBe('squirt');
            expect(patterns[0].corrected).toBe('squat');
            expect(patterns[0].count).toBe(2);
        });

        it('returns empty array when no corrections', () => {
            logToolCall({ toolName: 'test', exerciseName: 'squat', wasCorrected: false });
            const patterns = getTypoPatterns();
            expect(patterns).toHaveLength(0);
        });
    });
});

describe('Error Handling Scenarios', () => {
    describe('Exercise Normalization Errors', () => {
        it('handles gibberish exercise names gracefully', async () => {
            // Import the normalization function
            const { normalizeExercise, getUnrecognizedMessage } = await import('../src/lib/ai/exerciseNormalization');

            const result = normalizeExercise('xyzabc123');
            expect(result.confidence).toBe(0);
            expect(result.suggestions).toBeDefined();
            expect(result.suggestions!.length).toBeGreaterThan(0);

            const message = getUnrecognizedMessage('xyzabc123');
            expect(message).toContain("couldn't recognize");
            expect(message).toContain('Common exercises include');
        });

        it('corrects common typos with high confidence', async () => {
            const { normalizeExercise } = await import('../src/lib/ai/exerciseNormalization');

            const result = normalizeExercise('squirt');
            expect(result.normalized).toBe('squat');
            expect(result.wasCorrected).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('handles empty string input', async () => {
            const { normalizeExercise } = await import('../src/lib/ai/exerciseNormalization');

            const result = normalizeExercise('');
            expect(result.confidence).toBe(0);
        });

        it('handles whitespace-only input', async () => {
            const { normalizeExercise } = await import('../src/lib/ai/exerciseNormalization');

            const result = normalizeExercise('   ');
            expect(result.confidence).toBe(0);
        });
    });

    describe('Error Message Quality', () => {
        it('provides actionable error messages', async () => {
            const { getUnrecognizedMessage } = await import('../src/lib/ai/exerciseNormalization');

            const message = getUnrecognizedMessage('invalidExercise');

            // Should contain the original term
            expect(message).toContain('invalidExercise');
            // Should suggest alternatives
            expect(message).toContain('Common exercises include');
            // Should have at least some exercise suggestions
            expect(message).toMatch(/Squat|Deadlift|Bench|Run|Row/);
        });
    });
});
