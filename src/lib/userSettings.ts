import { createClient } from "@/utils/supabase/client";

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

// Get the current user ID (demo or authenticated)
export async function getCurrentUserId(): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If no authenticated user, use demo account
    return user?.id || DEMO_USER_ID;
}

// Check if current user is in demo mode
export async function isGuestMode(): Promise<boolean> {
    const userId = await getCurrentUserId();
    return userId === DEMO_USER_ID;
}

// Fetch user settings
export async function getUserSettings(): Promise<UserSettings> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, ai_name, ai_personality, units, theme, notifications_enabled, data_privacy, is_demo_account')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('Error fetching settings:', error);
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
        data_privacy: data.data_privacy || DEFAULT_SETTINGS.data_privacy,
        is_demo_account: data.is_demo_account || false,
    };
}

// Save user settings
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    // Don't allow modifying demo account settings in production
    if (userId === DEMO_USER_ID) {
        // Just return success but don't actually save
        return { success: true };
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            ai_name: settings.ai_name,
            ai_personality: settings.ai_personality,
            units: settings.units,
            theme: settings.theme,
            notifications_enabled: settings.notifications_enabled,
            data_privacy: settings.data_privacy,
        })
        .eq('id', userId);

    if (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Update a single setting
export async function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
): Promise<{ success: boolean; error?: string }> {
    return saveUserSettings({ [key]: value } as Partial<UserSettings>);
}
