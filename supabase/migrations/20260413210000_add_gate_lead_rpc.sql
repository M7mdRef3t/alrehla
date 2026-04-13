-- Migration: Add atomic function for gate lead submission
-- This ensures we only mark a submission ONCE per session ID
-- Date: 2026-04-13

CREATE OR REPLACE FUNCTION public.rpc_submit_gate_lead(
  p_id UUID,
  p_email TEXT,
  p_source_area TEXT,
  p_timestamp TIMESTAMPTZ,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL,
  p_fbclid TEXT DEFAULT NULL,
  p_fbp TEXT DEFAULT NULL,
  p_fbc TEXT DEFAULT NULL
) 
RETURNS TABLE (id UUID) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.gate_sessions
  SET 
    email = p_email,
    source_area = p_source_area,
    lead_submitted_at = p_timestamp,
    utm_source = COALESCE(p_utm_source, gate_sessions.utm_source),
    utm_medium = COALESCE(p_utm_medium, gate_sessions.utm_medium),
    utm_campaign = COALESCE(p_utm_campaign, gate_sessions.utm_campaign),
    utm_content = COALESCE(p_utm_content, gate_sessions.utm_content),
    utm_term = COALESCE(p_utm_term, gate_sessions.utm_term),
    fbclid = COALESCE(p_fbclid, gate_sessions.fbclid),
    fbp = COALESCE(p_fbp, gate_sessions.fbp),
    fbc = COALESCE(p_fbc, gate_sessions.fbc),
    updated_at = p_timestamp
  WHERE gate_sessions.id = p_id 
    AND lead_submitted_at IS NULL
  RETURNING gate_sessions.id;
END;
$$;

COMMENT ON FUNCTION public.rpc_submit_gate_lead IS 'Atomically updates a gate session with lead data, ensuring idempotency via lead_submitted_at check.';
