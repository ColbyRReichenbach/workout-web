/**
 * 1RM Estimation Formulas
 * Convert rep maxes to estimated 1RMs and vice versa
 */

/**
 * Estimate 1RM from a rep max using various formulas
 * 
 * @param weight - Weight lifted for reps
 * @param reps - Number of reps performed
 * @param formula - Formula to use (epley or brzycki)
 * @returns Estimated 1RM
 */
export function estimateOneRM(
    weight: number,
    reps: number,
    formula: 'epley' | 'brzycki' = 'epley'
): number {
    if (reps === 1) return weight;

    if (formula === 'epley') {
        // Epley Formula: 1RM = weight × (1 + reps/30)
        // Best for 5-10 rep range
        return Math.round(weight * (1 + (reps / 30)));
    } else {
        // Brzycki Formula: 1RM = weight × (36 / (37 - reps))
        // Best for 1-5 rep range
        return Math.round(weight * (36 / (37 - reps)));
    }
}

/**
 * Reverse calculation: Given 1RM and target reps, find working weight
 * 
 * @param oneRM - Athlete's 1RM
 * @param targetReps - Desired number of reps
 * @returns Working weight for target reps
 */
export function calculateWorkingWeight(oneRM: number, targetReps: number): number {
    // Using Epley in reverse: weight = 1RM / (1 + reps/30)
    return Math.round(oneRM / (1 + (targetReps / 30)));
}

/**
 * Calculate percentage of 1RM
 * 
 * @param oneRM - Athlete's 1RM
 * @param percentage - Percentage (0-1)
 * @returns Weight at given percentage
 */
export function calculatePercentage1RM(oneRM: number, percentage: number): number {
    return Math.round(oneRM * percentage);
}

/**
 * Auto-select best formula based on rep range
 */
export function estimateOneRMAuto(weight: number, reps: number): number {
    if (reps <= 5) {
        return estimateOneRM(weight, reps, 'brzycki');
    } else {
        return estimateOneRM(weight, reps, 'epley');
    }
}

/**
 * Estimate other maxes from a known max (correlation-based)
 * 
 * Common correlations:
 * - Front Squat ~85% of Back Squat
 * - Clean ~85% of Clean & Jerk
 * - Snatch ~80% of Clean & Jerk
 * - OHP ~65% of Bench Press
 */
export function estimateCorrelatedMax(knownMax: number, type: 'front_squat' | 'clean' | 'snatch' | 'ohp'): number {
    const correlations = {
        front_squat: 0.85,
        clean: 0.85,
        snatch: 0.80,
        ohp: 0.65
    };

    return Math.round(knownMax * correlations[type]);
}
