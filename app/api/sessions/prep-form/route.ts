import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, prep } = body;

    if (!requestId || !prep) {
      return NextResponse.json({ error: 'Missing requestId or prep data' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Save Prep Form
    const { error: prepErr } = await supabase.from('dawayir_prep_forms').upsert({
      request_id: requestId,
      story: prep.story,
      attempts_before: prep.attempts_before,
      current_impact: prep.current_impact,
      desired_outcome: prep.desired_outcome,
      dominant_emotions: prep.dominant_emotions
    });

    if (prepErr) throw prepErr;

    // 2. Update Request Status
    await supabase.from('dawayir_session_requests')
      .update({ status: 'prep_form_completed' })
      .eq('id', requestId);

    // 3. Re-trigger AI Extraction with FULL context
    // First fetch the intake data
    const { data: requestRow } = await supabase
        .from('dawayir_session_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (requestRow) {
        const apiUrl = new URL(request.url).origin + '/api/sessions/ai-brief';
        // We call our own API to update the Brief
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId,
                intake: {
                    requestReason: requestRow.request_reason,
                    urgencyReason: requestRow.urgency_reason,
                    biggestChallenge: requestRow.biggest_challenge,
                    durationOfProblem: requestRow.duration_of_problem
                },
                prep: prep // New deep dive context
            })
        }).catch(e => console.error('AI Refresh failed', e));
    }

    return NextResponse.json({ success: true, message: 'Prep form saved and AI brief refreshed' });

  } catch (error: any) {
    console.error('Prep Form API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
