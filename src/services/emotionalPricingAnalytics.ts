export type EmotionalPricingEventType =
  | "gift_granted"
  | "discount_offer_created"
  | "offer_converted_to_premium";

export interface EmotionalPricingEvent {
  id: string;
  type: EmotionalPricingEventType;
  offerId?: string;
  timestamp: number;
}

export interface EmotionalPricingStats {
  giftsGrantedCount: number;
  discountOffersCount: number;
  conversionRatePercent: number;
}

const EVENTS_KEY = "dawayir-emotional-pricing-events";

function readEvents(): EmotionalPricingEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmotionalPricingEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((event) => typeof event?.type === "string" && typeof event?.timestamp === "number");
  } catch {
    return [];
  }
}

function writeEvents(events: EmotionalPricingEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // noop
  }
}

export function recordEmotionalPricingEvent(
  type: EmotionalPricingEventType,
  opts?: { offerId?: string }
): void {
  const events = readEvents();
  const event: EmotionalPricingEvent = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    offerId: opts?.offerId,
    timestamp: Date.now(),
  };
  events.push(event);
  writeEvents(events);
}

export function getEmotionalPricingEvents(): EmotionalPricingEvent[] {
  return readEvents();
}

export function hasRecordedOfferConversion(offerId: string): boolean {
  return readEvents().some(
    (event) => event.type === "offer_converted_to_premium" && event.offerId === offerId
  );
}

export function getEmotionalPricingStats(): EmotionalPricingStats {
  const events = readEvents();
  const giftsGrantedCount = events.filter((event) => event.type === "gift_granted").length;
  const discountOffersCount = events.filter((event) => event.type === "discount_offer_created").length;
  const convertedCount = events.filter((event) => event.type === "offer_converted_to_premium").length;

  const conversionRatePercent =
    discountOffersCount > 0 ? Math.round((convertedCount / discountOffersCount) * 100) : 0;

  return {
    giftsGrantedCount,
    discountOffersCount,
    conversionRatePercent,
  };
}
