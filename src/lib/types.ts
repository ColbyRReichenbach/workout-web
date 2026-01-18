export type TrackingMode = 'CHECKBOX' | 'STRENGTH_SETS' | 'CARDIO_BASIC' | 'METCON';
export type SegmentType = 'WARMUP' | 'MAIN_LIFT' | 'ACCESSORY' | 'METCON' | 'CARDIO' | 'SKILL' | 'ENDURANCE';

export interface WorkoutTarget {
    sets?: number;
    reps?: number;
    percent_1rm?: number;
    weight_fixed?: number;
    rpe?: number;
    duration_min?: number;
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
    height?: number;
    weight_lbs?: number;
    squat_max?: number;
    bench_max?: number;
    deadlift_max?: number;
    current_week?: number;
    current_phase?: number;
    ai_name?: string;
    ai_personality?: string;
    units?: 'imperial' | 'metric';
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
