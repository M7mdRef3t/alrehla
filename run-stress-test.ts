import { TacticalSimulator } from "./src/ai/orchestrator/Simulator";

/**
 * Phase 7 Stress Test Runner
 * This script triggers the Direct API DDOS attack to verify the TTL mutex.
 */
async function main() {
    const mockUserId = "test-user-concurrency-001";
    console.warn("Starting Stress Test: Direct API DDOS");

    try {
        await TacticalSimulator.runDirectAPIDDOS(mockUserId);
        console.warn("Stress test requests dispatched.");
    } catch (error) {
        console.error("Failed to dispatch stress test:", error);
    }
}

main();
