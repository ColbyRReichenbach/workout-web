/**
 * Token Utilities for AI Context Optimization
 *
 * Provides utilities to estimate token usage and limit context size
 * to prevent excessive API costs and improve response quality.
 */

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum tokens to allocate for context/system prompt
 * GPT-4o has 128k context, but we want to leave room for:
 * - User message history (~2000 tokens)
 * - Tool results (~1000 tokens)
 * - Response generation (~2000 tokens)
 */
export const MAX_CONTEXT_TOKENS = 2000;

/**
 * Maximum tokens for tool results
 */
export const MAX_TOOL_RESULT_TOKENS = 1000;

/**
 * Approximate characters per token for English text
 * This is a rough estimate - actual tokenization varies
 */
const CHARS_PER_TOKEN = 4;

/**
 * Token buffer to account for tokenization variance
 */
const TOKEN_BUFFER = 50;

// ============================================
// TOKEN ESTIMATION
// ============================================

/**
 * Estimate the number of tokens in a string
 * Uses a simple heuristic of ~4 chars per token
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Account for whitespace compression and special characters
    const normalized = text.replace(/\s+/g, ' ').trim();
    return Math.ceil(normalized.length / CHARS_PER_TOKEN);
}

/**
 * Estimate tokens for a JSON object
 * Accounts for JSON formatting overhead
 *
 * @param obj - Object to estimate tokens for
 * @returns Estimated token count
 */
export function estimateJsonTokens(obj: unknown): number {
    try {
        const jsonStr = JSON.stringify(obj);
        // JSON has ~20% overhead from punctuation/keys
        return Math.ceil(estimateTokens(jsonStr) * 1.2);
    } catch {
        return 0;
    }
}

// ============================================
// CONTEXT TRUNCATION
// ============================================

/**
 * Truncate text to fit within a token limit
 * Attempts to truncate at sentence boundaries for readability
 *
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated text with optional ellipsis
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
    const currentTokens = estimateTokens(text);

    if (currentTokens <= maxTokens) {
        return text;
    }

    // Calculate target character length
    const targetChars = (maxTokens - TOKEN_BUFFER) * CHARS_PER_TOKEN;

    if (targetChars <= 0) {
        return '';
    }

    // Try to truncate at a sentence boundary
    const truncated = text.substring(0, targetChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');

    // Find the best truncation point
    const breakPoint = Math.max(lastPeriod, lastNewline);

    if (breakPoint > targetChars * 0.5) {
        // Found a good break point in the latter half
        return truncated.substring(0, breakPoint + 1) + '\n[Content truncated for brevity]';
    }

    // No good break point, just truncate
    return truncated + '...\n[Content truncated for brevity]';
}

/**
 * Truncate an array to fit within a token limit
 * Removes items from the end to meet the limit
 *
 * @param items - Array of items
 * @param maxTokens - Maximum tokens for the entire array
 * @param itemToString - Function to convert item to string for token estimation
 * @returns Truncated array
 */
export function truncateArrayToTokenLimit<T>(
    items: T[],
    maxTokens: number,
    itemToString: (item: T) => string = (item) => JSON.stringify(item)
): T[] {
    let totalTokens = 0;
    const result: T[] = [];

    for (const item of items) {
        const itemTokens = estimateTokens(itemToString(item));
        if (totalTokens + itemTokens > maxTokens) {
            break;
        }
        totalTokens += itemTokens;
        result.push(item);
    }

    return result;
}

// ============================================
// CONTEXT SUMMARIZATION
// ============================================

/**
 * Create a compact summary of workout logs
 * Reduces token usage while preserving key information
 *
 * @param logs - Array of sanitized logs
 * @param maxLogs - Maximum number of logs to include
 * @returns Compact summary object
 */
export function summarizeLogs(
    logs: Array<Record<string, unknown>>,
    maxLogs: number = 10
): { summary: string; recentLogs: Array<Record<string, unknown>> } {
    if (logs.length === 0) {
        return { summary: 'No workout logs available.', recentLogs: [] };
    }

    // Take the most recent logs
    const recentLogs = logs.slice(0, maxLogs);

    // Create a text summary
    const segments = recentLogs.map(log => log.segment || log.segment_name).filter(Boolean);
    const uniqueSegments = [...new Set(segments)];
    const dates = recentLogs.map(log => log.date).filter(Boolean);

    const summary = [
        `${recentLogs.length} workouts logged`,
        dates.length > 0 ? `from ${dates[dates.length - 1]} to ${dates[0]}` : '',
        uniqueSegments.length > 0 ? `Exercises: ${uniqueSegments.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean).join('. ');

    return { summary, recentLogs };
}

/**
 * Create a compact summary of biometric data
 * Focuses on averages and trends rather than raw data
 *
 * @param biometrics - Array of biometric records
 * @param maxDays - Maximum number of days to include
 * @returns Compact summary object
 */
export function summarizeBiometrics(
    biometrics: Array<Record<string, unknown>>,
    maxDays: number = 7
): { summary: string; recentData: Array<Record<string, unknown>> } {
    if (biometrics.length === 0) {
        return { summary: 'No biometric data available.', recentData: [] };
    }

    const recentData = biometrics.slice(0, maxDays);

    // Calculate averages (using sanitized field names from sanitizeBiometricForAI)
    const hrvValues = recentData
        .map(b => b.hrv as number)
        .filter(v => typeof v === 'number' && !isNaN(v));

    const sleepValues = recentData
        .map(b => b.sleep_hrs as number)
        .filter(v => typeof v === 'number' && !isNaN(v));

    const rhrValues = recentData
        .map(b => b.rhr as number)
        .filter(v => typeof v === 'number' && !isNaN(v));

    const avgHrv = hrvValues.length > 0
        ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length)
        : null;

    const avgSleep = sleepValues.length > 0
        ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1)
        : null;

    const avgRhr = rhrValues.length > 0
        ? Math.round(rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length)
        : null;

    const summaryParts = [
        `${recentData.length} days of data`,
        avgHrv ? `Avg HRV: ${avgHrv}ms` : null,
        avgSleep ? `Avg Sleep: ${avgSleep}h` : null,
        avgRhr ? `Avg RHR: ${avgRhr}bpm` : null,
    ].filter(Boolean);

    return { summary: summaryParts.join(', '), recentData };
}

// ============================================
// PERFORMANCE DATA VALIDATION
// ============================================

/**
 * Allowed fields in performance data that can be exposed to AI
 */
const ALLOWED_PERFORMANCE_FIELDS = new Set([
    'sets',
    'reps',
    'weight',
    'weight_lbs',
    'weight_kg',
    'duration_min',
    'duration_sec',
    'distance',
    'distance_mi',
    'distance_km',
    'avg_hr',
    'max_hr',
    'pace',
    'pace_per_mile',
    'pace_per_km',
    'rpe',
    'notes',
    'completed',
    'calories',
    'zone',
]);

/**
 * Sanitize performance data to only include expected fields
 * Prevents exposure of unexpected or sensitive data
 *
 * @param data - Raw performance data object
 * @returns Sanitized performance data with only allowed fields
 */
export function sanitizePerformanceData(
    data: Record<string, unknown>
): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (ALLOWED_PERFORMANCE_FIELDS.has(key.toLowerCase())) {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// ============================================
// LOGGING & MONITORING
// ============================================

/**
 * Log token usage for monitoring and optimization
 *
 * @param component - Component name (e.g., 'system_prompt', 'tool_result')
 * @param tokens - Estimated token count
 * @param limit - Token limit for this component
 */
export function logTokenUsage(
    component: string,
    tokens: number,
    limit: number
): void {
    const percentage = Math.round((tokens / limit) * 100);
    const status = tokens > limit ? 'EXCEEDED' : tokens > limit * 0.8 ? 'WARNING' : 'OK';

    console.log(`[TokenUsage] ${component}: ${tokens}/${limit} tokens (${percentage}%) - ${status}`);
}

/**
 * Create a token usage report for debugging
 *
 * @param components - Object mapping component names to their content
 * @returns Token usage report
 */
export function createTokenReport(
    components: Record<string, string | unknown>
): Record<string, { tokens: number; chars: number }> {
    const report: Record<string, { tokens: number; chars: number }> = {};

    for (const [name, content] of Object.entries(components)) {
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        report[name] = {
            tokens: estimateTokens(text),
            chars: text.length,
        };
    }

    return report;
}
