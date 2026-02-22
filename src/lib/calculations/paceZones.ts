/**
 * Pace Zone Calculations
 * Derives training paces from benchmark times (5k run, 2k row)
 */

/**
 * Calculate Zone 2 and Tempo paces from 5k time
 * 
 * Zone 2 = 5k pace + 60-75 sec/mile (using midpoint 67.5)
 * Tempo = 5k pace + 20-30 sec/mile (using midpoint 25)
 * 
 * @param k5TimeSec - 5k time in seconds
 * @returns Object with zone2 and tempo paces (seconds per mile)
 */
export function calculate5kDerivedPaces(k5TimeSec: number): {
    zone2PacePerMile: number; // seconds per mile
    tempoPacePerMile: number;
} {
    // 5k is 3.10686 miles
    const k5PacePerMile = k5TimeSec / 3.10686;

    return {
        // Zone 2 = 5k pace + 60-75 sec/mile (using midpoint 67.5)
        zone2PacePerMile: Math.round(k5PacePerMile + 67.5),

        // Tempo = 5k pace + 20-30 sec/mile (using midpoint 25)
        tempoPacePerMile: Math.round(k5PacePerMile + 25)
    };
}

/**
 * Calculate rowing paces from 2k row time
 * 
 * Aerobic intervals = 2k pace + 8-10 sec/500m (using 9)
 * 
 * @param row2kSec - 2k row time in seconds
 * @returns Object with aerobic interval pace (seconds per 500m)
 */
export function calculate2kRowDerivedPaces(row2kSec: number): {
    aerobicInterval500m: number; // seconds per 500m
    anaerobicSprint250m: number;
} {
    const pace500m = row2kSec / 4; // 2k is 4x500m

    return {
        // Aerobic intervals = 2k pace + 8-10 sec (using 9)
        aerobicInterval500m: Math.round(pace500m + 9),

        // Anaerobic sprints estimated as 2k pace - 15 sec, divided by 2 for 250m
        anaerobicSprint250m: Math.round((pace500m - 15) / 2)
    };
}

/**
 * Calculate 400m interval pace from 1 mile time
 * 
 * 400m target = (1 Mile time / 4) - 10 seconds
 * 
 * @param mileTimeSec - 1 Mile time in seconds
 * @returns 400m target pace in seconds
 */
export function calculate400mPaceFromMile(mileTimeSec: number): number {
    return Math.round((mileTimeSec / 4) - 10);
}

/**
 * Format pace for display (convert seconds to MM:SS)
 */
export function formatPace(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format pace per mile/500m display
 */
export function formatPacePerUnit(seconds: number, unit: 'mile' | '500m' | '400m'): string {
    return `${formatPace(seconds)}/${unit}`;
}

import { UserProfile } from '../types';
import { estimateMissingMaxes } from './percentages';

/**
 * Parses a workout text string to replace {{mustache}} variables 
 * with dynamically calculated paces based on the user's profile.
 */
export function parseWorkoutTemplate(text: string, rawProfile?: UserProfile | null): string {
    if (!text || !text.includes('{{')) return text;
    if (!rawProfile) return text;

    // Estimate missing so we have baseline data to work with
    const profile = estimateMissingMaxes(rawProfile);

    const row2kSec = profile.row_2k_sec || 465; // default 7:45
    const k5TimeSec = profile.k5_time_sec || 1440; // default 24:00
    const mileTimeSec = profile.mile_time_sec || 450; // default 7:30

    const rowPaces = calculate2kRowDerivedPaces(row2kSec);
    const runPaces = calculate5kDerivedPaces(k5TimeSec);
    const run400mPace = calculate400mPaceFromMile(mileTimeSec);

    // HR Zones based on generic % of Max HR if exact values aren't set
    const maxHr = profile.max_hr || 196;

    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, variable) => {
        switch (variable) {
            case 'row_interval_pace_500m':
                return formatPacePerUnit(rowPaces.aerobicInterval500m, '500m');
            case 'row_tempo_pace_500m':
                return formatPacePerUnit(rowPaces.aerobicInterval500m + 5, '500m');
            case 'run_zone2_pace_mile':
                return formatPacePerUnit(runPaces.zone2PacePerMile, 'mile');
            case 'run_tempo_pace_mile':
                return formatPacePerUnit(runPaces.tempoPacePerMile, 'mile');
            case 'run_interval_pace_400m':
                return formatPacePerUnit(run400mPace, '400m');
            case 'zone_1_hr':
                return `${Math.round(maxHr * 0.65)}-${Math.round(maxHr * 0.72)} bpm`;
            case 'zone_2_hr':
                return `${Math.round(maxHr * 0.73)}-${Math.round(maxHr * 0.82)} bpm`;
            case 'zone_3_hr':
                return `${Math.round(maxHr * 0.83)}-${Math.round(maxHr * 0.86)} bpm`;
            case 'zone_4_hr':
                return `${Math.round(maxHr * 0.87)}-${Math.round(maxHr * 0.94)} bpm`;
            case 'zone_5_hr':
                return `${Math.round(maxHr * 0.95)}+ bpm`;
            default:
                return match; // Leave unparsed if unrecognized
        }
    });
}
