-- [Sovereign Connectivity] Agent Registry & A2A Messaging Schema

-- 1. Agent Registry: The Directory of Sovereignty
CREATE TABLE IF NOT EXISTS public.agent_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    capabilities JSONB DEFAULT '[]'::jsonb, -- List of tools/methods it offers
    agent_card JSONB DEFAULT '{}'::jsonb,   -- Philosophy, role, owner metadata
    status TEXT DEFAULT 'online',           -- online, offline, thinking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agent Messages: Internal Correspondence (A2A Bus)
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent_id UUID REFERENCES public.agent_registry(id),
    to_agent_id UUID REFERENCES public.agent_registry(id),
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, delivered, acknowledged, error
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Security Hardening (RLS)
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Allow only Admin/Owner to see and manage agents
CREATE POLICY "SuperAdmin Full Access on Registry" ON public.agent_registry
    FOR ALL TO authenticated
    USING ( (auth.jwt() ->> 'role') IN ('superadmin', 'owner', 'admin') )
    WITH CHECK ( (auth.jwt() ->> 'role') IN ('superadmin', 'owner', 'admin') );

CREATE POLICY "SuperAdmin Full Access on Messages" ON public.agent_messages
    FOR ALL TO authenticated
    USING ( (auth.jwt() ->> 'role') IN ('superadmin', 'owner', 'admin') )
    WITH CHECK ( (auth.jwt() ->> 'role') IN ('superadmin', 'owner', 'admin') );

-- 4. Initial Seed for Core Agents
INSERT INTO public.agent_registry (name, capabilities, agent_card)
VALUES 
('Dawayir', '["analyze_relations", "detect_ghosting", "match_pairs"]', '{"role": "Relational Analyst", "philosophy": "Unity through clarity"}'),
('Alrehla', '["search_content", "generate_path", "analyze_dna"]', '{"role": "Content Navigator", "philosophy": "Discovery through movement"}'),
('Sovereign', '["orchestrate_all", "evolve_ui", "audit_conscious"]', '{"role": "Supreme Architect", "philosophy": "Order through First Principles"}')
ON CONFLICT (name) DO NOTHING;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_registry_updated_at
    BEFORE UPDATE ON public.agent_registry
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
