-- Fix for get_live_pulse_stats RPC (Bad Request 400)
-- The original function in truth_vault migration used 'created_at' which doesn't exist
-- routing_events table uses 'occurred_at'

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
        (COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) / 12) + 5 as active_now_estimate
    FROM public.routing_events
    WHERE occurred_at > now() - interval '24 hours';
END;
$$;
