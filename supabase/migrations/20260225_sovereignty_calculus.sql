-- Phase 9: Sovereignty Calculus Schema
-- Support for Weighted Historical Baseline and Non-Linear Sovereignty Score.

ALTER TABLE user_trajectories 
ADD COLUMN IF NOT EXISTS final_vector JSONB,
ADD COLUMN IF NOT EXISTS sovereignty_score INTEGER DEFAULT 0;

COMMENT ON COLUMN user_trajectories.final_vector IS 'Snapshot of the Awareness Vector when the journey was completed.';
COMMENT ON COLUMN user_trajectories.sovereignty_score IS 'A non-linear metric representing long-term consistency and mastery (0-1000).';
