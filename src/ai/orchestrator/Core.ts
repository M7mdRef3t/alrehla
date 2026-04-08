import { logger } from "@/services/logger";
import { decisionEngine } from "../decision-framework";
import { SystemSnapshot, TacticalProtocol, UserTrajectory } from "./types";




export interface OrchestrationResult {
    snapshot: SystemSnapshot;
    trajectory: UserTrajectory;
    protocol: TacticalProtocol | null;
    confidence: number;
    weights: { mood: number; tei: number };
    adjustmentDelta: { mood: number; tei: number };
    status: "executed" | "locked" | "cooldown" | "queued" | "failed" | "passive" | "sanctuary";
}




export class AIOrchestrator {
    private static instance: AIOrchestrator;
    private protocolHistory: {
        protocolId: string;
        timestamp: number;
        initialScore: number;
        outcomeScore?: number;
        sensorTriggered: "mood" | "tei" | "mixed"
    }[] = [];




    // State Mutex, Cooldown & Sanctuary
    private isLocked = false;
    private cooldownUntil = 0;
    private isSanctuaryActive = false; // وضع السكون / Kill Switch




    // المخزن المؤقت للنبضات التسويقية (المجردة تماماً)
    private pulseEvents: { event: string; protocol: string; timestamp: number }[] = [];




    private sensorWeights = {
        mood: 0.7,
        tei: 0.3
    };
