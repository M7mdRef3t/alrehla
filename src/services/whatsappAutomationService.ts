import { getSupabaseAdminClient } from '../../app/api/_lib/supabaseAdmin';
import { WhatsAppCloudService } from './whatsappCloudService';

export interface WhatsAppMessagePayload {
  from: string;
  name?: string;
  text: string;
  timestamp: string;
  messageId: string;
  hasImage?: boolean;
  imageId?: string;
  metadata?: {
    raw?: {
      referral?: {
        source_id?: string;
        source_url?: string;
        ctwa_clid?: string;
        headline?: string;
        body?: string;
        source_type?: string;
      };
    };
  } | null;
  gateway?: 'meta' | 'other';
}

export type WhatsAppIntent = 'payment_requested' | 'info_requested' | 'support_needed' | 'frustrated' | 'appreciation' | 'generic' | 'spam';

class WhatsAppAutomationService {
  private readonly paymentKeywords = ['اشتراك', 'اشترك', 'سعر', 'سعر الاشتراك', 'بكام', 'ادفع', 'دفع', 'تحويل', 'فودافون كاش', 'باقة', 'سعر الرحلة', 'حجز', 'تفاصيل الدفع'];
  private readonly infoKeywords = ['تفاصيل', 'معلومات', 'ايه ده', 'بتعملوا ايه', 'ازاي', 'شرح', 'فهموني', 'يعني ايه', 'منصة', 'ممكن افهم', 'توضيح', 'شرح أكتر'];
  private readonly supportKeywords = ['مشكلة', 'مش عارف', 'مش شغال', 'يوزر', 'باسورد', 'دخول', 'مش بيفتح', 'مساعدة', 'علق', 'وقفت', 'مش بيدخل', 'نسيت'];
  private readonly frustratedKeywords = ['نصب', 'زهقت', 'مش معقول', 'بطيء', 'نصيحة', 'تعبت', 'مخنوق', 'قرف', 'مش فاهم حاجة', 'مفيش فايدة', 'غالي'];
  private readonly appreciationKeywords = ['شكرا', 'تسلم', 'عاش', 'الله ينور', 'حلو جدا', 'مبسوط', 'رائعة', 'ممتاز', 'شكراً', 'طاقة', 'تغيير'];

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
  detectIntent(text: string, hasImage?: boolean): WhatsAppIntent {
    if (hasImage) {
      return 'payment_requested'; // Images sent to this number are highly likely payment screenshots
    }

    const lowerText = text.toLowerCase();
    
    if (this.paymentKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'payment_requested';
    }
    
    if (this.frustratedKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'support_needed'; // Or a separate frustrated intent, but we group it
    }

    if (this.supportKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'support_needed';
    }
    
    if (this.infoKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'info_requested';
    }

    if (this.appreciationKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'generic'; // We can handle it uniquely in Oracle strategy
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
    const intent = this.detectIntent(payload.text, payload.hasImage);
    
    // Generate AI Strategy (Oracle Insight)
    const oracleStrategy = this.generateOracleStrategy(payload.text, intent);
    
    console.log(`[WhatsAppAutomation] Processing message from ${phoneNormalized}. Intent: ${intent}. Strategy: ${oracleStrategy.suggestion}`);

    try {
      // 0. Auto-Activation check
      const receiptMatch = payload.text.match(/\d{10,}/); // Heuristic for receipt strings
      let activated = false;
      
      if (payload.hasImage) {
        console.log(`[WhatsAppAutomation] Received image proof from ${phoneNormalized}`);
        activated = await this.handleAutoActivation(phoneNormalized, payload.imageId || 'image_proof', supabase);
      } else if (receiptMatch) {
        activated = await this.handleAutoActivation(phoneNormalized, receiptMatch[0], supabase);
      }

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

      if (leadSearchError) {
        console.error('[WhatsAppAutomation] Error searching for lead:', leadSearchError);
      }

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
        
        if (createError) {
          console.error('[WhatsAppAutomation] Error creating new lead:', createError);
        } else if (newLead) {
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
      if (!activated) {
        await this.handleAutoReply(phoneNormalized, leadId, intent, payload.name, attributionData.utm?.ctwa_clid);
      }

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
    const lowerText = text.toLowerCase();

    if (intent === 'payment_requested') {
      return {
        reasoning: "المستخدم في مرحلة 'الالتزام'. يحتاج إلى تأكيد الأمان والسرعة.",
        suggestion: "وجهه فوراً للتحويل البنكي أو فودافون كاش، وأكد إن العملية بتخلص في دقيقة."
      };
    }

    // Detecting implicit frustration or complaints mapped to support_needed
    if (this.frustratedKeywords.some(keyword => lowerText.includes(keyword))) {
      return {
        reasoning: "نبض المستخدم به شحنة غضب أو إحباط (Frustration). قد يكون ناتج عن مقاومة للرحلة أو تسرب طاقة.",
        suggestion: "رد باحتواء وهدوء شديد (Command Neutrality)، لا تُجادله بل أسحب التوتر باعتراف صريح بمشكلته، واعرض حلاً فورياً دون تعقيد."
      };
    }
    
    if (intent === 'support_needed') {
      return {
        reasoning: "المستخدم يواجه حائط سد تقني يمنع تدفق التجربة.",
        suggestion: "أرسل خطوات واضحة (مُرقّمة)، أو اطلب سكرين شوت بأدب. الحلول التقنية يجب أن تكون باردة وعملية."
      };
    }
    
    if (intent === 'info_requested') {
      return {
        reasoning: "المستخدم في مرحلة 'الاستكشاف'. يحتاج إلى فهم القيمة (First Principles).",
        suggestion: "ابعتله فيديو 'ليه الرحلة؟' ووضحه إننا بنبني وعي مش مجرد كورس."
      };
    }

    if (this.appreciationKeywords.some(keyword => lowerText.includes(keyword))) {
      return {
        reasoning: "تفاعل إيجابي عالي التردد (Resonance).",
        suggestion: "اشكره بثبات سيادي دون مبالغة. ذكّره أن التقدم في الرحلة هو انتصار له أولاً."
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
      suggestion: "رد بتحية 'قيادية' وادعوه لاستكشاف الخريطة."
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

  private async handleAutoActivation(phone: string, receipt: string, supabase: any): Promise<boolean> {
    // 1. Find user by phone (Normalization)
    let searchPhone = phone;
    if (searchPhone.startsWith("20")) searchPhone = "0" + searchPhone.slice(2); // +201... -> 01...

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .or(`phone.eq.${phone},phone.eq.${searchPhone}`)
      .single();

    if (!profile) {
      console.log(`[WhatsAppAutomation] No profile found for ${phone} for auto-activation`);
      return false;
    }

    // 1.5. Verify there is a pending transaction for this user before activating
    const { data: pendingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .single();

    if (!pendingTx) {
      console.log(`[WhatsAppAutomation] No pending transaction found for user ${profile.id}. Will not auto-activate.`);
      // Send a fallback message indicating we got the image but don't see a transaction
      const msg = `أهلاً يا ${profile.full_name}! استلمنا رسالتك، بس مش لاقيين طلب دفع معلق لحسابك. لو دي مشكلة تقنية، الدعم هيتواصل معاك فوراً.`;
      await WhatsAppCloudService.sendFreeText(phone, profile.id, msg);
      return false;
    }

    console.log(`[WhatsAppAutomation] Found pending transaction ${pendingTx.id} for user ${profile.id}. Proceeding with activation...`);

    // 2. Trigger Activation Engine
    const { data: result, error } = await supabase.rpc("activate_founding_cohort_seat", {
      p_user_id: profile.id,
      p_provider: "whatsapp_auto",
      p_payment_ref: receipt
    });

    if (error || !result?.activated) {
      console.error("[WhatsAppAutomation] RPC Failed for auto-activation:", error);
      
      // Update transaction status to pending_review
      await supabase
        .from("transactions")
        .update({ 
            status: "pending_review", 
            metadata: { receipt_ref: receipt, error: error || 'activation_failed', failed_at: new Date().toISOString() } 
        })
        .eq("id", pendingTx.id);

      const errorMsg = `أهلاً يا ${profile.full_name}. استلمنا إثبات الدفع، بس محتاجين نراجعه يدوياً عشان فيه مشكلة تقنية. فريق الدعم هيفعل حسابك في أقرب وقت.`;
      await WhatsAppCloudService.sendFreeText(phone, profile.id, errorMsg);

      return false;
    }

    // 3. Mark the transaction as completed
    await supabase
      .from("transactions")
      .update({ status: "completed", metadata: { receipt_ref: receipt, verified_via: 'whatsapp_webhook', verified_at: new Date().toISOString() } })
      .eq("id", pendingTx.id);

    // 4. Notify Success back to WhatsApp
    if (result?.activated) {
       const msg = `تم تفعيل رحلتك بنجاح يا ${profile.full_name}! 🌊✨\nأهلاً بك في الفوج التأسيسي. الدفع اتأكد وتقدر دلوقتي تدخل المنصة وتستكشف خريطتك.`;
       await WhatsAppCloudService.sendFreeText(phone, profile.id, msg);
       return true;
    }
    return false;
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
