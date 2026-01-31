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
import { normalizeExercise, getFilterPattern, getUnrecognizedMessage } from './exerciseNormalization';
import { logToolCall } from './queryAnalytics';
import { DEMO_USER_ID } from '@/lib/constants';

// Constants for validation - OPTIMIZED for token efficiency
const MAX_DAYS = 30; // Support monthly queries
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
        // Sleep metrics
        sleep_hrs: bio.sleep_hours,
        // Heart metrics
        hrv: bio.hrv,
        rhr: bio.resting_hr,
        weight: bio.weight_lbs,
    };
}

export const getRecentLogs = tool({
    description: 'Get workout logs from a specific time period (e.g., "this week", "last 30 days"). Use for compliance checks and period-based analysis. Do NOT use for "when was my last X?" questions.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Days to look back (1-30)'),
        filter: z.string().optional()
            .describe('Optional filter (e.g., "Squat", "Run")'),
    }),
    execute: async ({ days = DEFAULT_DAYS, filter }) => {
        console.log('[AI Tool] getRecentLogs called with:', { days, filter });
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Calculate date N days ago
            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            // Normalize filter for typo correction BEFORE building query
            let normalizedFilter: string | null = null;
            let wasCorrected = false;

            if (filter) {
                const normResult = normalizeExercise(filter);
                normalizedFilter = normResult.normalized;
                wasCorrected = normResult.wasCorrected;

                // Handle unrecognized exercise
                if (normResult.confidence === 0) {
                    return getUnrecognizedMessage(filter);
                }

                // Log correction for monitoring
                if (wasCorrected) {
                    console.log(`[AI Tool] Corrected "${filter}" -> "${normalizedFilter}" (confidence: ${normResult.confidence})`);
                }
            }

            // Build query with optional database-level filtering
            let query = supabase
                .from('logs')
                .select('date, day_name, segment_name, segment_type, performance_data, week_number')
                .eq('user_id', userId)
                .gte('date', dateStr);

            // Apply database-level filtering with .ilike() for efficiency
            if (normalizedFilter) {
                const term = normalizedFilter.replace(/_/g, ' ');
                // Use .or() with .ilike() for case-insensitive partial matching
                query = query.or(`segment_name.ilike.%${term}%,segment_type.ilike.%${term}%`);
            }

            const { data: logs, error } = await query
                .order('date', { ascending: false })
                .limit(MAX_LOGS);

            if (error) {
                console.error('[AI Tool Error] getRecentLogs:', error.message);
                Sentry.captureException(error);
                return 'I had trouble accessing your workout data. This might be a temporary network issue. Please try asking again in a moment, or refresh the page if the problem persists.';
            }

            if (!logs || logs.length === 0) {
                if (filter) {
                    const displayFilter = wasCorrected ? `${filter}" (interpreted as "${normalizedFilter}` : filter;
                    return `No logs found containing "${displayFilter}" in the last ${days} days. Try a different exercise name or ask "when was my last ${normalizedFilter || filter}?" to search your full history.`;
                }
                return `No workout logs found in the last ${days} days. Try asking about a longer time period, or use "when was my last workout?" to find your most recent log.`;
            }

            // Sanitize logs
            const sanitizedLogs = logs.map(log => sanitizeLogForAI(log));

            // Summarize to limit token usage
            const { summary, recentLogs } = summarizeLogs(sanitizedLogs, 10);

            const result = {
                period: `Last ${days} days`,
                count: sanitizedLogs.length,
                filter: filter || null,
                normalizedFilter: normalizedFilter,
                wasCorrected: wasCorrected,
                summary,
                logs: recentLogs
            };

            // Log analytics for query optimization
            logToolCall({
                toolName: 'getRecentLogs',
                exerciseName: filter,
                normalizedName: normalizedFilter || undefined,
                wasCorrected,
                days,
                userId,
            });

            // Log token usage for monitoring
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getRecentLogs', tokens, MAX_TOOL_RESULT_TOKENS);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getRecentLogs:', error);
            Sentry.captureException(error);
            return 'I had trouble accessing your workout data. This might be a temporary network issue. Please try asking again in a moment, or refresh the page if the problem persists.';
        }
    },
});

export const getBiometrics = tool({
    description: 'Get sleep and heart rate data (HRV, Sleep hours, RHR) for recovery questions. Use ONLY for sleep/recovery/HRV questions. Do NOT use for workout/exercise questions.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Days to look back (1-30)'),
    }),
    execute: async ({ days = DEFAULT_DAYS }) => {
        console.log('[AI Tool] getBiometrics called with:', { days });
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            // Fetch only essential biometric fields (using correct column names)
            const { data: biometrics, error } = await supabase
                .from('biometrics')
                .select('date, sleep_hours, hrv, resting_hr, weight_lbs')
                .eq('user_id', userId)
                .gte('date', dateStr)
                .order('date', { ascending: false })
                .limit(MAX_LOGS);

            if (error) {
                console.error('[AI Tool Error] getBiometrics:', error.message);
                return 'Unable to fetch biometric data at this time.';
            }

            console.log('[AI Tool] getBiometrics result:', { count: biometrics?.length || 0, hasError: !!error });

            if (!biometrics || biometrics.length === 0) {
                return `No biometric data found in the last ${days} days. Make sure you're syncing your sleep and heart rate data from your wearable device.`;
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

/**
 * Find the most recent workout log(s) matching criteria.
 * Use for "when was my last X?" or "show my last N workouts" questions.
 * No time limit - searches entire history.
 */
export const findLastLog = tool({
    description: 'Find the most recent workout log(s) matching criteria, regardless of how old. Use when user asks "when was my last X?", "how long since I did Y?", or "show my last N workouts".',
    inputSchema: z.object({
        filter: z.string().optional().describe('Filter by exercise/segment name or type (e.g., "Run", "Squat", "Bench Press")'),
        limit: z.number().min(1).max(10).default(1).describe('Number of recent logs to return (1-10)'),
    }),
    execute: async ({ filter, limit = 1 }) => {
        console.log('[AI Tool] findLastLog called with filter:', filter, 'limit:', limit);
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Fetch more logs if filtering to ensure we find matches
            const fetchLimit = filter ? 200 : limit;
            const { data: logs, error } = await supabase
                .from('logs')
                .select('date, day_name, segment_name, segment_type, performance_data, week_number')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(fetchLimit);

            if (error) {
                console.error('[AI Tool Error] findLastLog:', error.message);
                Sentry.captureException(error);
                return 'I had trouble searching your workout history. This might be a temporary network issue. Please try asking again in a moment, or refresh the page if the problem persists.';
            }

            if (!logs || logs.length === 0) {
                return 'No workout logs found in your history. Start logging workouts to track your progress!';
            }

            // Apply filter with normalization for typo correction
            let filteredLogs = logs;
            let normalizedFilter: string | null = null;
            let wasCorrected = false;

            if (filter) {
                const normResult = normalizeExercise(filter);
                normalizedFilter = normResult.normalized;
                wasCorrected = normResult.wasCorrected;

                // Handle unrecognized exercise
                if (normResult.confidence === 0) {
                    return getUnrecognizedMessage(filter);
                }

                // Log correction for monitoring
                if (wasCorrected) {
                    console.log(`[AI Tool] Corrected "${filter}" -> "${normalizedFilter}" (confidence: ${normResult.confidence})`);
                }

                // Filter with normalized term
                const term = normalizedFilter.replace(/_/g, ' ');
                filteredLogs = logs.filter(log =>
                    log.segment_name?.toLowerCase().includes(term) ||
                    log.segment_type?.toLowerCase().includes(term)
                ).slice(0, limit);

                if (filteredLogs.length === 0) {
                    const displayFilter = wasCorrected ? `${filter}" (interpreted as "${normalizedFilter}` : filter;
                    return `No logs found containing "${displayFilter}" in your workout history. Check the spelling or try a different exercise name. Common exercises include: Squat, Deadlift, Bench Press, Run, Row.`;
                }
            } else {
                filteredLogs = logs.slice(0, limit);
            }

            // Calculate days_ago and sanitize
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = filteredLogs.map(log => {
                const logDate = new Date(log.date);
                logDate.setHours(0, 0, 0, 0);
                const daysAgo = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    ...sanitizeLogForAI(log),
                    days_ago: daysAgo
                };
            });

            // Log token usage
            const tokens = estimateJsonTokens(result);
            logTokenUsage('findLastLog', tokens, MAX_TOOL_RESULT_TOKENS);

            // Log analytics for query optimization
            logToolCall({
                toolName: 'findLastLog',
                exerciseName: filter,
                normalizedName: normalizedFilter || undefined,
                wasCorrected,
                userId,
            });

            return JSON.stringify({
                filter: filter || null,
                normalizedFilter: normalizedFilter,
                wasCorrected: wasCorrected,
                count: result.length,
                logs: result
            }, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] findLastLog:', error);
            Sentry.captureException(error);
            return 'An error occurred while searching workout logs. Please try again.';
        }
    }
});

// ============================================
// NEW SPECIALIZED TOOLS
// ============================================

/**
 * Map of exercise names to their profile PR field names
 */
const EXERCISE_TO_PR_FIELD: Record<string, string> = {
    // Strength PRs
    'squat': 'squat_max',
    'back_squat': 'squat_max',
    'bench_press': 'bench_max',
    'bench': 'bench_max',
    'deadlift': 'deadlift_max',
    'front_squat': 'front_squat_max',
    'overhead_press': 'ohp_max',
    'ohp': 'ohp_max',
    'clean_and_jerk': 'clean_jerk_max',
    'clean_jerk': 'clean_jerk_max',
    'clean': 'clean_jerk_max',
    'snatch': 'snatch_max',

    // Cardio PRs (times in seconds)
    'mile': 'mile_time_sec',
    'run': 'mile_time_sec',
    '5k': 'k5_time_sec',
    '5k_run': 'k5_time_sec',
    '400m': 'sprint_400m_sec',
    'sprint': 'sprint_400m_sec',
    '2k_row': 'row_2k_sec',
    '500m_row': 'row_500m_sec',
    'row': 'row_500m_sec',
    'ski_erg': 'ski_1k_sec',
    'bike': 'bike_max_watts',
    'bike_erg': 'bike_max_watts',
};

/**
 * Get PR type (strength = lbs, cardio = seconds, power = watts)
 */
function getPRType(field: string): { type: 'weight' | 'time' | 'power', unit: string } {
    if (field.includes('max') && !field.includes('watts')) {
        return { type: 'weight', unit: 'lbs' };
    }
    if (field.includes('sec')) {
        return { type: 'time', unit: 'seconds' };
    }
    if (field.includes('watts')) {
        return { type: 'power', unit: 'watts' };
    }
    return { type: 'weight', unit: 'lbs' };
}

/**
 * Format time in seconds to human-readable format
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
}

/**
 * Get user's personal record for a specific exercise.
 * Use for "What's my max squat?" or "What's my PR for bench?" questions.
 */
export const getExercisePR = tool({
    description: 'Get user\'s personal record (PR/max) for a specific exercise. Use for "what\'s my max X?" questions. Handles typos (e.g., "squirt" → "squat").',
    inputSchema: z.object({
        exercise: z.string().describe('Exercise name (e.g., "squat", "bench", "mile", "5k")'),
    }),
    execute: async ({ exercise }) => {
        console.log('[AI Tool] getExercisePR called with:', exercise);
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Normalize the exercise name (handles typos)
            const normResult = normalizeExercise(exercise);
            const normalized = normResult.normalized;

            // Handle unrecognized exercise
            if (normResult.confidence === 0) {
                return getUnrecognizedMessage(exercise);
            }

            // Map to PR field
            const prField = EXERCISE_TO_PR_FIELD[normalized];
            if (!prField) {
                return `I don't have a PR field for "${exercise}". PRs are tracked for: Squat, Bench Press, Deadlift, Front Squat, Overhead Press, Clean & Jerk, Snatch, Mile, 5k, 400m Sprint, 2k Row, 500m Row, Ski Erg, and Bike (max watts).`;
            }

            // Fetch the PR value
            const { data: profile, error } = await supabase
                .from('profiles')
                .select(prField)
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AI Tool Error] getExercisePR:', error.message);
                Sentry.captureException(error);
                return 'I had trouble accessing your profile data. Please try again.';
            }

            const prValue = profile?.[prField as keyof typeof profile] as number | undefined;
            const { type, unit } = getPRType(prField);

            if (!prValue || prValue === 0) {
                const correction = normResult.wasCorrected
                    ? ` (interpreted as "${normalized}")`
                    : '';
                return `No PR recorded for ${exercise}${correction}. You can set your PRs in Profile Settings or complete a checkpoint test.`;
            }

            // Format the result
            const formattedValue = type === 'time' ? formatTime(prValue) : prValue;
            const displayExercise = normalized.replace(/_/g, ' ');

            // Log analytics
            logToolCall({
                toolName: 'getExercisePR',
                exerciseName: exercise,
                normalizedName: normalized,
                wasCorrected: normResult.wasCorrected,
                userId,
            });

            return JSON.stringify({
                exercise: displayExercise,
                originalQuery: normResult.wasCorrected ? exercise : undefined,
                pr: prValue,
                formatted: `${formattedValue} ${unit}`,
                type: type,
            }, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getExercisePR:', error);
            Sentry.captureException(error);
            return 'An error occurred while fetching your PR. Please try again.';
        }
    }
});

/**
 * Get comprehensive recovery metrics from sleep_logs and readiness_logs.
 * Use for "How's my recovery?", "Am I sleeping enough?", or "Should I rest today?"
 */
export const getRecoveryMetrics = tool({
    description: 'Get sleep and recovery data from sleep_logs and readiness_logs. Use for recovery questions like "How\'s my HRV?", "Am I sleeping enough?", or "Should I rest today?".',
    inputSchema: z.object({
        days: z.number()
            .min(1)
            .max(30)
            .default(7)
            .describe('Days to look back (1-30)'),
    }),
    execute: async ({ days = 7 }) => {
        console.log('[AI Tool] getRecoveryMetrics called with days:', days);
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            const date = new Date();
            date.setDate(date.getDate() - days);
            const dateStr = date.toISOString().split('T')[0];

            // Fetch sleep logs and readiness logs in parallel
            const [sleepResult, readinessResult, biometricsResult] = await Promise.all([
                supabase
                    .from('sleep_logs')
                    .select('date, asleep_minutes, hrv_ms, resting_hr, deep_sleep_minutes, rem_sleep_minutes, sleep_efficiency_score')
                    .eq('user_id', userId)
                    .gte('date', dateStr)
                    .order('date', { ascending: false })
                    .limit(days),
                supabase
                    .from('readiness_logs')
                    .select('date, readiness_score')
                    .eq('user_id', userId)
                    .gte('date', dateStr)
                    .order('date', { ascending: false })
                    .limit(days),
                supabase
                    .from('biometrics')
                    .select('date, sleep_hours, hrv, resting_hr, weight_lbs')
                    .eq('user_id', userId)
                    .gte('date', dateStr)
                    .order('date', { ascending: false })
                    .limit(days),
            ]);

            const sleepLogs = sleepResult.data || [];
            const readinessLogs = readinessResult.data || [];
            const biometrics = biometricsResult.data || [];

            // Check if we have any data
            const hasData = sleepLogs.length > 0 || readinessLogs.length > 0 || biometrics.length > 0;

            if (!hasData) {
                return `No recovery data found in the last ${days} days. Make sure you're syncing sleep data from your wearable device, or manually log your biometrics.`;
            }

            // Calculate averages from sleep_logs
            const avgSleepHrs = sleepLogs.length > 0
                ? sleepLogs.reduce((sum, s) => sum + (s.asleep_minutes || 0), 0) / sleepLogs.length / 60
                : biometrics.length > 0
                    ? biometrics.reduce((sum, b) => sum + (b.sleep_hours || 0), 0) / biometrics.length
                    : null;

            const avgHrv = sleepLogs.filter(s => s.hrv_ms).length > 0
                ? sleepLogs.reduce((sum, s) => sum + (s.hrv_ms || 0), 0) / sleepLogs.filter(s => s.hrv_ms).length
                : biometrics.filter(b => b.hrv).length > 0
                    ? biometrics.reduce((sum, b) => sum + (b.hrv || 0), 0) / biometrics.filter(b => b.hrv).length
                    : null;

            const avgRhr = sleepLogs.filter(s => s.resting_hr).length > 0
                ? sleepLogs.reduce((sum, s) => sum + (s.resting_hr || 0), 0) / sleepLogs.filter(s => s.resting_hr).length
                : biometrics.filter(b => b.resting_hr).length > 0
                    ? biometrics.reduce((sum, b) => sum + (b.resting_hr || 0), 0) / biometrics.filter(b => b.resting_hr).length
                    : null;

            const avgDeepSleep = sleepLogs.filter(s => s.deep_sleep_minutes).length > 0
                ? sleepLogs.reduce((sum, s) => sum + (s.deep_sleep_minutes || 0), 0) / sleepLogs.filter(s => s.deep_sleep_minutes).length
                : null;

            const avgEfficiency = sleepLogs.filter(s => s.sleep_efficiency_score).length > 0
                ? sleepLogs.reduce((sum, s) => sum + (s.sleep_efficiency_score || 0), 0) / sleepLogs.filter(s => s.sleep_efficiency_score).length
                : null;

            const avgReadiness = readinessLogs.length > 0
                ? readinessLogs.reduce((sum, r) => sum + (r.readiness_score || 0), 0) / readinessLogs.length
                : null;

            // Get most recent entries
            const latestSleep = sleepLogs[0] || biometrics[0];
            const latestReadiness = readinessLogs[0];

            const result = {
                period: `Last ${days} days`,
                data_sources: {
                    sleep_logs: sleepLogs.length,
                    readiness_logs: readinessLogs.length,
                    biometrics: biometrics.length,
                },
                averages: {
                    sleep_hrs: avgSleepHrs ? Math.round(avgSleepHrs * 10) / 10 : null,
                    hrv_ms: avgHrv ? Math.round(avgHrv) : null,
                    resting_hr: avgRhr ? Math.round(avgRhr) : null,
                    deep_sleep_min: avgDeepSleep ? Math.round(avgDeepSleep) : null,
                    sleep_efficiency: avgEfficiency ? Math.round(avgEfficiency) : null,
                    readiness: avgReadiness ? Math.round(avgReadiness * 10) / 10 : null,
                },
                latest: {
                    date: latestSleep?.date || latestReadiness?.date,
                    sleep_hrs: latestSleep?.asleep_minutes ? Math.round(latestSleep.asleep_minutes / 6) / 10 : (biometrics[0]?.sleep_hours ?? null),
                    hrv: sleepLogs[0]?.hrv_ms ?? biometrics[0]?.hrv ?? null,
                    readiness: latestReadiness?.readiness_score,
                },
            };

            // Log token usage
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getRecoveryMetrics', tokens, MAX_TOOL_RESULT_TOKENS);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getRecoveryMetrics:', error);
            Sentry.captureException(error);
            return 'An error occurred while fetching recovery metrics. Please try again.';
        }
    }
});

/**
 * Get workout compliance report for a given time period.
 * Use for "Did I hit my workouts this week?" or "How consistent have I been?"
 */
export const getComplianceReport = tool({
    description: 'Get workout compliance/completion report. Use for "Did I hit my workouts this week?", "How consistent have I been?", or "How many workouts did I do?"',
    inputSchema: z.object({
        days: z.number()
            .min(1)
            .max(30)
            .default(7)
            .describe('Days to look back (1-30)'),
    }),
    execute: async ({ days = 7 }) => {
        console.log('[AI Tool] getComplianceReport called with days:', days);
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            const date = new Date();
            date.setDate(date.getDate() - days);
            const dateStr = date.toISOString().split('T')[0];

            // Fetch workout sessions and logs in parallel
            const [sessionsResult, logsResult] = await Promise.all([
                supabase
                    .from('workout_sessions')
                    .select('id, day_name, week_number, session_title, start_time, perceived_exertion')
                    .eq('user_id', userId)
                    .gte('start_time', dateStr)
                    .order('start_time', { ascending: false }),
                supabase
                    .from('logs')
                    .select('date, segment_name, segment_type')
                    .eq('user_id', userId)
                    .gte('date', dateStr)
                    .order('date', { ascending: false }),
            ]);

            const sessions = sessionsResult.data || [];
            const logs = logsResult.data || [];

            if (sessions.length === 0 && logs.length === 0) {
                return `No workout data found in the last ${days} days. Keep pushing – your first logged workout is waiting!`;
            }

            // Count unique workout days from logs
            const uniqueDays = new Set(logs.map(log => log.date));
            const workoutDays = uniqueDays.size;

            // Count segment types
            const segmentTypeCounts: Record<string, number> = {};
            logs.forEach(log => {
                const type = log.segment_type || 'Other';
                segmentTypeCounts[type] = (segmentTypeCounts[type] || 0) + 1;
            });

            // Calculate expected workouts (assume 5 days/week for full compliance)
            const expectedWorkouts = Math.ceil(days / 7) * 5;
            const compliancePercent = Math.round((workoutDays / expectedWorkouts) * 100);

            // Average RPE from sessions
            const sessionsWithRpe = sessions.filter(s => s.perceived_exertion);
            const avgRpe = sessionsWithRpe.length > 0
                ? sessionsWithRpe.reduce((sum, s) => sum + s.perceived_exertion, 0) / sessionsWithRpe.length
                : null;

            const result = {
                period: `Last ${days} days`,
                summary: {
                    workout_days: workoutDays,
                    expected_days: expectedWorkouts,
                    compliance_percent: Math.min(compliancePercent, 100),
                    total_segments: logs.length,
                    sessions_logged: sessions.length,
                    avg_rpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
                },
                breakdown_by_type: segmentTypeCounts,
                recent_sessions: sessions.slice(0, 3).map(s => ({
                    date: s.start_time?.split('T')[0],
                    title: s.session_title,
                    day: s.day_name,
                    rpe: s.perceived_exertion,
                })),
            };

            // Log token usage
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getComplianceReport', tokens, MAX_TOOL_RESULT_TOKENS);

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getComplianceReport:', error);
            Sentry.captureException(error);
            return 'An error occurred while generating compliance report. Please try again.';
        }
    }
});

/**
 * getTrendAnalysis - Analyze strength/endurance progression over time
 * Use for "Am I getting stronger?", "How's my squat progressing?", etc.
 */
export const getTrendAnalysis = tool({
    description: 'Analyze strength or endurance progression for an exercise. Use for "Am I getting stronger?", "How\'s my squat progressing?", or trend questions. Returns data points and calculated trend direction.',
    inputSchema: z.object({
        exercise: z.string().describe('Exercise name (e.g., "squat", "bench", "deadlift", "run")'),
        days: z.number().min(7).max(90).default(30).describe('Days to analyze (7-90, default 30)'),
    }),
    execute: async ({ exercise, days = 30 }) => {
        console.log('[AI Tool] getTrendAnalysis called with:', { exercise, days });
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Normalize exercise name
            const normResult = normalizeExercise(exercise);
            const normalizedExercise = normResult.normalized;

            if (normResult.confidence === 0) {
                return getUnrecognizedMessage(exercise);
            }

            if (normResult.wasCorrected) {
                console.log(`[AI Tool] Corrected "${exercise}" -> "${normalizedExercise}" (confidence: ${normResult.confidence})`);
            }

            const date = new Date();
            date.setDate(date.getDate() - days);
            const dateStr = date.toISOString().split('T')[0];

            // Query logs with database-level filtering
            const term = normalizedExercise.replace(/_/g, ' ');
            const { data: logs, error } = await supabase
                .from('logs')
                .select('date, segment_name, performance_data')
                .eq('user_id', userId)
                .gte('date', dateStr)
                .or(`segment_name.ilike.%${term}%,segment_type.ilike.%${term}%`)
                .order('date', { ascending: true });

            if (error) {
                console.error('[AI Tool Error] getTrendAnalysis:', error.message);
                Sentry.captureException(error);
                return 'I had trouble analyzing your progress. Please try again.';
            }

            if (!logs || logs.length === 0) {
                const displayExercise = normResult.wasCorrected ? `${exercise}" (interpreted as "${normalizedExercise}` : exercise;
                return `No ${displayExercise}" data found in the last ${days} days. Try a longer timeframe or log some workouts to track your progress!`;
            }

            // Extract metric values based on exercise type
            const isCardio = ['run', 'row', 'bike', 'ski', 'swim'].some(c => normalizedExercise.includes(c));
            const dataPoints: { date: string; value: number; label: string }[] = [];

            logs.forEach(log => {
                const perf = log.performance_data;
                if (!perf) return;

                if (isCardio) {
                    // For cardio: track pace or time
                    const pace = perf.pace_per_mile_sec || perf.pace_per_500m_sec;
                    const time = perf.duration_sec || perf.time_sec;
                    const distance = perf.distance_miles || perf.distance_meters;

                    if (pace) {
                        dataPoints.push({ date: log.date, value: pace, label: 'pace (sec)' });
                    } else if (time && distance) {
                        const calculatedPace = time / (perf.distance_miles || (perf.distance_meters / 1609));
                        dataPoints.push({ date: log.date, value: calculatedPace, label: 'pace (sec/mi)' });
                    }
                } else {
                    // For strength: track weight or volume
                    const weight = perf.weight || perf.weight_lbs;
                    const reps = perf.reps || 1;

                    if (weight) {
                        dataPoints.push({ date: log.date, value: weight, label: 'weight (lbs)' });
                    }
                    // Also track volume (weight × reps) for overall strength trend
                    if (weight && reps) {
                        dataPoints.push({ date: log.date, value: weight * reps, label: 'volume (lbs×reps)' });
                    }
                }
            });

            if (dataPoints.length < 2) {
                return `Found ${logs.length} ${normalizedExercise} log(s) but not enough performance data to calculate a trend. Try logging more detailed workouts (weight, reps, pace, etc).`;
            }

            // Calculate trend using simple linear regression
            const weightPoints = dataPoints.filter(p => p.label.includes('weight') && !p.label.includes('volume'));
            const analyzePoints = weightPoints.length >= 2 ? weightPoints : dataPoints;

            const n = analyzePoints.length;
            const firstHalf = analyzePoints.slice(0, Math.floor(n / 2));
            const secondHalf = analyzePoints.slice(Math.floor(n / 2));

            const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

            const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

            // Determine trend direction (for cardio lower is better, for strength higher is better)
            let trendDirection: string;
            let analysis: string;

            if (isCardio) {
                // Lower pace = faster = better
                if (changePercent < -2) {
                    trendDirection = 'improving';
                    analysis = `Your ${normalizedExercise} pace improved by ${Math.abs(changePercent).toFixed(1)}% - you're getting faster!`;
                } else if (changePercent > 2) {
                    trendDirection = 'declining';
                    analysis = `Your ${normalizedExercise} pace slowed by ${changePercent.toFixed(1)}%. Consider recovery or training adjustments.`;
                } else {
                    trendDirection = 'stable';
                    analysis = `Your ${normalizedExercise} pace is consistent. You're maintaining your fitness level.`;
                }
            } else {
                // Higher weight = stronger = better
                if (changePercent > 2) {
                    trendDirection = 'improving';
                    analysis = `Your ${normalizedExercise} strength increased by ${changePercent.toFixed(1)}% - you're getting stronger!`;
                } else if (changePercent < -2) {
                    trendDirection = 'declining';
                    analysis = `Your ${normalizedExercise} strength decreased by ${Math.abs(changePercent).toFixed(1)}%. Consider recovery, nutrition, or programming adjustments.`;
                } else {
                    trendDirection = 'stable';
                    analysis = `Your ${normalizedExercise} is stable. Consider progressive overload if you want to break through.`;
                }
            }

            const result = {
                exercise: normalizedExercise,
                wasCorrected: normResult.wasCorrected,
                original: normResult.wasCorrected ? exercise : undefined,
                period: `Last ${days} days`,
                data_points: analyzePoints.length,
                sessions: logs.length,
                trend: {
                    direction: trendDirection,
                    change_percent: Math.round(changePercent * 10) / 10,
                    first_period_avg: Math.round(firstAvg * 10) / 10,
                    second_period_avg: Math.round(secondAvg * 10) / 10,
                    metric: analyzePoints[0]?.label || 'performance',
                },
                analysis,
                recent_values: analyzePoints.slice(-5).map(p => ({
                    date: p.date,
                    value: Math.round(p.value * 10) / 10,
                })),
            };

            // Log token usage
            const tokens = estimateJsonTokens(result);
            logTokenUsage('getTrendAnalysis', tokens, MAX_TOOL_RESULT_TOKENS);

            // Log analytics
            logToolCall({
                toolName: 'getTrendAnalysis',
                exerciseName: exercise,
                normalizedName: normalizedExercise,
                wasCorrected: normResult.wasCorrected,
                days,
                userId,
            });

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getTrendAnalysis:', error);
            Sentry.captureException(error);
            return 'An error occurred while analyzing your progress. Please try again.';
        }
    }
});
