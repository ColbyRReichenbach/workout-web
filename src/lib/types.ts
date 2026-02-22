export type TrackingMode = 'CHECKBOX' | 'STRENGTH_SETS' | 'CARDIO_BASIC' | 'METCON';
export type SegmentType = 'WARMUP' | 'MAIN_LIFT' | 'ACCESSORY' | 'METCON' | 'CARDIO' | 'SKILL' | 'ENDURANCE';

export interface WorkoutTarget {
    sets?: number;
    reps?: number;
    percent_1rm?: number;
    weight_fixed?: number;
    rpe?: number;
    duration_min?: number;
    distance_miles?: number;
    zone?: string;
    hr_cap?: number;
}

export interface WorkoutSegment {
    name: string;
    type: SegmentType;
    tracking_mode: TrackingMode;
    details?: string;
    target?: WorkoutTarget;
    notes?: string;
}

export interface WorkoutDay {
    day: string;
    title: string;
    description?: string;
    segments: WorkoutSegment[];
}

export interface ProtocolDay {
    day: string;
    title: string;
    type: string;
    isFuture?: boolean;
}

export interface WorkoutWeek {
    week_numbers: number[];
    days: WorkoutDay[];
}

export interface WorkoutPhase {
    id: number;
    name: string;
    weeks: WorkoutWeek[];
}

export interface ProgramData {
    phases: WorkoutPhase[];
}

export interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    height?: number; // Height in total inches (normalized storage)
    weight_lbs?: number;

    // Powerlifting Maxes
    squat_max?: number;
    bench_max?: number;
    deadlift_max?: number;

    // Olympic Lift Maxes
    front_squat_max?: number;
    clean_jerk_max?: number;
    snatch_max?: number;
    ohp_max?: number;

    // Cardio Benchmarks (all in seconds)
    mile_time_sec?: number;
    k5_time_sec?: number;
    sprint_400m_sec?: number;
    row_2k_sec?: number;
    row_500m_sec?: number;
    ski_1k_sec?: number;
    bike_max_watts?: number;

    // Heart Rate Data
    resting_hr?: number;
    max_hr?: number;
    hrv_baseline_ms?: number;

    // Calculated Training Zones (derived from benchmarks)
    zone2_pace_per_mile_sec?: number;
    tempo_pace_per_mile_sec?: number;
    zone2_row_pace_500m_sec?: number;

    // Training State
    current_week?: number;
    current_phase?: number;
    last_checkpoint_week?: number;
    next_test_week?: number;

    // User Preferences
    ai_name?: string;
    ai_personality?: string;
    units?: 'imperial' | 'metric';
    program_start_date?: string;
}

export interface WorkoutLog {
    id: string;
    user_id: string;
    date: string;
    day_name: string;
    segment_name: string;
    segment_type: SegmentType;
    tracking_mode: TrackingMode;
    performance_data: Record<string, unknown>; // Using a record for JSONB data
    week_number: number;
    notes?: string;
    created_at?: string;
}

export interface SessionLog {
    id: string;
    user_id: string;
    date: string;
    session_rpe?: number;
    notes?: string;
    tags?: string[];
    created_at?: string;
}
