/**
 * missionGenerator.ts — محرك توليد المهام الإجرائية 🧬
 * ========================================================
 * Implements Prompt Alchemy, Dynamic Difficulty Adjustment (DDA),
 * and strict JSON output enforcement for the "Reality Hacker" core.
 */

import { AwarenessVector } from "./trajectoryEngine";

// ─── JSON Schema Interface ───────────────────────────────────────
export interface DailyMission {
    day: number;
    actionable_task: string; // Physical/communicative action
    estimated_minutes: number;
}

export interface ExpectedProxyMetric {
    target_tool: "dawayir" | "chat" | "journal";
    semantic_intent: string; // Concept to match using Semantic Embeddings
}

export interface GeneratedMission {
    trajectory_title: string;
    duration_days: number;
    current_day?: number;
    last_verified_at?: string;
    dda_level_applied: number;
    daily_missions: DailyMission[];
    expected_proxy_metric: ExpectedProxyMetric;
    is_insulated?: boolean;
}

// ─── DDA Constraints Matrix ──────────────────────────────────────
export interface PhysicalConstraints {
    timeLimitMinutes: number;
    socialInteraction: "banned" | "indirect" | "direct" | "challenging";
    complexity: "low" | "medium" | "high";
    systemInstructionPatch: string;
}

const DDA_MATRIX: Record<number, PhysicalConstraints> = {
    1: {
        timeLimitMinutes: 5,
        socialInteraction: "banned",
        complexity: "low",
        systemInstructionPatch: "FOCUS: Micro-actions, zero social pressure. No direct interaction. Physical objects only."
    },
    2: {
        timeLimitMinutes: 10,
        socialInteraction: "indirect",
        complexity: "low",
        systemInstructionPatch: "FOCUS: Safe digital signaling. Indirect interaction (likes, status, observation)."
    },
    3: {
        timeLimitMinutes: 15,
        socialInteraction: "indirect",
        complexity: "medium",
        systemInstructionPatch: "FOCUS: Safe communicative signals. One-word messages or safe boundaries."
    },
    4: {
        timeLimitMinutes: 20,
        socialInteraction: "direct",
        complexity: "medium",
        systemInstructionPatch: "FOCUS: Direct interaction in safe environments. Stating needs clearly."
    },
    5: {
        timeLimitMinutes: 30,
        socialInteraction: "challenging",
        complexity: "high",
        systemInstructionPatch: "FOCUS: Calculated confrontation. Deep boundary setting. Real-world social pressure."
    }
};

// ─── DDA Engine ──────────────────────────────────────────────────
export class DDAConstraintEngine {
    private static MAX_LEVEL = 5;
    private static MIN_LEVEL = 1;

    /**
     * Cold Start: Derives initial DDA from Cognitive Bandwidth
     */
    static calculateInitialDDA(cb: number): number {
        return Math.min(Math.max(Math.ceil(cb * this.MAX_LEVEL), this.MIN_LEVEL), this.MAX_LEVEL);
    }

    /**
     * Asymmetric Momentum: Updates DDA based on BI score and Recovery Rate
     */
    static updateDDA(currentDDA: number, previousBI: number, recoveryCount: number = 0): number {
        // 1. Hard Downshift: If user triggered Catalyst > 2 times, force a drop
        if (recoveryCount > 2) {
            return Math.max(currentDDA - 1, this.MIN_LEVEL);
        }

        // 2. Standard Asymmetric Alpha: High for drops (0.8), Low for increments (0.3)
        const alpha = previousBI < 0.5 ? 0.8 : 0.3;
        const delta = alpha * (previousBI - 0.5);

        const nextDDA = currentDDA + delta;
        return Math.min(Math.max(Math.round(nextDDA), this.MIN_LEVEL), this.MAX_LEVEL);
    }

    static getConstraints(level: number): PhysicalConstraints {
        return DDA_MATRIX[level] || DDA_MATRIX[1];
    }
}

// ─── Mission Generator (Prompt Alchemy) ──────────────────────────
export class MissionGenerator {
    /**
     * Constructs the Unified System Prompt for the LLM
     */
    static constructPrompt(vector: AwarenessVector, ddaLevel: number): string {
        const constraints = DDAConstraintEngine.getConstraints(ddaLevel);

        return `
ROLE: You are the 'Reality Hacker' core of the Alrehla OS.
OBJECTIVE: Geherate a "Reality Hack" to rewire the user's neural pathways based on their Awareness Vector.

USER CONTEXT:
- Relational Symmetry (RS): ${vector.rs.toFixed(2)}
- Agentic Velocity (AV): ${vector.av.toFixed(2)}
- Shadow Entropy (SE): ${vector.se.toFixed(2)}
- Cognitive Bandwidth (CB): ${vector.cb.toFixed(2)}

DDA CONSTRAINTS (Level ${ddaLevel}):
- Max Daily Time: ${constraints.timeLimitMinutes} minutes.
- Social Interaction: ${constraints.socialInteraction}.
- Complexity: ${constraints.complexity}.
- GUIDELINE: ${constraints.systemInstructionPatch}
- NO therapy jargon. Use direct, actionable verbs.

OUTPUT FORMAT:
Return ONLY a valid JSON object following this schema:
{
  "trajectory_title": "string",
  "duration_days": number (3-7),
  "dda_level_applied": ${ddaLevel},
  "daily_missions": [
    { "day": 1, "actionable_task": "string", "estimated_minutes": number }
  ],
  "expected_proxy_metric": {
    "target_tool": "dawayir" | "chat" | "journal",
    "semantic_intent": "string (semantic concept to monitor for BI)"
  }
}
        `.trim();
    }

    /**
     * Oracle Guardrails: Validates user-customized missions in the Sovereignty Lab.
     */
    static async validateCustomMission(userTask: string, vector: AwarenessVector): Promise<{ approved: boolean; reasoning: string }> {
        // Criterion: Does this task provide genuine growth/friction or is it a comfort-seeking bypass?
        // The "Sovereignty Lab" is for Initiates to challenge themselves, not to relax.

        const isBypass = /relax|chill|watch|sleep|nothing|easy|تريح|نوم|راحة/i.test(userTask);

        return {
            approved: !isBypass,
            reasoning: !isBypass
                ? "عاش يا بطل، ده تحدي حقيقي يقوي سيادتك."
                : "بطل ألاعيب أونطة.. السيادة مش معناها إنك تريح نفسك، معناها إنك تختار الوجع اللي بيطورك. اختار حاجة فيها مواجهة."
        };
    }
}
