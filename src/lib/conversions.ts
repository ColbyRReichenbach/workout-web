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
 * @param weightLbs Weight in pounds
 * @param unit User's preferred unit system
 * @returns Weight in the display unit (rounded) or null
 */
export const toDisplayWeight = (weightLbs: number | null | undefined, unit: UnitSystem): number | null => {
    if (weightLbs === null || weightLbs === undefined) return null;
    if (unit === 'metric') {
        return Math.round(weightLbs / KG_TO_LBS);
    }
    return Math.round(weightLbs);
};

/**
 * Converts a weight value from display units back to storage units (lbs).
 * @param displayVal Weight in the user's display unit
 * @param unit User's preferred unit system
 * @returns Weight in pounds (rounded) or null
 */
export const toStorageWeight = (displayVal: number | string | null | undefined, unit: UnitSystem): number | null => {
    if (displayVal === null || displayVal === undefined || displayVal === "") return null;
    const val = typeof displayVal === 'string' ? parseFloat(displayVal) : displayVal;
    if (isNaN(val)) return null;

    if (unit === 'metric') {
        return Math.round(val * KG_TO_LBS);
    }
    return Math.round(val);
};

/**
 * Converts a distance value from storage units (miles) to the display unit.
 * @param miles Distance in miles
 * @param unit User's preferred unit system
 * @returns Formatted string (e.g. "5.2")
 */
export const toDisplayDistance = (miles: number | null | undefined, unit: UnitSystem): string => {
    if (miles === null || miles === undefined) return "0.0";
    if (unit === 'metric') {
        return (miles * MILES_TO_KM).toFixed(1);
    }
    return miles.toFixed(1);
};

/**
 * Returns the label for a given measurement type and unit system.
 * @param unit User's preferred unit system
 * @param type 'weight' or 'distance'
 * @returns 'kg', 'lb', 'km', or 'mi'
 */
export const getUnitLabel = (unit: UnitSystem, type: 'weight' | 'distance'): string => {
    if (type === 'weight') {
        return unit === 'metric' ? 'kg' : 'lb';
    }
    return unit === 'metric' ? 'km' : 'mi';
};
