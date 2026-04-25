import { geminiClient } from "./geminiClient";
import type { TransformationDiagnosis } from "@/modules/transformationEngine/interpretationEngine";
import { nexusService } from "./nexusService";

export interface CommandInsightRequest {
  diagnosis: TransformationDiagnosis;
  painDump?: string;
  userName?: string;
  metrics?: {
    totalRelationships: number;
    redOrbits: number;
    yellowOrbits: number;
    greenOrbits: number;
  };
}

/**
 * محرك الرؤية القيادية
 * يستخدم بيانات المسافر لإنتاج تشخيص عميق من المبادئ الأولى (First Principles)
 */
export async function generateCommandInsight(request: CommandInsightRequest): Promise<string> {
  const { diagnosis, painDump, metrics, userName } = request;

  const prompt = `
أنت "محرك التحول" في منصة "الرحلة". مهمتك هي تقديم "رؤية قيادية" (Command Insight) للمسافر بناءً على بياناته الحالية.

**الفلسفة:**
- "الرحلة" هي رحلة حياة الإنسان نفسها.
- المستخدم "مسافر" وليس عميلاً. جاء ليرى ويفهم ويُقرر.
- الهدف هو "قتل الدجال بالعلم" عبر كشف الأوهام النفسية بالوعي والحقائق.
- الأسلوب: عامية مصرية، عميق، صادق، مباشر، خاص تماماً، بعيد عن لغة التنمية البشرية السطحية.

**بيانات المسافر (${userName || "مسافر"}):**
- الحالة الروحية (Poetic State): ${diagnosis.state}
- النمط النفسي الغالب (Primary Pattern): ${diagnosis.rootTension}
- مستوى الخطر (Risk Level): ${diagnosis.riskLevel}
- ما يؤلمه الآن (Pain Dump): ${painDump || "لم يذكر شيئاً محدداً"}
- إحصائيات الدوائر: ${metrics ? `${metrics.totalRelationships} علاقة (${metrics.redOrbits} في المدار الأحمر، ${metrics.yellowOrbits} في الأصفر، ${metrics.greenOrbits} في الأخضر)` : "غير متوفرة"}

**المطلوب هو رد مركّز جداً بالعامية المصرية يتبع هيكل "حقيقة - فعل - سؤال":**
1. **الرؤية (Insight):** جملة أو جملتين تخترق الدفاعات النفسية وتكشف "النمط" اللي بيتحكم فيه دلوقتي. اذكر حالته (مثلاً: ${diagnosis.state}) بطريقة فيها استبصار.
2. **الفعل (Action):** "أبسط" فعل ممكن وصغير جداً يعمله "دلوقتي" (Commitment Pledge) عشان يبدأ يسترد قيادته على حياته.
3. **السؤال (Question):** سؤال واحد صادم بصدقه، يخليه يواجه نفسه.

**قواعد صارمة:**
- استخدم العامية المصرية (Ammiya) فقط.
- لا تزد عن 120 كلمة.
- لا تستخدم مقدمات (مثل: أهلاً بك، عزيزي المسافر). ادخل في "الرؤية" مباشرة.
- النغمة: حكيمة، تقيلة، وهادية. لا تتحمس زيادة ولا تبدو كأنك خوارزمية.
`;

  try {
    const response = await geminiClient.generate(prompt);
    
    if (!response) {
      throw new Error("Empty response from Gemini");
    }

    // [COMMAND SYNC] حفظ البصيرة في الخزنة القيادية في الخلفية
    void nexusService.saveUserInsight({
      content: response,
      category: diagnosis.state || "عام",
      energy_level: diagnosis.riskLevel === "emergency" ? 2 : diagnosis.riskLevel === "high" ? 4 : 7,
      exercise_code: "BASEERA_GEN"
    });

    return response;
  } catch (error) {
    console.error("Error generating command insight:", error);
    return "الرؤية لسه بتتكون في الضباب.. الأهم دلوقتي إنك بدأت الرحلة والبيانات محفوظة. خد نفس عميق وكمل، والوعي هييجي في وقته.";
  }
}
