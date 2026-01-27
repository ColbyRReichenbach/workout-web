/**
 * Height Conversion Utilities
 *
 * Provides conversion between imperial (ft/in), metric (cm), and
 * normalized storage format (total inches).
 */

// ============================================
// TYPES
// ============================================

export interface HeightImperial {
    feet: number;
    inches: number;
}

export interface HeightDisplay {
    imperial: string; // e.g., "6'2\""
    metric: string;   // e.g., "188 cm"
}

// ============================================
// CONSTANTS
// ============================================

const INCHES_PER_FOOT = 12;
const CM_PER_INCH = 2.54;

// Valid height bounds
export const HEIGHT_BOUNDS = {
    MIN_INCHES: 36,   // 3 feet
    MAX_INCHES: 108,  // 9 feet
    MIN_CM: 91,       // ~36 inches
    MAX_CM: 274,      // ~108 inches
};

// ============================================
// PARSING UTILITIES
// ============================================

/**
 * Parse a legacy height string (e.g., "6'2\"" or "188 cm") to total inches
 * Returns null if parsing fails
 */
export function parseHeightString(heightStr: string | null | undefined): number | null {
    if (!heightStr || typeof heightStr !== 'string') {
        return null;
    }

    const trimmed = heightStr.trim();

    // Try imperial format: 6'2" or 6' 2"
    const imperialMatch = trimmed.match(/^(\d+)'?\s*(\d+)?["']?$/);
    if (imperialMatch) {
        const feet = parseInt(imperialMatch[1], 10);
        const inches = parseInt(imperialMatch[2] || '0', 10);
        return feet * INCHES_PER_FOOT + inches;
    }

    // Try metric format: 188 cm or 188cm
    const metricMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*cm$/i);
    if (metricMatch) {
        const cm = parseFloat(metricMatch[1]);
        return Math.round(cm / CM_PER_INCH);
    }

    // Try plain number (assume inches if small, cm if large)
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
    if (numMatch) {
        const value = parseFloat(numMatch[1]);
        // If value is > 96 (8 feet), assume it's cm
        if (value > 96) {
            return Math.round(value / CM_PER_INCH);
        }
        // Otherwise assume inches
        return Math.round(value);
    }

    return null;
}

/**
 * Convert feet and inches to total inches
 */
export function imperialToInches(feet: number, inches: number = 0): number {
    return feet * INCHES_PER_FOOT + inches;
}

/**
 * Convert centimeters to total inches
 */
export function cmToInches(cm: number): number {
    return Math.round(cm / CM_PER_INCH);
}

/**
 * Convert total inches to centimeters
 */
export function inchesToCm(inches: number): number {
    return Math.round(inches * CM_PER_INCH);
}

// ============================================
// DISPLAY UTILITIES
// ============================================

/**
 * Convert total inches to imperial (feet and inches)
 */
export function inchesToImperial(totalInches: number): HeightImperial {
    const feet = Math.floor(totalInches / INCHES_PER_FOOT);
    const inches = totalInches % INCHES_PER_FOOT;
    return { feet, inches };
}

/**
 * Format total inches for display in both units
 */
export function formatHeight(totalInches: number | null | undefined): HeightDisplay {
    if (totalInches === null || totalInches === undefined || isNaN(totalInches)) {
        return { imperial: '--', metric: '--' };
    }

    const { feet, inches } = inchesToImperial(totalInches);
    const cm = inchesToCm(totalInches);

    return {
        imperial: `${feet}'${inches}"`,
        metric: `${cm} cm`,
    };
}

/**
 * Format height for display based on user's preferred unit
 */
export function formatHeightForUnit(
    totalInches: number | null | undefined,
    unit: 'imperial' | 'metric'
): string {
    const display = formatHeight(totalInches);
    return unit === 'imperial' ? display.imperial : display.metric;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that height is within reasonable bounds
 */
export function isValidHeight(totalInches: number): boolean {
    return (
        !isNaN(totalInches) &&
        totalInches >= HEIGHT_BOUNDS.MIN_INCHES &&
        totalInches <= HEIGHT_BOUNDS.MAX_INCHES
    );
}

/**
 * Clamp height to valid bounds
 */
export function clampHeight(totalInches: number): number {
    if (isNaN(totalInches)) {
        return HEIGHT_BOUNDS.MIN_INCHES;
    }
    return Math.max(
        HEIGHT_BOUNDS.MIN_INCHES,
        Math.min(HEIGHT_BOUNDS.MAX_INCHES, totalInches)
    );
}

// ============================================
// FORM UTILITIES
// ============================================

/**
 * Convert form values (ft/in or cm) to total inches for storage
 */
export function formValuesToInches(
    unit: 'imperial' | 'metric',
    values: { feet?: number | string; inches?: number | string; cm?: number | string }
): number {
    if (unit === 'imperial') {
        const feet = parseInt(String(values.feet || 0), 10) || 0;
        const inches = parseInt(String(values.inches || 0), 10) || 0;
        return imperialToInches(feet, inches);
    } else {
        const cm = parseFloat(String(values.cm || 0)) || 0;
        return cmToInches(cm);
    }
}

/**
 * Convert stored inches to form values for editing
 */
export function inchesToFormValues(
    totalInches: number | null | undefined,
    unit: 'imperial' | 'metric'
): { feet: string; inches: string; cm: string } {
    if (totalInches === null || totalInches === undefined || isNaN(totalInches)) {
        return { feet: '', inches: '', cm: '' };
    }

    const { feet, inches } = inchesToImperial(totalInches);
    const cm = inchesToCm(totalInches);

    if (unit === 'imperial') {
        return {
            feet: feet.toString(),
            inches: inches.toString(),
            cm: '',
        };
    } else {
        return {
            feet: '',
            inches: '',
            cm: cm.toString(),
        };
    }
}
