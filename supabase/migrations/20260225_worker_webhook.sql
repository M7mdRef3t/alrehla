-- worker_webhook.sql — تفعيل المحفز اللحظي للـ Worker ⚡
-- ========================================================
-- This script sets up the Database Webhook (Trigger) that 
-- pushes new events to the Supabase Edge Function.

-- 1. Enable the HTTP extension if not already enabled
create extension if not exists "http" with schema "extensions";

-- 2. Create the Trigger Function
create or replace function public.trigger_awareness_worker()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Note: The URL would be the actual function URL in production.
  -- In local/dev, many users use a project secret or direct URL.
  -- We use net_worker / http to POST the data.
  
  perform
    net.http_post(
      url := 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/functions/v1/awareness-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'awareness_events_queue',
        'record', row_to_json(new)
      )
    );

  return new;
end;
$$;

-- 3. Create the Trigger
drop trigger if exists on_awareness_event_insert on awareness_events_queue;
create trigger on_awareness_event_insert
after insert on awareness_events_queue
for each row
execute function public.trigger_awareness_worker();

-- 4. Help setup helper for project ref if not exists (Optional/Reference)
-- NOTE: In practice, project_ref and service_role_key are often set via
-- alter system set app.settings.project_ref = '...';
