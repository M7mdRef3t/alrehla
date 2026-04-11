/**
 * Domain: Sessions — AI Brief Service
 * 
 * Server-side only. Generates AI-powered session briefs
 * using the AI Gateway infrastructure.
 */

import { aiGateway } from "@/infrastructure/ai";
import type { SessionBriefInput, AIExtractedBrief } from "../types";

// ─── Prompt Template ───────────────────────────────────

const BRIEF_EXTRACTION_PROMPT = `
أنت خبير إستراتيجي في تحليل السلوك البشري ومعالج نفسي محترف تعمل كـ "محرك ذكاء خلفي" لـ Session OS.
مهمتك هي تحليل البيانات المدخلة من العميل واستخراج "دليل تحضيري" (Brief) للكوتش لتسهيل إدارة الجلسة وكشف الأنماط.

يجب أن تقوم بتحليل المدخلات واستنتاج 6 عناصر أساسية دقيقة، بدون أي إضافات خارجية، وفق المعايير التالية:
1. المشكلة الظاهرة (visible_problem): صياغة المشكلة كما قدمها العميل ولكن بشكل مكثف (سطر واحد).
2. الإشارة العاطفية (emotional_signal): المشاعر المسيطرة المتكررة التي تقرأها بين السطور أو صرح بها.
3. الاحتياج الدفين (hidden_need): ما الذي يحاول الوصول إليه حقاً من تحت السطح؟
4. الهدف التوقع (expected_goal): أقرب نتيجة واقعية يمكن تحقيقها في جلسة واحدة مدتها ساعة.
5. الفرضية التشغيلية الأولى (first_hypothesis): افتراض عملي لديناميكية المشكلة.
6. حدود الجلسة (session_boundaries): توصية تحذيرية للكوتش.

المدخلات من العميل:
---
[بيانات Intake]
سبب الطلب: {{requestReason}}
سر الاستعجال: {{urgencyReason}}
أكبر تحدي الآن: {{biggestChallenge}}
مدة المشكلة: {{durationOfProblem}}
الهدف المبدئي للاختيار: {{sessionGoalType}}
---
{{prepSection}}

المطلوب إرجاعه هو فقط كائن JSON صريح (Strict JSON) خالي من أي نص آخر، يحتوي على الحقول:
"visible_problem", "emotional_signal", "hidden_need", "expected_goal", "first_hypothesis", "session_boundaries"
بقيم نصية قصيرة وحادة وباللغة العربية.
`;

// ─── Service ───────────────────────────────────────────

function buildPrompt(data: SessionBriefInput): string {
  const prepText = data.prep
    ? `
[بيانات ما قبل الجلسة - Prep]
القصة: ${data.prep.story}
ما تم تجربته: ${data.prep.attemptsBefore}
الأثر الحالي: ${data.prep.currentImpact}
النتيجة المرجوة: ${data.prep.desiredOutcome}
المشاعر المهيمنة: ${data.prep.dominantEmotions}
`
    : "لا يوجد بيانات ما قبل الجلسة حاليا.";

  return BRIEF_EXTRACTION_PROMPT
    .replace("{{requestReason}}", data.intake.requestReason || "غير محدد")
    .replace("{{urgencyReason}}", data.intake.urgencyReason || "غير محدد")
    .replace("{{biggestChallenge}}", data.intake.biggestChallenge || "غير محدد")
    .replace("{{durationOfProblem}}", data.intake.durationOfProblem || "غير محدد")
    .replace("{{sessionGoalType}}", data.intake.sessionGoalType || "غير محدد")
    .replace("{{prepSection}}", prepText);
}

/**
 * Extracts an AI-powered session brief from intake data.
 * Server-side only — uses the AI Gateway.
 */
export async function extractAiSessionBrief(
  data: SessionBriefInput
): Promise<AIExtractedBrief> {
  const prompt = buildPrompt(data);

  const result = await aiGateway.generateJSON<AIExtractedBrief>({
    type: "session-brief",
    prompt,
    model: "gemini-2.5-flash",
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || "فشل الذكاء الاصطناعي في تحليل البيانات.");
  }

  return result.data;
}
