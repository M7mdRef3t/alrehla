-- Migration: Reconcile WhatsApp schema mismatch (2024 vs 2026)
-- Goal: Ensure columns match what whatsappAutomationService.ts expects

DO $$
BEGIN
    -- Rename columns if they exist under old names
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='phone_normalized') THEN
        ALTER TABLE public.whatsapp_message_events RENAME COLUMN phone_normalized TO from_phone;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='message_text') THEN
        ALTER TABLE public.whatsapp_message_events RENAME COLUMN message_text TO message_body;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='intent') THEN
        ALTER TABLE public.whatsapp_message_events RENAME COLUMN intent TO intent_detected;
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='to_phone') THEN
        ALTER TABLE public.whatsapp_message_events ADD COLUMN to_phone TEXT DEFAULT 'system';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='whatsapp_message_id') THEN
        ALTER TABLE public.whatsapp_message_events ADD COLUMN whatsapp_message_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='processed_at') THEN
        ALTER TABLE public.whatsapp_message_events ADD COLUMN processed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='message_type') THEN
        ALTER TABLE public.whatsapp_message_events ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;
    
    -- Drop old column if it was redundant
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_message_events' AND column_name='phone') THEN
        ALTER TABLE public.whatsapp_message_events DROP COLUMN phone;
    END IF;

END $$;
