-- Migration: Create dawayir_pages table for Sovereign Editor

CREATE TABLE IF NOT EXISTS public.dawayir_pages (
    path TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS setup
ALTER TABLE public.dawayir_pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone can see the landing pages)
CREATE POLICY "Public profiles are viewable by everyone."
ON public.dawayir_pages FOR SELECT
USING ( true );

-- We can allow owner/admin to upsert.
-- For local dev & early access, we will allow authenticated users to update.
-- In production, restrict this checking user role.
CREATE POLICY "Users can insert pages."
ON public.dawayir_pages FOR INSERT
TO authenticated
WITH CHECK ( true );

CREATE POLICY "Users can update pages."
ON public.dawayir_pages FOR UPDATE
TO authenticated
USING ( true );

-- trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_dawayir_pages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dawayir_pages_updated_at
BEFORE UPDATE ON public.dawayir_pages
FOR EACH ROW
EXECUTE PROCEDURE update_dawayir_pages_updated_at_column();
