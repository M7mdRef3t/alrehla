// src/lib/analytics/metaPixel.ts

export const pageview = () => {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).fbq as Function)) {
    ((window as unknown as Record<string, unknown>).fbq as Function)('track', 'PageView');
  }
};

export const event = (name: string, options: Record<string, unknown> = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).fbq as Function)) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    ((window as unknown as Record<string, unknown>).fbq as Function)('track', name, options, trackingParams);
  } else {
    console.debug(`[Meta Pixel (Mock)] Track: ${name}`, options, eventId);
  }
};

export const customEvent = (name: string, options: Record<string, unknown> = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).fbq as Function)) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    ((window as unknown as Record<string, unknown>).fbq as Function)('trackCustom', name, options, trackingParams);
  } else {
    console.debug(`[Meta Pixel (Mock)] TrackCustom: ${name}`, options, eventId);
  }
};
