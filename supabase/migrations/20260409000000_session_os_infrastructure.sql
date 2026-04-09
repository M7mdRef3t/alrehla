-- Supabase Migration: Session OS Infrastructure
-- Date: 2026-04-09
-- Description: Core tables for the Dawayir Session OS Journey Flow

-- Clean up any partial state (Safe for dev reset)
DROP TABLE IF EXISTS public.dawayir_session_followups CASCADE;
DROP TABLE IF EXISTS public.dawayir_session_summaries CASCADE;
DROP TABLE IF EXISTS public.dawayir_sessions CASCADE;
DROP TABLE IF EXISTS public.dawayir_ai_session_briefs CASCADE;
DROP TABLE IF EXISTS public.dawayir_prep_forms CASCADE;
DROP TABLE IF EXISTS public.dawayir_triage_answers CASCADE;
DROP TABLE IF EXISTS public.dawayir_session_requests CASCADE;
DROP TABLE IF EXISTS public.dawayir_clients CASCADE;

-- 1. ENUM Types
DO $$ BEGIN
    CREATE TYPE session_request_status AS ENUM (
        'new_request',
        'intake_completed',
        'triage_completed',
        'prep_pending',
        'prep_form_completed',
        'brief_generated',
        'session_ready',
        'session_done',
        'post_message_sent',
        'followup_pending',
        'followup_done',
        'closed',
        'rejected',
        'referred_out',
        'needs_manual_review',
        'abandoned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_execution_status AS ENUM (
        'scheduled',
        'completed',
        'missed',
        'postponed',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_followup_status AS ENUM (
        'pending',
        'sent',
        'replied',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Clients Table (Dedicated for Session OS)
CREATE TABLE IF NOT EXISTS public.dawayir_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    country TEXT,
    age_range TEXT,
    preferred_contact TEXT,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL, -- optional link to main profile
    marketing_lead_id UUID -- optional link to marketing leads
);

-- 3. Session Requests
CREATE TABLE IF NOT EXISTS public.dawayir_session_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.dawayir_clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT,
    status session_request_status DEFAULT 'new_request'::session_request_status NOT NULL,
    -- Basic Intake responses
    request_reason TEXT,
    urgency_reason TEXT,
    biggest_challenge TEXT,
    previous_sessions TEXT,
    specific_person_or_situation TEXT,
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    duration_of_problem TEXT
);

-- 4. Triage Answers (Decision Engine Input/Output)
CREATE TABLE IF NOT EXISTS public.dawayir_triage_answers (
    request_id UUID PRIMARY KEY REFERENCES public.dawayir_session_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Raw answers
    safety_crisis_flag BOOLEAN DEFAULT FALSE,
    safety_medical_flag BOOLEAN DEFAULT FALSE,
    session_goal_type TEXT,
    -- Calculated Scores
    urgency_score INTEGER DEFAULT 0,
    clarity_score INTEGER DEFAULT 0,
    readiness_score INTEGER DEFAULT 0,
    complexity_score INTEGER DEFAULT 0,
    risk_flags JSONB DEFAULT '[]'::jsonb
);

-- 5. Prep Forms (Pre-session deep dive)
CREATE TABLE IF NOT EXISTS public.dawayir_prep_forms (
    request_id UUID PRIMARY KEY REFERENCES public.dawayir_session_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    story TEXT,
    attempts_before TEXT,
    current_impact JSONB DEFAULT '[]'::jsonb,
    desired_outcome TEXT,
    dominant_emotions JSONB DEFAULT '[]'::jsonb
);

-- 6. AI Session Briefs (Internal Intelligence)
CREATE TABLE IF NOT EXISTS public.dawayir_ai_session_briefs (
    request_id UUID PRIMARY KEY REFERENCES public.dawayir_session_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    visible_problem TEXT,
    emotional_signal TEXT,
    hidden_need TEXT,
    expected_goal TEXT,
    first_hypothesis TEXT,
    session_boundaries TEXT
);

-- 7. Sessions (Execution)
CREATE TABLE IF NOT EXISTS public.dawayir_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.dawayir_session_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    coach_notes TEXT,
    status session_execution_status DEFAULT 'scheduled'::session_execution_status NOT NULL
);

-- 8. Session Summaries (Post-Session Authored by Coach)
CREATE TABLE IF NOT EXISTS public.dawayir_session_summaries (
    session_id UUID PRIMARY KEY REFERENCES public.dawayir_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_summary_text TEXT,
    main_topic TEXT,
    dominant_pattern TEXT,
    hidden_need TEXT,
    main_intervention TEXT,
    first_shift_noticed TEXT,
    assignment TEXT,
    assignment_deadline TIMESTAMP WITH TIME ZONE,
    client_rating INTEGER,
    coach_internal_rating INTEGER,
    compliance_expectation TEXT,
    followup_needed BOOLEAN DEFAULT FALSE,
    second_session_recommended BOOLEAN DEFAULT FALSE,
    recommendation_reason TEXT
);

-- 9. Followups
CREATE TABLE IF NOT EXISTS public.dawayir_session_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.dawayir_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status session_followup_status DEFAULT 'pending'::session_followup_status NOT NULL,
    client_reply TEXT,
    next_action TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daw_clients_email ON public.dawayir_clients(email);
CREATE INDEX IF NOT EXISTS idx_daw_reqs_client ON public.dawayir_session_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_daw_reqs_status ON public.dawayir_session_requests(status);
CREATE INDEX IF NOT EXISTS idx_daw_sess_req ON public.dawayir_sessions(request_id);

-- RLS setup (Secure by default, accessed mostly via Admin functions and Service Role for public forms)

ALTER TABLE public.dawayir_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_prep_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_ai_session_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dawayir_session_followups ENABLE ROW LEVEL SECURITY;

-- No public RLS policies out of the box to ensure data privacy.
-- App will use Service Role (Admin client) or edge RPCs to safely insert/read.
-- Or we create restricted insert-only policies if needed. For now, strictly enforced.
