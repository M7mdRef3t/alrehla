-- Gamification Schema Update
-- Adds xp and level to profiles table
-- Creates user_badges table for achievements

-- 1. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

-- 2. Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    earned_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure a user can only earn a specific badge once
    UNIQUE(user_id, badge_id)
);

-- 3. Row Level Security for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
    ON public.user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
    ON public.user_badges FOR DELETE
    USING (auth.uid() = user_id);

-- Optional enhancements:
-- Add an index for quick badge fetching
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
