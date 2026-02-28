import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';
import { getStripeClient } from '../../_lib/stripeConfig';

export async function POST(req: Request) {
    try {
        const { client: stripe, config: stripeConfig } = getStripeClient();
        if (!stripe) {
            return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
        }

        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
        }

        const { userId, returnUrl } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Fetch customer ID from profiles
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (error || !profile?.stripe_customer_id) {
            return NextResponse.json({ error: 'Stripe customer not found for this user' }, { status: 404 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl || `${stripeConfig.siteUrl}/dawayir`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: unknown) {
        console.error('Error creating portal session:', err);
        const message = err instanceof Error ? err.message : 'create_portal_session_failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
