import { supabase } from "./supabaseClient";
import { getGrandfatheringEmailHtml } from "../templates/GrandfatheringEmail";
import { type PricingRecommendation } from "../ai/revenueAutomation";

/**
 * Service to handle notifying existing users about grandfathering policy.
 */
export async function notifyUsersAboutGrandfathering(recommendation: PricingRecommendation): Promise<{ success: boolean; notifiedCount: number }> {
  const logPrefix = "[GrandfatheringService]";

  if (!supabase) {
    console.error(`${logPrefix} Supabase not initialized.`);
    return { success: false, notifiedCount: 0 };
  }

  try {
    // 1. Fetch all active users who are subscribed
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier')
      .in('subscription_status', ['active', 'trialing'])
      .not('email', 'is', null);

    if (usersError) {
      console.error(`${logPrefix} Failed to fetch users:`, usersError);
      return { success: false, notifiedCount: 0 };
    }

    if (!users || users.length === 0) {
      console.log(`${logPrefix} No active users found to notify.`);
      return { success: true, notifiedCount: 0 };
    }

    console.log(`${logPrefix} Found ${users.length} active users to notify about grandfathering.`);

    let notifiedCount = 0;

    // 2. Process notifications in batches to avoid overwhelming the edge function
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const emailPromises = batch.map(async (user) => {
        if (!user.email) return false;

        let planName = "Premium";
        let oldPrice = 4.99; // Mock old price, ideally fetch from db
        let newPrice = recommendation.suggestedPrices.premium;

        if (user.subscription_tier === 'coach') {
          planName = "Coach";
          oldPrice = 49.00; // Mock old price
          newPrice = recommendation.suggestedPrices.coach;
        } else if (user.subscription_tier !== 'premium') {
            // Free users don't get grandfathered into a price they aren't paying
            return false;
        }

        const html = getGrandfatheringEmailHtml({
          userName: user.full_name || undefined,
          planName,
          oldPrice,
          newPrice
        });

        const subject = "تحديث أسعار دواير (سعرك مش هيتغير) 🛡️";

        const { error } = await supabase!.functions.invoke("send-email", {
          body: {
            to: user.email.trim(),
            subject,
            html,
            text: `أهلاً ${user.full_name || 'يا بطل'}، تم تحديث أسعار المنصة للمشتركين الجدد ولكن كمشترك حالي، سعرك مش هيتغير وهتفضل تدفع نفس السعر القديم.`
          }
        });

        if (error) {
           console.error(`${logPrefix} Failed to send email to ${user.email}:`, error);
           return false;
        }
        return true;
      });

      const results = await Promise.all(emailPromises);
      notifiedCount += results.filter(r => r).length;
    }

    console.log(`${logPrefix} Successfully notified ${notifiedCount}/${users.length} users.`);
    return { success: true, notifiedCount };
  } catch (err) {
    console.error(`${logPrefix} Unexpected error during grandfathering notification:`, err);
    return { success: false, notifiedCount: 0 };
  }
}
