/**
 * Checkpoint Test Detection and Metadata
 * Defines test requirements for Weeks 8, 20, 37, 44, 51
 */

export interface CheckpointTest {
    name: string;
    type: 'strength' | 'cardio';
    updates: string[]; // Profile fields to update
    instructions?: string;
}

export interface CheckpointWeek {
    week: number;
    tests: CheckpointTest[];
    globalInstructions: string;
    schedule?: {
        [day: string]: string[]; // Day → Test names
    };
}

export const CHECKPOINT_TESTS: { [week: number]: CheckpointWeek } = {
    8: {
        week: 8,
        globalInstructions: "Saturday of Week 8: Complete a 5k time trial followed by full recovery, then 2k row time trial. These will recalculate your Zone 2 and Tempo paces for Phase 2.",
        tests: [
            {
                name: '5k Run Time Trial',
                type: 'cardio',
                updates: ['k5_time_sec', 'zone2_pace_per_mile_sec', 'tempo_pace_per_mile_sec'],
                instructions: "Run 5k as fast as possible. Record total time in minutes:seconds."
            },
            {
                name: '2k Row Time Trial',
                type: 'cardio',
                updates: ['row_2k_sec', 'zone2_row_pace_500m_sec'],
                instructions: "Row 2000m as fast as possible. Record total time."
            }
        ]
    },
    20: {
        week: 20,
        globalInstructions: "Saturday of Week 20: Test all major lifts (can use 3RM to estimate if safer), then 1 Mile + 500m row. This recalibrates your Phase 3 targets.",
        tests: [
            {
                name: 'Back Squat 1RM or 3RM',
                type: 'strength',
                updates: ['squat_max'],
                instructions: "Build to a true 1RM or a heavy 3RM (will estimate 1RM automatically)."
            },
            {
                name: 'Bench Press 1RM or 3RM',
                type: 'strength',
                updates: ['bench_max'],
                instructions: "Build to a true 1RM or a heavy 3RM."
            },
            {
                name: 'Deadlift 1RM or 3RM',
                type: 'strength',
                updates: ['deadlift_max'],
                instructions: "Build to a true 1RM or a heavy 3RM."
            },
            {
                name: '1 Mile Run Time Trial',
                type: 'cardio',
                updates: ['mile_time_sec', 'sprint_400m_sec'],
                instructions: "Run 1 mile as fast as possible. This sets your 400m interval pace."
            },
            {
                name: '500m Row Max Effort',
                type: 'cardio',
                updates: ['row_500m_sec'],
                instructions: "Row 500m for time. All-out effort."
            }
        ]
    },
    37: {
        week: 37,
        globalInstructions: "Testing Week 1: Mon (Olympic), Wed (Structural), Fri (Absolute), Sat (Cardio)",
        schedule: {
            monday: ['Clean & Jerk 1RM', 'Snatch 1RM'],
            wednesday: ['Front Squat 1RM', 'Bench Press 1RM'],
            friday: ['Back Squat 1RM', 'Deadlift 1RM'],
            saturday: ['1 Mile Run', '500m Row']
        },
        tests: [
            {
                name: 'Clean & Jerk 1RM',
                type: 'strength',
                updates: ['clean_jerk_max'],
                instructions: "Build to 1RM. Monday."
            },
            {
                name: 'Snatch 1RM',
                type: 'strength',
                updates: ['snatch_max'],
                instructions: "Build to 1RM. Monday."
            },
            {
                name: 'Front Squat 1RM',
                type: 'strength',
                updates: ['front_squat_max'],
                instructions: "Build to 1RM. Wednesday."
            },
            {
                name: 'Bench Press 1RM',
                type: 'strength',
                updates: ['bench_max'],
                instructions: "Build to 1RM. Wednesday."
            },
            {
                name: 'Back Squat 1RM',
                type: 'strength',
                updates: ['squat_max'],
                instructions: "Build to 1RM. Friday."
            },
            {
                name: 'Deadlift 1RM',
                type: 'strength',
                updates: ['deadlift_max'],
                instructions: "Build to 1RM. Friday."
            },
            {
                name: '1 Mile Run',
                type: 'cardio',
                updates: ['mile_time_sec'],
                instructions: "Time trial. Saturday."
            },
            {
                name: '500m Row',
                type: 'cardio',
                updates: ['row_500m_sec'],
                instructions: "Max effort. Saturday."
            }
        ]
    },
    44: {
        week: 44,
        globalInstructions: "Testing Week 2: Mon/Wed/Fri (repeat strength tests), Sat (5k + Bike)",
        schedule: {
            saturday: ['5k Run', 'Assault Bike 30-sec Max Watts']
        },
        tests: [
            {
                name: '5k Run',
                type: 'cardio',
                updates: ['k5_time_sec', 'zone2_pace_per_mile_sec', 'tempo_pace_per_mile_sec'],
                instructions: "Time trial. Saturday."
            },
            {
                name: 'Assault Bike Max Watts',
                type: 'cardio',
                updates: ['bike_max_watts'],
                instructions: "30-second all-out test. Record max wattage."
            }
        ]
    },
    51: {
        week: 51,
        globalInstructions: "Final Testing Week: Mon/Wed/Fri (strength), Sat (multi-modal endurance)",
        schedule: {
            saturday: ['8 x 400m Repeats', '2k Row', '1k Ski Erg']
        },
        tests: [
            {
                name: '8 x 400m Repeats (average pace)',
                type: 'cardio',
                updates: ['sprint_400m_sec'],
                instructions: "Run 8 x 400m with 2:00 rest. Record average pace."
            },
            {
                name: '2k Row',
                type: 'cardio',
                updates: ['row_2k_sec', 'zone2_row_pace_500m_sec'],
                instructions: "Time trial."
            },
            {
                name: '1k Ski Erg',
                type: 'cardio',
                updates: ['ski_1k_sec'],
                instructions: "Time trial."
            }
        ]
    }
};

/**
 * Check if current week is a checkpoint testing week
 */
export function isCheckpointWeek(week: number): boolean {
    return week in CHECKPOINT_TESTS;
}

/**
 * Get checkpoint data for a given week
 */
export function getCheckpointData(week: number): CheckpointWeek | null {
    return CHECKPOINT_TESTS[week] || null;
}

/**
 * Get next checkpoint week after given week
 */
export function getNextCheckpointWeek(currentWeek: number): number | null {
    const checkpoints = [8, 20, 37, 44, 51];
    const next = checkpoints.find(w => w > currentWeek);
    return next || null;
}
