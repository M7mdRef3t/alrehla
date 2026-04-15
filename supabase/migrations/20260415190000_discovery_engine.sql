-- Create discovery_items table
CREATE TABLE IF NOT EXISTS public.discovery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL, -- 'user_signal', 'ops_insight', 'direct_feedback'
    stage TEXT NOT NULL CHECK (stage IN ('Inbox', 'Needs Evidence', 'Validated', 'Prioritized', 'In Delivery', 'Shipped')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    interpretations JSONB NOT NULL DEFAULT '[]'::jsonb,
    jira_issue_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users (assuming admin domain access is controlled at app level) 
-- OR use a more specific policy if there is a known admin role. I will let all service role / authenticated access.
CREATE POLICY "Enable all access for authenticated users" 
ON public.discovery_items FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_discovery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discovery_items_updated_at_trigger
BEFORE UPDATE ON public.discovery_items
FOR EACH ROW
EXECUTE FUNCTION update_discovery_items_updated_at();
