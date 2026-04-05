import { createClient } from "@supabase/supabase-js";
import { upsertMarketingLead } from "../server/marketingLeadApi";
import { sanitizePhone } from "../server/marketingLeadUtils";
import type { MarketingLeadPayload } from "../types/marketingLead";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

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
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn("[WhatsAppService] Supabase not configured. Skipping inbound persistence.");
      return;
    }

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
    
    // 4. CRM Integration: Sync as Marketing Lead
    const leadPayload: MarketingLeadPayload = {
      phone: payload.from,
      source: "whatsapp_auto",
      sourceType: "whatsapp",
      status: intent === "payment_requested" ? "payment_requested" : "engaged",
      note: `[WhatsApp Auto] "${payload.body}" | Intent: ${intent}`,
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
        name: null,
        intent: intent
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

      // 6. Send Auto-Reply based on Intent
      let replyMessage = "";
      switch (intent) {
        case "payment_requested":
          replyMessage = "أهلاً بك في الرحلة! ✨\nلتفعيل حسابك المدفوع، يُرجى تحويل قيمة الاشتراك عبر فودافون كاش أو إنستا باي، ثم إرسال صورة التحويل (سكرين شوت) هنا، وسنقوم بتفعيل حسابك فوراً.";
          break;
        case "support_needed":
          replyMessage = "نحن هنا لمساعدتك! 🛠️\nتم تسجيل طلبك وسيقوم فريق الدعم بمراجعته. هل يمكنك توضيح المشكلة بتفاصيل أكثر لنتمكن من حلها سريعاً؟";
          break;
        case "general_inquiry":
        default:
          replyMessage = "أهلاً بك في منصة الرحلة! 🧭\nلقد استلمنا رسالتك وسنقوم بالرد عليك في أقرب وقت. إذا كنت ترغب في الاشتراك أو لديك استفسار محدد، تفضل بكتابته.";
          break;
      }

      // Send the reply in the background
      await this.sendReply(payload.from, replyMessage);

    } catch (syncError) {
      console.error("[WhatsAppService] CRM Sync failed:", syncError);
    }
  }

  /**
   * Send a reply message using UltraMsg API
   */
  private static async sendReply(to: string, text: string) {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
      console.warn("[WhatsAppService] UltraMsg credentials missing. Skipping auto-reply.");
      return;
    }

    try {
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const data = new URLSearchParams();
      data.append('token', token);
      data.append('to', to);
      data.append('body', text);
      data.append('priority', '10');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      });

      if (!response.ok) {
        console.error(`[WhatsAppService] Failed to send reply. Status: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log(`[WhatsAppService] Sent reply to ${to}:`, result.sent === "true" ? "Success" : result);
    } catch (error) {
      console.error("[WhatsAppService] Error sending reply:", error);
    }
  }

  /**
   * Simple keyword-based intent detection for Egyptian market.
   */
  private static detectIntent(body: string): string {
    const text = body.toLowerCase();
    
    // Keywords for payment/activation requests (Egyptian Ammiya focus)
    const paymentKeywords = [
      "فودافون كاش", "فودافون", "كاش", "vodafone cash", "vodafone",
      "دفع", "تحويل", "اشتراك", "تفعيل", "بكم", "سعر", "فلوس",
      "payment", "activate", "price", "how much", "subscribe"
    ];

    // Keywords for support/technical issues
    const supportKeywords = [
      "مشاكل", "عطل", "مش عارف", "مستحيل", "ساعدني", "تواصل",
      "support", "help", "contact", "issue", "bug"
    ];

    if (paymentKeywords.some(k => text.includes(k))) {
      return "payment_requested";
    }

    if (supportKeywords.some(k => text.includes(k))) {
      return "support_needed";
    }

    return "general_inquiry";
  }
}
