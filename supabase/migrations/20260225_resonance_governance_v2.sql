-- Phase 17: Logarithmic Weighting & Resonance Logs
ALTER TABLE oracle_reputation 
ADD COLUMN IF NOT EXISTS consensus_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_audits INTEGER DEFAULT 0;

-- Accuracy = Matches / Audits (min 1.0)
CREATE OR REPLACE VIEW oracle_influence_stats AS
SELECT 
    user_id,
    audit_count,
    CASE 
        WHEN total_audits = 0 THEN 1.0 
        ELSE (consensus_matches::float / total_audits::float) 
    END as accuracy_score
FROM oracle_reputation;

-- Table for tracking Active Pinging (Ghosting Prevention)
CREATE TABLE IF NOT EXISTS resonance_nudge_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nudge_type TEXT CHECK (nudge_type IN ('shadow', 'oracle')),
    context_sentiment TEXT,
    nudge_content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response_latency_sec INTEGER
);

-- Index for sentiment history analysis
CREATE INDEX IF NOT EXISTS idx_resonance_nudge_user ON resonance_nudge_logs(user_id, sent_at DESC);

COMMENT ON TABLE resonance_nudge_logs IS 'Tracks active pinging events to prevent pioneer ghosting during Alpha-Zero.';
