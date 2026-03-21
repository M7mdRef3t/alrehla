-- ─────────────────────────────────────────────
-- Migration: Email Tracking & Unsubscribe
-- ─────────────────────────────────────────────

-- 1. Unsubscribe flag on marketing_leads
ALTER TABLE marketing_leads
  ADD COLUMN IF NOT EXISTS unsubscribed         BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at      TIMESTAMPTZ;

-- 2. Email engagement tracking on queue
ALTER TABLE marketing_lead_outreach_queue
  ADD COLUMN IF NOT EXISTS opened_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resend_message_id    TEXT,
  ADD COLUMN IF NOT EXISTS bounced              BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS complained           BOOLEAN     NOT NULL DEFAULT FALSE;

-- 3. Index for quick lookup by resend_message_id
CREATE INDEX IF NOT EXISTS idx_queue_resend_message_id
  ON marketing_lead_outreach_queue (resend_message_id);

-- 4. Index for unsubscribed leads (to skip on send)
CREATE INDEX IF NOT EXISTS idx_leads_unsubscribed
  ON marketing_leads (unsubscribed);
