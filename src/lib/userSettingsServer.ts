import { createClient } from "@/utils/supabase/server";

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
    data_privacy: 'Private',
    is_demo_account: false,
};

// Demo user ID for guest mode
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

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

    console.log('[getUserSettingsServer] Got settings:', { units: data.units, theme: data.theme });

    return {
        id: data.id,
        full_name: data.full_name,
        ai_name: data.ai_name || DEFAULT_SETTINGS.ai_name,
        ai_personality: data.ai_personality || DEFAULT_SETTINGS.ai_personality,
        units: data.units || DEFAULT_SETTINGS.units,
        theme: data.theme || DEFAULT_SETTINGS.theme,
        notifications_enabled: data.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
        data_privacy: data.data_privacy || DEFAULT_SETTINGS.data_privacy,
        is_demo_account: data.is_demo_account || false,
    };
}
