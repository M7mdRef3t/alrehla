import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
    const envPath = join(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(readFileSync(envPath));
    for (const k in envConfig) { process.env[k] = envConfig[k]; }
} catch (e) { }

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkAndSeed() {
    console.log("🔍 [Seed] Checking Database State...");

    // 1. Ensure we have users with awareness vectors
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, email, awareness_vector');

    if (profileError) {
        console.error("❌ Failed to fetch profiles:", profileError);
        return;
    }

    console.log(`👤 Profiles found: ${profiles?.length || 0}`);

    for (const p of profiles || []) {
        if (!p.awareness_vector || Object.keys(p.awareness_vector).length <= 1) {
            console.log(`🧠 Seeding awareness_vector for ${p.email}...`);
            await supabase.from('profiles').update({
                awareness_vector: {
                    se: Math.random(),
                    cb: Math.random(),
                    bi: Math.random(),
                    av: Math.random(),
                    rs: Math.random(),
                    is_insulated: Math.random() > 0.3
                },
                sovereignty_score: Math.floor(Math.random() * 1000)
            }).eq('id', p.id);
        }
    }

    // 2. Clear old events to avoid confusion
    await supabase.from('system_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Seed a historical 'high_pressure' event
    console.log("⚡ Seeding a 'high_pressure' event for Phoenix analysis...");
    const { data: event, error: eventError } = await supabase.from('system_events').insert({
        event_name: 'CRUCIBLE_TEST_ALPHA',
        event_type: 'high_pressure',
        start_time: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        end_time: new Date(Date.now() - 3600000).toISOString(),      // 1 hour ago
        dda_override: 3,
        is_active: false,
        first_solver_id: profiles?.[0]?.id // Mark someone as Aegis Prime
    }).select().single();

    if (eventError) {
        console.error("❌ Failed to seed event:", eventError);
    } else {
        console.log("✅ Seeded event:", event.event_name, event.id);
    }
}

checkAndSeed();
