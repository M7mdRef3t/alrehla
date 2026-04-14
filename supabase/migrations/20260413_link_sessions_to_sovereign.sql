-- Step 1: Add user_id to link sessions with registered travelers
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Add flag to track if sovereign context was used in AI Analysis
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_sovereign_captured BOOLEAN DEFAULT false;

-- Step 3: Create index for faster lookups between sessions and users
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);

-- Step 4: Add comment for historical context
COMMENT ON COLUMN public.sessions.user_id IS 'The Sovereign Identity link to a Registered Traveler.';
COMMENT ON COLUMN public.sessions.is_sovereign_captured IS 'Indicates if the AI analysis utilized the Traveler Sovereign Profile (Journey Map).';
