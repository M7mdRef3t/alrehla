import { useGrowthState } from '../state/growthState';
import { usePredictiveState } from '../state/predictiveState';
import { type Dream } from '../types/dreams';
import { geminiClient } from './geminiClient';

/**
 * 🚀 GROWTH ENGINE (THE TURBO)
 * Manages high-performance task payloads and overclocking safety.
 */
export class GrowthEngine {
    public static async generatePayload(dreams: Dream[]): Promise<string[]> {
        const setPayload = useGrowthState.getState().setPayload;

        const payloadPrompt = `
            أنت "مهندس النمو" (Growth Engineer) في منصة الرحلة.
            مطلوب منك اختيار "حمولة مهام" (Payload) مكثفة لتحقيق أقصى إنتاجية (Overclocking).
            
            الأهداف الحالية:
            ${JSON.stringify(dreams.map(d => ({ id: d.id, title: d.title, category: d.metadata?.category })))}
            
            المطلوب:
            1. اختر مجموعة من الأهداف (بين 2 لـ 4) اللي بينهم توافق في "نوع المجهود الذهني".
            2. رتبهم في "سلسلة نمو" (Growth Chain).
            
            رجع فقط مصفوفة من الـ IDs للأهداف المختارة بتنسيق JSON:
            ["id1", "id2", ...]
        `;

        try {
            const result = await geminiClient.generateJSON<string[]>(payloadPrompt);
            if (Array.isArray(result)) {
                setPayload(result);
                return result;
            }
            return [];
        } catch (error) {
            console.error("Growth Engine failed to generate payload:", error);
            return [];
        }
    }

    public static monitorSustainability(): void {
        const { isOverclocking, setOverclock, updateHeat } = useGrowthState.getState();
        const { crashProbability } = usePredictiveState.getState();

        // Dynamically update heat level based on crash probability during Overclocking
        if (isOverclocking) {
            updateHeat(Math.max(0.3, crashProbability));
        }

        // Safety Trigger: Shutdown Overclocking if Radiation peaks
        if (isOverclocking && crashProbability > 0.85) {
            console.warn("[Growth Engine] Emergency Shutdown: Radiation levels critical.");
            // Set isTripped by calling setOverclock(false) - wait, I need to update state to set isTripped
            useGrowthState.setState({ isOverclocking: false, isTripped: true, heatLevel: 1 });
        }
    }
}
