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
