-- Add Cardio Fields to Profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mile_time_sec numeric,
    ADD COLUMN IF NOT EXISTS k5_time_sec numeric,
    ADD COLUMN IF NOT EXISTS sprint_400m_sec numeric;
-- Create PR History Table for the "Star System"
CREATE TABLE public.pr_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    exercise_name text NOT NULL,
    value numeric NOT NULL,
    unit text NOT NULL,
    -- 'lbs', 'kg', 'sec', 'min'
    pr_type text NOT NULL,
    -- '1RM', '3RM', '5k', 'Mile'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS Policies
ALTER TABLE public.pr_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own PR history" ON public.pr_history FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PR history" ON public.pr_history FOR
INSERT WITH CHECK (auth.uid() = user_id);