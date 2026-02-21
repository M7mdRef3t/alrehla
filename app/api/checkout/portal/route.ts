import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return null;
    return new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia',
    });
}

export async function POST(req: Request) {
    try {
        const stripe = getStripeClient();
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
            return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dawayir`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating portal session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
