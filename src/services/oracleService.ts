import { geminiClient } from "./geminiClient";
import { Dream } from "../types/dreams";
import { useMapState } from "../state/mapState";

export type OracleGrade = 'S' | 'A' | 'B' | 'C' | 'F' | 'Test';

export interface LeadAnalysisVerdict {
    grade: OracleGrade;
    intent: string;
    reasoning: string;
    recommendedAction: string;
    isSpam: boolean;
}

/**
 * 🔮 THE ORACLE (OracleService)
 * Autonomous AI integration for analyzing dreams and leads.
 * Implements the system's "Self-Correction" and "Strategic Intelligence" logic.
 */
export class OracleService {
    /**
     * Analyzes a dream proposal using Gemini.
     */
    static async analyzeDream(title: string, description: string = ""): Promise<Partial<Dream>> {
        const nodes = useMapState.getState().nodes;
        const currentKnotsSummary = nodes
            .filter(n => (n.analysis && n.analysis.score > 4) || n.ring === 'red')
            .map(n => `NodeID: ${n.id}, Label: ${n.label}, Ring: ${n.ring}, Diagnosis: ${n.analysis?.insights?.diagnosisSummary || 'Relationship friction'}`)
            .join("\n");

        const prompt = `
      أنت "الأوراكل" (The Oracle) ومحلل النظم الخبير في منصة الرحلة. 
      مهمتك هي ربط أحلام المستخدم بحالته العلائقية.

      الخريطة الحالية:
      ${currentKnotsSummary || 'No high-friction nodes detected.'}

      الحلم: ${title} (${description})

      المطلوب:
      1. اكتشف الـ "عُقد" (Knots) المعطلة.
      2. حدد "مصاصي الطاقة" (Energy Vampires) من الخريطة.
      3. حدد "درجة التوافق" (0-1).

      رجع JSON فقط:
      {
        "alignmentScore": number,
        "knots": [{ "label": string, "severity": number, "type": string, "description": string }],
        "relatedNodeIds": string[],
        "analysisSummary": string (بالعامية المصرية وببساطة),
        "momentumTasks": [{ "label": string, "dopamineWeight": number }]
      }
    `;

        try {
            const result = await geminiClient.generateJSON<any>(prompt);
            return {
                ...result,
                metadata: { oracleInsight: result?.analysisSummary, analyzedAt: new Date().toISOString() }
            };
        } catch (error) {
            console.error("Oracle Dream Analysis Error:", error);
            return { alignmentScore: 0.5, metadata: { error: "Failed to connect to Oracle" } };
        }
    }

    /**
     * 👁️ SOUL ANALYSIS (Oracle Intelligence)
     * Grades a batch of leads based on metadata, notes, and activity.
     */
    static async analyzeLeadBatch(leads: any[]): Promise<Record<string, LeadAnalysisVerdict>> {
        const leadData = leads.map(l => ({
            id: l.id,
            name: l.name,
            email: l.email,
            source: l.source_type,
            notes: l.note,
            campaign: l.campaign,
            activity: {
                has_converted: l.has_converted,
                has_deep_converted: l.has_deep_converted,
                email_status: l.email_status
            }
        }));

        const prompt = `
      بصفتك "The Oracle"، قم بتحليل جودة "الأرواح" (Leads) التالية في منصة الدواير. 

      المعطيات:
      ${JSON.stringify(leadData, null, 2)}

      قواعد التصنيف (Soul Grading Policies):
      - S: (Converged) - ولّد خريطة فعلياً (Deep Conversion).
      - A: (Resonant) - متفاعل جداً، ضغط على لينكات لكن مكملش.
      - B: (Engaged) - بيفتح رسايل الإيميل بانتظام.
      - C: (Signal) - ليد جديد لسة نيتهم مش واضحة.
      - F: (Noise) - ليد وهمي، بيانات عشوائية، أو "تست".

      المطلوب لكل ليد:
      1. حدد الـ Grade.
      2. حلل الـ Intent (باحث، معالج، فضولي، إلخ).
      3. اكتب تبرير (Reasoning) بالعامية المصرية.
      4. اقترح إجراء (Action).

      رجع الإجابة كـ JSON Objects بمفتاح هو الـ ID:
      {
        "LEAD_ID": {
          "grade": "S" | "A" | "B" | "C" | "F",
          "intent": string,
          "reasoning": string,
          "recommendedAction": string,
          "isSpam": boolean
        }
      }
    `;

        try {
            const result = await geminiClient.generateJSON<Record<string, LeadAnalysisVerdict>>(prompt);
            return result || {};
        } catch (error) {
            console.error("Oracle Lead Analysis Error:", error);
            return {};
        }
    }
}
