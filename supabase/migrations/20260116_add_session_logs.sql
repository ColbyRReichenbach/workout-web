-- Create Session Logs table for Pre/Post Flight data
CREATE TABLE public.session_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    -- Pre-Flight
    sleep_hours numeric,
    soreness text,
    -- 'none', 'low', 'high'
    -- Post-Flight
    session_rpe numeric,
    notes text,
    tags text [],
    -- Array of strings e.g. ['Felt Heavy', 'Great Pump']
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own session logs" ON public.session_logs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own session logs" ON public.session_logs FOR
INSERT WITH CHECK (auth.uid() = user_id);