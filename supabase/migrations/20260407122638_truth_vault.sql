-- 1. Create Truth Vault table
CREATE TABLE IF NOT EXISTS public.truth_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('breakthrough', 'shadow_pattern', 'boundary_set')),
    priority INTEGER DEFAULT 5,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.truth_vault ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view their own truths" 
ON public.truth_vault FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own truths" 
ON public.truth_vault FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own truths" 
ON public.truth_vault FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own truths" 
ON public.truth_vault FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Pulse Stats Function: Get real counts from routing_events
-- This function returns the number of unique anonymous/user sessions in the last 24 hours
CREATE OR REPLACE FUNCTION public.get_live_pulse_stats()
RETURNS TABLE (
    total_recent_visitors BIGINT,
    active_now_estimate BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) as total_recent_visitors,
        (COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) / 12) + 5 as active_now_estimate -- Simple heuristic for "now"
    FROM public.routing_events
    WHERE created_at > now() - interval '24 hours';
END;
$$;
