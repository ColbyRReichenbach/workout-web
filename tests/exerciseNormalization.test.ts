/**
 * Exercise Normalization Tests
 * 
 * Run: npx vitest run src/lib/ai/exerciseNormalization.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
    normalizeExercise,
    getFilterPattern,
    getUnrecognizedMessage,
    getTopExercises
} from '../src/lib/ai/exerciseNormalization';

describe('normalizeExercise', () => {
    describe('exact matches', () => {
        it('matches exact exercise name', () => {
            const result = normalizeExercise('squat');
            expect(result.normalized).toBe('squat');
            expect(result.confidence).toBe(1.0);
            expect(result.wasCorrected).toBe(false);
        });

        it('matches aliases (abbreviations)', () => {
            const result = normalizeExercise('dl');
            expect(result.normalized).toBe('deadlift');
            expect(result.confidence).toBe(1.0);
            expect(result.wasCorrected).toBe(true);
        });

        it('matches multi-word aliases', () => {
            const result = normalizeExercise('bench press');
            expect(result.normalized).toBe('bench_press');
            expect(result.confidence).toBe(1.0);
            expect(result.wasCorrected).toBe(true);
        });
    });

    describe('typo correction', () => {
        it('corrects "squirt" to "squat"', () => {
            const result = normalizeExercise('squirt');
            expect(result.normalized).toBe('squat');
            expect(result.wasCorrected).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('corrects "benchh" to "bench_press"', () => {
            const result = normalizeExercise('benchh');
            expect(result.normalized).toBe('bench_press');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "deadlt" to "deadlift"', () => {
            const result = normalizeExercise('deadlt');
            expect(result.normalized).toBe('deadlift');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "runing" to "run"', () => {
            const result = normalizeExercise('runing');
            expect(result.normalized).toBe('run');
            expect(result.wasCorrected).toBe(true);
        });
    });

    describe('partial matches', () => {
        it('matches when user input contains alias', () => {
            const result = normalizeExercise('overhead');
            expect(result.normalized).toBe('overhead_press');
            expect(result.confidence).toBe(0.85);
            expect(result.wasCorrected).toBe(true);
        });
    });

    describe('unrecognized input', () => {
        it('returns low confidence for gibberish', () => {
            const result = normalizeExercise('xyzabc123');
            expect(result.confidence).toBe(0);
            expect(result.suggestions).toBeDefined();
            expect(result.suggestions?.length).toBeGreaterThan(0);
        });

        it('keeps original for unrecognized input', () => {
            const result = normalizeExercise('qwertyuiop');
            expect(result.normalized).toBe('qwertyuiop');
            expect(result.wasCorrected).toBe(false);
        });
    });

    describe('case insensitivity', () => {
        it('handles uppercase input', () => {
            const result = normalizeExercise('SQUAT');
            expect(result.normalized).toBe('squat');
        });

        it('handles mixed case input', () => {
            const result = normalizeExercise('DeadLift');
            expect(result.normalized).toBe('deadlift');
        });
    });

    describe('edge cases', () => {
        it('handles empty string', () => {
            const result = normalizeExercise('');
            expect(result.confidence).toBe(0);
        });

        it('handles whitespace', () => {
            const result = normalizeExercise('  squat  ');
            expect(result.normalized).toBe('squat');
        });
    });
});

describe('getFilterPattern', () => {
    it('converts underscores to spaces with wildcards', () => {
        expect(getFilterPattern('bench_press')).toBe('%bench press%');
    });

    it('adds wildcards to simple terms', () => {
        expect(getFilterPattern('squat')).toBe('%squat%');
    });
});

describe('getUnrecognizedMessage', () => {
    it('includes the original input', () => {
        const msg = getUnrecognizedMessage('xyzabc');
        expect(msg).toContain('xyzabc');
    });

    it('includes exercise suggestions', () => {
        const msg = getUnrecognizedMessage('test');
        expect(msg).toContain('Squat');
        expect(msg).toContain('Deadlift');
    });
});

describe('getTopExercises', () => {
    it('returns specified number of exercises', () => {
        const exercises = getTopExercises(3);
        expect(exercises).toHaveLength(3);
    });

    it('returns common exercises', () => {
        const exercises = getTopExercises();
        expect(exercises).toContain('Squat');
        expect(exercises).toContain('Deadlift');
    });
});

// ============================================
// Phase 3 Enhanced Tests
// ============================================

describe('Phase 3: Enhanced segment mappings', () => {
    describe('new segment types from database', () => {
        it('recognizes "zone 2 run" as zone2_run', () => {
            const result = normalizeExercise('zone 2 run');
            expect(result.normalized).toBe('zone2_run');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "z2" abbreviation', () => {
            const result = normalizeExercise('z2');
            expect(result.normalized).toBe('zone2_run');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "assault bike"', () => {
            const result = normalizeExercise('assault bike');
            expect(result.normalized).toBe('assault_bike');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "row erg intervals"', () => {
            const result = normalizeExercise('row erg');
            expect(result.normalized).toBe('row_erg');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "c2" as row_erg', () => {
            const result = normalizeExercise('c2');
            expect(result.normalized).toBe('row_erg');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "amrap" as metcon', () => {
            const result = normalizeExercise('amrap');
            expect(result.normalized).toBe('metcon');
            expect(result.confidence).toBe(1.0);
        });
    });

    describe('additional typo corrections', () => {
        it('corrects "pendley" to "row"', () => {
            const result = normalizeExercise('pendley');
            expect(result.normalized).toBe('row');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "assalt bike" to "assault_bike"', () => {
            const result = normalizeExercise('assalt bike');
            expect(result.normalized).toBe('assault_bike');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "zone2 rnu" to "zone2_run"', () => {
            const result = normalizeExercise('zone2 rnu');
            expect(result.normalized).toBe('zone2_run');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "metocn" to "metcon"', () => {
            const result = normalizeExercise('metocn');
            expect(result.normalized).toBe('metcon');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "bakc squat" to "squat"', () => {
            const result = normalizeExercise('bakc squat');
            expect(result.normalized).toBe('squat');
            expect(result.wasCorrected).toBe(true);
        });

        it('corrects "deadlfit" to "deadlift"', () => {
            const result = normalizeExercise('deadlfit');
            expect(result.normalized).toBe('deadlift');
            expect(result.wasCorrected).toBe(true);
        });
    });

    describe('database segment names', () => {
        it('recognizes "low bar back squat"', () => {
            const result = normalizeExercise('low bar back squat');
            expect(result.normalized).toBe('squat');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "back squat 1rm"', () => {
            const result = normalizeExercise('back squat 1rm');
            expect(result.normalized).toBe('squat');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "double unders"', () => {
            const result = normalizeExercise('double unders');
            expect(result.normalized).toBe('jump_rope');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "yoga/stretching"', () => {
            const result = normalizeExercise('yoga/stretching');
            expect(result.normalized).toBe('stretch');
            expect(result.confidence).toBe(1.0);
        });

        it('recognizes "active recovery" as rest', () => {
            const result = normalizeExercise('active recovery');
            expect(result.normalized).toBe('rest');
            expect(result.confidence).toBe(1.0);
        });
    });
});
