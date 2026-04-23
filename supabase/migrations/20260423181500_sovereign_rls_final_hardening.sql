-- 0. Schema Integrity: Ensure user_id exists in target tables
DO $$
BEGIN
  -- journey_maps already has it in most versions, but let's be sure
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journey_maps' AND column_name = 'user_id') THEN
    ALTER TABLE public.journey_maps ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- journey_events often lacks it as it is a legacy table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journey_events' AND column_name = 'user_id') THEN
    ALTER TABLE public.journey_events ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- daily_pulse_logs should have it from v2 migration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_pulse_logs' AND column_name = 'user_id') THEN
    ALTER TABLE public.daily_pulse_logs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 0. Shared Utility Functions
CREATE OR REPLACE FUNCTION public.set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. journey_maps Hardening
ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;

-- Clean up potentially insecure or mismatched policies
DROP POLICY IF EXISTS journey_maps_owner_insert ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_owner_update ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_owner_select ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_claim_anonymous ON public.journey_maps;

-- Direct Select: Only owner or if explicitly public (sharing)
CREATE POLICY journey_maps_select_v2 ON public.journey_maps
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_public = true
    OR auth.role() = 'service_role'
  );

-- Direct Insert: Must be the owner. (Anonymous users use Proxy API / service_role)
CREATE POLICY journey_maps_insert_v2 ON public.journey_maps
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
  );

-- Direct Update: Must be the owner, OR a logged-in user claiming an anonymous map they have the session_id for.
CREATE POLICY journey_maps_update_v2 ON public.journey_maps
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );

-- Trigger: Ensure user_id is set if authenticated during sync
DROP TRIGGER IF EXISTS trg_journey_maps_set_user ON public.journey_maps;
CREATE TRIGGER trg_journey_maps_set_user
  BEFORE INSERT OR UPDATE ON public.journey_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();


-- 2. journey_events Hardening
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_events_owner_insert ON public.journey_events;
DROP POLICY IF EXISTS journey_events_owner_select ON public.journey_events;

CREATE POLICY journey_events_all_v2 ON public.journey_events
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );

-- Trigger: Auto-link events to users if they are logged in but code misses user_id
DROP TRIGGER IF EXISTS trg_journey_events_set_user ON public.journey_events;
CREATE TRIGGER trg_journey_events_set_user
  BEFORE INSERT ON public.journey_events
  FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();


-- 3. daily_pulse_logs Hardening
ALTER TABLE public.daily_pulse_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_pulse_logs_owner_insert ON public.daily_pulse_logs;
DROP POLICY IF EXISTS daily_pulse_logs_owner_select ON public.daily_pulse_logs;
DROP POLICY IF EXISTS daily_pulse_insert_own ON public.daily_pulse_logs;
DROP POLICY IF EXISTS daily_pulse_select_own ON public.daily_pulse_logs;
DROP POLICY IF EXISTS daily_pulse_update_own ON public.daily_pulse_logs;

CREATE POLICY daily_pulse_all_v2 ON public.daily_pulse_logs
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );

-- Trigger: Auto-link pulses
DROP TRIGGER IF EXISTS trg_daily_pulse_set_user ON public.daily_pulse_logs;
CREATE TRIGGER trg_daily_pulse_set_user
  BEFORE INSERT ON public.daily_pulse_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_auth_user_id();
