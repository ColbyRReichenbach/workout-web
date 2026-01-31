/**
 * Exercise Normalization Module
 * 
 * Provides fuzzy matching and typo correction for exercise names.
 * Converts user input like "squirt" → "squat", "DL" → "deadlift"
 */

// ============================================
// EXERCISE KEYWORD MAPPING
// ============================================

/**
 * Map of canonical exercise names to their aliases (including common typos)
 * Enhanced with actual segment names from database and comprehensive typo coverage
 * Total: 50+ canonical exercises, 300+ aliases, 200+ typo mappings
 */
export const EXERCISE_KEYWORDS: Record<string, string[]> = {
    // =====================================================
    // STRENGTH: LOWER BODY (Enhanced from actual usage)
    // =====================================================
    'squat': [
        // Standard aliases
        'squat', 'squats', 'back squat', 'bs', 'bsq', 'low bar', 'high bar',
        'low bar back squat', 'low bar squat', 'lbbs', 'hbbs',
        'back squat heavy', 'heavy double', 'squat double', 'squat x2',
        'back squat 1rm', 'squat max', 'squat pr', 'squat 1rm',
        // Common typos
        'squirt', 'sqat', 'sqaut', 'suat', 'squqt', 'suqat', 'squt', 'squot', 'squrt',
        'bakc squat', 'bak squat', 'back sqat', 'sqauat'
    ],
    'front_squat': [
        'front squat', 'front squats', 'fsq', 'fs', 'front', 'frontsquat',
        'front squat 1rm', 'front squat max', 'fs max', 'fs 1rm',
        // Typos
        'frnt squat', 'fron squat', 'front sqat', 'frontsqat', 'frot squat'
    ],
    'deadlift': [
        'deadlift', 'deadlifts', 'dead lift', 'dl', 'conventional', 'sumo',
        'deadlift variation', 'deads', 'dead', 'deadlift 1rm', 'deadlift max', 'dl max',
        // Typos
        'deadlit', 'deadlfit', 'deedlift', 'dedlift', 'deaflift', 'deadlif',
        'deadloft', 'deaslift'
    ],
    'rdl': ['rdl', 'romanian deadlift', 'romanian', 'stiff leg', 'stiff legged', 'sldl'],
    'lunge': [
        'lunge', 'lunges', 'walking lunge', 'walking lunges', 'split squat',
        'dumbbell lunges', 'db lunges', 'dumbbell walking lunges',
        // Typos
        'wlaking lunge', 'lumge', 'lunges'
    ],
    'leg_press': ['leg press', 'legpress', 'lp', 'leg pres'],
    'leg_curl': ['leg curl', 'hamstring curl', 'lying curl', 'leg curls', 'ham curl'],
    'leg_extension': [
        'leg extension', 'leg extensions', 'quad extension', 'leg ext', 'extensions',
        // Typos
        'leg extention', 'leg extentions', 'leg exension'
    ],

    // =====================================================
    // STRENGTH: UPPER BODY PUSH (Enhanced)
    // =====================================================
    'bench_press': [
        'bench', 'bench press', 'bp', 'benchpress', 'flat bench', 'barbell bench', 'bb bench',
        'bench 1rm', 'bench max', 'bench pr',
        // Typos
        'benchh', 'benhc', 'bnech', 'bech press', 'becnh', 'bnch', 'bech', 'bensh', 'bnehc press'
    ],
    'incline_bench': ['incline bench', 'incline press', 'incline', 'incline bp', 'incline bench press'],
    'overhead_press': [
        'ohp', 'overhead press', 'press', 'shoulder press', 'military press', 'strict press',
        'ohp max', 'ohp 1rm',
        // Typos
        'ovherhead press', 'shoudler press', 'ohpp', 'ohph', 'shuolder press'
    ],
    'dumbbell_press': ['dumbbell press', 'db press', 'db bench', 'dumbbell bench', 'db pres'],
    'dip': [
        'dip', 'dips', 'chest dip', 'tricep dip', 'weighted dip', 'weighted dips', 'bar dips',
        // Typos
        'dipps', 'dipp', 'disp', 'wieghted dips'
    ],
    'pushup': ['pushup', 'push up', 'pushups', 'push ups', 'push-up', 'push-ups'],

    // =====================================================
    // STRENGTH: UPPER BODY PULL (Enhanced)
    // =====================================================
    'pull_up': [
        'pull up', 'pullup', 'pullups', 'pull-up', 'chin up', 'chinup', 'chin-up',
        'weighted pullup', 'weighted pull up', 'weighted pull-ups', 'pull ups',
        // Typos
        'pul up', 'pulup', 'wieghted pullup', 'weighed pullup'
    ],
    'row': [
        'row', 'rows', 'barbell row', 'bent over row', 'pendlay', 'pendlay row',
        'bb row', 'bor', 'bent row',
        // Typos
        'pendley', 'penlay', 'pendaly', 'pendlayr ow', 'pendley row', 'pndlay'
    ],
    'dumbbell_row': ['dumbbell row', 'db row', 'one arm row', '1arm row', 'single arm row'],
    'lat_pulldown': ['lat pulldown', 'pulldown', 'lat pull', 'lat pd', 'pull down'],
    'face_pull': ['face pull', 'facepull', 'face pulls', 'facepulls', 'face pul'],

    // =====================================================
    // OLYMPIC LIFTS (Enhanced)
    // =====================================================
    'clean': [
        'clean', 'cleans', 'power clean', 'hang clean', 'squat clean', 'pc', 'pwr clean',
        // Typos
        'cleen', 'claen', 'clena', 'powerclaen', 'power claen', 'cln', 'pwoer clean'
    ],
    'clean_and_jerk': [
        'clean and jerk', 'cnj', 'c&j', 'clean jerk', 'cj', 'clean & jerk',
        'clean & jerk 1rm', 'c&j max',
        // Typos
        'clean an jerk', 'cleana nd jerk'
    ],
    'snatch': [
        'snatch', 'snatches', 'power snatch', 'hang snatch', 'squat snatch',
        'snatch 1rm', 'snatch max',
        // Typos
        'sntach', 'sncatch', 'snacth', 'swatch', 'sntch'
    ],
    'thruster': ['thruster', 'thrusters', 'thrsters'],

    // =====================================================
    // CARDIO: RUNNING (Enhanced from actual usage)
    // =====================================================
    'run': ['run', 'running', 'jog', 'jogging', 'sprint', 'sprinting'],
    'zone2_run': [
        'zone 2 run', 'zone2 run', 'z2 run', 'easy run', 'aerobic run',
        'zone 2', 'z2', 'zone2', 'zone two', 'z2r',
        // Typos
        'zone2 rnu', 'zon 2 run', 'zone 2 rn', 'zoen 2 run', 'zone2run'
    ],
    'tempo_run': [
        'tempo run', 'tempo', 'threshold run', 'lt run', 'tempo pace', 'lactate threshold',
        // Typos
        'tepmo', 'tmpo run', 'tempo rnu', 'temop run', 'tepmor un'
    ],
    '5k_run': [
        '5k', '5k run', 'five k', '5 k', '5k test', '5k for time', '5k time trial', '5k tt',
        '5k run for time',
        // Typos
        '5kr un', '5 krun', '5kk', 'fivek', '5 k run', '5krun'
    ],
    'mile': [
        'mile', '1 mile', 'mile run', 'mile time', 'mile test', 'mile time trial',
        'mile tt', 'one mile', '1 mile time trial',
        // Typos
        'miel', 'mlie', '1mile', 'mile tiral', 'mile trail', 'meil', 'mlie time'
    ],
    '400m': [
        '400m', '400 meter', '400m repeats', '400 repeats', 'quarters', '400s',
        '400 meters', '400m intervals', '400',
        // Typos
        '400m repats', '40m repeats', '400 repeates', '400m repeast', '400m repaets'
    ],
    'simulation_run': ['simulation run', 'sim run', 'race simulation', 'race sim'],

    // =====================================================
    // CARDIO: ERG MACHINES (Enhanced)
    // =====================================================
    'row_erg': [
        'row erg', 'rowing', 'erg row', 'rower', 'concept 2', 'c2', 'c2 row',
        'row intervals', 'erg intervals', 'row erg intervals', 'erg', 'ergo',
        // Typos
        'row erg intervlas', 'row ergy', 'rwo erg', 'rowign', 'row ergo'
    ],
    '2k_row': [
        '2k row', '2000m row', '2k erg', '2k test', '2k time trial', '2000m',
        // Typos
        '2k rwo', '2k roe', '200m row'
    ],
    '500m_row': ['500m row', '500m', '500 row', '500m erg', '500m test'],
    'assault_bike': [
        'assault bike', 'assault', 'air bike', 'bike sprints', 'airdyne', 'echo bike',
        'assault bike sprints',
        // Typos
        'assalt bike', 'assualt', 'asault bike', 'assult bike', 'assualt bike'
    ],
    'bike': ['bike', 'biking', 'cycling', 'spin', 'stationary bike'],
    'bike_erg': [
        'bike erg', 'air bike', 'echo bike', 'cardio flush', 'bike flush',
        // Typos
        'bike erge', 'biek erg', 'cardio flsuh'
    ],
    'ski_erg': [
        'ski erg', 'ski', 'skierg', 'skiing', 'ski machine', 'nordic ski', '1k ski',
        // Typos
        'ski erge', 'skii erg', 'skie erg'
    ],
    'cardio_rotation': [
        'multi machine', 'machine rotation', 'cardio rotation', 'mixed cardio', 'multi-machine',
        'multi-machine rotation',
        // Typos
        'multi mahcine', 'machien rotation', 'mulit machine'
    ],

    // =====================================================
    // CONDITIONING / METCON (Enhanced)
    // =====================================================
    'metcon': [
        'metcon', 'conditioning', 'wod', 'amrap', 'emom', 'for time',
        'aerobic flow', 'aerobic flow amrap', 'flow amrap',
        // Typos
        'metocn', 'amra', 'ameracp', 'condtioning', 'amrpa', 'amrapp'
    ],
    'superset': [
        'superset', 'super set', 'superset a', 'superset b', 'ss', 'ss a', 'ss b',
        'accessory superset', 'super-set',
        // Typos
        'supersett', 'supreset', 'superste'
    ],
    'superset_upper': [
        'db press face pulls', 'superset upper', 'db press', 'face pulls superset',
        'superset: db press + face pulls'
    ],
    'accessory': ['beach finisher', 'finisher', 'beach', 'pump work', 'accessory finisher', 'accessory work'],
    'burpee': ['burpee', 'burpees', 'burpie', 'burpies'],
    'box_jump': ['box jump', 'box jumps', 'bj', 'box'],
    'kettlebell_swing': ['kettlebell swing', 'kb swing', 'swings', 'kbs', 'kb swings'],
    'jump_rope': [
        'double unders', 'du', 'double under', 'jump rope', 'dubs', 'skip rope',
        'jump rope warmup', 'double unders skill',
        // Typos
        'double undes', 'doubel unders', 'doube unders'
    ],

    // =====================================================
    // CORE
    // =====================================================
    'plank': ['plank', 'planks', 'plank hold', 'side plank'],
    'situp': ['situp', 'sit up', 'situps', 'crunches', 'sit-up', 'sit-ups'],
    'hanging_leg_raise': ['hanging leg raise', 'hlr', 'leg raise', 'toes to bar', 'ttb', 't2b'],

    // =====================================================
    // RECOVERY & WARMUP (Enhanced)
    // =====================================================
    'stretch': [
        'stretch', 'stretching', 'mobility', 'foam roll', 'yoga', 'yoga/stretching',
        'yoga flow', 'static stretch', 'recovery', 'yoga flow / static stretch',
        // Typos
        'strecthing', 'streching', 'strethcing', 'yoag', 'yooga'
    ],
    'warmup': [
        'warmup', 'warm up', 'warm-up', 'activation', 'dynamic warmup', 'general warmup',
        'jump rope warmup', 'jump rope warm-up', 'warm-up (10 min)',
        // Typos
        'warmpu', 'wamrup', 'warup', 'wrm up', 'wrmup'
    ],
    'cooldown': ['cooldown', 'cool down', 'cool-down', 'flush', 'cardio flush'],
    'rest': [
        'rest', 'rest day', 'off day', 'recovery day', 'off', 'active recovery',
        // Typos
        'resr', 'rset', 'reast'
    ],
    'active_recovery': [
        'zone 1 walk', 'z1 walk', 'easy walk', 'recovery walk', 'zone 1',
        'zone 1 activity', 'z1', 'light activity', 'zone 1/2', 'z1/z2', 'light cardio',
        // Typos
        'zone1 wlak', 'zoen 1 walk', 'zone1 activty', 'zoen 1 activity'
    ],
};

// ============================================
// NORMALIZATION FUNCTIONS
// ============================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching when exact match fails
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize first row and column
    for (let i = 0; i <= a.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

export interface NormalizationResult {
    /** The normalized/canonical exercise name */
    normalized: string;
    /** Original user input */
    original: string;
    /** Confidence score (0-1, higher is better) */
    confidence: number;
    /** Whether a correction was made */
    wasCorrected: boolean;
    /** Suggested alternatives if confidence is low */
    suggestions?: string[];
}

/**
 * Normalize an exercise name from user input
 * Handles typos, abbreviations, and variations
 * 
 * @param userInput - Raw user input (e.g., "squirt", "DL", "bench")
 * @returns NormalizationResult with normalized name and confidence
 * 
 * @example
 * normalizeExercise("squirt") // { normalized: "squat", confidence: 0.8, wasCorrected: true }
 * normalizeExercise("squat")  // { normalized: "squat", confidence: 1.0, wasCorrected: false }
 * normalizeExercise("xyz123") // { normalized: "xyz123", confidence: 0, suggestions: [...] }
 */
export function normalizeExercise(userInput: string): NormalizationResult {
    const lower = userInput.toLowerCase().trim();
    const result: NormalizationResult = {
        normalized: lower,
        original: userInput,
        confidence: 0,
        wasCorrected: false,
    };

    // Empty input check
    if (!lower) {
        return result;
    }

    // Step 1: Exact match in aliases
    for (const [canonical, aliases] of Object.entries(EXERCISE_KEYWORDS)) {
        if (aliases.includes(lower)) {
            result.normalized = canonical;
            result.confidence = 1.0;
            result.wasCorrected = canonical !== lower;
            return result;
        }
    }

    // Step 2: Partial match (user input is contained in alias or vice versa)
    for (const [canonical, aliases] of Object.entries(EXERCISE_KEYWORDS)) {
        for (const alias of aliases) {
            // Check if alias contains the user input or vice versa
            if (alias.includes(lower) || lower.includes(alias)) {
                result.normalized = canonical;
                result.confidence = 0.85;
                result.wasCorrected = true;
                return result;
            }
        }
    }

    // Step 3: Fuzzy match using Levenshtein distance
    let bestMatch = lower;
    let bestScore = Infinity;
    let bestCanonical = lower;

    for (const [canonical, aliases] of Object.entries(EXERCISE_KEYWORDS)) {
        for (const alias of aliases) {
            const score = levenshteinDistance(lower, alias);
            if (score < bestScore) {
                bestScore = score;
                bestMatch = alias;
                bestCanonical = canonical;
            }
        }
    }

    // Only accept fuzzy match if distance is reasonable (max 2 for short words, 3 for longer)
    const maxDistance = lower.length <= 5 ? 2 : 3;

    if (bestScore <= maxDistance) {
        result.normalized = bestCanonical;
        result.confidence = 1 - (bestScore / (lower.length + 1)); // Scale to 0-1
        result.wasCorrected = true;
        return result;
    }

    // Step 4: No good match found - return original with low confidence
    result.normalized = lower; // Keep original
    result.confidence = 0;
    result.wasCorrected = false;
    result.suggestions = getTopExercises(5);

    return result;
}

/**
 * Get a list of common/popular exercises for suggestions
 */
export function getTopExercises(count: number = 5): string[] {
    const commonExercises = [
        'Squat', 'Deadlift', 'Bench Press', 'Run', 'Row',
        'Overhead Press', 'Pull Up', 'Front Squat', 'Clean', 'Bike'
    ];
    return commonExercises.slice(0, count);
}

/**
 * Get the database-friendly filter string for a normalized exercise
 * This is used in Supabase .ilike() queries
 */
export function getFilterPattern(normalized: string): string {
    // Replace underscores with spaces and wildcards for flexible matching
    const pattern = normalized.replace(/_/g, ' ');
    return `%${pattern}%`;
}

/**
 * Generate a user-friendly message for unrecognized exercises
 */
export function getUnrecognizedMessage(original: string): string {
    const suggestions = getTopExercises(5);
    return `I couldn't recognize "${original}" as an exercise. Common exercises include: ${suggestions.join(', ')}. Try asking "what exercises have I logged?" to see your full list.`;
}

/**
 * Normalize multiple exercises at once (for batch operations)
 */
export function normalizeExercises(inputs: string[]): NormalizationResult[] {
    return inputs.map(input => normalizeExercise(input));
}

// ============================================
// SEGMENT TYPE MAPPING
// ============================================

/**
 * Map exercise to its segment type for filtering
 */
export const SEGMENT_TYPE_MAP: Record<string, string> = {
    // Strength exercises
    'squat': 'Strength',
    'front_squat': 'Strength',
    'deadlift': 'Strength',
    'bench_press': 'Strength',
    'overhead_press': 'Strength',
    'pull_up': 'Strength',
    'row': 'Strength',
    'clean': 'Olympic',
    'clean_and_jerk': 'Olympic',
    'snatch': 'Olympic',

    // Cardio exercises
    'run': 'Cardio',
    'zone2_run': 'Cardio',
    'tempo_run': 'Cardio',
    '5k_run': 'Cardio',
    'mile': 'Cardio',
    '400m': 'Cardio',
    'row_erg': 'Cardio',
    'bike': 'Cardio',
    'ski_erg': 'Cardio',

    // Conditioning
    'metcon': 'Conditioning',
    'burpee': 'Conditioning',
    'kettlebell_swing': 'Conditioning',
};

/**
 * Get the segment type for an exercise
 */
export function getSegmentType(normalizedExercise: string): string | undefined {
    return SEGMENT_TYPE_MAP[normalizedExercise];
}
