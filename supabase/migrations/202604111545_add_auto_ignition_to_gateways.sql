-- Add auto_ignition_enabled flag to marketing_gateways
ALTER TABLE public.marketing_gateways 
ADD COLUMN IF NOT EXISTS auto_ignition_enabled BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.marketing_gateways.auto_ignition_enabled IS 'Whether this gateway is allowed to take autonomous AI decisions (Auto-Ignition)';
