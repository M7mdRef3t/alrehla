-- Genesis Seed: Create the first High-Pressure system event to activate the Phoenix Engine
-- This ensures the pioneer_report_card materialized view has data to join against.

INSERT INTO public.system_events (
    event_name,
    event_type,
    start_time,
    end_time,
    dda_override,
    is_active
) VALUES (
    'Genesis Impact: The First Wave',
    'high_pressure',
    NOW() - INTERVAL '24 hours',
    NOW() + INTERVAL '48 hours',
    3,
    true
) ON CONFLICT DO NOTHING;

-- Refresh the materialized view to reflect the new event data
SELECT public.refresh_pioneer_report_card_mv();

COMMENT ON TABLE public.system_events IS 'Seeded with Genesis Impact to activate post-impact reporting via pioneer_report_card.';
