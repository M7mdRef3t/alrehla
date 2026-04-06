-- Fix link_anonymous_to_user: Graceful handling (no RAISE EXCEPTION)
-- Run this in Supabase SQL Editor to fix the 400 Bad Request error

-- Step 1: Create the dependency function first
CREATE OR REPLACE FUNCTION public.link_identity_v2(p_anonymous_id TEXT, p_user_id UUID)
RETURNS TABLE (updated_count INTEGER, attribution_linked BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_updated_rows INTEGER := 0;
    v_linked BOOLEAN := FALSE;
BEGIN
    IF p_anonymous_id IS NULL OR p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE;
        RETURN;
    END IF;
    UPDATE public.routing_events SET user_id = p_user_id, updated_at = now()
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    UPDATE public.marketing_leads SET user_id = p_user_id, last_linked_at = now()
    WHERE anonymous_id = p_anonymous_id AND (user_id IS NULL OR user_id = p_user_id);
    v_linked := (ROW_COUNT > 0);
    RETURN QUERY SELECT v_updated_rows, v_linked;
END;
$$;

-- Step 2: Replace link_anonymous_to_user with graceful version
CREATE OR REPLACE FUNCTION public.link_anonymous_to_user(
    p_anonymous_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res record;
    v_uid uuid;
BEGIN
    v_uid := auth.uid();

    -- Graceful exit: no auth session → return success:false, no exception
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_session');
    END IF;

    -- Graceful exit: no anonymous_id provided
    IF p_anonymous_id IS NULL OR trim(p_anonymous_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_anonymous_id');
    END IF;

    SELECT * INTO v_res FROM public.link_identity_v2(p_anonymous_id, v_uid);

    RETURN jsonb_build_object(
        'success', true,
        'events_linked', v_res.updated_count,
        'lead_linked', v_res.attribution_linked,
        'linked_at', now()
    );
EXCEPTION WHEN others THEN
    -- If link_identity_v2 fails for any reason, don't crash the client
    RETURN jsonb_build_object('success', false, 'reason', SQLERRM);
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
