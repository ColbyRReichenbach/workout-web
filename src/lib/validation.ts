/**
 * Validation Utilities
 * 
 * Centralized validation logic for all user inputs, API payloads,
 * and database operations. Ensures data integrity and security.
 */

import { z } from 'zod'

// ============================================
// CONSTANTS & BOUNDS
// ============================================

export const BOUNDS = {
    // User metrics
    WEIGHT_LBS_MIN: 50,
    WEIGHT_LBS_MAX: 700,
    HEIGHT_FT_MIN: 3,
    HEIGHT_FT_MAX: 8,
    HEIGHT_IN_MIN: 0,
    HEIGHT_IN_MAX: 11,
    HEIGHT_CM_MIN: 90,
    HEIGHT_CM_MAX: 250,

    // Lifting maxes (in lbs)
    MAX_LIFT_MIN: 0,
    MAX_LIFT_MAX: 1500, // World record deadlift is ~1100lbs

    // Workout tracking
    SETS_MIN: 1,
    SETS_MAX: 20,
    REPS_MIN: 1,
    REPS_MAX: 100,
    RPE_MIN: 1,
    RPE_MAX: 10,
    WEIGHT_MIN: 0,
    WEIGHT_MAX: 2000,
    DURATION_MIN: 0,
    DURATION_MAX: 480, // 8 hours max workout

    // Biometrics
    HRV_MIN: 5,
    HRV_MAX: 200,
    HR_MIN: 30,
    HR_MAX: 250,
    SLEEP_HOURS_MIN: 0,
    SLEEP_HOURS_MAX: 24,
    BODY_FAT_MIN: 1,
    BODY_FAT_MAX: 70,

    // Phases & Weeks
    PHASE_MIN: 1,
    PHASE_MAX: 10,
    WEEK_MIN: 1,
    WEEK_MAX: 52,

    // AI Chat
    MESSAGE_MAX_LENGTH: 5000,
    AI_NAME_MAX_LENGTH: 50,
    NOTES_MAX_LENGTH: 2000,

    // Security
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 254,
    NAME_MAX_LENGTH: 100,
} as const

// ============================================
// BASE SCHEMAS
// ============================================

export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .max(BOUNDS.EMAIL_MAX_LENGTH, `Email must be less than ${BOUNDS.EMAIL_MAX_LENGTH} characters`)
    .email('Invalid email address')
    .transform((v) => v.toLowerCase().trim())

import { COMMON_PASSWORDS } from '@/lib/constants';

export const passwordSchema = z
    .string()
    .min(BOUNDS.PASSWORD_MIN_LENGTH, `Password must be at least ${BOUNDS.PASSWORD_MIN_LENGTH} characters`)
    .max(BOUNDS.PASSWORD_MAX_LENGTH, `Password must be less than ${BOUNDS.PASSWORD_MAX_LENGTH} characters`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character (!@#$%^&*)')
    .refine(
        (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
        'This password is too common. Please choose a stronger password.'
    )

export const uuidSchema = z.string().uuid('Invalid UUID format')

// ============================================
// USER PROFILE SCHEMAS
// ============================================

export const unitsSchema = z.enum(['imperial', 'metric'])

export const heightImperialSchema = z.object({
    feet: z.coerce
        .number()
        .int()
        .min(BOUNDS.HEIGHT_FT_MIN, `Height must be at least ${BOUNDS.HEIGHT_FT_MIN} feet`)
        .max(BOUNDS.HEIGHT_FT_MAX, `Height cannot exceed ${BOUNDS.HEIGHT_FT_MAX} feet`),
    inches: z.coerce
        .number()
        .int()
        .min(BOUNDS.HEIGHT_IN_MIN, 'Inches cannot be negative')
        .max(BOUNDS.HEIGHT_IN_MAX, 'Inches must be less than 12'),
})

export const heightMetricSchema = z.coerce
    .number()
    .min(BOUNDS.HEIGHT_CM_MIN, `Height must be at least ${BOUNDS.HEIGHT_CM_MIN} cm`)
    .max(BOUNDS.HEIGHT_CM_MAX, `Height cannot exceed ${BOUNDS.HEIGHT_CM_MAX} cm`)

export const weightSchema = z.coerce
    .number()
    .min(BOUNDS.WEIGHT_LBS_MIN, `Weight must be at least ${BOUNDS.WEIGHT_LBS_MIN}`)
    .max(BOUNDS.WEIGHT_LBS_MAX, `Weight cannot exceed ${BOUNDS.WEIGHT_LBS_MAX}`)

export const liftMaxSchema = z.coerce
    .number()
    .min(BOUNDS.MAX_LIFT_MIN, 'Max cannot be negative')
    .max(BOUNDS.MAX_LIFT_MAX, `Max cannot exceed ${BOUNDS.MAX_LIFT_MAX} lbs`)

export const profileSchema = z.object({
    full_name: z
        .string()
        .min(1, 'Name is required')
        .max(BOUNDS.NAME_MAX_LENGTH, `Name must be less than ${BOUNDS.NAME_MAX_LENGTH} characters`)
        .transform((v) => v.trim()),
    units: unitsSchema,
    weight: weightSchema,
    squat_max: liftMaxSchema.optional(),
    bench_max: liftMaxSchema.optional(),
    deadlift_max: liftMaxSchema.optional(),
    ai_name: z
        .string()
        .max(BOUNDS.AI_NAME_MAX_LENGTH, `AI name must be less than ${BOUNDS.AI_NAME_MAX_LENGTH} characters`)
        .optional(),
    ai_personality: z.string().optional(),
})

export const onboardingSchema = z.object({
    full_name: profileSchema.shape.full_name,
    units: unitsSchema,
    weight: weightSchema,
    height_ft: z.coerce.number().optional(),
    height_in: z.coerce.number().optional(),
    height_cm: z.coerce.number().optional(),
    squat_max: liftMaxSchema.optional().default(0),
    bench_max: liftMaxSchema.optional().default(0),
    deadlift_max: liftMaxSchema.optional().default(0),
    ai_name: z.string().max(BOUNDS.AI_NAME_MAX_LENGTH).optional().default('Coach'),
    ai_personality: z.string().optional().default('balanced'),
}).refine((data) => {
    if (data.units === 'imperial') {
        return data.height_ft !== undefined && data.height_ft >= BOUNDS.HEIGHT_FT_MIN
    }
    return data.height_cm !== undefined && data.height_cm >= BOUNDS.HEIGHT_CM_MIN
}, {
    message: 'Height is required',
    path: ['height'],
})

// ============================================
// WORKOUT TRACKING SCHEMAS
// ============================================

export const rpeSchema = z.coerce
    .number()
    .min(BOUNDS.RPE_MIN, `RPE must be at least ${BOUNDS.RPE_MIN}`)
    .max(BOUNDS.RPE_MAX, `RPE cannot exceed ${BOUNDS.RPE_MAX}`)

export const setLogSchema = z.object({
    weight: z.coerce
        .number()
        .min(BOUNDS.WEIGHT_MIN, 'Weight cannot be negative')
        .max(BOUNDS.WEIGHT_MAX, `Weight cannot exceed ${BOUNDS.WEIGHT_MAX}`),
    reps: z.coerce
        .number()
        .int()
        .min(BOUNDS.REPS_MIN, `Reps must be at least ${BOUNDS.REPS_MIN}`)
        .max(BOUNDS.REPS_MAX, `Reps cannot exceed ${BOUNDS.REPS_MAX}`),
    rpe: rpeSchema.optional(),
})

export const strengthLogSchema = z.object({
    sets: z.array(setLogSchema).min(1, 'At least one set is required').max(BOUNDS.SETS_MAX),
    notes: z.string().max(BOUNDS.NOTES_MAX_LENGTH).optional(),
})

export const cardioLogSchema = z.object({
    duration_min: z.coerce
        .number()
        .min(BOUNDS.DURATION_MIN, 'Duration cannot be negative')
        .max(BOUNDS.DURATION_MAX, `Duration cannot exceed ${BOUNDS.DURATION_MAX} minutes`),
    distance: z.coerce.number().min(0).optional(),
    avg_hr: z.coerce
        .number()
        .min(BOUNDS.HR_MIN, `Heart rate must be at least ${BOUNDS.HR_MIN}`)
        .max(BOUNDS.HR_MAX, `Heart rate cannot exceed ${BOUNDS.HR_MAX}`)
        .optional(),
    notes: z.string().max(BOUNDS.NOTES_MAX_LENGTH).optional(),
})

export const metconLogSchema = z.object({
    time_seconds: z.coerce.number().min(0).max(BOUNDS.DURATION_MAX * 60).optional(),
    rounds: z.coerce.number().int().min(0).max(100).optional(),
    reps: z.coerce.number().int().min(0).max(1000).optional(),
    notes: z.string().max(BOUNDS.NOTES_MAX_LENGTH).optional(),
})

export const sessionLogSchema = z.object({
    session_rpe: rpeSchema,
    notes: z.string().max(BOUNDS.NOTES_MAX_LENGTH).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
})

// ============================================
// PERFORMANCE DATA SCHEMA (JSONB validation)
// ============================================

/**
 * Validates the performance_data JSONB field in logs table
 * Supports strength, cardio, and metcon workout types
 */
export const performanceDataSchema = z.object({
    // Strength training sets
    sets: z.array(z.object({
        weight: z.number().min(0).max(BOUNDS.WEIGHT_MAX).optional(),
        reps: z.number().int().min(0).max(BOUNDS.REPS_MAX).optional(),
        rpe: z.number().min(BOUNDS.RPE_MIN).max(BOUNDS.RPE_MAX).optional(),
    })).optional(),

    // Single set values (legacy format)
    weight: z.number().min(0).max(BOUNDS.WEIGHT_MAX).optional(),
    reps: z.number().int().min(0).max(BOUNDS.REPS_MAX).optional(),

    // Metcon / AMRAP
    rounds: z.number().int().min(0).max(100).optional(),
    additional_reps: z.number().int().min(0).max(1000).optional(),
    time_seconds: z.number().min(0).max(BOUNDS.DURATION_MAX * 60).optional(),

    // Cardio
    distance: z.number().min(0).optional(), // Value in storage units (usually miles) OR raw if unit is provided
    unit: z.string().optional(), // 'km', 'm', 'mi'
    duration_min: z.number().min(0).max(BOUNDS.DURATION_MAX).optional(),
    avg_hr: z.number().min(BOUNDS.HR_MIN).max(BOUNDS.HR_MAX).optional(),
    pace: z.string().max(20).optional(),

    // General
    notes: z.string().max(BOUNDS.NOTES_MAX_LENGTH).optional(),
}).passthrough().superRefine((data, ctx) => {
    // Distance Guardrails based on Unit
    if (data.distance !== undefined && data.distance !== null) {
        // If unit is explicitly 'km'
        if (data.unit === 'km') {
            if (data.distance > 100) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Distance cannot exceed 100km. Did you mean meters?",
                    path: ["distance"]
                });
            }
        }
        // If unit is explicitly 'm' (meters)
        else if (data.unit === 'm') {
            if (data.distance > 100000) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Distance cannot exceed 100,000m.",
                    path: ["distance"]
                });
            }
        }
        // If unit is 'mi' or undefined (storage default), cap at reasonable ultra distance (e.g. 300 miles)
        // This catches the '5000' anomaly if it leaks into storage units
        else {
            if (data.distance > 300) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Distance outlier detected (>300 miles). Please check your input.",
                    path: ["distance"]
                });
            }
        }
    }
})

/**
 * Safely validate performance data before database insert
 */
export function validatePerformanceData(data: unknown): { success: true; data: z.infer<typeof performanceDataSchema> } | { success: false; error: string } {
    const result = performanceDataSchema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, error: result.error.message }
}

// ============================================
// BIOMETRIC SCHEMAS
// ============================================

export const sleepLogSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    in_bed_minutes: z.coerce.number().min(0).max(BOUNDS.SLEEP_HOURS_MAX * 60).optional(),
    asleep_minutes: z.coerce.number().min(0).max(BOUNDS.SLEEP_HOURS_MAX * 60).optional(),
    deep_sleep_minutes: z.coerce.number().min(0).max(BOUNDS.SLEEP_HOURS_MAX * 60).optional(),
    rem_sleep_minutes: z.coerce.number().min(0).max(BOUNDS.SLEEP_HOURS_MAX * 60).optional(),
    hrv_ms: z.coerce
        .number()
        .min(BOUNDS.HRV_MIN, `HRV must be at least ${BOUNDS.HRV_MIN}`)
        .max(BOUNDS.HRV_MAX, `HRV cannot exceed ${BOUNDS.HRV_MAX}`)
        .optional(),
    resting_hr: z.coerce
        .number()
        .min(BOUNDS.HR_MIN)
        .max(BOUNDS.HR_MAX)
        .optional(),
})

export const readinessLogSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    readiness_score: z.coerce.number().int().min(0).max(100).optional(),
    recovery_status: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
})

// ============================================
// AI CHAT SCHEMAS
// ============================================

// AI SDK v6 uses parts array for message content
const textPartSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
})

const filePartSchema = z.object({
    type: z.literal('file'),
    data: z.string().optional(),
    mimeType: z.string().optional(),
})

const reasoningPartSchema = z.object({
    type: z.literal('reasoning'),
    reasoning: z.string(),
})

const toolCallPartSchema = z.object({
    type: z.literal('tool-call'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.any(),
})

const toolResultPartSchema = z.object({
    type: z.literal('tool-result'),
    toolCallId: z.string(),
    toolName: z.string(),
    result: z.any(),
})

const messagePartSchema = z.discriminatedUnion('type', [
    textPartSchema,
    filePartSchema,
    reasoningPartSchema,
    toolCallPartSchema,
    toolResultPartSchema,
])

// Support both legacy content string and new parts array format
export const chatMessageSchema = z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    // Legacy format: content as string
    content: z
        .string()
        .max(BOUNDS.MESSAGE_MAX_LENGTH, `Message cannot exceed ${BOUNDS.MESSAGE_MAX_LENGTH} characters`)
        .optional(),
    // AI SDK v6 format: parts array
    parts: z.array(messagePartSchema).optional(),
}).refine(
    (msg) => msg.content || (msg.parts && msg.parts.length > 0),
    { message: 'Message must have either content or parts' }
)

export const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1).max(50),
    userDay: z.string().optional(), // Optional localized day (e.g., 'TUESDAY')
})

/**
 * Extract text content from a message (handles both legacy and v6 formats)
 */
export function extractMessageContent(message: { content?: string; parts?: Array<{ type: string; text?: string; reasoning?: string }> }): string {
    if (message.content) {
        return message.content;
    }
    if (message.parts) {
        return message.parts
            .map(p => {
                if (p.type === 'text' && typeof p.text === 'string') return p.text;
                if (p.type === 'reasoning' && typeof p.reasoning === 'string') return p.reasoning;
                return '';
            })
            .filter(Boolean)
            .join('\n');
    }
    return '';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Safely parse form data with a schema
 */
export function parseFormData<T extends z.ZodSchema>(
    schema: T,
    formData: FormData
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
    const data: Record<string, unknown> = {}
    formData.forEach((value, key) => {
        data[key] = value
    })
    return schema.safeParse(data) as { success: true; data: z.infer<T> } | { success: false; error: z.ZodError }
}

/**
 * Validate and sanitize user input
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
    return input
        .slice(0, maxLength)
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .trim()
}

/**
 * Check if a value is within bounds
 */
export function isWithinBounds(
    value: number,
    min: number,
    max: number
): boolean {
    return !isNaN(value) && value >= min && value <= max
}

/**
 * Clamp a value to specified bounds
 */
export function clampToBounds(
    value: number,
    min: number,
    max: number
): number {
    if (isNaN(value)) return min
    return Math.max(min, Math.min(max, value))
}

/**
 * Convert kg to lbs with bounds checking
 */
export function kgToLbs(kg: number): number {
    const lbs = Math.round(kg * 2.20462)
    return clampToBounds(lbs, BOUNDS.WEIGHT_LBS_MIN, BOUNDS.WEIGHT_LBS_MAX)
}

/**
 * Convert lbs to kg with bounds checking
 */
export function lbsToKg(lbs: number): number {
    const kg = Math.round(lbs / 2.20462)
    return clampToBounds(kg, Math.round(BOUNDS.WEIGHT_LBS_MIN / 2.20462), Math.round(BOUNDS.WEIGHT_LBS_MAX / 2.20462))
}

/**
 * Estimate 1RM from weight and reps (Epley formula)
 * Includes bounds checking to prevent unrealistic values
 */
export function estimate1RM(weight: number, reps: number): number {
    if (!isWithinBounds(weight, 0, BOUNDS.WEIGHT_MAX)) return 0
    if (!isWithinBounds(reps, 1, BOUNDS.REPS_MAX)) return 0

    // Epley formula is less accurate above 10 reps
    if (reps === 1) return weight

    const estimated = Math.round(weight * (1 + reps / 30))
    return clampToBounds(estimated, 0, BOUNDS.MAX_LIFT_MAX)
}

/**
 * Calculate percentage of 1RM with bounds
 */
export function calculatePercentage1RM(max: number, percentage: number): number {
    if (!isWithinBounds(max, 0, BOUNDS.MAX_LIFT_MAX)) return 0
    if (!isWithinBounds(percentage, 0, 1)) return 0

    // Round to nearest 5 for practical use
    return Math.round((max * percentage) / 5) * 5
}
