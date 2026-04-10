import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch requests mixed with triage answers + client info
    const { data: requests, error: reqErr } = await supabase
      .from('dawayir_session_requests')
      .select(`
        id, 
        status, 
        created_at, 
        biggest_challenge,
        dawayir_clients ( name, age_range ),
        dawayir_triage_answers ( urgency_score, clarity_score, session_goal_type ),
        dawayir_ai_session_briefs ( visible_problem, emotional_signal, hidden_need, expected_goal, first_hypothesis, session_boundaries )
      `)
      .order('created_at', { ascending: false });

    if (reqErr) throw reqErr;

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('Fetch Sessions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (body.action === 'close_session') {
      // 1. Mark request as done
      await supabase.from('dawayir_session_requests').update({ status: 'session_done' }).eq('id', body.requestId);
      
      // 2. Insert summary
      // We need a session first
      const { data: session } = await supabase.from('dawayir_sessions').insert({
        request_id: body.requestId,
        status: 'completed',
        coach_notes: body.notes
      }).select('id').single();

      if (session) {
        await supabase.from('dawayir_session_summaries').insert({
          session_id: session.id,
          session_summary_text: body.summary,
          assignment: body.assignment,
          second_session_recommended: body.recommendFollowup
        });
      }
      return NextResponse.json({ success: true, message: 'Session closed' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
