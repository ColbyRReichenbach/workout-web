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

export async function signInWithEmail(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/onboarding')
}

export async function resetPassword(email: string) {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/settings/profile`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: "Password reset link sent to your email." }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('guest-mode')

    redirect('/login')
}
