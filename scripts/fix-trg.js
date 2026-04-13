const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    CREATE OR REPLACE FUNCTION public.trg_link_lead_identity_logic()
    RETURNS TRIGGER AS $$
    DECLARE
        v_target_user_id UUID;
    BEGIN
        SELECT id::uuid INTO v_target_user_id FROM public.profiles WHERE email = NEW.email LIMIT 1;
        IF v_target_user_id IS NOT NULL AND NEW.anonymous_id IS NOT NULL THEN
            -- Directly assign the user_id (since this is a BEFORE trigger)
            NEW.user_id := v_target_user_id;
            NEW.last_linked_at := now();
            
            -- Only bridge routing events, do NOT call link_identity_v2 to avoid loop/tuple error
            UPDATE public.routing_events 
            SET user_id = v_target_user_id
            WHERE anonymous_id = NEW.anonymous_id 
              AND user_id IS NULL;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
}).then(res => {
  console.log("Trigger replaced successfully!");
  client.end();
}).catch(console.error);
