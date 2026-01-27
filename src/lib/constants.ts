/**
 * Application Constants
 *
 * Centralized constants used across the application.
 * Security-sensitive values and shared identifiers.
 */

// ============================================
// USER CONSTANTS
// ============================================

/**
 * Demo user ID for guest mode.
 * This user has pre-populated sample data in the database.
 * Used when no authenticated user is present but guest-mode cookie is set.
 */
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Guest mode cookie configuration
 * Note: Not httpOnly so client can detect guest mode for UI purposes.
 * This is safe since it's just a mode indicator, not a session token.
 */
export const GUEST_MODE_COOKIE = {
    name: 'guest-mode',
    value: 'true',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: false, // Allow client-side access for UI detection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
} as const;

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMITS = {
    /** AI Chat API rate limit */
    CHAT: {
        requests: 20,
        windowMs: 60000, // 1 minute
        window: '1 m', // Upstash format
    },
    /** Auth endpoints rate limit (login, signup, reset) */
    AUTH: {
        requests: 5,
        windowMs: 60000, // 1 minute
        window: '1 m',
    },
    /** General API rate limit */
    API: {
        requests: 100,
        windowMs: 60000, // 1 minute
        window: '1 m',
    },
} as const;

// ============================================
// SECURITY
// ============================================

/**
 * Common weak passwords that should be rejected.
 * This is a small sample - in production, use a larger dictionary.
 */
export const COMMON_PASSWORDS = new Set([
    'password',
    'password1',
    'password123',
    '123456',
    '12345678',
    '123456789',
    'qwerty',
    'qwerty123',
    'abc123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'login',
    'admin',
    'passw0rd',
    'p@ssword',
    'iloveyou',
    'sunshine',
    'princess',
    'football',
    'baseball',
    'soccer',
    'hockey',
    'batman',
    'superman',
    'trustno1',
    'whatever',
    'qazwsx',
]);

/**
 * Password validation requirements description
 */
export const PASSWORD_REQUIREMENTS = [
    'At least 8 characters long',
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one number',
    'At least one special character (!@#$%^&*)',
    'Not a commonly used password',
] as const;

// ============================================
// APPLICATION
// ============================================

export const APP_CONFIG = {
    name: 'Pulse Tracker',
    description: 'Elite Training Dashboard with AI Coaching',
    version: '0.1.0',
} as const;

// ============================================
// CHECKPOINT WEEKS
// ============================================

/**
 * Weeks when checkpoint tests should be performed
 */
export const CHECKPOINT_WEEKS = [8, 20, 37, 44, 51] as const;

// ============================================
// TRAINING PHASES
// ============================================

export const TRAINING_PHASES = {
    1: { name: 'Foundation', weeks: [1, 8] },
    2: { name: 'Build', weeks: [9, 20] },
    3: { name: 'Peak', weeks: [21, 37] },
    4: { name: 'Maintain', weeks: [38, 44] },
    5: { name: 'Test', weeks: [45, 52] },
} as const;
