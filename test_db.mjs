import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('routing_events').insert({
    event_type: "test",
    client_event_id: "test_" + Date.now(),
    payload: { test: true }
  }).select();
  console.log("INSERT RESULT:", JSON.stringify({ data, error }));
}

test();
