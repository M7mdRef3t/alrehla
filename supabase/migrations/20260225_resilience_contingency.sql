-- Phase 22: High-Resolution Telemetry & Failure Contingency

-- View to track swarm-wide resilience status
CREATE OR REPLACE VIEW swarm_resilience_metrics AS
SELECT 
    COUNT(*) FILTER (WHERE (awareness_vector->>'is_insulated')::boolean = true) as insulated_count,
    COUNT(*) as total_pioneers,
    (COUNT(*) FILTER (WHERE (awareness_vector->>'is_insulated')::boolean = true))::float / NULLIF(COUNT(*), 0) * 100 as resilience_percentage,
    MIN(timestamp) FILTER (WHERE (awareness_vector->>'is_insulated')::boolean = true) as first_solver_time
FROM profiles;

-- Add broadcast latency tracking to system_telemetry_logs aggregates if needed
-- (The existing live_swarm_telemetry view already handles this via AVG(latency_ms))
