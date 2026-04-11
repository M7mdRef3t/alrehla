-- Add actual_spend to marketing_gateways to store real API data
ALTER TABLE public.marketing_gateways 
ADD COLUMN IF NOT EXISTS actual_spend DECIMAL(12, 2) DEFAULT 0;
