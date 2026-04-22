import { logger } from "@/services/logger";
import { supabase, isSupabaseReady } from "./supabaseClient";
import { growthEngine } from "./growthEngine";
import { decisionEngine, DecisionType, AIDecision } from "@/ai/decision-framework";
import { MarketingGatewayService } from "./marketingGatewayService";
import { OracleService } from "./oracleService";

export interface AutonomousAction {
    id: string;
    gatewayId: string;
    type: DecisionType;
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
            logger.log("🚀 Starting Sovereign Auto-Ignition Loop...");
            
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
                        type: act.type, // No cast needed
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

            // 3. Check for Incomplete Gate Sessions (Lead Recovery)
            const { data: incompleteSessions } = await supabase
                .from('gate_sessions')
                .select('*')
                .is('qualified_at', null)
                .not('phone', 'is', null)
                .gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 mins

            if (incompleteSessions && incompleteSessions.length > 0) {
                logger.log(`💡 Found ${incompleteSessions.length} incomplete sessions. Evaluating recovery...`);
                for (const session of incompleteSessions) {
                    // Logic to potentially scale energy or ignite market specifically for these
                    actions.push({
                        id: `recovery-${session.id}`,
                        gatewayId: session.source_area || 'direct',
                        type: 'ignite_market',
                        reasoning: `Incomplete session with phone captured. Recovering lead through autonomous outreach.`,
                        payload: { marketId: session.source_area, sessionId: session.id },
                        severity: "high"
                    });
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

    /**
     * Triggers an instant nudge for a hot lead that just provided their phone number.
     */
    static async triggerInstantLeadNudge(sessionId: string, phone: string) {
        if (!isSupabaseReady || !supabase) return;

        logger.log(`🔥 Hot Lead Captured: ${phone}. Triggering instant indexing...`);
        
        // Log the event to AI Decisions for later evaluation or instant outreach
        await supabase.from("dawayir_ai_decisions").insert({
            type: "instant_lead_nudge",
            timestamp: Date.now(),
            reasoning: `Lead provided phone number but session not yet qualified. Ensuring persistence and readiness for Market Ignition.`,
            payload: { sessionId, phone },
            outcome: "indexed"
        });
    }

    private static async executeAction(action: AutonomousAction) {
        logger.log(`⚡ Executing Autonomous Action: ${action.type} for ${action.gatewayId}`);

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
            logger.log(`✅ Autonomous Outcome Logged: ${decisionId}`);
        } catch (err) {
            logger.error(`Failed to execute autonomous action ${action.id}:`, err);
        }
    }
}
