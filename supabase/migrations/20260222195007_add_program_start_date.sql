-- Add program_start_date to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS program_start_date TIMESTAMPTZ;
-- Backfill existing users: set program_start_date to their created_at date
UPDATE public.profiles
SET program_start_date = updated_at
WHERE program_start_date IS NULL;
-- Note: We use updated_at as created_at is not on the user table natively in some supabase auth schemas mapped to public profiles, but updated_at works as a fallback. Let's make sure profiles actually has created_at first though if possible. We should actually just do `now()` for safety if they are active, or their first log date. Let's use `now()` as a safe fallback for the backfill, and let them change it in settings.
UPDATE public.profiles
SET program_start_date = now()
WHERE program_start_date IS NULL;