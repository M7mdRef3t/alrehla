-- Phase 10: Complete Supabase Schema for Dawayir

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    user_id UUID, -- For cases where session ID acts as the primary ID before login
    email VARCHAR(255),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'active',
    current_period_end TIMESTAMP WITH TIME ZONE,
    xp INTEGER DEFAULT 0,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    daily_ai_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Note: `id` in profiles might occasionally receive string session IDs in anonymous tracking,
-- therefore a secondary structure or altering `id` to VARCHAR might be necessary if strict UUID is not enforced by auth trigger.
-- Given standard Supabase setup, if `id` is UUID from auth, anonymous tracking uses `journey_events` with string `session_id`.
-- However `journeyTracking.ts` upserts session IDs into `profiles.id`. We must change `profiles.id` to VARCHAR if it stores sessions.
ALTER TABLE public.profiles ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey; -- Remove strict foreign key if it was just added

-- 2. Journey Maps Table (Radar Data)
CREATE TABLE IF NOT EXISTS public.journey_maps (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id UUID,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_local_save_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Daily Pulse Logs
CREATE TABLE IF NOT EXISTS public.daily_pulse_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    user_id UUID,
    energy INTEGER,
    mood INTEGER,
    focus VARCHAR(255),
    auto BOOLEAN DEFAULT false,
    energy_reasons TEXT[],
    energy_confidence VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Journey Events (Analytics / Tracker)
CREATE TABLE IF NOT EXISTS public.journey_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    user_id UUID,
    mode VARCHAR(50),
    type VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Coach Invites (B2B Portal)
CREATE TABLE IF NOT EXISTS public.coach_invites (
    code VARCHAR(50) PRIMARY KEY,
    coach_id VARCHAR(255) REFERENCES public.profiles(id) ON DELETE CASCADE,
    used_by VARCHAR(255) REFERENCES public.profiles(id) ON DELETE SET NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. RLS Policies (Row Level Security Basics)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pulse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

-- Note: In a production environment, strict policies should be created for each table.
-- For the Demo/Development phase, we allow authenticated and anon inserts/selects for telemetry if needed,
-- but the focus is on a functional backend.
