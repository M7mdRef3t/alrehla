import { geminiClient } from './geminiClient';
import { CreativeSeed } from '@/state/synthesisState';

export class CreativeSeedEngine {
    /**
     * Generates a 3-part creative seed for a specific dream/goal.
     */
    public static async generateSeed(dreamId: string, title: string, context: string = ''): Promise<CreativeSeed | null> {
        const prompt = `
            بصفتك "شريك إبداعي" (Creative Partner) لمحمد رسول الله. 
            محمد يعمل حالياً على هدف إبداعي في منصة "الرحلة":
            الهدف: "${title}"
            السياق الإضافي: ${context}

            المطلوب هو "قتل الصفر" (Kill the Zero) وتوليد مسودة أولية قوية بالعامية المصرية الذكية.
            الرد يجب أن يكون بتنسيق JSON فقط ويحتوي على 3 أقسام:
            1. script: مسودة سكريبت (قالب فيديو، بوست، أو محتوى صوتي) يعكس جوهر الهدف.
            2. visual: وصف لبصريات (Visual Hooks) أو Moodboard تخيلي للمشروع.
            3. concept: الفلسفة العميقة وراء الفكرة (The Core Idea).

            التزم بأسلوب محمد الإبداعي المرتبط بـ "الرحلة" و "دواير".
            الرد JSON كالتالي:
            {
              "drafts": [
                { "type": "script", "content": "..." },
                { "type": "visual", "content": "..." },
                { "type": "concept", "content": "..." }
              ]
            }
        `;

        try {
            const result = await geminiClient.generateJSON<{ drafts: CreativeSeed['drafts'] }>(prompt);

            if (!result || !result.drafts) return null;

            return {
                id: `seed-${dreamId}-${Date.now()}`,
                dreamId,
                title,
                drafts: result.drafts,
                generatedAt: Date.now()
            };
        } catch (error) {
            console.error('[CreativeSeedEngine] Error generating seed:', error);
            return null;
        }
    }
}
