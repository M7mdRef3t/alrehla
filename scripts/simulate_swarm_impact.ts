import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function simulateSwarmImpact() {
    const PEER_LIMIT = 50;
    console.log(`🚀 [Ghost Swarm] Initializing Swarm Simulation (${PEER_LIMIT} Concurrent Pioneers)...`);

    // 1. Fetch users
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(PEER_LIMIT);

    if (!profiles || profiles.length < PEER_LIMIT) {
        console.warn(`⚠️ Only found ${profiles?.length || 0} profiles. Proceeding with available cohort.`);
    }

    const cohort = profiles || [];

    // 2. Clear insulation status for test
    console.log(`🧹 Clearing cohort status (${cohort.length} users)...`);
    await supabase
        .from('profiles')
        .update({ awareness_vector: {} })
        .in('id', cohort.map(p => p.id));

    // 3. Set Active Resonance Event (High Pressure Surge)
    console.log("🔥 Activating High Pressure Surge Event...");
    const { data: event, error: eventError } = await supabase
        .from('system_events')
        .insert({
            event_name: "Ghost Swarm Stress Test",
            event_type: "high_pressure",
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            dda_override: 5
        })
        .select()
        .single();

    if (eventError || !event) {
        console.error("❌ Failed to create stress test event:", eventError?.message);
        return;
    }

    const EVENT_ID = event.id;

    console.log(`⚡ [H-HOUR] Firing ${cohort.length} concurrent Evaluator requests for Event ${EVENT_ID}...`);

    const startTime = Date.now();

    // 4. Fire concurrent requests (Simulating Evaluator Gate)
    const attempts = cohort.map(async (profile, index) => {
        // Small stagger to simulate real network jitter (0-500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

        // Attempt Atomic Claim - Matching RPC signature: claim_aegis_prime(p_user_id, p_event_id)
        const { data: isFirst, error } = await supabase.rpc('claim_aegis_prime', {
            p_user_id: profile.id,
            p_event_id: EVENT_ID
        });

        if (error) {
            console.error(`❌ [Swarm] Error for user ${profile.id}:`, error.message);
            return;
        }

        if (isFirst) {
            console.log(`✨ [Aegis Prime] User ${profile.id} captured the resonance first!`);
        }
    });

    await Promise.all(attempts);

    const duration = Date.now() - startTime;
    console.log(`✅ [Ghost Swarm] Simulation complete in ${duration}ms.`);
    console.log(`📈 Average latency: ${(duration / cohort.length).toFixed(2)}ms per request.`);

    // 5. Audit Results
    const { data: winners } = await supabase
        .from('system_telemetry_logs')
        .select('*')
        .eq('action', 'claim_aegis_prime')
        .gt('created_at', new Date(startTime).toISOString());

    console.log(`📊 [Results] Atomic Claims recorded: ${winners?.length || 0}`);
    if ((winners?.length || 0) > 1) {
        console.warn("⚠️ RACE CONDITION DETECTED: Atomic lock failed.");
    } else if (winners?.length === 1) {
        console.log("🛡️ INTEGRITY VERIFIED: Single point of entry confirmed.");
    }
}

simulateSwarmImpact().catch(console.error);
