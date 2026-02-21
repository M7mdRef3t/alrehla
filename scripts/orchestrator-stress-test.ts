/**
 * AI Orchestrator Stress Test (The Crucible)
 * 
 * Objective: Simulate a sudden surge of 500 concurrent users hitting the Dawayir platform 
 * to ensure the Meta-Orchestrator resolves routes efficiently without overwhelming Supabase 
 * or triggering unnecessary AI API rate limits.
 */

import { AIOrchestrator } from '../src/services/aiOrchestrator';

const CONCURRENT_USERS = 500;
const TEST_FEATURE = 'predictive_oracle';

async function simulateSurge() {
    console.log(`🚀 [Stress Test] Initiating surge: ${CONCURRENT_USERS} concurrent requests for '${TEST_FEATURE}'...`);
    const startTime = Date.now();

    // Create an array of promises simulating simultaneous incoming requests
    const requests = Array.from({ length: CONCURRENT_USERS }).map(async (_, index) => {
        try {
            // In a real scenario, this would be a full API request. 
            // Here, we stress the Database/Orchestrator layer.
            const route = await AIOrchestrator.getRouteForFeature(TEST_FEATURE);
            return { index, success: true, route };
        } catch (error) {
            return { index, success: false, error };
        }
    });

    // Fire all requests simultaneously
    const results = await Promise.all(requests);
    const endTime = Date.now();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const durationMs = endTime - startTime;

    console.log(`\n📊 [Stress Test Results]`);
    console.log(`⏱️  Total Duration: ${durationMs}ms`);
    console.log(`✅  Successful Resolutions: ${successful}`);
    console.log(`❌  Failed Resolutions: ${failed}`);

    if (failed > 0) {
        console.error(`⚠️  WARNING: The Orchestrator dropped ${failed} connections. Consider adding caching (Redis) or connection pooling.`);
    } else {
        console.log(`🛡️  SYSTEM ROBUST: The Orchestrator successfully handled the surge. Average resolution time: ${(durationMs / CONCURRENT_USERS).toFixed(2)}ms per request.`);
    }

    // Check distribution if we had logic to flip models under load (future iteration)
    const routesUsed = new Set(results.filter(r => r.success).map(r => r.route));
    console.log(`🔀  Routes utilized during surge:`, Array.from(routesUsed));
}

// Execute the test
if (require.main === module) {
    simulateSurge().then(() => process.exit(0)).catch(err => {
        console.error("Test failed to run:", err);
        process.exit(1);
    });
}
