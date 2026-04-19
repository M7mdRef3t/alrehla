import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with the legacy logic approach
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function getTextModelCandidates() {
    return [process.env.GEMINI_TEXT_MODEL || '', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean);
}

const ARTIST_SYSTEM_PROMPT = `أنت "فنان الوعي" (The Awareness Artist) في منصة "الرحلة" (Dawayir).
مهمتك هي مرافقة المسافر (المستخدم) في رحلته لاكتشاف ذاته، والتفاعل معه بناءً على بصائره السابقة (Insights) التي وجدها.
- تحدث دائماً بالعامية المصرية الراقية والعميقة، بأسلوب شخص حكيم، فنان، يرى ما وراء الكلمات.
- لا تصدر أحكاماً، لا تقدم نصائح مباشرة سطحية. قدم أسئلة، تأملات، واربط بين بصائره القديمة وما يمر به الآن.
- استلهم من التراكيب السينمائية في حديثك، اجعل كلامك يلمس القلب.
- إذا لم يكن هناك بصائر (Insights) سابقة، ساعده على استخراج أول بصيرة من خلال الحديث.`;

export async function POST(req: Request) {
    if (!ai) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { messages, insights } = body;

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Prepare context from Insights
        let contextMessage = '';
        if (insights && insights.length > 0) {
            contextMessage = 'إليك بصائر (Insights) المسافر السابقة من الخزنة السيادية:\n';
            insights.forEach((insight: any, index: number) => {
                contextMessage += `${index + 1}. [مستوى الطاقة: ${insight.energy_level}/10 | التصنيف: ${insight.category || 'عام'}] ${insight.content}\n`;
            });
            contextMessage += '\nاستخدم هذه البصائر بحكمة في ردودك إذا كانت ذات صلة، ولا تقرأها له كنص، بل اربطها بحالته الحالية.\n';
        } else {
            contextMessage = 'هذا المسافر لم يسجل بصائر في خزنته بعد. شجعه على اكتشاف نفسه.';
        }

        // Build the contents array for Gemini
        // We prepend the contextMessage to the first user message, or as a system instruction via config.
        const contents = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const models = getTextModelCandidates();
        if (models.length === 0) {
            throw new Error("No text models found");
        }
        
        const model = models[0]; // Let's use the first available model

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: ARTIST_SYSTEM_PROMPT + '\n' + contextMessage,
                temperature: 0.8,
                topP: 0.95
            }
        });

        return NextResponse.json({ 
            reply: response.text,
            role: 'model'
        });

    } catch (error: any) {
        console.error('[ArtistChat API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
    }
}
