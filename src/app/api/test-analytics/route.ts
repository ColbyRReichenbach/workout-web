import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    const { data: volumeData, error: volumeError } = await supabase
        .from('logs')
        .select('date, performance_data, segment_name')
        .order('date', { ascending: true });

    const { data: sleepData, error: sleepError } = await supabase
        .from('sleep_logs')
        .select('date, asleep_minutes, hrv_ms, resting_hr')
        .order('date', { ascending: true });

    const { data: readinessData, error: readinessError } = await supabase
        .from('readiness_logs')
        .select('date, readiness_score')
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
