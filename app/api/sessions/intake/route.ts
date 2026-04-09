import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Validate data (mock)
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Missing basic info' }, { status: 400 });
    }

    // 2. Insert into Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // a. Upsert Client (simplified by phone)
    let clientId;
    const { data: existingClient } = await supabase.from('dawayir_clients').select('id').eq('phone', data.phone).maybeSingle();
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientErr } = await supabase.from('dawayir_clients').insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        country: data.country,
        age_range: data.ageRange,
        preferred_contact: data.preferredContact
      }).select('id').single();
      if (clientErr) throw clientErr;
      clientId = newClient.id;
    }

    // b. Create Request
    const triageStatus = data.crisisFlag ? 'manual_review' : 'prep_pending';
    const { data: newRequest, error: reqErr } = await supabase.from('dawayir_session_requests').insert({
      client_id: clientId,
      status: triageStatus,
      request_reason: data.requestReason,
      urgency_reason: data.urgencyReason,
      biggest_challenge: data.biggestChallenge,
      previous_sessions: data.previousSessions,
      specific_person_or_situation: data.specificPersonOrSituation,
      impact_score: data.impactScore,
      duration_of_problem: data.durationOfProblem
    }).select('id').single();
    if (reqErr) throw reqErr;

    // c. Evaluate Triage (Basic saving)
    await supabase.from('dawayir_triage_answers').insert({
      request_id: newRequest.id,
      safety_crisis_flag: data.crisisFlag,
      session_goal_type: data.sessionGoalType,
      urgency_score: data.crisisFlag ? 10 : 5 // MVP scoring
    });

    // Invoke AI Extraction automatically if not in crisis
    if (!data.crisisFlag) {
      const apiUrl = new URL(request.url).origin + '/api/sessions/ai-brief';
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: newRequest.id,
          intake: data
        })
      }).catch(e => console.error('Failed to trigger AI', e));
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Intake received successfully',
        nextStatus: triageStatus
    });

  } catch (error: any) {
    console.error('Intake Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
