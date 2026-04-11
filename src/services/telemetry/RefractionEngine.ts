import { logger } from "@/services/logger";

import { geminiClient } from '../geminiClient';
import { useDigitalTwinState } from '@/domains/maraya/store/digitalTwin.store';
import { usePredictiveState } from '@/domains/consciousness/store/predictive.store';

export interface RefractionTask {
    id: string;
    title: string;
    description: string;
    targetEmotion: string;
    strategy: 'EXTERNALIZATION' | 'STRUCTURE' | 'REPETITION';
    estimatedMinutes: number;
}

export class RefractionEngine {
    /**
     * Generates a "Refraction Task" to help user externalize internal chaos.
     */
    public static async generateTask(): Promise<RefractionTask | null> {
        const { interventionMode, graph } = useDigitalTwinState.getState();
        const { entropyScore, primaryFactor } = usePredictiveState.getState().forecast ? { entropyScore: 0, primaryFactor: 'unknown' } : { entropyScore: 0, primaryFactor: 'unknown' };
        // Note: Real state would come from the predictive engine's calculated entropy

        const stability = graph.globalStability ?? 1;

        const prompt = `
            أنت "أوراكل المحتوى" (Content Oracle) في منصة الرحلة.
            محمد رسول الله يمر الآن بحالة ذهنية معينة:
            الحالة: ${interventionMode}
            الاستقرار: ${Math.round(stability * 100)}%
            العامل الأبرز للفوضى: ${primaryFactor}

            المطلوب: توليد "مهمة انكسار" (Refraction Task) صيرة ومركزة تساعده على تحويل طاقته الحالية لمنتج إبداعي.
            المهام الممكنة:
            - EXTERNALIZATION: لو الحالة Chaos (تفريغ بصري أو كتابي للفوضى).
            - STRUCTURE: لو الحالة Normal (تنظيم أفكار مشتتة).
            - REPETITION: لو الحالة Recovery (فعل إبداعي بسيط وهادئ مكرر).

            الرد JSON فقط:
            {
              "id": "ref-...",
              "title": "عنوان المهمة بالعامية",
              "description": "وصف المهمة (سطرين بالعامية)",
              "targetEmotion": "العاطفة المستهدفة للتفريغ",
              "strategy": "EXTERNALIZATION | STRUCTURE | REPETITION",
              "estimatedMinutes": number
            }
        `;

        try {
            const task = await geminiClient.generateJSON<RefractionTask>(prompt);
            if (task && task.title) {
                return {
                    ...task,
                    id: task.id || `ref-${Date.now()}`
                };
            }
            return null;
        } catch (error) {
            logger.error('[RefractionEngine] Error generating task:', error);
            return null;
        }
    }
}
