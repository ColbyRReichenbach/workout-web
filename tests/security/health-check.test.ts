import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('Health Check API', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv, HEALTH_CHECK_SECRET: 'test-secret' };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    it('should return minimal status for unauthorized requests (no header)', async () => {
        const req = new NextRequest('http://localhost:3000/api/health');
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({ status: 'ok' });
        expect(data).not.toHaveProperty('checks');
        expect(data).not.toHaveProperty('version');
    });

    it('should return minimal status for unauthorized requests (wrong secret)', async () => {
        const req = new NextRequest('http://localhost:3000/api/health', {
            headers: {
                'x-health-secret': 'wrong-secret',
            },
        });
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({ status: 'ok' });
    });

    it('should return full status for authorized requests', async () => {
        // Mock the Supabase createClient implementation for this test
        const { createClient } = await import('@/utils/supabase/server');
        (createClient as any).mockResolvedValue({
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ error: null }),
                }),
            }),
        });

        const req = new NextRequest('http://localhost:3000/api/health', {
            headers: {
                'x-health-secret': 'test-secret',
            },
        });
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data).toHaveProperty('checks');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('checks.database');
        expect(data).toHaveProperty('checks.environment');
    });

    it('should handle database errors gracefully when authorized', async () => {
        // Mock the Supabase createClient implementation to simulate error
        const { createClient } = await import('@/utils/supabase/server');
        (createClient as any).mockResolvedValue({
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ error: { message: 'DB Error' } }),
                }),
            }),
        });

        const req = new NextRequest('http://localhost:3000/api/health', {
            headers: {
                'x-health-secret': 'test-secret',
            },
        });
        const res = await GET(req);
        const data = await res.json();

        // Should return 503 Service Unavailable when unhealthy
        expect(res.status).toBe(503);
        expect(data.status).toBe('unhealthy');
        expect(data.checks.database.status).toBe('error');
    });
});
