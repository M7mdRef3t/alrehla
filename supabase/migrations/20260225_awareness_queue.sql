-- awareness_events_queue.sql — طابور أحداث الوعي 🌀
-- ========================================================
-- This table acts as a persistent buffer for map shifts.
-- It decouples UI actions from heavy AI processing.

CREATE TABLE IF NOT EXISTS awareness_events_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'CIRCLE_SHIFT', 'MAJOR_DETACHMENT', 'INTENT_SEMANTIC'
    payload JSONB NOT NULL,    -- Detailed event data (fromRing, toRing, targetId, etc.)
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'dlq'
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index for the worker to find pending items efficiently
CREATE INDEX IF NOT EXISTS idx_pending_awareness_events ON awareness_events_queue (created_at) WHERE status = 'pending';

-- DLQ View (Dead Letter Queue)
CREATE OR REPLACE VIEW awareness_dlq AS
SELECT * FROM awareness_events_queue WHERE status = 'dlq';
