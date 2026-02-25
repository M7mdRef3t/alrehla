import { supabase } from "./supabaseClient";
import { dynamicContextRouter } from "./dynamicContextRouter";

export interface QueueItem {
    id: string;
    userId: string;
    actionType: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'dlq';
    retryCount: number;
    lastError?: string;
}

class AwarenessQueueService {
    /**
     * Pushes an event to the persistent queue.
     * The Database Webhook trigger will handle the actual processing (Push model).
     */
    async dispatchToQueue(payload: any): Promise<boolean> {
        console.log("📥 [QueueService] Event acknowledged and pushed to DB:", payload.actionType);

        if (!supabase) {
            console.error("❌ [QueueService] Supabase client not initialized.");
            return false;
        }

        try {
            // Real Supabase Insert
            const { error } = await supabase
                .from('awareness_events_queue')
                .insert([{
                    user_id: payload.userId || 'session-user',
                    action_type: payload.actionType,
                    payload: payload.data,
                    status: 'pending'
                }]);

            if (error) throw error;

            console.log("🚀 [QueueService] Push triggered via DB Webhook.");
            return true;
        } catch (error) {
            console.error("❌ [QueueService] Failed to push to queue:", error);
            // Fallback for UI continuity
            return false;
        }
    }
}

export const awarenessQueueService = new AwarenessQueueService();
