-- Phase 8: Evolutionary Tracking Schema
-- Adds support for tracking behavioral shifts over time.

ALTER TABLE user_trajectories 
ADD COLUMN IF NOT EXISTS initial_vector JSONB,
ADD COLUMN IF NOT EXISTS sovereignty_report JSONB;

COMMENT ON COLUMN user_trajectories.initial_vector IS 'Snapshot of the Awareness Vector when the journey started.';
COMMENT ON COLUMN user_trajectories.sovereignty_report IS 'AI-generated analysis of the growth delta and next journey seeds.';
