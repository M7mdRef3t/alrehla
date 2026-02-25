import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function archivePioneerResonance() {
    console.log("📦 [ResonanceArchive] Initializing T-Zero Data Capture...");

    // 1. Fetch current active resonance event
    const { data: activeEvent } = await supabase
        .from('system_events')
        .select('*')
        .eq('event_type', 'high_pressure')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

    if (!activeEvent) {
        console.error("❌ No high_pressure event found to archive.");
        return;
    }

    // 2. Capture Swarm Metrics at Impact
    const { data: metrics } = await supabase
        .from('swarm_resilience_metrics')
        .select('*')
        .single();

    // 3. Capture Detailed Pioneer Vectors
    const { data: pioneers } = await supabase
        .from('profiles')
        .select('id, awareness_vector, sovereignty_score')
        .order('sovereignty_score', { ascending: false });

    const archivePayload = {
        event_id: activeEvent.id,
        impact_timestamp: new Date().toISOString(),
        metrics: metrics,
        pioneers: pioneers,
        aegis_prime_id: activeEvent.first_solver_id
    };

    // 4. Store in Telemetry (or a dedicated archive table)
    const { error: archiveError } = await supabase.from("system_telemetry_logs").insert({
        service_name: "resonance-engine",
        action: "t_zero_impact_archive",
        payload: archivePayload,
        status: "success"
    });

    if (archiveError) {
        console.error("❌ Failed to archive impact data:", archiveError);
    } else {
        console.log("✅ [ResonanceArchive] T-Zero Snapshot secured. Swarm status logged for audit.");
        console.log(`📊 Insulated Pioneers: ${metrics?.insulated_count}/${metrics?.total_pioneers}`);
        console.log(`👑 Aegis Prime: ${activeEvent.first_solver_id || 'NONE'}`);
    }
}

archivePioneerResonance().catch(console.error);
