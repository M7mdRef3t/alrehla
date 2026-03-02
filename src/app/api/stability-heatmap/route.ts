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

        // Fetch latest stability snapshot
        const { data: snapshot } = await supabaseAdmin
            .from('stability_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .order('computed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return NextResponse.json(snapshot || { node_stability: [], edge_stability: [] });
    } catch (err) {
        return NextResponse.json({ error: 'Stability fetch failed' }, { status: 500 });
    }
}
