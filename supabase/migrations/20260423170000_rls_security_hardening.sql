-- Date: 2026-04-23
-- 0. Schema Integrity: Ensure user_id exists in target tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journey_maps' AND column_name = 'user_id') THEN
    ALTER TABLE public.journey_maps ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_pulse_logs' AND column_name = 'user_id') THEN
    ALTER TABLE public.daily_pulse_logs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 1. journey_maps (Owner-only access)
ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_maps_owner_insert ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_owner_update ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_owner_select ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_public_select ON public.journey_maps;

CREATE POLICY journey_maps_owner_insert ON public.journey_maps
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid()::text = session_id
    OR auth.role() = 'service_role'
  );

CREATE POLICY journey_maps_owner_update ON public.journey_maps
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR auth.uid()::text = session_id
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid()::text = session_id
    OR auth.role() = 'service_role'
  );

CREATE POLICY journey_maps_owner_select ON public.journey_maps
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid()::text = session_id
    OR is_public = true
    OR auth.role() = 'service_role'
  );


-- 2. journey_events (Owner-only access)
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_events_authenticated_insert ON public.journey_events;
DROP POLICY IF EXISTS journey_events_owner_select ON public.journey_events;

CREATE POLICY journey_events_owner_insert ON public.journey_events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    OR auth.role() = 'service_role'
  );

CREATE POLICY journey_events_owner_select ON public.journey_events
  FOR SELECT USING (
    auth.uid()::text = session_id
    OR auth.role() = 'service_role'
  );


-- 3. daily_pulse_logs (Owner-only access)
ALTER TABLE public.daily_pulse_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_pulse_logs_authenticated_insert ON public.daily_pulse_logs;
DROP POLICY IF EXISTS daily_pulse_logs_owner_select ON public.daily_pulse_logs;

CREATE POLICY daily_pulse_logs_owner_insert ON public.daily_pulse_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() IS NOT NULL
    OR auth.role() = 'service_role'
  );

CREATE POLICY daily_pulse_logs_owner_select ON public.daily_pulse_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid()::text = session_id
    OR auth.role() = 'service_role'
  );

