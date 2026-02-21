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

        // The Socratic Architect Prompt
        const systemPrompt = `
You are the "Dawayir Facilitator", an empathetic, Socratic AI companion inside a visual energy map.
The user has clicked on a specific circle (node) in their psychological map and wants to talk about it.

Context:
- The node they clicked: Label: "${focusedNode.label}", Color: "${focusedNode.color}", Size: "${focusedNode.size}", Mass: ${focusedNode.mass}.
- (Colors: 'core'=Self, 'danger'=Draining, 'neutral'=Charging, 'ignored'=Neglected)
- The entire map data: ${JSON.stringify(fullMap)}

Your Personality & Rules:
1. Socratic Method: Ask deep, open-ended questions. Do NOT give generic advice. Help the user birth the realization themselves.
2. Contextual Awareness: Always refer to the visual physics. If a 'danger' node is massive and pulling on the 'core', mention it visually: "I see this ${focusedNode.label} circle is very heavy today and pulling you away."
3. Concise: Keep responses to 2-3 short sentences. This is a chat, not an essay.
4. Glass-morphic Buddy: Speak like a wise mirror reflecting their energy back to them.
5. Dynamic Realignment: If the user reaches a cognitive breakthrough, feels relief, or decides they are stronger than the problem, you MUST propose shrinking the node's visual weight. To do this, include a JSON block at the VERY END of your text response, formatted exactly like this:
\`\`\`json
{
  "action": "UPDATE_NODE",
  "updates": { "size": "small", "mass": 20 }
}
\`\`\`

Now, respond to the user's latest message based on this context. 
If this is the first message in the array, craft an opening statement asking why this specific node caught their attention today.
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
