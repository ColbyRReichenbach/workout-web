export const KG_TO_LBS = 2.20462;

export const convertWeightToDisplay = (weightLbs: number | null | undefined, unit: 'metric' | 'imperial'): number | null => {
    if (weightLbs === null || weightLbs === undefined) return null;
    if (unit === 'metric') {
        return Math.round(weightLbs / KG_TO_LBS);
    }
    return Math.round(weightLbs);
};

export const convertWeightToStorage = (weightDisplay: number | null | undefined, unit: 'metric' | 'imperial'): number | null => {
    if (weightDisplay === null || weightDisplay === undefined) return null;
    if (unit === 'metric') {
        return Math.round(weightDisplay * KG_TO_LBS);
    }
    return Math.round(weightDisplay);
};

// Distance conversions (if needed) across app
export const convertDistanceValue = (miles: number, unit: 'metric' | 'imperial'): string => {
    if (unit === 'metric') {
        return (miles * 1.60934).toFixed(1);
    }
    return miles.toFixed(1);
};
export const normalizeUnit = (unit: string | null | undefined): 'metric' | 'imperial' => {
    if (!unit) return 'imperial';
    const lower = unit.toLowerCase();
    if (lower.includes('metric')) return 'metric';
    return 'imperial';
};

export const convertDistance = (miles: number, unit: 'metric' | 'imperial'): string => {
    if (unit === 'metric') {
        return `${(miles * 1.60934).toFixed(1)} km`;
    }
    return `${miles.toFixed(1)} mi`;
};
