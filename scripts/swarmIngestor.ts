/**
 * The Swarm Ingestor Agent (External Oracle Sensor)
 * 
 * Target: Periodic execution (e.g. GitHub Actions, Vercel Cron).
 * Mission: Ping external telemetry sources (Simulated News/Sentiment aggregates)
 * to update the 'external_signals' table and influence global swarm momentum.
 */

import { createClient } from '@supabase/supabase-js';

// Setup Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * SIMULATED EXTERNAL ORACLE FEED
 * In production, this would fetch from:
 * - GDELT (Project for Global Database of Events, Language, and Tone)
 * - Sentiment Analysis of Twitter/X trends in specific locales
 * - Economic Stress Indicators (Inflation/Market Volatility)
 */
const MOCK_ORACLE_FEED = [
    {
        source: 'global_sentiment_index',
        type: 'sentiment',
        label: 'Ambient Swarm Synchronicity',
        value: 0.65, // Positive/Peaceful bias
        weight: 1.2
    },
    {
        source: 'macro_stressor_feed',
        type: 'tension',
        label: 'Cognitive Friction: High Volatility',
        value: 0.78, // High pressure/tension
        weight: 1.5
    },
    {
        source: 'collective_momentum_sync',
        type: 'momentum',
        label: 'Social Resonance Flow',
        value: 0.45, // Slightly lagging momentum
        weight: 1.0
    }
];

async function ingestSwarmSignals() {
    console.log("📡 [Swarm Ingestor] Probing External Oracle layers...");

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ [Swarm Ingestor] Critical: Supabase credentials missing from environment.");
        return;
    }

    try {
        const signals = MOCK_ORACLE_FEED;
        console.log(`🧠 [Swarm Ingestor] Indexing ${signals.length} environmental signals.`);

        for (const signal of signals) {
            const { error } = await supabase
                .from('external_signals')
                .insert({
                    source: signal.source,
                    type: signal.type,
                    label: signal.label,
                    value: signal.value,
                    weight: signal.weight,
                    metadata: {
                        ingested_at: new Date().toISOString(),
                        simulation: true
                    }
                });

            if (error) {
                console.error(`❌ [Swarm Ingestor] Failed to ingest ${signal.source}:`, error.message);
            } else {
                console.log(`✅ [Swarm Ingestor] Ingested: ${signal.label} (Value: ${signal.value})`);
            }
        }

        console.log("🚀 [Swarm Ingestor] Swarm Ingestion Layer synchronized with Supabase.");
    } catch (error) {
        console.error("💥 [Swarm Ingestor] System failure during ingestion:", error);
    }
}

// Execute if run directly
if (require.main === module) {
    ingestSwarmSignals();
}

export { ingestSwarmSignals };
