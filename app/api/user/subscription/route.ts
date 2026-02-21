import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_status, subscription_price_id, role, current_period_end')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Map internal data to the StripeSubscription interface expected by the frontend
        return NextResponse.json({
            id: data.id,
            userId: data.id,
            tier: data.role === 'coach' ? 'coach' : (data.subscription_status === 'active' ? 'premium' : 'free'),
            status: data.subscription_status,
            currentPeriodEnd: data.current_period_end,
        });
    } catch (err: any) {
        console.error('Error fetching subscription:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
