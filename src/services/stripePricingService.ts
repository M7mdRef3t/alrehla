

import { getStripeClient } from "../../app/api/_lib/stripeConfig";
import { supabase } from "./supabaseClient";

export async function updateStripePrices(premium: number, coach: number) {
  const { client: stripe, config } = getStripeClient();

  if (!stripe) {
    console.warn("Stripe client not configured. Skipping actual Stripe API calls.");
    return { success: true, mocked: true, prices: {} };
  }

  const newPrices: { premiumPriceId?: string; coachPriceId?: string } = {};

  try {
    // 1. Update Premium Price
    if (config.pricePremium) {
      const existingPremiumPrice = await stripe.prices.retrieve(config.pricePremium);
      const product = typeof existingPremiumPrice.product === "string"
        ? existingPremiumPrice.product
        : existingPremiumPrice.product.id;

      const newPremiumPrice = await stripe.prices.create({
        product,
        unit_amount: Math.round(premium * 100), // Stripe expects cents
        currency: existingPremiumPrice.currency || "usd",
        metadata: {
          generated_by: "revenue_automation_engine",
          reason: "dynamic_pricing_adjustment"
        }
      });
      newPrices.premiumPriceId = newPremiumPrice.id;
      // Save to database so the application can pick up the new stripe price ID
      if (supabase) await supabase.from("system_settings").upsert({
        key: "ai_dynamic_pricing_premium",
        value: {
          priceId: newPremiumPrice.id,
          amount: premium,
          currency: newPremiumPrice.currency,
          updatedAt: new Date().toISOString()
        }
      }, { onConflict: "key" });
    }

    // 2. Update Coach Price
    if (config.priceCoach) {
      const existingCoachPrice = await stripe.prices.retrieve(config.priceCoach);
      const product = typeof existingCoachPrice.product === "string"
        ? existingCoachPrice.product
        : existingCoachPrice.product.id;

      const newCoachPrice = await stripe.prices.create({
        product,
        unit_amount: Math.round(coach * 100),
        currency: existingCoachPrice.currency || "usd",
        metadata: {
          generated_by: "revenue_automation_engine",
          reason: "dynamic_pricing_adjustment"
        }
      });
      newPrices.coachPriceId = newCoachPrice.id;

      // Save to database so the application can pick up the new stripe price ID
      if (supabase) await supabase.from("system_settings").upsert({
        key: "ai_dynamic_pricing_coach",
        value: {
          priceId: newCoachPrice.id,
          amount: coach,
          currency: newCoachPrice.currency,
          updatedAt: new Date().toISOString()
        }
      }, { onConflict: "key" });
    }

    return { success: true, prices: newPrices };
  } catch (error: any) {
    console.error("Failed to apply pricing change to Stripe:", error);
    throw new Error(error.message || "Failed to update prices");
  }
}
