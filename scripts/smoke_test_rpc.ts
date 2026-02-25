import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function smokeTest() {
    console.log("🔥 Running Single Execution Smoke Test for claim_aegis_prime RPC...");

    // 1. Get/Create a dummy event
    const { data: event, error: eventErr } = await supabase
        .from('system_events')
        .insert({
            event_name: 'Smoke Test Event',
            event_type: 'high_pressure',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            dda_override: 5
        })
        .select('id')
        .single();

    if (eventErr) {
        console.error("❌ Failed to create event:", eventErr);
        return;
    }

    // 2. Get a dummy user
    const { data: user } = await supabase.from('profiles').select('id').limit(1).single();

    if (!user) {
        console.error("❌ No users found for smoke test.");
        return;
    }

    // 3. Call the RPC
    console.log(`📡 Calling RPC for user ${user.id} and event ${event.id}...`);
    const { data: result, error: rpcErr } = await supabase.rpc('claim_aegis_prime', {
        p_user_id: user.id,
        p_event_id: event.id
    });

    if (rpcErr) {
        console.error("❌ RPC Failed:", rpcErr);
    } else {
        console.log(`✅ RPC Success! Claim Result: ${result}`);

        // 4. Verify atomicity (second call should return false)
        const { data: result2 } = await supabase.rpc('claim_aegis_prime', {
            p_user_id: user.id,
            p_event_id: event.id
        });
        console.log(`✅ Second Call Result: ${result2} (Should be false)`);
    }

    // Cleanup
    await supabase.from('system_events').delete().eq('id', event.id);
}

smokeTest();
