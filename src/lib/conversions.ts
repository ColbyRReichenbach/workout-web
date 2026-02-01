export const KG_TO_LBS = 2.20462;
export const MILES_TO_KM = 1.60934;
export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

// Re-export height utilities from dedicated module
export {
    parseHeightString,
    imperialToInches,
    cmToInches,
    inchesToCm,
    inchesToImperial,
    formatHeight,
    formatHeightForUnit,
    isValidHeight,
    clampHeight,
    formValuesToInches,
    inchesToFormValues,
    HEIGHT_BOUNDS,
    type HeightImperial,
    type HeightDisplay,
} from './conversions/height';

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
        const val = miles * MILES_TO_KM;
        return val < 10 ? val.toFixed(2) : val.toFixed(1);
    }
    return miles < 10 ? miles.toFixed(2) : miles.toFixed(1);
};

/**
 * Converts a distance value from display units back to storage units (miles).
 * @param displayVal Distance in the user's display unit (km or mi)
 * @param unit User's preferred unit system
 * @returns Distance in miles (for storage)
 */
export const toStorageDistance = (displayVal: number | string | null | undefined, unit: UnitSystem): number | null => {
    if (displayVal === null || displayVal === undefined || displayVal === "") return null;
    const val = typeof displayVal === 'string' ? parseFloat(displayVal) : displayVal;
    if (isNaN(val)) return null;

    if (unit === 'metric') {
        return val / MILES_TO_KM;
    }
    return val;
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
/**
 * Maps variant exercise names (e.g. "Back Squat 1RM", "Bench Press Singles") 
 * back to their baseline counterparts in the BASELINE maxes table.
 */
export const mapExerciseToBaseline = (name: string): string => {
    if (!name) return "Other";
    const lower = name.toLowerCase();

    if (lower.includes("back squat")) return "Back Squat";
    if (lower.includes("front squat")) return "Front Squat";
    if (lower.includes("bench press") || (lower.includes("bench") && !lower.includes("press"))) return "Bench Press";
    if (lower.includes("deadlift")) return "Deadlift";
    if (lower.includes("overhead press") || lower.includes("ohp")) return "Overhead Press";
    if (lower.includes("clean")) return "Clean & Jerk";
    if (lower.includes("snatch")) return "Snatch";

    // Cardio Benchmarks
    if (lower.includes("1 mile") || (lower === "mile")) return "1 Mile";
    if (lower.includes("5k")) return "5k";
    if (lower.includes("400m")) return "400m";
    if (lower.includes("row") && lower.includes("2k")) return "2k Row";
    if (lower.includes("row") && lower.includes("500m")) return "500m Row";
    if (lower.includes("ski") && lower.includes("1k")) return "1k Ski";
    if (lower.includes("bike") && (lower.includes("max") || lower.includes("watt"))) return "Max Bike Watts";
    if (lower.includes("zone 2") && lower.includes("pace")) return "Zone 2 Pace";
    if (lower.includes("tempo") && lower.includes("pace")) return "Tempo Pace";

    return "Other";
};

/**
 * Auto-formats a numeric string into M:SS or MM:SS format.
 * Handles backspacing and prevents invalid inputs.
 * 
 * @param input - The raw string from the input field
 * @param previousValue - The previous state of the input (to handle deletions)
 */
export const formatTimeInput = (input: string, previousValue: string = ""): string => {
    // 1. Remove non-numeric characters
    const numbers = input.replace(/\D/g, '');

    // 2. Limit to 4 digits (MM:SS)
    const truncated = numbers.slice(0, 4);

    // 3. Handle deletions: If the user just deleted the colon, don't immediately re-add it
    const isDeleting = input.length < previousValue.length;
    const hadColon = previousValue.includes(':');
    const hasColon = input.includes(':');

    if (isDeleting && hadColon && !hasColon && numbers.length > 0) {
        // Just return the numbers without the colon to allow backspacing through it
        return numbers;
    }

    // 4. Format based on length
    if (truncated.length <= 2) {
        return truncated;
    } else if (truncated.length === 3) {
        // M:SS
        return `${truncated[0]}:${truncated.slice(1)}`;
    } else {
        // MM:SS
        return `${truncated.slice(0, 2)}:${truncated.slice(2)}`;
    }
};
