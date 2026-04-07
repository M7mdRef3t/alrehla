/* Lead Attribution & Identity Resolution Hardening */
/* Adds anonymous_id to marketing_leads and updates the atomic upsert RPC */

/* 1. Add anonymous_id column to marketing_leads */
ALTER TABLE public.marketing_leads 
ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

/* 2. Create index for journey matching */
CREATE INDEX IF NOT EXISTS marketing_leads_anonymous_id_idx 
ON public.marketing_leads (anonymous_id) 
WHERE anonymous_id IS NOT NULL;

/* 3. Update the upsert_marketing_lead_v2 RPC function */
CREATE OR REPLACE FUNCTION public.upsert_marketing_lead_v2(
    p_email TEXT,
    p_phone_normalized TEXT,
    p_phone_raw TEXT,
    p_name TEXT,
    p_source TEXT,
    p_source_type TEXT,
    p_utm JSONB,
    p_note TEXT,
    p_status TEXT,
    p_intent TEXT,
    p_anonymous_id TEXT DEFAULT NULL  /* Added parameter */
)
RETURNS TABLE (
    lead_id UUID,
    is_new BOOLEAN,
    conflict BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public -- Security Hardening: Prevent search_path hijacking
AS $$
DECLARE
    v_existing_id UUID;
    v_existing_email TEXT;
    v_existing_phone TEXT;
    v_conflict BOOLEAN := FALSE;
    v_is_new BOOLEAN := FALSE;
    v_final_id UUID;
BEGIN
    /* 1. Deduplicate by Phone First (with pessimistic lock) */
    IF p_phone_normalized IS NOT NULL THEN
        SELECT id, email INTO v_existing_id, v_existing_email
        FROM public.marketing_leads
        WHERE phone_normalized = p_phone_normalized
        FOR UPDATE;
        
        IF v_existing_id IS NOT NULL AND p_email IS NOT NULL AND v_existing_email IS NOT NULL AND v_existing_email != p_email THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    /* 2. Deduplicate by Email if not matched by phone (with pessimistic lock) */
    IF v_existing_id IS NULL AND p_email IS NOT NULL THEN
        SELECT id, phone_normalized INTO v_existing_id, v_existing_phone
        FROM public.marketing_leads
        WHERE email = p_email
        FOR UPDATE;

        IF v_existing_id IS NOT NULL AND p_phone_normalized IS NOT NULL AND v_existing_phone IS NOT NULL AND v_existing_phone != p_phone_normalized THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    /* 3. Perform Update or Insert */
    IF v_existing_id IS NOT NULL THEN
        UPDATE public.marketing_leads
        SET 
            email = COALESCE(p_email, email),
            phone_raw = COALESCE(p_phone_raw, phone_raw),
            name = COALESCE(p_name, name),
            source = COALESCE(p_source, source), 
            source_type = COALESCE(p_source_type, source_type),
            utm = marketing_leads.utm || p_utm,
            note = marketing_leads.note || E'\n' || COALESCE(p_note, ''),
            status = COALESCE(p_status, status),
            intent = COALESCE(p_intent, intent),
            anonymous_id = COALESCE(p_anonymous_id, anonymous_id), /* Only update if not already set or new one provided */
            last_intent_at = CASE WHEN p_intent IS NOT NULL THEN now() ELSE last_intent_at END,
            merge_conflict = v_conflict OR merge_conflict,
            updated_at = now()
        WHERE id = v_existing_id
        RETURNING id INTO v_final_id;
    ELSE
        INSERT INTO public.marketing_leads (
            email, phone_normalized, phone_raw, name, source, source_type, utm, note, status, intent, last_intent_at, merge_conflict, anonymous_id
        ) VALUES (
            p_email, p_phone_normalized, p_phone_raw, p_name, p_source, p_source_type, p_utm, p_note, p_status, p_intent, 
            CASE WHEN p_intent IS NOT NULL THEN now() ELSE NULL END, v_conflict, p_anonymous_id
        )
        RETURNING id INTO v_final_id;
        v_is_new := TRUE;
    END IF;

    RETURN QUERY SELECT v_final_id, v_is_new, v_conflict;
END;
$$;
