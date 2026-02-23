import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    console.log('[Auth Callback] Hit the callback route:', request.url)
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Check if there is an error passed from Supabase (e.g., rate limits, invalid token)
    const authError = searchParams.get('error')
    const authErrorDescription = searchParams.get('error_description')

    // if "next" is in param, use it as the redirect URL
    let next = searchParams.get('next') ?? '/'

    if (authError) {
        console.error('[Auth Callback] Supabase Auth Error from URL:', authError, authErrorDescription)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(authErrorDescription || authError)}`)
    }

    if (code) {
        console.log('[Auth Callback] Code found in URL, exchanging for session...')
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[Auth Callback] Successfully exchanged code for session. User ID:', data.user?.id)

            // Ensure the user has a profile record
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .single()

                if (!profile) {
                    console.log('[Auth Callback] Profile not found, creating one for OAuth user...')
                    const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || null

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                full_name: fullName,
                                ai_name: 'ECHO-P1',
                                ai_personality: 'Stoic',
                                units: 'Imperial (lb)',
                                theme: 'Pulse Light',
                            }
                        ])

                    if (profileError) {
                        console.error('[Auth Callback] Failed to create profile:', profileError)
                    } else {
                        console.log('[Auth Callback] Profile created successfully!')
                        next = '/onboarding'
                    }
                }
            }

            // Clear guest mode cookie on successful OAuth login
            const cookieStore = await cookies()
            cookieStore.delete('guest-mode')

            console.log(`[Auth Callback] Redirecting to: ${origin}${next}`)
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            // exchange failed
            console.error('[Auth Callback] exchangeCodeForSession failed:', error)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }
    }

    console.warn('[Auth Callback] No code and no error found in URL. Redirecting to error page.')
    // return the user to an error page if there's no code and no error
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent("Invalid authentication link or missing authentication code.")}`)
}
