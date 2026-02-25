-- Phase 16: Live Telemetry & Quality Control
CREATE TABLE IF NOT EXISTS system_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL, -- 'awareness-worker', 'chat-evaluator', 'hive-engine'
    action TEXT,
    latency_ms INTEGER,
    status TEXT, -- 'success', 'failure', 'rejected'
    payload JSONB, -- Contextual data (e.g., rejection reasons)
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time summary view for the Telemetry Dashboard
CREATE OR REPLACE VIEW live_swarm_telemetry AS
SELECT 
    service_name,
    COUNT(*) as total_calls,
    AVG(latency_ms) as avg_latency,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejection_count,
    COUNT(*) FILTER (WHERE status = 'success') as success_count,
    MAX(timestamp) as last_pulse
FROM system_telemetry_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY service_name;

-- Standard index for time-series analysis
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON system_telemetry_logs (timestamp DESC);
