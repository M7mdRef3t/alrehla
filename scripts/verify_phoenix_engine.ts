import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
try {
    const envPath = join(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error("⚠️ Could not load .env.local, falling back to process.env");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCrucibleTest() {
    console.log("🔥 [Crucible Test] Initializing Phoenix Engine Audit...");

    // 1. Check Pioneer Report Card
    console.log("\n📊 1. Querying Pioneer Report Card (Top 5)...");
    const { data: reportCards, error: reportError } = await supabase
        .from('pioneer_report_card')
        .select('*')
        .order('phoenix_score', { ascending: false })
        .limit(5);

    if (reportError) {
        console.error("❌ Error fetching report cards:", reportError);
    } else if (!reportCards || reportCards.length === 0) {
        console.log("⚠️ No report cards found. Ensure 'archive_pioneer_resonance' ran AND there are pioneers in the DB.");
    } else {
        console.table(reportCards.map(c => ({
            Email: c.email,
            'Aegis Prime': c.is_aegis_prime,
            'Reaction Spd': c.reaction_speed,
            'CB Resilience': c.cb_resilience,
            'Growth': c.post_event_growth,
            'Phoenix Score': c.phoenix_score
        })));

        // 2. Test Synchronicity Pairing RPC
        console.log("\n🔗 2. Testing 'find_resonance_partner' RPC for top pioneer...");
        const topPioneerId = reportCards[0].user_id;
        
        const { data: partner, error: rpcError } = await supabase
            .rpc('find_resonance_partner', { p_user_id: topPioneerId });

        if (rpcError) {
            console.error("❌ Error finding resonance partner:", rpcError);
        } else if (!partner || partner.length === 0) {
            console.log(`⚠️ No complementary partner found for ${topPioneerId}. Needs at least 2 users with awareness vectors.`);
        } else {
            console.log(`✨ Found Partner for ${topPioneerId}:`);
            console.table(partner);
        }
    }
}

runCrucibleTest();
