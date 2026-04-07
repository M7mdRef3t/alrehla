import { logger } from "../services/logger";
import { MirrorInsight } from './mirrorLogic';
import { geminiClient } from './geminiClient';

export interface RecoveryTask {
    id: string;
    title: string;
    description: string;
    type: 'pressure_release' | 'mirror_flash' | 'resolve';
    cognitiveWeight: number; // 0-10
}

export interface RecoveryPath {
    insightId: string;
    tasks: RecoveryTask[];
    generatedAt: number;
}

export class RecoveryEngine {
    /**
     * Generates a 3-step recovery path using Gemini.
     */
    static async generateRecoveryPath(insight: MirrorInsight): Promise<RecoveryPath | null> {
        const prompt = `
            بصفتك System Architect و خبير نفسي لمنصة "الرحلة" و "دواير". 
            لقد اكتشف السيستم تناقضاً نفسياً (Mirror Insight) لدى المستخدم:
            
            النوع: ${insight.type}
            العنوان: ${insight.title}
            الرسالة: ${insight.message}
            السؤال الوجودي: ${insight.question}
            الخطورة: ${insight.severity}

            المطلوب توليد "مسار تعافي" (Recovery Path) يتكون من 3 مهام عملية ومحددة جداً بالعامية المصرية الذكية.
            المهام يجب أن تتبع الترتيب التالي:
            1. pressure_release: مهمة سهلة جداً لتقليل القلق وفتح المجال للتفكير.
            2. mirror_flash: مهمة تواجه المستخدم بالتناقض بشكل مباشر وسريع.
            3. resolve: مهمة لاتخاذ قرار فعلي على خريطة "دواير" (نقل عقدة، أرشفتها، أو تعديل مكانها).

            الرد يجب أن يكون بتنسيق JSON فقط كالتالي:
            {
              "tasks": [
                { "type": "pressure_release", "title": "...", "description": "...", "cognitiveWeight": 2 },
                { "type": "mirror_flash", "title": "...", "description": "...", "cognitiveWeight": 7 },
                { "type": "resolve", "title": "...", "description": "...", "cognitiveWeight": 5 }
              ]
            }
        `;

        try {
            const result = await geminiClient.generateJSON<{ tasks: Omit<RecoveryTask, 'id'>[] }>(prompt);

            if (!result || !result.tasks) return null;

            return {
                insightId: insight.id,
                tasks: result.tasks.map((t, i) => ({
                    ...t,
                    id: `recovery-${insight.id}-${i}`
                })),
                generatedAt: Date.now()
            };
        } catch (error) {
            logger.error('[RecoveryEngine] Error generating path:', error);
            return null;
        }
    }
}
