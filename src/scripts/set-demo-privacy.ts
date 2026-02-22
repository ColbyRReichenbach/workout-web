/**
 * set-demo-privacy.ts
 *
 * Updates the data_privacy setting for the demo user in Supabase.
 * Called before promptfoo AI evaluations to ensure the demo account
 * is in the correct privacy mode (Analysis = data visible to AI,
 * Private = data hidden from AI).
 *
 * Usage: npx tsx src/scripts/set-demo-privacy.ts <Analysis|Private>
 *
 * Exits 0 even on failure so the CI pipeline is not blocked when
 * running against a CI environment with no real Supabase instance.
 */

import { createClient } from '@supabase/supabase-js';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const VALID_SETTINGS = ['Analysis', 'Private'];

async function main(): Promise<void> {
    const setting = process.argv[2];

    if (!setting || !VALID_SETTINGS.includes(setting)) {
        console.error(`[set-demo-privacy] Usage: set-demo-privacy.ts <${VALID_SETTINGS.join('|')}>`);
        process.exit(1);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn('[set-demo-privacy] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping');
        process.exit(0);
    }

    // Skip silently when running against the CI placeholder URL
    if (url.includes('test.supabase.co') || url === 'placeholder') {
        console.log('[set-demo-privacy] CI/test environment detected — skipping database update');
        process.exit(0);
    }

    try {
        const supabase = createClient(url, key);
        const { error } = await supabase
            .from('profiles')
            .update({ data_privacy: setting })
            .eq('id', DEMO_USER_ID);

        if (error) {
            console.warn(`[set-demo-privacy] Could not update privacy setting: ${error.message}`);
        } else {
            console.log(`[set-demo-privacy] Demo user data_privacy set to: ${setting}`);
        }
    } catch (err) {
        // Network failure (e.g. unreachable Supabase in CI)
        console.warn(`[set-demo-privacy] Supabase unreachable — skipping: ${(err as Error).message}`);
    }

    // Always exit 0 so the pipeline is not blocked
    process.exit(0);
}

main();
