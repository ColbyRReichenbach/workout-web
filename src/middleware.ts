import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create a Supabase client to refresh the session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // check for guest mode cookie
    const isGuest = request.cookies.get('guest-mode')?.value === 'true'

    // PROTECTED ROUTES
    // Dashboard at / and other protected pages require authentication OR guest mode
    if (!user && !isGuest &&
        (request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname.startsWith('/dashboard') ||
            request.nextUrl.pathname.startsWith('/analytics') ||
            request.nextUrl.pathname.startsWith('/workout') ||
            request.nextUrl.pathname.startsWith('/profile') ||
            request.nextUrl.pathname.startsWith('/settings'))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // LOGIN / ONBOARDING PAGE
    // If user is already logged in OR is guest, redirect to home/dashboard
    if ((user || isGuest) && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/onboarding'))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (if any)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
