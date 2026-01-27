import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('[Auth Callback] Received request with code:', code ? 'present' : 'missing')
    console.log('[Auth Callback] Origin:', origin, 'Next:', next)

    if (code) {
        // Collect cookies to set - we'll add them to the response after exchange
        const cookiesToSet: { name: string; value: string; options: Partial<ResponseCookie> }[] = []

        // Create Supabase client that collects cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookies) {
                        // Collect cookies with normalized options
                        cookies.forEach(({ name, value, options }) => {
                            // Normalize cookie options for Next.js ResponseCookies
                            const normalizedOptions: Partial<ResponseCookie> = {
                                path: options?.path ?? '/',
                                sameSite: (options?.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none') ?? 'lax',
                                httpOnly: options?.httpOnly ?? true,
                                secure: options?.secure ?? process.env.NODE_ENV === 'production',
                            }

                            // Handle maxAge/expires
                            if (options?.maxAge !== undefined) {
                                normalizedOptions.maxAge = options.maxAge
                            }
                            if (options?.expires) {
                                normalizedOptions.expires = new Date(options.expires)
                            }
                            if (options?.domain) {
                                normalizedOptions.domain = options.domain
                            }

                            console.log('[Auth Callback] Collecting cookie:', name, 'options:', normalizedOptions)
                            cookiesToSet.push({ name, value, options: normalizedOptions })
                        })
                    },
                },
            }
        )

        console.log('[Auth Callback] Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            console.log('[Auth Callback] Session exchange successful for user:', data.user.id)
            console.log('[Auth Callback] Session data present:', !!data.session)
            console.log('[Auth Callback] Cookies to set:', cookiesToSet.length)

            // Create redirect response
            const redirectUrl = `${origin}${next}`
            const response = NextResponse.redirect(redirectUrl)

            // Set all collected session cookies on the response
            cookiesToSet.forEach(({ name, value, options }) => {
                console.log('[Auth Callback] Setting cookie on response:', name)
                response.cookies.set(name, value, options)
            })

            // Clear guest mode cookie
            response.cookies.delete('guest-mode')
            console.log('[Auth Callback] Cleared guest-mode cookie')

            console.log('[Auth Callback] Redirecting to:', redirectUrl)
            return response
        } else {
            console.error('[Auth Callback] Session exchange failed:', error?.message)
            console.error('[Auth Callback] Error details:', JSON.stringify(error))
        }
    } else {
        console.log('[Auth Callback] No code provided in URL')
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
