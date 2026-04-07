
import { supabase } from "./supabaseClient";
import { getRecoveryPlanHtml, type RecoveryPlanData } from "../templates/RecoveryPlanEmail";
import { getPricingGrandfatheringHtml, type PricingGrandfatheringData } from "../templates/PricingGrandfatheringEmail";


/**
 * Service to handle sending emails to users.
 * Primarily used for the "Recovery Plan" (روشتة) after onboarding.
 */
export async function sendRecoveryPlanEmail(email: string, data: RecoveryPlanData): Promise<boolean> {
  const logPrefix = "[EmailService]";
  
  if (!supabase) {
    console.error(`${logPrefix} Supabase not initialized. Cannot invoke send-email.`);
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
      console.error(`${logPrefix} Edge function error:`, error);
      return false;
    }

    console.log(`${logPrefix} Recovery plan sent successfully. ID:`, responseData?.id);
    return true;
  } catch (err: any) {
    console.error(`${logPrefix} Unexpected failure in email flow:`, err);
    return false;
  }
}

/**
 * Notify existing users about the pricing grandfathering policy.
 */
export async function notifyPricingGrandfathering(email: string, data: PricingGrandfatheringData): Promise<boolean> {
  const logPrefix = "[EmailService]";

  if (!supabase) {
    console.error(`${logPrefix} Supabase not initialized. Cannot invoke send-email.`);
    return false;
  }

  if (!email || !email.includes("@")) {
    console.warn(`${logPrefix} Invalid email provided: ${email}`);
    return false;
  }

  try {
    const html = getPricingGrandfatheringHtml(data);
    const subject = "تحديث أسعار الباقات - باقتك القديمة محفوظة 🛡️";

    const { data: responseData, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email.trim(),
        subject,
        html,
        text: `أهلاً بيك! تحديث أسعار جديد: السعر الجديد ${data.newPrice} ${data.currency} لكن باقتك القديمة محفوظة بسعر ${data.oldPrice} ${data.currency}.`
      }
    });

    if (error) {
      console.error(`${logPrefix} Edge function error:`, error);
      return false;
    }

    console.log(`${logPrefix} Pricing grandfathering email sent successfully to ${email}. ID:`, responseData?.id);
    return true;
  } catch (err: any) {
    console.error(`${logPrefix} Unexpected failure in pricing grandfathering email flow:`, err);
    return false;
  }
}
