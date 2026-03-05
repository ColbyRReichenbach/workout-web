-- ============================================================
-- RLS Security Hardening
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- PURPOSE:
--   1. Ensure RLS is enabled on every user-data table.
--   2. Verify each table has correct owner-only SELECT/INSERT/UPDATE/DELETE policies.
--   3. REVOKE column-level UPDATE on is_admin and is_demo_account from the
--      'authenticated' role so no JWT-bearing API call can escalate privileges.
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies so this is idempotent
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"  ON public.profiles;

-- Users can read only their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- New users can create their own profile row (onboarding upsert)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile row
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users cannot delete their profile (admin / service-role only)
-- No DELETE policy = no client can delete profiles.

-- ── CRITICAL: Revoke column-level UPDATE on privilege fields ─────────────────
-- This prevents a user from calling the Supabase REST API directly (with their
-- JWT token) and including  { "is_admin": true }  in the PATCH body.
-- Even if the row-level UPDATE policy passes, PostgreSQL will reject writes to
-- these columns from the authenticated role.
REVOKE UPDATE (is_admin, is_demo_account) ON public.profiles FROM authenticated;


-- ── 2. LOGS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_own"  ON public.logs;
DROP POLICY IF EXISTS "logs_insert_own"  ON public.logs;
DROP POLICY IF EXISTS "logs_update_own"  ON public.logs;
DROP POLICY IF EXISTS "logs_delete_own"  ON public.logs;

CREATE POLICY "logs_select_own" ON public.logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "logs_insert_own" ON public.logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_update_own" ON public.logs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_delete_own" ON public.logs
    FOR DELETE USING (auth.uid() = user_id);


-- ── 3. WORKOUT_SESSIONS ───────────────────────────────────────────────────────

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_own"  ON public.workout_sessions;
DROP POLICY IF EXISTS "sessions_insert_own"  ON public.workout_sessions;
DROP POLICY IF EXISTS "sessions_update_own"  ON public.workout_sessions;
DROP POLICY IF EXISTS "sessions_delete_own"  ON public.workout_sessions;

CREATE POLICY "sessions_select_own" ON public.workout_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own" ON public.workout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON public.workout_sessions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own" ON public.workout_sessions
    FOR DELETE USING (auth.uid() = user_id);


-- ── 4. BIOMETRICS ─────────────────────────────────────────────────────────────

ALTER TABLE public.biometrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "biometrics_select_own"  ON public.biometrics;
DROP POLICY IF EXISTS "biometrics_insert_own"  ON public.biometrics;
DROP POLICY IF EXISTS "biometrics_update_own"  ON public.biometrics;
DROP POLICY IF EXISTS "biometrics_delete_own"  ON public.biometrics;

CREATE POLICY "biometrics_select_own" ON public.biometrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "biometrics_insert_own" ON public.biometrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "biometrics_update_own" ON public.biometrics
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "biometrics_delete_own" ON public.biometrics
    FOR DELETE USING (auth.uid() = user_id);


-- ── 5. PR_HISTORY ─────────────────────────────────────────────────────────────

ALTER TABLE public.pr_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pr_history_select_own"  ON public.pr_history;
DROP POLICY IF EXISTS "pr_history_insert_own"  ON public.pr_history;
DROP POLICY IF EXISTS "pr_history_update_own"  ON public.pr_history;
DROP POLICY IF EXISTS "pr_history_delete_own"  ON public.pr_history;

CREATE POLICY "pr_history_select_own" ON public.pr_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pr_history_insert_own" ON public.pr_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_history_update_own" ON public.pr_history
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_history_delete_own" ON public.pr_history
    FOR DELETE USING (auth.uid() = user_id);


-- ── 6. SLEEP_LOGS ─────────────────────────────────────────────────────────────

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sleep_logs_select_own"  ON public.sleep_logs;
DROP POLICY IF EXISTS "sleep_logs_insert_own"  ON public.sleep_logs;
DROP POLICY IF EXISTS "sleep_logs_update_own"  ON public.sleep_logs;
DROP POLICY IF EXISTS "sleep_logs_delete_own"  ON public.sleep_logs;

CREATE POLICY "sleep_logs_select_own" ON public.sleep_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sleep_logs_insert_own" ON public.sleep_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_logs_update_own" ON public.sleep_logs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_logs_delete_own" ON public.sleep_logs
    FOR DELETE USING (auth.uid() = user_id);


-- ── 7. READINESS_LOGS ─────────────────────────────────────────────────────────

ALTER TABLE public.readiness_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "readiness_logs_select_own"  ON public.readiness_logs;
DROP POLICY IF EXISTS "readiness_logs_insert_own"  ON public.readiness_logs;
DROP POLICY IF EXISTS "readiness_logs_update_own"  ON public.readiness_logs;
DROP POLICY IF EXISTS "readiness_logs_delete_own"  ON public.readiness_logs;

CREATE POLICY "readiness_logs_select_own" ON public.readiness_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "readiness_logs_insert_own" ON public.readiness_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "readiness_logs_update_own" ON public.readiness_logs
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "readiness_logs_delete_own" ON public.readiness_logs
    FOR DELETE USING (auth.uid() = user_id);


-- ── 8. AI_FEEDBACK ────────────────────────────────────────────────────────────

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_feedback_select_own"  ON public.ai_feedback;
DROP POLICY IF EXISTS "ai_feedback_insert_own"  ON public.ai_feedback;
DROP POLICY IF EXISTS "ai_feedback_update_own"  ON public.ai_feedback;
DROP POLICY IF EXISTS "ai_feedback_delete_own"  ON public.ai_feedback;

-- Users read only their own feedback
CREATE POLICY "ai_feedback_select_own" ON public.ai_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_feedback_insert_own" ON public.ai_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback rows are immutable once submitted (no UPDATE/DELETE policy for clients)


-- ── 9. AI_LOGS ────────────────────────────────────────────────────────────────
-- ai_logs are engineering / observability records written by the server (service
-- role key). Regular users should never be able to read, write, or modify them
-- directly via the client SDK.  Only the service-role key (server-side) bypasses
-- RLS, so disabling client access here is correct.

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_logs_no_client_access" ON public.ai_logs;

-- Deny all authenticated client access — service role is not affected by RLS.
CREATE POLICY "ai_logs_no_client_access" ON public.ai_logs
    FOR ALL USING (false);


-- ── 10. WORKOUT_LIBRARY (read-only shared data) ───────────────────────────────
-- workout_library is shared program data that ALL users can read but NONE can
-- write (mutations via service role / admin dashboard only).

ALTER TABLE public.workout_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_library_public_read" ON public.workout_library;
DROP POLICY IF EXISTS "workout_library_no_write"    ON public.workout_library;

CREATE POLICY "workout_library_public_read" ON public.workout_library
    FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policy for clients → only service-role can mutate.


-- ── VERIFICATION QUERIES (run manually to confirm) ───────────────────────────
-- Check that is_admin / is_demo_account are not in the column grants:
--
--   SELECT grantee, table_name, column_name, privilege_type
--   FROM information_schema.column_privileges
--   WHERE table_name = 'profiles'
--     AND grantee = 'authenticated'
--     AND privilege_type = 'UPDATE';
--
-- Expected: is_admin and is_demo_account should NOT appear in this result.
