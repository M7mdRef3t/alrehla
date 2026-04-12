import { logger } from "@/services/logger";
import { supabase, isSupabaseReady } from "./supabaseClient";
import { growthEngine } from "./growthEngine";
import { decisionEngine, DecisionType, AIDecision } from "@/ai/decision-framework";
import { MarketingGatewayService } from "./marketingGatewayService";
import { OracleService } from "./oracleService";

export interface AutonomousAction {
    id: string;
    gatewayId: string;
    type: "ignite_market" | "lock_gateway" | "scale_energy" | "notify_admin";
    reasoning: string;
    payload: any;
    severity: "low" | "medium" | "high";
}

export class MarketingAutomationService {
    /**
     * The core autonomous loop: Evaluates all gateways and takes actions.
     */
    static async processAutonomousDecisions(): Promise<AutonomousAction[]> {
        if (!isSupabaseReady || !supabase) return [];

        try {
            logger.info("🚀 Starting Sovereign Auto-Ignition Loop...");
            
            // 1. Get current state
            const [gateways, diffusion] = await Promise.all([
                MarketingGatewayService.getGateways(),
                growthEngine.getDiffusionMetrics()
            ]);

            const actions: AutonomousAction[] = [];

            // Let the Oracle AI evaluate the landscape autonomously based on first principles
            const oracleActions = await OracleService.evaluateGatewayAutoIgnition(
                gateways.filter(g => g.auto_ignition_enabled), 
                diffusion
            );

            // Filter actions mapped to explicit decision types and pipe through the Decision Framework
            for (const act of oracleActions) {
                // Ensure only auto-enabled gateways are targeted
                const targetGw = gateways.find(g => g.id === act.gatewayId);
                if (!targetGw || !targetGw.auto_ignition_enabled) continue;

                // Create standard payload
                const decision: Omit<AIDecision, "timestamp"> = {
                    type: act.type as DecisionType,
                    reasoning: act.reasoning,
                    payload: { ...act.payload, gatewayId: act.gatewayId }
                };

                // Request evaluation from the sovereign decision engine
                const evaluation = await decisionEngine.evaluate(decision);
                
                if (evaluation.allowed) {
                    const mappedAction: AutonomousAction = {
                        id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        gatewayId: act.gatewayId,
                        type: act.type as any, // mapping
                        reasoning: act.reasoning,
                        payload: act.payload,
                        severity: act.severity || "medium"
                    };
                    actions.push(mappedAction);
                } else if (evaluation.requiresApproval) {
                    await decisionEngine.requestApproval({ ...decision, timestamp: Date.now() });
                } else {
                    logger.warn(`[Auto-Ignition] Oracle action forbidden: ${evaluation.reason}`);
                }
            }

            // 2. Execute & Log Actions (Only the fully allowed ones)
            for (const action of actions) {
                await this.executeAction(action);
            }

            return actions;
        } catch (error) {
            logger.error("Auto-Ignition Loop Error:", error);
            return [];
        }
    }

    private static async executeAction(action: AutonomousAction) {
        logger.info(`⚡ Executing Autonomous Action: ${action.type} for ${action.gatewayId}`);

        try {
            // A. Update Gateway State
            if (action.type === "lock_gateway") {
                await MarketingGatewayService.updateGateway(action.gatewayId, { status: "locked" });
            } else if (action.type === "scale_energy") {
                await MarketingGatewayService.updateGateway(action.gatewayId, { energy_level: action.payload.energy_level });
            } else if (action.type === "ignite_market") {
                await growthEngine.deployMarketIgnition(action.payload.marketId);
            }

            // B. Log to AI Decisions Table
            const decisionId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await supabase?.from("dawayir_ai_decisions").insert({
                id: decisionId,
                type: action.type,
                timestamp: Date.now(),
                reasoning: action.reasoning,
                payload: action.payload,
                outcome: "executed",
                executed_at: Date.now()
            });

            // C. Pulse Notification (Simulated for Now)
            logger.info(`✅ Autonomous Outcome Logged: ${decisionId}`);
        } catch (err) {
            logger.error(`Failed to execute autonomous action ${action.id}:`, err);
        }
    }
}
