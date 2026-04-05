import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendToCapi } from '@/lib/analytics/metaCapi'; 
import { v4 as uuidv4 } from 'uuid';

function getGateDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Gate completion storage is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

export async function POST(req: Request) {
  try {
    const db = getGateDb();
    const { gateSessionId, userId } = await req.json();

    if (!gateSessionId || !userId) {
      return NextResponse.json({ error: 'Missing gateSessionId or userId' }, { status: 400 });
    }

    // 1. Fetch Session to assure it exists and hasn't triggered yet.
    const { data: existingSession, error: sessionFetchError } = await db
      .from('gate_sessions')
      .select('id, email, fbp, fbc, map_completed_at, converted_user_id')
      .eq('id', gateSessionId)
      .single();

    if (sessionFetchError || !existingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (existingSession.map_completed_at) return NextResponse.json({ status: 'already_recorded' });

    // 2. SERVER-SIDE BRUTAL RULE VERIFICATION (`MapCompletedPersisted`)
    // The user MUST have a persisted document in `journey_maps`.
    const { data: userMap, error: mapFetchError } = await db
      .from('journey_maps')
      .select('nodes')
      .eq('user_id', userId)
      .single();

    if (mapFetchError || !userMap || !userMap.nodes) {
      return NextResponse.json({ 
        status: 'requirements_not_met',
        message: 'No persisted map found for this identity.'
      }, { status: 403 });
    }

    const nodes = Array.isArray(userMap.nodes) ? userMap.nodes : [];
    const placedNodesCount = nodes.length;
    // We assume a 'isConfirmed' or 'confirmed' boolean flag in the map node.
    // Replace logic if your schema differs.
    const confirmedNodesCount = nodes.filter(n => n.confirmed === true || n.isConfirmed === true || n.is_confirmed === true || n.type === 'confirmed').length;

    // Minimum requirement: 3 nodes added, at least 1 confirmed
    if (placedNodesCount < 3 || confirmedNodesCount < 1) {
      return NextResponse.json({ 
        status: 'requirements_not_met',
        message: 'Persisted map does not satisfy the Brutal Rule thresholds.'
      }, { status: 403 });
    }

    // 3. Atomically lock & record
    const timestamp = new Date().toISOString();
    const { error, data: updatedData } = await db
      .from('gate_sessions')
      .update({ 
        map_completed_at: timestamp, 
        updated_at: timestamp,
        converted_user_id: userId // bind identity forever
      })
      .eq('id', gateSessionId)
      .is('map_completed_at', null)
      .select('id')
      .single();

    if (error || !updatedData) {
       console.error('[Gate Completion API] DB Update failed or race condition lost.');
       return NextResponse.json({ error: 'Failed DB insertion' }, { status: 500 });
    }

    // 4. FIRE CAPI (ONLY AFTER EXACT DB COMMIT)
    const serverEventId = uuidv4();
    await sendToCapi('MapCompletedPersisted', serverEventId, { 
      em: existingSession.email, fbp: existingSession.fbp, fbc: existingSession.fbc, external_id: gateSessionId 
    });

    return NextResponse.json({ status: 'success', eventId: serverEventId });

  } catch (error: any) {
    console.error('[Gate Completion API] Internal failure', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
