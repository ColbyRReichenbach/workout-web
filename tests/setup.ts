import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
    })),
    headers: vi.fn(() => new Headers()),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

// Global test utilities
declare global {
     
    var testUtils: {
        mockUser: () => { id: string; email: string }
        mockProfile: () => Record<string, unknown>
    }
}

globalThis.testUtils = {
    mockUser: () => ({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
    }),
    mockProfile: () => ({
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Test User',
        height: "5'10\"",
        weight_lbs: 180,
        units: 'imperial',
        squat_max: 315,
        bench_max: 225,
        deadlift_max: 405,
        current_week: 1,
        current_phase: 1,
    }),
}
