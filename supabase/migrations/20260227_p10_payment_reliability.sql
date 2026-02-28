-- Phase 10: Payment reliability + atomic scarcity seats + webhook dedupe
-- - Makes scarcity seats truly atomic via DB row locking
-- - Adds webhook idempotency receipts to prevent duplicate processing
-- - Adds server-side seat reserve/release/activate RPCs

BEGIN;

CREATE TABLE IF NOT EXISTS public.cohort_seats (
  cohort_key text PRIMARY KEY,
  total_seats integer NOT NULL CHECK (total_seats > 0),
  reserved_seats integer NOT NULL DEFAULT 0 CHECK (reserved_seats >= 0),
  is_live boolean NOT NULL DEFAULT true,
  closes_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cohort_seats (cohort_key, total_seats, reserved_seats, is_live)
VALUES ('founding_v1', 50, 0, true)
ON CONFLICT (cohort_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cohort_seat_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_key text NOT NULL REFERENCES public.cohort_seats(cohort_key) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'activated', 'released')),
  provider text NULL,
  payment_ref text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz NULL,
  released_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_seat_reservations_status
  ON public.cohort_seat_reservations (cohort_key, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_event_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  user_id text NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  checkout_session_id text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cohort_seats_touch_updated_at ON public.cohort_seats;
CREATE TRIGGER trg_cohort_seats_touch_updated_at
BEFORE UPDATE ON public.cohort_seats
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_cohort_seat_reservations_touch_updated_at ON public.cohort_seat_reservations;
CREATE TRIGGER trg_cohort_seat_reservations_touch_updated_at
BEFORE UPDATE ON public.cohort_seat_reservations
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.register_payment_webhook_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_user_id text DEFAULT NULL,
  p_checkout_session_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_provider IS NULL OR btrim(p_provider) = '' THEN
    RAISE EXCEPTION 'provider is required' USING ERRCODE = '22023';
  END IF;
  IF p_provider_event_id IS NULL OR btrim(p_provider_event_id) = '' THEN
    RAISE EXCEPTION 'provider_event_id is required' USING ERRCODE = '22023';
  END IF;
  IF p_event_type IS NULL OR btrim(p_event_type) = '' THEN
    RAISE EXCEPTION 'event_type is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.payment_event_receipts (
    provider,
    provider_event_id,
    event_type,
    user_id,
    checkout_session_id,
    metadata
  )
  VALUES (
    lower(btrim(p_provider)),
    btrim(p_provider_event_id),
    btrim(p_event_type),
    NULLIF(btrim(COALESCE(p_user_id, '')), ''),
    NULLIF(btrim(COALESCE(p_checkout_session_id, '')), ''),
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (provider, provider_event_id) DO NOTHING;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_founding_cohort_seat(
  p_user_id text,
  p_provider text DEFAULT 'stripe',
  p_checkout_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort public.cohort_seats%ROWTYPE;
  v_reservation_id uuid;
  v_status text;
  v_seats_left integer;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cohort
  FROM public.cohort_seats
  WHERE cohort_key = 'founding_v1'
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.cohort_seats (cohort_key, total_seats, reserved_seats, is_live)
    VALUES ('founding_v1', 50, 0, true)
    RETURNING * INTO v_cohort;
  END IF;

  SELECT id, status
  INTO v_reservation_id, v_status
  FROM public.cohort_seat_reservations
  WHERE cohort_key = 'founding_v1'
    AND user_id = btrim(p_user_id)
  FOR UPDATE;

  IF v_status IN ('reserved', 'activated') THEN
    v_seats_left := GREATEST(v_cohort.total_seats - v_cohort.reserved_seats, 0);
    RETURN jsonb_build_object(
      'reserved', true,
      'already_reserved', true,
      'status', v_status,
      'seats_left', v_seats_left,
      'total_seats', v_cohort.total_seats,
      'is_live', v_cohort.is_live
    );
  END IF;

  IF NOT v_cohort.is_live THEN
    RETURN jsonb_build_object(
      'reserved', false,
      'reason', 'cohort_closed',
      'seats_left', GREATEST(v_cohort.total_seats - v_cohort.reserved_seats, 0),
      'total_seats', v_cohort.total_seats,
      'is_live', v_cohort.is_live
    );
  END IF;

  IF v_cohort.reserved_seats >= v_cohort.total_seats THEN
    RETURN jsonb_build_object(
      'reserved', false,
      'reason', 'sold_out',
      'seats_left', 0,
      'total_seats', v_cohort.total_seats,
      'is_live', v_cohort.is_live
    );
  END IF;

  IF v_reservation_id IS NULL THEN
    INSERT INTO public.cohort_seat_reservations (
      cohort_key,
      user_id,
      status,
      provider,
      payment_ref,
      metadata,
      reserved_at,
      released_at
    )
    VALUES (
      'founding_v1',
      btrim(p_user_id),
      'reserved',
      NULLIF(btrim(COALESCE(p_provider, '')), ''),
      NULLIF(btrim(COALESCE(p_checkout_session_id, '')), ''),
      jsonb_build_object('reserved_via', 'checkout_session'),
      now(),
      NULL
    );
  ELSE
    UPDATE public.cohort_seat_reservations
    SET status = 'reserved',
        provider = COALESCE(NULLIF(btrim(COALESCE(p_provider, '')), ''), provider),
        payment_ref = COALESCE(NULLIF(btrim(COALESCE(p_checkout_session_id, '')), ''), payment_ref),
        reserved_at = now(),
        activated_at = NULL,
        released_at = NULL,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('re_reserved_at', now())
    WHERE id = v_reservation_id;
  END IF;

  UPDATE public.cohort_seats
  SET reserved_seats = reserved_seats + 1
  WHERE cohort_key = 'founding_v1'
  RETURNING * INTO v_cohort;

  v_seats_left := GREATEST(v_cohort.total_seats - v_cohort.reserved_seats, 0);

  RETURN jsonb_build_object(
    'reserved', true,
    'already_reserved', false,
    'status', 'reserved',
    'seats_left', v_seats_left,
    'total_seats', v_cohort.total_seats,
    'is_live', v_cohort.is_live
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_founding_cohort_seat(
  p_user_id text,
  p_reason text DEFAULT 'payment_failed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort public.cohort_seats%ROWTYPE;
  v_reservation_id uuid;
  v_status text;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RETURN jsonb_build_object('released', false, 'reason', 'missing_user');
  END IF;

  SELECT * INTO v_cohort
  FROM public.cohort_seats
  WHERE cohort_key = 'founding_v1'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('released', false, 'reason', 'cohort_missing');
  END IF;

  SELECT id, status
  INTO v_reservation_id, v_status
  FROM public.cohort_seat_reservations
  WHERE cohort_key = 'founding_v1'
    AND user_id = btrim(p_user_id)
  FOR UPDATE;

  IF v_reservation_id IS NULL THEN
    RETURN jsonb_build_object('released', false, 'reason', 'no_reservation');
  END IF;

  IF v_status = 'activated' THEN
    RETURN jsonb_build_object('released', false, 'reason', 'already_activated');
  END IF;

  IF v_status = 'released' THEN
    RETURN jsonb_build_object('released', true, 'already_released', true);
  END IF;

  UPDATE public.cohort_seat_reservations
  SET status = 'released',
      released_at = now(),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('release_reason', COALESCE(NULLIF(btrim(p_reason), ''), 'unspecified'))
  WHERE id = v_reservation_id;

  UPDATE public.cohort_seats
  SET reserved_seats = GREATEST(reserved_seats - 1, 0)
  WHERE cohort_key = 'founding_v1';

  RETURN jsonb_build_object(
    'released', true,
    'reason', COALESCE(NULLIF(btrim(p_reason), ''), 'unspecified')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_founding_cohort_seat(
  p_user_id text,
  p_provider text DEFAULT 'stripe',
  p_payment_ref text DEFAULT NULL,
  p_token_amount integer DEFAULT 100,
  p_journey_days integer DEFAULT 21
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort public.cohort_seats%ROWTYPE;
  v_reservation_id uuid;
  v_status text;
  v_seats_left integer;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cohort
  FROM public.cohort_seats
  WHERE cohort_key = 'founding_v1'
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.cohort_seats (cohort_key, total_seats, reserved_seats, is_live)
    VALUES ('founding_v1', 50, 0, true)
    RETURNING * INTO v_cohort;
  END IF;

  SELECT id, status
  INTO v_reservation_id, v_status
  FROM public.cohort_seat_reservations
  WHERE cohort_key = 'founding_v1'
    AND user_id = btrim(p_user_id)
  FOR UPDATE;

  IF v_status = 'activated' THEN
    UPDATE public.profiles
    SET awareness_tokens = GREATEST(COALESCE(awareness_tokens, 0), GREATEST(COALESCE(p_token_amount, 100), 1)),
        journey_expires_at = GREATEST(
          COALESCE(journey_expires_at, now()),
          now() + make_interval(days => GREATEST(COALESCE(p_journey_days, 21), 1))
        )
    WHERE id = btrim(p_user_id);

    v_seats_left := GREATEST(v_cohort.total_seats - v_cohort.reserved_seats, 0);
    RETURN jsonb_build_object(
      'activated', true,
      'already_activated', true,
      'seats_left', v_seats_left,
      'total_seats', v_cohort.total_seats
    );
  END IF;

  IF v_status IS NULL OR v_status = 'released' THEN
    IF v_cohort.reserved_seats >= v_cohort.total_seats THEN
      RETURN jsonb_build_object(
        'activated', false,
        'reason', 'sold_out',
        'seats_left', 0,
        'total_seats', v_cohort.total_seats
      );
    END IF;

    IF v_reservation_id IS NULL THEN
      INSERT INTO public.cohort_seat_reservations (
        cohort_key,
        user_id,
        status,
        provider,
        payment_ref,
        metadata,
        activated_at,
        released_at
      )
      VALUES (
        'founding_v1',
        btrim(p_user_id),
        'activated',
        NULLIF(btrim(COALESCE(p_provider, '')), ''),
        NULLIF(btrim(COALESCE(p_payment_ref, '')), ''),
        jsonb_build_object('activated_via', 'payment_webhook'),
        now(),
        NULL
      );
    ELSE
      UPDATE public.cohort_seat_reservations
      SET status = 'activated',
          provider = COALESCE(NULLIF(btrim(COALESCE(p_provider, '')), ''), provider),
          payment_ref = COALESCE(NULLIF(btrim(COALESCE(p_payment_ref, '')), ''), payment_ref),
          activated_at = now(),
          released_at = NULL,
          metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('activated_from_released', now())
      WHERE id = v_reservation_id;
    END IF;

    UPDATE public.cohort_seats
    SET reserved_seats = reserved_seats + 1
    WHERE cohort_key = 'founding_v1'
    RETURNING * INTO v_cohort;
  ELSE
    UPDATE public.cohort_seat_reservations
    SET status = 'activated',
        provider = COALESCE(NULLIF(btrim(COALESCE(p_provider, '')), ''), provider),
        payment_ref = COALESCE(NULLIF(btrim(COALESCE(p_payment_ref, '')), ''), payment_ref),
        activated_at = COALESCE(activated_at, now()),
        released_at = NULL,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('activated_from_reserved', now())
    WHERE id = v_reservation_id;
  END IF;

  UPDATE public.profiles
  SET awareness_tokens = GREATEST(COALESCE(awareness_tokens, 0), GREATEST(COALESCE(p_token_amount, 100), 1)),
      journey_expires_at = GREATEST(
        COALESCE(journey_expires_at, now()),
        now() + make_interval(days => GREATEST(COALESCE(p_journey_days, 21), 1))
      )
  WHERE id = btrim(p_user_id);

  v_seats_left := GREATEST(v_cohort.total_seats - v_cohort.reserved_seats, 0);
  RETURN jsonb_build_object(
    'activated', true,
    'already_activated', false,
    'seats_left', v_seats_left,
    'total_seats', v_cohort.total_seats
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_founding_cohort_scarcity()
RETURNS TABLE (
  total_seats integer,
  seats_left integer,
  reserved_seats integer,
  active_premium integer,
  closes_at timestamptz,
  is_live boolean,
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 50;
  v_reserved integer := 0;
  v_is_live boolean := false;
  v_closes_at timestamptz := NULL;
  v_active integer := 0;
BEGIN
  SELECT c.total_seats, c.reserved_seats, c.is_live, c.closes_at
  INTO v_total, v_reserved, v_is_live, v_closes_at
  FROM public.cohort_seats c
  WHERE c.cohort_key = 'founding_v1';

  SELECT COUNT(*)
  INTO v_active
  FROM public.cohort_seat_reservations r
  WHERE r.cohort_key = 'founding_v1'
    AND r.status = 'activated';

  RETURN QUERY
  SELECT
    v_total,
    GREATEST(v_total - v_reserved, 0),
    v_reserved,
    v_active,
    v_closes_at,
    v_is_live,
    'cohort_seats';
END;
$$;

REVOKE ALL ON FUNCTION public.register_payment_webhook_event(text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_founding_cohort_seat(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_founding_cohort_seat(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_founding_cohort_seat(text, text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_founding_cohort_scarcity() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.register_payment_webhook_event(text, text, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_founding_cohort_seat(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_founding_cohort_seat(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_founding_cohort_seat(text, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_founding_cohort_scarcity() TO anon, authenticated, service_role;

ALTER TABLE public.cohort_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_seat_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_event_receipts ENABLE ROW LEVEL SECURITY;

COMMIT;
