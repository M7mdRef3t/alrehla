-- Add name and phone to gate_sessions
ALTER TABLE public.gate_sessions
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Add index on phone for faster lookup in marketing automation
CREATE INDEX IF NOT EXISTS idx_gate_sessions_phone ON public.gate_sessions(phone);
