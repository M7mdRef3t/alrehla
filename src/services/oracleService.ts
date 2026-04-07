import { logger } from "../services/logger";
import { geminiClient } from "./geminiClient";
import { Dream, Knot } from "../types/dreams";
import { useMapState } from "../state/mapState";

/**
 * 🔮 THE ORACLE (OracleService)
 * Autonomous AI integration for analyzing dreams and detecting "Knots".
 * Implements the system's "Self-Correction" logic.
 */
export class OracleService {
    /**
     * Analyzes a dream proposal using Gemini.
     */
    static async analyzeDream(title: string, description: string = ""): Promise<Partial<Dream>> {
        // 1. Gather Context (Current Knots/Vampires in consciousness graph)
        const nodes = useMapState.getState().nodes;
        const currentKnotsSummary = nodes
            .filter(n => (n.analysis && n.analysis.score > 4) || n.ring === 'red')
            .map(n => `NodeID: ${n.id}, Label: ${n.label}, Ring: ${n.ring}, Diagnosis: ${n.analysis?.insights?.diagnosisSummary || 'Relationship friction'}`)
            .join("\n");

        const prompt = `
      أنت "الأوراكل" (The Oracle) ومحلل النظم الخبير في منصة الرحلة. 
      مهمتك هي إجراء "Cross-System Scan" لربط أحلام المستخدم بحالته العلائقية (دواير).

      خريطة الوعي الحالية (People/Nodes):
      ${currentKnotsSummary || 'No high-friction nodes detected.'}

      الحلم المقترح:
      العنوان: ${title}
      الوصف: ${description}

      المطلوب (First Principles Analysis):
      1. اكتشف الـ "عُقد" (Knots) التي تعيق هذا الحلم.
      2. حدد إذا كان هناك أشخاص (Nodes) معينين يمثلون "مصاصي طاقة" (Energy Vampires) لهذا الحلم تحديداً بناءً على أسمائهم أو التشخيص المرتبط بهم.
      3. حدد "درجة التوافق" (Alignment Score) بين 0 و1.

      رجع الإجابة بتنسيق JSON فقط كالتالي:
      {
        "alignmentScore": number,
        "knots": [
          { "label": string, "severity": number (1-10), "type": "psychological" | "physical", "description": string }
        ],
        "relatedNodeIds": string[] (IDs of people from the map that are blocking this dream),
        "momentumTasks": [
          { "id": string, "label": string (بالعامية المصرية، مهمة تافهة جداً جداً), "dopamineWeight": number (1-10), "isCompleted": false }
        ],
        "analysisSummary": string (بالعامية المصرية، وضح الرابط بين الهدف وبين الشخص المعطل له ببساطة),
        "status": "DREAMING" | "IN_FLIGHT"
      }
    `;

        try {
            const result = await geminiClient.generateJSON<Partial<Dream> & { analysisSummary: string }>(prompt);
            if (!result) throw new Error("Oracle failed to generate insight");

            // Merge AI insights with default dream structure
            return {
                ...result,
                metadata: {
                    oracleInsight: result.analysisSummary,
                    analyzedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error("Oracle Analysis Error:", error);
            return {
                alignmentScore: 0.5,
                knots: [],
                metadata: { error: "Failed to connect to Oracle" }
            };
        }
    }
}
