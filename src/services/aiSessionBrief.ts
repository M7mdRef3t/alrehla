import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("Missing Gemini API Key. AI Session Brief generation will fail.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface SessionBriefInput {
  intake: {
    requestReason: string;
    urgencyReason: string;
    biggestChallenge: string;
    durationOfProblem: string;
    sessionGoalType: string;
  };
  prep?: {
    story: string;
    attemptsBefore: string;
    currentImpact: string;
    desiredOutcome: string;
    dominantEmotions: string;
  };
}

export interface AIExtractedBrief {
  visible_problem: string;
  emotional_signal: string;
  hidden_need: string;
  expected_goal: string;
  first_hypothesis: string;
  session_boundaries: string;
}

const BRIEF_EXTRACTION_PROMPT = `
أنت خبير إستراتيجي في تحليل السلوك البشري ومعالج نفسي محترف تعمل كـ "محرك ذكاء خلفي" لـ Session OS.
مهمتك هي تحليل البيانات المدخلة من العميل واستخراج "دليل تحضيري" (Brief) للكوتش لتسهيل إدارة الجلسة وكشف الأنماط.

يجب أن تقوم بتحليل المدخلات واستنتاج 6 عناصر أساسية دقيقة، بدون أي إضافات خارجية، وفق المعايير التالية:
1. المشكلة الظاهرة (visible_problem): صياغة المشكلة كما قدمها العميل ولكن بشكل مكثف (سطر واحد).
2. الإشارة العاطفية (emotional_signal): المشاعر المسيطرة المتكررة التي تقرأها بين السطور أو صرح بها (مثال: ذنب، خوف، غضب مكبوت، إلخ).
3. الاحتياج الدفين (hidden_need): ما الذي يحاول الوصول إليه حقاً من تحت السطح؟ (مثال: أمان، تقدير، وضوح، سيطرة، حدود).
4. الهدف التوقع (expected_goal): أقرب نتيجة واقعية يمكن تحقيقها في جلسة واحدة مدتها ساعة.
5. الفرضية التشغيلية الأولى (first_hypothesis): افتراض عملي لديناميكية المشكلة (مثال: "العميل لا يعاني من المشكلة الظاهرة فقط، بل من نمط استرضاء يؤدي للضغط المتكرر").
6. حدود الجلسة (session_boundaries): توصية تحذيرية للكوتش (مثال: الجلسة مخصصة كذا وليست كذا، لا وعود بحل نهائي، احتمالية الاحتياج لعلاج نفسي).

المدخلات من العميل:
---
[بيانات Intake]
سبب الطلب: {requestReason}
سر الاستعجال: {urgencyReason}
أكبر تحدي الآن: {biggestChallenge}
مدة المشكلة: {durationOfProblem}
الهدف المبدئي للاختيار: {sessionGoalType}
---
{prepSection}

المطلوب إرجاعه هو فقط كائن JSON صريح (Strict JSON) خالي من أي نص آخر، يحتوي على الحقول:
"visible_problem", "emotional_signal", "hidden_need", "expected_goal", "first_hypothesis", "session_boundaries"
بقيم نصية قصيرة وحادة وباللغة العربية.
`;

export async function extractAiSessionBrief(data: SessionBriefInput): Promise<AIExtractedBrief> {
  if (!genAI) {
      throw new Error("Generative AI is not configured.");
  }

  const prepText = data.prep ? `
[بيانات ما قبل الجلسة - Prep]
القصة: ${data.prep.story}
ما تم تجربته: ${data.prep.attemptsBefore}
الأثر الحالي: ${data.prep.currentImpact}
النتيجة المرجوة: ${data.prep.desiredOutcome}
المشاعر المهيمنة: ${data.prep.dominantEmotions}
` : "لا يوجد بيانات ما قبل الجلسة حاليا.";

  const prompt = BRIEF_EXTRACTION_PROMPT
    .replace('{requestReason}', data.intake.requestReason || 'غير محدد')
    .replace('{urgencyReason}', data.intake.urgencyReason || 'غير محدد')
    .replace('{biggestChallenge}', data.intake.biggestChallenge || 'غير محدد')
    .replace('{durationOfProblem}', data.intake.durationOfProblem || 'غير محدد')
    .replace('{sessionGoalType}', data.intake.sessionGoalType || 'غير محدد')
    .replace('{prepSection}', prepText);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return parsed as AIExtractedBrief;
  } catch (error) {
    console.error("Error extracting AI Session Brief:", error);
    throw new Error("فشل الذكاء الاصطناعي في تحليل البيانات.");
  }
}
