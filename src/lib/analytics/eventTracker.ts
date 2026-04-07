/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import * as pixel from './metaPixel';

/**
 * Sends a deduplicated event ONLY to Meta Pixel (Browser).
 * The server-side (CAPI) is now handled strictly by our safe backend API route to enforce idempotency.
 * We return the generated eventId so the backend can use identical IDs for Meta to deduplicate.
 */
export const trackGateEventPixelOnly = (
  eventName: string,
  customData: Record<string, any> = {}
): string => {
  const eventId = uuidv4();

  try {
        // In strict business environments, GateStarted might be sent as a custom event.
    // For Meta logic, we use Custom if it's not a standard recognized e-commerce funnel one.
    const isStandard = ['PageView', 'ViewContent', 'Lead', 'CompleteRegistration', 'Purchase'].includes(eventName);
    
    if (isStandard) {
      pixel.event(eventName, customData, eventId);
    } else {
      pixel.customEvent(eventName, customData, eventId);
    }
  } catch (error) {
    console.error('[Event Tracker] Failed to track browser event', error);
  }
  
  return eventId; // IMPORTANT: Must be passed to API route for CAPI tracking!
};
