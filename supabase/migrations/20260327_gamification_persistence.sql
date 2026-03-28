-- Migration: Payload 04 - Gamification Persistence Layer
-- Date: 2026-03-27

-- 1. Standardize user_achievements table
-- Handle legacy 'badge_key' from 20260221 migration if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_achievements' AND column_name='badge_key') THEN
        ALTER TABLE public.user_achievements RENAME COLUMN badge_key TO achievement_id;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, achievement_id)
);

-- Ensure RLS is active
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for clarity
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points"
    ON public.user_points FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Create add_user_points RPC
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_points (user_id, total_points, last_updated_at)
    VALUES (p_user_id, p_amount, now())
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = public.user_points.total_points + p_amount,
        last_updated_at = now();
END;
$$;
