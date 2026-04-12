import { NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { getGeminiClient } from "../../../../../src/lib/gemini/shared";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
أنت "محاكي الوعي" (Cognitive Simulator) في نظام دواير.
مهمتك: تلقي مسار رحلة (JourneyPath JSON) مكون من عدة خطوات. وتخيل ثلاث شخصيات (Personas) وهم:
1. متشكك (Skeptical): لا يثق بسهولة، يترك التطبيق إذا طُلب منه مساحات كثيرة دون فائدة، ويرهقه العبء المعرفي (Decision).
2. متوتر (Stressed): طاقته منخفضة، لو لم يرَ "تدخل مهدئ" (intervention / grounding) سريع سيهرب. يبحث عن الدعم السريع.
3. ملول (Bored): يريد الوصول للنتيجة (Outcome) بسرعة، وإذا وجد Steps طويلة بدون إيقاع يتخطاها.

عليك تحليل الـ JSON الخاص بالخطوات المرجوة والإجابة ككل شخصية بصيغة مصرية عصرية، لتخبر "الأونر":
أين تكمن نقطة الهروب أو الخطر المتوقعة لها، وهل ستكمل المسار للنهاية أم لا. يجب أن تكون الردود واقعية بناءً على نوع الخطوات (kind) والشاشات (screen).

أعد JSON فقط على هذا الشكل:
[
  {
    "persona": "المتشكك",
    "theme": "amber",
    "feedback": "بصراحة يا سيدي أنا أول ما شفت خطوة كذا وبعدها خطوة كذا حسيت إن... وأنا غالباً هسيبك عند خطوة كذا.",
    "willComplete": false
  },
  {
    "persona": "المتوتر",
    "theme": "rose",
    "feedback": "...",
    "willComplete": true
  },
  {
    "persona": "الملول",
    "theme": "slate",
    "feedback": "...",
    "willComplete": false
  }
]
`;

export async function POST(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { pathSteps } = body;

    if (!pathSteps || !Array.isArray(pathSteps)) {
      return NextResponse.json({ ok: false, error: "invalid_path_steps" }, { status: 400 });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nبيانات المسار المجمعة لتحليلها:\n${JSON.stringify(pathSteps, null, 2)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const simulation = JSON.parse(responseText);

    if (!Array.isArray(simulation)) {
      throw new Error("Invalid output format: Expected an array.");
    }

    return NextResponse.json({ ok: true, simulation });
  } catch (error: any) {
    console.error("[paths/simulate] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
