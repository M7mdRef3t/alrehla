/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/analytics/metaPixel.ts

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq) {
    (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq('track', 'PageView');
  }
};

export const event = (name: string, options: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq('track', name, options, trackingParams);
  } else {
    console.warn(`[Meta Pixel (Mock)] Track: ${name}`, options, eventId);
  }
};

export const customEvent = (name: string, options: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq) {
    const trackingParams = eventId ? { eventID: eventId } : undefined;
    (window as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any).fbq('trackCustom', name, options, trackingParams);
  } else {
    console.warn(`[Meta Pixel (Mock)] TrackCustom: ${name}`, options, eventId);
  }
};
