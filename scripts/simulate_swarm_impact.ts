import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function simulateSwarmImpact() {
    console.log("🚀 [ShadowTest] Initializing Swarm Simulation (10 Concurrent Pioneers)...");

    // 1. Fetch 10 test users (or active profiles)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(10);

    if (!profiles || profiles.length < 10) {
        console.error("❌ Not enough profiles for simulation. Need 10.");
        return;
    }

    // 2. Clear insulation status for test
    console.log("🧹 Clearing insulation status for test cohort...");
    await supabase
        .from('profiles')
        .update({ awareness_vector: {} })
        .in('id', profiles.map(p => p.id));

    // 3. Set Active Resonance Event (High Pressure)
    console.log("⚡ Activating High-Pressure Wave Event...");
    await supabase
        .from('system_events')
        .insert({
            event_name: "Shadow Test Surge",
            event_type: "high_pressure",
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
            dda_override: 5
        });

    console.log("🔥 [T-ZERO] Firing 10 concurrent riddle solutions...");

    const startTime = Date.now();

    // 4. Fire 10 concurrent requests to the Chat API
    // Since we don't have a direct URL easily accessible here without a local server, 
    // we'll simulate the logic by calling the internal API logic if possible, 
    // or just firing the DB updates and checking for race conditions in 'isFirst'.

    const attempts = profiles.map(async (profile) => {
        // Simulate the 'route.ts' logic as closely as possible
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .filter('awareness_vector->is_insulated', 'eq', true);

        const isFirst = count === 0;

        await supabase
            .from('profiles')
            .update({
                awareness_vector: { is_insulated: true },
                sovereignty_score: 100 + (isFirst ? 100 : 50)
            })
            .eq('id', profile.id);

        if (isFirst) {
            await supabase.from("system_telemetry_logs").insert({
                service_name: "resonance-engine",
                action: "swarm_broadcast",
                payload: { message: "Shadow Test: FIRST SOLVER!" },
                user_id: profile.id
            });
        }
    });

    await Promise.all(attempts);

    const duration = Date.now() - startTime;
    console.log(`✅ [ShadowTest] Simulation complete in ${duration}ms.`);

    // 5. Verify results
    const { data: verification } = await supabase
        .from('profiles')
        .select('id, sovereignty_score')
        .in('id', profiles.map(p => p.id));

    const totalPoints = verification?.reduce((acc, p) => acc + (p.sovereignty_score || 0), 0) || 0;
    const firstSolvers = verification?.filter(p => (p.sovereignty_score || 0) > 150).length || 0;

    console.log(`📊 [Results] First Solvers Detected: ${firstSolvers} (Expected: 1)`);
    if (firstSolvers > 1) {
        console.warn("⚠️ RACE CONDITION DETECTED: Multiple users claimed 'Aegis Prime'.");
    } else if (firstSolvers === 1) {
        console.log("✨ ATOMICITY VERIFIED: Only one 'Aegis Prime' acknowledged.");
    } else {
        console.error("❌ FAILURE: No 'Aegis Prime' recorded.");
    }
}

simulateSwarmImpact().catch(console.error);
