-- Migration: Harden profiles table for Sovereign Identity
-- Date: 2026-04-24
-- Author: Antigravity

-- 1. Ensure columns exist in profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS ecosystem_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

-- 2. Enable RLS for self-updates
-- Users should be able to update their own bio and ecosystem data.
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 3. Create RPC for safe ecosystem data merging
-- This allows satellites to push specific updates without overwriting the entire object.
-- It performs a top-level merge of keys.
CREATE OR REPLACE FUNCTION update_profiles_ecosystem_data(p_ecosystem_data JSONB)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ecosystem_data = COALESCE(ecosystem_data, '{}'::jsonb) || p_ecosystem_data
  WHERE id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comment columns for clarity
COMMENT ON COLUMN public.profiles.bio IS 'User-provided short biography or note about their journey.';
COMMENT ON COLUMN public.profiles.ecosystem_data IS 'Shared global state across all Dawayir ecosystem products.';
COMMENT ON COLUMN public.profiles.subscription_status IS 'The current tier of the user (free, pro, etc.)';
