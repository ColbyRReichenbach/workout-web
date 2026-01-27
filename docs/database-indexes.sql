-- ============================================
-- Pulse Tracker - Recommended Database Indexes
-- ============================================
--
-- This file contains recommended indexes for optimal query performance.
-- Run these in your Supabase SQL editor or via migrations.
--
-- IMPORTANT: Always analyze your specific query patterns before adding indexes.
-- Indexes speed up reads but slow down writes.
--

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Primary key already indexed by default (id)

-- Index for looking up demo user (used in guest mode)
CREATE INDEX IF NOT EXISTS idx_profiles_demo_user
ON profiles (id)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- LOGS TABLE
-- ============================================

-- Compound index for fetching user's logs by date (most common query)
-- Used by: AI tools, dashboard, workout history
CREATE INDEX IF NOT EXISTS idx_logs_user_date
ON logs (user_id, date DESC);

-- Index for filtering by segment within a user's logs
-- Used by: AI tools with filter parameter
CREATE INDEX IF NOT EXISTS idx_logs_user_segment
ON logs (user_id, segment_name);

-- Index for weekly analytics queries
-- Used by: Dashboard week view, AI progress analysis
CREATE INDEX IF NOT EXISTS idx_logs_user_week
ON logs (user_id, week_number, day_name);

-- ============================================
-- BIOMETRICS TABLE
-- ============================================

-- Compound index for fetching user's biometrics by date
-- Used by: AI tools, analytics dashboard
CREATE INDEX IF NOT EXISTS idx_biometrics_user_date
ON biometrics (user_id, date DESC);

-- ============================================
-- WORKOUT_SESSIONS TABLE
-- ============================================

-- Index for finding user's sessions by day/week
-- Used by: Workout page session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_user_day_week
ON workout_sessions (user_id, day_name, week_number);

-- ============================================
-- PR_HISTORY TABLE
-- ============================================

-- Index for fetching user's PR history
-- Used by: PR tracking, analytics
CREATE INDEX IF NOT EXISTS idx_pr_history_user_date
ON pr_history (user_id, created_at DESC);

-- ============================================
-- PERFORMANCE DATA JSONB INDEXES (Optional)
-- ============================================

-- GIN index for searching within performance_data JSONB
-- Only add if you frequently query by specific fields within the JSONB
-- CREATE INDEX IF NOT EXISTS idx_logs_performance_data
-- ON logs USING GIN (performance_data);

-- ============================================
-- ANALYZE AFTER CREATING INDEXES
-- ============================================

-- Run ANALYZE to update statistics after creating indexes
-- ANALYZE profiles;
-- ANALYZE logs;
-- ANALYZE biometrics;
-- ANALYZE workout_sessions;
-- ANALYZE pr_history;

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Check index usage (run periodically to ensure indexes are being used):
--
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Find unused indexes:
--
-- SELECT
--     schemaname || '.' || relname AS table,
--     indexrelname AS index,
--     pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
--     idx_scan as index_scans
-- FROM pg_stat_user_indexes ui
-- JOIN pg_index i ON ui.indexrelid = i.indexrelid
-- WHERE NOT indisunique AND idx_scan < 50
-- ORDER BY pg_relation_size(i.indexrelid) DESC;
