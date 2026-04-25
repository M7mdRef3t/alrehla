import { Client } from "@botpress/client";
import { runtimeEnv } from "@/config/runtimeEnv";

export interface BotpressMessagePayload {
  userId: string;
  conversationId?: string;
  text: string;
  metadata?: any;
}

/**
 * BotpressService: The Sovereign Chat Orchestrator.
 * Uses the official Botpress Client SDK for advanced automation.
 */
export class BotpressService {
  private static client: Client | null = null;

  private static getClient() {
    if (this.client) return this.client;
    
    const token = runtimeEnv.botpressToken;
    const workspaceId = runtimeEnv.botpressWorkspaceId;
    const botId = runtimeEnv.botpressBotId;

    if (!token || !workspaceId || !botId) {
      console.warn("[BotpressService] Missing configuration:", { 
        hasToken: !!token, 
        hasWorkspace: !!workspaceId, 
        hasBot: !!botId 
      });
      return null;
    }

    this.client = new Client({
      token,
      workspaceId,
      botId,
    });
    return this.client;
  }

  /**
   * Send a message to Botpress via the SDK.
   */
  static async sendMessage(payload: BotpressMessagePayload) {
    const client = this.getClient();
    if (!client) return { success: false, error: "not_configured" };

    try {
      // In Botpress Cloud SDK, we typically interact with conversations or users
      // This is a simplified version of triggering a conversation
      const { user } = await client.getOrCreateUser({
        tags: { "dawayir:id": payload.userId },
      });

      const { conversation } = await client.getOrCreateConversation({
        channel: "web",
        tags: { "dawayir:id": payload.userId },
      });

      await client.createMessage({
        conversationId: conversation.id,
        userId: user.id,
        type: "text",
        tags: {},
        payload: {
          type: "text",
          text: payload.text,
          metadata: payload.metadata
        },
      });

      return { success: true, conversationId: conversation.id };
    } catch (error) {
      console.error("[BotpressService] SDK Error:", error);
      return { success: false, error };
    }
  }

  /**
   * List conversations for a specific user.
   */
  static async listUserConversations(userId: string) {
    const client = this.getClient();
    if (!client) return [];
    
    try {
      const { conversations } = await client.listConversations({
        tags: { 'xTag': `user-${userId}` }
      });
      return conversations;
    } catch (error) {
      console.error("[BotpressService] Failed to list conversations:", error);
      return [];
    }
  }
}
