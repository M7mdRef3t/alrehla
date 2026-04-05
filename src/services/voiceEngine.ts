import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
    if (genAI) return genAI;

    const apiKey = process.env.GEMINI_PRO_API_KEY || "";
    if (!apiKey) {
        throw new Error("GEMINI_PRO_API_KEY is not configured");
    }

    genAI = new GoogleGenAI({ apiKey });
    return genAI;
}


export type VoiceEvent = 'shadow_insight' | 'milestone_unlocked' | 'high_impact_action';

export async function generateVoiceScript(event: VoiceEvent, context: any): Promise<string> {
    const prompt = `
        You are "The Calm Witness", a sage AI presence for a personal growth platform called Dawayir.
        Your tone is calm, short, meditative, and non-intrusive. Avoid being motivational or emotional.
        
        Event: ${event}
        Context: ${JSON.stringify(context)}
        
        Guidelines:
        - Use Egyptian Arabic (Ammiya).
        - Be extremely brief (max 10-12 words).
        - No music, no exclamation marks.
        - Act as a witness to their inner state or progress.
        
        Example for Shadow: "الدايرة دي ساكتة بقالها كتير."
        Example for Milestone: "ده أول مرة تكسر النمط ده."
        Example for Impact: "الفعل ده فعلاً غير حالتك."
        
        Return ONLY the script text in Arabic.
    `;

    try {
    const result = await getGenAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
        return (result.text ?? "").trim().replace(/['"]/g, '');
    } catch (err) {
        console.error("Voice Script Generation Error:", err);
        return "";
    }
}
