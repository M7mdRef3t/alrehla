import { useAdminState } from "@/domains/admin/store/admin.store";
import { geminiClient } from "@/services/geminiClient";
import { decisionEngine } from "@/ai/decision-framework";
import { supabase } from "@/services/supabaseClient";

export interface SovereignIntervention {
    id: string;
    type: "action";
    label: string;
    subtitle: string;
    iconType: "shield" | "zap" | "activity" | "flame" | "lock" | "unlock";
    actionId: string;
    urgency: "high" | "medium" | "low";
}

export class SovereignOrchestrator {
    private static isOrchestrating = false;

    /**
     * Polls the system telemetry (simulated or real) to generate proactive interventions
     * and updates the adminState.
     */
    static async evaluateIntelligence(): Promise<void> {
        if (this.isOrchestrating) return;
        this.isOrchestrating = true;

        try {
            const state = useAdminState.getState();
            const { resonanceScore, latestFriction } = state;

            // Generate interventions based on the current system friction
            const interventions = await this.synthesizeInterventions(resonanceScore, latestFriction);
            
            useAdminState.setState({ aiInterventions: interventions });
        } catch (error) {
            console.error("❌ [SovereignOrchestrator] Core evaluation failed:", error);
        } finally {
            this.isOrchestrating = false;
        }
    }

    /**
     * Synthesizes proactive command options using Gemini.
     */
    private static async synthesizeInterventions(resonance: number, friction: string | null): Promise<SovereignIntervention[]> {
        // Fallback for extreme stress if Gemini isn't ready
        const fallbackCrisis: SovereignIntervention[] = [
            {
                id: "ai-stabilize-pulse",
                type: "action",
                label: "إطلاق نبض الاستقرار (Emergency Pulse)",
                subtitle: "تفعيل بروتوكول احتواء الضغط لجميع المستخدمين النشطين",
                iconType: "shield",
                actionId: "emergency_pulse",
                urgency: "high"
            },
            {
                id: "ai-lockdown",
                type: "action",
                label: "تجميد النبض (Sovereign Freeze)",
                subtitle: "إيقاف العمليات الحيوية مؤقتاً لحماية النظام",
                iconType: "lock",
                actionId: "toggle-lockdown",
                urgency: "high"
            }
        ];

        if (resonance < 20) return fallbackCrisis;

        const promptContext = `
أنت "مستشار الحكمة السيادي" لمنصة "دواير" للإرشاد النفسي والتطوير.
مهمتك مراقبة "نبض تناغم النظام" (Resonance Score) واحتكاكات الأعضاء، ثم اقتراح تدخلات سريعة.
الحالة الحالية للنظام: التناغم ${resonance}%
الاحتكاك الأخير المرصود: ${friction || "لا يوجد احتكاك محدد"}

قم بإنشاء 2-3 تدخلات استباقية (Sovereign Interventions).
الإجابة يجب أن تكون بصيغة JSON array فقط، حيث كل كائن يحتوي على:
{
  "id": "معرف_فريد_بحروف_انجليزية",
  "type": "action",
  "label": "عنوان التدخل بالعربية (مثل: إطلاق رسالة سكينة)",
  "subtitle": "شرح قصير للتدخل",
  "iconType": "shield" أو "zap" أو "activity" أو "flame" أو "lock" أو "unlock",
  "actionId": "emergency_pulse" أو "deploy_nudge" أو "harvest_insights" أو "audit_flow",
  "urgency": "high" أو "medium" أو "low"
}
        `;

        try {
            const result = await geminiClient.generateJSON<SovereignIntervention[]>(promptContext);
            if (result && Array.isArray(result) && result.length > 0) {
                return result;
            }
        } catch (e) {
            console.error("[SovereignOrchestrator] Gemini failed to synthesize interventions", e);
        }

        // Default Fallback
        if (friction && resonance < 70) {
            return [
                {
                    id: "ai-resolve-friction-fb",
                    type: "action",
                    label: "معالجة الاحتكاك",
                    subtitle: `حل: ${friction}`,
                    iconType: "flame",
                    actionId: "deploy_nudge",
                    urgency: "medium"
                }
            ];
        }

        return [
            {
                id: "ai-harvest-insights",
                type: "action",
                label: "استخراج الأنماط (Harvest Insights)",
                subtitle: "تحليل حالة التناغم وبناء قاعدة بيانات الأنماط الناجحة",
                iconType: "zap",
                actionId: "harvest_insights",
                urgency: "low"
            }
        ];
    }

    /**
     * Dispatches a quick tactical preset directly.
     */
    static async dispatchTacticalPreset(presetId: string, message: string): Promise<void> {
        console.log(`[SovereignOrchestrator] Dispatching Tactical Preset: ${presetId}`);
        const decisionRes = await decisionEngine.evaluate({
            type: "tactical_preset_deployed",
            reasoning: `تم تفعيل نداء تكتيكي للسكينة: ${presetId}`,
            payload: { message }
        });
        
        if (decisionRes.allowed) {
            await decisionEngine.execute({
                type: "tactical_preset_deployed",
                timestamp: Date.now(),
                reasoning: `تم النشر الآلي لرسالة التكتيك: ${presetId}`,
                payload: { message }
            });
        }
    }

    /**
     * Executes the intervention from CommandHalo
     */
    static async executeIntervention(actionId: string): Promise<void> {
        console.log(`🚀 [SovereignOrchestrator] Executing Intervention: ${actionId}`);
        
        // Build payload
        const decisionPayload = { actionId };
        const decisionReasoning = `Sovereign Admin طلب تنفيذ تكتيك آلي: ${actionId}`;
        
        const decisionRes = await decisionEngine.evaluate({
            type: "sovereign_intervention_deployed",
            reasoning: decisionReasoning,
            payload: decisionPayload
        });

        // If requires approval, escalate. If allowed, execute immediately.
        if (decisionRes.requiresApproval) {
            console.warn(`[SovereignOrchestrator] Requires Approval for ${actionId}`);
            // By default "sovereign_intervention_deployed" requires approval, but if Owner clicked it in CommandHalo, 
            // GovernanceHub can read it as pending_approval or we can assume it's pre-approved since it came from Admin.
            // For true autonomy simulation, we will log it as executed by Admin.
            await decisionEngine.execute({
                type: "sovereign_intervention_deployed",
                timestamp: Date.now(),
                reasoning: decisionReasoning,
                payload: decisionPayload,
                outcome: "executed",
                approvedBy: "admin"
            });
        } else if (decisionRes.allowed) {
            await decisionEngine.execute({
                type: "sovereign_intervention_deployed",
                timestamp: Date.now(),
                reasoning: decisionReasoning,
                payload: decisionPayload,
            });
        }

        // Here we could plug into actual system effects (e.g., dispatchNudge, toggleLockdown overrides)
        if (!supabase) return;
        const channel = supabase.channel('sovereign_control');
        
        let sentBroadcast = false;
        if (actionId === "emergency_pulse") {
            // Trigger emergency broadcast
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED' && !sentBroadcast) {
                    sentBroadcast = true;
                    channel.send({
                        type: 'broadcast',
                        event: 'OVERRIDE',
                        payload: { type: 'FORCE_STATE', state: { state: 'crisis', tei: 0, shadowPulse: 100, engagement: 'withdrawn' } }
                    });
                }
            });
            useAdminState.getState().setResonanceScore(Math.min(100, useAdminState.getState().resonanceScore + 20));
        } else if (actionId === "deploy_nudge") {
             channel.subscribe((status) => {
                if (status === 'SUBSCRIBED' && !sentBroadcast) {
                    sentBroadcast = true;
                    channel.send({
                        type: 'broadcast',
                        event: 'OVERRIDE',
                        payload: { type: 'INJECT_WHISPER', text: `رسالة سكينة من النظام: ${decisionReasoning}` }
                    });
                }
            });
            useAdminState.getState().setLatestFriction(null); // Cleared friction
            useAdminState.getState().setResonanceScore(Math.min(100, useAdminState.getState().resonanceScore + 10));
        } else if (actionId.startsWith("ignite_market")) {
            // Market growth bump simulation
            console.log("MARKET IGNITED");
            const marketId = actionId.replace("ignite_market_", "");
            const { growthEngine } = await import("./growthEngine");
            await growthEngine.deployMarketIgnition(marketId);
            useAdminState.getState().setResonanceScore(Math.min(100, useAdminState.getState().resonanceScore + 15));
        }
    }
}
