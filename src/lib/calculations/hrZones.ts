/**
 * Heart Rate Zone Calculations
 * Uses the Karvonen Method for individualized HR zones based on resting HR
 */

export interface HRZoneInputs {
    age: number;
    restingHR: number;
    hrvBaseline?: number; // Optional, for advanced calculation
}

export interface HRZones {
    zone1: { min: number; max: number };
    zone2: { min: number; max: number };
    zone4: { min: number; max: number };
    zone5: { min: number; max: number };
}

/**
 * Calculate heart rate zones using the Karvonen Method
 * 
 * Formula: Target HR = ((Max HR - Resting HR) × %Intensity) + Resting HR
 * 
 * @param inputs - Age and resting HR
 * @returns Object containing all HR zones
 */
export function calculateHRZones(inputs: HRZoneInputs): HRZones {
    // Max HR = 220 - age (simple formula, can be refined with 208 - 0.7*age for more accuracy)
    const maxHR = 220 - inputs.age;

    // HR Reserve = Max HR - Resting HR
    const hrReserve = maxHR - inputs.restingHR;

    // Zone calculations (% of HR Reserve + Resting HR)
    return {
        zone1: {
            min: Math.round(inputs.restingHR + (hrReserve * 0.50)),
            max: Math.round(inputs.restingHR + (hrReserve * 0.60))
        },
        zone2: {
            min: Math.round(inputs.restingHR + (hrReserve * 0.60)),
            max: Math.round(inputs.restingHR + (hrReserve * 0.70))
        },
        zone4: {
            min: Math.round(inputs.restingHR + (hrReserve * 0.80)),
            max: Math.round(inputs.restingHR + (hrReserve * 0.90))
        },
        zone5: {
            min: Math.round(inputs.restingHR + (hrReserve * 0.90)),
            max: maxHR
        }
    };
}

/**
 * Format HR zone for display
 */
export function formatHRZone(zone: { min: number; max: number }): string {
    return `${zone.min}–${zone.max} bpm`;
}
