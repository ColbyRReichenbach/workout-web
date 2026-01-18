"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAnalyticsData() {
    const supabase = await createClient();

    // 1. Fetch User Profile for current phase/week
    const { data: profile } = await supabase
        .from('profiles')
        .select('current_week, current_phase')
        .single();

    // 2. Fetch Volume Trends (Strength)
    const { data: volumeData, error: volumeError } = await supabase
        .from('logs')
        .select('date, performance_data, segment_name, phase_id, tracking_mode')
        .order('date', { ascending: true });

    // 3. Fetch Sleep Trends (Full Data for Deep Analysis)
    const { data: sleepData, error: sleepError } = await supabase
        .from('sleep_logs')
        .select('date, asleep_minutes, hrv_ms, resting_hr, deep_sleep_minutes, rem_sleep_minutes, core_sleep_minutes, awake_minutes, sleep_efficiency_score, avg_hr_sleeping, respiratory_rate')
        .order('date', { ascending: true });

    // 4. Fetch Readiness
    const { data: readinessData, error: readinessError } = await supabase
        .from('readiness_logs')
        .select('date, readiness_score')
        .order('date', { ascending: true });

    if (volumeError || sleepError || readinessError) {
        console.error("Error fetching analytics:", { volumeError, sleepError, readinessError });
        return null;
    }

    return {
        volumeData: volumeData || [],
        sleepData: sleepData || [],
        readinessData: readinessData || [],
        profile: {
            currentPhase: profile?.current_phase || 1,
            currentWeek: profile?.current_week || 1
        }
    };
}
