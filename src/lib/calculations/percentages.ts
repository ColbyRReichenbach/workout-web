/**
 * Workout Percentage Calculations
 * Extends the existing calcWeight logic to support all 7 strength movements
 */

import { UserProfile } from '../types';

export interface MaxesProfile {
    squat_max?: number;
    bench_max?: number;
    deadlift_max?: number;
    front_squat_max?: number;
    clean_jerk_max?: number;
    snatch_max?: number;
    ohp_max?: number;
}

/**
 * Calculate working weight from exercise name and percentage of 1RM
 * 
 * @param exerciseName - Name of the exercise (case-insensitive)
 * @param percentOf1RM - Percentage as decimal (0.70 = 70%)
 * @param profile - User profile with all maxes
 * @returns Calculated weight in lbs
 */
export function calculateWorkingSet(
    exerciseName: string,
    percentOf1RM: number,
    profile: UserProfile
): number {
    const name = exerciseName.toLowerCase();

    let base = profile.squat_max || 0; // default to squat
    let liftType = "squat";

    // Olympic Lifts (highest priority for specificity)
    if (name.includes('clean') && name.includes('jerk')) {
        base = profile.clean_jerk_max || 0;
        liftType = "clean & jerk";
    } else if (name.includes('clean')) {
        // Clean only (not C&J) - use 85% of C&J if Clean max not tracked separately
        base = profile.clean_jerk_max ? profile.clean_jerk_max * 0.85 : 0;
        liftType = "clean (from C&J)";
    } else if (name.includes('snatch')) {
        base = profile.snatch_max || 0;
        liftType = "snatch";
    }

    // Squat Variations
    else if (name.includes('front squat')) {
        base = profile.front_squat_max || (profile.squat_max ? profile.squat_max * 0.85 : 0);
        liftType = profile.front_squat_max ? "front squat" : "front squat (est from back)";
    } else if (name.includes('back squat') || name.includes('squat')) {
        base = profile.squat_max || 0;
        liftType = "back squat";
    }

    // Upper Body Press
    else if (name.includes('overhead') || name.includes('ohp') || name.includes('press') && !name.includes('bench')) {
        base = profile.ohp_max || (profile.bench_max ? profile.bench_max * 0.65 : 0);
        liftType = profile.ohp_max ? "overhead press" : "OHP (est from bench)";
    } else if (name.includes('bench')) {
        base = profile.bench_max || 0;
        liftType = "bench press";
    }

    // Deadlift
    else if (name.includes('deadlift')) {
        base = profile.deadlift_max || 0;
        liftType = "deadlift";
    }

    const calculated = Math.round(base * percentOf1RM);

    console.log(`[calculateWorkingSet] ${exerciseName} → ${liftType}: ${base} × ${percentOf1RM} = ${calculated} lbs`);

    return calculated;
}

/**
 * Estimate missing maxes from known maxes using typical correlations
 * 
 * @param profile - User profile (may have partial maxes)
 * @returns Profile with estimated maxes filled in
 */
export function estimateMissingMaxes(profile: UserProfile): UserProfile {
    const estimated = { ...profile };

    // Front Squat ~85% of Back Squat
    if (!estimated.front_squat_max && estimated.squat_max) {
        estimated.front_squat_max = Math.round(estimated.squat_max * 0.85);
    }

    // OHP ~65% of Bench Press
    if (!estimated.ohp_max && estimated.bench_max) {
        estimated.ohp_max = Math.round(estimated.bench_max * 0.65);
    }

    // Snatch ~80% of Clean & Jerk
    if (!estimated.snatch_max && estimated.clean_jerk_max) {
        estimated.snatch_max = Math.round(estimated.clean_jerk_max * 0.80);
    }

    // Clean & Jerk estimation from squat (rough): ~70% of Back Squat
    if (!estimated.clean_jerk_max && estimated.squat_max) {
        estimated.clean_jerk_max = Math.round(estimated.squat_max * 0.70);
    }

    return estimated;
}

/**
 * Get the base max for a given exercise
 * Useful for display purposes
 */
export function getExerciseMax(exerciseName: string, profile: UserProfile): number {
    const name = exerciseName.toLowerCase();

    if (name.includes('clean') && name.includes('jerk')) return profile.clean_jerk_max || 0;
    if (name.includes('snatch')) return profile.snatch_max || 0;
    if (name.includes('front squat')) return profile.front_squat_max || 0;
    if (name.includes('back squat') || name.includes('squat')) return profile.squat_max || 0;
    if (name.includes('overhead') || name.includes('ohp')) return profile.ohp_max || 0;
    if (name.includes('bench')) return profile.bench_max || 0;
    if (name.includes('deadlift')) return profile.deadlift_max || 0;

    return 0;
}
