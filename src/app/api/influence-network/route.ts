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

        const { searchParams } = new URL(req.url);
        const compare = searchParams.get('compare') === 'true';

        // Fetch latest influence map snapshot
        const { data: maps } = await supabaseAdmin
            .from('influence_maps')
            .select('*')
            .eq('user_id', user.id)
            .order('snapshot_date', { ascending: false })
            .limit(2);

        if (!maps || maps.length === 0) return NextResponse.json({ nodes: [], edges: [] });

        if (compare && maps.length >= 1) {
            const { calculateDrift } = await import('../../../services/driftEngine');
            const driftMap = calculateDrift(maps[0], maps[1] || null);
            return NextResponse.json(driftMap);
        }

        return NextResponse.json(maps[0]);
    } catch {
        return NextResponse.json({ error: 'Influence map fetch failed' }, { status: 500 });
    }
}
