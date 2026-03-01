import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { interventionId, actionType, metadata } = await req.json();

        // 1. Get Baseline (Latest Pulse)
        const { data: latestPulse } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('mood, energy')
            .eq('user_id', user.id)
            .order('day', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 2. Log the micro action with baseline
        const { data, error } = await supabaseAdmin
            .from('micro_actions')
            .insert({
                user_id: user.id,
                intervention_id: interventionId,
                action_type: actionType,
                baseline_mood: latestPulse?.mood || null,
                baseline_energy: latestPulse?.energy || null,
                metadata: metadata || {}
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Automatically acknowledge the intervention
        await supabaseAdmin
            .from('interventions')
            .update({ acknowledged: true })
            .eq('id', interventionId);

        return NextResponse.json({ success: true, action: data });

    } catch (err: any) {
        console.error('Micro Action Error:', err);
        return NextResponse.json({ error: 'Failed to record action' }, { status: 500 });
    }
}
