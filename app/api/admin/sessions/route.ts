import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const bearer = getBearerToken(request);
    if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const clientAuth = createClient(supabaseUrl, anonKey);
    const { data: userAuth, error: authErr } = await clientAuth.auth.getUser(bearer);
    if (authErr || !userAuth?.user?.id) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userAuth.user.id).single();
    if (!profile?.role || !['admin', 'owner', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch requests mixed with triage answers + client info + sessions
    const { data: requests, error: reqErr } = await supabase
      .from('dawayir_session_requests')
      .select(`
        id, 
        status, 
        created_at, 
        biggest_challenge,
        dawayir_clients ( name, age_range, user_id ),
        dawayir_triage_answers ( urgency_score, clarity_score, session_goal_type ),
        dawayir_ai_session_briefs ( visible_problem, emotional_signal, hidden_need, expected_goal, first_hypothesis, session_boundaries ),
        dawayir_sessions (
          id,
          status,
          coach_notes,
          dawayir_session_summaries ( * )
        )
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
    const bearer = getBearerToken(request);
    if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const clientAuth = createClient(supabaseUrl, anonKey);
    const { data: userAuth, error: authErr } = await clientAuth.auth.getUser(bearer);
    if (authErr || !userAuth?.user?.id) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userAuth.user.id).single();
    if (!profile?.role || !['admin', 'owner', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === 'update_status') {
      const { data: currentReq } = await supabase.from('dawayir_session_requests').select('status').eq('id', body.requestId).single();
      const currentStatus = currentReq?.status || 'new_request';
      
      const allowedTransitions: Record<string, string[]> = {
        'new_request': ['triage_processing', 'needs_manual_review', 'prep_pending', 'rejected', 'canceled_by_client'],
        'needs_manual_review': ['prep_pending', 'brief_generated', 'rejected', 'canceled_by_client'],
        'prep_pending': ['intake_completed', 'session_ready', 'brief_generated', 'canceled_by_client'],
        'intake_completed': ['session_ready', 'brief_generated', 'canceled_by_client'],
        'session_ready': ['brief_generated', 'session_done', 'postponed', 'canceled_by_client'],
        'brief_generated': ['session_done', 'followup_pending', 'rejected', 'prep_pending', 'postponed', 'canceled_by_client'],
        'followup_pending': ['session_done', 'postponed', 'canceled_by_client'],
        'postponed': ['session_ready', 'canceled_by_client'],
        'session_done': ['followup_pending']
      };

      const allowed = allowedTransitions[currentStatus];
      // Deny transitioning to an invalid status if we know the rules for the current one
      if (allowed && !allowed.includes(body.status)) {
        return NextResponse.json({ error: `Invalid status transition from ${currentStatus} to ${body.status}` }, { status: 400 });
      }

      await supabase.from('dawayir_session_requests').update({ 
        status: body.status,
        rejection_reason: body.reason || null 
      }).eq('id', body.requestId);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    if (body.action === 'generate_brief') {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY || '';
      if (!apiKey) return NextResponse.json({ error: 'LLM Key missing' }, { status: 500 });
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `أنت مساعد معالج نفسي خبير (Cognitive Coaching Engine). 
بناءً على التحدي الذي ذكره العميل: "${body.biggestChallenge}"
استخرج التالي بتنسيق JSON حصراً:
{
  "visible_problem": "المشكلة الظاهرة في سطر واحد",
  "emotional_signal": "الإشارة العاطفية المبطنة (مثال: خوف من الرفض)",
  "hidden_need": "الاحتياج العميق الحقيقي",
  "expected_goal": "الهدف المنطقي للجلسة",
  "first_hypothesis": "الفرضية التشخيصية الأولى",
  "session_boundaries": "حدود الأمان والمخاطر المحتملة"
}`;
      
      const result = await model.generateContent(prompt);
      const output = result.response.text();
      
      let parsed = null;
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch(e) {
        console.error("Failed to parse Gemini output:", output);
        parsed = {
          visible_problem: "فشل التحليل",
          emotional_signal: "غير معروف",
          hidden_need: "تحتاج لاستكشاف يدوي",
          expected_goal: "تحديد الهدف أثناء الجلسة",
          first_hypothesis: "الاعتماد على الملاحظة المباشرة",
          session_boundaries: "تحذير: لا توجد بيانات كافية"
        };
      }

      const { data: brief, error: briefErr } = await supabase.from('dawayir_ai_session_briefs').upsert({
        request_id: body.requestId,
        ...parsed
      }, { onConflict: 'request_id' }).select().single();

      if (briefErr) throw briefErr;

      await supabase.from('dawayir_session_requests').update({ status: 'brief_generated' }).eq('id', body.requestId);
      
      return NextResponse.json({ success: true, brief });
    }

    if (body.action === 'close_session') {
      const finalStatus = body.recommendFollowup ? 'followup_pending' : 'session_done';
      // 1. Mark request as done or followup
      await supabase.from('dawayir_session_requests').update({ status: finalStatus }).eq('id', body.requestId);
      
      // 2. Upsert session execution record to prevent duplicates
      let { data: session, error: sessErr } = await supabase.from('dawayir_sessions')
        .select('id').eq('request_id', body.requestId).single();
        
      if (!session) {
        const res = await supabase.from('dawayir_sessions').insert({
          request_id: body.requestId,
          status: 'completed',
          coach_notes: body.notes
        }).select('id').single();
        session = res.data;
        if (res.error) throw res.error;
      } else {
        const res = await supabase.from('dawayir_sessions').update({
          status: 'completed',
          coach_notes: body.notes
        }).eq('id', session.id).select('id').single();
        session = res.data;
        if (res.error) throw res.error;
      }

      if (session) {
        // 3. Upsert enriched summary (checking first to handle if session_id is not inherently unique)
        const { data: existingSummary } = await supabase.from('dawayir_session_summaries')
          .select('id').eq('session_id', session.id).single();
          
        const summaryData = {
          session_id: session.id,
          session_summary_text: body.summary,
          main_topic: body.mainTopic,
          dominant_pattern: body.dominantPattern,
          main_intervention: body.mainIntervention,
          first_shift_noticed: body.firstShift,
          assignment: body.assignment,
          followup_needed: body.recommendFollowup,
          second_session_recommended: body.recommendFollowup
        };

        if (existingSummary) {
          await supabase.from('dawayir_session_summaries').update(summaryData).eq('id', existingSummary.id);
        } else {
          await supabase.from('dawayir_session_summaries').insert(summaryData);
        }
      }
      return NextResponse.json({ success: true, message: 'Session closed and documented' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
