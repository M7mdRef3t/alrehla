/* Decoupled Tracking Architecture (High-Fidelity Internal Analytics)
   Goal: Unified identity management and ingestion idempotency for routing_events. */

/* 1. Ensure Table Structure Harmony */
ALTER TABLE public.routing_events
  ADD COLUMN IF NOT EXISTS anonymous_id text,
  ADD COLUMN IF NOT EXISTS client_event_id text;

/* 2. Enforce Idempotency (Server-Side)
   Prevents duplicate events from network retries/retries during keepalive/beacons. */
CREATE UNIQUE INDEX IF NOT EXISTS routing_events_client_event_id_uidx
  ON public.routing_events (client_event_id)
  WHERE client_event_id IS NOT NULL;

/* 3. Standardize Naming & Redundant Index Cleanup
   Consolidates indices from base migrations to improve write performance.

   Event Type Index (Standardize Naming) */
DROP INDEX IF EXISTS public.routing_events_type_idx; /* Old redundant name from 20260221 */
CREATE INDEX IF NOT EXISTS routing_events_event_type_occurred_at_idx
  ON public.routing_events (event_type, occurred_at desc);

/* Session Tracking Index (Standardize Naming) */
DROP INDEX IF EXISTS public.routing_events_session_idx; /* Old redundant name from 20260221 */
CREATE INDEX IF NOT EXISTS routing_events_session_id_idx
  ON public.routing_events (session_id, occurred_at desc);

/* High-Fidelity Anonymous Identity Index */
CREATE INDEX IF NOT EXISTS routing_events_anonymous_id_idx
  ON public.routing_events (anonymous_id);

COMMENT ON TABLE public.routing_events IS 'The unified, auth-agnostic source of truth for all decoupled behavioral and attribution events.';
