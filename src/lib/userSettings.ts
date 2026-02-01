import { createClient } from "@/utils/supabase/client";
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

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
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

// Get the current user ID (demo or authenticated)
export async function getCurrentUserId(): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) return user.id;

    // Only fallback to demo if guest cookie is explicitly present
    const isGuest = typeof document !== 'undefined' &&
        document.cookie.split(';').some(c => c.trim().startsWith('guest-mode=true'));

    if (isGuest) return DEMO_USER_ID;

    // If no user and no guest cookie, return null
    return null;
}

// Check if current user is in demo mode
export async function isGuestMode(): Promise<boolean> {
    const userId = await getCurrentUserId();
    return userId === DEMO_USER_ID;
}

// Fetch user settings
export async function getUserSettings(): Promise<UserSettings | null> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    // If no user ID (not authenticated and not guest), return null
    if (!userId) {
        console.log('[getUserSettings] No user ID - user is unauthenticated');
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, ai_name, ai_personality, units, theme, notifications_enabled, data_privacy, is_demo_account')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('[getUserSettings] Error fetching settings:', error);
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

// Save user settings
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    // Allow demo user to update settings for local testing (they share the demo profile)

    // Only include fields that are actually provided (not undefined)
    const updateData: Record<string, unknown> = {};
    if (settings.ai_name !== undefined) updateData.ai_name = settings.ai_name;
    if (settings.ai_personality !== undefined) updateData.ai_personality = settings.ai_personality;
    if (settings.units !== undefined) updateData.units = settings.units;
    if (settings.theme !== undefined) updateData.theme = settings.theme;
    if (settings.notifications_enabled !== undefined) updateData.notifications_enabled = settings.notifications_enabled;
    if (settings.data_privacy !== undefined) updateData.data_privacy = settings.data_privacy;

    console.log('[saveUserSettings] Updating for user:', userId, 'with:', updateData);

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

