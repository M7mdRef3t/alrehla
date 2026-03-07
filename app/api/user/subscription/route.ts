import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: 'Subscription source unavailable', source: 'not_configured', is_live: false },
            { status: 503, headers: { "Cache-Control": "no-store" } }
        );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_status, subscription_price_id, role, current_period_end')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: { "Cache-Control": "no-store" } });

        // Map internal data to the StripeSubscription interface expected by the frontend
        return NextResponse.json({
            id: data.id,
            userId: data.id,
            tier: data.role === 'coach' ? 'coach' : (data.subscription_status === 'active' ? 'premium' : 'free'),
            status: data.subscription_status,
            currentPeriodEnd: data.current_period_end,
            source: 'supabase',
            is_live: true
        }, { status: 200, headers: { "Cache-Control": "no-store" } });
    } catch (err: unknown) {
        console.error('Error fetching subscription:', err);
        return NextResponse.json(
            { error: 'Failed to fetch subscription', source: 'query_failed', is_live: false },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
