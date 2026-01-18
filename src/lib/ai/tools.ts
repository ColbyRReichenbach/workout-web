import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { tool } from 'ai';

// Demo user ID for guest mode
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Constants for validation
const MAX_DAYS = 30;
const MIN_DAYS = 1;
const DEFAULT_DAYS = 7;

/**
 * Sanitize log data before exposing to AI
 * Remove sensitive fields like internal IDs and timestamps
 */
function sanitizeLogForAI(log: Record<string, unknown>): Record<string, unknown> {
    return {
        date: log.date,
        day: log.day_name,
        segment: log.segment_name,
        type: log.segment_type,
        mode: log.tracking_mode,
        data: log.performance_data,
        week: log.week_number,
        // Explicitly exclude: id, user_id, session_id, created_at, updated_at
    };
}

/**
 * Sanitize biometric data before exposing to AI
 * Only include relevant health metrics, no identifiers
 */
function sanitizeBiometricForAI(bio: Record<string, unknown>): Record<string, unknown> {
    return {
        date: bio.date,
        // Sleep metrics
        asleep_minutes: bio.asleep_minutes,
        in_bed_minutes: bio.in_bed_minutes,
        deep_sleep_minutes: bio.deep_sleep_minutes,
        rem_sleep_minutes: bio.rem_sleep_minutes,
        core_sleep_minutes: bio.core_sleep_minutes,
        awake_minutes: bio.awake_minutes,
        sleep_efficiency: bio.sleep_efficiency_score,
        // Heart metrics
        hrv_ms: bio.hrv_ms,
        resting_hr: bio.resting_hr,
        avg_hr_sleeping: bio.avg_hr_sleeping,
        // Other
        respiratory_rate: bio.respiratory_rate,
        // Explicitly exclude: id, user_id, source, raw_data, created_at, updated_at
    };
}

export const getRecentLogs = tool({
    description: 'Get the workout logs for the user for the last N days. Use this to check compliance, performance, and recent activity.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Number of days to look back'),
    }),
    execute: async ({ days }) => {
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            // Calculate date N days ago
            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            const { data: logs, error } = await supabase
                .from('logs')
                .select('date, day_name, segment_name, segment_type, tracking_mode, performance_data, week_number')
                .eq('user_id', userId)
                .gte('date', dateStr)
                .order('date', { ascending: false })
                .limit(100); // Limit to prevent excessive data

            if (error) {
                console.error('[AI Tool Error] getRecentLogs:', error.message);
                return 'Unable to fetch workout logs at this time.';
            }

            if (!logs || logs.length === 0) {
                return 'No workout logs found for this period.';
            }

            // Sanitize and format logs for AI consumption
            const sanitizedLogs = logs.map(log => sanitizeLogForAI(log));

            return JSON.stringify({
                period: `Last ${days} days`,
                count: sanitizedLogs.length,
                logs: sanitizedLogs
            }, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getRecentLogs:', error);
            return 'An error occurred while fetching workout logs.';
        }
    },
});

export const getBiometrics = tool({
    description: 'Get biometric data (HRV, Sleep, Weight) for the last N days. Use this to assess recovery and readiness.',
    inputSchema: z.object({
        days: z.number()
            .min(MIN_DAYS, `Days must be at least ${MIN_DAYS}`)
            .max(MAX_DAYS, `Days cannot exceed ${MAX_DAYS}`)
            .default(DEFAULT_DAYS)
            .describe('Number of days to look back'),
    }),
    execute: async ({ days }) => {
        try {
            const supabase = await createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEMO_USER_ID;

            const date = new Date();
            date.setDate(date.getDate() - Math.min(Math.max(days, MIN_DAYS), MAX_DAYS));
            const dateStr = date.toISOString().split('T')[0];

            // Fetch biometrics with explicit column selection (no *)
            const { data: biometrics, error } = await supabase
                .from('biometrics')
                .select(`
                    date,
                    asleep_minutes,
                    in_bed_minutes,
                    deep_sleep_minutes,
                    rem_sleep_minutes,
                    core_sleep_minutes,
                    awake_minutes,
                    sleep_efficiency_score,
                    hrv_ms,
                    resting_hr,
                    avg_hr_sleeping,
                    respiratory_rate
                `)
                .eq('user_id', userId)
                .gte('date', dateStr)
                .order('date', { ascending: false })
                .limit(100);

            if (error) {
                console.error('[AI Tool Error] getBiometrics:', error.message);
                return 'Unable to fetch biometric data at this time.';
            }

            if (!biometrics || biometrics.length === 0) {
                return 'No biometric data found for this period.';
            }

            // Sanitize data (already filtered at query level, but double-check)
            const sanitizedBiometrics = biometrics.map(bio => sanitizeBiometricForAI(bio));

            // Calculate averages for summary
            const hrvValues = biometrics.filter(b => b.hrv_ms).map(b => b.hrv_ms as number);
            const avgHRV = hrvValues.length > 0
                ? hrvValues.reduce((sum, val) => sum + val, 0) / hrvValues.length
                : null;

            const sleepValues = biometrics.filter(b => b.asleep_minutes).map(b => b.asleep_minutes as number);
            const avgSleep = sleepValues.length > 0
                ? sleepValues.reduce((sum, val) => sum + val, 0) / sleepValues.length
                : null;

            return JSON.stringify({
                period: `Last ${days} days`,
                count: sanitizedBiometrics.length,
                summary: {
                    avgHRV: avgHRV ? `${Math.round(avgHRV)} ms` : 'N/A',
                    avgSleepHours: avgSleep ? `${(avgSleep / 60).toFixed(1)} hours` : 'N/A',
                },
                data: sanitizedBiometrics
            }, null, 2);
        } catch (error) {
            console.error('[AI Tool Error] getBiometrics:', error);
            return 'An error occurred while fetching biometric data.';
        }
    },
});
