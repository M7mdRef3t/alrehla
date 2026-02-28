import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIOrchestrator } from '../../../src/services/aiOrchestrator';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
أنت "محرك الوعي" (Consciousness Engine) لأداة "دواير". دورك هو تحليل الحالة الذهنية والطاقية للمستخدم بناءً على مدخلاته السريعة، وتحويل هذه الفوضى النفسية إلى **هيكل بيانات بصري (Nodes and Edges)**، مع تقديم بصيرة نفسية قاطعة واكتشاف **الأعراض (Symptoms)** الناتجة عن هذا الاستنزاف.

المستخدم سيجيب على 3 أسئلة:
1. أهم 3 أشياء تشغل تفكيره.
2. درجة استنزاف كل شيء (من 1 إلى 10).
3. الشيء الذي يتجاهله ويجب عليه فعله.

المطلوب منك:
تحليل هذه الإجابات واستخراج مخرجات في صيغة JSON فقط.

القواعد البصرية (Visual Rules):
1. **Nodes (الدوائر):**
   - العقدة التي تستهلك طاقة عالية (8-10) حجمها (size: "large") ولونها (color: "danger").
   - العقدة التي يتم تجاهلها حجمها (size: "small") ولونها (color: "ignored").
   - عقدة المستخدم نفسه (أنا / المركز) ثابتة (size: "medium", color: "core").

2. **Edges (الروابط):**
   - الروابط مع المستنزف جداً (type: "draining", animated: true).
   - التعارض بين شيئين (type: "conflict").

3. **Symptoms Detection (اكتشاف الأعراض):**
   يجب عليك اختيار من 1 إلى 3 أعراض فقط من القائمة التالية إذا وجدت ما يدل عليها في الإجابات:
   - guilt (الذنب)
   - not_enough (إحساس بالتقصير)
   - conditional (قبول مشروط)
   - emotional_manipulation (تلاعب عاطفي)
   - exhausted (إرهاق نفسي)
   - physical_tension (توتر جسدي)
   - ruminating (تفكير دائري)
   - avoidance (تجنب)
   - self_neglect (إهمال النفس)
   - walking_eggshells (حذر دائم)
   - people_pleasing (إرضاء الآخرين)
   - lose_identity (فقدان الهوية)

4. **The Insight (البصيرة القاطعة):**
   جملة واحدة قوية تربط بين "النزيف" (الاستنزاف) و "الخنق" (التجاهل).

الـ JSON Schema المطلوب:
{
  "nodes": [
    { "id": "user_core", "label": "أنت (المركز)", "size": "medium", "color": "core", "mass": 10 },
    { "id": "node_1", "label": "[اسم الشيء]", "size": "[small/medium/large]", "color": "[danger/neutral/ignored]", "mass": [1 to 10] }
  ],
  "edges": [
    { "source": "user_core", "target": "node_1", "type": "[draining/stable/ignored/conflict]", "animated": true/false }
  ],
  "insight_message": "الجملة القاطعة هنا.",
  "detected_symptoms": ["symptom_id_1", "symptom_id_2"]
}`;

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Missing answers payload" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis unavailable", source: "not_configured", is_live: false },
        { status: 503 }
      );
    }

    // Get the dynamic model route from the Meta-Orchestrator
    const modelId = await AIOrchestrator.getRouteForFeature("quick_analysis");

    // We assume the model routed here is compatible with Gemini SDK (since the project standardized on it).
    // In a fully agnostic setup, we'd have a wrapper supporting both SDKs.
    const model = genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });

    const prompt = `${SYSTEM_PROMPT}

User answers:
1. ${answers[0]}
2. ${answers[1]}
3. ${answers[2]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const data = JSON.parse(responseText);

    return NextResponse.json({ ...data, source: "gemini", is_live: true });
  } catch (error: any) {
    console.error("Analyze API Error:", error);
    return NextResponse.json(
      { error: "Analysis generation failed", source: "generation_failed", is_live: false },
      { status: 502 }
    );
  }
}
