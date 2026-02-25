-- Phase 9: Shadow Sequence Tracking
-- Adds a counter to track consecutive high-entropy interactions for the Alchemical Catalyst.

ALTER TABLE command_center_stats 
ADD COLUMN IF NOT EXISTS consecutive_shadow_turns INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_triggers_this_journey INTEGER DEFAULT 0;

COMMENT ON COLUMN command_center_stats.consecutive_shadow_turns IS 'Tracks the number of consecutive turns the AI has been in Shadow Mode to trigger the Alchemical Catalyst.';
COMMENT ON COLUMN command_center_stats.recovery_triggers_this_journey IS 'Tracks total triggers of the Alchemical Catalyst in the current journey for DDA downshifting.';
