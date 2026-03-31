-- Migration: Create telegram chat history tracking
-- Created At: 2026-03-31

CREATE TABLE IF NOT EXISTS public.telegram_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices for fast retrieval of latest messages per chat
CREATE INDEX IF NOT EXISTS idx_telegram_chat_history_chat_id ON public.telegram_chat_history(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chat_history_created_at ON public.telegram_chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.telegram_chat_history ENABLE ROW LEVEL SECURITY;

-- Allow inserts via service role / backend
CREATE POLICY "Allow service role full access on telegram_chat_history"
ON public.telegram_chat_history
FOR ALL
USING (true)
WITH CHECK (true);
