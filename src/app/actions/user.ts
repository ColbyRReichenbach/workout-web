'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { formValuesToInches } from '@/lib/conversions'
import { GUEST_MODE_COOKIE } from '@/lib/constants'
import { BOUNDS } from '@/lib/validation'
import type { UserProfile } from '@/lib/types'

/** Clamp a parsed number to [min, max]; returns fallback if NaN */
function clampNum(value: string | null | undefined, min: number, max: number, fallback = 0): number {
    const n = parseFloat(value ?? '')
    if (isNaN(n)) return fallback
    return Math.max(min, Math.min(max, n))
}

export async function updateOnboardingData(formData: FormData) {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const isGuest = cookieStore.get(GUEST_MODE_COOKIE.name)?.value === GUEST_MODE_COOKIE.value

    const { data: { user } } = await supabase.auth.getUser()

    if (isGuest) {
        redirect('/')
    }

    if (!user) {
        throw new Error("Not authenticated")
    }

    const rawName = formData.get('full_name') as string
    const fullName = rawName?.trim().slice(0, BOUNDS.NAME_MAX_LENGTH) || ''
    if (!fullName) {
        return { error: 'Name is required' }
    }

    const units = (formData.get('units') as string) === 'metric' ? 'metric' : 'imperial'
    const weightRaw = clampNum(formData.get('weight') as string, BOUNDS.WEIGHT_LBS_MIN, BOUNDS.WEIGHT_LBS_MAX)

    // Normalize weight to lbs for DB
    const weightLbs = units === 'metric' ? Math.round(weightRaw * 2.20462) : weightRaw

    // Convert height to total inches for normalized storage
    const heightInches = formValuesToInches(units, {
        feet: formData.get('height_ft') as string,
        inches: formData.get('height_in') as string,
        cm: formData.get('height_cm') as string,
    })

    const liftToLbs = (key: string) => {
        const raw = clampNum(formData.get(key) as string, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX)
        return units === 'metric' ? Math.round(raw * 2.20462) : raw
    }

    // Use upsert to create profile for new OAuth users or update existing
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: fullName,
            height: heightInches, // Stored as total inches (numeric)
            weight_lbs: weightLbs,
            units,
            squat_max: liftToLbs('squat_max'),
            bench_max: liftToLbs('bench_max'),
            deadlift_max: liftToLbs('deadlift_max'),
            // Olympic Lifts
            front_squat_max: liftToLbs('front_squat_max'),
            clean_jerk_max: liftToLbs('clean_jerk_max'),
            snatch_max: liftToLbs('snatch_max'),
            ohp_max: liftToLbs('ohp_max'),
            // Power & Cardio (non-weight, store as-is with sane caps)
            bike_max_watts: clampNum(formData.get('bike_max_watts') as string, 0, 3000),
            mile_time_sec: clampNum(formData.get('mile_time_sec') as string, 0, 3600),
            row_2k_sec: clampNum(formData.get('row_2k_sec') as string, 0, 3600),
            k5_time_sec: clampNum(formData.get('k5_time_sec') as string, 0, 7200),
            sprint_400m_sec: clampNum(formData.get('sprint_400m_sec') as string, 0, 600),
            row_500m_sec: clampNum(formData.get('row_500m_sec') as string, 0, 600),
            ski_1k_sec: clampNum(formData.get('ski_1k_sec') as string, 0, 1800),
            ai_name: (formData.get('ai_name') as string)?.slice(0, BOUNDS.AI_NAME_MAX_LENGTH) || 'Coach',
            ai_personality: formData.get('ai_personality') as string || 'balanced',
            current_week: 1,
            current_phase: 1,
            program_start_date: new Date().toISOString().split('T')[0] // Store as YYYY-MM-DD
        }, { onConflict: 'id' })

    if (error) {
        console.error('Error updating profile:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    redirect('/')
}

// ── Allowed personality values ────────────────────────────────────────────────
const VALID_PERSONALITIES = ['Analytic', 'Coach', 'Stoic', 'balanced'] as const;
const VALID_PRIVACY = ['Analysis', 'Private'] as const;

/**
 * Update user preference fields (AI settings, privacy, units, theme).
 *
 * This server action is the ONLY path through which the app updates these
 * columns. It enforces a strict field allowlist so that no client-side code
 * (or a direct Supabase REST call with a crafted JSON body) can ever set
 * sensitive fields like `is_admin` or `is_demo_account`.
 */
export async function updateUserPreferences(data: {
    ai_name?: string
    ai_personality?: string
    notifications_enabled?: boolean
    data_privacy?: string
    units?: string
    theme?: string
}): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Build a strictly-typed allowlist — NEVER include is_admin, is_demo_account, id, etc.
    const allowed: Record<string, unknown> = {}
    if (data.ai_name !== undefined) {
        allowed.ai_name = String(data.ai_name).trim().slice(0, BOUNDS.AI_NAME_MAX_LENGTH) || 'Coach'
    }
    if (data.ai_personality !== undefined) {
        allowed.ai_personality = (VALID_PERSONALITIES as readonly string[]).includes(data.ai_personality)
            ? data.ai_personality
            : 'Analytic'
    }
    if (data.notifications_enabled !== undefined) {
        allowed.notifications_enabled = Boolean(data.notifications_enabled)
    }
    if (data.data_privacy !== undefined) {
        allowed.data_privacy = (VALID_PRIVACY as readonly string[]).includes(data.data_privacy)
            ? data.data_privacy
            : 'Private'
    }
    if (data.units !== undefined) {
        allowed.units = String(data.units)
    }
    if (data.theme !== undefined) {
        allowed.theme = String(data.theme)
    }

    if (Object.keys(allowed).length === 0) return { success: true }

    const { error } = await supabase.from('profiles').update(allowed).eq('id', user.id)
    if (error) {
        console.error('[updateUserPreferences]', error)
        return { error: error.message }
    }
    return { success: true }
}

/**
 * Update the user's training metrics (lifts, cardio benchmarks, weight, height,
 * current week/phase, program start date).
 *
 * Explicit field allowlist — never touches is_admin or other privilege fields.
 * All numeric values are clamped to sane ranges.
 */
export async function updateProfileMetrics(data: {
    weight_lbs?: number | null
    height?: number | null
    squat_max?: number | null
    bench_max?: number | null
    deadlift_max?: number | null
    front_squat_max?: number | null
    clean_jerk_max?: number | null
    snatch_max?: number | null
    ohp_max?: number | null
    mile_time_sec?: number | null
    k5_time_sec?: number | null
    sprint_400m_sec?: number | null
    row_2k_sec?: number | null
    row_500m_sec?: number | null
    ski_1k_sec?: number | null
    bike_max_watts?: number | null
    current_week?: number
    current_phase?: number
    program_start_date?: string | null
}): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const clamp = (v: number | null | undefined, min: number, max: number) =>
        v == null || isNaN(v) ? null : Math.max(min, Math.min(max, v))

    // Strict allowlist — only training metric columns
    const allowed: Partial<Record<keyof UserProfile, unknown>> = {
        weight_lbs: clamp(data.weight_lbs, BOUNDS.WEIGHT_LBS_MIN, BOUNDS.WEIGHT_LBS_MAX),
        height: data.height == null ? null : Math.max(0, Math.min(120, data.height)),
        squat_max: clamp(data.squat_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        bench_max: clamp(data.bench_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        deadlift_max: clamp(data.deadlift_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        front_squat_max: clamp(data.front_squat_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        clean_jerk_max: clamp(data.clean_jerk_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        snatch_max: clamp(data.snatch_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        ohp_max: clamp(data.ohp_max, BOUNDS.MAX_LIFT_MIN, BOUNDS.MAX_LIFT_MAX),
        mile_time_sec: clamp(data.mile_time_sec, 0, 3600),
        k5_time_sec: clamp(data.k5_time_sec, 0, 7200),
        sprint_400m_sec: clamp(data.sprint_400m_sec, 0, 600),
        row_2k_sec: clamp(data.row_2k_sec, 0, 3600),
        row_500m_sec: clamp(data.row_500m_sec, 0, 600),
        ski_1k_sec: clamp(data.ski_1k_sec, 0, 1800),
        bike_max_watts: clamp(data.bike_max_watts, 0, 3000),
        current_week: data.current_week != null ? Math.max(1, Math.min(52, Math.round(data.current_week))) : undefined,
        current_phase: data.current_phase != null ? Math.max(1, Math.min(5, Math.round(data.current_phase))) : undefined,
        program_start_date: data.program_start_date ?? null,
    }

    // Strip undefined entries
    const payload = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined))

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
    if (error) {
        console.error('[updateProfileMetrics]', error)
        return { error: error.message }
    }
    return { success: true }
}

/**
 * Update a single PR-tracked field on the user's profile (e.g. squat_max,
 * mile_time_sec). Accepts only a strict set of known profile PR keys.
 *
 * Called by the workout page when a new PR is detected — replaces the direct
 * client-side supabase.update call so no other column can be injected.
 */
const PR_ALLOWED_KEYS = new Set<keyof UserProfile>([
    'squat_max', 'bench_max', 'deadlift_max',
    'front_squat_max', 'clean_jerk_max', 'snatch_max', 'ohp_max',
    'mile_time_sec', 'k5_time_sec', 'sprint_400m_sec',
    'row_2k_sec', 'row_500m_sec', 'ski_1k_sec', 'bike_max_watts',
])

export async function updatePrMax(
    field: keyof UserProfile,
    value: number
): Promise<{ error?: string; success?: boolean }> {
    if (!PR_ALLOWED_KEYS.has(field)) {
        console.error('[updatePrMax] Rejected disallowed field:', field)
        return { error: 'Invalid field' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id)
    if (error) {
        console.error('[updatePrMax]', error)
        return { error: error.message }
    }
    return { success: true }
}
