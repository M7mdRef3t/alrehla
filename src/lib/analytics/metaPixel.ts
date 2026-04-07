// src/lib/analytics/metaPixel.ts

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as unknown).fbq) {
    (window as unknown).fbq('track', 'PageView');
  }
};

export const event = (name: string, options: unknown = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as unknown).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as unknown).fbq('track', name, options, trackingParams);
  } else {
    console.error(`[Meta Pixel (Mock)] Track: ${name}`, options, eventId);
  }
};

export const customEvent = (name: string, options: unknown = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as unknown).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as unknown).fbq('trackCustom', name, options, trackingParams);
  } else {
    console.error(`[Meta Pixel (Mock)] TrackCustom: ${name}`, options, eventId);
  }
};
