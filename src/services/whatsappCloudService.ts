import { getSupabaseAdminClient } from "../../app/api/_lib/supabaseAdmin";

export interface WhatsAppValidationResult {
  success: boolean;
  message_id?: string;
  error?: any;
}

/**
 * WhatsApp Cloud Service (Meta Official)
 * Handles outbound validation messages (Handshakes) and metadata updates.
 */
export class WhatsAppCloudService {
  private static async getAdminClient() {
    const client = getSupabaseAdminClient();
    if (!client) throw new Error("missing_supabase_config");
    return client;
  }

  /**
   * Sends a handshake template message to a phone number.
   * This acts as a validator: if the number exists on WhatsApp, Meta sends it.
   * If not, it returns an error 131009.
   */
  static async validateNumber(phone: string, leadId: string): Promise<WhatsAppValidationResult> {
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WA_ACCESS_TOKEN;
    const templateName = process.env.META_WA_HANDSHAKE_TEMPLATE || "alrehla_welcome_handshake";

    if (!phoneNumberId || !accessToken) {
      console.warn("[WhatsAppCloud] Meta credentials missing. Skipping validation.");
      return { success: false, error: "missing_credentials" };
    }

    try {
      // 1. Sanitize phone (remove + and leading zeros for Meta API)
      const cleanPhone = phone.replace(/\D/g, "");

      // 2. Call Meta Cloud API
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "ar" },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Meta Error 131009 means number is NOT on WhatsApp
        const errorCode = result.error?.code;
        if (errorCode === 131009) {
          await this.updateLeadWhatsAppStatus(leadId, "invalid");
        }
        console.error("[WhatsAppCloud] Meta API Error:", result);
        return { success: false, error: result.error };
      }

      // If sent, we mark as pending_verification (waiting for Delivery Webhook)
      await this.updateLeadWhatsAppStatus(leadId, "pending");
      
      return { success: true, message_id: result.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsAppCloud] Internal Error:", error);
      return { success: false, error };
    }
  }

  /**
   * Updates the lead metadata with the WhatsApp status.
   */
  static async updateLeadWhatsAppStatus(leadId: string, status: "pending" | "verified" | "invalid") {
    const supabaseAdmin = await this.getAdminClient();
    
    // We fetch current metadata first to avoid overwriting other fields
    const { data: lead } = await supabaseAdmin
      .from("marketing_leads")
      .select("metadata")
      .eq("lead_id", leadId)
      .single();

    const existingMetadata = lead?.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      whatsapp_status: status,
      whatsapp_validated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from("marketing_leads")
      .update({ metadata: updatedMetadata })
      .eq("lead_id", leadId);
      
    console.log(`[WhatsAppCloud] Lead ${leadId} status updated to: ${status}`);
  }
}
