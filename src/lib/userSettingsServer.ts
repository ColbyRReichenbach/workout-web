import { createClient } from "@/utils/supabase/server";
import { DEMO_USER_ID } from "@/lib/constants";

export interface UserSettings {
    id: string;
    full_name: string | null;
    ai_name: string;
    ai_personality: string;
    units: string;
    theme: string;
    notifications_enabled: boolean;
    data_privacy: string;
    is_demo_account: boolean;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
    full_name: null,
    ai_name: 'ECHO-P1',
    ai_personality: 'Stoic',
    units: 'Imperial (lb)',
    theme: 'Pulse Light',
    notifications_enabled: true,
    data_privacy: 'Analysis',
    is_demo_account: false,
};

// Re-export DEMO_USER_ID for backwards compatibility
export { DEMO_USER_ID };

// Fetch user settings using server-side Supabase client (for Server Components)
export async function getUserSettingsServer(): Promise<UserSettings> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || DEMO_USER_ID;
    console.log('[getUserSettingsServer] Fetching for user:', userId);

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, ai_name, ai_personality, units, theme, notifications_enabled, data_privacy, is_demo_account')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('[getUserSettingsServer] Error fetching settings:', error);
        return { id: userId, ...DEFAULT_SETTINGS };
    }

    return {
        id: data.id,
        full_name: data.full_name,
        ai_name: data.ai_name || DEFAULT_SETTINGS.ai_name,
        ai_personality: data.ai_personality || DEFAULT_SETTINGS.ai_personality,
        units: data.units || DEFAULT_SETTINGS.units,
        theme: data.theme || DEFAULT_SETTINGS.theme,
        notifications_enabled: data.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
        data_privacy: (userId === DEMO_USER_ID) ? DEFAULT_SETTINGS.data_privacy : (data.data_privacy || DEFAULT_SETTINGS.data_privacy),
        is_demo_account: data.is_demo_account || false,
    };
}
