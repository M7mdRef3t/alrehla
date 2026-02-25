-- Phase 11: Hive Protocol (Collective Intelligence)

-- 1. Wisdom Vault: Storage for successfully completed Oracle-rank journeys
CREATE TABLE IF NOT EXISTS hive_wisdom_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_user_id UUID, -- Anonymized in views, kept for internal tracking
    origin_trajectory_id UUID,
    title TEXT NOT NULL,
    initial_vector JSONB NOT NULL,
    final_vector JSONB NOT NULL,
    growth_delta JSONB NOT NULL,
    mission_data JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Crowdsourced Evasion Dictionary
CREATE TABLE IF NOT EXISTS hive_evasion_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern TEXT UNIQUE NOT NULL, -- Hashed or descriptive pattern
    frequency INTEGER DEFAULT 1,
    detected_at TIMESTAMPTZ DEFAULT now(),
    last_detected_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Swarm Stats (For Collective Radar)
CREATE TABLE IF NOT EXISTS hive_swarm_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    mean_vector JSONB NOT NULL, -- Average RS, AV, BI, SE across all active users
    active_sovereigns INTEGER DEFAULT 0,
    swarm_momentum FLOAT DEFAULT 0.0
);

-- Enable RLS (Anonymized Access)
ALTER TABLE hive_wisdom_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wisdom is public for all Sovereigns" ON hive_wisdom_vault FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_hive_vector_search ON hive_wisdom_vault USING gin (initial_vector);
CREATE INDEX idx_hive_patterns ON hive_evasion_patterns (pattern);
