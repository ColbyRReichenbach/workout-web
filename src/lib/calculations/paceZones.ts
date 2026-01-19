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
