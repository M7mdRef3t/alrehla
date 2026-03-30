-- Create WhatsApp message events table for logging and automation
CREATE TABLE IF NOT EXISTS public.whatsapp_message_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.marketing_leads(id) ON DELETE SET NULL,
    whatsapp_message_id TEXT,
    from_phone TEXT NOT NULL,
    to_phone TEXT NOT NULL,
    message_body TEXT,
    message_type TEXT DEFAULT 'text',
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    raw_payload JSONB,
    processed_at TIMESTAMPTZ,
    intent_detected TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_from_phone ON public.whatsapp_message_events(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_lead_id ON public.whatsapp_message_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_created_at ON public.whatsapp_message_events(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.whatsapp_message_events ENABLE ROW LEVEL SECURITY;

-- Only owner and superadmin can view logs
CREATE POLICY "owner_superadmin_view_whatsapp_events" ON public.whatsapp_message_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'owner' OR profiles.role = 'superadmin')
        )
    );

-- System can insert (via service role)
CREATE POLICY "service_role_insert_whatsapp_events" ON public.whatsapp_message_events
    FOR INSERT
    WITH CHECK (true);
