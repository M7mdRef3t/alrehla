import { trackEvent } from "./analytics";
import { supabase } from "./supabaseClient";

export type EmotionalPricingEventType =
  | "gift_granted"
  | "discount_offer_created"
  | "offer_converted_to_premium";

export interface EmotionalPricingStats {
  giftsGrantedCount: number;
  discountOffersCount: number;
  conversionRatePercent: number;
}

const RECORDED_CONVERSIONS_KEY = "dawayir-recorded-conversions";

export function recordEmotionalPricingEvent(
  type: EmotionalPricingEventType,
  opts?: { offerId?: string }
): void {
  if (type === "offer_converted_to_premium" && opts?.offerId) {
    markOfferConversionRecorded(opts.offerId);
  }

  trackEvent("emotional_pricing_triggered", {
    action: type,
    offerId: opts?.offerId,
  });
}

export function hasRecordedOfferConversion(offerId: string): boolean {
  try {
    const raw = localStorage.getItem(RECORDED_CONVERSIONS_KEY);
    if (!raw) return false;
    const ids = JSON.parse(raw) as string[];
    return ids.includes(offerId);
  } catch {
    return false;
  }
}

function markOfferConversionRecorded(offerId: string): void {
  try {
    const raw = localStorage.getItem(RECORDED_CONVERSIONS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(offerId)) {
      ids.push(offerId);
      localStorage.setItem(RECORDED_CONVERSIONS_KEY, JSON.stringify(ids));
    }
  } catch {
    // noop
  }
}

// NOTE: This must be queried from actual telemetry, so we made it async!
export async function getEmotionalPricingStats(): Promise<EmotionalPricingStats> {
  if (!supabase) return { giftsGrantedCount: 0, discountOffersCount: 0, conversionRatePercent: 0 };
  
  try {
    const { data: events, error } = await supabase
      .from("telemetry_events")
      .select("payload")
      .eq("event_type", "emotional_pricing_triggered");

    if (error || !events) {
      return { giftsGrantedCount: 0, discountOffersCount: 0, conversionRatePercent: 0 };
    }

    let giftsGrantedCount = 0;
    let discountOffersCount = 0;
    let convertedCount = 0;

    events.forEach(e => {
        const action = e.payload?.action;
        if (action === "gift_granted") giftsGrantedCount++;
        if (action === "discount_offer_created") discountOffersCount++;
        if (action === "offer_converted_to_premium") convertedCount++;
    });

    const conversionRatePercent =
      discountOffersCount > 0 ? Math.round((convertedCount / discountOffersCount) * 100) : 0;

    return {
      giftsGrantedCount,
      discountOffersCount,
      conversionRatePercent,
    };
  } catch (error) {
    console.error("[EmotionalPricing] Failed to fetch stats", error);
    return { giftsGrantedCount: 0, discountOffersCount: 0, conversionRatePercent: 0 };
  }
}