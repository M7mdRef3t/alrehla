-- =============================================================================
-- Dawayir V2 Hardening — Unified Synchronization Script
-- Consolidates all critical migrations from the v2-hardening branch (2026-04-05)
-- =============================================================================

-- 1. Analytics & Tracking Infrastructure (20260405100000)
ALTER TABLE public.routing_events
  ADD COLUMN IF NOT EXISTS anonymous_id text,
  ADD COLUMN IF NOT EXISTS client_event_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS routing_events_client_event_id_uidx
  ON public.routing_events (client_event_id)
  WHERE client_event_id IS NOT NULL;

DROP INDEX IF EXISTS public.routing_events_type_idx;
CREATE INDEX IF NOT EXISTS routing_events_event_type_occurred_at_idx
  ON public.routing_events (event_type, occurred_at desc);

DROP INDEX IF EXISTS public.routing_events_session_idx;
CREATE INDEX IF NOT EXISTS routing_events_session_id_idx
  ON public.routing_events (session_id, occurred_at desc);

CREATE INDEX IF NOT EXISTS routing_events_anonymous_id_idx
  ON public.routing_events (anonymous_id);


-- 2. Lead Attribution & Identity Resolution (20260405170000)
ALTER TABLE public.marketing_leads 
  ADD COLUMN IF NOT EXISTS anonymous_id TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'none';

CREATE INDEX IF NOT EXISTS marketing_leads_anonymous_id_idx 
  ON public.marketing_leads (anonymous_id) 
  WHERE anonymous_id IS NOT NULL;

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
    p_anonymous_id TEXT DEFAULT NULL
)
RETURNS TABLE (lead_id UUID, is_new BOOLEAN, conflict BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_existing_id UUID;
    v_existing_email TEXT;
    v_existing_phone TEXT;
    v_conflict BOOLEAN := FALSE;
    v_is_new BOOLEAN := FALSE;
    v_final_id UUID;
BEGIN
    IF p_phone_normalized IS NOT NULL THEN
        SELECT id, email INTO v_existing_id, v_existing_email
        FROM public.marketing_leads
        WHERE phone_normalized = p_phone_normalized
        FOR UPDATE;
        IF v_existing_id IS NOT NULL AND p_email IS NOT NULL AND v_existing_email IS NOT NULL AND v_existing_email != p_email THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    IF v_existing_id IS NULL AND p_email IS NOT NULL THEN
        SELECT id, phone_normalized INTO v_existing_id, v_existing_phone
        FROM public.marketing_leads
        WHERE email = p_email
        FOR UPDATE;
        IF v_existing_id IS NOT NULL AND p_phone_normalized IS NOT NULL AND v_existing_phone IS NOT NULL AND v_existing_phone != p_phone_normalized THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.marketing_leads SET 
            email = COALESCE(p_email, email),
            phone_raw = COALESCE(p_phone_raw, phone_raw),
            name = COALESCE(p_name, name),
            source = COALESCE(p_source, source), 
            source_type = COALESCE(p_source_type, source_type),
            utm = marketing_leads.utm || p_utm,
            note = marketing_leads.note || E'\n' || COALESCE(p_note, ''),
            status = COALESCE(p_status, status),
            intent = COALESCE(p_intent, intent),
            anonymous_id = COALESCE(p_anonymous_id, anonymous_id),
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
        ) RETURNING id INTO v_final_id;
        v_is_new := TRUE;
    END IF;
    RETURN QUERY SELECT v_final_id, v_is_new, v_conflict;
END;
$$;


-- 3. Identity Linking Bridge (20260405180000)
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

-- NOTE: The graceful version of link_anonymous_to_user is defined below (line ~164).
-- It returns success:false instead of RAISE EXCEPTION to prevent 400 errors.

CREATE OR REPLACE FUNCTION public.trg_link_lead_identity_logic()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target_user_id UUID;
BEGIN
    SELECT id::uuid INTO v_target_user_id FROM public.profiles WHERE email = NEW.email LIMIT 1;
    IF v_target_user_id IS NOT NULL AND NEW.anonymous_id IS NOT NULL THEN
        PERFORM public.link_identity_v2(NEW.anonymous_id, v_target_user_id);
        NEW.user_id := v_target_user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_lead_identity ON public.marketing_leads;
CREATE TRIGGER trg_link_lead_identity BEFORE INSERT OR UPDATE OF anonymous_id ON public.marketing_leads
FOR EACH ROW EXECUTE FUNCTION public.trg_link_lead_identity_logic();

create or replace function public.link_anonymous_to_user(
    p_anonymous_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_res record;
    v_uid uuid;
begin
    v_uid := auth.uid();

    -- Graceful exit: no auth session → return success:false, no exception
    if v_uid is null then
        return jsonb_build_object('success', false, 'reason', 'no_session');
    end if;

    -- Graceful exit: no anonymous_id provided
    if p_anonymous_id is null or trim(p_anonymous_id) = '' then
        return jsonb_build_object('success', false, 'reason', 'no_anonymous_id');
    end if;

    select * into v_res from public.link_identity_v2(p_anonymous_id, v_uid);

    return jsonb_build_object(
        'success', true,
        'events_linked', v_res.updated_count,
        'lead_linked', v_res.attribution_linked,
        'linked_at', now()
    );
exception when others then
    -- If link_identity_v2 fails for any reason, don't crash the client
    return jsonb_build_object('success', false, 'reason', SQLERRM);
end;
$$;


-- 4. Comprehensive Security & RLS Hardening (20260405190000)
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

ALTER TABLE public.consciousness_vectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS consciousness_vectors_owner_select ON public.consciousness_vectors;
CREATE POLICY consciousness_vectors_owner_select ON public.consciousness_vectors FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS consciousness_vectors_owner_insert ON public.consciousness_vectors;
CREATE POLICY consciousness_vectors_owner_insert ON public.consciousness_vectors FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.routing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS routing_events_insert ON public.routing_events;
CREATE POLICY routing_events_insert ON public.routing_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS routing_events_admin_select ON public.routing_events;
CREATE POLICY routing_events_admin_select ON public.routing_events FOR SELECT USING (public.is_admin_check(auth.uid()));

ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journey_maps_owner_select ON public.journey_maps;
CREATE POLICY journey_maps_owner_select ON public.journey_maps FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS journey_maps_owner_upsert ON public.journey_maps;
CREATE POLICY journey_maps_owner_upsert ON public.journey_maps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS journey_maps_admin_select ON public.journey_maps;
DROP POLICY IF EXISTS journey_maps_admin_select ON public.journey_maps;
CREATE POLICY journey_maps_admin_select ON public.journey_maps FOR SELECT USING (public.is_admin_check(auth.uid()));

-- 6. Email Outreach & Tracking Infrastructure
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  preview_text text,
  category text DEFAULT 'marketing',
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  campaign_tag text,
  template_id uuid REFERENCES email_templates(id),
  resend_id text,
  html_snapshot text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id uuid NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Hardening for Email
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_templates_admin_all ON public.email_templates;
CREATE POLICY email_templates_admin_all ON public.email_templates FOR ALL USING (public.is_admin_check(auth.uid()));

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_sends_admin_all ON public.email_sends;
CREATE POLICY email_sends_admin_all ON public.email_sends FOR ALL USING (public.is_admin_check(auth.uid()));

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_events_admin_all ON public.email_events;
CREATE POLICY email_events_admin_all ON public.email_events FOR ALL USING (public.is_admin_check(auth.uid()));
DROP POLICY IF EXISTS email_events_public_insert ON public.email_events;
CREATE POLICY email_events_public_insert ON public.email_events FOR INSERT WITH CHECK (true);


-- 5. Data Migration: Journey to Routing (20260405190000_unify)
INSERT INTO public.routing_events (user_id, session_id, event_type, payload, occurred_at, client_event_id)
SELECT NULL::uuid, session_id, type, payload, created_at, id::text
FROM public.journey_events
ON CONFLICT (client_event_id) WHERE client_event_id IS NOT NULL DO NOTHING;

CREATE OR REPLACE FUNCTION public.infer_event_tasks(in_max_rows integer default 200000)
RETURNS TABLE (task_key text, path_id text, task_id text, task_label text, starts bigint, completes bigint, avg_latency_ms numeric, completion_rate numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
WITH ordered AS (
  SELECT session_id as actor_key, occurred_at as created_at, event_type,
    COALESCE(payload->>'pathId', 'legacy_path') as path_id,
    COALESCE(payload->>'taskId', 'legacy_task') as task_id,
    COALESCE(payload->>'taskLabel', payload->>'taskId', 'Legacy Task') as task_label,
    LAG(event_type) OVER (PARTITION BY session_id, payload->>'pathId', payload->>'taskId' ORDER BY occurred_at) as prev_event_type,
    LAG(occurred_at) OVER (PARTITION BY session_id, payload->>'pathId', payload->>'taskId' ORDER BY occurred_at) as prev_created_at
  FROM public.routing_events
  WHERE event_type IN ('task_started', 'task_completed')
  ORDER BY occurred_at DESC LIMIT GREATEST(in_max_rows, 1000)
),
latency_pairs AS (
  SELECT path_id, task_id, task_label, EXTRACT(epoch from (created_at - prev_created_at)) * 1000 as latency_ms
  FROM ordered WHERE event_type = 'task_completed' AND prev_event_type = 'task_started' AND prev_created_at IS NOT NULL
),
agg_base AS (
  SELECT path_id, task_id, MAX(task_label) as task_label, COUNT(*) FILTER (where event_type = 'task_started') as starts, COUNT(*) FILTER (where event_type = 'task_completed') as completes
  FROM ordered GROUP BY path_id, task_id
),
agg_latency AS (
  SELECT path_id, task_id, AVG(latency_ms)::numeric as avg_latency_ms FROM latency_pairs GROUP BY path_id, task_id
)
SELECT CONCAT(a.path_id, '|', a.task_id), a.path_id, a.task_id, a.task_label, a.starts, a.completes, COALESCE(l.avg_latency_ms, 300000::numeric),
  CASE WHEN a.starts > 0 THEN (a.completes::numeric / a.starts::numeric) ELSE 0::numeric END
FROM agg_base a LEFT JOIN agg_latency l ON l.path_id = a.path_id AND l.task_id = a.task_id;
$$;

NOTIFY pgrst, 'reload schema';
