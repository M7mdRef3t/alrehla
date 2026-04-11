-- 1. Fix RLS Performance Issue (Statement Timeout)
-- Make getting the role STABLE so it is only evaluated once per query
CREATE OR REPLACE FUNCTION public.get_auth_role_v2()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()::text 
  LIMIT 1;
$$;

-- 2. Add Missing Index on `occurred_at` for routing_events
-- Without this, any query filtering or ordering solely by occurred_at performs a full table scan, triggering RLS for every row and causing a 500 Statement Timeout.
CREATE INDEX IF NOT EXISTS routing_events_occurred_at_idx 
ON public.routing_events (occurred_at desc);

-- 3. Also add index on `created_at` in marketing_leads as it is queried similarly
CREATE INDEX IF NOT EXISTS marketing_leads_created_at_idx
ON public.marketing_leads (created_at desc);
