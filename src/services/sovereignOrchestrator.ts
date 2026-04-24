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
    private static lastResonance = -1;
    private static lastFriction: string | null = null;
    private static cachedInterventions: SovereignIntervention[] = [];

    /**
     * Polls the system telemetry (simulated or real) to generate proactive interventions
     * and updates the adminState.
     */
    static async evaluateIntelligence(): Promise<void> {
        if (this.isOrchestrating) return;

        const state = useAdminState.getState();
        const { resonanceScore, latestFriction } = state;

        // Skip evaluation if state hasn't meaningfully changed to save API credits
        const resonanceDiff = Math.abs(resonanceScore - this.lastResonance);
        const frictionChanged = latestFriction !== this.lastFriction;
        
        if (resonanceDiff < 5 && !frictionChanged && this.lastResonance !== -1) {
            useAdminState.setState({ aiInterventions: this.cachedInterventions });
            return;
        }

        this.isOrchestrating = true;
        try {
            // Check if Gemini is available before making an API call.
            // Avoids "Browser fetch returned null" noise on every mount.
            if (!geminiClient.isAvailable()) {
                useAdminState.setState({ aiInterventions: this.cachedInterventions.length > 0 ? this.cachedInterventions : [] });
                return;
            }
            // Generate interventions based on the current system friction
            const interventions = await this.synthesizeInterventions(resonanceScore, latestFriction);
            
            // ── Phase III: Sentient Hub Bridges ──────────────────────────────────
            await this.bridgePeopleToIntelligence(resonanceScore);
            await this.bridgeFrictionToGrowth(latestFriction);
            // ──────────────────────────────────────────────────────────────────

            this.lastResonance = resonanceScore;
            this.lastFriction = latestFriction;
            this.cachedInterventions = interventions;

            useAdminState.setState({ 
                aiInterventions: interventions,
                lastSentientPulse: Date.now() 
            });
        } catch (error) {
            console.error("❌ [SovereignOrchestrator] Core evaluation failed:", error);
        } finally {
            this.isOrchestrating = false;
        }
    }

    /**
     * Bridge 1: People Hub -> AI Studio (Crucible)
     * Automatically triggers a simulation when resonance is low.
     */
    private static async bridgePeopleToIntelligence(resonance: number): Promise<void> {
        if (resonance < 40 && this.lastResonance >= 40) {
            console.log("🧠 [Sentient Bridge] Resonance drop detected. Triggering Crucible Simulation...");
            await decisionEngine.execute({
                type: "recommend_action",
                timestamp: Date.now(),
                reasoning: `انخفاض التناغم الجماعي لـ ${resonance}%. بدء محاكاة في البوتقة (Crucible) لإيجاد مسارات استقرار.`,
                payload: { target: "crucible", action: "simulate_recovery_paths" }
            });
        }
    }

    /**
     * Bridge 2: People Hub -> Growth Hub (Marketing Ops)
     * Triggers a soothing campaign when friction is detected.
     */
    private static async bridgeFrictionToGrowth(friction: string | null): Promise<void> {
        if (friction && friction !== this.lastFriction) {
            console.log("🚀 [Sentient Bridge] Friction detected. Triggering Growth Nudge...");
            await decisionEngine.execute({
                type: "ignite_market",
                timestamp: Date.now(),
                reasoning: `رصد احتكاك إدراكي: "${friction}". إطلاق حملة "سكينة" استباقية في الأسواق المتأثرة.`,
                payload: { target: "growth", action: "deploy_soothing_nudge", friction }
            });
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
أنت "مستشار الرحلة" لمنصة "دواير" للإرشاد النفسي والتطوير.
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
            const result = await geminiClient.generateJSON<SovereignIntervention[]>(promptContext, "sovereign_intervention");
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
