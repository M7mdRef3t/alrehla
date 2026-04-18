import { supabaseAdmin as supabase } from "./supabaseClient";
import { logger } from "./logger";

export interface AgentCard {
    role: string;
    philosophy: string;
    owner?: string;
    version?: string;
}

export interface AgentRegistryEntry {
    id: string;
    name: string;
    capabilities: string[];
    agent_card: AgentCard;
    status: string;
}

export interface AgentMessage {
    id: string;
    from_agent_id: string;
    to_agent_id: string;
    payload: any;
    status: string;
    created_at: string;
}

/**
 * A2AHub 🤝
 * The central neural highway for Inter-Agent communication.
 */
export class A2AHub {
    /** Searches for agents with specific capabilities */
    static async discoverAgents(capability?: string): Promise<AgentRegistryEntry[]> {
        try {
            let query = supabase!.from("agent_registry").select("*");
            
            if (capability) {
                query = query.contains("capabilities", [capability]);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error("[A2AHub] Discovery failed:", error);
            return [];
        }
    }

    /** Sends a high-level request to another agent */
    static async sendMessage(fromId: string, toId: string, payload: any): Promise<AgentMessage | null> {
        try {
            const { data, error } = await supabase!
                .from("agent_messages")
                .insert({
                    from_agent_id: fromId,
                    to_agent_id: toId,
                    payload
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error("[A2AHub] Send failed:", error);
            return null;
        }
    }

    /** Retrieves the manifest of a specific agent */
    static async getAgentCard(agentName: string): Promise<AgentCard | null> {
        try {
            const { data, error } = await supabase!
                .from("agent_registry")
                .select("agent_card")
                .eq("name", agentName)
                .single();

            if (error) throw error;
            return data?.agent_card as AgentCard;
        } catch (error) {
            logger.error("[A2AHub] Card retrieval failed:", error);
            return null;
        }
    }

    /** Polling or checking for new messages for an agent */
    static async getPendingMessages(toAgentId: string): Promise<AgentMessage[]> {
        try {
            const { data, error } = await supabase!
                .from("agent_messages")
                .select("*")
                .eq("to_agent_id", toAgentId)
                .eq("status", "pending")
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error("[A2AHub] Message retrieval failed:", error);
            return [];
        }
    }
}
