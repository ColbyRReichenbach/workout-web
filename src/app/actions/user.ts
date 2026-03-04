'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { formValuesToInches } from '@/lib/conversions'
import { GUEST_MODE_COOKIE } from '@/lib/constants'
import { BOUNDS } from '@/lib/validation'

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
