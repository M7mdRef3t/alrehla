-- Fix link_anonymous_to_user: Hardened Column Mapping
-- Standardizing on existing routing_events schema (fixed 400 Bad Request / 0 linked)
-- Run this in Supabase SQL Editor to restore attribution logic

-- Step 1: Create the dependency function with corrected column names
CREATE OR REPLACE FUNCTION public.link_identity_v2(p_anonymous_id TEXT, p_user_id UUID)
RETURNS TABLE (updated_count INTEGER, attribution_linked BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_updated_rows INTEGER := 0;
    v_leads_count INTEGER := 0;
BEGIN
    IF p_anonymous_id IS NULL OR p_user_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE;
        RETURN;
    END IF;

    -- 1. Bridge historical routing events
    -- Standardizing: 'routing_events' doesn't have 'updated_at' in the base schema 
    -- we only flip the user_id to ensure attribution.
    UPDATE public.routing_events 
    SET user_id = p_user_id
    WHERE anonymous_id = p_anonymous_id 
      AND user_id IS NULL; -- Only update events that don't have a user yet
    
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- 2. Bridge marketing leads
    -- 'marketing_leads' DOES have 'updated_at' and 'last_linked_at'
    UPDATE public.marketing_leads 
    SET user_id = p_user_id, 
        last_linked_at = now(),
        updated_at = now()
    WHERE anonymous_id = p_anonymous_id 
      AND (user_id IS NULL OR user_id = p_user_id);
    
    GET DIAGNOSTICS v_leads_count = ROW_COUNT;

    RETURN QUERY SELECT v_updated_rows, (v_leads_count > 0);
END;
$$;

-- Step 2: Replace link_anonymous_to_user with robust version
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

    -- Graceful exit: no auth session → return failure status without crashing
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
    -- Safety net: return SQL error to help debugging without breaking client app
    RETURN jsonb_build_object('success', false, 'reason', SQLERRM, 'context', 'link_identity_v2');
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
