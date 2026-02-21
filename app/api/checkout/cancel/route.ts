import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
    try {
        const { subscriptionId, immediately } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
        }

        if (immediately) {
            await stripe.subscriptions.cancel(subscriptionId);
        } else {
            // Cancel at the end of the period
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }

        return NextResponse.json({ success: true, message: 'Subscription cancellation scheduled' });
    } catch (err: any) {
        console.error('Error canceling subscription:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
