import { NextResponse } from 'next/server';
import { extractAiSessionBrief, SessionBriefInput } from '@/services/aiSessionBrief';

// This API Route will be used to explicitly trigger the AI extraction for a given session intake/prep context.
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Basic validation
    if (!payload?.intake?.requestReason || !payload?.intake?.urgencyReason) {
      return NextResponse.json({ error: 'Missing core intake data for AI Brief generation.' }, { status: 400 });
    }

    const inputData: SessionBriefInput = {
      intake: {
        requestReason: payload.intake.requestReason,
        urgencyReason: payload.intake.urgencyReason,
        biggestChallenge: payload.intake.biggestChallenge || '',
        durationOfProblem: payload.intake.durationOfProblem || '',
        sessionGoalType: payload.intake.sessionGoalType || ''
      },
      prep: payload.prep // optional
    };

    // 2. Call the AI Service
    const aiBrief = await extractAiSessionBrief(inputData);

    // 3. Persist to dawayir_ai_session_briefs table
    if (payload.requestId) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      await supabase.from('dawayir_ai_session_briefs').upsert({ 
        request_id: payload.requestId, 
        ...aiBrief 
      });
      
      // Update request status
      await supabase.from('dawayir_session_requests')
        .update({ status: 'brief_generated' })
        .eq('id', payload.requestId);
    }
    
    // Return it to the client/Admin Console
    return NextResponse.json({
      success: true,
      data: aiBrief
    });

  } catch (error: any) {
    console.error('AI Brief Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
