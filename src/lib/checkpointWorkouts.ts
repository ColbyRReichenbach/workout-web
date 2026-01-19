/**
 * Generate workout segments for checkpoint testing days
 * These replace the regular Saturday workout with actual PR tests
 */

import { WorkoutSegment } from './types';
import { getCheckpointData } from './checkpointTests';

export function generateCheckpointWorkout(week: number): WorkoutSegment[] {
    const checkpointData = getCheckpointData(week);
    if (!checkpointData) return [];

    const segments: WorkoutSegment[] = [];

    // Add warmup
    segments.push({
        name: "Dynamic Warmup",
        type: "WARMUP",
        tracking_mode: "CHECKBOX",
        details: "10 min general warmup focusing on movements you'll test today",
        notes: "Get blood flowing, elevate HR gradually, prime CNS"
    });

    // Add test segments based on the checkpoint week
    checkpointData.tests.forEach(test => {
        if (test.type === 'strength') {
            segments.push({
                name: test.name,
                type: "MAIN_LIFT",
                tracking_mode: "STRENGTH_SETS",
                details: test.instructions || "Build to 1RM",
                notes: "Record your best set. This will update your training maxes for future phases.",
                target: {
                    sets: 1,
                    reps: 1,
                    rpe: 10
                }
            });
        } else if (test.type === 'cardio') {
            segments.push({
                name: test.name,
                type: "CARDIO",
                tracking_mode: "CARDIO_BASIC",
                details: test.instructions || "Max effort time trial",
                notes: "This result recalculates your training zones for upcoming weeks."
            });
        }
    });

    // Add cooldown
    segments.push({
        name: "Cooldown & Mobility",
        type: "SKILL",
        tracking_mode: "CHECKBOX",
        details: "10-15 min easy movement + stretching",
        notes: "Focus on recovery. You earned it! 🏆"
    });

    return segments;
}

/**
 * Check if we should override the workout with checkpoint tests
 */
export function shouldUseCheckpointWorkout(week: number, dayName: string): boolean {
    return dayName === "Saturday" && getCheckpointData(week) !== null;
}
