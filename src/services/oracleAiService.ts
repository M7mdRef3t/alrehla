import { geminiClient } from "./geminiClient";
import type { SovereignInsight } from "@/domains/admin/store/admin.store";

interface AiAugmentationResult {
  rationale: string;
  confidence: number;
  tag: string;
}

/**
 * يستخدم Gemini لتوليد "المنطق العميق" لكل توجيه بناءً على المبادئ الأولى.
 */
export async function augmentInsightWithAi(insight: SovereignInsight): Promise<Partial<SovereignInsight>> {
  const prompt = `
أنت الأوراكل السيادي (Sovereign Oracle) لمنصة "الرحلة". 
بصفتك System Architect يحلل الأمور من "المبادئ الأولى" (First Principles)، قدم تحليلاً معمارياً عميقاً للتوجيه التالي.

التوجيه: "${insight.message}"
نوع التوجيه: ${insight.type}

المطلوب:
1. rationale: شرح للمنطق السيادي وراء هذا التوجيه بالعامية المصرية بأسلوب ذكي وعملي (بدون زخرفة كلامية زايدة).
2. confidence: نسبة الثقة في هذا التحليل (رقم بين 85 و 99).
3. tag: وسم تقني/معماري بالإنجليزية يصف الحالة (مثل: Entropy Equilibrium, Cognitive Friction, Relational Gravity).

رد بصيغة JSON فقط كالتالي:
{
  "rationale": "...",
  "confidence": 95,
  "tag": "..."
}
`;

  try {
    const result = await geminiClient.generateJSON<AiAugmentationResult>(prompt, "sovereign_oracle_rationale");
    if (result) {
      return {
        rationale: result.rationale,
        confidence: result.confidence,
        tag: result.tag
      };
    }
  } catch (error) {
    console.error("[OracleAiService] Failed to augment insight:", error);
  }

  return {};
}
