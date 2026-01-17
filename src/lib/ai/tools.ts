import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { tool } from 'ai';

export const getRecentLogs = tool({
    description: 'Get the workout logs for the user for the last N days. Use this to check compliance, performance, and recent activity.',
    parameters: z.object({
        days: z.number().min(1).max(30).default(7).describe('Number of days to look back'),
    }),
    execute: async ({ days }: { days: number }) => {
        const supabase = await createClient();

        // Calculate date N days ago
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0];

        const { data: logs, error } = await supabase
            .from('logs')
            .select('*')
            .gte('date', dateStr)
            .order('date', { ascending: false });

        if (error) {
            return `Error fetching logs: ${error.message}`;
        }

        if (!logs || logs.length === 0) {
            return "No logs found for this period.";
        }

        // Format logs for easier reading by the LLM
        return JSON.stringify(logs.map(log => ({
            date: log.date,
            day: log.day_name,
            segment: log.segment_name,
            type: log.segment_type,
            data: log.performance_data,
            completed: log.tracking_mode === 'CHECKBOX' ? true : undefined
        })), null, 2);
    },
} as any);

export const getBiometrics = tool({
    description: 'Get biometric data (HRV, Sleep, Weight) for the last N days.',
    parameters: z.object({
        days: z.number().min(1).max(30).default(7),
    }),
    execute: async ({ days }: { days: number }) => {
        const supabase = await createClient();

        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0];

        const { data: biometrics, error } = await supabase
            .from('biometrics')
            .select('*')
            .gte('date', dateStr)
            .order('date', { ascending: false });

        if (error) {
            return `Error fetching biometrics: ${error.message}`;
        }

        return JSON.stringify(biometrics, null, 2);
    }
} as any);
