-- Impact Engine: Quantifying behavioral change
alter table public.micro_actions 
    add column if not exists baseline_mood smallint,
    add column if not exists baseline_energy smallint,
    add column if not exists followup_mood smallint,
    add column if not exists followup_energy smallint,
    add column if not exists impact_score numeric(4,2);

-- Index for the engine to find pending followups
create index if not exists micro_actions_pending_followup_idx 
    on public.micro_actions (user_id, followup_mood) 
    where (followup_mood is null);
