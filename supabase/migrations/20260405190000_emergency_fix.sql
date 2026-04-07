/* 
  SQL SOVEREIGN EMERGENCY FIX: P0 RECURSION & IDENTITY BRIDGE RESTORATION
  - Resolves 500 error (Recursive RLS on profiles)
  - Resolves 400 error (RPC parameter/instability mismatch)
  - Resolves identity linking bridge connectivity
*/

-- 1. Infrastructure Cleanup
DROP TRIGGER IF EXISTS trg_link_lead_identity ON public.marketing_leads;
DROP FUNCTION IF EXISTS public.get_auth_role_v2() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;

-- 2. Non-Recursive Security Core
-- This function bypasses RLS to check roles, preventing infinite loops.
CREATE OR REPLACE FUNCTION public.get_auth_role_v2()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM public.profiles 
  WHERE id = auth.uid()::text 
  LIMIT 1;
  RETURN v_role;
END;
$$;

-- 3. Profiles Hardening
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS profiles_admin_role_select ON public.profiles;
CREATE POLICY profiles_admin_role_select ON public.profiles
  FOR SELECT USING (get_auth_role_v2() IN ('admin', 'owner', 'superadmin', 'developer'));

-- 4. Routing Events (Analytics) Hardening
ALTER TABLE public.routing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routing_events_insert ON public.routing_events;
CREATE POLICY routing_events_insert ON public.routing_events
  FOR INSERT WITH CHECK (true); -- Public ingestion allowed

DROP POLICY IF EXISTS routing_events_admin_select ON public.routing_events;
CREATE POLICY routing_events_admin_select ON public.routing_events
  FOR SELECT USING (get_auth_role_v2() IN ('admin', 'owner', 'superadmin'));

-- 5. Marketing Leads Bridge
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_leads_admin_select ON public.marketing_leads;
CREATE POLICY marketing_leads_admin_select ON public.marketing_leads
  FOR SELECT USING (get_auth_role_v2() IN ('admin', 'owner', 'superadmin'));

DROP POLICY IF EXISTS marketing_leads_self_select ON public.marketing_leads;
CREATE POLICY marketing_leads_self_select ON public.marketing_leads
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Identity Linking RPC Restoration
-- Ensures the RPC call from analytics.ts is robust.
CREATE OR REPLACE FUNCTION public.link_anonymous_to_user(
    p_anonymous_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_events INTEGER := 0;
    v_lead_linked BOOLEAN := FALSE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for identity linking';
    END IF;

    -- Link Routing Events
    UPDATE public.routing_events
    SET user_id = auth.uid(),
        updated_at = now()
    WHERE anonymous_id = p_anonymous_id
      AND user_id IS NULL;
    
    GET DIAGNOSTICS v_updated_events = ROW_COUNT;

    -- Link Marketing Lead
    UPDATE public.marketing_leads
    SET user_id = auth.uid(),
        last_linked_at = now()
    WHERE anonymous_id = p_anonymous_id
      AND (user_id IS NULL OR user_id = auth.uid());

    v_lead_linked := (ROW_COUNT > 0);

    RETURN jsonb_build_object(
        'success', true,
        'events_linked', v_updated_events,
        'lead_linked', v_lead_linked,
        'linked_at', now()
    );
END;
$$;

-- 7. Automated Bridge Trigger
CREATE OR REPLACE FUNCTION public.trg_link_lead_identity_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    -- Only attempt link if we have an anonymous_id and no user_id yet
    IF NEW.anonymous_id IS NOT NULL AND NEW.user_id IS NULL THEN
        SELECT id::uuid INTO v_target_user_id
        FROM public.profiles
        WHERE email = NEW.email
        LIMIT 1;

        IF v_target_user_id IS NOT NULL THEN
            NEW.user_id := v_target_user_id;
            NEW.last_linked_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_lead_identity
BEFORE INSERT OR UPDATE OF anonymous_id ON public.marketing_leads
FOR EACH ROW
EXECUTE FUNCTION public.trg_link_lead_identity_logic();

