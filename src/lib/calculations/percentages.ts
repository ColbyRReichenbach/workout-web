/**
 * Workout Percentage Calculations
 * Refactored to support anchor-based estimation and detailed metadata.
 */

import { UserProfile } from '../types';

export interface WorkingSetResult {
    weight: number;
    isEstimate: boolean;
    source?: string;
    needsCalibration: boolean;
}

/**
 * Calculate working weight from exercise name and percentage of 1RM
 * 
 * @param exerciseName - Name of the exercise (case-insensitive)
 * @param percentOf1RM - Percentage as decimal (0.70 = 70%)
 * @param profile - User profile (will be auto-estimated if needed)
 * @returns Object with calculated weight and metadata
 */
export function calculateWorkingSet(
    exerciseName: string,
    percentOf1RM: number,
    profile: UserProfile
): WorkingSetResult {
    const name = exerciseName.toLowerCase();
    const estimated = estimateMissingMaxes(profile);

    let base = 0;
    let isEstimate = false;
    let source = "";

    // 1. Identify the Lift and get its base max (actual or estimated)
    if (name.includes('clean') && name.includes('jerk')) {
        base = estimated.clean_jerk_max || 0;
        isEstimate = !profile.clean_jerk_max;
        source = isEstimate ? "Estimated from Bench" : "Personal Record";
    } else if (name.includes('clean')) {
        base = estimated.clean_jerk_max ? estimated.clean_jerk_max * 0.85 : 0;
        isEstimate = true;
        source = "Estimated from C&J";
    } else if (name.includes('snatch')) {
        base = estimated.snatch_max || 0;
        isEstimate = !profile.snatch_max;
        source = isEstimate ? "Estimated from Bench" : "Personal Record";
    } else if (name.includes('front squat')) {
        base = estimated.front_squat_max || 0;
        isEstimate = !profile.front_squat_max;
        source = isEstimate ? "Estimated from Squat" : "Personal Record";
    } else if (name.includes('back squat') || (name.includes('squat') && !name.includes('split'))) {
        base = estimated.squat_max || 0;
        isEstimate = !profile.squat_max;
        source = isEstimate ? "Baseline Estimate" : "Personal Record";
    } else if (name.includes('overhead') || name.includes('ohp') || (name.includes('press') && !name.includes('bench'))) {
        base = estimated.ohp_max || 0;
        isEstimate = !profile.ohp_max;
        source = isEstimate ? "Estimated from Bench" : "Personal Record";
    } else if (name.includes('bench')) {
        base = estimated.bench_max || 0;
        isEstimate = !profile.bench_max;
        source = isEstimate ? "Baseline Estimate" : "Personal Record";
    } else if (name.includes('deadlift')) {
        base = estimated.deadlift_max || 0;
        isEstimate = !profile.deadlift_max;
        source = isEstimate ? "Estimated from Squat" : "Personal Record";
    }

    const calculated = Math.round(base * percentOf1RM);
    const needsCalibration = base === 0;

    return {
        weight: calculated,
        isEstimate,
        source: source || undefined,
        needsCalibration
    };
}

/**
 * Synthetic Baseline for uncalibrated users.
 * Provides a safe "Level 0" starting point for prescriptions.
 */
const BASELINE = {
    bench_max: 95,
    squat_max: 135,
    deadlift_max: 185,
    ohp_max: 65,
    front_squat_max: 115,
    clean_jerk_max: 115,
    snatch_max: 95,
    mile_time_sec: 540, // 9:00
    row_2k_sec: 540,    // 9:00
    bike_max_watts: 200
};

/**
 * Estimate missing maxes from known maxes using scientific correlations.
 * Uses Bench Press as the anchor for upper body and Squat for lower body.
 * If no data is present, uses a synthetic baseline.
 * 
 * @param profile - User profile (may have partial maxes)
 * @returns Profile with estimated maxes filled in
 */
export function estimateMissingMaxes(profile: UserProfile): UserProfile {
    const estimated = { ...profile };

    // --- 0. Baseline Fallback ---
    // If both anchors are missing, use baseline to ensure we can prescribe something
    if (!estimated.squat_max && !estimated.bench_max) {
        estimated.bench_max = estimated.bench_max || BASELINE.bench_max;
        estimated.squat_max = estimated.squat_max || BASELINE.squat_max;
        estimated.deadlift_max = estimated.deadlift_max || BASELINE.deadlift_max;
        estimated.ohp_max = estimated.ohp_max || BASELINE.ohp_max;
        estimated.front_squat_max = estimated.front_squat_max || BASELINE.front_squat_max;
        estimated.clean_jerk_max = estimated.clean_jerk_max || BASELINE.clean_jerk_max;
        estimated.snatch_max = estimated.snatch_max || BASELINE.snatch_max;
        estimated.mile_time_sec = estimated.mile_time_sec || BASELINE.mile_time_sec;
        estimated.row_2k_sec = estimated.row_2k_sec || BASELINE.row_2k_sec;
        estimated.bike_max_watts = estimated.bike_max_watts || BASELINE.bike_max_watts;
    }

    // --- 1. Secondary Anchor Estimation (Cross-Chain) ---
    // If we have one but not the other, estimate the missing anchor first.
    if (!estimated.squat_max && estimated.bench_max) {
        estimated.squat_max = Math.round(estimated.bench_max * 1.35); // Est Squat from Bench
    }
    if (!estimated.bench_max && estimated.squat_max) {
        estimated.bench_max = Math.round(estimated.squat_max * 0.75); // Est Bench from Squat
    }

    // --- 2. Lower Body (Anchored to Squat) ---
    if (estimated.squat_max) {
        if (!estimated.deadlift_max) {
            estimated.deadlift_max = Math.round(estimated.squat_max * 1.20);
        }
        if (!estimated.front_squat_max) {
            estimated.front_squat_max = Math.round(estimated.squat_max * 0.85);
        }
    }

    // --- 3. Upper Body & Olympic (Anchored to Bench) ---
    if (estimated.bench_max) {
        if (!estimated.ohp_max) {
            estimated.ohp_max = Math.round(estimated.bench_max * 0.60);
        }
        if (!estimated.clean_jerk_max) {
            estimated.clean_jerk_max = Math.round(estimated.bench_max * 1.10);
        }
    }

    // --- 4. Olympic Cascade ---
    if (estimated.clean_jerk_max && !estimated.snatch_max) {
        estimated.snatch_max = Math.round(estimated.clean_jerk_max * 0.80);
    }

    // --- 5. Power & Cardio ---
    // Bike Max Watts from Squat
    if (!estimated.bike_max_watts && estimated.squat_max) {
        estimated.bike_max_watts = Math.round(estimated.squat_max * 3.0);
    }

    // Cardio Estimates (Very rough benchmarks based on general fitness)
    if (!estimated.mile_time_sec) {
        // If they have a bench of 225+, assume a decent baseline
        estimated.mile_time_sec = 480; // 8:00
    }
    if (!estimated.row_2k_sec) {
        estimated.row_2k_sec = 480; // 8:00
    }

    return estimated;
}

/**
 * Get the base max for a given exercise (with estimation support)
 */
export function getExerciseMax(exerciseName: string, profile: UserProfile): number {
    const estimated = estimateMissingMaxes(profile);
    const name = exerciseName.toLowerCase();

    if (name.includes('clean') && name.includes('jerk')) return estimated.clean_jerk_max || 0;
    if (name.includes('snatch')) return estimated.snatch_max || 0;
    if (name.includes('front squat')) return estimated.front_squat_max || 0;
    if (name.includes('back squat') || name.includes('squat')) return estimated.squat_max || 0;
    if (name.includes('overhead') || name.includes('ohp')) return estimated.ohp_max || 0;
    if (name.includes('bench')) return estimated.bench_max || 0;
    if (name.includes('deadlift')) return estimated.deadlift_max || 0;

    return 0;
}
