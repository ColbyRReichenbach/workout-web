/**
 * API Helper Utilities
 *
 * Provides consistent response formatting, error handling,
 * and retry logic for API endpoints and server actions.
 */

import { NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    shouldRetry?: (error: unknown) => boolean;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    shouldRetry: (error: unknown) => {
        // Retry on network errors and 5xx responses
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (
                message.includes('network') ||
                message.includes('timeout') ||
                message.includes('econnreset') ||
                message.includes('rate limit') ||
                message.includes('429') ||
                message.includes('500') ||
                message.includes('502') ||
                message.includes('503') ||
                message.includes('504')
            );
        }
        return false;
    },
};

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Create a successful API response
 */
export function successResponse<T>(
    data: T,
    status: number = 200,
    headers?: HeadersInit
): NextResponse {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
        },
    };

    return NextResponse.json(response, { status, headers });
}

/**
 * Create an error API response
 */
export function errorResponse(
    code: string,
    message: string,
    status: number = 500,
    details?: unknown
): NextResponse {
    const error: ApiError = {
        code,
        message,
    };

    if (details !== undefined) {
        error.details = details;
    }

    const response: ApiResponse = {
        success: false,
        error,
        meta: {
            timestamp: new Date().toISOString(),
        },
    };

    return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
    unauthorized: () =>
        errorResponse('UNAUTHORIZED', 'Authentication required', 401),

    forbidden: () =>
        errorResponse('FORBIDDEN', 'Access denied', 403),

    notFound: (resource: string = 'Resource') =>
        errorResponse('NOT_FOUND', `${resource} not found`, 404),

    badRequest: (message: string = 'Invalid request', details?: unknown) =>
        errorResponse('BAD_REQUEST', message, 400, details),

    validationError: (details: unknown) =>
        errorResponse('VALIDATION_ERROR', 'Invalid request format', 400, details),

    rateLimited: (retryAfter: number = 60) =>
        NextResponse.json(
            {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please wait before trying again.',
                },
            },
            {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                },
            }
        ),

    internal: (message: string = 'An unexpected error occurred') =>
        errorResponse('INTERNAL_ERROR', message, 500),
};

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

    // Add jitter (±25% randomization)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

    const delay = exponentialDelay + jitter;

    // Cap at max delay
    return Math.min(delay, maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: unknown;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (
                attempt >= finalConfig.maxRetries ||
                !finalConfig.shouldRetry?.(error)
            ) {
                throw error;
            }

            // Calculate backoff delay
            const delay = calculateBackoffDelay(
                attempt,
                finalConfig.baseDelayMs,
                finalConfig.maxDelayMs
            );

            console.log(
                `[Retry] Attempt ${attempt + 1}/${finalConfig.maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
                error instanceof Error ? error.message : error
            );

            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Wrap an OpenAI/AI SDK call with retry logic
 *
 * Uses optimized settings for AI API calls:
 * - 3 retries
 * - Shorter initial delay
 * - Retries on rate limits and server errors
 */
export async function withAIRetry<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        shouldRetry: (error: unknown) => {
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                return (
                    message.includes('rate limit') ||
                    message.includes('429') ||
                    message.includes('overloaded') ||
                    message.includes('timeout') ||
                    message.includes('network') ||
                    message.includes('500') ||
                    message.includes('502') ||
                    message.includes('503')
                );
            }
            return false;
        },
    });
}

// ============================================
// REQUEST LOGGING
// ============================================

export interface RequestLogData {
    method: string;
    path: string;
    userId?: string;
    duration: number;
    status: number;
    userAgent?: string;
    ip?: string;
    error?: string;
}

/**
 * Log API request with structured format
 */
export function logRequest(data: RequestLogData): void {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...data,
    };

    // In production, this would go to a structured logging service
    // For now, log as JSON for easy parsing
    console.log('[API Request]', JSON.stringify(logEntry));
}

export interface InteractionLogData {
    userId?: string;
    intent: string;
    userMessage: string;
    aiResponse?: string;
    toolCalls?: number;
    tokens?: {
        prompt?: number; // Estimated
        completion?: number; // Estimated/Actual
    };
    durationMs: number;
    status: 'success' | 'failure' | 'refusal';
    refusalReason?: string;
    flagged?: boolean; // Candidate for golden dataset
}

/**
 * Log full interaction for audit trail and dataset generation
 */
export function logInteraction(data: InteractionLogData): void {
    const logEntry = {
        type: 'INTERACTION_AUDIT',
        timestamp: new Date().toISOString(),
        ...data,
        // Simple PII redaction (email-like patterns)
        userMessage: data.userMessage.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]'),
    };

    console.log('[AUDIT]', JSON.stringify(logEntry));

    // In a real system, if (data.flagged), we would push to a "Needs Review" queue
    if (data.flagged) {
        console.warn('[GOLDEN_CANDIDATE]', JSON.stringify(logEntry));
    }
}

/**
 * Create a request timer for measuring duration
 */
export function createRequestTimer(): { getDuration: () => number } {
    const startTime = Date.now();
    return {
        getDuration: () => Date.now() - startTime,
    };
}

// ============================================
// TIMEOUT HANDLING
// ============================================

/**
 * Execute a function with timeout
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @throws Error if timeout is exceeded
 */
export async function withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([fn(), timeoutPromise]);
}
