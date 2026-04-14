import { getSupabaseAdminClient } from '../../app/api/_lib/supabaseAdmin';
import { WhatsAppCloudService } from './whatsappCloudService';

export interface WhatsAppMessagePayload {
  from: string;
  name?: string;
  text: string;
  timestamp: string;
  messageId: string;
  metadata?: any;
  gateway?: 'meta' | 'ultramsg' | 'other';
}

export type WhatsAppIntent = 'payment_requested' | 'info_requested' | 'support_needed' | 'generic' | 'spam';

class WhatsAppAutomationService {
  private readonly paymentKeywords = ['اشتراك', 'اشترك', 'سعر', 'سعر الاشتراك', 'بكام', 'ادفع', 'دفع', 'تحويل', 'فودافون كاش', 'باقة', 'سعر الرحلة', 'حجز'];
  private readonly infoKeywords = ['تفاصيل', 'معلومات', 'ايه ده', 'بتعملوا ايه', 'ازاي', 'شرح', 'فهموني'];

  /**
   * Normalize phone number to E.164 format or similar consistent format
   */
  normalizePhoneNumber(phone: string): string {
    // Remove non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Convert numbers starting with 01 to 201 (Egypt)
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned;
    }
    
    // Ensure if it starts with 1 (Egypt mobile) and 10 digits, add 20
    if (cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '20' + cleaned;
    }

    return cleaned;
  }

  /**
   * Detect intent based on keywords (Egyptian Arabic focus)
   */
  detectIntent(text: string): WhatsAppIntent {
    const lowerText = text.toLowerCase();
    
    if (this.paymentKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'payment_requested';
    }
    
    if (this.infoKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'info_requested';
    }
    
    return 'generic';
  }

  /**
   * Process an inbound message from any source
   */
  async processInboundMessage(payload: WhatsAppMessagePayload) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.error('[WhatsAppAutomation] Supabase admin client not initialized');
      return { success: false, error: 'no_supabase' };
    }

    const phone = payload.from;
    const phoneNormalized = this.normalizePhoneNumber(phone);
    const intent = this.detectIntent(payload.text);
    
    // Generate AI Strategy (Oracle Insight)
    const oracleStrategy = this.generateOracleStrategy(payload.text, intent);
    
    console.log(`[WhatsAppAutomation] Processing message from ${phoneNormalized}. Intent: ${intent}. Strategy: ${oracleStrategy.suggestion}`);

    try {
      // 1. Extract Referral Data (Attribution)
      const referral = payload.metadata?.raw?.referral;
      const attributionData: any = {};
      
      if (referral) {
        console.log(`[WhatsAppAutomation] Referral detected from ad ${referral.source_id}`);
         attributionData.ad = referral.source_id;
         attributionData.campaign = referral.headline || referral.body?.substring(0, 50); 
         attributionData.source_type = 'whatsapp';
         
         attributionData.utm = {
          ad_id: referral.source_id,
          source_url: referral.source_url,
          ctwa_clid: referral.ctwa_clid,
          headline: referral.headline,
          source_type: referral.source_type
        };
      }

      // 2. Sync with marketing_leads (CRM)
      const { data: leadData, error: leadSearchError } = await supabase
        .from('marketing_leads')
        .select('id, status, intent, utm')
        .eq('phone_normalized', phoneNormalized)
        .maybeSingle();

      let leadId = leadData?.id;

      if (leadId && leadData) {
        const updatePayload: any = {
          last_contacted_at: new Date().toISOString()
        };

        if (intent === 'payment_requested' || (intent === 'info_requested' && leadData?.status === 'new')) {
          updatePayload.status = intent === 'payment_requested' ? 'payment_requested' : 'engaged';
          updatePayload.intent = intent;
        }

        if (attributionData.ad) {
          updatePayload.ad = attributionData.ad;
          updatePayload.campaign = attributionData.campaign;
          updatePayload.utm = { ...(leadData as any)?.utm, ...attributionData.utm };
        }

        await supabase
          .from('marketing_leads')
          .update(updatePayload)
          .eq('id', leadId);
      } else {
        const { data: newLead, error: createError } = await supabase
          .from('marketing_leads')
          .insert({
            phone: phone,
            phone_normalized: phoneNormalized,
            name: payload.name || 'WhatsApp User',
            source_type: 'whatsapp',
            status: intent === 'payment_requested' ? 'payment_requested' : 'engaged',
            intent: intent,
            ...attributionData
          })
          .select()
          .single();
        
        if (!createError && newLead) {
          leadId = newLead.id;
        }
      }

      // 3. Log the event in whatsapp_message_events with Oracle Strategy
      const { error: eventError } = await supabase
        .from('whatsapp_message_events')
        .insert({
          from_phone: phoneNormalized,
          to_phone: 'system',
          message_body: payload.text,
          message_type: 'text',
          direction: 'inbound',
          lead_id: leadId,
          intent_detected: intent,
          whatsapp_message_id: payload.messageId,
          processed_at: new Date().toISOString(),
          raw_payload: {
            original_payload: payload.metadata?.raw || payload,
            sender_name: payload.name,
            gateway: payload.gateway,
            timestamp_raw: payload.timestamp,
            referral: referral || null,
            oracle_strategy: oracleStrategy
          }
        });

      if (eventError) {
        console.error('[WhatsAppAutomation] Error logging message event:', eventError);
      }

      // 4. Automated Responses with Link Chaining
      await this.handleAutoReply(phoneNormalized, leadId, intent, payload.name, attributionData.utm?.ctwa_clid);

      return { success: true, intent, leadId };
    } catch (err) {
      console.error('[WhatsAppAutomation] Fatal error processing message:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Generates a "Sovereign" response strategy based on intent and content
   */
  private generateOracleStrategy(text: string, intent: WhatsAppIntent): { reasoning: string; suggestion: string } {
    if (intent === 'payment_requested') {
      return {
        reasoning: "المستخدم في مرحلة 'الالتزام'. يحتاج إلى تأكيد الأمان والسرعة.",
        suggestion: "وجهه فوراً للتحويل البنكي أو فودافون كاش، وأكد إن العملية بتخلص في دقيقة."
      };
    }
    
    if (intent === 'info_requested') {
      return {
        reasoning: "المستخدم في مرحلة 'الاستكشاف'. يحتاج إلى فهم القيمة (First Principles).",
        suggestion: "ابعتله فيديو 'ليه الرحلة؟' ووضحه إننا بنبني وعي مش مجرد كورس."
      };
    }

    if (text.length > 50) {
      return {
        reasoning: "المستخدم بيفضفض أو بيحكي مشكلة عميقة.",
        suggestion: "الأفضل تحويله لمكالمة تكتيكية مع أدمن بشري فوراً لزيادة الـ Resonance."
      };
    }

    return {
      reasoning: "تفاعل عام أو تحية.",
      suggestion: "رد بتحية 'سوفيرين' وادعوه لاستكشاف الخريطة."
    };
  }

  private async handleAutoReply(phone: string, leadId: string | undefined, intent: WhatsAppIntent, name?: string, ctwaClid?: string) {
    if (!leadId) return;

    let message = '';
    
    // Build Attribution Link
    const baseUrl = "https://alrehla.app/activation";
    const params = new URLSearchParams({
      lead_id: leadId,
      source: 'whatsapp'
    });
    if (ctwaClid) params.set('fbclid', ctwaClid); 
    
    const trackingLink = `${baseUrl}?${params.toString()}`;
    
    if (intent === 'payment_requested') {
      message = `أهلاً يا ${name || 'يا بطل'}! شروط الاشتراك وتفاصيل الدفع هتلاقيها هنا: ${trackingLink}. لو عندك أي سؤال تاني في عملية الدفع قولي.`;
    } else if (intent === 'info_requested') {
      message = `أهلاً بيك! "الرحلة" هي منصة بتساعدك تفهم حياتك وتطور من نفسك. تقدر تبدأ خطواتك الأولى من هنا: ${trackingLink}`;
    }

    if (message) {
      console.log(`[WhatsAppAutomation] Triggering auto-reply to ${phone}: ${message.substring(0, 30)}...`);
      try {
        await WhatsAppCloudService.sendFreeText(phone, leadId, message);
      } catch (err) {
        console.error('[WhatsAppAutomation] Failed to send auto-reply:', err);
      }
    }
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
