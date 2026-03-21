-- P0-1 Migration: Add explicit lead_id to marketing_leads table
-- This gives every lead a durable UUID identity that can be tracked
-- across the full funnel: import → outreach → onboarding → checkout

-- 1. Add lead_id column with auto-generated UUID default
ALTER TABLE marketing_leads
  ADD COLUMN IF NOT EXISTS lead_id uuid DEFAULT gen_random_uuid();

-- 2. Backfill existing rows that have NULL lead_id
UPDATE marketing_leads
  SET lead_id = gen_random_uuid()
  WHERE lead_id IS NULL;

-- 3. Make it NOT NULL now that all rows have a value
ALTER TABLE marketing_leads
  ALTER COLUMN lead_id SET NOT NULL;

-- 4. Add UNIQUE constraint so it can serve as a lookup key
ALTER TABLE marketing_leads
  ADD CONSTRAINT marketing_leads_lead_id_unique UNIQUE (lead_id);

-- 5. Index for fast lookup by lead_id (e.g. from onboarding URL param)
CREATE INDEX IF NOT EXISTS idx_marketing_leads_lead_id
  ON marketing_leads (lead_id);

-- 6. Add lead_id to outreach queue for full traceability
ALTER TABLE marketing_lead_outreach_queue
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES marketing_leads(lead_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_queue_lead_id
  ON marketing_lead_outreach_queue (lead_id);

-- Verification query (run after migration to confirm):
-- SELECT email, lead_id FROM marketing_leads LIMIT 5;
-- SELECT lead_email, lead_id, channel, step FROM marketing_lead_outreach_queue LIMIT 5;
