import { logger } from "@/services/logger";
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


    }
