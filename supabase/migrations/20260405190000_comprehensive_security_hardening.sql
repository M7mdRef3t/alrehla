/* Comprehensive Security & RLS Hardening (Phase 17)
   Goal: Enforce Zero-Trust across all tactical and behavioral tables.
   Category: Security / Schema Restoration */

-- 0. Refactored Admin Check (Prevents Recursion)
CREATE OR REPLACE FUNCTION public.is_admin_check(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id::text
      AND role IN ('admin', 'owner', 'superadmin', 'developer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. journey_maps (Vandalism Protection)
-- Restore table if missing, then harden.
CREATE TABLE IF NOT EXISTS public.journey_maps (
    session_id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_public boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    last_sync_at timestamptz DEFAULT now(),
    last_local_save_at timestamptz
);

-- Ensure is_public exists if table already existed without it
ALTER TABLE public.journey_maps ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_maps_owner_select ON public.journey_maps;
CREATE POLICY journey_maps_owner_select ON public.journey_maps
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS journey_maps_owner_upsert ON public.journey_maps;
CREATE POLICY journey_maps_owner_upsert ON public.journey_maps
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS journey_maps_admin_select ON public.journey_maps;
CREATE POLICY journey_maps_admin_select ON public.journey_maps
    FOR SELECT USING (public.is_admin_check(auth.uid()));


-- 2. command_center_stats (Auth Hardening)
ALTER TABLE public.command_center_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS command_center_stats_owner_all ON public.command_center_stats;
CREATE POLICY command_center_stats_owner_all ON public.command_center_stats
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS command_center_stats_admin_select ON public.command_center_stats;
CREATE POLICY command_center_stats_admin_select ON public.command_center_stats
    FOR SELECT USING (public.is_admin_check(auth.uid()));


-- 3. field_assets (Sovereign Resource Protection)
CREATE TABLE IF NOT EXISTS public.field_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id), -- Optional: if shared, admins will manage
    deployment_zone text,
    threat_level text DEFAULT 'Stable',
    metadata jsonb DEFAULT '{}',
    last_engagement timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.field_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS field_assets_owner_all ON public.field_assets;
CREATE POLICY field_assets_owner_all ON public.field_assets
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR public.is_admin_check(auth.uid()));


-- 4. tactical_journal (Data Leakage Protection)
CREATE TABLE IF NOT EXISTS public.tactical_journal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id uuid,
    content text,
    breach_detected boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tactical_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tactical_journal_owner_all ON public.tactical_journal;
CREATE POLICY tactical_journal_owner_all ON public.tactical_journal
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tactical_journal_admin_select ON public.tactical_journal;
CREATE POLICY tactical_journal_admin_select ON public.tactical_journal
    FOR SELECT USING (public.is_admin_check(auth.uid()));


-- 5. Refactor Profile RLS (Optimization)
DROP POLICY IF EXISTS profiles_admin_role_select ON public.profiles;
CREATE POLICY profiles_admin_role_select ON public.profiles
  FOR SELECT USING (public.is_admin_check(auth.uid()));

COMMENT ON FUNCTION public.is_admin_check IS 'Helper for RLS to avoid recursive policy calls on profiles table.';
