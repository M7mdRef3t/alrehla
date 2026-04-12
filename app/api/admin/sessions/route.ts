import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const body = await request.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (body.action === 'update_status') {
      await supabase.from('dawayir_session_requests').update({ status: body.status }).eq('id', body.requestId);
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

      const { data: brief, error: briefErr } = await supabase.from('dawayir_ai_session_briefs').insert({
        request_id: body.requestId,
        ...parsed
      }).select().single();

      if (briefErr) throw briefErr;

      await supabase.from('dawayir_session_requests').update({ status: 'brief_generated' }).eq('id', body.requestId);
      
      return NextResponse.json({ success: true, brief });
    }

    if (body.action === 'close_session') {
      const finalStatus = body.recommendFollowup ? 'followup_pending' : 'session_done';
      // 1. Mark request as done or followup
      await supabase.from('dawayir_session_requests').update({ status: finalStatus }).eq('id', body.requestId);
      
      // 2. Insert session execution record
      const { data: session, error: sessErr } = await supabase.from('dawayir_sessions').insert({
        request_id: body.requestId,
        status: 'completed',
        coach_notes: body.notes
      }).select('id').single();

      if (sessErr) throw sessErr;

      if (session) {
        // 3. Insert enriched summary
        await supabase.from('dawayir_session_summaries').insert({
          session_id: session.id,
          session_summary_text: body.summary,
          main_topic: body.mainTopic,
          dominant_pattern: body.dominantPattern,
          main_intervention: body.mainIntervention,
          first_shift_noticed: body.firstShift,
          assignment: body.assignment,
          followup_needed: body.recommendFollowup,
          second_session_recommended: body.recommendFollowup
        });
      }
      return NextResponse.json({ success: true, message: 'Session closed and documented' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
