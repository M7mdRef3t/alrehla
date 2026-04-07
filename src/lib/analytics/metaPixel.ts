// src/lib/analytics/metaPixel.ts

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'PageView');
  }
};

export const event = (name: string, options: any = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', name, options, trackingParams);
  } else {
    console.debug(`[Meta Pixel (Mock)] Track: ${name}`, options, eventId);
  }
};

export const customEvent = (name: string, options: any = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('trackCustom', name, options, trackingParams);
  } else {
    console.debug(`[Meta Pixel (Mock)] TrackCustom: ${name}`, options, eventId);
  }
};
