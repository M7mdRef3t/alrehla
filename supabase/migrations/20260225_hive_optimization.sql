-- Phase 12: Production Hardening & Hive Optimization
-- Enabling pgvector for high-performance vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: We use the existing JSONB column for compatibility but we will shadow it with a vector column for performance
ALTER TABLE hive_wisdom_vault 
ADD COLUMN IF NOT EXISTS embedding_vector vector(5); -- [rs, av, bi, se, cb]

-- Migration function to sync existing JSONB vectors to the new vector column
CREATE OR REPLACE FUNCTION sync_hive_vectors() 
RETURNS void AS $$
BEGIN
    UPDATE hive_wisdom_vault 
    SET embedding_vector = CAST(ARRAY[
        (initial_vector->>'rs')::float,
        (initial_vector->>'av')::float,
        (initial_vector->>'bi')::float,
        (initial_vector->>'se')::float,
        (initial_vector->>'cb')::float
    ] AS vector)
    WHERE embedding_vector IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute sync
SELECT sync_hive_vectors();

-- HNSW Index for ultra-fast similarity search at scale
-- m=16, ef_construction=64 are standard defaults for balanced speed/accuracy
CREATE INDEX IF NOT EXISTS idx_hive_wisdom_hnsw 
ON hive_wisdom_vault 
USING hnsw (embedding_vector vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_hive_wisdom_hnsw IS 'HNSW index for O(log N) similarity search on Oracle trajectories.';
