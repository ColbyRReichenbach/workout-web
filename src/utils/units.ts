export const KG_TO_LBS = 2.20462;
export const MILES_TO_KM = 1.60934;

export type UnitSystem = 'metric' | 'imperial';

/**
 * Normalizes a unit string from the database to a standard 'metric' or 'imperial' type.
 */
export const normalizeUnit = (unit: string | null | undefined): UnitSystem => {
    if (!unit) return 'imperial';
    const lower = unit.toLowerCase();
    if (lower.includes('metric')) return 'metric';
    return 'imperial';
};

/**
 * Converts a weight value from storage units (lbs) to the display unit.
 */
export const convertWeightToDisplay = (weightLbs: number | null | undefined, unit: UnitSystem): number | null => {
    if (weightLbs === null || weightLbs === undefined) return null;
    if (unit === 'metric') {
        return Math.round(weightLbs / KG_TO_LBS);
    }
    return Math.round(weightLbs);
};

/**
 * Converts a weight value from display units back to storage units (lbs).
 */
export const convertWeightToStorage = (weightDisplay: number | null | undefined, unit: UnitSystem): number | null => {
    if (weightDisplay === null || weightDisplay === undefined) return null;
    if (unit === 'metric') {
        return Math.round(weightDisplay * KG_TO_LBS);
    }
    return Math.round(weightDisplay);
};

/**
 * Converts a distance value from storage units (miles) to the display unit.
 */
export const convertDistanceToDisplay = (miles: number | null | undefined, unit: UnitSystem): string => {
    if (miles === null || miles === undefined) return "0.0";
    if (unit === 'metric') {
        const val = miles * MILES_TO_KM;
        return val < 10 ? val.toFixed(2) : val.toFixed(1);
    }
    return miles < 10 ? miles.toFixed(2) : miles.toFixed(1);
};

/**
 * Converts a distance value from display units back to storage units (miles).
 */
export const convertDistanceToStorage = (displayVal: number | string | null | undefined, unit: UnitSystem): number | null => {
    if (displayVal === null || displayVal === undefined || displayVal === "") return null;
    const val = typeof displayVal === 'string' ? parseFloat(displayVal) : displayVal;
    if (isNaN(val)) return null;

    if (unit === 'metric') {
        return val / MILES_TO_KM;
    }
    return val;
};
