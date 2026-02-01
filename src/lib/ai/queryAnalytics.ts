/**
 * Query Analytics Module
 * 
 * Logs AI tool calls to identify common query patterns and inform
 * the creation of optimized predefined queries.
 */

// In-memory analytics store (for development/single-instance)
// In production, this would write to a database table or analytics service
interface QueryLog {
    timestamp: Date;
    toolName: string;
    exerciseName?: string;
    normalizedName?: string;
    wasCorrected: boolean;
    days?: number;
    userId?: string;
}

// Circular buffer for recent queries (keeps last 1000)
const MAX_LOGS = 1000;
const queryLogs: QueryLog[] = [];

/**
 * Log an AI tool call for analytics
 */
export function logToolCall(params: {
    toolName: string;
    exerciseName?: string;
    normalizedName?: string;
    wasCorrected?: boolean;
    days?: number;
    userId?: string;
}): void {
    const log: QueryLog = {
        timestamp: new Date(),
        toolName: params.toolName,
        exerciseName: params.exerciseName,
        normalizedName: params.normalizedName,
        wasCorrected: params.wasCorrected || false,
        days: params.days,
        userId: params.userId,
    };

    queryLogs.push(log);

    // Keep buffer at MAX_LOGS
    if (queryLogs.length > MAX_LOGS) {
        queryLogs.shift();
    }

    // Console log for monitoring (in production, send to analytics service)
    console.log('[Query Analytics]', JSON.stringify({
        tool: params.toolName,
        exercise: params.normalizedName || params.exerciseName,
        corrected: params.wasCorrected,
    }));
}

/**
 * Get analytics summary (for debugging/monitoring)
 */
export function getAnalyticsSummary(): {
    totalQueries: number;
    toolBreakdown: Record<string, number>;
    topExercises: { name: string; count: number }[];
    correctionRate: number;
    recentQueries: QueryLog[];
} {
    const toolBreakdown: Record<string, number> = {};
    const exerciseCounts: Record<string, number> = {};
    let correctionCount = 0;

    queryLogs.forEach(log => {
        // Count tools
        toolBreakdown[log.toolName] = (toolBreakdown[log.toolName] || 0) + 1;

        // Count exercises
        const exercise = log.normalizedName || log.exerciseName;
        if (exercise) {
            exerciseCounts[exercise] = (exerciseCounts[exercise] || 0) + 1;
        }

        // Count corrections
        if (log.wasCorrected) {
            correctionCount++;
        }
    });

    // Sort exercises by count
    const topExercises = Object.entries(exerciseCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        totalQueries: queryLogs.length,
        toolBreakdown,
        topExercises,
        correctionRate: queryLogs.length > 0 ? correctionCount / queryLogs.length : 0,
        recentQueries: queryLogs.slice(-10),
    };
}

/**
 * Get common typo patterns (for improving keyword mappings)
 */
export function getTypoPatterns(): { original: string; corrected: string; count: number }[] {
    const patterns: Record<string, { corrected: string; count: number }> = {};

    queryLogs.forEach(log => {
        if (log.wasCorrected && log.exerciseName && log.normalizedName) {
            const key = log.exerciseName.toLowerCase();
            if (!patterns[key]) {
                patterns[key] = { corrected: log.normalizedName, count: 0 };
            }
            patterns[key].count++;
        }
    });

    return Object.entries(patterns)
        .map(([original, { corrected, count }]) => ({ original, corrected, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Clear analytics (for testing)
 */
export function clearAnalytics(): void {
    queryLogs.length = 0;
}
