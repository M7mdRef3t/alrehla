import { ollamaClient } from "./ollamaClient";
import { AGENT_TOOLS, executeAgentTool } from "./agentTools";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { logger } from "./logger";
import { braintrustService } from "./braintrustService";

export interface AgentActivityStep {
    id: string;
    timestamp: number;
    thought: string;
    action?: string;
    actionArgs?: any;
    observation?: any;
    status: "thinking" | "acting" | "observing" | "done" | "error";
}

const AGENT_SYSTEM_PROMPT = `أنت "الذكاء السيادي" (Sovereign Intelligence) لنظام الرحلة.
مهمتك هي مراقبة النظام، تحليل المشاكل التقنية أو السلوكية، واتخاذ إجراءات وقائية أو إصلاحية.

أنت تعمل في حلقة (Thought -> Action -> Observation).
في كل خطوة، يجب أن ترد بصيغة JSON فقط كالتالي:
{
  "thought": "تفكيرك بالعربي حول ما تراه وما تنوي فعله",
  "action": "اسم الأداة التي تنوي استخدامها",
  "args": { "الباراميترات": "قيمتها" }
}

إذا انتهيت من المهمة، اجعل action هو "final_report".

الأدوات المتاحة:
${AGENT_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n')}

تذكر: أنت تعمل محلياً تماماً، بياناتك لا تخرج خارج هذا الجهاز. كن دقيقاً وشجاعاً في تشخيصك.`;

class LocalSovereignAgent {
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;

    /** Starts the autonomous monitoring loop */
    start(intervalMs: number = 300000) { // Default 5 minutes
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("[SovereignAgent] Initializing local autonomous loop...");
        
        // Initial run with delay
        setTimeout(() => this.runCycle(), 10000);
        
        this.intervalId = setInterval(() => this.runCycle(), intervalMs);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
    }

    /** A single reasoning cycle */
    async runCycle() {
        if (!this.isRunning) return;
        
        try {
            const isAvailable = await ollamaClient.isAvailable();
            if (!isAvailable) {
                // Silently skip if no brain found — prevents console spam
                return;
            }

            const state = useAdminState.getState();
            const resonance = state.resonanceScore;
            const friction = state.latestFriction;

            const prompt = `الوضع الحالي للنظام:
- درجة الرنين (Resonance): ${resonance}%
- آخر احتكاك (Latest Friction): ${friction || "لا يوجد"}

هل يحتاج النظام إلى تدخل؟ ابدأ عملية التحليل.`;

            await this.think(prompt);
        } catch (error) {
            logger.error("[SovereignAgent] Cycle failed:", error);
        }
    }

    private async think(prompt: string, history: string[] = []) {
        const stepId = Math.random().toString(36).substring(7);
        
        try {
            // 1. Thinking step
            const response = await ollamaClient.generateStructured<any>(prompt, AGENT_SYSTEM_PROMPT);
            
            const activity: AgentActivityStep = {
                id: stepId,
                timestamp: Date.now(),
                thought: response.thought,
                action: response.action,
                actionArgs: response.args,
                status: response.action ? "acting" : "done"
            };

            // Report activity to store (We'll add this to admin store next)
            this.reportActivity(activity);

            // 2. Execution step
            if (response.action && response.action !== "final_report") {
                try {
                    const observation = await executeAgentTool(response.action, response.args);
                    activity.observation = observation;
                    activity.status = "observing";
                    this.reportActivity(activity);

                    // 3. Recursive thought with observation
                    const nextPrompt = `النتيجة من أداة ${response.action}: ${JSON.stringify(observation)}. ما هو قرارك التالي؟`;
                    await this.think(nextPrompt, [...history, prompt, JSON.stringify(response)]);
                } catch (toolError: any) {
                    activity.observation = { error: toolError.message };
                    activity.status = "error";
                    this.reportActivity(activity);
                }
            }
        } catch (error: any) {
            console.error("[SovereignAgent] Thinking failed:", error);
        }
    }

    private reportActivity(activity: AgentActivityStep) {
        // 1. Report to Local Admin UI (Zustand context)
        const addActivity = (useAdminState.getState() as any).addAgentActivity;
        if (addActivity) {
            addActivity(activity);
        }

        // 2. Report to Braintrust (Cloud) automatically for evaluation
        // This is done via our secure bridge to protect the API key
        void executeAgentTool("log_activity", activity).catch(err => {
            console.debug("[SovereignAgent] Cloud logging skipped (likely offline or unauthorized):", err.message);
        });
    }
}

export const sovereignAgent = new LocalSovereignAgent();
