-- Phase 29.2: HNSW Vector Optimization
-- Purpose: Upgrade from the default ivfflat (or no index) to HNSW for the Hive Wisdom Vault.
-- HNSW (Hierarchical Navigable Small Worlds) provides superior performance and higher recall at scale.

-- 1. Ensure the pgvector extension is active
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing indexes on the embedding column if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_hive_wisdom_vault_embedding;

-- 3. Create the HNSW index
-- m: The max number of connections per node (default 16)
-- ef_construction: The size of the dynamic candidate list for index construction (default 64)
-- Using m=16 and ef_construction=64 as balanced defaults for alpha scale.
CREATE INDEX idx_hive_wisdom_vault_hnsw 
ON hive_wisdom_vault 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Verify existing data matches the new index
ANALYZE hive_wisdom_vault;

-- 5. Optional: Add a comment for audit
COMMENT ON INDEX idx_hive_wisdom_vault_hnsw IS 'Upgraded to HNSW for real-time hive matching in Phase 29.';
