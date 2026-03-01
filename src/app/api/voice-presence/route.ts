import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { generateVoiceScript, VoiceEvent } from '../../../services/voiceEngine';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
    try {
        const { event, context } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // LIMIT: Max 1 voice presence per day
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const { count } = await supabaseAdmin
            .from('voice_presence_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', dayStart.toISOString());

        if (count && count > 0) {
            return NextResponse.json({ skip: true, reason: 'daily_limit' });
        }

        const script = await generateVoiceScript(event as VoiceEvent, context);
        if (!script) return NextResponse.json({ error: 'Script generation failed' }, { status: 500 });

        // Log the presence
        await supabaseAdmin.from('voice_presence_logs').insert({
            user_id: user.id,
            event_type: event,
            script_text: script
        });

        return NextResponse.json({ script });

    } catch (err) {
        console.error("Voice API Error:", err);
        return NextResponse.json({ error: 'Voice presence failed' }, { status: 500 });
    }
}
