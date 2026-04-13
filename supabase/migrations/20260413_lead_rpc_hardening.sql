-- Hardening Marketing Leads and Upsert RPC
-- Date: 2026-04-13

-- 1. Ensure anonymous_id exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketing_leads' AND column_name='anonymous_id') THEN
        ALTER TABLE marketing_leads ADD COLUMN anonymous_id TEXT;
    END IF;
END $$;

-- 2. Recreate the RPC with explicit handling
DROP FUNCTION IF EXISTS upsert_marketing_lead_v2(text, text, text, text, text, text, jsonb, text, text, text, text);

CREATE OR REPLACE FUNCTION upsert_marketing_lead_v2(
    p_email text,
    p_phone_normalized text,
    p_phone_raw text,
    p_name text,
    p_source text,
    p_source_type text,
    p_utm jsonb,
    p_note text,
    p_status text,
    p_intent text,
    p_anonymous_id text DEFAULT NULL
) 
RETURNS TABLE(
    lead_id uuid,
    is_new boolean,
    conflict boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id UUID;
    v_existing_email TEXT;
    v_conflict BOOLEAN := FALSE;
    v_is_new BOOLEAN := FALSE;
    v_final_id UUID;
BEGIN
    -- Try to find by phone_normalized first
    IF p_phone_normalized IS NOT NULL AND p_phone_normalized != '' THEN
        SELECT id, email INTO v_existing_id, v_existing_email
        FROM public.marketing_leads
        WHERE phone_normalized = p_phone_normalized
        FOR UPDATE;
        
        -- Check for email conflict
        IF v_existing_id IS NOT NULL AND p_email IS NOT NULL AND v_existing_email IS NOT NULL AND v_existing_email != p_email THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    -- If not found by phone, try by email
    IF v_existing_id IS NULL AND p_email IS NOT NULL AND p_email != '' THEN
        SELECT id INTO v_existing_id
        FROM public.marketing_leads
        WHERE email = p_email
        FOR UPDATE;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing
        UPDATE public.marketing_leads
        SET 
            email = COALESCE(p_email, marketing_leads.email),
            phone_raw = COALESCE(p_phone_raw, marketing_leads.phone_raw),
            phone_normalized = COALESCE(p_phone_normalized, marketing_leads.phone_normalized),
            name = COALESCE(p_name, marketing_leads.name),
            source = COALESCE(p_source, marketing_leads.source), 
            source_type = COALESCE(p_source_type, marketing_leads.source_type),
            utm = (CASE 
                WHEN marketing_leads.utm IS NULL THEN p_utm 
                WHEN p_utm IS NULL THEN marketing_leads.utm
                ELSE marketing_leads.utm || p_utm 
            END),
            note = (CASE 
                WHEN p_note IS NOT NULL AND p_note != '' THEN marketing_leads.note || E'\n' || p_note 
                ELSE marketing_leads.note 
            END),
            status = COALESCE(p_status, marketing_leads.status),
            intent = COALESCE(p_intent, marketing_leads.intent),
            anonymous_id = COALESCE(p_anonymous_id, marketing_leads.anonymous_id),
            last_intent_at = CASE WHEN p_intent IS NOT NULL THEN now() ELSE last_intent_at END,
            merge_conflict = v_conflict OR merge_conflict,
            updated_at = now()
        WHERE id = v_existing_id
        RETURNING id INTO v_final_id;
    ELSE
        -- Insert new
        INSERT INTO public.marketing_leads (
            email, phone_normalized, phone_raw, name, source, source_type, utm, note, status, intent, last_intent_at, merge_conflict, anonymous_id
        ) VALUES (
            p_email, p_phone_normalized, p_phone_raw, p_name, p_source, p_source_type, COALESCE(p_utm, '{}'::jsonb), p_note, p_status, p_intent, 
            CASE WHEN p_intent IS NOT NULL THEN now() ELSE NULL END, v_conflict, p_anonymous_id
        )
        RETURNING id INTO v_final_id;
        v_is_new := TRUE;
    END IF;

    RETURN QUERY SELECT v_final_id, v_is_new, v_conflict;
END;
$$;
