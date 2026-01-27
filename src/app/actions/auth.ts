'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { GUEST_MODE_COOKIE, RATE_LIMITS, COMMON_PASSWORDS } from '@/lib/constants'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

// ============================================
// RATE LIMITING
// ============================================

// Initialize Redis and Ratelimit for auth endpoints
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

const authRateLimiter = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(RATE_LIMITS.AUTH.requests, RATE_LIMITS.AUTH.window),
        analytics: true,
        prefix: "@upstash/ratelimit/auth",
    })
    : null;

// In-memory fallback for development
const localRateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function checkAuthRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    // Production: Use Upstash Redis
    if (authRateLimiter) {
        try {
            const { success, remaining } = await authRateLimiter.limit(identifier);
            return { allowed: success, remaining };
        } catch (error) {
            console.error('[Auth RateLimit] Upstash error, falling back to local', error);
        }
    }

    // Dev/Fallback: Use in-memory
    const now = Date.now();
    const record = localRateLimitMap.get(identifier);

    // Cleanup old entries
    if (localRateLimitMap.size > 1000) {
        for (const [key, value] of localRateLimitMap.entries()) {
            if (now > value.resetTime) localRateLimitMap.delete(key);
        }
    }

    if (!record || now > record.resetTime) {
        localRateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMITS.AUTH.windowMs });
        return { allowed: true, remaining: RATE_LIMITS.AUTH.requests - 1 };
    }

    if (record.count >= RATE_LIMITS.AUTH.requests) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMITS.AUTH.requests - record.count };
}

/**
 * Get client IP for rate limiting
 */
async function getClientIp(): Promise<string> {
    const headersList = await headers();
    return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown';
}

// ============================================
// PASSWORD VALIDATION
// ============================================

interface PasswordValidation {
    valid: boolean;
    errors: string[];
}

/**
 * Server-side password validation with strength checks
 */
function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a stronger password.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// ============================================
// AUTH ACTIONS
// ============================================

export async function loginDemoUser() {
    const cookieStore = await cookies()

    // Set the guest-mode cookie with secure configuration
    cookieStore.set(GUEST_MODE_COOKIE.name, GUEST_MODE_COOKIE.value, {
        path: GUEST_MODE_COOKIE.path,
        maxAge: GUEST_MODE_COOKIE.maxAge,
        sameSite: GUEST_MODE_COOKIE.sameSite,
        httpOnly: GUEST_MODE_COOKIE.httpOnly,
        secure: GUEST_MODE_COOKIE.secure,
    })

    redirect('/onboarding')
}

export async function loginWithOAuth(provider: 'google' | 'apple') {
    // Rate limit OAuth attempts
    const ip = await getClientIp();
    const rateLimit = await checkAuthRateLimit(`oauth:${ip}`);

    if (!rateLimit.allowed) {
        return { error: 'Too many login attempts. Please wait a moment before trying again.' };
    }

    // Clear guest mode cookie BEFORE starting OAuth flow
    // This ensures we don't have stale guest state competing with the real login
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_MODE_COOKIE.name)

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

export async function signInWithEmail(formData: FormData): Promise<{ error?: string; success?: string }> {
    // Rate limit login attempts by IP
    const ip = await getClientIp();
    const rateLimit = await checkAuthRateLimit(`login:${ip}`);

    if (!rateLimit.allowed) {
        return { error: 'Too many login attempts. Please wait a moment before trying again.' };
    }

    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Basic validation
    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // Don't reveal if email exists
        return { error: 'Invalid email or password' }
    }

    // Clear guest mode cookie on successful login
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_MODE_COOKIE.name)

    redirect('/')
}

export async function signUpWithEmail(formData: FormData): Promise<{ error?: string; success?: string }> {
    // Rate limit signup attempts by IP
    const ip = await getClientIp();
    const rateLimit = await checkAuthRateLimit(`signup:${ip}`);

    if (!rateLimit.allowed) {
        return { error: 'Too many signup attempts. Please wait a moment before trying again.' };
    }

    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Basic validation
    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return { error: passwordValidation.errors[0] };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/onboarding`,
        }
    })

    if (error) {
        return { error: error.message }
    }

    // If user already exists and is confirmed, they're logged in immediately
    if (data.session) {
        // Clear guest mode cookie on successful signup
        const cookieStore = await cookies()
        cookieStore.delete(GUEST_MODE_COOKIE.name)

        redirect('/onboarding')
    }

    // Otherwise, email confirmation is required
    return { success: "Check your email for a confirmation link to complete signup." }
}

export async function resetPassword(email: string): Promise<{ error?: string; success?: string }> {
    // Rate limit password reset attempts
    const ip = await getClientIp();
    const rateLimit = await checkAuthRateLimit(`reset:${ip}`);

    if (!rateLimit.allowed) {
        return { error: 'Too many requests. Please wait a moment before trying again.' };
    }

    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/settings/profile`,
    })

    if (error) {
        // Don't reveal if email exists for security
        console.error('[Auth] Password reset error:', error.message);
    }

    // Always return success to prevent email enumeration
    return { success: "If an account with that email exists, a password reset link has been sent." }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete(GUEST_MODE_COOKIE.name)

    redirect('/login')
}
