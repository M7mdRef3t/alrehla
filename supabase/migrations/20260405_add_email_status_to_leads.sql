-- Migration: Add email_status tracking to marketing_leads
-- Goal: Fix schema mismatch that causes Marketing Ops dashboard to return 0 for all gateways.

-- 1. Add email_status column with a fixed set of allowed values
ALTER TABLE public.marketing_leads
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'none';

-- 2. Add constraint to ensure data integrity
-- We use a DO block to avoid error if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'marketing_leads_email_status_chk'
  ) THEN
    ALTER TABLE public.marketing_leads
      ADD CONSTRAINT marketing_leads_email_status_chk
      CHECK (email_status IN ('none', 'pending', 'sent', 'opened', 'clicked', 'bounced', 'complained', 'simulated'));
  END IF;
END
$$;

-- 3. Index for performance (used by filtered views in dashboard)
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email_status
  ON public.marketing_leads (email_status);

-- 4. Initial sync: If we have sent emails in the queue, let's reflect basic 'sent' status back to leads
-- (This is a one-time repair for the 10,131 leads already in the system)
UPDATE public.marketing_leads
SET email_status = 'sent'
FROM public.marketing_lead_outreach_queue
WHERE public.marketing_leads.email = public.marketing_lead_outreach_queue.lead_email
  AND public.marketing_lead_outreach_queue.status = 'sent'
  AND (public.marketing_leads.email_status IS NULL OR public.marketing_leads.email_status = 'none');

-- 5. Set 'opened' if queue shows opened
UPDATE public.marketing_leads
SET email_status = 'opened'
FROM public.marketing_lead_outreach_queue
WHERE public.marketing_leads.email = public.marketing_lead_outreach_queue.lead_email
  AND public.marketing_lead_outreach_queue.opened_at IS NOT NULL
  AND public.marketing_leads.email_status IN ('none', 'sent');
