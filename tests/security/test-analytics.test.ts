import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../src/app/api/test-analytics/route';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('Integration: /api/test-analytics Security', () => {
    it('returns 401 if user is not authenticated', async () => {
        // Mock unauthenticated state
        const mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No user') }),
            },
        };
        (createClient as any).mockResolvedValue(mockSupabase);

        const response = await GET();

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('returns data only for the authenticated user', async () => {
        // Mock authenticated state
        const mockUser = { id: 'test-user-123' };
        const mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), // Crucial: Must be called
        };
        (createClient as any).mockResolvedValue(mockSupabase);

        // Mock data return
        mockSupabase.order.mockResolvedValue({ data: [], error: null });

        await GET();

        // Verify that .eq('user_id', ...) was called for safety
        expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
});
