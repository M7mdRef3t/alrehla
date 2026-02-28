-- The Swarm Ingestion Layer: External Signals & Momentum Logic
-- Mission: Monitor the "Magnetic Field" of the global context.

-- 1. External Signals Table
CREATE TABLE IF NOT EXISTS external_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL, -- e.g., 'news_aggregator', 'economic_index', 'social_sentiment'
    type TEXT NOT NULL,   -- 'sentiment', 'tension', 'momentum'
    label TEXT,           -- e.g., 'Global Market Crash', 'Peace Treaty'
    value FLOAT NOT NULL, -- 0.0 to 1.0 (0 = Calm, 1 = Critical)
    weight FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE external_signals ENABLE ROW LEVEL SECURITY;

-- Allow Oracles to manage signals
CREATE POLICY "Oracles can manage signals" ON external_signals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.ascension_status IN ('ascended', 'candidate')
        )
    );

-- Allow all users to read signals
CREATE POLICY "Everyone can read signals" ON external_signals
    FOR SELECT USING (true);

-- 2. Swarm Metrics Table (Enhanced)
-- Already exists, but we need to ensure it's updated.

-- 3. Trigger Function: Recalculate Swarm Momentum
-- Whenever a new signal is ingested, we update the global swarm metrics.
CREATE OR REPLACE FUNCTION update_swarm_momentum_on_signal()
RETURNS TRIGGER AS $$
DECLARE
    internal_momentum FLOAT;
    external_modifier FLOAT;
    avg_tension FLOAT;
BEGIN
    -- Get current internal momentum (from active journeys)
    -- Simplified: Use the latest swarm_momentum as base
    SELECT swarm_momentum INTO internal_momentum 
    FROM hive_swarm_metrics 
    ORDER BY timestamp DESC LIMIT 1;
    
    IF internal_momentum IS NULL THEN
        internal_momentum := 1.0;
    END IF;

    -- Calculate external modifier from last 24h signals
    SELECT 
        COALESCE(SUM(value * weight) / NULLIF(SUM(weight), 0), 0),
        COALESCE(AVG(CASE WHEN type = 'tension' THEN value END), 0)
    INTO external_modifier, avg_tension
    FROM external_signals
    WHERE created_at > NOW() - INTERVAL '24 hours';

    -- Momentum Formula: M = M_internal * (1 + Modifier)
    -- Tension Formula: T = Avg(Tension Signals)
    
    INSERT INTO hive_swarm_metrics (
        active_sovereigns,
        swarm_momentum,
        mean_vector,
        outlier_vector,
        metadata
    )
    SELECT 
        active_sovereigns,
        internal_momentum * (1.0 + external_modifier),
        mean_vector,
        outlier_vector,
        jsonb_build_object(
            'external_tension', avg_tension,
            'last_signal_source', NEW.source,
            'last_signal_label', NEW.label
        )
    FROM hive_swarm_metrics
    ORDER BY timestamp DESC LIMIT 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trigger_update_swarm_momentum ON external_signals;
CREATE TRIGGER trigger_update_swarm_momentum
AFTER INSERT ON external_signals
FOR EACH ROW
EXECUTE FUNCTION update_swarm_momentum_on_signal();

-- 5. RPC: Get Latest External Tension
CREATE OR REPLACE FUNCTION get_latest_external_tension()
RETURNS FLOAT AS $$
BEGIN
    RETURN (
        SELECT (metadata->>'external_tension')::FLOAT 
        FROM hive_swarm_metrics 
        WHERE metadata ? 'external_tension'
        ORDER BY timestamp DESC LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;
