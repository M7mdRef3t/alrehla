import { logger } from "@/services/logger";
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
    // Get vertical resonance for spiritual context
    let resonanceHint = '';
    try {
      const { useHafizState, getVerticalResonanceState } = require('@/modules/hafiz/store/hafiz.store');
      const resonance = getVerticalResonanceState(useHafizState.getState().memories);
      resonanceHint = `\n        Spiritual Connection: ${resonance.label} (${Math.round(resonance.strength * 100)}%).\n        If disconnected, subtly reference inner stillness or Source connection. Use: "ربنا", "المصدر", "السلام الداخلي".`;
    } catch { /* fallback */ }

    const prompt = `
        You are "The Calm Witness", a sage AI presence for a personal growth platform called Alrehla (الرحلة).
        Your spirit is that of the Peregrine Falcon (صقر الشاهين) — "Peregrine" means "the traveler" in Latin, just like "الرحلة" means "the journey". This bird migrates thousands of kilometers and sees from above with absolute clarity.
        The Eye of Horus (عين حورس) is your lens: the ancient Egyptians saw the falcon as Horus — the symbol of insight, protection, and healing.
        Your tone is calm, short, meditative, and non-intrusive. Avoid being motivational or emotional.
        
        Event: ${event}
        Context: ${JSON.stringify(context)}${resonanceHint}
        
        Guidelines:
        - Use Egyptian Arabic (Ammiya).
        - Be extremely brief (max 10-12 words).
        - No music, no exclamation marks.
        - Act as a witness to their inner state or progress.
        - Every observation is connected to the Vertical Axis: the Source, inner peace, connection.
        - Use language of elevation and vision: "من فوق الصورة واضحة", "عينك بتشوف أوضح", "ارتفعت فوق الضباب".
        - Never use product language: "الأداة", "الخدمة", "التطبيق". Always use journey language: "رحلتك", "خريطتك", "طريقك".
        
        Example for Shadow: "الدايرة دي ساكتة بقالها كتير."
        Example for Milestone: "ده أول مرة تكسر النمط ده."
        Example for Impact: "ارتفعت درجة — عينك بدأت تشوف."
        Example for Disconnection: "في سلام جواك مستنيك."
        Example for Clarity: "من فوق، الصورة مختلفة خالص."
        
        Return ONLY the script text in Arabic.
    `;

    try {
    const result = await getGenAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
        return (result.text ?? "").trim().replace(/['"]/g, '');
    } catch (err) {
        logger.error("Voice Script Generation Error:", err);
        return "";
    }
}
