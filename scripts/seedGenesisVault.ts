/**
 * Genesis Vault Seeding Script
 * 
 * Goal: Bootstrap the Hive Wisdom Vault with high-quality synthetic trajectories
 * to ensure first-day users receive valid "Proven Paths".
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const GENESIS_TRAJECTORIES = [
    {
        title: "The Silent Sentinel (Stability Path)",
        summary: "Focus on emotional regulation and stoichiometric resilience.",
        vector: [0.8, 0.4, 0.9, 0.1, 0.6], // High RS, High BI, Low SE
        path: [
            { day: 1, task: "Morning grounding: 5 mins breathing with attention to physical weight." },
            { day: 2, task: "Digital isolation phase: No external feeds for first 60 mins." },
            { day: 3, task: "Sensory mapping: Identify 3 distinct environmental textures." }
        ]
    },
    {
        title: "The Velocity Breach (High Growth)",
        summary: "Aggressive expansion of cognitive bandwidth and objective tracking.",
        vector: [0.4, 0.9, 0.6, 0.3, 0.9], // High AV, High CB
        path: [
            { day: 1, task: "Audit primary focus leak: Identify your 'Entropy Sink'." },
            { day: 2, task: "Dual-tasking challenge: Complex reading + metronome sync." },
            { day: 3, task: "Systemic Review: Log 5 improvements to your daily protocol." }
        ]
    },
    {
        title: "The Shadow Integration (Recovery)",
        summary: "Converting chaotic entropy into structured self-awareness.",
        vector: [0.3, 0.3, 0.5, 0.8, 0.4], // High SE (Entropy) -> Transformation
        path: [
            { day: 1, task: "Acknowledge the Friction: Write down the top 3 irritants without judgment." },
            { day: 2, task: "Pattern Break: Eat one meal in total silence, no movement." },
            { day: 3, task: "The Rebuild: Define one boundary you will not cross today." }
        ]
    }
];

async function seedGenesisVault() {
    console.log("🌱 [Genesis Seeder] Awakening the Hive...");

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ [Genesis Seeder] Missing credentials.");
        return;
    }

    try {
        for (const trait of GENESIS_TRAJECTORIES) {
            // Note: In a real scenario, we'd use a vectorization service for the summary.
            // Here, we use the hardcoded seed vector.
            const { error } = await supabase
                .from('hive_wisdom_vault')
                .insert({
                    trajectory_id: `genesis_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    embedding: trait.vector,
                    sovereignty_score: 850, // All Genesis paths are Oracle-grade
                    trajectory_data: {
                        title: trait.title,
                        summary: trait.summary,
                        daily_missions: trait.path,
                        is_genesis: true,
                        rank: 'Oracle'
                    },
                    metadata: {
                        created_at: new Date().toISOString(),
                        version: 'Alpha-Zero'
                    }
                });

            if (error) {
                console.error(`❌ [Genesis Seeder] Failed to plant ${trait.title}:`, error.message);
            } else {
                console.log(`✅ [Genesis Seeder] Planted: ${trait.title}`);
            }
        }
        console.log("🚀 [Genesis Seeder] Swarm Vault Primed. Hive is now sentient.");
    } catch (err) {
        console.error("💥 [Genesis Seeder] Critical failure:", err);
    }
}

// Final Initialization for ESM
seedGenesisVault()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

export { seedGenesisVault };
