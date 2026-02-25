-- Phase 13: Oracle Governance Schema
ALTER TABLE hive_wisdom_vault 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'flagged', 'archived')),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS total_approval_weight FLOAT DEFAULT 0.0;

-- Oracle Reputation Tracking
CREATE TABLE IF NOT EXISTS oracle_reputation (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    audit_count INTEGER DEFAULT 0,
    accuracy_score FLOAT DEFAULT 1.0, -- Relative to consensus
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pending reviews
CREATE INDEX IF NOT EXISTS idx_hive_pending_review ON hive_wisdom_vault(status) WHERE status = 'pending';

COMMENT ON TABLE oracle_reputation IS 'Tracks the reliability and activity of Oracle Council members.';
