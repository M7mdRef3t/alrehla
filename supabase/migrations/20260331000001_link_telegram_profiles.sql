-- Migration: Add phone and telegram chat identity to profiles
-- Created At: 2026-03-31

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255);

-- Create an index to quickly lookup a profile by telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);
-- Create an index to quickly lookup a profile by phone number
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Also add an index to marketing leads on phone to ensure we can match numbers shared there easily
CREATE INDEX IF NOT EXISTS idx_marketing_leads_phone ON public.marketing_leads(phone);
