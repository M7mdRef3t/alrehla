import { trackEvent, generateUUID } from "@/services/analytics";
import * as pixel from "./metaPixel";

/**
 * Sends a deduplicated event to Meta Pixel (Browser) AND our internal telemetry.
 * The server-side (CAPI) is handled strictly by our safe backend API route to enforce idempotency.
 * We return the generated eventId so the backend can use identical IDs for Meta to deduplicate.
 */
export const trackGateEventPixelOnly = (
  eventName: string,
  customData: Record<string, unknown> = {},
  explicitEventId?: string
): string => {
  const eventId = explicitEventId || generateUUID();

  try {
    // 1) Internal Telemetry
    trackEvent(eventName, { ...customData, client_event_id: eventId });

    // 2) Meta Pixel
    const isStandard = ['PageView', 'ViewContent', 'Lead', 'CompleteRegistration', 'Purchase'].includes(eventName);
    
    if (isStandard) {
      pixel.event(eventName, customData, eventId);
    } else {
      pixel.customEvent(eventName, customData, eventId);
    }
  } catch (error) {
    console.error('[Event Tracker] Failed to track browser event', error);
  }
  
  return eventId; 
};
