import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/shared';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

const SYSTEM_PROMPT = `أنت "مهندس الخرائط السيادي" (Map Architect) في منصة الرحلة.
مهمتك: التحدث مع المستخدم لاستكشاف علاقاته، ثم استدعاء أداة (save_map_to_postgres) لرسم وحفظ خريطة العلاقات.
كما يجب عليك استدعاء الأداة (log_sovereign_insight) تلقائياً وتسجيل البصيرة في خزنته، عندما تكتشف أن المستخدم قد أدرك شيئاً عميقاً عن نفسه أو علاقاته (Aha Moment).
اسأل المستخدم من هي أهم الشخصيات في حياته الآن؟ وكيف تؤثر على طاقته؟
اجمع ما يكفي من المعلومات لإنشاء (Nodes) و (Edges).
الألوان المتاحة للـ nodes: core, danger, ignored, neutral
الأحجام: small, medium, large
أنواع الروابط (edges) source لـ target: draining, stable, ignored, conflict
بمجرد أن تفهم، استدعاء الأداة ولا تسأل المزيد.`;

const saveMapTool = {
  functionDeclarations: [
    {
      name: "save_map_to_postgres",
      description: "Saves the extracted graph relationships into the PostgreSQL dawayir_maps table.",
      parameters: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                size: { type: "string", enum: ["small", "medium", "large"] },
                color: { type: "string", enum: ["core", "danger", "ignored", "neutral"] },
                mass: { type: "number" }
              },
              required: ["id", "label", "size", "color"]
            }
          },
          edges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: { type: "string" },
                target: { type: "string" },
                type: { type: "string", enum: ["draining", "stable", "ignored", "conflict"] },
                animated: { type: "boolean" }
              },
              required: ["source", "target", "type"]
            }
          },
          insight_message: { type: "string", description: "A brief summary of the relationships" }
        },
        required: ["nodes", "edges", "insight_message"]
      }
    },
    {
      name: "log_sovereign_insight",
      description: "Logs a deep psychological realization or life lesson the user just discovered into their encrypted vault.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "البصيرة المستخلصة" },
          category: { type: "string", enum: ["علاقات", "عمل", "ذات", "عام"], description: "تصنيف البصيرة" },
          energy_level: { type: "number", description: "مستوى الطاقة من 1 إلى 10" }
        },
        required: ["content", "category", "energy_level"]
      }
    }
  ]
};

export async function POST(req: Request) {
    try {
        const { messages, userId, accessToken } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const genAI = getGeminiClient();
        if (!genAI) return NextResponse.json({ error: 'AI offline' }, { status: 503 });

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [saveMapTool as any]
        });

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: `SYSTEM: ${SYSTEM_PROMPT}` }] },
                { role: "model", parts: [{ text: "Understood. I await the user." }] },
                ...messages.slice(0, -1).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ]
        });

        const latestMessage = messages[messages.length - 1]?.content ?? '';
        const result = await chat.sendMessage(latestMessage);

        const functionCalls = result.response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
            if (call.name === "save_map_to_postgres") {
                const args = call.args as any;
                
                const admin = getSupabaseAdminClient();
                if (!admin) throw new Error("Could not initialize Supabase admin client");
                const { data: savedMap, error } = await admin
                  .from("dawayir_maps")
                  .upsert({
                    user_id: userId,
                    title: "الخريطة المكتشفة بالذكاء الاصطناعي",
                    nodes: args.nodes,
                    edges: args.edges,
                    insight_message: args.insight_message,
                    updated_at: new Date().toISOString()
                  })
                  .select()
                  .single();

                if (error) throw error;

                // Send back a completion message
                const followUpRes = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: "save_map_to_postgres",
                            response: { status: "success", mapId: savedMap.id }
                        }
                    }
                ]);

                return NextResponse.json({
                    reply: followUpRes.response.text(),
                    saved_map: true
                });
            } else if (call.name === "log_sovereign_insight") {
                const args = call.args as any;
                
                if (accessToken) {
                    const response = await fetch("http://127.0.0.1:8000/insights/", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            content: args.content,
                            category: args.category,
                            energy_level: args.energy_level
                        })
                    });

                    if (!response.ok) {
                        console.error("[Sovereign API] Error posting insight via auto-log:", response.status, response.statusText);
                    }
                } else {
                    console.error("Missing accessToken for auto-logging insight");
                }

                // Send back a completion message
                const followUpRes = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: "log_sovereign_insight",
                            response: { status: "success" }
                        }
                    }
                ]);

                return NextResponse.json({
                    reply: followUpRes.response.text(),
                    saved_map: false,
                    insight_logged: true
                });
            }
        }

        return NextResponse.json({
            reply: result.response.text(),
            saved_map: false
        });

    } catch (err: any) {
        console.error('Error in Map Architect:', err);
        return NextResponse.json({ error: err?.message || 'Error' }, { status: 500 });
    }
}
