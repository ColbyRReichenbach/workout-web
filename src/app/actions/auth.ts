'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function loginDemoUser() {
    const cookieStore = await cookies()

    // Set the guest-mode cookie
    // Expires in 7 days
    cookieStore.set('guest-mode', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax'
    })

    redirect('/onboarding')
}

export async function loginWithOAuth(provider: 'google' | 'apple') {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        console.error(error)
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('guest-mode')

    redirect('/login')
}
