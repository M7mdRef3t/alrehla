import { logger } from "../services/logger";

import { supabase } from "./supabaseClient";
import { getRecoveryPlanHtml, type RecoveryPlanData } from "../templates/RecoveryPlanEmail";

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
