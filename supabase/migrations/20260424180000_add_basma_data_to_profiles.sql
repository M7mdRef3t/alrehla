-- Add basma_data to profiles for synchronization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS basma_data JSONB DEFAULT '{"traits": [], "values": [], "statements": []}'::jsonb;

-- Update RLS if needed (already broad enough usually)
GRANT ALL ON public.profiles TO authenticated;
