-- Phase 29.0: Hive Wisdom Vault Schema
-- Mission: Store high-quality Oracle-rank trajectories to be used as peer templates.

CREATE TABLE IF NOT EXISTS public.hive_wisdom_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trajectory_id TEXT UNIQUE NOT NULL,
    embedding VECTOR(5), -- Dimensionality matching AwarenessVector (rs, av, bi, se, cb)
    sovereignty_score INTEGER DEFAULT 0,
    trajectory_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hive_wisdom_vault ENABLE ROW LEVEL SECURITY;

-- Allow Oracles to insert/modify vault entries
-- Added explicit ::uuid and ::text casts to prevent type mismatch errors
CREATE POLICY "Oracles can manage vault" ON public.hive_wisdom_vault
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id::uuid = auth.uid() 
            AND profiles.ascension_status IN ('ascended', 'candidate')
        )
    );

-- Allow everyone to read the vault (for matching)
CREATE POLICY "Everyone can read vault" ON public.hive_wisdom_vault
    FOR SELECT USING (true);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_hive_wisdom_vault_score ON public.hive_wisdom_vault(sovereignty_score DESC);
