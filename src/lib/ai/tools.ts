import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { tool } from 'ai';
import * as Sentry from '@sentry/nextjs';
import {
    MAX_TOOL_RESULT_TOKENS,
    estimateJsonTokens,
    sanitizePerformanceData,
    summarizeLogs,
    summarizeBiometrics,
    logTokenUsage,
} from './tokenUtils';
import { DEMO_USER_ID } from '@/lib/constants';

// Constants for validation - OPTIMIZED for token efficiency
const MAX_DAYS = 14; // Reduced from 30 to limit data volume
const MIN_DAYS = 1;
const DEFAULT_DAYS = 7;
const MAX_LOGS = 20; // Reduced from 100 for token optimization

/**
 * Sanitize log data before exposing to AI
 * Remove sensitive fields and validate performance data
 */
function sanitizeLogForAI(log: Record<string, unknown>): Record<string, unknown> {
    // Sanitize nested performance data
    const performanceData = log.performance_data;
    const sanitizedPerformance = typeof performanceData === 'object' && performanceData !== null
        ? sanitizePerformanceData(performanceData as Record<string, unknown>)
        : performanceData;

    return {
        date: log.date,
        day: log.day_name,
        segment: log.segment_name,
        type: log.segment_type,
        data: sanitizedPerformance,
        week: log.week_number,
        // Explicitly exclude: id, user_id, session_id, created_at, updated_at, tracking_mode
    };
}

/**
 * Sanitize biometric data before exposing to AI
 * Compact format with only essential metrics
 */
function sanitizeBiometricForAI(bio: Record<string, unknown>): Record<string, unknown> {
    return {
        date: bio.date,
        // Sleep metrics (compact names to save tokens)
        sleep_hrs: bio.asleep_minutes ? Math.round((bio.asleep_minutes as number) / 60 * 10) / 10 : null,
        deep_min: bio.deep_sleep_minutes,
        rem_min: bio.rem_sleep_minutes,
        efficiency: bio.sleep_efficiency_score,
        // Heart metrics (compact)
        hrv: bio.hrv_ms,
        rhr: bio.resting_hr,
        // Explicitly exclude: id, user_id, source, raw_data, in_bed_minutes, core_sleep_minutes,
        // awake_minutes, avg_hr_sleeping, respiratory_rate (less critical)
    };
}

export const getRecentLogs = tool({
    description: 'Get recent workout logs. Use to check compliance and performance. Returns most recent first.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Days to look back (1-14)'),
        filter: z.string().optional()
            .describe('Optional filter (e.g., "Squat", "Run")'),
    }),
    execute: async ({ days = DEFAULT_DAYS, filter }) => {
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Calculate date N days ago
            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            // Fetch only essential fields
            const { data: logs, error } = await supabase
                .from('logs')
                .select('date, day_name, segment_name, segment_type, performance_data, week_number')
                .eq('user_id', userId)
                .gte('date', dateStr)
                .order('date', { ascending: false })
                .limit(MAX_LOGS);

            if (error) {
                console.error('[AI Tool Error] getRecentLogs:', error.message);
                return 'Unable to fetch workout logs at this time.';
            }

            if (!logs || logs.length === 0) {
                return 'No workout logs found for this period.';
            }

            // Client-side filtering
            let filteredLogs = logs;
            if (filter) {
                const term = filter.toLowerCase();
                filteredLogs = logs.filter(log =>
                    (log.segment_name && log.segment_name.toLowerCase().includes(term)) ||
                    (log.segment_type && log.segment_type.toLowerCase().includes(term))
                );
            }

            if (filteredLogs.length === 0) {
                return `No logs found containing "${filter}" in the last ${days} days.`;
            }

            // Sanitize logs
            const sanitizedLogs = filteredLogs.map(log => sanitizeLogForAI(log));

            // Summarize to limit token usage
            const { summary, recentLogs } = summarizeLogs(sanitizedLogs, 10);

            const result = {
                period: `Last ${days} days`,
                count: sanitizedLogs.length,
                filter: filter || null,
                summary,
                logs: recentLogs
            };

            // Log token usage for monitoring
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getRecentLogs', tokens, MAX_TOOL_RESULT_TOKENS);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getRecentLogs:', error);
            Sentry.captureException(error);
            return 'An error occurred while fetching workout logs.';
        }
    },
});

export const getBiometrics = tool({
    description: 'Get biometric data (HRV, Sleep, RHR) for recovery assessment. Returns averages and recent data.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Days to look back (1-14)'),
    }),
    execute: async ({ days = DEFAULT_DAYS }) => {
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            // Fetch only essential biometric fields
            const { data: biometrics, error } = await supabase
                .from('biometrics')
                .select(`
                    date,
                    asleep_minutes,
                    deep_sleep_minutes,
                    rem_sleep_minutes,
                    sleep_efficiency_score,
                    hrv_ms,
                    resting_hr
                `)
                .eq('user_id', userId)
                .gte('date', dateStr)
                .order('date', { ascending: false })
                .limit(MAX_LOGS);

            if (error) {
                console.error('[AI Tool Error] getBiometrics:', error.message);
                return 'Unable to fetch biometric data at this time.';
            }

            if (!biometrics || biometrics.length === 0) {
                return 'No biometric data found for this period.';
            }

            // Sanitize and compact data
            const sanitizedBiometrics = biometrics.map(bio => sanitizeBiometricForAI(bio));

            // Create summary
            const { summary, recentData } = summarizeBiometrics(sanitizedBiometrics, 7);

            const result = {
                period: `Last ${days} days`,
                count: sanitizedBiometrics.length,
                summary,
                data: recentData
            };

            // Log token usage for monitoring
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getBiometrics', tokens, MAX_TOOL_RESULT_TOKENS);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getBiometrics:', error);
            Sentry.captureException(error);
            return 'An error occurred while fetching biometric data.';
        }
    },
});
