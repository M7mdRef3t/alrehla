import { supabaseAdmin as supabase } from "./supabaseClient";
import { logger } from "./logger";

export interface GhostingAlert {
    name: string;
    time: string;
    status: string;
}

export interface PairingSuggestion {
    axis: string;
    users: string[];
    similarity: number;
}

/**
 * ResonanceSignalService 🌀
 * Extracts behavioral resonance signals from raw journey data.
 */
export class ResonanceSignalService {
    /** Calculates Ghosting Alerts (Inactive > 24h) */
    static async getGhostingAlerts(): Promise<GhostingAlert[]> {
        try {
            // Logic: Group journey_events by session_id, find max created_at
            // For simplicity in this implementation, we take sessions and check their status
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            const { data, error } = await supabase!
                .from("sessions")
                .select("id, client_name, created_at, status")
                .eq("status", "active")
                .lt("created_at", yesterday.toISOString())
                .limit(5);

            if (error) throw error;

            return (data || []).map(s => ({
                name: s.client_name,
                time: "24h+",
                status: "Vulnerable"
            }));
        } catch (error) {
            logger.error("[ResonanceSignal] Ghosting check failed:", error);
            return [];
        }
    }

    /** Calculates Pairing Suggestions based on session commonalities */
    static async getPairingSuggestions(): Promise<PairingSuggestion[]> {
        try {
            const { data, error } = await supabase!
                .from("sessions")
                .select("client_name, session_type")
                .limit(10);

            if (error) throw error;

            // Simple heuristic pairing: match by session_type
            const results: PairingSuggestion[] = [];
            const groups: Record<string, string[]> = {};

            (data || []).forEach(s => {
                if (!groups[s.session_type]) groups[s.session_type] = [];
                groups[s.session_type].push(s.client_name);
            });

            Object.entries(groups).forEach(([type, users]) => {
                if (users.length >= 2) {
                    results.push({
                        axis: type === 'crisis' ? "التعامل مع الألم" : "البحث عن المعنى",
                        users: [users[0], users[1]],
                        similarity: 0.85 + (Math.random() * 0.1)
                    });
                }
            });

            return results;
        } catch (error) {
            logger.error("[ResonanceSignal] Pairing check failed:", error);
            return [];
        }
    }

    /** Aggregated Resonance Stats for the Dashboard */
    static async getGlobalStats() {
        // Return mock levels for now to prevent heavy aggregation in v1
        return {
            resonanceScore: 78,
            activePairings: 12,
            ionizingStatus: false,
            ghostingRate: 5.1
        };
    }
}
