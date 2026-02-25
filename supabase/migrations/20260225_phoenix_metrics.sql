-- Phase 26: The Phoenix Engine (Post-Impact Evolutionary Metrics)

-- 1. Pioneer Report Card View
-- Computes a per-user Phoenix Score from event participation data
-- sovereignty_score lives on user_trajectories, not profiles
CREATE OR REPLACE VIEW pioneer_report_card AS
WITH event_participants AS (
    SELECT 
        p.id AS user_id,
        p.email,
        COALESCE(p.sovereignty_score, 0) AS sovereignty_score,
        p.awareness_vector,
        COALESCE((p.awareness_vector->>'is_insulated')::boolean, false) AS is_insulated,
        COALESCE((p.awareness_vector->>'se')::float, 0.5) AS current_se,
        COALESCE((p.awareness_vector->>'cb')::float, 0.5) AS current_cb,
        COALESCE((p.awareness_vector->>'bi')::float, 0.5) AS current_bi,
        COALESCE((p.awareness_vector->>'av')::float, 0.5) AS current_av,
        se.id AS event_id,
        se.event_name,
        se.first_solver_id,
        CASE WHEN COALESCE((p.awareness_vector->>'is_insulated')::boolean, false) = true THEN
            GREATEST(0.1, 1.0 - LEAST(1.0,
                EXTRACT(EPOCH FROM (NOW() - se.start_time)) / 3600.0
            ))
        ELSE 0.0
        END AS reaction_speed,
        COALESCE((p.awareness_vector->>'cb')::float, 0.5) AS cb_resilience,
        COALESCE((p.awareness_vector->>'bi')::float, 0.5) AS post_event_growth
    FROM profiles p
    CROSS JOIN LATERAL (
        SELECT * FROM system_events 
        WHERE event_type = 'high_pressure' 
        ORDER BY start_time DESC 
        LIMIT 1
    ) se
)
SELECT 
    user_id,
    email,
    sovereignty_score,
    event_id,
    event_name,
    is_insulated,
    reaction_speed,
    cb_resilience,
    post_event_growth,
    current_se,
    current_bi,
    current_av,
    -- Phoenix Score: SE-dampened speed + CB resilience + Post-event growth
    -- Formula: 0.4 * (ReactionSpeed / ln(1 + SE)) + 0.3 * CB_resilience + 0.3 * Growth
    ROUND((
        0.4 * (reaction_speed / GREATEST(0.1, LN(1 + COALESCE(current_se, 0.1)))) +
        0.3 * cb_resilience +
        0.3 * post_event_growth
    )::numeric, 3) AS phoenix_score,
    -- Is this user the Aegis Prime?
    (first_solver_id = user_id::uuid) AS is_aegis_prime
FROM event_participants;

-- 2. Resonance Pairs Table (Synchronicity Pairing with Ephemeral Entanglement)
CREATE TABLE IF NOT EXISTS resonance_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL,
    user_b_id UUID NOT NULL,
    event_id UUID REFERENCES system_events(id),
    mission_context JSONB DEFAULT '{}',
    complementary_axis TEXT, -- e.g. 'SE', 'AV', 'BI', 'RS'
    similarity_score FLOAT,  -- Complementary distance (higher = more complementary)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL, -- Ephemeral Entanglement TTL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_pair_per_event UNIQUE (user_a_id, user_b_id, event_id)
);

-- 3. RPC for finding the most complementary partner (Inverse Vector Distance)
CREATE OR REPLACE FUNCTION find_resonance_partner(p_user_id UUID)
RETURNS TABLE(partner_id UUID, complementary_score FLOAT, weakness_axis TEXT) AS $$
DECLARE
    v_user_vector JSONB;
    v_se FLOAT;
    v_av FLOAT;
    v_bi FLOAT;
    v_rs FLOAT;
BEGIN
    -- Get requesting user's vector
    SELECT awareness_vector INTO v_user_vector 
    FROM profiles WHERE id::uuid = p_user_id;
    
    v_se := COALESCE((v_user_vector->>'se')::float, 0.5);
    v_av := COALESCE((v_user_vector->>'av')::float, 0.5);
    v_bi := COALESCE((v_user_vector->>'bi')::float, 0.5);
    v_rs := COALESCE((v_user_vector->>'rs')::float, 0.5);
    
    -- Find the most COMPLEMENTARY user (highest absolute difference = most complementary)
    RETURN QUERY
    SELECT 
        p.id::uuid AS partner_id,
        -- Complementary Score: sum of absolute differences (higher = more complementary)
        (ABS(v_se - COALESCE((p.awareness_vector->>'se')::float, 0.5)) +
         ABS(v_av - COALESCE((p.awareness_vector->>'av')::float, 0.5)) +
         ABS(v_bi - COALESCE((p.awareness_vector->>'bi')::float, 0.5)) +
         ABS(v_rs - COALESCE((p.awareness_vector->>'rs')::float, 0.5)))::FLOAT AS complementary_score,
        -- Identify the primary axis of complementarity
        CASE 
            WHEN ABS(v_se - COALESCE((p.awareness_vector->>'se')::float, 0.5)) = GREATEST(
                ABS(v_se - COALESCE((p.awareness_vector->>'se')::float, 0.5)),
                ABS(v_av - COALESCE((p.awareness_vector->>'av')::float, 0.5)),
                ABS(v_bi - COALESCE((p.awareness_vector->>'bi')::float, 0.5)),
                ABS(v_rs - COALESCE((p.awareness_vector->>'rs')::float, 0.5))
            ) THEN 'SE'
            WHEN ABS(v_av - COALESCE((p.awareness_vector->>'av')::float, 0.5)) = GREATEST(
                ABS(v_se - COALESCE((p.awareness_vector->>'se')::float, 0.5)),
                ABS(v_av - COALESCE((p.awareness_vector->>'av')::float, 0.5)),
                ABS(v_bi - COALESCE((p.awareness_vector->>'bi')::float, 0.5)),
                ABS(v_rs - COALESCE((p.awareness_vector->>'rs')::float, 0.5))
            ) THEN 'AV'
            WHEN ABS(v_bi - COALESCE((p.awareness_vector->>'bi')::float, 0.5)) = GREATEST(
                ABS(v_se - COALESCE((p.awareness_vector->>'se')::float, 0.5)),
                ABS(v_av - COALESCE((p.awareness_vector->>'av')::float, 0.5)),
                ABS(v_bi - COALESCE((p.awareness_vector->>'bi')::float, 0.5)),
                ABS(v_rs - COALESCE((p.awareness_vector->>'rs')::float, 0.5))
            ) THEN 'BI'
            ELSE 'RS'
        END AS weakness_axis
    FROM profiles p
    WHERE p.id::uuid != p_user_id
      -- Exclude users already in an active pair
      AND p.id::uuid NOT IN (
          SELECT user_a_id FROM resonance_pairs WHERE status = 'active'
          UNION ALL
          SELECT user_b_id FROM resonance_pairs WHERE status = 'active'
      )
    ORDER BY complementary_score DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON VIEW pioneer_report_card IS 'Post-impact performance analysis with SE-dampened Phoenix Score.';
COMMENT ON TABLE resonance_pairs IS 'Ephemeral synchronicity pairings. Auto-expires via TTL.';
