-- Phase 18: High-Pressure Wave (Resonance Events)
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('high_pressure', 'shadow_swap', 'sync_sync')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    dda_override INTEGER CHECK (dda_override BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View to retrieve current active event
CREATE OR REPLACE VIEW active_resonance_event AS
SELECT * FROM system_events
WHERE is_active = true 
  AND NOW() BETWEEN start_time AND end_time
LIMIT 1;

-- Logging user performance during specific events
CREATE TABLE IF NOT EXISTS event_participation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES system_events(id),
    user_id UUID REFERENCES auth.users(id),
    success_status BOOLEAN,
    delta_rs FLOAT,
    delta_av FLOAT,
    delta_bi FLOAT,
    delta_se FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE system_events IS 'Controls synchronized swarm-wide stress tests and resonance activities.';
