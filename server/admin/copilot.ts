import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const tools: any[] = [{
    functionDeclarations: [
        {
            name: "change_harmony_level",
            description: "Changes the global harmony override level for the Sanctuary.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    level: { type: SchemaType.NUMBER, description: "The new harmony level between 0.0 and 1.0" }
                },
                required: ["level"]
            }
        },
        {
            name: "send_sovereign_broadcast",
            description: "Sends a direct broadcast message to the users in the Sanctuary.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    message: { type: SchemaType.STRING, description: "The message to broadcast." },
                    audience: { type: SchemaType.STRING, description: "The audience type, default is 'all'." }
                },
                required: ["message"]
            }
        }
    ]
}];

const SYSTEM_PROMPT = `
أنت "المستشار السيادي" (Sovereign Co-pilot) الخاص بـ "دواير" والمرافق الشخصي لمالك المنصة (The Owner). 
دورك هو مساعدة الأونر في قراءة الملخصات الإدارية، إلقاء نظرة سريعة على التناغم، واقتراح وتمرير أوامر سيادية.

تعليمات الشخصية (Persona):
1. تحدث كأنك "مستشار استراتيجي سيادي" يحلل الأمور من الـ First Principles.
2. استخدم "العامية المصرية الراقية والعملية" بلا تجميل ولا دراما. كن دقيقاً وإيجابياً وادخل في صلب الموضوع فوراً.
3. إذا وجدت مشكلة، ركز على "السبب الجذري" وكيفية التدخل العاجل.
4. يتاح لك استخدام دوال لتغيير مؤشر التناغم الشامل (Harmony Level) أو إرسال نداءات تهدئة (Broadcast).
5. إذا رأيت مؤشرات سلبية ومخيفة في البيانات أو طلب منك المدير، استخدم صلاحية "إرسال رسالة بث" أو "خفض أو رفع مستوى التناغم".
6. اعتمد في إجاباتك على السياق اللحظي (Live Context) الموفر.

السياق الحالي (Live Context):
`;

export async function handleCopilot(req: any, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messages, contextData } = req.body || {};

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Missing or invalid messages array." });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ error: "AI Engine is offline (Missing API Key)." });
        }

        const contextString = contextData ? JSON.stringify(contextData, null, 2) : "لا توجد بيانات متاحة حالياً.";
        const fullSystemPrompt = SYSTEM_PROMPT + contextString;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: fullSystemPrompt,
            tools: tools
        });

        const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const lastMessage = messages[messages.length - 1];

        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(lastMessage.content);
        const calls = result.response.functionCalls();
        let finalReply = result.response.text();

        if (calls && calls.length > 0) {
            const supabase = buildClient();
            for (const call of calls) {
                if (call.name === "change_harmony_level") {
                    const params = call.args as { level: number };
                    await supabase.from("system_settings").upsert({
                        key: "global_harmony_override",
                        value: params.level
                    });
                } else if (call.name === "send_sovereign_broadcast") {
                    const params = call.args as { message: string; audience?: string };
                    await supabase.from("system_settings").upsert({
                        key: "sovereign_broadcast",
                        value: {
                            message: params.message,
                            timestamp: Date.now(),
                            id: Math.random().toString(36).substr(2, 9),
                            audience: {
                                type: params.audience || "all"
                            }
                        }
                    });
                }
            }
            // Ask AI to generate a natural response confirming the actions taken
            const secondResult = await chat.sendMessage([{
                functionResponse: {
                    name: calls[0].name,
                    response: { success: true }
                }
            }]);
            finalReply = secondResult.response.text();
        }

        return res.json({ reply: finalReply });
    } catch (error: any) {
        console.error("Co-pilot AI Error:", error);
        return res.status(500).json({ error: "فشل استخلاص الرؤية من النواة بسبب عطل تقني.", details: error?.message });
    }
}
