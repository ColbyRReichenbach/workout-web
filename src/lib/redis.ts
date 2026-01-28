import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as Sentry from '@sentry/nextjs';

// Initialize Redis client
// Fallback to null if env vars are missing (dev mode safety)
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Helper type for Rate Limit Configuration
type RateLimitConfig = {
    requests: number;
    window: any; // Duration string like "1 m", "60 s"
    windowMs: number; // For local fallback
};

// In-memory fallback for Dev/Missing Keys
const localRateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Cleanup old local rate limit entries to prevent memory leaks
 */
function cleanupLocalRateLimit() {
    if (localRateLimitMap.size > 1000) {
        const now = Date.now();
        for (const [key, value] of localRateLimitMap.entries()) {
            if (now > value.resetTime) localRateLimitMap.delete(key);
        }
    }
}

/**
 * Check Rate Limit for a given identifier
 * Uses Upstash Redis in production, falls back to in-memory map if not configured.
 * 
 * IMPORTANT: Ensure the identifier is trusted. If using IP addresses, use the 
 * getClientIp utility from @/lib/ip to avoid spoofing.
 * 
 * @param identifier Unique identifier for the user or IP
 * @param config Rate limit configuration (requests per window)
 * @param prefix Redis key prefix for this limiter
 * @returns { allowed: boolean; remaining: number }
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    prefix: string = "@upstash/ratelimit"
): Promise<{ allowed: boolean; remaining: number }> {

    // 1. Production Mode: Use Upstash
    if (redis) {
        try {
            const ratelimit = new Ratelimit({
                redis: redis,
                limiter: Ratelimit.slidingWindow(config.requests, config.window),
                analytics: true,
                prefix: prefix,
            });

            const { success, remaining } = await ratelimit.limit(identifier);
            return { allowed: success, remaining };
        } catch (error) {
            console.error(`[RateLimit] Upstash error for ${prefix}, falling back to local`, error);
            Sentry.captureException(error);
            // Fallthrough to local on Redis error
        }
    } else {
        // Warning only once per cold boot - maybe skip to avoid noise in dev
        if (process.env.NODE_ENV === 'production') {
            // console.warn(`[RateLimit] Upstash not configured. Using in-memory fallback for ${prefix}.`);
        }
    }

    // 2. Dev/Fallback Mode: Use In-Memory
    const now = Date.now();
    const mapKey = `${prefix}:${identifier}`;
    const record = localRateLimitMap.get(mapKey);

    cleanupLocalRateLimit();

    if (!record || now > record.resetTime) {
        localRateLimitMap.set(mapKey, { count: 1, resetTime: now + config.windowMs });
        return { allowed: true, remaining: config.requests - 1 };
    }

    if (record.count >= config.requests) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: config.requests - record.count };
}
