import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSessionFollowupEmail } from '@/services/emailService';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find sessions with summaries that need followup
    // Joining summaries with sessions and requests to get client email
    const { data: summaries, error } = await supabase
      .from('dawayir_session_summaries')
      .select(`
        *,
        session:dawayir_sessions (
          id,
          ended_at,
          request:dawayir_session_requests (
            id,
            client:dawayir_clients (
              name,
              email
            )
          )
        )
      `)
      .eq('followup_needed', true);

    if (error) throw error;

    const followupsSent = [];

    for (const summary of (summaries || [])) {
      const session = summary.session as any;
      const client = session?.request?.client as any;
      
      if (!client?.email) continue;

      // Check if we already sent a followup recently
      const { data: existingFollowup } = await supabase
        .from('dawayir_session_followups')
        .select('id')
        .eq('session_id', session.id)
        .eq('status', 'sent')
        .maybeSingle();

      if (existingFollowup) continue;

      // logic for "due" followup (48h)
      const endedAt = new Date(session.ended_at);
      const now = new Date();
      const diffHours = (now.getTime() - endedAt.getTime()) / (1000 * 60 * 60);

      // If more than 48 hours passed
      if (diffHours >= 48) {
        // Send Email
        const success = await sendSessionFollowupEmail(client.email, {
          clientName: client.name,
          summary: summary.session_summary_text,
          assignment: summary.assignment,
          followupDate: now.toLocaleDateString()
        });

        if (success) {
          // Record it
          await supabase.from('dawayir_session_followups').insert({
            session_id: session.id,
            status: 'sent',
            scheduled_for: now.toISOString()
          });
          followupsSent.push(client.email);
        }
      }
    }

    return NextResponse.json({ success: true, processed: followupsSent.length, recipients: followupsSent });

  } catch (error: any) {
    console.error('Followup Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
