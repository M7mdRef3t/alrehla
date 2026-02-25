-- Phase 14: Consensus Governance & Anti-Bias
ALTER TABLE hive_wisdom_vault 
ADD COLUMN IF NOT EXISTS approvals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_by_ids UUID[] DEFAULT '{}';

-- Table for tracking individual governance actions
CREATE TABLE IF NOT EXISTS oracle_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oracle_id UUID REFERENCES auth.users(id),
    trajectory_id UUID REFERENCES hive_wisdom_vault(id),
    action TEXT CHECK (action IN ('approve', 'flag', 'refine')),
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger logic for status transition (Active after 2 approvals)
CREATE OR REPLACE FUNCTION check_consensus_approval() 
RETURNS TRIGGER AS $$
BEGIN
    -- Consensus reached when total weighted approval >= 2.0
    IF NEW.total_approval_weight >= 2.0 THEN
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consensus_approval ON hive_wisdom_vault;
CREATE TRIGGER trg_consensus_approval 
BEFORE UPDATE OF approved_by_ids ON hive_wisdom_vault 
FOR EACH ROW 
EXECUTE FUNCTION check_consensus_approval();

COMMENT ON COLUMN hive_wisdom_vault.approved_by_ids IS 'List of Oracles who have approved this trajectory. Requires length >= 2 for active status.';
