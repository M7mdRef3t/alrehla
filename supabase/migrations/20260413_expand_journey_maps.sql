-- Expansion of journey_maps table for Hub-and-Spoke architecture
-- Date: 2026-04-13

-- 1. Ensure columns exist for global state persistence
ALTER TABLE public.journey_maps
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS transformation_diagnosis JSONB,
  ADD COLUMN IF NOT EXISTS ai_interpretation TEXT,
  ADD COLUMN IF NOT EXISTS feeling_results JSONB,
  ADD COLUMN IF NOT EXISTS map_type TEXT DEFAULT 'masafaty',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Index user_id for fast retrieval during cross-device sync
CREATE INDEX IF NOT EXISTS journey_maps_user_id_lookup_idx ON public.journey_maps (user_id);

-- 3. Security Hardening: Ensure RLS policies are robust for this table
-- Note: These policies were also in v2-hardening but we ensure they are here too.
ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_maps_owner_select ON public.journey_maps;
CREATE POLICY journey_maps_owner_select ON public.journey_maps 
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS journey_maps_owner_all ON public.journey_maps;
CREATE POLICY journey_maps_owner_all ON public.journey_maps 
  FOR ALL USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Update the existing unique index to handle session_id properly (if it's already PK it's fine)
-- session_id is PK in schema.sql, so we're good.

COMMENT ON COLUMN public.journey_maps.transformation_diagnosis IS 'Stores the Sovereign Engine diagnostic result for the Hub-and-Spoke system.';
COMMENT ON COLUMN public.journey_maps.ai_interpretation IS 'Cinematic AI insights generated for the user profile.';
