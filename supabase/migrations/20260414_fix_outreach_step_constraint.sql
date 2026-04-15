-- =============================================================================
-- Dawayir V2 — Fixing Marketing Lead Outreach Multi-Step Support
-- =============================================================================
-- The previous constraint was only on (lead_id, channel), which prevented 
-- multiple steps (1, 2, 3, 5) for the same lead and channel.

BEGIN;

-- 1. Drop the incorrect constraint
ALTER TABLE public.marketing_lead_outreach_queue 
DROP CONSTRAINT IF EXISTS marketing_lead_outreach_queue_id_channel_key;

-- 2. Add the correct constraint including 'step'
-- lead_id: durable UUID identity
-- channel: email/whatsapp
-- step: 1, 2, 3, 4, 5...
ALTER TABLE public.marketing_lead_outreach_queue 
ADD CONSTRAINT marketing_lead_outreach_queue_id_channel_step_key UNIQUE (lead_id, channel, step);

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
