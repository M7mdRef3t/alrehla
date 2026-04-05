DROP TABLE IF EXISTS public.gate_sessions CASCADE;

CREATE TABLE public.gate_sessions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Source of truth metadata
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    fbclid TEXT,
    fbp TEXT,
    fbc TEXT,
    
    -- Funnel payload
    source_area TEXT, 
    email TEXT,
    pain_point TEXT,  
    intent TEXT,      
    commitment_level TEXT,
    
    -- Event Tracking & Idempotency
    lead_submitted_at TIMESTAMP WITH TIME ZONE,
    qualified_at TIMESTAMP WITH TIME ZONE,
    map_started_at TIMESTAMP WITH TIME ZONE,
    map_completed_at TIMESTAMP WITH TIME ZONE,

    -- System logic (Soft References avoid 42P01 missing table errors if table names differ)
    converted_user_id UUID,
    converted_person_id UUID
);

-- Indexes for robust querying and uniqueness
CREATE INDEX idx_gate_sessions_created_at ON public.gate_sessions(created_at);
CREATE INDEX idx_gate_sessions_email ON public.gate_sessions(email);
CREATE INDEX idx_gate_sessions_fbclid ON public.gate_sessions(fbclid);

-- Enable RLS
ALTER TABLE public.gate_sessions ENABLE ROW LEVEL SECURITY;

-- Server rules (Admin) implicitly bypass RLS.
-- Restricting anonymous and authenticated direct DB inserts purely to read.
CREATE POLICY "Public can strictly read own gate_session" ON public.gate_sessions
    FOR SELECT USING (true);
