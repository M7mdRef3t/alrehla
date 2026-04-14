-- =============================================================================
-- Dawayir V2 — Fixing Marketing Lead Outreach Consistency
-- =============================================================================
-- Resolves 500 Internal Server Error when capturing leads without emails.
-- Previous schema required lead_email and used it as a foreign key + unique key,
-- which fails for phone-only leads where lead_email was set to 'phone_...'

BEGIN;

-- 1. Ensure lead_id is present and correctly populated (should already be from 20260321)
-- If any rows lack a lead_id, we need to map them back before proceeding.
UPDATE public.marketing_lead_outreach_queue q
SET lead_id = l.lead_id
FROM public.marketing_leads l
WHERE q.lead_email = l.email
AND q.lead_id IS NULL;

-- 2. Drop the overly restrictive email-based unique constraint
ALTER TABLE public.marketing_lead_outreach_queue 
DROP CONSTRAINT IF EXISTS marketing_lead_outreach_queue_lead_email_channel_key;

-- 3. Update lead_email column to be nullable
ALTER TABLE public.marketing_lead_outreach_queue 
ALTER COLUMN lead_email DROP NOT NULL;

-- 4. Ensure lead_id is NOT NULL for all future entries
-- (We might have some orphaned rows if we're not careful, but P0 is lead_id now)
ALTER TABLE public.marketing_lead_outreach_queue 
ALTER COLUMN lead_id SET NOT NULL;

-- 5. Add the new correct unique constraint using the durable UUID identity
ALTER TABLE public.marketing_lead_outreach_queue 
ADD CONSTRAINT marketing_lead_outreach_queue_id_channel_key UNIQUE (lead_id, channel);

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
