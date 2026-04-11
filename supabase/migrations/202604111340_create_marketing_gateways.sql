-- Create marketing_gateways table for administrative control of journey paths
CREATE TABLE IF NOT EXISTS public.marketing_gateways (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'locked', 'restricted')),
    energy_level INTEGER DEFAULT 50 CHECK (energy_level >= 0 AND energy_level <= 100),
    last_recalibrated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    oracle_note TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.marketing_gateways ENABLE ROW LEVEL SECURITY;

-- Admin access (implicit for service role, but good for clarity)
CREATE POLICY "Admins can do everything on marketing_gateways"
    ON public.marketing_gateways
    FOR ALL
    USING (true);

-- Seed initial gateways
INSERT INTO public.marketing_gateways (id, name, status, energy_level)
VALUES 
    ('meta', 'رحلة ميتا', 'open', 50),
    ('tiktok', 'رحلة تيك توك', 'open', 50),
    ('google', 'رحلة جوجل / الموقع', 'open', 50),
    ('direct', 'الرحلة المباشرة', 'open', 50)
ON CONFLICT (id) DO NOTHING;
