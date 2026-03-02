import { NextResponse } from 'next/server';
import { supabase } from '../../../../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const insightId = params.id;
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase!.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { pinned } = body;

        const { data, error } = await supabaseAdmin
            .from('map_insights')
            .update({ pinned: !!pinned })
            .eq('id', insightId)
            .eq('user_id', user.id) // Security check
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Pinning failed' }, { status: 500 });
    }
}
