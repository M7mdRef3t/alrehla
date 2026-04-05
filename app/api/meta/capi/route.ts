import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Hash function required by Meta CAPI for user data like email
const hashData = (data: string) => {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

export async function POST(req: Request) {
  try {
    const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.warn('[CAPI Route] Missing Pixel ID or Access Token. Simulating success.');
      return NextResponse.json({ success: true, simulated: true });
    }

    const body = await req.json();
    const { event_name, event_time, event_id, user_data, custom_data } = body;

    // Secure hashing
    const hashedUserData = {
      ...user_data,
      em: user_data?.em ? hashData(user_data.em) : undefined,
    };

    // Clean up undefined
    Object.keys(hashedUserData).forEach(
      (key) => hashedUserData[key] === undefined && delete hashedUserData[key]
    );

    const payload = {
      data: [
        {
          event_name,
          event_time,
          event_id,
          action_source: "website",
          user_data: hashedUserData,
          custom_data,
        }
      ]
    };

    const graphUrl = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const fbRes = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('[CAPI Route] Error from Meta:', fbData);
      return NextResponse.json({ success: false, error: fbData }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: fbData });
  } catch (err: any) {
    console.error('[CAPI Route] Server error', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
