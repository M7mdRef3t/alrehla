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

    private constructor() { }

    public static getInstance(): AIOrchestrator {
        if (!AIOrchestrator.instance) AIOrchestrator.instance = new AIOrchestrator();
        return AIOrchestrator.instance;
    }

    /**
     * Activate Sanctuary Mode (The Ultimate Negative Feedback)
     * يوقف التدخلات فوراً ويعاقب الأوزان التي أدت للقرار الأخير
     */
    public activateSanctuary() {
        console.warn("❗ [ORCHESTRATOR] SANCTUARY_MODE_ACTIVATED: User rejected current trajectory.");
        this.isSanctuaryActive = true;

        // تطبيق العقابة الكبرى (Absolute Negative Reward)
        const lastEntry = this.protocolHistory[this.protocolHistory.length - 1];
        if (lastEntry && (Date.now() - lastEntry.timestamp < 300000)) { // لو آخر تدخل كان في آخر 5 دقائق
            const penalty = 0.2;
            if (lastEntry.sensorTriggered === "mood") {
                this.sensorWeights.mood = Number((Math.max(this.sensorWeights.mood - penalty, 0.1)).toFixed(2));
                this.sensorWeights.tei = Number((1 - this.sensorWeights.mood).toFixed(2));
            } else if (lastEntry.sensorTriggered === "tei") {
                this.sensorWeights.tei = Number((Math.max(this.sensorWeights.tei - penalty, 0.1)).toFixed(2));
                this.sensorWeights.mood = Number((1 - this.sensorWeights.tei).toFixed(2));
            }
            console.warn(`[LEARNING] Drastic Weight Adjustment after rejection:`, this.sensorWeights);
        }
    }

    public exitSanctuary() {
        console.warn("[ORCHESTRATOR] Sanctuary Mode deactivated. Resuming low-impact monitoring.");
        this.isSanctuaryActive = false;
    }

    public analyzeTrajectory(snapshot: SystemSnapshot): { trajectory: UserTrajectory; confidence: number; sensor: "mood" | "tei" | "mixed" } {
        const scores = {
            CRISIS: snapshot.lastMoodScore < 30 ? 1.0 : 0.0,
            EVOLVING: snapshot.teiScore > 80 ? 1.0 : 0.0,
            STUCK: (snapshot.activeRecoverySteps === 0 && snapshot.nodesCount > 5) ? 1.0 : 0.0,
        };

        const weightedCrisis = scores.CRISIS * this.sensorWeights.mood;
        const weightedEvolving = scores.EVOLVING * this.sensorWeights.tei;

        const totalWeight = weightedCrisis + weightedEvolving;
        const confidence = totalWeight > 0 ? Math.abs(weightedCrisis - weightedEvolving) / totalWeight : 1.0;

        let trajectory: UserTrajectory = "STABLE";
        let sensor: "mood" | "tei" | "mixed" = "mixed";

        if (weightedCrisis >= weightedEvolving && weightedCrisis > 0.1) {
            trajectory = "CRISIS";
            sensor = "mood";
        }
        else if (weightedEvolving > weightedCrisis && weightedEvolving > 0.1) {
            trajectory = "EVOLVING";
            sensor = "tei";
        }
        else if (scores.STUCK > 0.5) {
            trajectory = "STUCK";
        }

        return { trajectory, confidence, sensor };
    }

    public async orchestrate(snapshot: SystemSnapshot): Promise<OrchestrationResult> {
        const now = Date.now();

        if (this.isSanctuaryActive) {
            return this.generateResult(snapshot, "sanctuary", null, 1.0);
        }

        if (now < this.cooldownUntil) {
            return this.generateResult(snapshot, "cooldown", null, 1.0);
        }

        if (this.isLocked) {
            return this.generateResult(snapshot, "locked", null, 1.0);
        }

        const { trajectory, confidence, sensor } = this.analyzeTrajectory(snapshot);
        const protocol = this.getProtocolForTrajectory(trajectory, snapshot);

        if (!protocol) {
            return this.generateResult(snapshot, "passive", null, 1.0);
        }

        try {
            this.isLocked = true;
            await this.executeProtocol(protocol, snapshot.lastMoodScore, sensor);

            const cooldownBase = 5000;
            this.cooldownUntil = Date.now() + (protocol.severity * 2000) + cooldownBase;

            // إرسال إشارة مجردة لمحرك المحتوى الفيروسي (Fire and forget)
            this.emitAnonymousEvent(trajectory, protocol.id);

            return this.generateResult(snapshot, "executed", protocol, confidence);
        } catch (error) {
            console.error("[Orchestrator] Execution Failed", error);
            return this.generateResult(snapshot, "failed", protocol, confidence);
        } finally {
            this.isLocked = false;
        }
    }

    private generateResult(snapshot: SystemSnapshot, status: OrchestrationResult["status"], protocol: TacticalProtocol | null, confidence: number): OrchestrationResult {
        return {
            snapshot,
            trajectory: protocol?.trajectory || "STABLE",
            protocol,
            confidence: Math.round(confidence * 100),
            weights: { ...this.sensorWeights },
            adjustmentDelta: { mood: 0, tei: 0 },
            status
        };
    }

    public async evaluateEfficacy(currentScore: number) {
        const lastSession = this.protocolHistory.find(h => !h.outcomeScore && (Date.now() - h.timestamp < 3600000));
        if (lastSession) {
            lastSession.outcomeScore = currentScore;
            const improvement = lastSession.outcomeScore - lastSession.initialScore;
            const learningRate = 0.05;
            if (improvement > 5) {
                this.sensorWeights.mood = Number((this.sensorWeights.mood + learningRate).toFixed(2));
                this.sensorWeights.tei = Number((1 - this.sensorWeights.mood).toFixed(2));
            }
        }
    }

    private async executeProtocol(protocol: TacticalProtocol, initialScore: number, sensor: "mood" | "tei" | "mixed"): Promise<void> {
        this.protocolHistory.push({
            protocolId: protocol.id,
            timestamp: Date.now(),
            initialScore,
            sensorTriggered: sensor
        });

        for (const action of protocol.actions) {
            const decision = {
                type: action.type,
                reasoning: `Tactical Protocol [${protocol.id}] - Sensor: ${sensor}`,
                payload: action.payload,
            };
            await new Promise(r => setTimeout(r, 500));
            if ((await decisionEngine.evaluate(decision)).allowed) {
                await decisionEngine.execute({ ...decision, timestamp: Date.now() });
            }
        }
    }

    private getProtocolForTrajectory(trajectory: UserTrajectory, _snapshot: SystemSnapshot): TacticalProtocol | null {
        const protocols: Record<string, TacticalProtocol> = {
            CRISIS: {
                id: "crisis_intervention",
                name: "بروتوكول احتواء الأزمة",
                trajectory: "CRISIS",
                severity: 9,
                actions: [{ type: "trigger_breathing_exercise", payload: {} }]
            },
            EVOLVING: {
                id: "evolution_challenge",
                name: "بروتوكول التطور المتسارع",
                trajectory: "EVOLVING",
                severity: 4,
                actions: [{ type: "recommend_action", payload: { mode: "hard" } }]
            }
        };
        return protocols[trajectory] || null;
    }

    /**
     * Anonymizer Emitter — تحويل معاناة المستخدم إلى بيانات إحصائية صماء لخدمة الوعي العام
     */
    private emitAnonymousEvent(trajectory: UserTrajectory, protocolId: string) {
        const event = {
            event: `${trajectory}_PULSE`,
            protocol: protocolId,
            timestamp: Date.now()
        };

        this.pulseEvents.push(event);
        console.log(`📡 [ANONYMIZER] Global Pulse Emitted: ${event.event} | Prot: ${event.protocol}`);

        // في بيئة الإنتاج: يتم إرسال هذا الـ Event إلى Supabase Table "viral_pulse_logs"
        // بدون أي UserID أو SessionID.
    }

    public getPulseArchive() {
        return [...this.pulseEvents];
    }
}

export const orchestrator = AIOrchestrator.getInstance();
