import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch Timeline Components
        // 1. All Weekly Reports
        const { data: reports } = await supabaseAdmin
            .from('weekly_reports')
            .select('id, start_date as date, report_result, summary_data')
            .eq('user_id', user.id)
            .order('start_date', { ascending: false });

        // 2. All Map Insights
        const { data: insights } = await supabaseAdmin
            .from('map_insights')
            .select('id, created_at as date, result, mode')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // 3. Highlighted Pulse Logs
        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('id, day as date, mood, energy, stress_tag, note')
            .eq('user_id', user.id)
            .or('mood.lt.3,mood.gt.4,note.neq.""')
            .order('day', { ascending: false })
            .limit(30);

        // 4. Micro Actions (New active layer)
        const { data: actions } = await supabaseAdmin
            .from('micro_actions')
            .select('id, executed_at as date, action_type, metadata, impact_score')
            .eq('user_id', user.id)
            .order('executed_at', { ascending: false })
            .limit(20);

        // 5. Evolution Milestones
        const { data: milestones } = await supabaseAdmin
            .from('evolution_milestones')
            .select('id, unlocked_at as date, milestone_type, milestone_label, metadata')
            .eq('user_id', user.id)
            .order('unlocked_at', { ascending: false })
            .limit(10);

        // Merge and Tag
        const getTimestamp = (item: Record<string, unknown>): number => {
            const rawDate = typeof item.date === 'string' ? item.date : '';
            return new Date(rawDate).getTime();
        };

        const timeline = [
            ...(reports || []).map(r => ({ ...(r as object), type: 'report', priority: 4 })),
            ...(insights || []).map(i => ({ ...(i as object), type: 'insight', priority: 3 })),
            ...(actions || []).map(a => ({ ...(a as object), type: 'action', priority: 2 })),
            ...(pulses || []).map(p => ({ ...(p as object), type: 'pulse', priority: 1 })),
            ...(milestones || []).map(m => ({ ...(m as object), type: 'milestone', priority: 5 })),
        ].sort((a, b) => getTimestamp(b as Record<string, unknown>) - getTimestamp(a as Record<string, unknown>));

        return NextResponse.json(timeline);

    } catch {
        return NextResponse.json({ error: 'Thread fetch failed' }, { status: 500 });
    }
}
