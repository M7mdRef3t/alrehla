-- Phase 27: The Ascension Protocol (Oracle Promotion & Guardrails)
-- Implementation of "Swarm Impact" and "The Descent" (Demotion) logic.

-- 1. Create Ascension Status Enum (using text with check constraint for flexibility)
DO $$ BEGIN
    -- Add columns to profiles if they don't exist
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ascension_status TEXT DEFAULT 'none' 
        CHECK (ascension_status IN ('none', 'candidate', 'invited', 'ascended', 'fallen_oracle'));
    
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ascension_points FLOAT DEFAULT 0.0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS swarm_impact_score FLOAT DEFAULT 0.0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consistency_streak INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Create Phoenix Score History tracking
CREATE TABLE IF NOT EXISTS public.phoenix_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.system_events(id),
    phoenix_score FLOAT NOT NULL,
    swarm_impact_delta FLOAT DEFAULT 0.0,
    ascension_points_delta FLOAT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phoenix_history_user ON public.phoenix_score_history(user_id);

-- 3. Function to update Ascension Points after an event
CREATE OR REPLACE FUNCTION update_ascension_metrics(
    p_user_id UUID,
    p_event_id UUID,
    p_phoenix_score FLOAT,
    p_swarm_impact FLOAT
) RETURNS VOID AS $$
DECLARE
    v_consistency_mult FLOAT;
    v_points_delta FLOAT;
    v_current_points FLOAT;
BEGIN
    -- Calculate consistency multiplier based on last 30 days of active events
    -- For now, using a simplified multiplier based on profile streak
    SELECT COALESCE(consistency_streak, 0) INTO v_consistency_mult FROM profiles WHERE id::uuid = p_user_id;
    v_consistency_mult := 1.0 + LN(GREATEST(1, v_consistency_mult + 1));

    -- Ascension Formula: Delta A = (P + 0.3 * SI) * Consistency
    v_points_delta := (p_phoenix_score + (0.3 * p_swarm_impact)) * v_consistency_mult;

    -- Update Profile
    UPDATE profiles 
    SET 
        ascension_points = ascension_points + v_points_delta,
        swarm_impact_score = swarm_impact_score + p_swarm_impact,
        consistency_streak = consistency_streak + 1
    WHERE id::uuid = p_user_id
    RETURNING ascension_points INTO v_current_points;

    -- Record History
    INSERT INTO phoenix_score_history (user_id, event_id, phoenix_score, swarm_impact_delta, ascension_points_delta)
    VALUES (p_user_id, p_event_id, p_phoenix_score, p_swarm_impact, v_points_delta);

    -- Check for Promotion Threshold (Candidate)
    IF v_current_points >= 10.0 AND (SELECT ascension_status FROM profiles WHERE id::uuid = p_user_id) = 'none' THEN
        UPDATE profiles SET ascension_status = 'candidate' WHERE id::uuid = p_user_id;
    END IF;

    -- Check for Invitation Threshold
    IF v_current_points >= 15.0 AND (SELECT ascension_status FROM profiles WHERE id::uuid = p_user_id) = 'candidate' THEN
        UPDATE profiles SET ascension_status = 'invited' WHERE id::uuid = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. The Descent: Daily automated integrity check
CREATE OR REPLACE FUNCTION check_oracle_integrity() RETURNS INTEGER AS $$
DECLARE
    v_affected_count INTEGER := 0;
BEGIN
    -- Identify Oracles whose Behavioral Integrity (BI) has fallen below 0.5
    -- We'll assume BI is tracked in awareness_vector->>'bi'
    UPDATE profiles
    SET ascension_status = 'fallen_oracle'
    WHERE ascension_status = 'ascended'
    AND (awareness_vector->>'bi')::float < 0.5
    -- Note: In production, we'd check for a 3-day trend, but for MVP, a snapshot trigger is the first guardrail
    AND last_active_at > NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    RETURN v_affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.ascension_status IS 'none -> candidate -> invited -> ascended (Oracle) -> fallen_oracle';
COMMENT ON TABLE phoenix_score_history IS 'Historical snapshots of pioneer performance during resonance events.';
