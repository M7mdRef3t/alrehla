-- Migrations for WhatsApp Auto Capture V1

-- Table: whatsapp_message_events
-- Purpose: Logs all incoming and outgoing WhatsApp messages for audit and automation.
CREATE TABLE IF NOT EXISTS public.whatsapp_message_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    phone TEXT NOT NULL,
    phone_normalized TEXT,
    message_text TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    lead_id UUID REFERENCES public.marketing_leads(id) ON DELETE SET NULL,
    intent TEXT,
    status_assigned TEXT,
    raw_payload JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_phone ON public.whatsapp_message_events(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_lead ON public.whatsapp_message_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_created ON public.whatsapp_message_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_message_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access (adjust policy as per existing RBAC)
CREATE POLICY "Admins can do everything on whatsapp_message_events"
ON public.whatsapp_message_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'owner' OR profiles.role = 'superadmin')
  )
);

-- Comments for documentation
COMMENT ON TABLE public.whatsapp_message_events IS 'Logs of WhatsApp messages for lead automation.';
COMMENT ON COLUMN public.whatsapp_message_events.intent IS 'The intent detected by the automation engine.';
