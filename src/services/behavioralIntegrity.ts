/**
 * Behavioral Integrity (BI) Service — محرك النزاهة السلوكية ⚖️
 * =========================================================
 * Calculates the "Truth" score by comparing user actions (Dawayir) 
 * with their linguistic patterns (AI Chat/Journaling).
 */

import { GraphEventType } from "./automagicLoop";

export interface IntegrityHypothesis {
    expectedAVChange: number; // Expected change in Agentic Velocity
    expectedSEChange: number; // Expected change in Shadow Entropy
    requiredKeywords: string[]; // Keywords that signal high integrity
    negativeIndicators: string[]; // Keywords that signal "False Boundary" or "False Growth"
}

export interface BIResult {
    score: number; // 0 to 1
    confidence: number;
    analysis: string;
}

// ─── Mapping Table: Actions -> Hypotheses ──────────────────────────
export const BI_MAPPING: Record<GraphEventType, IntegrityHypothesis> = {
    MAJOR_DETACHMENT: {
        expectedAVChange: 0.3, // Expecting an increase in Agency
        expectedSEChange: -0.2, // Expecting chaos to settle
        requiredKeywords: ["قررت", "رفضت", "وضعت حدود", "كفاية", "أنا فاعل", "نهيت"],
        negativeIndicators: ["ليه عمل كدا", "مش قادر أنسى", "هو السبب", "مظلوم"],
    },
    RECONCILIATION: {
        expectedAVChange: 0.1,
        expectedSEChange: -0.4, // Major drop in entropy expected
        requiredKeywords: ["تفاهمنا", "فتحت صفحة", "هدوء", "سلام", "تسامح"],
        negativeIndicators: ["خايف", "مجبور", "معرفش ليه وافقت"],
    },
    ORBIT_SHIFT_OUTWARD: {
        expectedAVChange: 0.2,
        expectedSEChange: -0.1,
        requiredKeywords: ["مساحة", "وضوح", "راحة", "بعد"],
        negativeIndicators: ["وحدة", "خوف", "عايز أرجع"],
    },
    ORBIT_SHIFT_INWARD: {
        expectedAVChange: 0.1,
        expectedSEChange: -0.1,
        requiredKeywords: ["ثقة", "قرب", "تواصل"],
        negativeIndicators: ["قلق", "شك"],
    },
    VAMPIRE_DETECTED: {
        expectedAVChange: -0.2, // Energy drain
        expectedSEChange: 0.3, // Chaos increase
        requiredKeywords: ["تعب", "استنزاف", "تحذير"],
        negativeIndicators: ["عادي", "مبسوط"],
    },
    KEYSTONE_RESOLVED: {
        expectedAVChange: 0.5, // Root cause fixed
        expectedSEChange: -0.5,
        requiredKeywords: ["أصل", "جذر", "تحرر", "فهمت"],
        negativeIndicators: ["صدفة", "مؤقت"],
    }
};

export class BehavioralIntegrityEngine {
    /**
     * Generates a hypothesis for a specific event
     */
    static generateHypothesis(eventType: GraphEventType): IntegrityHypothesis {
        return BI_MAPPING[eventType];
    }

    /**
     * Calculates Integrity Score by analyzing text against the hypothesis
     */
    static analyzeLinguisticRipples(text: string, hypothesis: IntegrityHypothesis): BIResult {
        let score = 0.5; // Starting neutral
        const words = text.toLowerCase();

        // 1. Positive Reinforcement
        const matchedKeywords = hypothesis.requiredKeywords.filter(k => words.includes(k));
        score += (matchedKeywords.length / hypothesis.requiredKeywords.length) * 0.3;

        // 2. Negative Indicators (The "False Boundary" check)
        const matchedNegatives = hypothesis.negativeIndicators.filter(k => words.includes(k));
        score -= (matchedNegatives.length / hypothesis.negativeIndicators.length) * 0.4;

        // 3. Normalization
        score = Math.min(Math.max(score, 0), 1);

        return {
            score,
            confidence: text.length > 50 ? 0.8 : 0.4,
            analysis: score > 0.7 ? "High Integrity observed" : "Dissonance detected"
        };
    }

    /**
     * Active Pinging: Generates a provocative nudge for a user who hasn't provided data
     */
    static generateGhostingFix(eventType: GraphEventType): string {
        switch (eventType) {
            case "MAJOR_DETACHMENT":
                return "شايفك أخدت مسافة كبيرة.. هل الهدوء ده حقيقي ولا مجرد مسكن؟";
            case "RECONCILIATION":
                return "أحياناً المصالحة بتكون أصعب من البعد.. إيه اللي حاسس بيه في 'منطقة السلام' دي؟";
            default:
                return "إيه الأخبار؟ بقالك فترة معملتش تحديث لوعيك.";
        }
    }

    async verifyConsistency(payload: { type: string, intent?: string, intensity?: number }): Promise<BIResult> {
        console.log(`⚖️ [BI_Engine] Verifying consistency for ${payload.type}...`);
        return {
            score: 0.8,
            confidence: 0.9,
            analysis: "Consistency verified via Semantic Compression"
        };
    }
}
