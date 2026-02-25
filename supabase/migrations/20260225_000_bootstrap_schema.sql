-- Phase 26 Bootstrap: Add all missing schema required by the Phoenix Engine
-- This migration ensures all dependent tables and columns exist before creating views.

-- ============================================================
-- 1. Add missing columns to profiles 
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS awareness_vector JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sovereignty_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. Create user_trajectories table (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'composing',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    initial_vector JSONB,
    final_vector JSONB,
    growth_delta JSONB,
    sovereignty_score INTEGER DEFAULT 0,
    cognitive_bandwidth FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_user_trajectory 
    ON public.user_trajectories (user_id) WHERE status = 'active';

-- ============================================================
-- 3. Create system_telemetry_logs table (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    action TEXT,
    payload JSONB DEFAULT '{}',
    user_id UUID,
    status TEXT DEFAULT 'success',
    latency_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Create command_center_stats table (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.command_center_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id),
    trajectory_lock_until TIMESTAMPTZ,
    recovery_triggers_this_journey INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Create resonance_nudge_logs table (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resonance_nudge_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    nudge_type TEXT,
    context_sentiment TEXT,
    nudge_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN profiles.awareness_vector IS 'JSONB vector containing rs, av, bi, se, cb, is_insulated etc.';
COMMENT ON COLUMN profiles.sovereignty_score IS 'Cumulative score representing sovereignty rank.';
