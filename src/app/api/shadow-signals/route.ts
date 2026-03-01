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

        // Fetch latest unacknowledged shadow signal
        const { data: signal } = await supabaseAdmin
            .from('shadow_signals')
            .select('*')
            .eq('user_id', user.id)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (signal) {
            await supabaseAdmin.from('shadow_signals').update({ surfaced: true }).eq('id', signal.id);
        }

        return NextResponse.json(signal);
    } catch (err) {
        return NextResponse.json({ error: 'Shadow fetch failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id, action } = await req.json();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await supabaseAdmin
            .from('shadow_signals')
            .update({ acknowledged: true })
            .eq('id', id);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Shadow update failed' }, { status: 500 });
    }
}
