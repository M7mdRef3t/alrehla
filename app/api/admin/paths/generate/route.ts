import { NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { getGeminiClient } from "../../../../../src/lib/gemini/shared";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
أنت "مهندس المسارات العاطفية" (Generative Path Architect) في نظام دواير.
مهمتك: تلقي نية المالك (Intention) حول تجربة المستخدم المستهدفة، وتوليد مسار رحلة كامل مبني على خطوات محسوبة ومترابطة نفسياً ومعرفياً.

القواعد الذهبية لتوليد مسارات دواير:
1. الـ kind يجب أن يكون واحداً من: "entry", "check", "decision", "intervention", "screen", "outcome".
2. يجب توفر خطوة "entry" واحدة على الأقل كبداية.
3. يجب توفر خطوة "outcome" واحدة على الأقل كنهاية.
4. استخدم الشاشات المناسبة (screens) المتاحة في القائمة:
  landing, goal, map, guided, mission, tools, settings, enterprise, guilt-court, diplomacy, oracle-dashboard, armory, survey, exit-scripts, grounding, stories, about, insights, quizzes, behavioral-analysis, resources, profile, sanctuary, life-os.
5. خطوة "decision" ترفع العبء المعرفي، لا تضع خطوتي "decision" متتاليتين إطلاقاً بدون مساحة للـ "grounding" أو "intervention".
6. كل خطوة يجب أن تكون مفعلة \`enabled: true\`.
7. وفّر وصفاً (description) قصيراً وملاحظة (note) مفيدة من منظور المهندس للمالك.
8. الحقل \`id\` لكل خطوة يجب أن يكون فريداً وعشوائياً قليلاً بصيغة: \`step-gen-{randomStr}\`.

المُخرجات:
JSON مصفوفة تحتوي فقط على كائنات الخطوات:
[
  {
    "id": "step-gen-abc12",
    "title": "اسم الخطوة",
    "kind": "entry",
    "screen": "landing",
    "description": "وصف نفسي للخطوة",
    "note": "ملاحظة تشغيلية",
    "enabled": true
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
    const { intention } = body;

    if (!intention || typeof intention !== "string") {
      return NextResponse.json({ ok: false, error: "missing_intention" }, { status: 400 });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });
    }

    // Using gemini-1.5-pro or gemini-1.5-flash.
    // The codebase might use AIOrchestrator, but here we fallback to default if not available.
    // Let's use gemini-1.5-pro for complex architecture reasoning.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nنية المالك للمسار المطلوب:\n"${intention}"\n\nأعد فقط مصفوفة الـ JSON المتوافقة.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const steps = JSON.parse(responseText);

    if (!Array.isArray(steps)) {
      throw new Error("Invalid output format: Expected an array.");
    }

    return NextResponse.json({ ok: true, steps });
  } catch (error: any) {
    console.error("[paths/generate] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
