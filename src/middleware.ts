import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip middleware for auth callback to avoid interfering with session exchange
    if (pathname.startsWith('/auth/callback')) {
        return NextResponse.next()
    }

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

    // Debug logging for auth issues
    if (pathname === '/' || pathname.startsWith('/profile') || pathname.startsWith('/settings')) {
        console.log('[Middleware]', pathname, '- User:', user?.id ?? 'null', '- Guest:', isGuest)
    }

    // PROTECTED ROUTES
    // Dashboard at / and other protected pages require authentication OR guest mode
    const isProtectedRoute =
        pathname === '/' ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/analytics') ||
        pathname.startsWith('/workout') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/settings')

    if (!user && !isGuest && isProtectedRoute) {
        console.log('[Middleware] Redirecting unauthenticated user to /login from:', pathname)
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // LOGIN / ONBOARDING PAGE
    // If user is already logged in OR is guest, redirect to home/dashboard
    if ((user || isGuest) && (pathname.startsWith('/login') || pathname.startsWith('/onboarding'))) {
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
