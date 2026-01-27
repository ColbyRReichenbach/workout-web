import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        // Collect cookies to set on the redirect response
        const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookies) {
                        // Collect cookies - they'll be set on the response
                        cookiesToSet.push(...cookies)
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Create redirect response and set session cookies on it
            const response = NextResponse.redirect(`${origin}${next}`)
            cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
            })
            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
