import { logger } from "@/services/logger";
import { supabase, isSupabaseReady } from "./supabaseClient";
import { geminiClient } from "./geminiClient";

export interface Memory {
    id: number;
    content: string;
    type: "conversation" | "journal" | "fact";
    similarity?: number;
    created_at: string;
}

export class MemoryStore {
    /**
     * Store a new memory in the vector database
     */
    static async storeMemory(content: string, type: "conversation" | "journal" | "fact", userId: string): Promise<boolean> {
        if (!isSupabaseReady) return false;

        // 1. Generate Embedding
        const embedding = await geminiClient.embedText(content);
        if (!embedding) return false;

        // 2. Save to Supabase
        const { error } = await supabase!.from("memories").insert({
            content,
            type,
            user_id: userId,
            embedding
        });

        if (error) {
            logger.error("Error storing memory:", error);
            return false;
        }
        return true;
    }

    /**
     * Recall relevant memories based on a query
     */
    static async recallMemories(query: string, userId: string, limit = 5): Promise<Memory[]> {
        if (!isSupabaseReady) return [];

        // 1. Generate Embedding for the query
        const embedding = await geminiClient.embedText(query);
        if (!embedding) return [];

        // 2. Call the RPC function (match_memories)
        const { data, error } = await supabase!.rpc("match_memories", {
            query_embedding: embedding,
            match_threshold: 0.7, // 70% similarity
            match_count: limit,
            p_user_id: userId
        });

        if (error) {
            logger.error("Error recalling memories:", error);
            return [];
        }

        return data as Memory[];
    }

    /**
     * Format memories for injection into System Prompt
     */
    static formatMemoriesForPrompt(memories: Memory[]): string {
        if (memories.length === 0) return "";

        return `
### 🧠 Active Memory Recall (Relevant Past Context):
${memories.map(m => `- [${m.type.toUpperCase()}] ${m.content} (Sim: ${Math.round((m.similarity || 0) * 100)}%)`).join("\n")}
`;
    }
}
