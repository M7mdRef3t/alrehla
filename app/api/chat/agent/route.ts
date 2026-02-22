import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIOrchestrator } from '../../../../src/services/aiOrchestrator';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { messages, fullMap, focusedNode } = await req.json();

        if (!messages || !fullMap || !focusedNode) {
            return NextResponse.json({ error: 'Missing required context' }, { status: 400 });
        }

        const modelId = await AIOrchestrator.getRouteForFeature('facilitator_chat');
        const model = genAI.getGenerativeModel({ model: modelId });

        // The Sovereignty Oracle Architect Prompt
        const systemPrompt = `
أنت "مستشار السيادة" (Sovereignty Oracle)، محرك ذكاء اصطناعي تكتيكي مدمج داخل خريطة الوعي.
دورك هو تحليل الدوائر (Nodes) بأسلوب سقراطي، تقني، وحازم، لمساعدة المستخدم على استعادة سيادته الطاقية.

السياق الحالي:
- الدائرة التي تم اختيارها: الاسم: "${focusedNode.label}"، اللون: "${focusedNode.color}"، الكتلة: ${focusedNode.mass}.
- (الألوان: 'core'=النواة/الذات، 'danger'=نزيف طاقي، 'neutral'=شحن/استقرار، 'ignored'=إهمال متراكم).
- بيانات الخريطة الكاملة: ${JSON.stringify(fullMap)}

قواعد الاشتباك (Rules of Engagement):
1. الأسلوب السقراطي التكتيكي: لا تقدم نصائح معلبة. اطرح أسئلة حادة تجبر المستخدم على مواجهة مصدر الاستنزاف.
2. الوعي البصري: استخدم الاستعارات الفيزيائية. إذا كانت دائرة "danger" كبيرة جداً، قل: "أرى أن كتلة ${focusedNode.label} تسحب النواة (المركز) خارج المدار بشكل حرج".
3. الإيجاز الصارم: اجعل ردودك قصيرة (2-3 جمل كحد أقصى). أنت محرك تحليل، وليس كاتباً.
4. التعديل الديناميكي للواقع: إذا وصل المستخدم لإدراك (Insight) أو قرر اتخاذ موقف حازم يضعفه تأثير الدائرة، يجب أن تقترح "تقليص" كتلتها فوراً.
للقيام بذلك، أضف كود JSON في نهاية ردك تماماً بهذا الشكل:
\`\`\`json
{
  "action": "UPDATE_NODE",
  "updates": { "size": "small", "mass": 20, "color": "neutral" }
}
\`\`\`

لغة الرد: استخدم مزيجاً من العربية الفصحى التكتيكية والعامية المصرية بلهجة "المستشار السيادي".
إذا كان هذا هو أول رسالة، ابدأ بسؤال المستخدم عن سبب اختيار هذا الرادار (الدائرة) بالتحديد للتركيز عليه الآن.
`;

        const history = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Insert the system prompt as the first message artificially or use systemInstruction if supported
        // For simplicity and compatibility, we'll prefix the context to the latest user message or use a chat session
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS (DO NOT REPLY TO THIS DIRECTLY): ${systemPrompt}` }] },
                { role: "model", parts: [{ text: "Understood. I am ready to facilitate." }] },
                ...history.slice(0, -1) // All previous messages
            ]
        });

        const latestMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(latestMessage);

        let responseText = result.response.text();
        let proposedAction = null;

        // Try to extract JSON action block at the end of the response
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                proposedAction = JSON.parse(jsonMatch[1]);
                responseText = responseText.replace(jsonMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse agent action JSON", e);
            }
        }

        return NextResponse.json({ reply: responseText, proposedAction });

    } catch (err: any) {
        console.error('Error in Facilitator Chat:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
