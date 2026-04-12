create or replace function public.mark_lead_whatsapp_sent(
  p_lead_id uuid,
  p_sent_at timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.marketing_leads
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'whatsapp_sent', true,
    'whatsapp_sent_at', p_sent_at
  ),
  updated_at = now()
  where id = p_lead_id;
$$;
