# Database Reseed & Full Restoration Protocol

This document outlines the proven process for correctly seeding/restoring the Pulse Tracker database with a full 52-week training history and master library. Use this protocol if the database is cleared or data integrity is lost.

## 1. The "What" (Goal)
To re-establish a complete "Demo Athlete" environment containing:
- A specific Guest Profile (`97b3e90f-14ba-4253-abef-dd0f02ede7a5`).
- 52 weeks of synthetic historical training data (Sleep, Readiness, Logs, PRs).
- A fully populated Workout Library with all 5 Phases of the Hybrid Athlete Master Plan.

## 2. The "Why" (Constraints & Lessons Learned)
- **Constraint: ID Consistency**: Logs, sessions, and PRs all have foreign key dependencies. The profile *must* exist with the correct UUID before any logs can be inserted.
- **Constraint: SQL Size Limits**: Supabase/Npx execution fails (Error 137) on very large SQL files (e.g., a single file for 1 year of data). Data must be chunked into ~300-line batches.
- **Constraint: Foreign Keys**: Tables like `pr_history` may have legacy constraints pointing to `auth.users`. These must be redirected to `public.profiles` to allow demo mode seeding.
- **Constraint: JSONB Limits**: Large program JSON strings can be truncated or fail in raw SQL execution. Phase-by-phase updates using `jsonb_set` are more reliable.

## 3. The "How" (Step-by-Step Restoration)

### Step A: Database Schema Fixes
Ensure foreign key constraints allow seeding. Run this first:
```sql
-- Fix PR History constraint if it points to auth.users
ALTER TABLE public.pr_history DROP CONSTRAINT IF EXISTS pr_history_user_id_fkey;
ALTER TABLE public.pr_history 
ADD CONSTRAINT pr_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

### Step B: Essential Scripts
Maintenance scripts found in `/scripts`:
1.  `synthesize_data.js`: Generates the 52-week raw SQL for logs.
2.  `split_sql.js`: Splits the massive SQL file into small chunks (use `linesPerChunk = 300`).
3.  `generate_52_weeks.js`: Generates the full Master Plan JSON for the library.
4.  `generate_library_phases_sql.js`: Generates individual SQL commands to push the library phases.

### Step C: The Execution Sequence
1.  **Seed Profile**: Create/Upsert the profile `97b3e90f-14ba-4253-abef-dd0f02ede7a5`.
2.  **Clear Old Data**: Delete logs associated with that specific ID.
3.  **Execute Batches**: Run the chunks produced by `split_sql.js` in sequential order via `npx supabase db execute --file`.
4.  **Populate Library**: 
    - Initialize the library entry with empty phases: `{"phases": []}`.
    - Append each phase one-by-one using the output from `generate_library_phases_sql.js`.

## 4. Key References
- **Target Profile ID**: `97b3e90f-14ba-4253-abef-dd0f02ede7a5`
- **Library Target Name**: `Hybrid Athlete Master Plan`
- **Data Range**: 1 Full Year (June 2024 - May 2025)

---
*Note: Always verify the Profile exists before running log insertions. If insertion fails with "Key not present in table users", refer to Step A.*
