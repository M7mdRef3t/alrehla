-- P0-1 Extension: Add first-class attribution columns to routing_events
-- This allows for efficient joins and better reporting without parsing JSON payloads.

-- 1. Add lead_id as a foreign key to marketing_leads
ALTER TABLE routing_events
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES marketing_leads(lead_id) ON DELETE SET NULL;

-- 2. Add indexing for lead attribution analysis
CREATE INDEX IF NOT EXISTS idx_routing_events_lead_id
  ON routing_events (lead_id);

-- 3. Add explicit UTM and attribution fields for easier querying
ALTER TABLE routing_events
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS ad_id text;

-- 4. Index for attribution reporting
CREATE INDEX IF NOT EXISTS idx_routing_events_attribution
  ON routing_events (lead_id, lead_source, utm_source);

-- Verification:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routing_events';
