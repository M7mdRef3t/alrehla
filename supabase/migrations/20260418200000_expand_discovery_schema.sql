-- Expand discovery_items table with strategic analysis fields
ALTER TABLE public.discovery_items 
ADD COLUMN IF NOT EXISTS signal_source TEXT,
ADD COLUMN IF NOT EXISTS funnel_stage TEXT,
ADD COLUMN IF NOT EXISTS business_goal TEXT,
ADD COLUMN IF NOT EXISTS confidence SMALLINT DEFAULT 3 CHECK (confidence >= 1 AND confidence <= 5),
ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hypothesis TEXT,
ADD COLUMN IF NOT EXISTS risk TEXT,
ADD COLUMN IF NOT EXISTS next_step TEXT,
ADD COLUMN IF NOT EXISTS execution_link TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

-- Add comments for documentation
COMMENT ON COLUMN public.discovery_items.funnel_stage IS 'onboarding, awareness, conversion, retention, etc.';
COMMENT ON COLUMN public.discovery_items.confidence IS '1 (low) to 5 (high) level of validation';
COMMENT ON COLUMN public.discovery_items.execution_link IS 'Link to created mission or mutation (e.g., mission:uuid)';
