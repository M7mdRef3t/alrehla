-- Atomicity Upgrade: Ensure only one Aegis Prime
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS first_solver_id UUID;

CREATE OR REPLACE FUNCTION claim_aegis_prime(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_claimed BOOLEAN;
BEGIN
    -- Atomic update: only one user can claim the first_solver_id for this event
    UPDATE public.system_events
    SET first_solver_id = p_user_id
    WHERE id = p_event_id AND first_solver_id IS NULL;
    
    GET DIAGNOSTICS v_claimed = ROW_COUNT;
    
    RETURN v_claimed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
