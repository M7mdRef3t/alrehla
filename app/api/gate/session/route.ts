import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendToCapi } from '@/lib/analytics/metaCapi'; // existing server-side CAPI sender

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

    // 1. Fetch current session to strictly prevent duplicates
    const { data: existingSession } = await db
      .from('gate_sessions')
      .select('id, lead_submitted_at, qualified_at')
      .eq('id', sessionId)
      .single();

    const timestamp = new Date().toISOString();

    if (step === 'layer1') {
      if (existingSession?.lead_submitted_at) {
        return NextResponse.json({ status: 'already_recorded', reason: 'idempotency' });
      }

      // First creation & insertion
      const insertPayload = {
        id: sessionId,
        email: payload.email,
        source_area: payload.sourceArea,
        lead_submitted_at: timestamp,
        // Optional UTM mapping
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbp, fbc
      };

      const { error } = await db.from('gate_sessions').upsert(insertPayload, { onConflict: 'id' });
      if (error) console.error('[Gate API] Supabase Layer 1 DB Error', error);

      // Trigger CAPI
      // Server ensures exactly 1 CAPI request
      await sendToCapi('Lead', eventId, { em: payload.email, fbp, fbc, external_id: sessionId }, { source_area: payload.sourceArea });

      return NextResponse.json({ status: 'success' });
    }

    if (step === 'layer2') {
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

      const { error } = await db.from('gate_sessions').update(updatePayload).eq('id', sessionId);
      if (error) console.error('[Gate API] Supabase Layer 2 DB Error', error);

      // Trigger CAPI for layer 2
      await sendToCapi('CompleteRegistration', eventId, 
        { em: payload.email, external_id: sessionId }, // Note: fbp, fbc should persist on client
        { intent: payload.intent, commitment: payload.commitment }
      );

      return NextResponse.json({ status: 'success' });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });

  } catch (error: any) {
    console.error('[Gate API] Internal failure', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
