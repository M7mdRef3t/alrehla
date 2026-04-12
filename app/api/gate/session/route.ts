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
      .select('id, email, lead_submitted_at, qualified_at')
      .eq('id', sessionId)
      .single();

    const timestamp = new Date().toISOString();

    if (step === 'layer1') {
      const { data: rpcData, error: rpcError } = await db.rpc('rpc_submit_gate_lead', {
        p_id: sessionId,
        p_email: payload.email,
        p_source_area: payload.sourceArea,
        p_timestamp: timestamp,
        p_utm_source: utm_source,
        p_utm_medium: utm_medium,
        p_utm_campaign: utm_campaign,
        p_utm_content: utm_content,
        p_utm_term: utm_term,
        p_fbclid: fbclid,
        p_fbp: fbp,
        p_fbc: fbc
      });

      if (rpcError) {
        console.error('[Gate API] Supabase Layer 1 DB Error', rpcError);
        return NextResponse.json({ error: 'Failed DB insertion' }, { status: 500 });
      }

      // If no ID returned, it means the update was rejected by the WHERE clause (already submitted)
      if (!rpcData || rpcData.length === 0) {
        return NextResponse.json({ status: 'already_recorded', reason: 'idempotency_rpc_reject' });
      }

      // Trigger CAPI only on successful atomic write
      await sendToCapi('Lead', eventId, { 
        em: payload.email, 
        fbp, 
        fbc, 
        external_id: sessionId 
      }, { 
        source_area: payload.sourceArea 
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
      await sendToCapi('CompleteRegistration', eventId, 
        { em: existingSession.email || payload.email, external_id: sessionId }, 
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
