import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Check if there is an error passed from Supabase (e.g., rate limits, invalid token)
    const authError = searchParams.get('error')
    const authErrorDescription = searchParams.get('error_description')

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (authError) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(authErrorDescription || authError)}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Clear guest mode cookie on successful OAuth login
            const cookieStore = await cookies()
            cookieStore.delete('guest-mode')

            return NextResponse.redirect(`${origin}${next}`)
        } else {
            // exchange failed
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }
    }

    // return the user to an error page if there's no code and no error
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent("Invalid authentication link or missing authentication code.")}`)
}
