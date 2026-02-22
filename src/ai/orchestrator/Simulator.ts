import { orchestrator } from "./Core";
import { SystemSnapshot } from "./types";

/**
 * TacticalSimulator â€” Ø£Ø¯Ø§Ø© Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø¶ØºØ· Ù„Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø¢Ù„ÙŠ
 */
export class TacticalSimulator {

    /**
     * ØªÙ†ÙÙŠØ° Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆ Ø§Ù„ØªÙ†Ø§Ù‚Ø¶ Ø§Ù„Ù…Ø¹Ø±ÙÙŠ
     * Ù…Ø³ØªØ´Ø¹Ø± Ø§Ù„Ù…Ø´Ø§Ø¹Ø± (Mood): 10 (Ø§Ù†Ù‡ÙŠØ§Ø±)
     * Ù…Ø³ØªØ´Ø¹Ø± Ø§Ù„Ø£Ø¯Ø§Ø¡ (TEI): 95 (Ù†Ø´Ø§Ø· Ù…ÙØ±Ø·)
     */
    public static async runContradictionTest() {
        console.warn("ðŸ§ª [STRESS TEST] Starting Scenario 1: Contradiction Loop...");

        const snapshot: SystemSnapshot = {
            nodesCount: 12,
            unlockedMedals: 5,
            dailyJournalCount: 25,
            lastMoodScore: 10,   // CRISIS flag
            teiScore: 95,        // EVOLVING flag
            activeRecoverySteps: 20
        };

        console.warn("Injecting discordant snapshot:", snapshot);
        const protocol = await orchestrator.orchestrate(snapshot);

        console.warn("System Resulting Protocol:", protocol?.protocol?.name || "None");
        return protocol;
    }

    /**
     * ØªÙ†ÙÙŠØ° Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆ ØªØ³Ù…Ù… Ø§Ù„ØªØºØ°ÙŠØ© Ø§Ù„Ø±Ø§Ø¬Ø¹Ø©
     */
    public static async runPoisoningTest() {
        console.warn("ðŸ§ª [STRESS TEST] Starting Scenario 2: Feedback Poisoning...");

        const snapshot: SystemSnapshot = {
            nodesCount: 5,
            unlockedMedals: 1,
            dailyJournalCount: 2,
            lastMoodScore: 95,   // Fake Positive (Poison)
            teiScore: 15,        // Real Implicit Sluggishness
            activeRecoverySteps: 0
        };

        await orchestrator.orchestrate(snapshot);
    }
}

