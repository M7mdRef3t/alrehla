import { logger } from "@/services/logger";

import { supabase } from "./supabaseClient";
import { getRecoveryPlanHtml, type RecoveryPlanData } from "@/templates/RecoveryPlanEmail";

/**
 * Service to handle sending emails to users.
 * Primarily used for the "Recovery Plan" (روشتة) after onboarding.
 */
export async function sendRecoveryPlanEmail(email: string, data: RecoveryPlanData): Promise<boolean> {
  const logPrefix = "[EmailService]";
  
  if (!supabase) {
    logger.error(`${logPrefix} Supabase not initialized. Cannot invoke send-email.`);
    return false;
  }

  if (!email || !email.includes("@")) {
    console.warn(`${logPrefix} Invalid email provided: ${email}`);
    return false;
  }

  try {
    const html = getRecoveryPlanHtml(data);
    const subject = "روشتة التعافي الخاصة بك من الرحلة 🧭";

    // Invoke the newly created Supabase Edge Function 'send-email'
    const { data: responseData, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email.trim(),
        subject,
        html,
        text: `أهلاً بيك في المواجهة والحقيقة. رصدت ${data.relationshipCount} علاقة في أشعة وعيك المقطعية. تفقد بريدك لرؤية روشتة استعادة طاقتك.`
      }
    });

    if (error) {
      logger.error(`${logPrefix} Edge function error:`, error);
      return false;
    }

    console.log(`${logPrefix} Recovery plan sent successfully. ID:`, responseData?.id);
    return true;
  } catch (err: any) {
    logger.error(`${logPrefix} Unexpected failure in email flow:`, err);
    return false;
  }
}

import { getSessionFollowupHtml, type SessionFollowupData } from "@/templates/SessionFollowupEmail";

export async function sendSessionFollowupEmail(email: string, data: SessionFollowupData): Promise<boolean> {
  const logPrefix = "[EmailService]";
  if (!supabase) return false;
  if (!email || !email.includes("@")) return false;

  try {
    const html = getSessionFollowupHtml(data);
    const subject = `متابعة رحلتنا: ${data.clientName} 🧭`;

    const { error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email.trim(),
        subject,
        html,
        text: `أهلاً يا ${data.clientName}. دي خلاصة جلستنا والخطوات الجاية: ${data.assignment}`
      }
    });

    if (error) throw error;
    return true;
  } catch (err) {
    logger.error(`${logPrefix} Followup email failed:`, err);
    return false;
  }
}

