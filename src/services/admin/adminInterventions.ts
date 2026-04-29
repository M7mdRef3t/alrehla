import { supabase, isSupabaseReady } from "../supabaseClient";
import type { InterventionEntry, InterventionStatus } from "./adminTypes";
import { WhatsAppCloudService } from "../whatsappCloudService";
import { logger } from "../logger";
import { runtimeEnv } from "@/config/runtimeEnv";
import { telegramBot } from "../telegramBot";

/**
 * adminInterventions.ts — Management of user interventions and "Truth Calls".
 */

export async function fetchPendingInterventions(limit = 100): Promise<InterventionEntry[]> {
  if (!isSupabaseReady || !supabase) return [];
  
  const { data, error } = await supabase
    .from("pending_interventions")
    .select(`
      id,
      user_id,
      trigger_reason,
      ai_message,
      status,
      metadata,
      created_at,
      profiles:user_id (full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching interventions:", error);
    return [];
  }

  return (data as any[]).map(row => ({
    id: row.id,
    userId: row.user_id,
    triggerReason: row.trigger_reason,
    aiMessage: row.ai_message,
    status: row.status as InterventionStatus,
    metadata: row.metadata,
    createdAt: row.created_at,
    userName: row.profiles?.full_name || "Unknown",
    userEmail: row.profiles?.email || ""
  }));
}

export async function updateInterventionStatus(id: string, status: InterventionStatus): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  
  const { error } = await supabase
    .from("pending_interventions")
    .update({ status })
    .eq("id", id);
    
  return !error;
}

export async function triggerManualAnalysis(userId: string): Promise<boolean> {
  // This will call the processInterventions service logic (likely via an Edge Function or direct call if available in admin)
  // For now, we'll simulate or call the service if we can import it.
  // Note: interventionEngine uses supabaseAdmin, so it might need elevated privileges.
  
  try {
     const { processInterventions } = await import("../interventionEngine");
     await processInterventions(userId);
     return true;
  } catch (err) {
     console.error("Failed to run manual analysis:", err);
     return false;
  }
}

export async function triggerTruthCall(userId: string, pattern: any): Promise<boolean> {
  try {
     const { generateTruthCall } = await import("../truthCaller");
     await generateTruthCall(userId, pattern);
     return true;
  } catch (err) {
     console.error("Failed to trigger truth call:", err);
     return false;
  }
}

/**
 * executeIntervention — The "Send" action.
 * Dispatches Push Notification and WhatsApp message to the traveler.
 */
export async function executeIntervention(intervention: InterventionEntry): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady || !supabase) return { success: false, error: "Database not ready" };

  try {
    // 1. Fetch user metadata (phone, telegram, name) from profiles
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("phone, full_name, telegram_chat_id")
      .eq("id", intervention.userId)
      .single();

    if (userError || !userData) {
      logger.error("Failed to fetch user data for intervention", userError);
      return { success: false, error: "لم يتم العثور على بيانات المستخدم (رقم الهاتف مطلوب)" };
    }

    // 2. Dispatch WhatsApp (Free-text)
    if (userData.phone) {
      const waResponse = await WhatsAppCloudService.sendFreeText(
        userData.phone,
        intervention.userId,
        intervention.aiMessage
      );
      if (!waResponse.success) {
        logger.warn("WhatsApp delivery failed, but continuing...", waResponse.error);
      }
    }

    // 3. Dispatch Telegram if chat_id exists
    if (userData.telegram_chat_id) {
      try {
        await telegramBot.sendMessage({
          type: "truth_caller_intervention",
          text: `✨ *نداء من الرحلة*\n\n${intervention.aiMessage}`,
          parseMode: "Markdown"
        }, userData.telegram_chat_id);
      } catch (tgErr) {
        logger.error("Telegram intervention delivery error", tgErr);
      }
    }

    // 3. Dispatch Browser Push Notification via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const pushResponse = await fetch(`${runtimeEnv.supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          user_id: intervention.userId,
          title: "نداء من الرحلة ✨",
          body: intervention.aiMessage,
          url: "/journey" // Direct them to their journey map
        })
      });
      
      if (!pushResponse.ok) {
        const errJson = await pushResponse.json();
        logger.warn("Push notification Edge Function failed", errJson);
      }
    } catch (pushErr) {
      logger.error("Push delivery error", pushErr);
    }

    // 4. Mark as sent in DB
    const { error: updateError } = await supabase
      .from("pending_interventions")
      .update({ status: "sent" })
      .eq("id", intervention.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err) {
    logger.error("Intervention execution failed", err);
    return { success: false, error: "فشل إرسال التدخل. حاول مرة أخرى." };
  }
}
