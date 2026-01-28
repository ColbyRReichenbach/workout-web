import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { APP_CONFIG } from '@/lib/constants';

/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 * Used by load balancers, monitoring systems, and deployment checks.
 *
 * GET /api/health
 */
export async function GET(request: Request) {
    const startTime = Date.now();
    const headers = request.headers;
    const authHeader = headers.get('x-health-secret');
    const expectedSecret = process.env.HEALTH_CHECK_SECRET;

    // Default to minimal response for unauthenticated requests
    const isAuthorized = expectedSecret && authHeader === expectedSecret;

    if (!isAuthorized) {
        return NextResponse.json(
            { status: 'ok' },
            { status: 200 }
        );
    }

    const healthStatus = {
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        version: APP_CONFIG.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: { status: 'unknown' as 'ok' | 'error' | 'unknown', latency: 0 },
            environment: { status: 'ok' as 'ok' | 'error', missing: [] as string[] },
        },
    };

    // Check required environment variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
        (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
        healthStatus.checks.environment = {
            status: 'error',
            missing: missingEnvVars,
        };
        healthStatus.status = 'degraded';
    }

    // Check database connectivity
    try {
        const dbStartTime = Date.now();
        const supabase = await createClient();

        // Simple query to verify database connection
        const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        const dbLatency = Date.now() - dbStartTime;

        if (error) {
            healthStatus.checks.database = {
                status: 'error',
                latency: dbLatency,
            };
            healthStatus.status = 'unhealthy';
        } else {
            healthStatus.checks.database = {
                status: 'ok',
                latency: dbLatency,
            };
        }
    } catch {
        healthStatus.checks.database = {
            status: 'error',
            latency: 0,
        };
        healthStatus.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
        {
            ...healthStatus,
            responseTime,
        },
        {
            status: healthStatus.status === 'healthy' ? 200 :
                healthStatus.status === 'degraded' ? 200 : 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        }
    );
}
