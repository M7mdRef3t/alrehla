-- Behavioral Radar: Internal Analytics Event Tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Null for guests
    params JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize for Dashboard retrieval
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);

-- Simple view for the live feed
CREATE OR REPLACE VIEW live_behavioral_radar AS
SELECT 
    id,
    event_name,
    user_id,
    params,
    created_at
FROM analytics_events
ORDER BY created_at DESC
LIMIT 50;

-- Simple view for the funnel (Last 30 days)
CREATE OR REPLACE VIEW funnel_overview_stats AS
SELECT
    COUNT(*) FILTER (WHERE event_name = 'landing_view') as landing,
    COUNT(*) FILTER (WHERE event_name = 'cta_click') as entry,
    COUNT(*) FILTER (WHERE event_name = 'first_pulse_submitted') as activation,
    COUNT(*) FILTER (WHERE event_name = 'pulse_day_n' AND (params->>'day')::int >= 2) as engagement_d2,
    COUNT(*) FILTER (WHERE event_name = 'pulse_day_n' AND (params->>'day')::int >= 7) as engagement_d7,
    COUNT(*) FILTER (WHERE event_name = 'auth_completed') as conversion
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days';
