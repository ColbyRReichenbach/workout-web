import { describe, it, expect } from 'vitest';
import {
    calculateWorkingSet,
    estimateMissingMaxes,
    getExerciseMax
} from '../../src/lib/calculations/percentages';
import { UserProfile } from '../../src/lib/types';

describe('percentages Calculations', () => {
    describe('estimateMissingMaxes', () => {
        it('should estimate Squat from Bench if Squat is missing', () => {
            const profile: UserProfile = {
                bench_max: 200,
            } as any;
            const estimated = estimateMissingMaxes(profile);
            // 200 * 1.35 = 270
            expect(estimated.squat_max).toBe(270);
        });

        it('should estimate Bench from Squat if Bench is missing', () => {
            const profile: UserProfile = {
                squat_max: 300,
            } as any;
            const estimated = estimateMissingMaxes(profile);
            // 300 * 0.75 = 225
            expect(estimated.bench_max).toBe(225);
        });

        it('should estimate Secondary lifts (Deadlift, Front Squat, OHP) from Anchors', () => {
            const profile: UserProfile = {
                bench_max: 100,
                squat_max: 200,
            } as any;
            const estimated = estimateMissingMaxes(profile);
            // Deadlift = 200 * 1.20 = 240
            // Front Squat = 200 * 0.85 = 170
            // OHP = 100 * 0.60 = 60
            expect(estimated.deadlift_max).toBe(240);
            expect(estimated.front_squat_max).toBe(170);
            expect(estimated.ohp_max).toBe(60);
        });

        it('should use BASELINE if no strength data is present', () => {
            const emptyProfile = {} as UserProfile;
            const estimated = estimateMissingMaxes(emptyProfile);
            expect(estimated.bench_max).toBe(95);
            expect(estimated.squat_max).toBe(135);
        });
    });

    describe('calculateWorkingSet', () => {
        const profile: UserProfile = {
            bench_max: 200,
            squat_max: 300,
        } as any;

        it('should calculate correct weight for Main Lift (Bench)', () => {
            const result = calculateWorkingSet('Bench Press', 0.80, profile);
            expect(result.weight).toBe(160);
            expect(result.isEstimate).toBe(false);
        });

        it('should calculate correct weight for Estimated Main Lift (Deadlift from Squat)', () => {
            const result = calculateWorkingSet('Deadlift', 0.70, profile);
            // Deadlift est = 300 * 1.2 = 360. 360 * 0.7 = 252.
            expect(result.weight).toBe(252);
            expect(result.isEstimate).toBe(true);
        });

        it('should map Accessory Lift (Lunge) to Squat', () => {
            const result = calculateWorkingSet('Lunge', 0.50, profile);
            // 300 * 0.5 = 150
            expect(result.weight).toBe(150);
            expect(result.source).toContain('Mapped to Squat');
        });

        it('should map Accessory Lift (Rows) to Bench', () => {
            const result = calculateWorkingSet('Dumbbell Row', 0.40, profile);
            // 200 * 0.4 = 80
            expect(result.weight).toBe(80);
            expect(result.source).toContain('Mapped to Bench');
        });
    });

    describe('getExerciseMax', () => {
        const profile: UserProfile = {
            bench_max: 100,
            squat_max: 200,
        } as any;

        it('should return correct max for main lift', () => {
            expect(getExerciseMax('Bench Press', profile)).toBe(100);
            expect(getExerciseMax('Squat', profile)).toBe(200);
        });

        it('should return estimated max for missing lift', () => {
            // Deadlift = 200 * 1.2 = 240
            expect(getExerciseMax('Deadlift', profile)).toBe(240);
        });
    });
});
