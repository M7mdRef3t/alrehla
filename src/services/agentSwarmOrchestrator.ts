import { getGeminiClient } from "@/lib/gemini/shared";
import { A2AHub } from "./A2AHub";
import { MCPBridge } from "./MCPBridge";
import { logger } from "./logger";

export interface SwarmExecutionResult {
    success: boolean;
    process: {
        step: string;
        agent: string;
        payload: any;
    }[];
    finalJourney: string;
    error?: string;
}

/**
 * Agent Swarm Orchestrator (A2A + MCP)
 * Orchestrates a 3-agent chain: Consciousness -> BigQuery -> Journey
 */
export class AgentSwarmOrchestrator {
    
    /**
     * Executes the full swarm workflow for a given user profile/stats
     */
    static async executeSwarm(userId: string, userLogs: string[]): Promise<SwarmExecutionResult> {
        const processLog: { step: string; agent: string; payload: any }[] = [];
        
        try {
            const genAI = getGeminiClient();
            if (!genAI) throw new Error("Gemini Client not available. Swarm requires LLM cortex.");
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.3 } });

            // ─── AGENT 1: Consciousness Analyst ───
            processLog.push({ step: "1. Initialization", agent: "ConsciousnessAgent", payload: "Starting Consciousness Scan" });
            
            const consciousnessPrompt = `أنت ConsciousnessAgent. حلل هذه السلوكيات واستخرج 3 أنماط رئيسية.
السلوكيات:
${userLogs.join("\n")}
أعد JSON فقط بهذا الشكل:
{ "patterns": ["نمط 1", "نمط 2", "نمط 3"], "overall_state": "وصف قصير" }`;
            
            const cRes = await model.generateContent(consciousnessPrompt);
            const cText = cRes.response.text() || "{}";
            const cData = JSON.parse(cText.replace(/```json/g, '').replace(/```/g, '').trim());
            
            // A2A Hub Communication (Agent 1 -> Agent 2)
            await A2AHub.sendMessage("agent_consciousness", "agent_data_miner", cData);
            processLog.push({ step: "2. Analysis Complete", agent: "ConsciousnessAgent", payload: cData });

            // ─── AGENT 2: Data Miner (BigQuery MCP Plugin) ───
            processLog.push({ step: "3. Mining BigQuery", agent: "BigQueryAgent", payload: `Querying for patterns: ${cData.patterns?.join(', ')}` });
            
            // Agent 2 asks MCP bridge for BigQuery Context
            const mcpContext = await MCPBridge.getContext({
                provider: "google",
                service: "bigquery",
                args: { search_patterns: cData.patterns, user_id: userId }
            });
            
            const minerData = {
                extracted_patterns: cData.patterns,
                historical_cohort_insights: mcpContext
            };

            // A2A Hub Communication (Agent 2 -> Agent 3)
            await A2AHub.sendMessage("agent_data_miner", "agent_journey_architect", minerData);
            processLog.push({ step: "4. BigQuery Mining Complete", agent: "BigQueryAgent", payload: mcpContext });

            // ─── AGENT 3: Journey Architect ───
            processLog.push({ step: "5. Journey Architecting", agent: "JourneyAgent", payload: "Generating personalized exercise based on data" });
            
            const journeyModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { temperature: 0.7 } });
            const journeyPrompt = `أنت JourneyAgent. استخدم هذه البيانات المعرفية والتحليلية لاقتراح تمرين عملي واحد (رحلة مصغرة) مخصص للمستخدم:
الأنماط: ${JSON.stringify(cData.patterns)}
بيانات البيانات الضخمة (BigQuery Insights - Cohort): ${JSON.stringify(mcpContext)}

أعد الرد كنص مارك داون إبداعي للمستخدم، يحمل تمرين واحد واضح يمكنه القيام به الآن لحل الاستنزاف المرصود.`;

            const jRes = await journeyModel.generateContent(journeyPrompt);
            const journeyText = jRes.response.text() || "عذراً، الأوركسترا لم تتمكن من بناء التمرين.";

            processLog.push({ step: "6. Journey Finalized", agent: "JourneyAgent", payload: "Exercise Generated" });

            return {
                success: true,
                process: processLog,
                finalJourney: journeyText
            };

        } catch (error: any) {
            logger.error("[SwarmOrchestrator] Execution failed:", error);
            return {
                success: false,
                process: processLog,
                finalJourney: "",
                error: error?.message || "Unknown error"
            };
        }
    }
}
