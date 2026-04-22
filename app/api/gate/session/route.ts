import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaCapiEvent } from '@/server/metaCapi';

function getGateDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Gate session storage is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

export async function POST(req: Request) {
  try {
    const db = getGateDb();
    const payload = await req.json();
    const { 
      sessionId, step, eventId, 
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbp, fbc 
    } = payload;

    if (!sessionId || !step) {
      return NextResponse.json({ error: 'Missing sessionId or step' }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    const referer = req.headers.get("referer") || "https://alrehla.com";

    // 1. Fetch current session to strictly prevent duplicates
    const { data: existingSession } = await db
      .from('gate_sessions')
      .select('id, email, lead_submitted_at, qualified_at')
      .eq('id', sessionId)
      .maybeSingle();

    const timestamp = new Date().toISOString();

    if (step === 'layer1') {
      const { error: insertError } = await db.from('gate_sessions').insert({
        id: sessionId,
        email: payload.email,
        source_area: payload.sourceArea,
        lead_submitted_at: timestamp,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        fbclid,
        fbp,
        fbc,
        updated_at: timestamp
      });

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          return NextResponse.json({ status: 'already_recorded', reason: 'idempotency_duplicate' });
        }
        console.error('[Gate API] Supabase Layer 1 DB Error', insertError);
        return NextResponse.json({ error: 'Failed DB insertion' }, { status: 500 });
      }

      // Trigger CAPI only on successful atomic write
      await sendMetaCapiEvent({
        eventName: 'Lead',
        eventId: eventId,
        sourceUrl: referer,
        userData: {
          email: payload.email,
          fbp,
          fbc,
          clientIpAddress: ip,
          clientUserAgent: userAgent
        }
      });

      return NextResponse.json({ status: 'success' });
    }

    if (step === 'layer2') {
      if (!existingSession) {
         return NextResponse.json({ error: 'Session not found for layer 2' }, { status: 404 });
      }

      if (existingSession?.qualified_at) {
         return NextResponse.json({ status: 'already_recorded', reason: 'idempotency' });
      }

      const updatePayload = {
        pain_point: payload.painPoint,
        intent: payload.intent,
        commitment_level: payload.commitment,
        qualified_at: timestamp,
        updated_at: timestamp
      };

      const { error, data } = await db.from('gate_sessions')
        .update(updatePayload)
        .eq('id', sessionId)
        .is('qualified_at', null)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('[Gate API] Supabase Layer 2 DB Error', error);
        return NextResponse.json({ error: 'Failed DB insertion' }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ status: 'already_recorded', reason: 'idempotency_lost_race' });
      }

      // Trigger CAPI for layer 2
      await sendMetaCapiEvent({
        eventName: 'GateQualified',
        eventId: eventId,
        sourceUrl: referer,
        userData: {
          email: existingSession.email || payload.email,
          fbp,
          fbc,
          clientIpAddress: ip,
          clientUserAgent: userAgent
        }
      });

      return NextResponse.json({ status: 'success' });
    }


    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });

  } catch (error: any) {
    console.error('[Gate API] Internal failure', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
