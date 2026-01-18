"use server";
import { normalizeUnit } from "@/utils/units";

import { createClient } from "@/utils/supabase/server";

export async function getAnalyticsData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no authenticated user, default to demo user for initial analytics view
    const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';

    // Parallelize all data fetching with explicit user filters
    const [
        { data: profile },
        { data: volumeData, error: volumeError },
        { data: sleepData, error: sleepError },
        { data: readinessData, error: readinessError }
    ] = await Promise.all([
        supabase.from('profiles').select('current_week, current_phase, units').eq('id', currentUserId).single(),
        supabase.from('logs').select('date, performance_data, segment_name, phase_id, tracking_mode').eq('user_id', currentUserId).order('date', { ascending: true }),
        supabase.from('sleep_logs').select('date, asleep_minutes, hrv_ms, resting_hr, deep_sleep_minutes, rem_sleep_minutes, core_sleep_minutes, awake_minutes, sleep_efficiency_score, avg_hr_sleeping, respiratory_rate').eq('user_id', currentUserId).order('date', { ascending: true }),
        supabase.from('readiness_logs').select('date, readiness_score').eq('user_id', currentUserId).order('date', { ascending: true })
    ]);

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
            currentWeek: profile?.current_week || 1,
            currentUnit: normalizeUnit(profile?.units)
        }
    };
}
