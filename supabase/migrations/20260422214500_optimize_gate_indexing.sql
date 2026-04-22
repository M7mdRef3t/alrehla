-- Optimized Indexing for Gate Sessions & Marketing CRM
-- Aim: Speed up real-time attribution and automation lookups

-- 1. Analytics & Reporting (Time-series performance)
CREATE INDEX IF NOT EXISTS idx_gate_sessions_created_at_area 
ON public.gate_sessions(created_at DESC, source_area);

-- 2. Lead Discovery (Faster lookups by identity)
CREATE INDEX IF NOT EXISTS idx_gate_sessions_email_lookup 
ON public.gate_sessions(email) 
WHERE email IS NOT NULL;

-- 3. Marketing Intent Analysis
CREATE INDEX IF NOT EXISTS idx_gate_sessions_intent 
ON public.gate_sessions(intent) 
WHERE intent IS NOT NULL;

-- 4. Session Persistence Lookups
-- Already exists as primary key (id), but ensuring uuid based indexing for performance
CLUSTER public.gate_sessions USING gate_sessions_pkey;
