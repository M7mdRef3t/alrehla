-- Create a function to call the biometric-stress-alert edge function
create or replace function public.handle_biometric_stress_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.stress_level > 70) then
    perform
      net.http_post(
        url := 'https://acvcnktpsbayowhurcmn.supabase.co/functions/v1/biometric-stress-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true) -- Placeholder: User should set this in Vault or hardcode if safe
        ),
        body := jsonb_build_object('record', row_to_json(NEW))
      );
  end if;
  return NEW;
end;
$$;

-- Create the trigger
drop trigger if exists on_biometric_stress_spike on public.user_biometrics;
create trigger on_biometric_stress_spike
  after insert on public.user_biometrics
  for each row execute function public.handle_biometric_stress_alert();
