/**
 * API Resiliency Utilities
 * Use this to wrap external API calls (OpenAI, Supabase) with exponential backoff.
 */

interface RetryOptions {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    retries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    factor: 2,
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a function with exponential backoff retry logic.
 * @param fn The async function to execute.
 * @param options Configuration for retries.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { retries, baseDelay, maxDelay, factor } = { ...DEFAULT_OPTIONS, ...options };

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`[Retry] Attempt ${attempt + 1}/${retries + 1} failed:`, error);
            if (attempt === retries) break;

            const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
            await sleep(delay);
        }
    }

    throw lastError;
}
