-- Migration: Add Hub-and-Spoke Identity Fields to journey_maps
-- Date: 2026-04-13

-- Add new columns for anonymous and cross-product tracking
ALTER TABLE public.journey_maps
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS origin_product text DEFAULT 'alrehla';

-- Add index to quickly locate maps using the phone number entered in session OS
CREATE INDEX IF NOT EXISTS journey_maps_phone_idx ON public.journey_maps (client_phone);

COMMENT ON COLUMN public.journey_maps.client_phone IS 'Used to stitch anonymous maps (especially from Spokes) with user profiles via phone number.';
COMMENT ON COLUMN public.journey_maps.origin_product IS 'Identifies the Hub/Spoke product that generated this map (e.g., alrehla, masarat, dawaier).';
