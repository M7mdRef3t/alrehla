/* Identity Linking Bridge (Dawayir Platform - Knowledge & Attribution) */
/* Purpose: Retroactively attribute anonymous behavioral data to authenticated user profiles. */

/* 1. Infrastructure Preparation */
ALTER TABLE public.marketing_leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_linked_at TIMESTAMPTZ;

ALTER TABLE public.routing_events
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


/* 2. Core Linking Function (Retroactive Attribution) */
CREATE OR REPLACE FUNCTION public.link_identity_v2(
    p_anonymous_id TEXT,
    p_user_id UUID
)
RETURNS TABLE (
    updated_count INTEGER,
    attribution_linked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_rows INTEGER := 0;
    v_linked BOOLEAN := FALSE;
BEGIN
    IF p_anonymous_id IS NULL OR p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE;
        RETURN;
    END IF;

    -- Update historical routing events
    UPDATE public.routing_events
    SET user_id = p_user_id,
        updated_at = now()
    WHERE anonymous_id = p_anonymous_id
      AND user_id IS NULL;
    
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- Link in marketing_leads if found
    UPDATE public.marketing_leads
    SET user_id = p_user_id,
        last_linked_at = now()
    WHERE anonymous_id = p_anonymous_id
      AND (user_id IS NULL OR user_id = p_user_id);

    v_linked := (ROW_COUNT > 0);

    RETURN QUERY SELECT v_updated_rows, v_linked;
END;
$$;


/* 3. Client-Facing RPC */
CREATE OR REPLACE FUNCTION public.link_anonymous_to_user(
    p_anonymous_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for identity linking';
    END IF;

    SELECT * INTO v_res FROM public.link_identity_v2(p_anonymous_id, auth.uid());

    RETURN jsonb_build_object(
        'success', true,
        'events_linked', v_res.updated_count,
        'lead_linked', v_res.attribution_linked,
        'linked_at', now()
    );
END;
$$;


/* 4. Automated Bridge Trigger on Lead Conversion */
CREATE OR REPLACE FUNCTION public.trg_link_lead_identity_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    SELECT id::uuid INTO v_target_user_id
    FROM public.profiles
    WHERE email = NEW.email
    LIMIT 1;

    IF v_target_user_id IS NOT NULL AND NEW.anonymous_id IS NOT NULL THEN
        PERFORM public.link_identity_v2(NEW.anonymous_id, v_target_user_id);
        NEW.user_id := v_target_user_id;
    END IF;

    RETURN NEW;
END;
$$;


/* Ensure any old triggers are cleared before creating the bridge */
DROP TRIGGER IF EXISTS trg_link_lead_identity ON public.marketing_leads;
CREATE TRIGGER trg_link_lead_identity
BEFORE INSERT OR UPDATE OF anonymous_id ON public.marketing_leads
FOR EACH ROW
EXECUTE FUNCTION public.trg_link_lead_identity_logic();
