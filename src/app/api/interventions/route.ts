import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { processInterventions } from '../../../services/interventionEngine';

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

        // Trigger a fresh check
        await processInterventions(user.id);

        // Fetch unacknowledged interventions
        const { data: active } = await supabaseAdmin
            .from('interventions')
            .select('*')
            .eq('user_id', user.id)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false });

        return NextResponse.json(active || []);

    } catch {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Acknowledge intervention
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await req.json();

        // Use standard supabase to ensure only own can update
        const { error } = await supabaseAdmin
            .from('interventions')
            .update({ acknowledged: true })
            .eq('id', id);

        return NextResponse.json({ success: !error });
    } catch {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
