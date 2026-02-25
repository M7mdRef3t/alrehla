/**
 * semanticCompressor.ts — طبقة ضغط الوعي 🧠
 * =======================================================
 * Prevents "Context Window Pollution" by summarizing chat history
 * and extracting actionable intents for the Core Engine.
 */

import { geminiClient } from "./geminiClient";

export interface SemanticShift {
    intent: string;       // 'RECONCILIATION', 'ASSERTION', 'DOUBT', 'DETERMINATION'
    intensity: number;    // 0.0 to 1.0
    summary: string;      // Concise 1-sentence summary
}

class SemanticCompressor {
    private messageThreshold = 5;

    /**
     * Compression Layer: Summarizes recent user/AI interaction
     */
    async compressMessages(messages: any[]): Promise<SemanticShift | null> {
        if (messages.length < this.messageThreshold) return null;

        console.log("🗜️ [SemanticCompressor] Compressing recent context...");

        const recentContext = messages.slice(-this.messageThreshold).map(m => `${m.role}: ${m.content}`).join("\n");

        const prompt = `
      تحليل سيمنتيقي (Semantic Analysis) لغرفة العمليات:
      حلل المحادثة التالية واستخلص "المتجه الدلالي" (Semantic Shift) في جملة واحدة فقط.
      حدد الـ Intent (واحدة من: RECONCILIATION, ASSERTION, DOUBT, DETERMINATION) والـ Intensity (0-1).
      
      المحادثة:
      ${recentContext}
      
      الرد يجب أن يكون JSON حصراً:
      { "intent": "...", "intensity": 0.x, "summary": "..." }
    `;

        try {
            const response = await geminiClient.generate(prompt);
            if (!response) return null;
            const shift = JSON.parse(response.replace(/```json|```/g, "").trim());
            console.log("✅ [SemanticCompressor] Extracted Shift:", shift);
            return shift;
        } catch (err) {
            console.error("❌ [SemanticCompressor] Compression failed:", err);
            return null;
        }
    }

    shouldCompress(messageCount: number): boolean {
        return messageCount % this.messageThreshold === 0 && messageCount > 0;
    }
}

export const semanticCompressor = new SemanticCompressor();
