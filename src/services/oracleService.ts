import { logger } from "@/services/logger";
import { geminiClient } from "./geminiClient";
import { Dream } from "@/types/dreams";
import { useMapState } from '@/modules/map/dawayirIndex';

export type OracleGrade = 'S' | 'A' | 'B' | 'C' | 'F' | 'Test';

export interface LeadAnalysisVerdict {
    grade: OracleGrade;
    intent: string;
    reasoning: string;
    recommendedAction: string;
    isSpam: boolean;
}

export interface SovereignInsight {
    id: string;
    type: 'truth' | 'warning' | 'opportunity';
    message: string;
    timestamp: string;
    rationale?: string;
    confidence?: number;
    tag?: string;
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
            logger.error("Oracle Dream Analysis Error:", error);
            return { 
                alignmentScore: 0.5, 
                knots: [],
                metadata: { error: "Failed to connect to Oracle" } 
            };
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

        console.log(`[OracleService] Analyzing batch of ${leads.length} leads...`);
        
        const prompt = `
      أنت الـ (Grand Oracle) لنظام "الرحلة" (Alrehla).
      مهمتك تحليل مجموعة من الـ (Marketing Leads) وتصنيفهم بناءً على رحلة المستخدم (User Journey).

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
            if (!result || Object.keys(result).length === 0) {
                console.warn("[OracleService] Gemini returned empty or null results for batch");
            } else {
                console.log(`[OracleService] Successfully analyzed ${Object.keys(result).length} leads`);
            }
            return result || {};
        } catch (error) {
            console.error("[OracleService] Lead Analysis Error:", error);
            return {};
        }
    }

    /**
     * 🔮 SOVEREIGN INSIGHTS (War Room Oracle)
     * Generates a pulse of strategic insights based on truth_vault and routing_events.
     */
    static async generateSovereignInsights(context: { 
        recentTruths: any[], 
        eventCounts: Record<string, number>,
        activeNow: number,
        behavioralFriction?: Array<{ scenario: string; avgTimeSec: number; sampleSize: number }>
    }): Promise<SovereignInsight[]> {
        const frictionSummary = context.behavioralFriction?.length 
            ? context.behavioralFriction.map(f => `${f.scenario}: ${f.avgTimeSec}s (N=${f.sampleSize})`).join(", ")
            : "No friction data available.";

        const prompt = `
      بصفتك "The Oracle" وكبير مستشاري "Dawayir Sovereign Control". 
      قم بتحليل "نبض المنصة" الحالي وتوليد 3 رؤى استراتيجية عميقة ومبنية على "المبادئ الأولى" (First Principles).

      النبض الحالي:
      - عدد المستخدمين الآن: ${context.activeNow}
      - إحصائيات الأحداث (24 ساعة): ${JSON.stringify(context.eventCounts)}
      - احتكاك السلوك (متوسط وقت البقاء في الأوهام/السيناريوهات): ${frictionSummary}
      - آخر اختراقات (Truth Vault): ${JSON.stringify(context.recentTruths.map(t => t.content))}

      المطلوب:
      توليد 3 رؤى دقيقة جداً وموجهة لمالك المنصة (محمد رسول الله) بالعامية المصرية وبأسلوب "الأوراكل" (Skeptical, Progressive, First Principles). 

      لكل رؤية، قدم:
      1. message: التوجيه الأساسي أو الملاحظة (مختصرة وقوية).
      2. rationale: تحليل "الحقيقة الكاشفة" والمنطق العميق وراء هذا التوجيه. اشرح "ليه ده بيحصل؟" و "إيه الأثر الجوهري؟" بلهجة مصرية ذكية (مثل: "الحقيقة الكاشفة يا مالك المنصة...").
      3. confidence: رقم بين 85 و 99 يمثل دقة التحليل.
      4. tag: وسم معماري بالإنجليزية يصف الحالة (مثل: Entropy Equilibrium, Cognitive Friction, Relational Gravity).
      5. type: (truth | warning | opportunity).

      رجع JSON فقط كمصفوفة:
      [
        { 
          "id": "uuid", 
          "type": "truth", 
          "message": "...", 
          "rationale": "...", 
          "confidence": 95, 
          "tag": "...",
          "timestamp": "الآن" 
        }
      ]
    `;

        try {
            const result = await geminiClient.generateJSON<SovereignInsight[]>(prompt);
            return result || [];
        } catch (error) {
            logger.error("Oracle Sovereign Insights Error:", error);
            return [];
        }
    }

    /**
     * 🔥 AUTO-IGNITION (Oracle Sovereign Control)
     * Strategically evaluates platforms and directs budgets or defensive lockdowns.
     */
    static async evaluateGatewayAutoIgnition(gateways: any[], diffusion: any): Promise<any[]> {
        const prompt = `
      أنت "The Oracle" تتحكم مركزياً في ميزانيات منصة الدواير عبر بوابات التسويق (Gateways).

      وضعية المسارات حالياً:
      ${JSON.stringify(gateways.map(g => ({
          name: g.name,
          id: g.id,
          status: g.status,
          energy_level: g.energy_level,
          actual_spend: g.actual_spend,
          auto: g.auto_ignition_enabled
      })), null, 2)}

      نبض الرنين والسيولة (Diffusion Health):
      ${JSON.stringify(diffusion.gatewayHealth, null, 2)}

      المطلوب:
      تحديد إجراءات "Sovereign Control" حاسمة بناءً على المباديء الأولى (First Principles):
      1. إذا كانت الطاقة (الصرف) عالية، لكن "Resonance" منخفض جداً، فهذا هدر -> اطلب تقليل الطاقة (scale_energy).
      2. إذا كانت الطاقة منخفضة، و Resonance منعدم تماماً -> إغلاق دفاعي تام (lock_gateway).
      3. إذا كان الـ Resonance عالياً بشكل استثنائي والطاقة متوفرة -> إشعال استراتيجي (ignite_market).
      4. أي تجاوز صريح للميزانية (actual_spend > spend) -> تدخّل فوري للتقليل.

      الـ JSON المنشود هو مصفوفة من القرارات، كل قرار له هيكل:
      [{
        "gatewayId": string,
        "type": "ignite_market" | "lock_gateway" | "scale_energy" | "notify_admin",
        "reasoning": string (تحليل استراتيجي بالعامية المصرية),
        "payload": object (ex: { "energy_level": 10 } or { "status": "locked" }),
        "severity": "low" | "medium" | "high"
      }]

      قم بتوليد قرارات للمسارات التي تحتاج تدخل (وأخرى لا تحتاج لا تذكرها).
    `;

        try {
            const actions = await geminiClient.generateJSON<any[]>(prompt);
            return Array.isArray(actions) ? actions : [];
        } catch (error) {
            logger.error("Oracle Auto-Ignition Evaluation Error:", error);
            return [];
        }
    }
}
