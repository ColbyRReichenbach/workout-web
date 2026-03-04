"use server";

import { createClient } from "@/utils/supabase/server";

export async function exportUserData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Authentication required to export data");
    }

    const userId = user.id;

    // Fetch all relevant data in parallel
    const [logs, sessions, biometrics, prs] = await Promise.all([
        supabase.from('logs').select('*').eq('user_id', userId),
        supabase.from('workout_sessions').select('*').eq('user_id', userId),
        supabase.from('biometrics').select('*').eq('user_id', userId),
        supabase.from('pr_history').select('*').eq('user_id', userId),
    ]);

    const exportData = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        workout_logs: logs.data || [],
        workout_sessions: sessions.data || [],
        biometrics: biometrics.data || [],
        personal_records: prs.data || []
    };

    return exportData;
}
