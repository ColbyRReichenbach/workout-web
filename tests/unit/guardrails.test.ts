/**
 * Guardrails Unit Tests
 *
 * Tests for the AI content moderation guardrails including:
 * - Full checkSensitiveTopicGuardrails integration (all 4 layers)
 * - Exact keyword matching
 * - Fuzzy matching (typo tolerance) — including deltoid/anatomy false positive regression
 * - Stemmed matching (word variations)
 * - Pattern matching (regex)
 * - Fitness context allow-list (false positive reduction)
 * - Output filtering (PII, credentials, system prompt leakage)
 */

import { describe, it, expect } from 'vitest';

// ============================================
// UTILITIES (mirrored from route.ts for unit testing)
// ============================================

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatch(word: string, keyword: string, maxDistance?: number): boolean {
    const distance = levenshteinDistance(word.toLowerCase(), keyword.toLowerCase());
    const tolerance = maxDistance ?? (keyword.length >= 7 ? 2 : keyword.length >= 6 ? 1 : 0);
    return distance <= tolerance;
}

function simpleStem(word: string): string {
    return word
        .replace(/ing$/i, '')
        .replace(/ed$/i, '')
        .replace(/s$/i, '')
        .replace(/ly$/i, '')
        .replace(/tion$/i, 't')
        .replace(/ment$/i, '');
}

function extractWords(content: string): string[] {
    return content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
}

const FITNESS_CONTEXT_KEYWORDS = [
    'workout', 'exercise', 'training', 'gym', 'lift', 'lifting', 'squat', 'deadlift',
    'bench', 'press', 'curl', 'row', 'pull', 'push', 'cardio', 'running', 'run',
    'sprint', 'jog', 'swim', 'cycling', 'bike', 'hiit', 'crossfit', 'strength',
    'conditioning', 'warm up', 'cool down', 'stretch', 'mobility', 'flexibility',
    'muscle', 'gains', 'reps', 'sets', 'weight', 'barbell', 'dumbbell', 'kettlebell',
    'resistance', 'band', 'machine', 'cable', 'bodyweight', 'calisthenics',
    'program', 'routine', 'split', 'phase', 'week', 'day', 'session', 'pr', 'max',
    'volume', 'intensity', 'rpe', 'rir', 'tempo', 'rest', 'recovery', 'deload',
    'stronger', 'faster', 'endurance', 'stamina', 'performance', 'athletic'
];

function hasFitnessContext(content: string): boolean {
    const lowerContent = content.toLowerCase();
    const matchCount = FITNESS_CONTEXT_KEYWORDS.filter(keyword =>
        lowerContent.includes(keyword)
    ).length;
    return matchCount >= 2;
}

// Full guardrail simulation matching the 4-layer logic in route.ts
const SENSITIVE_TOPIC_GUARDRAILS: Record<string, {
    keywords: string[];
    patterns?: RegExp[];
    response: string;
    priority: number;
}> = {
    mental_health_crisis: {
        keywords: [
            'kill myself', 'want to die', 'suicidal', 'end my life', 'suicide',
            'self harm', 'hurt myself', 'cutting myself', "don't want to live"
        ],
        response: 'MENTAL_HEALTH_RESPONSE',
        priority: 160,
    },
    eating_disorder: {
        keywords: [
            'anorexia', 'bulimia', 'purge', 'purging', 'binge and purge',
            'not eating at all', 'starve myself', 'starving myself', 'eating disorder',
            'body dysmorphia', 'stop eating', 'quit eating', "won't eat", 'refuse to eat',
            'not gonna eat', 'not going to eat'
        ],
        response: 'EATING_DISORDER_RESPONSE',
        priority: 150,
    },
    dangerous_exercises: {
        keywords: [
            'max out without spotter', 'lift without spotter', 'no spotter',
            'ego lift', 'exercise on no sleep', 'train through injury',
            'ignore the pain', 'push through sharp pain', 'work through torn',
        ],
        patterns: [
            /train\s+(with|through)\s+(a\s+)?(torn|broken|herniated|fractured)/i,
            /lift\s+(with|on)\s+(no\s+sleep|drunk|injury)/i,
        ],
        response: 'DANGEROUS_EXERCISE_RESPONSE',
        priority: 140,
    },
    ped_banned_substances: {
        keywords: [
            'steroid', 'steroids', 'steriod', 'steriods', 'roids',
            'testosterone', 'trt', 'sarm', 'sarms', 'hgh', 'human growth hormone',
            'anabolic', 'clenbuterol', 'trenbolone', 'dianabol', 'winstrol',
            'performance enhancing drugs', 'ped cycle', 'doping', 'juice up'
        ],
        response: 'PED_RESPONSE',
        priority: 120,
    },
    nutrition_diet: {
        keywords: [
            'diet plan', 'my diet', 'calorie deficit', 'how many calories',
            'what should i eat', 'meal plan', 'macro split', 'carb cycling',
        ],
        response: 'NUTRITION_RESPONSE',
        priority: 100,
    },
    off_topic_entertainment: {
        keywords: ['movie', 'tv show', 'netflix', 'celebrity', 'video game'],
        response: 'ENTERTAINMENT_RESPONSE',
        priority: 30,
    },
};

const AMBIGUOUS_KEYWORDS: Record<string, string[]> = {
    'cut': ['eating_disorder'],
    'cutting': ['eating_disorder'],
    'shredded': ['eating_disorder'],
    'lean': ['eating_disorder'],
    'fasting': ['nutrition_diet'],
    'fast': ['nutrition_diet'],
    'doping': ['ped_banned_substances'], // "doing" fuzzy-matches "doping"; require fitness context
};

function checkSensitiveTopicGuardrails(content: string): string | null {
    const lowerContent = content.toLowerCase();
    const contentWords = extractWords(content);
    const stemmedContentWords = contentWords.map(simpleStem);
    const hasStrongFitnessContext = hasFitnessContext(content);

    const sortedGuardrails = Object.entries(SENSITIVE_TOPIC_GUARDRAILS)
        .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [topic, config] of sortedGuardrails) {
        // Layer 1: Exact keyword match
        for (const keyword of config.keywords) {
            if (lowerContent.includes(keyword.toLowerCase())) {
                const ambiguousCategories = AMBIGUOUS_KEYWORDS[keyword.toLowerCase()];
                if (ambiguousCategories?.includes(topic) && hasStrongFitnessContext) continue;
                return config.response;
            }
        }

        // Layer 2: Fuzzy match (priority >= 50 only, 4+ char words)
        if (config.priority < 50) continue;
        const singleWordKeywords = config.keywords.filter(k => !k.includes(' '));
        for (const keyword of singleWordKeywords) {
            for (const word of contentWords) {
                if (word.length >= 4 && fuzzyMatch(word, keyword)) {
                    const ambiguousCategories = AMBIGUOUS_KEYWORDS[keyword.toLowerCase()];
                    if (ambiguousCategories?.includes(topic) && hasStrongFitnessContext) continue;
                    return config.response;
                }
            }
        }

        // Layer 3: Stemmed match (priority >= 100 only)
        if (config.priority >= 100) {
            for (const keyword of singleWordKeywords) {
                const stemmedKeyword = simpleStem(keyword);
                if (stemmedKeyword.length >= 3) {
                    for (const stemmedWord of stemmedContentWords) {
                        if (stemmedWord === stemmedKeyword ||
                            (stemmedWord.length >= 4 && fuzzyMatch(stemmedWord, stemmedKeyword, 1))) {
                            const ambiguousCategories = AMBIGUOUS_KEYWORDS[keyword.toLowerCase()];
                            if (ambiguousCategories?.includes(topic) && hasStrongFitnessContext) continue;
                            return config.response;
                        }
                    }
                }
            }
        }

        // Layer 4: Pattern match
        if (config.patterns) {
            for (const pattern of config.patterns) {
                if (pattern.test(content)) return config.response;
            }
        }
    }

    return null;
}

// ============================================
// LEVENSHTEIN DISTANCE
// ============================================

describe('Levenshtein Distance', () => {
    it('returns 0 for identical strings', () => {
        expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('returns 1 for single substitution', () => {
        expect(levenshteinDistance('hello', 'hallo')).toBe(1);
        expect(levenshteinDistance('cat', 'car')).toBe(1);
    });

    it('handles insertions and deletions', () => {
        expect(levenshteinDistance('hello', 'helloo')).toBe(1);
        expect(levenshteinDistance('hello', 'helo')).toBe(1);
    });

    it('handles common PED keyword typos', () => {
        expect(levenshteinDistance('steriods', 'steroids')).toBe(2);
        expect(levenshteinDistance('steriod', 'steroid')).toBe(2); // i/o transposition = 2 edits
    });

    it('deltoid vs steroid is distance 4 (far apart — not a real false positive risk)', () => {
        expect(levenshteinDistance('deltoid', 'steroid')).toBe(4);
    });
});

// ============================================
// FUZZY MATCH — including anatomy false positive regression
// ============================================

describe('Fuzzy Match', () => {
    it('matches exact words', () => {
        expect(fuzzyMatch('steroids', 'steroids')).toBe(true);
    });

    it('matches steriod/steriods typos for 7-char keywords (tolerance=2)', () => {
        // Both are distance-2 edits of steroid/steroids — caught by tolerance=2
        expect(fuzzyMatch('steriod', 'steroid')).toBe(true);
        expect(fuzzyMatch('steriods', 'steroids')).toBe(true);
    });

    it('does NOT match deltoid against steroid (distance=4, far apart)', () => {
        // deltoid vs steroid = distance 4, well above tolerance=2
        expect(fuzzyMatch('deltoid', 'steroid')).toBe(false);
    });

    it('doing fuzzy-matches doping (distance=1) — handled via AMBIGUOUS_KEYWORDS', () => {
        // "doing" is distance-1 from "doping" — it will match in isolation,
        // but is suppressed by AMBIGUOUS_KEYWORDS when fitness context is present
        expect(fuzzyMatch('doing', 'doping')).toBe(true);
    });

    it('matches 2-typo transpositions for 9+ char keywords', () => {
        expect(fuzzyMatch('testostrone', 'testosterone')).toBe(true); // 9+ chars, tolerance=2
        expect(fuzzyMatch('clenbuterl', 'clenbuterol')).toBe(true);
    });

    it('does NOT fuzzy-match short keywords (<6 chars)', () => {
        expect(fuzzyMatch('keto', 'keti')).toBe(false); // tolerance=0
        expect(fuzzyMatch('trt', 'tri')).toBe(false);
    });

    it('is case insensitive', () => {
        expect(fuzzyMatch('STEROIDS', 'steroids')).toBe(true);
    });
});

// ============================================
// STEMMING
// ============================================

describe('Simple Stemming', () => {
    it('removes -ing suffix', () => {
        expect(simpleStem('eating')).toBe('eat');
        expect(simpleStem('dieting')).toBe('diet');
    });

    it('removes -ed suffix', () => {
        expect(simpleStem('trained')).toBe('train');
        expect(simpleStem('lifted')).toBe('lift');
    });

    it('removes -s suffix', () => {
        expect(simpleStem('steroids')).toBe('steroid');
        expect(simpleStem('cats')).toBe('cat');
    });

    it('removes -ly suffix', () => {
        expect(simpleStem('quickly')).toBe('quick');
    });

    it('leaves unsuffixed words unchanged', () => {
        expect(simpleStem('gym')).toBe('gym');
        expect(simpleStem('bench')).toBe('bench');
    });
});

// ============================================
// FITNESS CONTEXT
// ============================================

describe('Fitness Context Detection', () => {
    it('detects strong context with 2+ keywords', () => {
        expect(hasFitnessContext('I want to workout and lift weights')).toBe(true);
        expect(hasFitnessContext('My squat PR at the gym')).toBe(true);
        expect(hasFitnessContext('Running cardio and strength training')).toBe(true);
    });

    it('does NOT detect context with only 1 keyword', () => {
        expect(hasFitnessContext('I want to run')).toBe(false);
        expect(hasFitnessContext('Going to the gym')).toBe(false);
    });

    it('does NOT detect context in off-topic messages', () => {
        expect(hasFitnessContext('Who is the best basketball player?')).toBe(false);
        expect(hasFitnessContext('Tell me about politics')).toBe(false);
    });
});

// ============================================
// FULL INTEGRATION — checkSensitiveTopicGuardrails
// ============================================

describe('checkSensitiveTopicGuardrails — should block', () => {
    describe('Mental health crisis (exact match)', () => {
        it('blocks "I want to kill myself"', () => {
            expect(checkSensitiveTopicGuardrails('I want to kill myself')).toBe('MENTAL_HEALTH_RESPONSE');
        });
        it('blocks "feeling suicidal"', () => {
            expect(checkSensitiveTopicGuardrails('feeling suicidal')).toBe('MENTAL_HEALTH_RESPONSE');
        });
        it('blocks "end my life"', () => {
            expect(checkSensitiveTopicGuardrails('I want to end my life')).toBe('MENTAL_HEALTH_RESPONSE');
        });
    });

    describe('Eating disorder (exact match)', () => {
        it('blocks "I have anorexia"', () => {
            expect(checkSensitiveTopicGuardrails('I have anorexia')).toBe('EATING_DISORDER_RESPONSE');
        });
        it('blocks "starving myself"', () => {
            expect(checkSensitiveTopicGuardrails('I want to starve myself thin')).toBe('EATING_DISORDER_RESPONSE');
        });
        it('blocks "stop eating completely"', () => {
            expect(checkSensitiveTopicGuardrails('I want to stop eating completely')).toBe('EATING_DISORDER_RESPONSE');
        });
    });

    describe('PED/banned substances (exact match)', () => {
        it('blocks "should I take steroids"', () => {
            expect(checkSensitiveTopicGuardrails('should I take steroids')).toBe('PED_RESPONSE');
        });
        it('blocks "thinking about TRT"', () => {
            expect(checkSensitiveTopicGuardrails('thinking about TRT')).toBe('PED_RESPONSE');
        });
        it('blocks "anabolic cycle"', () => {
            expect(checkSensitiveTopicGuardrails('tell me about an anabolic cycle')).toBe('PED_RESPONSE');
        });
    });

    describe('PED/banned substances (fuzzy match — typos)', () => {
        it('blocks "steriod" (single transposition, distance=1)', () => {
            expect(checkSensitiveTopicGuardrails('steriod cycle')).toBe('PED_RESPONSE');
        });
        it('blocks "steriods" (common typo)', () => {
            expect(checkSensitiveTopicGuardrails('should i do steriods')).toBe('PED_RESPONSE');
        });
    });

    describe('Dangerous exercises (pattern match)', () => {
        it('blocks "train through a torn muscle"', () => {
            expect(checkSensitiveTopicGuardrails('can I train through a torn hamstring')).toBe('DANGEROUS_EXERCISE_RESPONSE');
        });
        it('blocks "lift on no sleep"', () => {
            expect(checkSensitiveTopicGuardrails('is it ok to lift on no sleep')).toBe('DANGEROUS_EXERCISE_RESPONSE');
        });
    });

    describe('Nutrition/diet (exact match)', () => {
        it('blocks "give me a meal plan"', () => {
            expect(checkSensitiveTopicGuardrails('give me a meal plan')).toBe('NUTRITION_RESPONSE');
        });
        it('blocks "calorie deficit question"', () => {
            expect(checkSensitiveTopicGuardrails('how do I set up a calorie deficit')).toBe('NUTRITION_RESPONSE');
        });
    });
});

describe('checkSensitiveTopicGuardrails — should NOT block (false positive tests)', () => {
    describe('Mental health — fitness phrases', () => {
        it('allows "I want to kill this workout"', () => {
            expect(checkSensitiveTopicGuardrails('I want to kill this workout')).toBeNull();
        });
        it('allows "That set killed me"', () => {
            expect(checkSensitiveTopicGuardrails('That set killed me')).toBeNull();
        });
    });

    describe('Anatomy terms — PED false positive regression', () => {
        it('allows "my anterior deltoid is sore from pressing"', () => {
            expect(checkSensitiveTopicGuardrails('my anterior deltoid is sore from pressing')).toBeNull();
        });
        it('allows "deltoid raises for shoulder workout"', () => {
            expect(checkSensitiveTopicGuardrails('deltoid raises for shoulder workout')).toBeNull();
        });
    });

    describe('Ambiguous keywords with fitness context', () => {
        it('allows "cut weight for powerlifting meet" (fitness context present)', () => {
            // "cut" is ambiguous for eating_disorder, but fitness context has squat + powerlifting
            const result = checkSensitiveTopicGuardrails('I need to cut weight for my powerlifting squat meet');
            expect(result).toBeNull();
        });
        it('allows "fasted cardio session" (fitness context present)', () => {
            const result = checkSensitiveTopicGuardrails('doing a fasted cardio run this morning for my training');
            expect(result).toBeNull();
        });
    });

    describe('Workout queries — no false positives', () => {
        it('allows "what is my workout today"', () => {
            expect(checkSensitiveTopicGuardrails('what is my workout today')).toBeNull();
        });
        it('allows "what was our workout in week one"', () => {
            expect(checkSensitiveTopicGuardrails('what was our workout in week one')).toBeNull();
        });
        it('allows "what is my squat PR"', () => {
            expect(checkSensitiveTopicGuardrails('what is my squat PR')).toBeNull();
        });
        it('allows "how have my lifts trended this month"', () => {
            expect(checkSensitiveTopicGuardrails('how have my lifts trended this month')).toBeNull();
        });
        it('allows "show me my recent logs"', () => {
            expect(checkSensitiveTopicGuardrails('show me my recent logs')).toBeNull();
        });
        it('allows "what phase am I in"', () => {
            expect(checkSensitiveTopicGuardrails('what phase am I in')).toBeNull();
        });
        it('allows "what week am I on"', () => {
            expect(checkSensitiveTopicGuardrails('what week am I on')).toBeNull();
        });
    });

    describe('Priority ordering — security before entertainment', () => {
        it('PED response fires before entertainment for ambiguous message', () => {
            // "steroid" is priority 120, entertainment is priority 30
            const result = checkSensitiveTopicGuardrails('what movie does steroid use remind you of');
            expect(result).toBe('PED_RESPONSE');
        });
    });
});

// ============================================
// OUTPUT FILTERING — PII, Credentials, System Leakage
// ============================================

const PII_PATTERNS = {
    phone: /\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
};

const CREDENTIAL_PATTERNS = {
    openaiKey: /\bsk-[A-Za-z0-9]{20,}\b/g,
    jwt: /\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
    genericSecret: /\b(password|secret|token|credential)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi,
};

const SYSTEM_LEAK_PATTERNS = {
    systemPrompt: /\b(system\s*prompt|system\s*instructions|my\s*instructions)\b/gi,
    xmlTags: /<(system_configuration|security_policy|persona_definition|instruction_set)[^>]*>/gi,
    internalRef: /\b(internal\s*error|unauthorized\s*access|admin\s*mode)\b/gi,
};

describe('Output Filtering — PII Detection', () => {
    it('detects phone numbers', () => {
        ['Call me at 555-123-4567', 'My number is (555) 123-4567', 'Contact: +1-555-123-4567'].forEach(r => {
            PII_PATTERNS.phone.lastIndex = 0;
            expect(PII_PATTERNS.phone.test(r)).toBe(true);
        });
    });

    it('detects email addresses', () => {
        ['Email me at john@example.com', 'Contact support@fitness.co'].forEach(r => {
            PII_PATTERNS.email.lastIndex = 0;
            expect(PII_PATTERNS.email.test(r)).toBe(true);
        });
    });

    it('does NOT flag fitness numbers as SSN', () => {
        ['Your squat PR is 315 lbs', 'Do 3x10 at 225', 'Rest for 90 seconds'].forEach(r => {
            PII_PATTERNS.ssn.lastIndex = 0;
            expect(PII_PATTERNS.ssn.test(r)).toBe(false);
        });
    });
});

describe('Output Filtering — Credential Detection', () => {
    it('detects OpenAI API keys', () => {
        CREDENTIAL_PATTERNS.openaiKey.lastIndex = 0;
        expect(CREDENTIAL_PATTERNS.openaiKey.test('Your API key is sk-abcdefghijklmnopqrstuvwxyz123456')).toBe(true);
    });

    it('detects JWT tokens', () => {
        CREDENTIAL_PATTERNS.jwt.lastIndex = 0;
        expect(CREDENTIAL_PATTERNS.jwt.test('Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')).toBe(true);
    });

    it('detects generic secret patterns', () => {
        ['password: mysecretpassword123', 'secret = "super_secret_value"'].forEach(r => {
            CREDENTIAL_PATTERNS.genericSecret.lastIndex = 0;
            expect(CREDENTIAL_PATTERNS.genericSecret.test(r)).toBe(true);
        });
    });

    it('does NOT flag normal coaching responses', () => {
        ['Great job on your workout!', 'Try increasing weight by 5 lbs.', 'Your deadlift form looks good.'].forEach(r => {
            CREDENTIAL_PATTERNS.openaiKey.lastIndex = 0;
            CREDENTIAL_PATTERNS.jwt.lastIndex = 0;
            CREDENTIAL_PATTERNS.genericSecret.lastIndex = 0;
            expect(CREDENTIAL_PATTERNS.openaiKey.test(r)).toBe(false);
            expect(CREDENTIAL_PATTERNS.jwt.test(r)).toBe(false);
            expect(CREDENTIAL_PATTERNS.genericSecret.test(r)).toBe(false);
        });
    });
});

describe('Output Filtering — System Prompt Leakage', () => {
    it('detects system prompt mentions', () => {
        ['According to my system prompt...', 'My instructions say to always...'].forEach(r => {
            SYSTEM_LEAK_PATTERNS.systemPrompt.lastIndex = 0;
            expect(SYSTEM_LEAK_PATTERNS.systemPrompt.test(r)).toBe(true);
        });
    });

    it('detects XML tag leakage', () => {
        ['<system_configuration> revealed...', 'The <security_policy> states...'].forEach(r => {
            SYSTEM_LEAK_PATTERNS.xmlTags.lastIndex = 0;
            expect(SYSTEM_LEAK_PATTERNS.xmlTags.test(r)).toBe(true);
        });
    });

    it('does NOT flag normal coaching responses', () => {
        ['Based on your logs, squat improved 10%.', 'Your instructions for today: warm up, then 5x5 squats.'].forEach(r => {
            SYSTEM_LEAK_PATTERNS.xmlTags.lastIndex = 0;
            SYSTEM_LEAK_PATTERNS.internalRef.lastIndex = 0;
            expect(SYSTEM_LEAK_PATTERNS.xmlTags.test(r)).toBe(false);
            expect(SYSTEM_LEAK_PATTERNS.internalRef.test(r)).toBe(false);
        });
    });
});
