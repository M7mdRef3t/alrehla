/* eslint-disable @typescript-eslint/no-explicit-any */
export const sendToCapi = async (
  eventName: string,
  eventId: string,
  userData: any,
  customData: any = {}
) => {
  try {
    const res = await fetch('/api/meta/capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user_data: userData,
        custom_data: customData,
      }),
    });
    
    if (!res.ok) {
      console.error('[CAPI Client] Error forwarding event', await res.text());
    }
  } catch (err) {
    console.error('[CAPI Client] Network error', err);
  }
};
