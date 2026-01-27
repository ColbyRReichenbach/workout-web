'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { formValuesToInches } from '@/lib/conversions'
import { GUEST_MODE_COOKIE } from '@/lib/constants'

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

    const fullName = formData.get('full_name') as string
    const units = (formData.get('units') as string) === 'metric' ? 'metric' : 'imperial'
    const weightVal = parseFloat(formData.get('weight') as string)

    // Normalize weight to lbs for DB
    const weightLbs = units === 'metric' ? Math.round(weightVal * 2.20462) : weightVal

    // Convert height to total inches for normalized storage
    const heightInches = formValuesToInches(units, {
        feet: formData.get('height_ft') as string,
        inches: formData.get('height_in') as string,
        cm: formData.get('height_cm') as string,
    })

    const squatMax = parseFloat(formData.get('squat_max') as string) || 0
    const benchMax = parseFloat(formData.get('bench_max') as string) || 0
    const deadliftMax = parseFloat(formData.get('deadlift_max') as string) || 0

    // Units for maxes also need normalization if we want DB to stay in lbs
    const squatLbs = units === 'metric' ? Math.round(squatMax * 2.20462) : squatMax
    const benchLbs = units === 'metric' ? Math.round(benchMax * 2.20462) : benchMax
    const deadliftLbs = units === 'metric' ? Math.round(deadliftMax * 2.20462) : deadliftMax

    const aiName = formData.get('ai_name') as string
    const aiPersonality = formData.get('ai_personality') as string

    // Use upsert to create profile for new OAuth users or update existing
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: fullName,
            height: heightInches, // Stored as total inches (numeric)
            weight_lbs: weightLbs,
            units,
            squat_max: squatLbs,
            bench_max: benchLbs,
            deadlift_max: deadliftLbs,
            ai_name: aiName,
            ai_personality: aiPersonality,
            current_week: 1,
            current_phase: 1
        }, { onConflict: 'id' })

    if (error) {
        console.error('Error updating profile:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    redirect('/')
}
