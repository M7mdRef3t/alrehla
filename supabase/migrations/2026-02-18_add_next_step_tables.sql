create table if not exists public.next_step_decisions (
  id text primary key,
  session_id text,
  phase text,
  risk_band text,
  source text,
  confidence numeric,
  action_type text,
  action_payload jsonb,
  feature_snapshot jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_next_step_decisions_session
  on public.next_step_decisions(session_id, created_at desc);

create table if not exists public.next_step_outcomes (
  id bigint generated always as identity primary key,
  decision_id text references public.next_step_decisions(id) on delete set null,
  acted boolean not null default false,
  completed boolean,
  pulse_delta numeric,
  time_to_action_sec numeric,
  reported_at timestamptz not null default now()
);

create index if not exists idx_next_step_outcomes_decision
  on public.next_step_outcomes(decision_id, reported_at desc);
