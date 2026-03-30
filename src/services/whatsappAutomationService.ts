import { createClient } from "@supabase/supabase-js";
import { upsertMarketingLead } from "../server/marketingLeadApi";
import { sanitizePhone } from "../server/marketingLeadUtils";
import type { MarketingLeadPayload } from "../types/marketingLead";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface WhatsAppWebhookPayload {
  message_id: string;
  from: string; // The customer's phone number
  to: string;   // Our business number
  body: string;
  type: string;
  timestamp: string;
  raw: unknown;
}

export class WhatsAppAutomationService {
  /**
   * Main entry point for processing an incoming WhatsApp message.
   */
  static async handleInboundMessage(payload: WhatsAppWebhookPayload) {
    console.log(`[WhatsAppService] Processing message from ${payload.from}`);

    // 1. Log the event to the database
    const { data: event, error: logError } = await supabaseAdmin
      .from("whatsapp_message_events")
      .insert({
        whatsapp_message_id: payload.message_id,
        from_phone: payload.from,
        to_phone: payload.to,
        message_body: payload.body,
        message_type: payload.type,
        direction: 'inbound',
        raw_payload: payload.raw,
        created_at: payload.timestamp
      })
      .select()
      .single();

    if (logError) {
      console.error("[WhatsAppService] Failed to log event:", logError);
    }

    // 2. Normalize and identify the lead
    const phoneResult = sanitizePhone(payload.from);
    const normalizedPhone = phoneResult?.normalized ?? null;
    if (!normalizedPhone) {
      console.error("[WhatsAppService] Invalid phone number:", payload.from);
      return;
    }

    // 3. Intent Detection (Simplified V1)
    const intent = this.detectIntent(payload.body);
    
    // 4. Sync to CRM
    const leadPayload: MarketingLeadPayload = {
      phone: payload.from,
      source: "whatsapp_auto",
      sourceType: "whatsapp",
      status: intent === "payment_requested" ? "payment_requested" : "new",
      note: `Auto-captured from WhatsApp: "${payload.body}"`,
    };

    try {
      const result = await upsertMarketingLead({
        ...leadPayload,
        phoneNormalized: normalizedPhone,
        phoneRaw: payload.from,
        source: "whatsapp_auto",
        sourceType: "whatsapp",
        utm: {},
        email: null,
        name: null
      } as any);

      // 5. Update event with lead_id and detected intent
      if (event) {
        await supabaseAdmin
          .from("whatsapp_message_events")
          .update({
            lead_id: result.lead_id,
            intent_detected: intent,
            processed_at: new Date().toISOString()
          })
          .eq("id", event.id);
      }

      console.log(`[WhatsAppService] Successfully synced lead ${result.lead_id} (Intent: ${intent})`);
    } catch (syncError) {
      console.error("[WhatsAppService] CRM Sync failed:", syncError);
    }
  }

  /**
   * Simple keyword-based intent detection.
   */
  private static detectIntent(body: string): string {
    const text = body.toLowerCase();
    
    // Keywords for payment/activation requests
    const paymentKeywords = [
      "فودافون كاش", 
      "vodafone cash", 
      "دفع", 
      "تحويل", 
      "اشتراك", 
      "تفعيل",
      "payment",
      "activate"
    ];

    if (paymentKeywords.some(k => text.includes(k))) {
      return "payment_requested";
    }

    return "general_inquiry";
  }
}
