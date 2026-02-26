"use server";
import { normalizeUnit } from "@/utils/units";

import { createClient } from "@/utils/supabase/server";
import { DEMO_USER_ID } from "@/lib/userSettingsServer";

export async function getAnalyticsData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no authenticated user, default to demo user for initial analytics view
    const currentUserId = user?.id || DEMO_USER_ID;

    // Parallelize all data fetching with explicit user filters
    const [
        { data: profile },
        { data: volumeData, error: volumeError },
        { data: sleepData, error: sleepError },
        { data: readinessData, error: readinessError },
        { data: prHistoryData, error: prHistoryError }
    ] = await Promise.all([
        supabase.from('profiles').select('current_week, current_phase, units, program_start_date, squat_max, bench_max, deadlift_max, front_squat_max, ohp_max, clean_jerk_max, snatch_max, mile_time_sec, k5_time_sec, sprint_400m_sec, row_2k_sec, row_500m_sec, ski_1k_sec, bike_max_watts, zone2_pace_per_mile_sec, tempo_pace_per_mile_sec, zone2_row_pace_500m_sec').eq('id', currentUserId).single(),
        supabase.from('logs').select('date, performance_data, segment_name, phase_id, tracking_mode, week_number, day_name').eq('user_id', currentUserId).order('date', { ascending: true }),
        supabase.from('sleep_logs').select('date, asleep_minutes, hrv_ms, resting_hr, deep_sleep_minutes, rem_sleep_minutes, core_sleep_minutes, awake_minutes, sleep_efficiency_score, avg_hr_sleeping, respiratory_rate').eq('user_id', currentUserId).order('date', { ascending: true }),
        supabase.from('readiness_logs').select('date, readiness_score').eq('user_id', currentUserId).order('date', { ascending: true }),
        supabase.from('pr_history').select('id, exercise_name, value, unit, pr_type, date, created_at').eq('user_id', currentUserId).order('date', { ascending: true })
    ]);

    if (volumeError || sleepError || readinessError) {
        console.error("Error fetching analytics:", { volumeError, sleepError, readinessError, prHistoryError });
        return null;
    }

    return {
        volumeData: volumeData || [],
        sleepData: sleepData || [],
        readinessData: readinessData || [],
        prHistoryData: prHistoryData || [],
        profile: {
            currentPhase: profile?.current_phase || 1,
            currentWeek: profile?.current_week || 1,
            currentUnit: normalizeUnit(profile?.units),
            squat_max: profile?.squat_max,
            bench_max: profile?.bench_max,
            deadlift_max: profile?.deadlift_max,
            front_squat_max: profile?.front_squat_max,
            ohp_max: profile?.ohp_max,
            clean_jerk_max: profile?.clean_jerk_max,
            snatch_max: profile?.snatch_max,
            mile_time_sec: profile?.mile_time_sec,
            k5_time_sec: profile?.k5_time_sec,
            sprint_400m_sec: profile?.sprint_400m_sec,
            row_2k_sec: profile?.row_2k_sec,
            row_500m_sec: profile?.row_500m_sec,
            ski_1k_sec: profile?.ski_1k_sec,
            bike_max_watts: profile?.bike_max_watts,
            zone2_pace_per_mile_sec: profile?.zone2_pace_per_mile_sec,
            tempo_pace_per_mile_sec: profile?.tempo_pace_per_mile_sec,
            zone2_row_pace_500m_sec: profile?.zone2_row_pace_500m_sec,
            program_start_date: profile?.program_start_date,
        }
    };
}
