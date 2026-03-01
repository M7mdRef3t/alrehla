import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_PRO_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        const result = await model.generateContent(prompt);
        return result.response.text().trim().replace(/['"]/g, '');
    } catch (err) {
        console.error("Voice Script Generation Error:", err);
        return "";
    }
}
