import { NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { getGeminiClient } from "../../../../../src/lib/gemini/shared";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
أنت "مدقق السيادة الإدراكية" (Sovereign Cognitive Auditor).
مهمتك: استيعاب مسار رحلة مستخدم (Journey Path) وتحليله من منظور "دواير" المعماري والنفسي.

الأبعاد المطلوبة للتحليل:
1. الـ Emotional Arc (القوس العاطفي): هل المسار يقود المستخدم من التشتت إلى الاستقرار؟
2. الـ Cognitive Load (العبء المعرفي): هل توجد خطوات معقدة جداً متتالية؟
3. الـ Revenue Potential (إمكانيات النمو): أين هي اللحظة المثالية لعرض ميزة Premium؟
4. الـ Friction Points: نقاط الاحتكاك المحتملة.

يجب أن تعيد التحليل بصيغة JSON تحتوي على:
{
  "scores": {
    "emotionalResonance": 0-100,
    "cognitiveEfficiency": 0-100,
    "growthAlignment": 0-100
  },
  "verdict": "ملخص معماري قصير جداً",
  "findings": [
    { "type": "warning" | "success" | "opportunity", "message": "نص الملاحظة", "stepId": "id الخطوة المرتبطة إن وجد" }
  ],
  "architectAdvice": "نصيحة استراتيجية للمالك",
  "suggestedIntervention": "خطوة مقترحة للإضافة لتحسين المسار"
}
`;

export async function POST(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { path } = body;

    if (!path || !path.steps) {
      return NextResponse.json({ ok: false, error: "missing_path_data" }, { status: 400 });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nحلل هذا المسار:\n${JSON.stringify(path, null, 2)}\n\nأعد تقرير التدقيق بصيغة JSON فقط.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const auditData = JSON.parse(responseText);

    return NextResponse.json({ ok: true, audit: auditData });
  } catch (error: any) {
    console.error("[paths/audit] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
