-- Upgrading Distributed Lock to Self-Healing TTL Mutex
-- Instead of a simple boolean, we use a timestamp to prevent deadlocks if a worker crashes.

-- Drop the old column if it exists from previous iteration
ALTER TABLE command_center_stats DROP COLUMN IF EXISTS is_generating_trajectory;

-- Add the TTL-based lock column
ALTER TABLE command_center_stats ADD COLUMN IF NOT EXISTS trajectory_lock_until TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN command_center_stats.trajectory_lock_until IS 'Self-healing distributed lock. Process is locked if this timestamp is in the future.';
