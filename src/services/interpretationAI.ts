import { geminiClient } from "./geminiClient";
import { nexusService } from "./nexusService";
import type { TransformationDiagnosis } from "@/modules/transformationEngine/interpretationEngine";

export interface SovereignInsightRequest {
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

const FALLBACK_INSIGHTS: Record<string, string> = {
  "نزيف طاقة": "الحقيقة: أنت بتصرف طاقة في مطاريد مش شايلين همك، وده مأثر على سيادتك. \nالفعل: افصل موبايلك النهاردة ساعتين بس. \nالسؤال: ليه خايف تخرجهم من المدار مع إنهم عبء عليك؟",
  "نبض مشحون": "الحقيقة: جواك غليان محتاج يخرج قبل ما ينفجر في الوقت الغلط. \nالفعل: اكتب كل اللي جواك في ورقة وقطعها. \nالسؤال: إمتى آخر مرة قولت للي واجعك إنك موجوع؟",
  "توهة المدارات": "الحقيقة: الضبابة اللي أنت فيها سببها إنك مش مسمي الحاجات بأسمائها. \nالفعل: خد قرار واحد بسيط بقالك أسبوع بتأجله. \nالسؤال: إيه اللي هيحصل لو سميت العلاقة الرمادية دي باسمها الحقيقي؟",
  "محطة انتظار": "الحقيقة: الحذر الزيادة بيخليك واقف مكانك، الرحلة محتاجة حركة. \nالفعل: ابعت رسالة دعم لشخص في النواة. \nالسؤال: أنت مستني إيه عشان تبدأ تعيش بجد؟",
  "مستقر نسبياً": "الحقيقة: أنت في حالة توازن، ودي فرصة ممتازة للبنا. \nالفعل: حدد أهم قيمة محركة لرحلتك النهاردة. \nالسؤال: هل التوازن ده حقيقي ولا مجرد تعود على الوضع الحالي؟",
};

/**
 * محرك الرؤية السِيادية
 * يستخدم بيانات المسافر لإنتاج تشخيص عميق من المبادئ الأولى (First Principles)
 */
export async function generateSovereignInsight(request: SovereignInsightRequest): Promise<string> {
  const { diagnosis, painDump, metrics, userName } = request;

  const prompt = `
أنت "محرك التحول" في منصة "الرحلة". مهمتك هي تقديم "رؤية سِيادية" (Sovereign Insight) للمسافر بناءً على بياناته الحالية.

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
2. **الفعل (Action):** "أبسط" فعل ممكن وصغير جداً يعمله "دلوقتي" (Commitment Pledge) عشان يبدأ يسترد سيادته على حياته.
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

    // Save to Sovereign Vault in the background
    nexusService.saveUserInsight({
      content: response,
      category: diagnosis.state,
      energy_level: diagnosis.riskLevel === "low" ? 8 : (diagnosis.riskLevel === "medium" ? 5 : 3),
      exercise_code: "SOVEREIGN_INSIGHT_V1"
    }).catch(err => console.error("Failed background insight save:", err));

    return response;
  } catch (error) {
    console.error("Error generating sovereign insight:", error);
    // Fallback to rule-based engine
    return FALLBACK_INSIGHTS[diagnosis.state] || FALLBACK_INSIGHTS["مستقر نسبياً"];
  }
}
