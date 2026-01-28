import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Scope Queries by User ID
    const { data: volumeData, error: volumeError } = await supabase
        .from('logs')
        .select('date, performance_data, segment_name')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

    const { data: sleepData, error: sleepError } = await supabase
        .from('sleep_logs')
        .select('date, asleep_minutes, hrv_ms, resting_hr')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

    const { data: readinessData, error: readinessError } = await supabase
        .from('readiness_logs')
        .select('date, readiness_score')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

    return NextResponse.json({
        volumeCount: volumeData?.length || 0,
        sleepCount: sleepData?.length || 0,
        readinessCount: readinessData?.length || 0,
        volumeError: volumeError?.message,
        sleepError: sleepError?.message,
        readinessError: readinessError?.message,
        sampleVolume: volumeData?.slice(0, 3),
        sampleSleep: sleepData?.slice(0, 3),
        sampleReadiness: readinessData?.slice(0, 3)
    });
}
