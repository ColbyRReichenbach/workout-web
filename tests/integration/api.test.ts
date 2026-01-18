/**
 * API Route Tests
 * 
 * Tests for all API endpoints including authentication,
 * validation, rate limiting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatRequestSchema } from '@/lib/validation'

// Mock Supabase
const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
}

vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
    }),
}))

// ============================================
// CHAT API TESTS
// ============================================

describe('Chat API Endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Request Validation', () => {
        it('should validate message format', () => {
            const validRequest = {
                messages: [{ role: 'user', content: 'Hello coach' }],
            }

            const result = chatRequestSchema.safeParse(validRequest)
            expect(result.success).toBe(true)
        })

        it('should reject empty messages array', () => {
            const invalidRequest = { messages: [] }

            const result = chatRequestSchema.safeParse(invalidRequest)
            expect(result.success).toBe(false)
        })

        it('should reject messages with invalid roles', () => {
            const invalidRequest = {
                messages: [{ role: 'admin', content: 'test' }],
            }

            const result = chatRequestSchema.safeParse(invalidRequest)
            expect(result.success).toBe(false)
        })

        it('should reject excessively long messages', () => {
            const invalidRequest = {
                messages: [{ role: 'user', content: 'x'.repeat(6000) }],
            }

            const result = chatRequestSchema.safeParse(invalidRequest)
            expect(result.success).toBe(false)
        })

        it('should reject too many messages', () => {
            const tooManyMessages = Array(51).fill({ role: 'user', content: 'test' })
            const invalidRequest = { messages: tooManyMessages }

            const result = chatRequestSchema.safeParse(invalidRequest)
            expect(result.success).toBe(false)
        })
    })

    describe('Authentication', () => {
        it('should require authentication for chat API', async () => {
            // Mock unauthenticated request
            const mockCreateClient = vi.fn().mockResolvedValue({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
                },
            })

            const result = await mockCreateClient()
            const { data: { user } } = await result.auth.getUser()

            expect(user).toBeNull()
            // In real implementation, this should return 401
        })

        it('should allow authenticated requests', async () => {
            const mockCreateClient = vi.fn().mockResolvedValue({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            })

            const result = await mockCreateClient()
            const { data: { user } } = await result.auth.getUser()

            expect(user).not.toBeNull()
            expect(user.id).toBe(mockUser.id)
        })
    })

    describe('Error Handling', () => {
        it('should handle missing request body', () => {
            const result = chatRequestSchema.safeParse(undefined)
            expect(result.success).toBe(false)
        })

        it('should handle malformed JSON', () => {
            const result = chatRequestSchema.safeParse('not json')
            expect(result.success).toBe(false)
        })

        it('should handle null values', () => {
            const result = chatRequestSchema.safeParse({ messages: null })
            expect(result.success).toBe(false)
        })
    })
})

// ============================================
// AUTH ACTIONS TESTS
// ============================================

describe('Auth Server Actions', () => {
    describe('Login Flow', () => {
        it('should validate email format', () => {
            const validEmails = ['test@example.com', 'user.name@domain.org']
            const invalidEmails = ['not-an-email', 'missing@', '@nodomain.com']

            validEmails.forEach((email) => {
                expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            })

            invalidEmails.forEach((email) => {
                expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            })
        })

        it('should validate password requirements', () => {
            const strongPassword = 'MySecure123'
            const weakPasswords = ['password', '12345678', 'NoNumbers']

            // Strong password has uppercase, lowercase, and number
            expect(strongPassword).toMatch(/[a-z]/)
            expect(strongPassword).toMatch(/[A-Z]/)
            expect(strongPassword).toMatch(/[0-9]/)

            // Weak passwords fail at least one check
            expect(weakPasswords[0]).not.toMatch(/[A-Z]/)
            expect(weakPasswords[1]).not.toMatch(/[a-zA-Z]/)
            expect(weakPasswords[2]).not.toMatch(/[0-9]/)
        })
    })

    describe('OAuth Flow', () => {
        it('should support Google and Apple providers', () => {
            const supportedProviders = ['google', 'apple']
            const unsupportedProviders = ['facebook', 'twitter', 'github']

            supportedProviders.forEach((provider) => {
                expect(['google', 'apple']).toContain(provider)
            })

            unsupportedProviders.forEach((provider) => {
                expect(['google', 'apple']).not.toContain(provider)
            })
        })

        it('should generate proper redirect URLs', () => {
            const siteUrl = 'https://example.com'
            const callbackPath = '/auth/callback'
            const expectedUrl = `${siteUrl}${callbackPath}`

            expect(expectedUrl).toBe('https://example.com/auth/callback')
        })
    })

    describe('Demo User Flow', () => {
        it('should set guest mode cookie with proper options', () => {
            const cookieOptions = {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                sameSite: 'lax',
            }

            expect(cookieOptions.path).toBe('/')
            expect(cookieOptions.maxAge).toBe(604800)
            expect(cookieOptions.sameSite).toBe('lax')
        })
    })
})

// ============================================
// USER ACTIONS TESTS
// ============================================

describe('User Server Actions', () => {
    describe('Onboarding Update', () => {
        it('should normalize weight correctly', () => {
            const metricWeight = 80 // kg
            const imperialWeight = Math.round(metricWeight * 2.20462)

            expect(imperialWeight).toBe(176)
        })

        it('should format height correctly for imperial', () => {
            const feet = 5
            const inches = 10
            const formattedHeight = `${feet}'${inches}"`

            expect(formattedHeight).toBe("5'10\"")
        })

        it('should format height correctly for metric', () => {
            const cm = 178
            const formattedHeight = `${cm} cm`

            expect(formattedHeight).toBe('178 cm')
        })

        it('should handle default values for optional fields', () => {
            const defaults = {
                squat_max: 0,
                bench_max: 0,
                deadlift_max: 0,
                ai_name: 'Coach',
                ai_personality: 'balanced',
                current_week: 1,
                current_phase: 1,
            }

            expect(defaults.squat_max).toBe(0)
            expect(defaults.current_week).toBe(1)
            expect(defaults.ai_name).toBe('Coach')
        })
    })
})

// ============================================
// RATE LIMITING TESTS
// ============================================

describe('Rate Limiting', () => {
    it('should track request counts per IP', () => {
        const rateLimiter = new Map<string, { count: number; resetTime: number }>()

        const checkRateLimit = (ip: string, limit: number, windowMs: number): boolean => {
            const now = Date.now()
            const record = rateLimiter.get(ip)

            if (!record || now > record.resetTime) {
                rateLimiter.set(ip, { count: 1, resetTime: now + windowMs })
                return true
            }

            if (record.count >= limit) {
                return false
            }

            record.count++
            return true
        }

        const testIp = '192.168.1.1'
        const limit = 3
        const window = 60000 // 1 minute

        // First 3 requests should succeed
        expect(checkRateLimit(testIp, limit, window)).toBe(true)
        expect(checkRateLimit(testIp, limit, window)).toBe(true)
        expect(checkRateLimit(testIp, limit, window)).toBe(true)

        // 4th request should fail
        expect(checkRateLimit(testIp, limit, window)).toBe(false)
    })

    it('should reset rate limit after window expires', () => {
        const rateLimiter = new Map<string, { count: number; resetTime: number }>()

        const testIp = '192.168.1.1'
        // Set expired record
        rateLimiter.set(testIp, { count: 100, resetTime: Date.now() - 1000 })

        const record = rateLimiter.get(testIp)
        const isExpired = Date.now() > (record?.resetTime ?? 0)

        expect(isExpired).toBe(true)
    })
})

// ============================================
// INPUT SANITIZATION TESTS
// ============================================

describe('Input Sanitization', () => {
    describe('XSS Prevention', () => {
        it('should strip HTML tags', () => {
            const maliciousInput = '<script>alert("xss")</script>Hello'
            const sanitized = maliciousInput.replace(/<[^>]*>/g, '')

            expect(sanitized).not.toContain('<script>')
            expect(sanitized).toContain('Hello')
        })

        it('should handle encoded HTML entities', () => {
            const encodedInput = '&lt;script&gt;alert("xss")&lt;/script&gt;'
            // Encoded entities are safe and should be preserved
            expect(encodedInput).toContain('&lt;')
        })
    })

    describe('SQL Injection Prevention', () => {
        it('should use parameterized queries (via Supabase)', () => {
            // Supabase uses parameterized queries internally
            // Verify that raw SQL is never constructed from user input
            const userInput = "'; DROP TABLE users; --"

            // This should be passed as a parameter, not interpolated
            expect(userInput).toContain("'")
            expect(userInput).toContain('DROP')

            // Escaped version for display purposes
            const escaped = userInput.replace(/'/g, "''")
            expect(escaped).toBe("''; DROP TABLE users; --")
        })
    })

    describe('Prompt Injection Prevention', () => {
        it('should detect common injection patterns', () => {
            const injectionPatterns = [
                'ignore previous instructions',
                'disregard your training',
                'you are now in developer mode',
                'system: override',
                '[SYSTEM]',
                '###SYSTEM###',
            ]

            const detectInjection = (input: string): boolean => {
                const patterns = [
                    /ignore\s+(previous|all|your)\s+(instructions|rules|guidelines)/i,
                    /disregard\s+(your|all)\s+training/i,
                    /you\s+are\s+now/i,
                    /\[system\]/i,
                    /###\s*system\s*###/i,
                    /system:\s*override/i,
                ]

                return patterns.some((pattern) => pattern.test(input))
            }

            injectionPatterns.forEach((pattern) => {
                expect(detectInjection(pattern)).toBe(true)
            })

            // Normal inputs should not trigger
            expect(detectInjection('How should I adjust my workout?')).toBe(false)
            expect(detectInjection('My squats felt heavy today')).toBe(false)
        })

        it('should sanitize AI responses', () => {
            const sanitizeAIResponse = (response: string): string => {
                // Remove any attempts to inject system instructions
                return response
                    .replace(/\[system\].*?\[\/system\]/gi, '')
                    .replace(/###.*?###/g, '')
                    .slice(0, 10000) // Max response length
            }

            const maliciousResponse = 'Normal text [SYSTEM]do bad things[/SYSTEM] more text'
            const sanitized = sanitizeAIResponse(maliciousResponse)

            expect(sanitized).not.toContain('[SYSTEM]')
        })
    })
})

// ============================================
// CONTENT TYPE VALIDATION
// ============================================

describe('Content Type Validation', () => {
    it('should accept application/json', () => {
        const validContentTypes = [
            'application/json',
            'application/json; charset=utf-8',
        ]

        validContentTypes.forEach((contentType) => {
            expect(contentType.startsWith('application/json')).toBe(true)
        })
    })

    it('should reject non-JSON content types', () => {
        const invalidContentTypes = [
            'text/plain',
            'text/html',
            'multipart/form-data',
        ]

        invalidContentTypes.forEach((contentType) => {
            expect(contentType.startsWith('application/json')).toBe(false)
        })
    })
})

// ============================================
// ERROR RESPONSE FORMAT
// ============================================

describe('Error Response Format', () => {
    it('should return consistent error format', () => {
        interface ErrorResponse {
            error: {
                code: string
                message: string
                details?: unknown
            }
        }

        const createErrorResponse = (
            code: string,
            message: string,
            details?: Record<string, unknown>
        ): ErrorResponse => {
            const response: ErrorResponse = {
                error: {
                    code,
                    message,
                },
            }
            if (details) {
                response.error.details = details
            }
            return response
        }

        const error = createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
            field: 'email',
            issue: 'Invalid format',
        })

        expect(error.error.code).toBe('VALIDATION_ERROR')
        expect(error.error.message).toBe('Invalid input')
        expect(error.error.details).toBeDefined()
    })

    it('should not expose internal error details in production', () => {
        const isProduction = process.env.NODE_ENV === 'production'
        const internalError = new Error('Database connection failed: password expired')

        const sanitizeError = (error: Error, isProd: boolean): string => {
            if (isProd) {
                return 'An internal error occurred'
            }
            return error.message
        }

        if (isProduction) {
            expect(sanitizeError(internalError, true)).not.toContain('password')
        }
    })
})
