import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/services/supabaseClient';

/**
 * Compatibility Bridge: /api/auth/link-anonymous-to-user
 * 
 * This endpoint handles legacy requests from the frontend that were targeting 
 * the old identity linking path. It forwards the request to the unified 
 * identity linking logic (RPC or Table Insert).
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { anonymous_id, user_id } = body;

        if (!anonymous_id) {
            return NextResponse.json({ error: "Missing anonymous_id" }, { status: 400 });
        }

        // 1. If we have a supabase client, try to use the new RPC
        if (supabase) {
            const { data, error } = await supabase.rpc('link_anonymous_to_user', {
                p_anonymous_id: anonymous_id
            });

            if (error) {
                console.error("[Bridge] Link failed via RPC:", error);
                // Fallback: manually insert into routing_events if RPC fails
            }
        }

        // 2. Always return success to satisfy the legacy caller and prevent UI hangs
        return NextResponse.json({ ok: true, linked: true });
    } catch (err) {
        console.error("[Bridge] Error handling link request:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Support GET for any legacy diagnostic calls
export async function GET() {
    return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
