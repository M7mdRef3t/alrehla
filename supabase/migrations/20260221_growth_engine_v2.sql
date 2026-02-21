-- Migration: Payload 02 - Growth & Monetization Infrastructure
-- Date: 2026-02-21

-- 1. Extend user_profiles with Tiers and Roles
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('commander', 'owner', 'enterprise_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'commander',
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- 2. Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL, -- e.g., 'sniper', 'truth_shield'
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_key)
);

-- 3. Enable RLS on achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- 4. KPI Tracking Table (Lightweight log for Owner Dashboard)
CREATE TABLE IF NOT EXISTS public.platform_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL, -- 'start_rate_hit', 'pulse_completed', 'conversion_hit'
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.platform_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view KPIs"
    ON public.platform_kpis FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'owner'));

-- 5. Helper Function for Owner Analytics
CREATE OR REPLACE FUNCTION public.get_platform_funnel_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_visits INT;
    pulse_completions INT;
    premium_conversions INT;
BEGIN
    SELECT COUNT(*) INTO total_visits FROM public.platform_kpis WHERE event_name = 'start_rate_hit';
    SELECT COUNT(*) INTO pulse_completions FROM public.platform_kpis WHERE event_name = 'pulse_completed';
    SELECT COUNT(*) INTO premium_conversions FROM public.user_profiles WHERE subscription_tier = 'premium';

    RETURN jsonb_build_object(
        'total_visits', total_visits,
        'pulse_completions', pulse_completions,
        'premium_conversions', premium_conversions,
        'start_rate', CASE WHEN total_visits = 0 THEN 0 ELSE (total_visits::float / NULLIF(total_visits, 0)) END, -- Simplified for now
        'timestamp', now()
    );
END;
$$;
