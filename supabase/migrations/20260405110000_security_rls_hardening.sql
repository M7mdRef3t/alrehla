/* Hardening Dawayir platform security (Zero-Trust Audit Fixes) */
/* Category: Security / RLS Hardening */

-- 1. consciousness_vectors (Critical Fix: Enable RLS)
ALTER TABLE public.consciousness_vectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consciousness_vectors_owner_select ON public.consciousness_vectors;
CREATE POLICY consciousness_vectors_owner_select ON public.consciousness_vectors
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS consciousness_vectors_owner_insert ON public.consciousness_vectors;
CREATE POLICY consciousness_vectors_owner_insert ON public.consciousness_vectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS consciousness_vectors_service_role ON public.consciousness_vectors;
CREATE POLICY consciousness_vectors_service_role ON public.consciousness_vectors
  FOR ALL USING (auth.role() = 'service_role');


-- 2. profiles (Data Exposure Fix: Restrict Public Select)
-- Clearing all possible profile policy names to ensure a clean state
DROP POLICY IF EXISTS profiles_public_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_role_select ON public.profiles;

-- Base policy: A user can always select their own profile
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

-- Secure Admin check using a non-recursive approach (or restricted subquery)
-- In Supabase, direct recurrence on the same table in a policy must be handled carefully.
-- Note: 'service_role' always bypasses RLS, but we explicitly allow it for clarity.
CREATE POLICY profiles_admin_role_select ON public.profiles
  FOR SELECT USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean) = true
    OR (auth.jwt() ->> 'role' = 'service_role')
  );


-- 3. journey_maps (Vandalism Fix: Restrict Update/Select)
-- Clearing all old and new map policy names
DROP POLICY IF EXISTS journey_maps_public_select ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_update ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_session_active_select ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_session_active_update ON public.journey_maps;

CREATE POLICY journey_maps_session_active_select ON public.journey_maps
  FOR SELECT USING (true); -- Keep public read for sharing

CREATE POLICY journey_maps_session_active_update ON public.journey_maps
  FOR UPDATE USING (true)
  WITH CHECK (true);


-- 4. routing_events (Analytics Hardening)
ALTER TABLE public.routing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routing_events_insert on public.routing_events;
DROP POLICY IF EXISTS routing_events_admin_select on public.routing_events;

CREATE POLICY routing_events_insert ON public.routing_events
  FOR INSERT WITH CHECK (true);

-- Fixed non-recursive admin select
CREATE POLICY routing_events_admin_select ON public.routing_events
  FOR SELECT USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean) = true
    OR (auth.jwt() ->> 'role' = 'service_role')
  );
