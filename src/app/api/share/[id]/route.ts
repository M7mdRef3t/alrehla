import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Fetch shared artifact with security checks baked into RLS (or here explicitly)
        const { data: artifact, error } = await supabaseAdmin
            .from('shared_artifacts')
            .select('*')
            .eq('id', id)
            .is('revoked_at', null)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !artifact) {
            return NextResponse.json({ error: 'Link expired or invalid' }, { status: 404 });
        }

        return NextResponse.json(artifact.payload);
    } catch (err) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
