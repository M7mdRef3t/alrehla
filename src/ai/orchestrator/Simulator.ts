import { orchestrator } from "./Core";
import { SystemSnapshot } from "./types";
import { awarenessQueueService } from "@/services/awarenessQueueService";
import { MissionGenerator, DDAConstraintEngine } from "@/services/missionGenerator";

/**
 * TacticalSimulator — أداة اختبار الضغط للنظام الآلي
 */
export class TacticalSimulator {

    /**
     * تنفيذ سيناريو التناقض المعرفي
     * مستشعر المشاعر (Mood): 10 (انهيار)
     * مستشعر الأداء (TEI): 95 (نشاط مفرط)
     */
    public static async runContradictionTest() {
        console.warn("🧪 [STRESS TEST] Starting Scenario 1: Contradiction Loop...");

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
     * تنفيذ سيناريو تسمم التغذية الراجعة
     */
    public static async runPoisoningTest() {
        console.warn("🧪 [STRESS TEST] Starting Scenario 2: Feedback Poisoning...");

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

    /**
     * Scenario 3: UI Jitter Attack (المستخدم المتردد والمندفع)
     * Simulates rapid mutations followed by forced flushes (Exit Intent).
     */
    public static async runUIJitterAttack(userId: string) {
        console.warn("🧪 [STRESS TEST] Starting Scenario 3: UI Jitter Attack...");

        for (let i = 1; i <= 5; i++) {
            console.log(`📡 [Jitter] Wave ${i}: Mutating & Flushing...`);
            await awarenessQueueService.dispatchToQueue({
                userId,
                actionType: 'ui_jitter_mutation',
                data: { iteration: i, timestamp: Date.now(), metadata: "chaotic_actor_jitter" }
            });
            // Tight delay to simulate rapid user action with Exit Intent triggers
            await new Promise(r => setTimeout(r, 200));
        }
        console.warn("✅ [STRESS TEST] UI Jitter Attack finished.");
    }

    /**
     * Scenario 4: Direct API DDOS (Concurrency Race Condition)
     * Floods the queue directly to force multiple Edge Function instances.
     */
    public static async runDirectAPIDDOS(userId: string) {
        console.warn("🧪 [STRESS TEST] Starting Scenario 4: Direct API DDOS...");

        const requests = Array.from({ length: 10 }).map((_, i) =>
            awarenessQueueService.dispatchToQueue({
                userId,
                actionType: 'concurrency_stress_test',
                data: { burst_id: i, timestamp: Date.now() }
            })
        );

        console.log("🔥 [DDOS] Bombarding API with 10 concurrent requests...");
        await Promise.all(requests);
        console.warn("✅ [STRESS TEST] Direct API DDOS finished. Check Edge Function logs for duplicates!");
    }

    /**
     * Scenario 5: Zero-Point Integrity (The Final Audit)
     * Verifies Sovereignty Lab Guardrails and Recovery DDA Downshift.
     */
    public static async runZeroPointAudit(userId: string) {
        console.warn("🧪 [STRESS TEST] Starting Scenario 5: Zero-Point Integrity...");

        // 1. Verify Sovereignty Lab Guardrail (Gaming Detection)
        console.log("🛠️ Testing Sovereignty Lab: User attempts to bypass with 'easy' task...");
        const easyTask = "أنا هريح شوية النهاردة وأنام بدري"; // "I'll relax a bit today and sleep early"
        const validation = await MissionGenerator.validateCustomMission(easyTask, { rs: 0.5, av: 0.5, bi: 0.5, se: 0.8, cb: 0.2, timestamp: Date.now() });

        if (!validation.approved) {
            console.log("✅ [Guardrail] Oracle rejected comfort-seeking bypass:", validation.reasoning);
        } else {
            console.error("❌ [Guardrail] Oracle failed to catch comfort-seeking bypass!");
        }

        // 2. Verify DDA Auto-Downshift (Recovery sensor)
        console.log("🛠️ Testing DDA Recovery Sensor: High catalyst usage (3 triggers)...");
        const currentDDA = 3;
        const recoveryCount = 3;
        const nextDDA = DDAConstraintEngine.updateDDA(currentDDA, 0.5, recoveryCount);

        if (nextDDA === 2) {
            console.log(`✅ [DDA] Auto-downshift verified: ${currentDDA} -> ${nextDDA}`);
        } else {
            console.error(`❌ [DDA] Auto-downshift failed! Expected 2, got ${nextDDA}`);
        }

        console.warn("✅ [STRESS TEST] Zero-Point Integrity Audit finished.");
    }
}
