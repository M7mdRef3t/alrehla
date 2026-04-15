import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Mark map_started_at only if it's currently null to preserve the original timestamp
    const { error, data } = await db.from('gate_sessions')
      .update({ 
        map_started_at: timestamp,
        updated_at: timestamp
      })
      .eq('id', sessionId)
      .is('map_started_at', null)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[Gate Activation API] Error:', error);
      return NextResponse.json({ error: 'Failed DB update' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      recorded: !!data 
    });

  } catch (error: any) {
    console.error('[Gate Activation API] Internal failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
