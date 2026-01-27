import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        // Create the redirect response FIRST so we can attach cookies to it
        const redirectUrl = `${origin}${next}`
        const response = NextResponse.redirect(redirectUrl)

        // Create Supabase client that writes cookies to the response
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // Set cookies on the response so browser receives them
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            console.log('[Auth Callback] Session exchange successful for user:', data.user.id)

            // Clear guest mode cookie on the response
            response.cookies.delete('guest-mode')
            console.log('[Auth Callback] Cleared guest-mode cookie')

            console.log('[Auth Callback] Redirecting to:', next)
            return response
        } else {
            console.error('[Auth Callback] Session exchange failed:', error?.message)
        }
    } else {
        console.log('[Auth Callback] No code provided in URL')
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
