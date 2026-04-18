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

      // 3. Log to whatsapp_message_events
      await this.logMessage({
        lead_id: leadId,
        whatsapp_message_id: result.messages?.[0]?.id,
        from_phone: process.env.META_WA_BUSINESS_PHONE_NUMBER || "system",
        to_phone: cleanPhone,
        message_body: `Template: ${templateName}`,
        message_type: "template",
        direction: "outbound"
      });

      // If sent, we mark as pending_verification (waiting for Delivery Webhook)
      await this.updateLeadWhatsAppStatus(leadId, "pending");
      
      return { success: true, message_id: result.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsAppCloud] Internal Error:", error);
      return { success: false, error };
    }
  }

  /**
   * Sends a template message with optional parameters.
   */
  static async sendTemplateMessage(
    phone: string, 
    leadId: string, 
    templateName: string, 
    params: string[] = []
  ): Promise<WhatsAppValidationResult> {
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return { success: false, error: "missing_credentials" };
    }

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

      const components = params.length > 0 ? [{
        type: "body",
        parameters: params.map(p => ({ type: "text", text: p }))
      }] : [];

      const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "ar" },
          components: components.length > 0 ? components : undefined
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("[WhatsAppCloud] Template Error:", result);
        return { success: false, error: result.error };
      }

      await this.logMessage({
        lead_id: leadId,
        whatsapp_message_id: result.messages?.[0]?.id,
        from_phone: process.env.META_WA_BUSINESS_PHONE_NUMBER || "system",
        to_phone: cleanPhone,
        message_body: `Template: ${templateName} | Params: ${params.join(", ")}`,
        message_type: "template",
        direction: "outbound"
      });

      return { success: true, message_id: result.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsAppCloud] Template Internal Error:", error);
      return { success: false, error };
    }
  }

  /**
   * Sends a free-form text message to a phone number.
   * Requires an active 24-hour window from the customer.
   */
  static async sendFreeText(phone: string, leadId: string, text: string): Promise<WhatsAppValidationResult> {
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return { success: false, error: "missing_credentials" };
    }

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { body: text }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("[WhatsAppCloud] FreeText Error:", result);
        return { success: false, error: result.error };
      }

      // Log the outbound message
      await this.logMessage({
        lead_id: leadId,
        whatsapp_message_id: result.messages?.[0]?.id,
        from_phone: process.env.META_WA_BUSINESS_PHONE_NUMBER || "system",
        to_phone: cleanPhone,
        message_body: text,
        message_type: "text",
        direction: "outbound"
      });

      return { success: true, message_id: result.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsAppCloud] FreeText Internal Error:", error);
      return { success: false, error };
    }
  }

  /**
   * Internal helper to log messages to the database
   */
  private static async logMessage(data: {
    lead_id: string;
    whatsapp_message_id: string;
    from_phone: string;
    to_phone: string;
    message_body: string;
    message_type: string;
    direction: "inbound" | "outbound";
    raw_payload?: any;
  }) {
    const supabaseAdmin = await this.getAdminClient();
    await supabaseAdmin
      .from("whatsapp_message_events")
      .insert([data]);
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
      .eq("id", leadId)
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
      .eq("id", leadId);
      
    console.log(`[WhatsAppCloud] Lead ${leadId} status updated to: ${status}`);
  }
}

